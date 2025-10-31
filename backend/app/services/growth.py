import base64
from typing import List, Tuple, Optional, Dict, Any
from io import BytesIO
import torch
from diffusers import AutoPipelineForText2Image
from app.config import settings
from app.models.schemas import (
    GrowthPrediction,
    GrowthStage,
    GrowthGraph,
    GrowthGraphPoint,
    PeriodAnalysis,
    PlantIdentification,
)
from app.services.guide import load_text_generator
from app.services.db_utils import load_identification_data
from app.services.textgen_adapter import render_plant_analysis
import math
import hashlib

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
    """기본 성장 예측을 반환합니다. (12개월 데이터)"""
    stages = []
    
    # 현재 단계부터 12개월 후까지 데이터 생성
    descriptions = {
        "현재": f"{plant_name}의 초기 단계입니다. 새로운 환경에 적응하는 시기입니다.",
        "1개월": f"{plant_name}가 새로운 환경에 적응하기 시작합니다.",
        "2개월": "새로운 잎이 나오기 시작하며 뿌리가 자리를 잡습니다.",
        "3개월": "초기 성장이 안정적으로 진행되고 있습니다.",
        "4개월": "잎이 더 풍성해지고 뿌리 시스템이 발달합니다.",
        "5개월": "활발한 성장이 진행되며 새로운 가지가 나오기 시작합니다.",
        "6개월": "풍성한 잎과 건강한 줄기를 가진 성숙한 모습입니다.",
        "7개월": "완전히 안정화된 성장 패턴을 보입니다.",
        "8개월": "최적의 상태를 유지하며 계속 성장하고 있습니다.",
        "9개월": "무성한 잎과 건강한 외관을 자랑합니다.",
        "10개월": "성숙한 식물로 완전히 자리잡았습니다.",
        "11개월": "완전히 성장한 모습으로 장기 관리가 필요한 시기입니다.",
        "12개월": f"완전히 성장한 {plant_name}의 최종 모습입니다."
    }
    
    for i in range(13):  # 0부터 12까지 (13개)
        if i == 0:
            timeframe = "현재"
            stage = "current"
        else:
            timeframe = f"{i}개월"
            stage = f"{i}_months"
        
        stages.append(GrowthStage(
            stage=stage,
            timeframe=timeframe,
            image_url=None,
            description=descriptions.get(timeframe, f"{plant_name}가 건강하게 성장하고 있습니다.")
        ))
    
    return GrowthPrediction(stages=stages)


def _seed_from_name(plant_name: str) -> float:
    """식물 이름으로부터 0-1 범위의 결정적 시드를 생성합니다."""
    digest = hashlib.sha256(plant_name.encode("utf-8")).hexdigest()
    # 앞 8자리 정수화 후 0-1 스케일
    value = int(digest[:8], 16) / 0xFFFFFFFF
    return max(0.0, min(1.0, value))


def get_plant_size_range(plant_name: str, identification: Optional[PlantIdentification] = None) -> Tuple[float, float]:
    """
    식물 이름 및 종분석 데이터 기반으로 초기 크기와 최대 크기 범위를 반환합니다.
    
    Args:
        plant_name: 식물 이름
        identification: 식물 종분석 데이터 (선택사항, Y축 범위 계산에 활용)
        
    Returns:
        (초기_크기, 최대_크기) 튜플 (cm 단위)
    """
    seed = _seed_from_name(plant_name)
    
    # 식물 유형별 기본 크기 범위 (cm)
    # 소형 식물: 5-30cm, 중형 식물: 10-60cm, 대형 식물: 20-150cm
    plant_type_seed = int(seed * 1000) % 3
    
    # 종분석 데이터가 제공되면 신뢰도를 고려하여 범위 조정
    confidence_factor = 1.0
    if identification is not None:
        # 신뢰도가 높을수록 더 정확한 범위 예측
        confidence_factor = 0.8 + (identification.confidence * 0.2)  # 0.8 ~ 1.0 사이
    
    if plant_type_seed == 0:  # 소형 식물
        initial_size = (5.0 + seed * 5.0) * confidence_factor  # 5-10cm (조정)
        max_size = (20.0 + seed * 10.0) * confidence_factor     # 20-30cm (조정)
    elif plant_type_seed == 1:  # 중형 식물
        initial_size = (8.0 + seed * 7.0) * confidence_factor   # 8-15cm (조정)
        max_size = (40.0 + seed * 20.0) * confidence_factor     # 40-60cm (조정)
    else:  # 대형 식물
        initial_size = (15.0 + seed * 10.0) * confidence_factor  # 15-25cm (조정)
        max_size = (80.0 + seed * 70.0) * confidence_factor      # 80-150cm (조정)
    
    # 최소값 보장
    initial_size = max(3.0, initial_size)
    max_size = max(initial_size * 2, max_size)
    
    return round(initial_size, 1), round(max_size, 1)


