from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Body
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor

from app.models.schemas import (
    PlantAnalysisResponse,
    PlantIdentification,
    PlantGrowthInsightResponse,
    MonthlyDataRow,
    MonthlyDataAnalysis,
)
from app.services import (
    classify_plant,
    classify_plant_with_plantrecog,
    classify_plant_multi_model,
    classify_plant_multi_model_kr,
    classify_plant_auto_select,
    classify_plant_auto_select_kr,
    generate_care_guide,
    generate_growth_prediction,
)
from app.services.growth import generate_growth_graph, generate_monthly_data_analysis
from app.services.textgen_adapter import render_plant_analysis
from app.services.db_utils import save_identification_data, save_growth_log, load_growth_history

router = APIRouter()

# 스레드 풀 생성 (CPU 바운드 작업용)
executor = ThreadPoolExecutor(max_workers=3)


@router.post("/analyze", response_model=PlantAnalysisResponse)
async def analyze_plant(file: UploadFile = File(...)) -> PlantAnalysisResponse:
    """
    식물 이미지를 분석하여 종 식별, 관리법, 성장 예측을 제공합니다.
    
    Args:
        file: 업로드된 식물 이미지 파일
        
    Returns:
        PlantAnalysisResponse: 식물 분석 종합 결과
    """
    try:
        # 이미지 파일 검증
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="이미지 파일만 업로드 가능합니다."
            )
        
        # 파일 크기 제한 (10MB)
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="파일 크기는 10MB 이하여야 합니다."
            )
        
        # 1단계: 식물 종 식별
        loop = asyncio.get_event_loop()
        identification = await loop.run_in_executor(
            executor,
            classify_plant,
            contents
        )
        
        # 신뢰도가 낮은 경우에도 기본 관리 가이드 제공
        is_low_confidence = identification.confidence < 0.1

        # 2단계 & 3단계: 관리법 생성 및 성장 예측 (병렬 처리)
        # 인식 불가 시에도 식물명으로 기본 가이드 생성 시도
        plant_name_for_guide = identification.plant_name if not is_low_confidence else "일반 관엽식물"

        care_guide_task = loop.run_in_executor(
            executor,
            generate_care_guide,
            plant_name_for_guide
        )
        
        growth_prediction_task = loop.run_in_executor(
            executor,
            generate_growth_prediction,
            plant_name_for_guide
        )
        
        # 두 작업이 모두 완료될 때까지 대기
        care_guide, growth_prediction = await asyncio.gather(
            care_guide_task,
            growth_prediction_task
        )
        
        # 종합 결과 반환
        if is_low_confidence:
            return PlantAnalysisResponse(
                identification=identification,
                care_guide=care_guide,
                growth_prediction=growth_prediction,
                success=False,
                message="식물을 정확히 식별하지 못했습니다. 일반적인 관엽식물 관리 가이드를 제공합니다. 더 명확한 이미지를 업로드하시면 정확한 정보를 받을 수 있습니다."
            )

        return PlantAnalysisResponse(
            identification=identification,
            care_guide=care_guide,
            growth_prediction=growth_prediction,
            success=True,
            message=f"{identification.plant_name} 분석이 완료되었습니다."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"식물 분석 오류: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"식물 분석 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/analyze-auto", response_model=PlantAnalysisResponse)
async def analyze_plant_auto(file: UploadFile = File(...)) -> PlantAnalysisResponse:
    """
    두 모델을 실행하고 더 신뢰도가 높은 결과를 자동으로 선택합니다.
    
    Args:
        file: 업로드된 식물 이미지 파일
        
    Returns:
        PlantAnalysisResponse: 식물 분석 종합 결과
    """
    try:
        # 이미지 파일 검증
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="이미지 파일만 업로드 가능합니다."
            )
        
        # 파일 크기 제한 (10MB)
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="파일 크기는 10MB 이하여야 합니다."
            )
        
        # 자동 모델 선택으로 식물 종 식별 (한국어 번역)
        loop = asyncio.get_event_loop()
        identification = await loop.run_in_executor(
            executor,
            classify_plant_auto_select_kr,
            contents
        )
        
        # 신뢰도가 낮은 경우에도 기본 관리 가이드 제공
        is_low_confidence = identification.confidence < 0.1
        plant_name_for_guide = identification.plant_name if not is_low_confidence else "일반 관엽식물"

        # 관리법 생성 및 성장 예측 (병렬 처리)
        care_guide_task = loop.run_in_executor(
            executor,
            generate_care_guide,
            plant_name_for_guide
        )
        
        growth_prediction_task = loop.run_in_executor(
            executor,
            generate_growth_prediction,
            plant_name_for_guide
        )
        
        care_guide, growth_prediction = await asyncio.gather(
            care_guide_task,
            growth_prediction_task
        )
        
        if is_low_confidence:
            return PlantAnalysisResponse(
                identification=identification,
                care_guide=care_guide,
                growth_prediction=growth_prediction,
                success=False,
                message="식물을 정확히 식별하지 못했습니다. 일반적인 관엽식물 관리 가이드를 제공합니다. 더 명확한 이미지를 업로드하시면 정확한 정보를 받을 수 있습니다."
            )

        return PlantAnalysisResponse(
            identification=identification,
            care_guide=care_guide,
            growth_prediction=growth_prediction,
            success=True,
            message=f"{identification.plant_name} 분석이 완료되었습니다. (자동 모델 선택)"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"식물 분석 오류 (auto): {e}")
        raise HTTPException(
            status_code=500,
            detail=f"식물 분석 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/analyze-v2", response_model=PlantAnalysisResponse)
