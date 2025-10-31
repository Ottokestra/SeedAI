from io import BytesIO
from PIL import Image
import torch
import numpy as np
from transformers import AutoImageProcessor, AutoModelForImageClassification, pipeline
import requests
from app.config import settings
from app.models.schemas import PlantIdentification

# 전역 변수로 모델 캐싱
_classifier_model = None
_processor = None
_translation_cache = {}


def load_classifier():
    """식물 분류 모델을 로드합니다 (처음 한 번만 로드)"""
    global _classifier_model, _processor
    
    if _classifier_model is None:
        print(f"모델 로딩 중: {settings.plant_classifier_model}")
        try:
            _processor = AutoImageProcessor.from_pretrained(
                settings.plant_classifier_model,
                cache_dir=settings.cache_dir,
                token=settings.huggingface_token
            )
            _classifier_model = AutoModelForImageClassification.from_pretrained(
                settings.plant_classifier_model,
                cache_dir=settings.cache_dir,
                token=settings.huggingface_token
            )
            # GPU가 있으면 사용
            if torch.cuda.is_available():
                _classifier_model = _classifier_model.cuda()
            _classifier_model.eval()
            print("모델 로딩 완료!")
        except Exception as e:
            print(f"모델 로딩 실패: {e}")
            raise
    
    return _processor, _classifier_model


def classify_plant(image: bytes) -> PlantIdentification:
    """
    Transformers 라이브러리를 직접 사용하여 식물 종을 식별합니다.
    
    Args:
        image: 식물 이미지 바이트
        
    Returns:
        PlantIdentification: 식물 식별 결과
    """
    try:
        # 이미지 전처리
        img = Image.open(BytesIO(image))
        
        # RGB로 변환
        if img.mode != "RGB":
            img = img.convert("RGB")
        
        # 모델 로드
        processor, model = load_classifier()
        
        # 수동 이미지 전처리 (NumPy 호환성 문제 우회)
        # 224x224로 리사이즈
        img_resized = img.resize((224, 224), Image.Resampling.LANCZOS)
        
        # NumPy 배열로 변환하고 정규화
        img_array = np.array(img_resized).astype(np.float32) / 255.0
        
        # ImageNet 정규화
        mean = np.array([0.5, 0.5, 0.5])
        std = np.array([0.5, 0.5, 0.5])
        img_array = (img_array - mean) / std
        
        # (H, W, C) -> (C, H, W) 변환
        img_array = np.transpose(img_array, (2, 0, 1))
        
        # PyTorch 텐서로 변환
        pixel_values = torch.tensor(img_array, dtype=torch.float32).unsqueeze(0)
        inputs = {"pixel_values": pixel_values}
        
        # GPU로 이동 (사용 가능한 경우)
        if torch.cuda.is_available():
            inputs = {k: v.cuda() for k, v in inputs.items()}
        
        # 추론 실행
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
        
        # 결과 파싱
        # Softmax를 적용하여 확률로 변환
        probabilities = torch.nn.functional.softmax(logits, dim=-1)
        top_probs, top_indices = torch.topk(probabilities[0], k=3)
        
        # 결과 추출
        results = []
        for prob, idx in zip(top_probs, top_indices):
            label = model.config.id2label.get(int(idx), f"Class {idx}")
            results.append({
                "label": label,
                "score": float(prob)
            })
        
        if results:
            top_result = results[0]
            plant_name_en = format_plant_name(top_result["label"])
            confidence = top_result["score"]
            common_names_en = [format_plant_name(r["label"]) for r in results[:3]]
            
            # GPT-4o-mini로 식물 이름 번역
            plant_name = translate_to_korean(plant_name_en)
            common_names = [translate_to_korean(name) for name in common_names_en]
            
            return PlantIdentification(
                plant_name=plant_name,
                scientific_name=plant_name_en,  # 영어 이름을 scientific_name으로 저장
                confidence=confidence,
                common_names=common_names
            )
        else:
            return get_default_identification()
            
    except Exception as e:
        print(f"식물 분류 오류: {e}")
        return get_default_identification()


def format_plant_name(label: str) -> str:
    """레이블을 읽기 좋은 식물 이름으로 변환합니다."""
    # 언더스코어나 하이픈을 공백으로 변환
    name = label.replace("_", " ").replace("-", " ")
    # 각 단어의 첫 글자를 대문자로
    name = " ".join(word.capitalize() for word in name.split())
    return name


def get_default_identification() -> PlantIdentification:
    """기본 식별 결과를 반환합니다."""
    return PlantIdentification(
        plant_name="식물 (분석 중)",
        confidence=0.5,
        common_names=["일반 식물", "관엽 식물", "화초"]
    )