def generate_growth_graph(plant_name: str, period_unit: str = "month", max_periods: int = 12, identification: Optional[PlantIdentification] = None) -> GrowthGraph:
    """
    종분석 데이터를 기반으로 성장 예측 그래프를 생성합니다.
    좋은 생장/나쁜 생장 지표 2개를 생성합니다.
    
    Args:
        plant_name: 식물 이름
        period_unit: 기간 단위 ('week' 또는 'month')
        max_periods: 최대 기간 수 (주 또는 월)
        identification: 식물 종분석 데이터 (Y축 범위 계산에 사용)
        
    Returns:
        GrowthGraph: 좋은/나쁜 생장 그래프 포함
    """
    seed = _seed_from_name(plant_name)
    
    # 종분석 데이터(identification)를 활용하여 Y축 범위 계산
    # identification이 제공되면 신뢰도를 반영한 더 정확한 범위 계산
    initial_size, max_size = get_plant_size_range(plant_name, identification)
    
    # 기간별 데이터 포인트 생성
    if period_unit == "week":
        periods = list(range(0, max_periods + 1, max(1, max_periods // 12)))  # 최대 12개 포인트
        if periods[-1] != max_periods:
            periods.append(max_periods)
    else:  # month
        periods = list(range(0, max_periods + 1))
    
    def generate_growth_curve(periods_list: List[int], growth_rate_multiplier: float) -> List[GrowthGraphPoint]:
        """
        성장 곡선을 생성합니다.
        
        Args:
            periods_list: 기간 리스트
            growth_rate_multiplier: 성장률 배수 (1.0 = 예상, 1.3 = 좋은 생장, 0.7 = 나쁜 생장)
            
        Returns:
            GrowthGraphPoint 리스트
        """
        points = []
        
        for period in periods_list:
            # 로지스틱 곡선 기반 성장 계산
            # k: 성장 속도 (period_unit에 따라 조정)
            if period_unit == "week":
                k = (0.15 + 0.1 * seed) * growth_rate_multiplier  # 주별 성장률
                x0 = (8.0 - 4.0 * seed) * growth_rate_multiplier  # 전환점 (주)
                normalized_period = period / max_periods * 24  # 24주 기준 정규화
            else:  # month
                k = (0.35 + 0.2 * seed) * growth_rate_multiplier  # 월별 성장률
                x0 = (3.0 - 1.5 * seed) * growth_rate_multiplier  # 전환점 (월)
                normalized_period = period
            
            # 로지스틱 함수로 성장 지수 계산 (0-1)
            growth_index = 1.0 / (1.0 + math.exp(-k * (normalized_period - x0)))
            
            # 초기 크기에서 최대 크기로 변환
            current_size = initial_size + (max_size - initial_size) * growth_index
            
            # 작은 변동 추가 (자연스러운 성장 곡선)
            variation = (seed * 0.1 - 0.05) * current_size
            current_size += variation
            
            # 크기는 최소 초기 크기 이상, 최대 크기 이하로 제한
            current_size = max(initial_size * 0.8, min(current_size, max_size * 1.1))
            
            points.append(GrowthGraphPoint(
                period=period,
                size=round(current_size, 1)
            ))
        
        return points
    
    # 2가지 성장 곡선 생성 (좋은/나쁜 조건만)
    good_growth = generate_growth_curve(periods, 1.3)  # 좋은 생장 (30% 빠른 성장)
    bad_growth = generate_growth_curve(periods, 0.7)  # 나쁜 생장 (30% 느린 성장)
    
    # 월별 상세 분석 생성 (identification 전달)
    period_analyses = generate_period_analyses(plant_name, periods, period_unit, good_growth, bad_growth, identification)
    
    # Y축 범위 계산 (발아단계부터 최대 크기까지, 약간의 여유 공간 추가)
    y_min = max(0, initial_size * 0.9)  # 발아단계 크기의 90% (여유 공간)
    y_max = max_size * 1.1  # 최대 크기의 110% (여유 공간)
    
    return GrowthGraph(
        good_growth=good_growth,
        bad_growth=bad_growth,
        period_unit=period_unit,
        plant_name=plant_name,
        min_size=round(y_min, 1),
        max_size=round(y_max, 1),
        period_analyses=period_analyses,
        note=f"{plant_name}의 성장 그래프입니다. 좋은 생장(최적 관리)과 나쁜 생장(관리 부족)을 비교할 수 있습니다.",
        graph_config={
            "good_growth_color": "#22c55e",  # 초록색 (좋은 조건)
            "bad_growth_color": "#ef4444",   # 빨간색 (나쁜 조건)
            "show_two_lines": True,          # 2개 지표선 표시
            "chart_type": "line"            # 선 그래프
        }
    )


def generate_period_analyses(
    plant_name: str,
    periods: List[int],
    period_unit: str,
    good_growth: List[GrowthGraphPoint],
    bad_growth: List[GrowthGraphPoint],
    identification: Optional[PlantIdentification] = None
) -> List[PeriodAnalysis]:
    """
    각 기간별 상세 분석 텍스트를 생성합니다.
    
    Args:
        plant_name: 식물 이름
        periods: 기간 리스트
        period_unit: 기간 단위 ('week' 또는 'month')
        good_growth: 좋은 생장 그래프 포인트
        bad_growth: 나쁜 생장 그래프 포인트
        
    Returns:
        PeriodAnalysis 리스트
    """
    analyses = []
    
    # 기간 단위에 따른 라벨
    unit_label = "주" if period_unit == "week" else "개월"
    
    for i, period in enumerate(periods):
        if i >= len(good_growth) or i >= len(bad_growth):
            continue
            
        good_size = good_growth[i].size
        bad_size = bad_growth[i].size
        size_diff = good_size - bad_size
        
        # 기간별 단계 분류
        if period == 0:
            stage = "초기"
            growth_rate_desc = "적응"
        elif period <= 3:
            stage = "초기 성장"
            growth_rate_desc = "활발한 성장"
        elif period <= 6:
            stage = "중기 성장"
            growth_rate_desc = "안정적 성장"
        else:
            stage = "후기 성장"
            growth_rate_desc = "성숙 단계"
        
        # 좋은 조건 분석
        good_analysis = generate_good_condition_analysis(
            plant_name, period, unit_label, stage, good_size, size_diff
        )
        
        # 나쁜 조건 설명
        bad_description = generate_bad_condition_description(
            plant_name, period, unit_label, stage, bad_size
        )
        
        # 나쁜 조건 영향
        bad_impact = generate_bad_condition_impact(
            plant_name, period, unit_label, stage, bad_size, size_diff
        )
        
        # LLM 기반 전체 설명 생성 (식물종 분석 + 그래프 데이터 종합)
        llm_analysis = generate_period_llm_analysis(
            plant_name, period, unit_label, stage, good_size, bad_size, 
            size_diff, identification
        )
        
        analyses.append(PeriodAnalysis(
            period=period,
            good_condition_analysis=good_analysis,
            bad_condition_description=bad_description,
            bad_condition_impact=bad_impact,
            llm_comprehensive_analysis=llm_analysis,
            layout_type="split"  # 좌우 분할 레이아웃
        ))
    
    return analyses


def generate_good_condition_analysis(
    plant_name: str,
    period: int,
    unit_label: str,
    stage: str,
    good_size: float,
    size_diff: float
) -> str:
    """좋은 조건으로 생장했을 때의 상세 분석 및 조언"""
    
    if period == 0:
        return (
            f"{plant_name}이(가) 최적의 환경에서 초기 적응을 잘 하고 있습니다. "
            f"현재 크기 {good_size}cm로 건강한 시작을 보이고 있으며, 적절한 물주기와 일정한 온습도가 뿌리 활착을 돕고 있습니다. "
            f"이 시기에는 직사광선을 피하고 밝은 간접광을 제공하며, 토양이 약간 마를 때 충분히 물을 주는 것이 중요합니다. "
            f"과습보다는 적당한 건조를 유지하면 뿌리 건강이 좋아집니다."
        )
    elif period <= 3:
        return (
            f"{period}{unit_label} 시점에서 {plant_name}이(가) 최적 조건 하에서 활발히 성장하고 있습니다. "
            f"현재 크기 {good_size}cm로 정상적인 성장보다 약 30% 빠르게 자라고 있으며, 이는 적절한 빛, 물, 영양분 공급의 결과입니다. "
            f"새로운 잎이 정기적으로 나오고 있고, 뿌리 시스템이 잘 발달하고 있습니다. "
            f"이 시기에는 성장기에 맞춰 월 1-2회 액체 비료를 주고, 잎에 분무를 해주면 더욱 건강하게 자랄 수 있습니다. "
            f"통풍이 잘 되는 위치에 배치하여 병해충을 예방하세요."
        )
    elif period <= 6:
        return (
            f"{period}{unit_label} 시점에서 {plant_name}이(가) 안정적인 성장 단계에 진입했습니다. "
            f"현재 크기 {good_size}cm로 최적 조건에서 자란 식물의 모습을 보여주고 있습니다. "
            f"풍성한 잎과 강건한 줄기가 특징이며, 정기적인 가지치기로 더욱 건강한 형태를 유지할 수 있습니다. "
            f"이 시기에는 수분 공급을 일정하게 유지하고, 계절에 따라 온도와 습도를 조절해주세요. "
            f"황변 잎은 즉시 제거하여 식물이 건강한 부분에 에너지를 집중시킬 수 있도록 합니다."
        )
    else:
        return (
            f"{period}{unit_label} 시점에서 {plant_name}이(가) 성숙한 단계에 도달했습니다. "
            f"현재 크기 {good_size}cm로 최적 조건에서 자란 성숙한 식물의 모습을 보여주고 있습니다. "
            f"장기적인 관리가 중요하며, 정기적인 분갈이(2-3년마다)와 영양분 공급이 필요합니다. "
            f"이 시기에는 성장 속도가 둔화되므로 물주기 빈도를 조절하고, 겨울철에는 휴면기를 고려하여 관리하세요. "
            f"잎을 정기적으로 닦아 광합성 효율을 높이고, 병해충을 조기에 발견하여 대응하는 것이 중요합니다. "
            f"올바른 관리 시 앞으로도 5-10년 이상 건강하게 생존할 수 있습니다."
        )


def generate_bad_condition_description(
    plant_name: str,
    period: int,
    unit_label: str,
    stage: str,
    bad_size: float
) -> str:
    """나쁜 조건 설명"""
    
    conditions = [
        "불충분한 빛 노출 (어둡거나 부족한 햇빛)",
        "과습 또는 건조 (일정하지 않은 물주기)",
        "적절하지 않은 온도 (너무 낮거나 높은 온도, 급격한 온도 변화)",
        "낮은 습도 (건조한 공기 환경)",
        "영양분 부족 (비료 미공급 또는 부적절한 토양)",
        "불충분한 통풍 (밀폐된 공간)",
        "부적절한 화분 크기 (뿌리 발달 제한)"
    ]
    
    if period <= 3:
        primary_issues = conditions[:3]  # 초기에는 빛, 물, 온도가 중요
    elif period <= 6:
        primary_issues = conditions[:5]  # 중기에는 영양분도 중요
    else:
        primary_issues = conditions  # 후기에는 모든 요소 중요
    
    issues_text = ", ".join(primary_issues)
    
    return (
        f"{period}{unit_label} 시점에서 {plant_name}이(가) 나쁜 조건에 노출되어 있습니다. "
        f"주요 문제점: {issues_text}. "
        f"현재 크기 {bad_size}cm로 정상적인 성장보다 약 30% 느리게 자라고 있으며, "
        f"이는 환경 스트레스와 부적절한 관리의 결과입니다."
    )


def generate_bad_condition_impact(
    plant_name: str,
    period: int,
    unit_label: str,
    stage: str,
    bad_size: float,
    size_diff: float
) -> str:
    """나쁜 조건으로 생장 시 식물 상태 및 수명 예상"""
    
    if period == 0:
        return (
            f"초기 적응 단계에서 나쁜 조건이 지속되면 {plant_name}의 뿌리 발달이 지연되고, "
            f"전체적인 생장이 저하됩니다. 잎이 작아지고, 색이 연해지며, 새로운 성장이 거의 없을 수 있습니다. "
            f"이 상태가 계속되면 3-6개월 내에 심각한 건강 문제가 발생할 수 있으며, "
            f"시기적절한 개선이 없으면 1-2년 내 생존이 어려워질 수 있습니다."
        )
    elif period <= 3:
        return (
            f"{period}{unit_label} 시점에서 나쁜 조건이 지속되면 {plant_name}의 성장이 거의 멈추고, "
            f"기존 잎들이 황변하거나 낙엽이 증가합니다. 뿌리 썩음이나 병해충에 취약해지며, "
            f"회복이 어려운 상태가 될 수 있습니다. 현재 상태가 지속되면 6-12개월 내 심각한 건강 악화가 예상되며, "
            f"개선이 없으면 1-3년 내 생존이 어려워질 수 있습니다."
        )
    elif period <= 6:
        return (
            f"{period}{unit_label} 시점에서 나쁜 조건이 계속되면 {plant_name}은(는) 만성 스트레스 상태에 빠지며, "
            f"회복이 매우 어려워집니다. 잎이 계속 떨어지고, 새로운 성장이 거의 없으며, 전체적인 활력이 크게 저하됩니다. "
            f"이 상태에서 개선 조치를 취하지 않으면 1-2년 내 생존이 어려워지며, "
            f"급격한 건강 악화가 예상됩니다."
        )
    else:
        return (
            f"{period}{unit_label} 시점에서 장기간 나쁜 조건에 노출된 {plant_name}은(는) 심각한 건강 악화 상태입니다. "
            f"회복 가능성은 매우 낮으며, 생존을 위해서는 즉각적이고 근본적인 관리 개선이 필요합니다. "
            f"이 상태가 지속되면 6개월-1년 내 생존이 어려워질 수 있으며, "
            f"식물의 수명이 정상적인 조건에서 기대되는 수명의 30-50%로 단축됩니다. "
            f"즉시 환경을 개선하고 전문가의 조언을 구하는 것을 권장합니다."
        )


def generate_growth_inference_text(plant_name: str) -> str:
    """
    LLM(가능 시 transformers 로컬 모델)로 한국어 생장 추론 종합 텍스트 생성.
    모델 로딩 실패 시 템플릿 기반 메시지를 반환.
    """
    tokenizer, model = load_text_generator()
    prompt = (
        f"다음 식물의 6개월 성장 전망을 한국어로 3-5문장으로 요약해줘.\n"
        f"식물: {plant_name}\n"
        f"요구사항: 물주기, 빛, 온습도 관리에 따른 성장 가속/지연 요인을 포함하고,\n"
        f"그래프 해석 팁(0-1 지수 의미)을 한 줄로 덧붙여줘. 과도한 과장은 피하고 실용적으로."
    )

    try:
        if tokenizer is None or model is None:
            raise RuntimeError("text model unavailable")

        # 경량 생성 (짧은 길이, 반복 최소화)
        inputs = tokenizer(prompt, return_tensors="pt")
        if torch.cuda.is_available():
            inputs = {k: v.cuda() for k, v in inputs.items()}
        with torch.no_grad():
            output_ids = model.generate(
                **inputs,
                max_new_tokens=180,
                do_sample=True,
                temperature=0.8,
                top_p=0.9,
                repetition_penalty=1.1,
                pad_token_id=tokenizer.eos_token_id,
            )
        text = tokenizer.decode(output_ids[0], skip_special_tokens=True)
        # 프롬프트 제거 후 본문만 추출
        if text.startswith(prompt):
            text = text[len(prompt):].strip()
        # 너무 짧거나 영어 위주면 템플릿 보강
        if len(text) < 40:
            raise RuntimeError("generated text too short")
        return text.strip()
    except Exception:
        # 템플릿 기반 백업
        return (
            f"{plant_name}의 향후 6개월 성장은 환경 안정성과 관리의 일관성에 크게 좌우됩니다. "
            f"밝은 간접광과 과습을 피한 물주기를 유지하면 신엽 발생과 잎 밀도가 점진적으로 향상됩니다. "
            f"18-24°C, 중간 습도(40-60%)를 유지하면 스트레스를 줄이고 뿌리 활착을 돕습니다. "
            f"비료는 성장기에 월 1회 정도로 시작해 반응을 보며 조절하세요. "
            f"그래프의 성장 지수(0-1)는 상대적 활력 지표로, 1에 가까울수록 잎 전개와 생장세가 안정적임을 의미합니다."
        )


def generate_comprehensive_monthly_analysis(
    plant_name: str,
    monthly_data: List[Dict[str, float]],
    identification: Optional[PlantIdentification] = None
) -> str:
    """
    템플릿 기반 빠른 종합 분석 생성 (LLM 제거 - 최대 속도)
    """
    # 주기별 데이터 추출
    period_1_3 = [d for d in monthly_data if 0 <= d.get("period", 0) <= 3]
    period_4_6 = [d for d in monthly_data if 4 <= d.get("period", 0) <= 6]
    period_7_12 = [d for d in monthly_data if 7 <= d.get("period", 0) <= 12]
    
    # 템플릿 직접 사용 (가장 빠름)
    return generate_comprehensive_monthly_analysis_template(
        plant_name, period_1_3, period_4_6, period_7_12, identification
    )


def generate_comprehensive_monthly_analysis_template(
    plant_name: str,
    period_1_3: List[Dict[str, float]],
    period_4_6: List[Dict[str, float]],
    period_7_12: List[Dict[str, float]],
    identification: Optional[PlantIdentification] = None
) -> str:
    """템플릿 기반 주기별 종합 분석 생성"""
    
    # 식물명 가져오기
    display_name = plant_name
    if identification:
        display_name = identification.plant_name if hasattr(identification, 'plant_name') else plant_name
    
    # 1-3개월 분석
    period_1_3_text = ""
    if period_1_3:
        last_data = period_1_3[-1]
        expected = last_data.get("expected", 0)
        good = last_data.get("good", 0)
        bad = last_data.get("bad", 0)
        period_1_3_text = (
            f"1~3개월: {display_name}은(는) 초기 적응과 활발한 성장 단계를 거칩니다. "
            f"이 시기에는 좋은 조건에서는 {good:.1f}cm까지, 나쁜 조건에서는 {bad:.1f}cm까지 성장할 것으로 예상됩니다. "
            f"새로운 잎이 정기적으로 나오고 뿌리 시스템이 발달하는 중요한 시기입니다. "
            f"밝은 간접광과 과습을 피한 물주기(토양 표면이 마를 때), 18-24°C의 온도와 40-60% 습도를 유지하는 것이 중요합니다."
        )
    
    # 4-6개월 분석
    period_4_6_text = ""
    if period_4_6:
        last_data = period_4_6[-1]
        expected = last_data.get("expected", 0)
        good = last_data.get("good", 0)
        bad = last_data.get("bad", 0)
        period_4_6_text = (
            f"4~6개월: {display_name}은(는) 안정적인 성장 단계에 진입합니다. "
            f"이 시기에는 좋은 조건에서는 {good:.1f}cm까지, 나쁜 조건에서는 {bad:.1f}cm까지 성장할 것으로 예상됩니다. "
            f"풍성한 잎과 강건한 줄기가 특징이며, 정기적인 가지치기로 더욱 건강한 형태를 유지할 수 있습니다. "
            f"성장기에 맞춰 월 1-2회 액체 비료를 주고, 수분 공급을 일정하게 유지하며, 계절에 따라 온도와 습도를 조절해주세요."
        )
    
    # 7-12개월 분석
    period_7_12_text = ""
    if period_7_12:
        last_data = period_7_12[-1]
        expected = last_data.get("expected", 0)
        good = last_data.get("good", 0)
        bad = last_data.get("bad", 0)
        period_7_12_text = (
            f"7~12개월: {display_name}은(는) 성숙한 단계에 도달합니다. "
            f"이 시기에는 좋은 조건에서는 {good:.1f}cm까지, 나쁜 조건에서는 {bad:.1f}cm까지 성장할 것으로 예상됩니다. "
            f"장기적인 관리가 중요하며, 정기적인 분갈이(2-3년마다)와 영양분 공급이 필요합니다. "
            f"성장 속도가 둔화되므로 물주기 빈도를 조절하고, 겨울철에는 휴면기를 고려하여 관리하세요. "
            f"잎을 정기적으로 닦아 광합성 효율을 높이고, 병해충을 조기에 발견하여 대응하는 것이 중요합니다."
        )
    
    # 종합 조언
    comprehensive_tip = (
        f"\n\n최적의 생장을 위해서는 충분한 간접광, 적절한 물주기, 적정 온습도를 유지하는 것이 중요합니다. "
        f"피해야 할 조건으로는 직사광선, 과습/건조, 온도 급변, 통풍 부족이 있으며, "
        f"이러한 조건이 지속되면 성장이 지연될 수 있습니다."
    )
    
    return f"식물 {display_name}의 생장 예측에 대한 종합 분석입니다.\n\n{period_1_3_text}\n\n{period_4_6_text}\n\n{period_7_12_text}{comprehensive_tip}"


def generate_monthly_data_analysis(
    plant_name: str,
    max_months: int = 12,
    data_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    저장된 식물 데이터를 기반으로 월별 데이터 분석을 생성합니다.
    로컬에 저장된 식물 분석 데이터를 로드하여 사용합니다.
    
    Args:
        plant_name: 식물 이름
        max_months: 최대 월 수 (기본값: 12)
        data_id: 저장된 데이터 ID (선택사항)
        
    Returns:
        월별 데이터 분석 결과 (dict)
    """
    import time
    start_time = time.time()
    
    # 저장된 식물 분석 데이터 로드
    saved_data = load_identification_data(data_id=data_id, plant_name=plant_name)
    print(f"[월별 분석] 데이터 로드 완료: {time.time() - start_time:.2f}초")
    
    if saved_data:
        identification_dict = saved_data.get("identification", {})
        identification = PlantIdentification(
            plant_name=identification_dict.get("plant_name", plant_name),
            scientific_name=identification_dict.get("scientific_name"),
            confidence=identification_dict.get("confidence", 0.5),
            common_names=identification_dict.get("common_names", [])
        )
    else:
        # 저장된 데이터가 없으면 기본값으로 생성
        identification = PlantIdentification(
            plant_name=plant_name,
            scientific_name=None,
            confidence=0.5,
            common_names=[]
        )
    
    # 성장 그래프 생성 (저장된 데이터 기반)
    growth_graph = generate_growth_graph(
        plant_name=identification.plant_name,
        period_unit="month",
        max_periods=max_months,
        identification=identification
    )
    
    # 월별 데이터 행 생성
    monthly_rows = []
    monthly_data_list = []
    
    # good_growth와 bad_growth의 평균을 expected_growth로 사용
    for i in range(len(growth_graph.good_growth)):
        good_point = growth_graph.good_growth[i]
        bad_point = growth_graph.bad_growth[i] if i < len(growth_graph.bad_growth) else good_point
        
        period = good_point.period
        
        # period에 따라 기간 라벨 결정
        if period == 0:
            period_label = "현재"
        else:
            period_label = f"{period}개월"
        
        # 좋은 조건과 나쁜 조건 크기 가져오기
        good_height = good_point.size
        bad_height = bad_point.size
        
        # 예상 크기 = 좋은 조건과 나쁜 조건의 평균
        expected_height = (good_height + bad_height) / 2
        
        # 월별 데이터 추가
        monthly_rows.append({
            "period": period_label,
            "expected_height": round(expected_height, 1),
            "good_condition_height": round(good_height, 1),
            "bad_condition_height": round(bad_height, 1)
        })
        
        # 종합 분석을 위한 데이터 리스트
        monthly_data_list.append({
            "period": period,
            "expected": expected_height,
            "good": good_height,
            "bad": bad_height
        })
    
    # 새 LLM 어댑터로 종합 분석 생성 (로컬 LLM → 실패 시 템플릿 폴백)
    # good_growth와 bad_growth에서 크기 값 추출
    good_series = [d.get("good", 0) for d in monthly_data_list]
    bad_series = [d.get("bad", 0) for d in monthly_data_list]
    
    # 초기 크기 및 최대 크기 추정
    start_cm = good_series[0] if good_series else 15.0
    K = max(good_series) if good_series else 200.0
    
    analysis_start = time.time()
    comprehensive_analysis = render_plant_analysis(
        plant_name=identification.plant_name,
        K=K,
        start_cm=start_cm,
        unit="month",
        periods=12,
        good_series=good_series,
        bad_series=bad_series
    )
    print(f"[월별 분석] 종합 분석 생성 완료: {time.time() - analysis_start:.2f}초")
    
    total_time = time.time() - start_time
    print(f"[월별 분석] 전체 소요 시간: {total_time:.2f}초")
    
    return {
        "identification": identification,
        "monthly_data": monthly_rows,
        "comprehensive_analysis": comprehensive_analysis
    }


def generate_period_llm_analysis(
    plant_name: str,
    period: int,
    unit_label: str,
    stage: str,
    good_size: float,
    bad_size: float,
    size_diff: float,
    identification: Optional[PlantIdentification] = None
) -> str:
    """
    LLM(무료)을 사용하여 식물종 분석 데이터와 그래프 생장 예상 크기를 종합하여 추론한 설명 및 조언을 생성합니다.
    
    Args:
        plant_name: 식물 이름
        period: 기간
        unit_label: 기간 단위 라벨
        stage: 성장 단계
        good_size: 좋은 조건 크기
        bad_size: 나쁜 조건 크기
        size_diff: 크기 차이
        identification: 식물 종분석 데이터
        
    Returns:
        LLM 기반 종합 분석 텍스트
    """
    tokenizer, model = load_text_generator()
    
    # 식물종 정보 구성
    plant_info = f"식물명: {plant_name}"
    if identification:
        plant_info += f"\n과학명: {identification.scientific_name or '정보 없음'}"
        plant_info += f"\n신뢰도: {identification.confidence * 100:.1f}%"
        if identification.common_names:
            plant_info += f"\n일반명: {', '.join(identification.common_names[:3])}"
    
    # 그래프 데이터 정보 구성
    graph_info = (
        f"현재 시점부터 {period}{unit_label} 후 예상 생장:\n"
        f"- 좋은 조건으로 관리 시: {good_size:.1f}cm까지 성장 예상\n"
        f"- 나쁜 조건에서 관리 시: {bad_size:.1f}cm까지 성장 예상\n"
        f"- 성장 단계: {stage}\n"
        f"- 좋은 조건과 나쁜 조건의 차이: {size_diff:.1f}cm"
    )
    
    # LLM 프롬프트 구성
    prompt = (
        f"{plant_info}\n\n{graph_info}\n\n"
        f"위 정보를 바탕으로 다음과 같은 내용을 한국어로 작성해주세요:\n"
        f"1. {plant_name}의 {period}{unit_label} 후 생장 예측에 대한 종합적인 설명\n"
        f"2. 그래프의 두 선(좋은 조건/나쁜 조건)이 의미하는 바\n"
        f"3. 현재 {stage} 단계에서 최적의 생장을 위한 구체적인 관리 조언\n"
        f"4. 피해야 할 생장 조건 및 주의사항\n"
        f"5. 실용적이고 현실적인 조언 (3-5문장으로 간결하게)"
    )
    
    try:
        if tokenizer is None or model is None:
            raise RuntimeError("text model unavailable")
        
        # 경량 생성
        inputs = tokenizer(prompt, return_tensors="pt", max_length=512, truncation=True)
        if torch.cuda.is_available():
            inputs = {k: v.cuda() for k, v in inputs.items()}
        
        with torch.no_grad():
            output_ids = model.generate(
                **inputs,
                max_new_tokens=200,
                do_sample=True,
                temperature=0.7,
                top_p=0.9,
                repetition_penalty=1.2,
                pad_token_id=tokenizer.eos_token_id,
            )
        
        text = tokenizer.decode(output_ids[0], skip_special_tokens=True)
        # 프롬프트 제거
        if text.startswith(prompt):
            text = text[len(prompt):].strip()
        
        # 너무 짧으면 템플릿 보강
        if len(text) < 50:
            raise RuntimeError("generated text too short")
        
        return text.strip()
    except Exception as e:
        # 템플릿 기반 백업
        return (
            f"{plant_name}은(는) 현재 {stage} 단계에 있으며, {period}{unit_label} 후 "
            f"좋은 조건에서는 {good_size:.1f}cm, 나쁜 조건에서는 {bad_size:.1f}cm까지 성장할 것으로 예상됩니다.\n\n"
            f"최적의 생장을 위해서는 충분한 간접광, 적절한 물주기(토양 표면이 마를 때), "
            f"18-24°C의 온도와 40-60% 습도를 유지하는 것이 중요합니다.\n\n"
            f"피해야 할 조건으로는 직사광선, 과습/건조, 온도 급변, 통풍 부족이 있습니다. "
            f"이러한 조건들이 지속되면 성장이 {size_diff:.1f}cm 이상 지연될 수 있으며, "
            f"장기적으로는 식물의 건강에 악영향을 미칩니다."
        )

