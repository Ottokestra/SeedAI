from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import torch
import json
import re
from typing import Optional
from openai import OpenAI
from app.config import settings
from app.models.schemas import CareGuide

# 전역 변수로 모델 캐싱
_text_model = None
_tokenizer = None
_openai_client = None


def load_text_generator():
    """
    텍스트 생성 모델 로더 (비활성화됨)
    Qwen 모델을 사용하므로 koGPT2는 로드하지 않습니다.
    textgen_adapter.py의 render_plant_analysis를 사용하세요.
    """
    # koGPT2 모델 로딩 비활성화 - Qwen 모델 사용
    print(f"[guide] 텍스트 생성 모델 로딩 비활성화됨 (Qwen 모델 사용)")
    return None, None



def load_openai_client():
    """OpenAI 클라이언트를 로드합니다."""
    global _openai_client

    if _openai_client is None:
        if settings.openai_api_key:
            try:
                # httpx 클라이언트를 직접 생성하여 proxies 문제 해결
                import httpx
                import os

                # 환경 변수에서 proxies 완전히 제거
                proxy_env_vars = ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'ALL_PROXY', 'all_proxy']
                saved_proxies = {}
                for var in proxy_env_vars:
                    if var in os.environ:
                        saved_proxies[var] = os.environ.pop(var)

                try:
                    # httpx 클라이언트를 proxies 관련 설정 없이 생성
                    http_client = httpx.Client(timeout=60.0)

                    _openai_client = OpenAI(
                        api_key=settings.openai_api_key,
                        http_client=http_client
                    )
                    print("[OpenAI 클라이언트 로딩 완료]")
                finally:
                    # 환경 변수 복원
                    for var, value in saved_proxies.items():
                        os.environ[var] = value

                return _openai_client
            except Exception as e:
                print(f"[OpenAI 클라이언트 로딩 실패] {e}")
                import traceback
                traceback.print_exc()
                _openai_client = None
        else:
            print("[경고] OpenAI API 키가 설정되지 않았습니다. .env 파일에 OPENAI_API_KEY를 설정해주세요.")

    return _openai_client


