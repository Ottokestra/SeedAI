from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from typing import Dict, Any
import asyncio
from concurrent.futures import ThreadPoolExecutor

from app.models.schemas import PlantAnalysisResponse, PlantIdentification
from app.services import classify_plant, classify_plant_with_plantrecog, classify_plant_multi_model, classify_plant_multi_model_kr, classify_plant_auto_select, classify_plant_auto_select_kr, generate_care_guide, generate_growth_prediction

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