async def analyze_plant_v2(file: UploadFile = File(...)) -> PlantAnalysisResponse:
    """
    PlantRecog 모델을 사용하여 식물 이미지를 분석합니다 (299종 꽃 인식).
    
    Args:
        file: 업로드된 식물 이미지 파일
        
    Returns:
        PlantAnalysisResponse: 식물 분석 종합 결과
    """
    try:
        # 이미지 파일 검증
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="이미지 파일만 업로드 가능합니다."
            )
        
        # 파일 크기 제한 (10MB)
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="파일 크기는 10MB 이하여야 합니다."
            )
        
        # PlantRecog 모델로 식물 종 식별
        loop = asyncio.get_event_loop()
        identification = await loop.run_in_executor(
            executor,
            classify_plant_with_plantrecog,
            contents
        )
        
        # 신뢰도가 낮은 경우에도 기본 관리 가이드 제공
        is_low_confidence = identification.confidence < 0.1
        plant_name_for_guide = identification.plant_name if not is_low_confidence else "일반 관엽식물"

        # 관리법 생성 및 성장 예측 (병렬 처리)
        care_guide_task = loop.run_in_executor(
            executor,
            generate_care_guide,
            plant_name_for_guide
        )
        
        growth_prediction_task = loop.run_in_executor(
            executor,
            generate_growth_prediction,
            plant_name_for_guide
        )
        
        care_guide, growth_prediction = await asyncio.gather(
            care_guide_task,
            growth_prediction_task
        )
        
        if is_low_confidence:
            return PlantAnalysisResponse(
                identification=identification,
                care_guide=care_guide,
                growth_prediction=growth_prediction,
                success=False,
                message="식물을 정확히 식별하지 못했습니다. 일반적인 관엽식물 관리 가이드를 제공합니다. 더 명확한 이미지를 업로드하시면 정확한 정보를 받을 수 있습니다."
            )

        return PlantAnalysisResponse(
            identification=identification,
            care_guide=care_guide,
            growth_prediction=growth_prediction,
            success=True,
            message=f"{identification.plant_name} 분석이 완료되었습니다. (PlantRecog 모델)"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"식물 분석 오류 (v2): {e}")
        raise HTTPException(
            status_code=500,
            detail=f"식물 분석 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/compare")