def generate_care_guide_with_gpt(plant_name: str) -> Optional[dict]:
    """
    GPT-4o-mini를 사용하여 직접 식물 관리 가이드를 생성합니다.

    Args:
        plant_name: 식물 종명

    Returns:
        dict: 한국 기준 관리 가이드 (JSON 형식)
    """
    try:
        client = load_openai_client()
        if client is None:
            print(f"[GPT 직접 생성 실패] OpenAI 클라이언트가 없습니다.")
            return None

        print(f"[GPT API 호출 시작] 식물명: {plant_name}")

        prompt = f"""식물명: {plant_name}

'{plant_name}'의 고유한 특성과 원산지를 고려한 실내 화분 재배 관리 가이드를 제공해주세요.

이 식물만의 특별한 관리 요구사항과 특징을 중심으로 작성해주세요:

- 물주기: 이 식물의 특성에 맞는 구체적인 물주기 (다육식물인지, 습한 환경을 좋아하는지 등)
- 햇빛: 원산지 환경을 고려한 광량 요구사항 (열대, 사막, 숲속 등)
- 온도: 이 식물이 견딜 수 있는 온도 범위 (원산지 기후 반영)
- 습도: 이 식물이 선호하는 습도 수준
- 토양: 이 식물에 최적화된 토양 배합 (배수성, 보수성 등)
- 케어 팁: 이 식물을 키울 때만 해당되는 특별한 주의사항 (병충해, 번식 방법, 독성 여부 등)

한국의 실내 환경(여름 고온다습, 겨울 건조)에서 이 식물을 키우는 방법을 구체적으로 설명해주세요.
일반적인 조언보다는 '{plant_name}'만의 독특한 관리 포인트를 강조해주세요.

반드시 다음 JSON 형식으로만 반환하세요:
{{
  "watering": "물주기 정보",
  "sunlight": "햇빛 정보",
  "temperature": "온도 정보",
  "humidity": "습도 정보",
  "soil": "토양 정보",
  "tips": ["팁1", "팁2", "팁3", "팁4", "팁5"]
}}"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a plant care expert specializing in Korean indoor plant cultivation. You have extensive knowledge about various plants from around the world. Always respond with valid JSON only, no additional text."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )

        content = response.choices[0].message.content.strip()
        print(f"[GPT API 응답] {plant_name}: {content[:200]}...")

        # JSON 추출 (code block 제거)
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            json_str = json_match.group(0)
        else:
            json_str = content

        care_data = json.loads(json_str)
        print(f"[GPT 파싱 성공] {plant_name}")
        return care_data

    except Exception as e:
        print(f"[GPT 직접 생성 오류] {plant_name}: {e}")
        import traceback
        traceback.print_exc()
        return None


def generate_care_guide(plant_name: str) -> CareGuide:
    """
    GPT-4o-mini를 사용하여 식물 관리 가이드를 생성합니다.

    Args:
        plant_name: 식물 종명
        
    Returns:
        CareGuide: 식물 관리 가이드
    """
    print(f"[가이드 생성 시작] 식물명: {plant_name}")

    # GPT-4o-mini로 직접 생성
    korean_guide = generate_care_guide_with_gpt(plant_name)

    if korean_guide:
        print(f"[GPT 직접 생성 성공] {plant_name}: {korean_guide}")
        try:
            care_guide = CareGuide(
                watering=korean_guide.get("watering", ""),
                sunlight=korean_guide.get("sunlight", ""),
                temperature=korean_guide.get("temperature", ""),
                humidity=korean_guide.get("humidity", ""),
                fertilizer=korean_guide.get("fertilizer", ""),
                soil=korean_guide.get("soil", ""),
                tips=korean_guide.get("tips", [])
            )
            print(f"[AI 가이드 생성 성공 (GPT 직접)] {plant_name}")
            return care_guide
        except Exception as e:
            print(f"[GPT 직접 생성 CareGuide 변환 오류] {e}")
            import traceback
            traceback.print_exc()

    # 최종 fallback: 기본 가이드 반환
    print(f"[경고] AI 생성 실패, 기본 가이드 사용: {plant_name}")
    return get_default_care_guide(plant_name)


def parse_care_guide(text: str, plant_name: str) -> CareGuide:
    """생성된 텍스트를 CareGuide 객체로 파싱합니다."""
    
    # 기본값 설정
    care_data = {
        "watering": "주 1-2회, 토양이 건조할 때 충분히 물을 주세요.",
        "sunlight": "밝은 간접광을 선호합니다.",
        "temperature": "18-24°C의 실내 온도가 적합합니다.",
        "humidity": "중간 정도의 습도 (40-60%)를 유지하세요.",
        "fertilizer": "성장기(봄-여름)에 월 1회 액체 비료를 주세요.",
        "soil": "배수가 잘 되는 일반 화분용 흙을 사용하세요.",
        "tips": [
            "과습에 주의하세요",
            "정기적으로 먼지를 제거해주세요",
            "통풍이 잘 되는 곳에 두세요"
        ]
    }
    
    # 간단한 키워드 기반 파싱 (실제로는 더 정교한 파싱 필요)
    lines = text.split('\n')
    current_section = None
    tips = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        lower_line = line.lower()
        
        if '물주기' in line or 'watering' in lower_line:
            current_section = 'watering'
        elif '햇빛' in line or 'sunlight' in lower_line or '광' in line:
            current_section = 'sunlight'
        elif '온도' in line or 'temperature' in lower_line:
            current_section = 'temperature'
        elif '습도' in line or 'humidity' in lower_line:
            current_section = 'humidity'
        elif '비료' in line or 'fertilizer' in lower_line:
            current_section = 'fertilizer'
        elif '토양' in line or 'soil' in lower_line or '흙' in line:
            current_section = 'soil'
        elif '팁' in line or 'tip' in lower_line:
            current_section = 'tips'
        elif current_section and ':' in line:
            content = line.split(':', 1)[1].strip()
            if current_section == 'tips':
                tips.append(content)
            elif current_section in care_data:
                care_data[current_section] = content
    
    if tips:
        care_data['tips'] = tips
    
    return CareGuide(**care_data)


def get_default_care_guide(plant_name: str) -> CareGuide:
    """기본 관리 가이드를 반환합니다."""
    return CareGuide(
        watering=f"{plant_name}은(는) 주 1-2회 물을 주는 것이 좋습니다. 토양 표면이 건조할 때 충분히 물을 주세요.",
        sunlight=f"{plant_name}은(는) 밝은 간접광을 선호합니다. 직사광선은 피하는 것이 좋습니다.",
        temperature="18-24°C의 실내 온도가 적합합니다. 급격한 온도 변화는 피하세요.",
        humidity="중간 정도의 습도(40-60%)를 유지하세요. 건조한 환경에서는 분무기로 잎에 물을 뿌려주세요.",
        fertilizer="성장기(봄-여름)에는 월 1-2회, 휴면기(가을-겨울)에는 월 1회 액체 비료를 주세요.",
        soil="배수가 잘 되는 일반 화분용 흙을 사용하세요. 펄라이트나 모래를 섞으면 더 좋습니다.",
        tips=[
            "과습에 주의하고, 물빠짐이 잘 되는 화분을 사용하세요",
            "정기적으로 잎의 먼지를 제거하여 광합성을 돕습니다",
            "통풍이 잘 되는 곳에 두어 병해충을 예방하세요"
        ]
    )