def translate_to_korean(text: str) -> str:
    """
    GPT-4o-mini를 사용하여 영어 식물 이름을 한국어로 번역합니다.
    
    Args:
        text: 영어 식물 이름
        
    Returns:
        str: 한국어 번역 결과
    """
    global _translation_cache
    
    # 이미 번역된 것이 있으면 캐시에서 반환
    if text in _translation_cache:
        return _translation_cache[text]
    
    try:
        # OpenAI 클라이언트 import
        from app.services.guide import load_openai_client
        
        client = load_openai_client()
        if client is None:
            print(f"[번역 실패] OpenAI 클라이언트 없음: {text}")
            return text
        
        # GPT-4o-mini로 식물 이름 번역
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a plant name translator. Translate English plant names to Korean names that are commonly used in South Korea. Return only the Korean name, no additional text."
                },
                {
                    "role": "user",
                    "content": f"Translate this plant name to Korean: {text}"
                }
            ],
            temperature=0.3,
            max_tokens=50
        )
        
        translated = response.choices[0].message.content.strip()
        
        # 캐시에 저장
        _translation_cache[text] = translated
        print(f"[GPT 번역] {text} → {translated}")
        
        return translated
        
    except Exception as e:
        print(f"[번역 오류] {text}: {e}")
        # 오류 발생 시 원문 반환
        return text


def classify_plant_with_plantrecog(image: bytes) -> PlantIdentification:
    """PlantRecog API를 사용하여 식물 종을 식별합니다."""
    try:
        api_url = "https://plantrecog.sarthak.work/predict"
        files = {'image': ('plant.jpg', BytesIO(image), 'image/jpeg')}
        response = requests.post(api_url, files=files, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            if result.get("message") == "Success" and "payload" in result:
                predictions = result["payload"].get("predictions", [])
                if predictions and len(predictions) > 0:
                    top_prediction = predictions[0]
                    plant_name_en = format_plant_name(top_prediction["name"])
                    confidence = top_prediction["score"]
                    common_names_en = [format_plant_name(p["name"]) for p in predictions[1:4]]
                    
                    # GPT-4o-mini로 식물 이름 번역
                    plant_name = translate_to_korean(plant_name_en)
                    common_names = [translate_to_korean(name) for name in common_names_en]
                    
                    return PlantIdentification(
                        plant_name=plant_name,
                        scientific_name=plant_name_en,  # 영어 이름을 scientific_name으로 저장
                        confidence=confidence,
                        common_names=common_names
                    )
        return get_default_identification()
    except Exception as e:
        print(f"PlantRecog API 오류: {e}")
        return get_default_identification()


def classify_plant_multi_model(image: bytes) -> dict:
    """두 모델을 모두 사용하여 식물을 식별하고 결과를 비교합니다."""
    vit_result = classify_plant(image)
    plantrecog_result = classify_plant_with_plantrecog(image)
    
    return {
        "vit_model": vit_result,
        "plantrecog_model": plantrecog_result
    }


def classify_plant_multi_model_kr(image: bytes) -> dict:
    """두 모델을 모두 사용하여 식물을 식별하고 결과를 비교합니다 (한국어 번역은 이미 적용됨)."""
    # 번역은 classify_plant, classify_plant_with_plantrecog에서 이미 적용됨
    return classify_plant_multi_model(image)


def classify_plant_auto_select(image: bytes) -> PlantIdentification:
    """
    두 모델을 실행하고 최적의 결과를 자동으로 선택합니다.
    
    선택 로직:
    - 모델1 (20종 전문)이 50% 이상 → 모델1 선택
    - 모델1이 50% 미만 → 모델2 선택 (모델1이 해당 식물을 모름)
    """
    vit_result = classify_plant(image)
    plantrecog_result = classify_plant_with_plantrecog(image)
    
    print(f"\n[자동 선택 로직]")
    print(f"  모델1 (20종 전문): {vit_result.plant_name} - {vit_result.confidence*100:.1f}%")
    print(f"  모델2 (299종 꽃): {plantrecog_result.plant_name} - {plantrecog_result.confidence*100:.1f}%")
    
    # 모델1이 50% 이상이면 모델1 우선 (전문 모델이므로 신뢰)
    if vit_result.confidence >= 0.5:
        print(f"  ✅ 선택: 모델1 (신뢰도 {vit_result.confidence*100:.1f}% >= 50%)")
        return vit_result
    
    # 모델1이 50% 미만이면 모델2 선택 (모델1이 해당 식물을 인식하지 못함)
    print(f"  ✅ 선택: 모델2 (모델1 신뢰도 {vit_result.confidence*100:.1f}% < 50%)")
    return plantrecog_result


def classify_plant_auto_select_kr(image: bytes) -> PlantIdentification:
    """
    두 모델을 실행하고 최적의 결과를 자동으로 선택합니다 (한국어 번역은 이미 적용됨).
    """
    # 번역은 classify_plant, classify_plant_with_plantrecog에서 이미 적용됨
    return classify_plant_auto_select(image)

