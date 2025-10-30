<<<<<<< HEAD
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import torch
import json
import re
from typing import Optional
from openai import OpenAI
=======
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
>>>>>>> origin/dev
from app.config import settings
from app.models.schemas import CareGuide

# 전역 변수로 모델 캐싱
_text_model = None
_tokenizer = None
<<<<<<< HEAD
_openai_client = None
_pllama_pipeline = None
=======
>>>>>>> origin/dev


def load_text_generator():
    """텍스트 생성 모델을 로드합니다 (처음 한 번만 로드)"""
    global _text_model, _tokenizer
    
    if _text_model is None:
        print(f"텍스트 생성 모델 로딩 중: {settings.text_generation_model}")
        try:
            _tokenizer = AutoTokenizer.from_pretrained(
                settings.text_generation_model,
                cache_dir=settings.cache_dir,
                token=settings.huggingface_token
            )
            _text_model = AutoModelForCausalLM.from_pretrained(
                settings.text_generation_model,
                cache_dir=settings.cache_dir,
                token=settings.huggingface_token
            )
            # GPU가 있으면 사용
            if torch.cuda.is_available():
                _text_model = _text_model.cuda()
            _text_model.eval()
            print("텍스트 모델 로딩 완료!")
        except Exception as e:
            print(f"텍스트 모델 로딩 실패: {e}")
            # 모델 로딩 실패 시 None으로 유지
            pass
    
    return _tokenizer, _text_model


<<<<<<< HEAD
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


def load_pllama_pipeline():
    """PLLaMa 파이프라인을 로드합니다."""
    global _pllama_pipeline
    
    if _pllama_pipeline is None:
        try:
            print(f"PLLaMa 모델 로딩 중: {settings.pllama_model}")
            # PLLaMa는 텍스트 생성 파이프라인으로 사용
            # 실제 모델명은 나중에 변경 가능
            tokenizer = AutoTokenizer.from_pretrained(
                settings.pllama_model,
                cache_dir=settings.cache_dir,
                token=settings.huggingface_token,
                trust_remote_code=True
            )
            model = AutoModelForCausalLM.from_pretrained(
                settings.pllama_model,
                cache_dir=settings.cache_dir,
                token=settings.huggingface_token,
                trust_remote_code=True,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                device_map="auto" if torch.cuda.is_available() else None
            )
            if torch.cuda.is_available():
                model = model.cuda()
            model.eval()
            
            _pllama_pipeline = pipeline(
                "text-generation",
                model=model,
                tokenizer=tokenizer,
                device=0 if torch.cuda.is_available() else -1
            )
            print("PLLaMa 모델 로딩 완료!")
        except Exception as e:
            print(f"PLLaMa 모델 로딩 실패: {e}")
            print("기본 관리 가이드를 사용합니다.")
            _pllama_pipeline = None
    
    return _pllama_pipeline


def generate_care_guide_with_pllama(plant_name: str) -> Optional[str]:
    """
    PLLaMa를 사용하여 식물 관리 가이드를 생성합니다.
    
    Args:
        plant_name: 식물 종명
        
    Returns:
        str: 생성된 관리 가이드 (영어)
    """
    try:
        pipeline = load_pllama_pipeline()
        if pipeline is None:
            return None
        
        prompt = f"""Plant name: {plant_name}
Please provide a comprehensive care guide for this plant in English. Include:
- Watering requirements
- Sunlight needs
- Temperature range
- Humidity requirements
- Soil type
- Care tips

Care guide:"""
        
        result = pipeline(
            prompt,
            max_length=500,
            num_return_sequences=1,
            temperature=0.7,
            do_sample=True
        )
        
        generated_text = result[0]['generated_text']
        # 프롬프트 제거
        care_guide_text = generated_text.replace(prompt, "").strip()
        
        return care_guide_text
    
    except Exception as e:
        print(f"PLLaMa 가이드 생성 오류: {e}")
        return None


def generate_care_guide_with_gpt(plant_name: str) -> Optional[dict]:
    """
    GPT-4.0 Mini를 사용하여 직접 식물 관리 가이드를 생성합니다.
    
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


def convert_to_korean_standard(pllama_response: str, plant_name: str) -> Optional[dict]:
    """
    GPT-4.0 Mini를 사용하여 PLLaMa 응답을 한국 기준에 맞게 변환합니다.
    
    Args:
        pllama_response: PLLaMa로부터 생성된 관리 가이드
        plant_name: 식물 종명
        
    Returns:
        dict: 한국 기준 관리 가이드 (JSON 형식)
    """
    try:
        client = load_openai_client()
        if client is None:
            return None
        
        prompt = f"""다음은 PLLaMa로부터 생성된 식물 관리 가이드입니다.
이 정보를 한국의 기후와 환경에 맞게 변환해주세요:

- 한국의 계절별 기후 고려 (여름 고온다습, 겨울 건조)
- 실내 화분 재배 기준
- 한국에서 구하기 쉬운 토양/비료 기준
- 온도/습도 단위를 한국 기준으로
- 한국어로 자연스럽게 작성

식물명: {plant_name}

제공된 정보:
{pllama_response}

반드시 다음 JSON 형식으로만 반환하세요 (다른 텍스트 없이):
{{
  "watering": "물주기 정보",
  "sunlight": "햇빛 정보",
  "temperature": "온도 정보",
  "humidity": "습도 정보",
  "soil": "토양 정보",
  "tips": ["팁1", "팁2", "팁3"]
}}"""
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a plant care expert specializing in Korean indoor plant cultivation. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        content = response.choices[0].message.content.strip()
        
        # JSON 추출 (code block 제거)
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            json_str = json_match.group(0)
        else:
            json_str = content
        
        care_data = json.loads(json_str)
        return care_data
    
    except Exception as e:
        print(f"GPT 변환 오류: {e}")
        return None


def generate_care_guide(plant_name: str) -> CareGuide:
    """
    GPT-4.0 Mini를 사용하여 식물 관리 가이드를 생성합니다.
=======
def generate_care_guide(plant_name: str) -> CareGuide:
    """
    Transformers 라이브러리를 직접 사용하여 식물 관리 가이드를 생성합니다.
>>>>>>> origin/dev
    
    Args:
        plant_name: 식물 종명
        
    Returns:
        CareGuide: 식물 관리 가이드
    """
<<<<<<< HEAD
    print(f"[가이드 생성 시작] 식물명: {plant_name}")
    
    # GPT-4.0 Mini로 직접 생성
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
=======
    # 실제 AI 생성 대신 규칙 기반으로 관리 가이드 제공
    # (텍스트 생성 모델은 리소스가 많이 필요하고 한국어 지원이 제한적임)
>>>>>>> origin/dev
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

