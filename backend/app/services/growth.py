import base64
from typing import List
from io import BytesIO
import torch
from diffusers import AutoPipelineForText2Image
from app.config import settings
from app.models.schemas import GrowthPrediction, GrowthStage

# 전역 변수로 모델 캐싱
_image_pipeline = None


def load_image_generator():
    """이미지 생성 파이프라인을 로드합니다 (처음 한 번만 로드)"""
    global _image_pipeline
    
    if _image_pipeline is None:
        print(f"이미지 생성 모델 로딩 중: {settings.image_generation_model}")
        try:
            _image_pipeline = AutoPipelineForText2Image.from_pretrained(
                settings.image_generation_model,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                cache_dir=settings.cache_dir,
                token=settings.huggingface_token
            )
            # GPU가 있으면 사용
            if torch.cuda.is_available():
                _image_pipeline = _image_pipeline.to("cuda")
            print("이미지 생성 모델 로딩 완료!")
        except Exception as e:
            print(f"이미지 생성 모델 로딩 실패: {e}")
            # 모델 로딩 실패 시 None으로 유지
            pass
    
    return _image_pipeline


def generate_growth_prediction(plant_name: str) -> GrowthPrediction:
    """
    식물 성장 예측 정보를 생성합니다.
    
    Args:
        plant_name: 식물 종명
        
    Returns:
        GrowthPrediction: 성장 예측 정보
    """
    # 이미지 생성은 리소스가 많이 필요하므로 기본 예측 반환
    # 실제 이미지 생성이 필요한 경우 아래 코드 활성화
    return get_default_growth_prediction(plant_name)


def generate_plant_image(prompt: str) -> str:
    """
    Stable Diffusion을 사용하여 이미지를 생성합니다.
    
    Args:
        prompt: 이미지 생성 프롬프트
        
    Returns:
        str: base64 인코딩된 이미지 또는 None
    """
    try:
        pipeline = load_image_generator()
        
        if pipeline is None:
            return None
        
        # 이미지 생성
        image = pipeline(
            prompt=prompt,
            num_inference_steps=4,
            guidance_scale=0.0
        ).images[0]
        
        # 이미지를 base64로 인코딩
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        img_bytes = buffered.getvalue()
        base64_image = base64.b64encode(img_bytes).decode('utf-8')
        
        return f"data:image/png;base64,{base64_image}"
            
    except Exception as e:
        print(f"이미지 생성 오류: {e}")
        return None


def get_stage_description(timeframe: str, plant_name: str) -> str:
    """각 성장 단계에 대한 설명을 반환합니다."""
    descriptions = {
        "현재": f"{plant_name}의 초기 단계입니다. 새로운 환경에 적응하는 시기로, 안정적인 환경 제공이 중요합니다.",
        "1개월 후": f"새로운 잎이 나오기 시작합니다. 뿌리가 자리를 잡고 활발한 성장이 시작되는 시기입니다.",
        "3개월 후": f"풍성한 잎과 건강한 줄기를 가진 성숙한 모습입니다. 정기적인 관리로 최상의 상태를 유지하세요.",
        "6개월 후": f"완전히 성장한 {plant_name}의 모습입니다. 무성한 잎과 건강한 외관을 자랑합니다."
    }
    return descriptions.get(timeframe, "식물이 건강하게 성장하고 있습니다.")


def get_default_growth_prediction(plant_name: str) -> GrowthPrediction:
    """기본 성장 예측을 반환합니다."""
    stages = [
        GrowthStage(
            stage="current",
            timeframe="현재",
            image_url=None,
            description=f"{plant_name}의 초기 단계입니다. 새로운 환경에 적응하는 시기입니다."
        ),
        GrowthStage(
            stage="1_month",
            timeframe="1개월 후",
            image_url=None,
            description="새로운 잎이 나오기 시작하며 뿌리가 자리를 잡습니다."
        ),
        GrowthStage(
            stage="3_months",
            timeframe="3개월 후",
            image_url=None,
            description="풍성한 잎과 건강한 줄기를 가진 성숙한 모습입니다."
        ),
        GrowthStage(
            stage="6_months",
            timeframe="6개월 후",
            image_url=None,
            description=f"완전히 성장한 {plant_name}의 모습입니다."
        )
    ]
    
    return GrowthPrediction(stages=stages)

