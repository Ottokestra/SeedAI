from fastapi import APIRouter
from typing import Dict

router = APIRouter()


@router.get("/health")
async def health_check() -> Dict[str, str]:
    """
    헬스체크 엔드포인트
    
    Returns:
        Dict[str, str]: 서버 상태
    """
    return {
        "status": "healthy",
        "message": "새싹아이 API가 정상 작동 중입니다."
    }