async def compare_models(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    두 모델(ViT + PlantRecog)의 결과를 비교합니다.
    
    Args:
        file: 업로드된 식물 이미지 파일
        
    Returns:
        Dict: 두 모델의 식별 결과 비교
    """
    try:
        # 이미지 파일 검증
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="이미지 파일만 업로드 가능합니다."
            )
        
        # 파일 크기 제한 (10MB)
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="파일 크기는 10MB 이하여야 합니다."
            )
        
        # 두 모델로 분석 (한국어 번역)
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(
            executor,
            classify_plant_multi_model_kr,
            contents
        )
        
        return {
            "success": True,
            "message": "두 모델의 분석이 완료되었습니다.",
            "models": {
                "vit": {
                    "name": "Google ViT (ImageNet)",
                    "result": results["vit_model"].dict()
                },
                "plantrecog": {
                    "name": "PlantRecog (299 Flowers)",
                    "result": results["plantrecog_model"].dict()
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"모델 비교 오류: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"모델 비교 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/test")
async def test_endpoint() -> Dict[str, str]:
    """
    API 테스트 엔드포인트
    
    Returns:
        Dict[str, str]: 테스트 메시지
    """
    return {
        "message": "식물 분석 API가 정상 작동 중입니다.",
        "endpoints": {
            "v1": "/api/plant/analyze (Google ViT)",
            "v2": "/api/plant/analyze-v2 (PlantRecog)",
            "compare": "/api/plant/compare (Both Models)"
        }
    }


@router.post("/growth-insight", response_model=PlantGrowthInsightResponse)
async def growth_insight(
    file: UploadFile = File(...),
    period_unit: str = Query("month", description="기간 단위 ('week' 또는 'month')"),
    max_periods: int = Query(12, description="최대 기간 수")
) -> PlantGrowthInsightResponse:
    """
    스캔(자동 모델 선택) → 생육분석(텍스트) → 생장예측그래프 → 종합분석 텍스트 반환.
    이미지 생성 제외.

    Args:
        file: 업로드된 식물 이미지 파일
        period_unit: 기간 단위 ('week' 또는 'month'), 기본값: 'month'
        max_periods: 최대 기간 수, 기본값: 12
    """
    try:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다.")

        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="파일 크기는 10MB 이하여야 합니다.")

        if period_unit not in ["week", "month"]:
            raise HTTPException(status_code=400, detail="period_unit은 'week' 또는 'month'여야 합니다.")

        loop = asyncio.get_event_loop()
        identification = await loop.run_in_executor(
            executor,
            classify_plant_auto_select_kr,
            contents,
        )

        if identification.confidence < 0.1:
            raise HTTPException(status_code=422, detail="식물을 식별할 수 없습니다. 더 명확한 이미지를 업로드해주세요.")

        # 식물 분석 데이터를 로컬에 저장
        import hashlib
        file_hash = hashlib.md5(contents).hexdigest()
        save_identification_data(identification, file_hash)

        # 그래프 생성은 CPU 바운드 → 스레드 풀 병렬 처리
        # 종분석 데이터(identification)를 그래프 생성에 전달하여 Y축 범위 계산에 활용
        graph_task = loop.run_in_executor(
            executor,
            generate_growth_graph,
            identification.plant_name,
            period_unit,
            max_periods,
            identification  # 종분석 데이터 전달
        )
        growth_graph = await graph_task

        # 월별 데이터 및 종합 분석 생성
        monthly_rows = []
        monthly_data_list = []

        # good_growth와 bad_growth를 기반으로 월별 데이터 생성
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
        good_series = [p.size for p in growth_graph.good_growth]
        bad_series = [p.size for p in growth_graph.bad_growth]

        # 초기 크기 (첫 번째 값 또는 그래프의 min_size 사용)
        start_cm = good_series[0] if good_series else growth_graph.min_size

        comprehensive_analysis = render_plant_analysis(
            plant_name=identification.plant_name,
            K=growth_graph.max_size,
            start_cm=start_cm,
            unit=period_unit,
            periods=max_periods,
            good_series=good_series,
            bad_series=bad_series
        )

        # 간단한 성장 추론 텍스트 (기존 호환성 유지)
        analysis_text = f"{identification.plant_name}의 {max_periods}{'개월' if period_unit == 'month' else '주'} 성장 전망: 초기 {start_cm:.1f}cm에서 최대 {growth_graph.max_size:.1f}cm까지 성장 가능합니다."

        # MonthlyDataRow 리스트 생성
        monthly_data_rows = [
            MonthlyDataRow(
                period=row["period"],
                expected_height=row["expected_height"],
                good_condition_height=row.get("good_condition_height"),
                bad_condition_height=row.get("bad_condition_height")
            )
            for row in monthly_rows
        ]

        return PlantGrowthInsightResponse(
            identification=identification,
            growth_graph=growth_graph,
            analysis_text=analysis_text,
            monthly_data=monthly_data_rows,
            comprehensive_analysis=comprehensive_analysis,
            success=True,
            message=f"{identification.plant_name} 성장 인사이트 생성이 완료되었습니다.",
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"성장 인사이트 오류: {e}")
        raise HTTPException(status_code=500, detail=f"성장 인사이트 생성 중 오류가 발생했습니다: {str(e)}")


# 식물 개별 성장 기록 저장 API
@router.post("/update-growth")
async def update_growth(
    plant_id: str = Body(...),
    date: str = Body(...),
    height: float = Body(...)
):
    try:
        save_growth_log(plant_id, date, height)
        return {"success": True, "msg": "저장 완료"}
    except Exception as e:
        return {"success": False, "msg": str(e)}

# 성장 예측+비교+분석+관리팁 API
@router.get("/growth-insight-v2")
async def growth_insight_v2(plant_id: str):
    try:
        history = load_growth_history(plant_id)
        if not history:
            return {"success": False, "msg": "기록 없음", "history": []}
        last_height = history[-1]["height"]
        prediction = [{"date": f"예측+{i+1}d", "height": last_height + (i+1)*1.0} for i in range(7)]
        compare_comment = "-"
        if len(history) >= 2:
            delta = history[-1]["height"] - history[-2]["height"]
            compare_comment = f"직전 기록보다 {round(delta,2)}cm {'증가' if delta>0 else '감소'}"
        # 분석 텍스트는 별도로 생성하지 않음 (월별 분석에 포함됨)
        analysis = f"성장 데이터 업데이트 완료"
        care_tip = f"{plant_id}의 생장환경 관리 팁(예시)."
        return {
            "success": True,
            "history": history,
            "prediction": prediction,
            "compare_comment": compare_comment,
            "analysis": analysis,
            "care_tip": care_tip
        }
    except Exception as e:
        return {"success": False, "msg": str(e)}


@router.get("/monthly-data-analysis", response_model=MonthlyDataAnalysis)
async def get_monthly_data_analysis(
    plant_name: str = Query(..., description="식물 이름"),
    max_months: int = Query(12, description="최대 월 수"),
    data_id: Optional[str] = Query(None, description="저장된 데이터 ID (선택사항)")
) -> MonthlyDataAnalysis:
    """
    저장된 식물 데이터를 기반으로 월별 데이터 분석을 반환합니다.
    로컬에 저장된 식물 분석 데이터를 로드하여 사용합니다.

    Args:
        plant_name: 식물 이름
        max_months: 최대 월 수 (기본값: 12)
        data_id: 저장된 데이터 ID (선택사항)

    Returns:
        MonthlyDataAnalysis: 월별 데이터 분석 결과
    """
    try:
        import time
        start_time = time.time()

        loop = asyncio.get_event_loop()

        # 저장된 데이터 기반으로 월별 데이터 분석 생성
        result = await loop.run_in_executor(
            executor,
            generate_monthly_data_analysis,
            plant_name,
            max_months,
            data_id
        )

        elapsed_time = time.time() - start_time
        print(f"[월별 데이터 분석] 소요 시간: {elapsed_time:.2f}초")

        # MonthlyDataRow 리스트 생성
        monthly_data_rows = [
            MonthlyDataRow(
                period=row["period"],
                expected_height=row["expected_height"],
                good_condition_height=row.get("good_condition_height"),
                bad_condition_height=row.get("bad_condition_height")
            )
            for row in result["monthly_data"]
        ]

        return MonthlyDataAnalysis(
            identification=result["identification"],
            growth_graph=result["growth_graph"], 
            monthly_data=monthly_data_rows,
            comprehensive_analysis=result["comprehensive_analysis"],
            success=True,
            message=f"{result['identification'].plant_name} 월별 데이터 분석이 완료되었습니다."
        )

    except Exception as e:
        print(f"월별 데이터 분석 오류: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"월별 데이터 분석 중 오류가 발생했습니다: {str(e)}"
        )

