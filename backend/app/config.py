from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    """애플리케이션 설정"""
    
    # API 설정
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    # CORS 설정 (개발 환경: 로컬 네트워크 IP 허용)
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    
    # 개발 모드: 로컬 네트워크 IP 패턴 허용 (192.168.x.x, 10.x.x.x 등)
    cors_allow_all_local: bool = True  # 개발용, 프로덕션에서는 False로 설정
    
    # Hugging Face 모델 설정
    plant_classifier_model: str = "umutbozdag/plant-identity"  # 식물 전문 모델 (20종)
    text_generation_model: str = "gpt2"  # 경량 공개 모델
    image_generation_model: str = "stabilityai/sd-turbo"
    
    # 선택적 Hugging Face 토큰 (rate limit 완화용)
    huggingface_token: Optional[str] = None
    
    # 캐시 디렉토리
    cache_dir: str = "./model_cache"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

