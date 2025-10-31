from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
from app.config import settings
from app.models.schemas import CareGuide

# 전역 변수로 모델 캐싱
_text_model = None
_tokenizer = None


def load_text_generator():
    """
    텍스트 생성 모델 로더 (비활성화됨)
    Qwen 모델을 사용하므로 koGPT2는 로드하지 않습니다.
    textgen_adapter.py의 render_plant_analysis를 사용하세요.
    """
    # koGPT2 모델 로딩 비활성화 - Qwen 모델 사용
    print(f"[guide] 텍스트 생성 모델 로딩 비활성화됨 (Qwen 모델 사용)")
    return None, None



def generate_care_guide(plant_name: str) -> CareGuide:
    """
    Transformers 라이브러리를 직접 사용하여 식물 관리 가이드를 생성합니다.
    
    Args:
        plant_name: 식물 종명
        
    Returns:
        CareGuide: 식물 관리 가이드
    """
    # 실제 AI 생성 대신 규칙 기반으로 관리 가이드 제공
    # (텍스트 생성 모델은 리소스가 많이 필요하고 한국어 지원이 제한적임)
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

