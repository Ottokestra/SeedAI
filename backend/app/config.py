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
    

    # OpenAI API 설정
    openai_api_key: Optional[str] = None
    
    # PLLaMa 모델 설정 (Hugging Face 모델명)
    # PLLaMa는 GitHub에서 확인 필요: https://github.com/Xianjun-Yang/PLLaMa
    # 일단 기본 LLaMA 모델 사용, 나중에 PLLaMa 모델명으로 변경 가능
    pllama_model: str = "meta-llama/Llama-2-7b-chat-hf"  # PLLaMa 모델명으로 변경 필요
    

    # 캐시 디렉토리
    cache_dir: str = "./model_cache"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

# 환경 변수 로드 확인
if settings.openai_api_key:
    print(f"[설정 확인] OpenAI API 키가 설정되었습니다. (길이: {len(settings.openai_api_key)} 문자)")
else:
    print("[설정 확인] OpenAI API 키가 설정되지 않았습니다. .env 파일을 확인하세요.")
