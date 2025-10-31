"""
FastAPI 서버 - 식물 종 분류 및 병충해 감지 API
"""
import os
import uuid
import shutil
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from inference import get_detector
from llm_service import get_advisor
import logging
import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI 앱 생성
app = FastAPI(
    title="Plant Disease Detection API",
    description="YOLOv8을 활용한 식물 종 분류 및 병충해 감지 API",
    version="1.0.0"
)

# CORS 설정 (React 프론트엔드와 통신)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:5173",  # 호환성 유지
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 디렉토리 경로
UPLOAD_DIR = Path("uploads")
RESULTS_DIR = Path("results")

# 디렉토리 생성
UPLOAD_DIR.mkdir(exist_ok=True)
RESULTS_DIR.mkdir(exist_ok=True)


@app.on_event("startup")
async def startup_event():
    """서버 시작 시 모델 로드"""
    try:
        logger.info("모델 로딩 중...")
        get_detector()
        logger.info("모델 로딩 완료")
    except Exception as e:
        logger.error(f"모델 로딩 실패: {str(e)}")
        logger.warning("모델 파일이 없어도 서버는 실행됩니다. models/ 폴더에 모델 파일을 배치하세요.")


@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "Plant Disease Detection API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/api/health",
            "detect": "/api/detect (POST)"
        }
    }


@app.get("/api/health")
async def health_check():
    """서버 상태 확인"""
    detector = get_detector()
    
    return {
        "status": "healthy",
        "models": {
            "disease_model_loaded": detector.disease_model is not None
        },
        "note": "단일 모델로 식물 종과 병충해를 함께 감지합니다."
    }


