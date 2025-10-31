"""
YOLOv8 단일 모델 추론 로직
- 병충해 감지 모델 (Detection) 하나로 식물 종과 병충해 모두 감지
- 클래스명 예: "Apple Scab Leaf", "Corn Gray leaf spot" 등
"""
import os
import base64
import cv2
import re
import numpy as np
from pathlib import Path
from ultralytics import YOLO
from typing import Dict, List, Tuple, Optional
from collections import Counter
import logging
import torch
from scipy.ndimage import gaussian_filter

# PyTorch 2.6+ 호환성: Ultralytics 클래스를 안전한 글로벌로 등록
try:
    from ultralytics.nn.tasks import DetectionModel, ClassificationModel
    torch.serialization.add_safe_globals([DetectionModel, ClassificationModel])
except Exception:
    pass  # 이전 버전에서는 무시

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PlantDiseaseDetector:
    """식물 종 분류 및 병충해 감지를 위한 단일 모델 클래스"""
    
    def __init__(
        self, 
        disease_model_path: str = "models/plant_disease.pt"
    ):
        """
        Args:
            disease_model_path: 병충해 감지 모델 경로 (식물 종 + 병충해 통합)
        """
        self.disease_model_path = disease_model_path
        
        # 모델 로드
        self.disease_model = None
        
        # 하위 호환성을 위한 속성 (기존 코드와 호환)
        self.species_model = None
        
        self._load_models()
    
    def _load_models(self):
        """모델 파일을 로드합니다."""
        try:
            # 병충해 감지 모델 로드 (Detection - 식물 종 + 병충해 통합)
            if os.path.exists(self.disease_model_path):
                logger.info(f"통합 병충해 감지 모델 로드 중: {self.disease_model_path}")
                self.disease_model = YOLO(self.disease_model_path)
                logger.info("✅ 모델 로드 완료!")
            else:
                logger.warning(f"⚠️  병충해 감지 모델을 찾을 수 없습니다: {self.disease_model_path}")
                logger.warning("   models/ 폴더에 best.pt를 plant_disease.pt로 저장하세요.")
                
        except Exception as e:
            logger.error(f"모델 로드 중 오류 발생: {str(e)}")
            raise
    
    def _parse_class_name(self, class_name: str) -> Tuple[str, str]:
        """
        클래스명에서 식물 종과 병충해를 분리합니다.
        
        예시:
        - "Apple Scab Leaf" -> ("Apple", "Scab Leaf")
        - "Corn Gray leaf spot" -> ("Corn", "Gray leaf spot")
        - "Tomato Early blight" -> ("Tomato", "Early blight")
        - "Pepper bell Bacterial spot" -> ("Pepper bell", "Bacterial spot")
        
        Args:
            class_name: 원본 클래스명
            
        Returns:
            (식물 종, 병충해명)
        """
        # 일반적인 병충해 키워드
        disease_keywords = [
            'scab', 'spot', 'blight', 'rot', 'mold', 'mildew', 'rust', 
            'wilt', 'mosaic', 'curl', 'virus', 'bacterial', 'fungal',
            'leaf', 'healthy', 'disease', 'canker', 'anthracnose'
        ]
        
        # 소문자로 변환하여 검색
        class_lower = class_name.lower()
        words = class_name.split()
        
        # 병충해 키워드가 시작되는 위치 찾기
        split_index = len(words)
        for i, word in enumerate(words):
            word_lower = word.lower()
            for keyword in disease_keywords:
                if keyword in word_lower:
                    split_index = i
                    break
            if split_index < len(words):
                break
        
        # 분리
        if split_index == 0:
            # 키워드를 찾지 못한 경우 첫 단어를 식물 종으로
            species = words[0] if len(words) > 0 else class_name
            disease = ' '.join(words[1:]) if len(words) > 1 else "알 수 없음"
        elif split_index == len(words):
            # 병충해 키워드가 없는 경우 (건강한 식물일 수도 있음)
            species = class_name
            disease = "정상"
        else:
            species = ' '.join(words[:split_index])
            disease = ' '.join(words[split_index:])
        
        return species, disease
    
    def detect(
        self, 
        image_path: str, 
        conf_threshold: float = 0.01,
        filter_by_confidence: bool = True  # 신뢰도 기반 필터링 활성화
    ) -> Dict:
        """
        이미지에서 식물 종과 병충해를 감지합니다.
        
        Args:
            image_path: 분석할 이미지 경로
            conf_threshold: 신뢰도 임계값
            
        Returns:
            감지 결과를 담은 딕셔너리
        """
        results = {
            "species": None,
            "species_confidence": 0.0,
            "diseases": [],
            "result_image": None,
            "original_image": None,
            "diagnosis_status": "no_detection",  # no_detection, low_confidence, medium_confidence, high_confidence
            "max_confidence": 0.0,  # 가장 높은 신뢰도
            "detection_count": 0  # 감지된 총 객체 수
        }
        
        try:
            # 원본 이미지 로드
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError(f"이미지를 로드할 수 없습니다: {image_path}")
            
            # 원본 이미지 base64 인코딩
            _, buffer = cv2.imencode('.jpg', img)
            results["original_image"] = base64.b64encode(buffer).decode('utf-8')
            
            # 모델이 없으면 오류
            if self.disease_model is None:
                logger.error("모델이 로드되지 않았습니다!")
                results["result_image"] = results["original_image"]
                return results
            
            # Detection 수행
            detection_results = self.disease_model(image_path, conf=conf_threshold)
            
            # 🔍 디버깅: 모든 예측 결과 출력 (신뢰도 무관)
            logger.info(f"🔍 디버깅 모드 - 예측 결과 분석:")
            if len(detection_results) > 0:
                raw_result = detection_results[0]
                if hasattr(raw_result, 'boxes') and raw_result.boxes is not None:
                    all_boxes = raw_result.boxes
                    logger.info(f"   총 예측 수: {len(all_boxes)}")
                    
                    # 모든 예측 출력 (신뢰도 포함)
                    for i, box in enumerate(all_boxes[:10]):  # 최대 10개만
                        conf = float(box.conf[0])
                        cls_id = int(box.cls[0])
                        cls_name = raw_result.names[cls_id]
                        logger.info(f"   [{i+1}] {cls_name}: 신뢰도 {conf:.4f} (임계값: {conf_threshold})")
                    
                    if len(all_boxes) > 10:
                        logger.info(f"   ... 외 {len(all_boxes) - 10}개 더")
                else:
                    logger.warning(f"   ⚠️ boxes 속성이 없거나 None입니다")
            else:
                logger.warning(f"   ⚠️ detection_results가 비어있습니다")
            
            if len(detection_results) > 0:
                result = detection_results[0]
                
                all_detections = []
                
                # 바운딩 박스가 있는 경우
                if result.boxes is not None and len(result.boxes) > 0:
                    results["detection_count"] = len(result.boxes)
                    
                    # 모든 감지 결과 수집
                    for box in result.boxes:
                        # 바운딩 박스 좌표
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        
                        # 신뢰도
                        confidence = float(box.conf[0])
                        
                        # 클래스 이름
                        class_id = int(box.cls[0])
                        class_name = result.names[class_id]
                        
                        # 클래스명에서 식물 종과 병충해 분리
                        species, disease = self._parse_class_name(class_name)
                        
                        all_detections.append({
                            "name": disease,
                            "full_name": class_name,
                            "species": species,
                            "confidence": confidence,
                            "bbox": [float(x1), float(y1), float(x2), float(y2)]
                        })
                    
                    # 신뢰도 기반 필터링
                    if filter_by_confidence and all_detections:
                        # 신뢰도순 정렬
                        all_detections.sort(key=lambda x: x["confidence"], reverse=True)
                        max_conf = all_detections[0]["confidence"]
                        results["max_confidence"] = max_conf
                        
                        # 신뢰도 기반 상태 결정 및 필터링
                        if max_conf >= 0.55:  # 55% 이상
                            results["diagnosis_status"] = "high_confidence"
                            # 가장 높은 신뢰도 하나만 선택
                            selected = all_detections[0]
                            results["diseases"] = [selected]
                            results["species"] = selected["species"]
                            results["species_confidence"] = selected["confidence"]
                            logger.info(f"✅ 고신뢰도 진단: {selected['species']} - {selected['name']} ({max_conf:.2%})")
                        
                        elif max_conf >= 0.20:  # 20-55%
                            results["diagnosis_status"] = "medium_confidence"
                            # 가장 높은 신뢰도 정보만 제공 (방제법 없음)
                            selected = all_detections[0]
                            results["diseases"] = [selected]
                            results["species"] = selected["species"]
                            results["species_confidence"] = selected["confidence"]
                            logger.info(f"⚠️  중간신뢰도: {selected['species']} - {selected['name']} ({max_conf:.2%})")
                        
                        else:  # 20% 미만
                            results["diagnosis_status"] = "low_confidence"
                            # 가장 높은 신뢰도 정보는 제공하되 진단 실패로 처리
                            selected = all_detections[0]
                            results["diseases"] = [selected]
                            results["species"] = selected["species"]
                            results["species_confidence"] = selected["confidence"]
                            logger.info(f"❌ 저신뢰도: {selected['species']} - {selected['name']} ({max_conf:.2%})")
                    
                    else:
                        # 필터링 없이 모든 결과 반환
                        results["diseases"] = all_detections
                        if all_detections:
                            all_detections.sort(key=lambda x: x["confidence"], reverse=True)
                            results["species"] = all_detections[0]["species"]
                            results["species_confidence"] = all_detections[0]["confidence"]
                            results["max_confidence"] = all_detections[0]["confidence"]
                
                # 진단 상태 추출
                diagnosis_status = results.get("diagnosis_status", "no_detection")
                
                # 시각적 표현: 신뢰도 기반 커스텀 렌더링
                if filter_by_confidence and diagnosis_status == "high_confidence" and len(results["diseases"]) > 0:
                    # 고신뢰도: 블러 배경 + 초점 강조 원형 영역으로 표시
                    annotated_img = self._render_blur_focus(
                        img, 
                        results["diseases"][0],
                        diagnosis_status
                    )
                else:
                    # 기본 렌더링
                    annotated_img = result.plot()
                
                _, buffer = cv2.imencode('.jpg', annotated_img)
                results["result_image"] = base64.b64encode(buffer).decode('utf-8')
            else:
                # 결과가 없으면 원본 이미지 사용
                results["result_image"] = results["original_image"]
            
            return results
            
        except Exception as e:
            logger.error(f"감지 중 오류 발생: {str(e)}")
            raise
    
    def _render_blur_focus(
        self, 
        image: np.ndarray, 
        detection: Dict,
        diagnosis_status: str
    ) -> np.ndarray:
        """
        블러 배경 + 초점 강조 원형 영역으로 시각화합니다.
        
        Args:
            image: 원본 이미지
            detection: 감지 정보 (bbox, name, confidence 포함)
            diagnosis_status: 진단 상태
            
        Returns:
            블러 초점 처리된 이미지
        """
        try:
            logger.info(f"🎯 블러 초점 렌더링 시작: {detection['name']}")
            
            h, w = image.shape[:2]
            logger.info(f"   이미지 크기: {w}x{h}")
            
            # 1. Bounding box 정보 추출
            x1, y1, x2, y2 = [int(coord) for coord in detection["bbox"]]
            center_x = (x1 + x2) // 2
            center_y = (y1 + y2) // 2
            width = x2 - x1
            height = y2 - y1
            logger.info(f"   중심: ({center_x}, {center_y}), 크기: {width}x{height}")
            
            # 2. 원형 반지름 계산 (bbox 대각선의 60%)
            diagonal = int(np.sqrt(width**2 + height**2))
            focus_radius = int(diagonal * 0.6)
            logger.info(f"   초점 반지름: {focus_radius}px")
            
            # 3. 색상 결정
            if diagnosis_status == "high_confidence":
                is_healthy = any(keyword in detection["name"].lower() 
                               for keyword in ["healthy", "normal", "정상"])
                
                if is_healthy:
                    border_color = (50, 255, 100)  # 밝은 녹색
                    logger.info(f"   테두리 색상: 녹색 (건강)")
                else:
                    border_color = (50, 100, 255)  # 주황-빨강
                    logger.info(f"   테두리 색상: 붉은색 (병충해)")
            else:
                border_color = (100, 200, 255)  # 노란색
            
            # 4. 전체 이미지 블러 처리
            blurred = cv2.GaussianBlur(image, (51, 51), 30)
            logger.info(f"   배경 블러 적용 완료")
            
            # 5. 원형 마스크 생성 (부드러운 그라데이션)
            mask = np.zeros((h, w), dtype=np.float32)
            
            # 원형 마스크를 거리 기반으로 생성
            y_coords, x_coords = np.ogrid[:h, :w]
            distances = np.sqrt((x_coords - center_x)**2 + (y_coords - center_y)**2)
            
            # 중심에서 멀어질수록 값이 작아짐 (중심=1.0, 반지름 밖=0.0)
            mask = np.clip(1.0 - (distances / focus_radius), 0, 1)
            
            # 가우시안 블러로 더 부드럽게
            mask = gaussian_filter(mask, sigma=15)
            mask = np.clip(mask, 0, 1)
            logger.info(f"   원형 마스크 생성 완료")
            
            # 6. 마스크를 3채널로 확장
            mask_3ch = np.stack([mask] * 3, axis=2)
            
            # 7. 원본과 블러 이미지 블렌딩 (마스크 영역은 선명하게)
            result = (image * mask_3ch + blurred * (1 - mask_3ch)).astype(np.uint8)
            logger.info(f"   이미지 블렌딩 완료")
            
            # 8. 원형 테두리 추가 (여러 레이어로 부드럽게)
            for i in range(5):
                thickness = 3 - int(i * 0.5)
                alpha = 1.0 - (i * 0.15)
                radius = focus_radius + i * 2
                
                color = tuple(int(c * alpha) for c in border_color)
                cv2.circle(result, (center_x, center_y), radius, color, thickness)
            
            # 9. 중심 포인트 표시
            cv2.circle(result, (center_x, center_y), 6, border_color, -1)
            cv2.circle(result, (center_x, center_y), 6, (255, 255, 255), 2)
            
            logger.info(f"✅ 블러 초점 렌더링 완료!")
            return result
            
        except Exception as e:
            logger.error(f"❌ 렌더링 오류: {str(e)}")
            logger.error(f"   detection: {detection}")
            import traceback
            traceback.print_exc()
            return image.copy()
    
    def save_result_image(self, image_base64: str, output_path: str):
        """
        base64 인코딩된 이미지를 파일로 저장합니다.
        
        Args:
            image_base64: base64 인코딩된 이미지
            output_path: 저장할 경로
        """
        try:
            img_data = base64.b64decode(image_base64)
            with open(output_path, 'wb') as f:
                f.write(img_data)
            logger.info(f"결과 이미지 저장 완료: {output_path}")
        except Exception as e:
            logger.error(f"이미지 저장 중 오류: {str(e)}")
            raise


# 싱글톤 인스턴스 (애플리케이션 전역에서 사용)
_detector_instance: Optional[PlantDiseaseDetector] = None


def get_detector() -> PlantDiseaseDetector:
    """
    PlantDiseaseDetector 싱글톤 인스턴스를 반환합니다.
    """
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = PlantDiseaseDetector()
    return _detector_instance
