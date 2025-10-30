from pydantic import BaseModel, Field
from typing import List, Optional


class PlantIdentification(BaseModel):
    """식물 식별 결과"""
    plant_name: str = Field(..., description="식물 종명")
    scientific_name: Optional[str] = Field(None, description="학명")
    confidence: float = Field(..., description="신뢰도 (0-1)")
    common_names: Optional[List[str]] = Field(default_factory=list, description="일반 명칭들")


class CareGuide(BaseModel):
    """식물 관리 가이드"""
    watering: str = Field(..., description="물주기 방법")
    sunlight: str = Field(..., description="햇빛 요구사항")
    temperature: str = Field(..., description="적정 온도")
    humidity: str = Field(..., description="습도 요구사항")
    fertilizer: str = Field(..., description="비료 사용법")
    soil: str = Field(..., description="토양 정보")
    tips: List[str] = Field(default_factory=list, description="관리 팁")


class GrowthStage(BaseModel):
    """성장 단계"""
    stage: str = Field(..., description="성장 단계명")
    timeframe: str = Field(..., description="시간 프레임")
    image_url: Optional[str] = Field(None, description="성장 예측 이미지 URL")
    description: str = Field(..., description="단계 설명")


class GrowthPrediction(BaseModel):
    """성장 예측"""
    stages: List[GrowthStage] = Field(..., description="성장 단계들")


class PlantAnalysisResponse(BaseModel):
    """식물 분석 종합 결과"""
    identification: PlantIdentification
    care_guide: CareGuide
    growth_prediction: GrowthPrediction
    success: bool = True
    message: str = "분석이 성공적으로 완료되었습니다."