@app.post("/api/detect")
async def detect_plant_disease(
    file: UploadFile = File(...),
    conf_threshold: Optional[float] = 0.01,  # 낮은 임계값으로 모든 감지
    user_notes: Optional[str] = None  # 사용자 추가 의견
):
    """
    식물 이미지를 업로드하여 종과 병충해를 감지합니다.
    
    Args:
        file: 업로드할 이미지 파일
        conf_threshold: 신뢰도 임계값 (기본값: 0.25)
        
    Returns:
        감지 결과 (식물 종, 병충해 정보, 결과 이미지)
    """
    # 파일 확장자 검증
    allowed_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 파일 형식입니다. 허용된 형식: {', '.join(allowed_extensions)}"
        )
    
    # 고유 파일명 생성
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    upload_path = UPLOAD_DIR / unique_filename
    
    try:
        # 파일 저장
        with open(upload_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"이미지 업로드 완료: {upload_path}")
        
        # 모델 추론
        detector = get_detector()
        
        if detector.disease_model is None:
            raise HTTPException(
                status_code=503,
                detail="모델이 로드되지 않았습니다. models/ 폴더에 plant_disease.pt 파일을 배치하세요."
            )
        
        results = detector.detect(
            str(upload_path), 
            conf_threshold=conf_threshold,
            filter_by_confidence=True  # 신뢰도 기반 필터링 활성화
        )
        
        # 신뢰도 상태
        diagnosis_status = results.get("diagnosis_status", "no_detection")
        max_confidence = results.get("max_confidence", 0.0)
        
        # 응답 기본 구조
        response = {
            "success": True,
            "diagnosis_status": diagnosis_status,
            "max_confidence": round(max_confidence, 4),
            "detection_count": results.get("detection_count", 0),
            "species": {
                "name": results["species"] or "알 수 없음",
                "confidence": round(results["species_confidence"], 4)
            },
            "diseases": [
                {
                    "name": disease["name"],
                    "full_name": disease.get("full_name", disease["name"]),
                    "species": disease.get("species", ""),
                    "confidence": round(disease["confidence"], 4),
                    "bbox": disease["bbox"]
                }
                for disease in results["diseases"]
            ],
            "result_image": results["result_image"],
            "original_image": results["original_image"],
            "total_diseases_detected": len(results["diseases"])
        }
        
        # 신뢰도 기반 메시지 및 LLM 연동
        if diagnosis_status == "high_confidence" and len(results["diseases"]) > 0:
            # 55% 이상: LLM 방제법 제공
            disease_info = results["diseases"][0]
            response["status_message"] = "✅ 정확한 진단이 완료되었습니다."
            
            # LLM 방제법 생성
            try:
                advisor = get_advisor()
                treatment = advisor.get_treatment_advice(
                    plant_species=disease_info["species"],
                    disease=disease_info["name"],
                    confidence=disease_info["confidence"],
                    user_notes=user_notes
                )
                response["treatment_advice"] = treatment
                response["llm_enabled"] = True
            except Exception as e:
                logger.error(f"LLM 호출 실패: {str(e)}")
                response["treatment_advice"] = None
                response["llm_enabled"] = False
        
        elif diagnosis_status == "medium_confidence" and len(results["diseases"]) > 0:
            # 20-55%: 유사 데이터 안내
            disease_info = results["diseases"][0]
            response["status_message"] = (
                f"⚠️ 정확한 진단이 어렵습니다. "
                f"현재 이미지에서 {disease_info['species']}의 {disease_info['name']}일 가능성"
                f"({max_confidence * 100:.1f}%)이 가장 높게 탐지되었습니다. "
                f"사진을 좀 더 선명하게 찍어주시거나, 잎사귀 하나를 확대하여 다시 시도해 주세요."
            )
            response["treatment_advice"] = None
            response["llm_enabled"] = False
        
        elif diagnosis_status == "low_confidence":
            # 20% 미만: 탐지 실패
            response["status_message"] = (
                "❌ 사진이 선명하지 않거나, 인식할 수 없는 식물입니다. "
                "더 선명한 사진으로 재시도하거나, 탐지 대상 식물의 잎사귀가 "
                "사진 중앙에 오도록 다시 촬영해 주세요."
            )
            response["treatment_advice"] = None
            response["llm_enabled"] = False
        
        else:
            # 감지 안 됨
            response["status_message"] = (
                "❌ 식물 잎을 감지하지 못했습니다. "
                "잎사귀가 선명하게 보이도록 다시 촬영해 주세요."
            )
            response["treatment_advice"] = None
            response["llm_enabled"] = False
        
        logger.info(
            f"감지 완료: 상태={diagnosis_status}, 식물={results['species']}, "
            f"신뢰도={max_confidence:.2%}, 질병 수={len(results['diseases'])}"
        )
        
        return JSONResponse(content=response)
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"처리 중 오류 발생: {str(e)}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")
    
    finally:
        # 업로드된 파일 삭제 (선택사항 - 디스크 공간 절약)
        try:
            if upload_path.exists():
                upload_path.unlink()
                logger.info(f"임시 파일 삭제: {upload_path}")
        except Exception as e:
            logger.warning(f"임시 파일 삭제 실패: {str(e)}")


@app.delete("/api/cleanup")
async def cleanup_files():
    """업로드 및 결과 파일 정리 (관리용)"""
    try:
        deleted_uploads = 0
        deleted_results = 0
        
        # uploads 폴더 정리
        for file_path in UPLOAD_DIR.glob("*"):
            if file_path.is_file():
                file_path.unlink()
                deleted_uploads += 1
        
        # results 폴더 정리
        for file_path in RESULTS_DIR.glob("*"):
            if file_path.is_file():
                file_path.unlink()
                deleted_results += 1
        
        return {
            "success": True,
            "deleted": {
                "uploads": deleted_uploads,
                "results": deleted_results
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"정리 중 오류: {str(e)}")


if __name__ == "__main__":
    print("=" * 60)
    print("Plant Disease Detection API Server")
    print("=" * 60)
    print("Server: http://127.0.0.1:8000")
    print("API Docs: http://127.0.0.1:8000/docs")
    print("=" * 60)
    
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

