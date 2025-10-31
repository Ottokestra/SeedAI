from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


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


class GrowthGraphPoint(BaseModel):
    """성장 그래프 데이터 포인트"""
    period: int = Field(..., description="현재로부터 지난/예상 기간 (주 또는 월)")
    size: float = Field(..., description="식물 크기 (cm 단위)")


class PeriodAnalysis(BaseModel):
    """기간별 상세 분석"""
    period: int = Field(..., description="기간 (주 또는 월)")
    good_condition_analysis: str = Field(..., description="좋은 조건으로 생장했을 때의 상세 분석 및 조언")
    bad_condition_description: str = Field(..., description="나쁜 조건 설명")
    bad_condition_impact: str = Field(..., description="나쁜 조건으로 생장 시 식물 상태 및 수명 예상")
    # LLM 기반 전체 설명 (오른쪽 표시용)
    llm_comprehensive_analysis: str = Field(default="", description="식물종 분석 데이터와 그래프 생장 예상 크기를 종합한 LLM 추론 설명 및 조언")
    # 레이아웃 정보: 좌측(테이블)과 우측(설명) 분리를 위한 필드
    layout_type: str = Field("split", description="레이아웃 타입: 'split' (좌우 분할)")


class GrowthGraph(BaseModel):
    """성장 예측 그래프 (좋은/나쁜 지표 포함)"""
    good_growth: List[GrowthGraphPoint] = Field(..., description="좋은 생장 그래프 지표 (최적 관리 시)")
    bad_growth: List[GrowthGraphPoint] = Field(..., description="나쁜 생장 그래프 지표 (관리 부족 시, 빨간색으로 표시)")
    period_unit: str = Field(..., description="기간 단위 ('week' 또는 'month')")
    plant_name: str = Field(..., description="식물 이름")
    min_size: float = Field(..., description="발아단계 최소 크기 (cm) - Y축 시작값")
    max_size: float = Field(..., description="최대 성장 크기 (cm) - Y축 끝값")
    period_analyses: List[PeriodAnalysis] = Field(default_factory=list, description="월별 상세 분석 정보")
    note: str = Field("성장 그래프는 환경/관리 상태에 따라 달라질 수 있습니다.", description="해석 노트")
    # 그래프 시각화 정보
    graph_config: Dict[str, Any] = Field(
        default_factory=lambda: {
            "good_growth_color": "#22c55e",  # 초록색
            "bad_growth_color": "#ef4444",   # 빨간색
            "show_two_lines": True,          # 2개 지표선 표시 여부
            "chart_type": "line"            # 차트 타입
        },
        description="그래프 시각화 설정"
    )


class MonthlyDataRow(BaseModel):
    """월별 데이터 테이블 행"""
    period: str = Field(..., description="기간 (예: '현재', '1개월', '2개월' 등)")
    expected_height: float = Field(..., description="예상 높이 (cm)")
    good_condition_height: Optional[float] = Field(None, description="좋은 조건에서 예상 높이 (cm)")
    bad_condition_height: Optional[float] = Field(None, description="나쁜 조건에서 예상 높이 (cm)")


class PlantGrowthInsightResponse(BaseModel):
    """스캔→생육분석→생장예측그래프→종합분석 응답"""
    identification: PlantIdentification
    growth_graph: GrowthGraph
    analysis_text: str = Field(..., description="생장 추론 종합 텍스트(한국어)")
    monthly_data: Optional[List[MonthlyDataRow]] = Field(None, description="월별 데이터 전체 테이블")
    comprehensive_analysis: Optional[str] = Field(None, description="AI 종합 분석 및 조언 (1-3개월, 4-6개월, 7-12개월 주기별 설명)")
    success: bool = True
    message: str = "성장 인사이트 생성이 완료되었습니다."


class DiseaseDetectionResponse(BaseModel):
    """병충해 분석 응답"""
    identification: PlantIdentification
    diseases: List[Dict[str, Any]] = Field(default_factory=list, description="감지된 병충해 목록")
    severity: str = Field(..., description="심각도 (low/moderate/high)")
    recommendations: List[str] = Field(default_factory=list, description="치료/예방 권장사항")
    success: bool = True
    message: str = "병충해 분석이 완료되었습니다."


class MonthlyDataAnalysis(BaseModel):
    """월별 데이터 분석"""
    identification: PlantIdentification = Field(..., description="식물 식별 결과")
    growth_graph: GrowthGraph = Field(..., description="성장 예측 그래프")
    monthly_data: List[MonthlyDataRow] = Field(..., description="월별 데이터 전체 테이블")
    comprehensive_analysis: str = Field(..., description="AI 종합 분석 및 조언 (1-3개월, 4-6개월, 7-12개월 주기별 설명)")
    success: bool = True
    message: str = "월별 데이터 분석이 완료되었습니다."

