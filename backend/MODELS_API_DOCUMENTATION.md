# 사용된 모델 및 API 문서

## 📋 개요
이 문서는 백엔드에서 사용되는 AI 모델과 API를 정리한 것입니다.

## 🤖 사용된 모델 목록

### 1. 식물 종 식별 모델

#### 1.1 umutbozdag/plant-identity (로컬 모델)
- **용도**: 식물 종 식별 (20종 전문 모델)
- **언어**: Python (Transformers 라이브러리)
- **프레임워크**: PyTorch
- **모델 타입**: Vision Transformer (ViT) 기반 이미지 분류 모델
- **로딩 위치**: `app/services/classifier.py`의 `load_classifier()` 함수
- **사용 함수**: `classify_plant()`
- **API 엔드포인트**: `/api/plant/analyze`

**설정:**
```python
# app/config.py
plant_classifier_model: str = "umutbozdag/plant-identity"
```

**특징:**
- Hugging Face Hub에서 자동 다운로드
- 로컬에서 실행 (API 키 불필요)
- GPU 자동 감지 및 사용
- 첫 실행 후 모델 캐싱 (`model_cache/` 디렉토리)

#### 1.2 PlantRecog API (외부 API)
- **용도**: 식물 종 식별 (299종 꽃 인식)
- **언어**: Python (requests 라이브러리)
- **API 엔드포인트**: `https://plantrecog.sarthak.work/predict`
- **사용 함수**: `classify_plant_with_plantrecog()`
- **API 엔드포인트**: `/api/plant/analyze-v2`

**특징:**
- 외부 REST API 호출
- 인터넷 연결 필요
- 30초 타임아웃 설정

#### 1.3 자동 모델 선택 (Auto Select)
- **용도**: 두 모델을 모두 실행하고 더 신뢰도 높은 결과 자동 선택
- **언어**: Python
- **로직**:
  - 모델1 (umutbozdag/plant-identity) 신뢰도 ≥ 50% → 모델1 사용
  - 모델1 신뢰도 < 50% → 모델2 (PlantRecog) 사용
- **사용 함수**: `classify_plant_auto_select()`, `classify_plant_auto_select_kr()`
- **API 엔드포인트**: `/api/plant/analyze-auto`

### 2. 번역 모델

#### 2.1 facebook/nllb-200-distilled-600M
- **용도**: 영어 식물 이름을 한국어로 번역
- **언어**: Python (Transformers 라이브러리)
- **프레임워크**: PyTorch
- **모델 타입**: NLLB (No Language Left Behind) 기반 번역 모델
- **로딩 위치**: `app/services/classifier.py`의 `load_translator()` 함수
- **사용 함수**: `translate_to_korean()`

**특징:**
- eng_Latn → kor_Hang 번역
- 번역 결과 캐싱 (중복 번역 방지)
- 모델 로딩 실패 시 원문 반환

### 3. 텍스트 생성 모델

#### 3.1 GPT-2 (gpt2)
- **용도**: 관리 가이드 및 성장 분석 텍스트 생성 (현재는 기본 템플릿 사용)
- **언어**: Python (Transformers 라이브러리)
- **프레임워크**: PyTorch
- **모델 타입**: Causal Language Model
- **로딩 위치**: `app/services/guide.py`의 `load_text_generator()` 함수
- **현재 상태**: 모델은 로드되지만 실제 사용은 기본 템플릿 기반 (`get_default_care_guide()`)

**설정:**
```python
# app/config.py
text_generation_model: str = "gpt2"
```

**참고:**
- 현재는 규칙 기반 템플릿 사용 (한국어 지원 제한 및 리소스 절감)
- 실제 AI 생성이 필요한 경우 함수 내부 코드 활성화 필요

### 4. 이미지 생성 모델

#### 4.1 Stability AI SD-Turbo (stabilityai/sd-turbo)
- **용도**: 성장 예측 이미지 생성 (현재는 비활성화)
- **언어**: Python (Diffusers 라이브러리)
- **프레임워크**: PyTorch
- **모델 타입**: Stable Diffusion 기반 텍스트-이미지 생성
- **로딩 위치**: `app/services/growth.py`의 `load_image_generator()` 함수
- **현재 상태**: 모델은 준비되어 있으나 실제 생성은 비활성화 (리소스 절감)

**설정:**
```python
# app/config.py
image_generation_model: str = "stabilityai/sd-turbo"
```

## 📊 데이터 저장 방식

### 로컬 스토리지 (메모리 기반)
- **용도**: 성장 기록 저장 (임시 저장)
- **언어**: Python (SQLite)
- **위치**: `app/services/db_utils.py`
- **저장 방식**: 
  - SQLite 데이터베이스 파일 (`plant_growth.db`)
  - 웹 서버 실행 중에만 유지
  - 서버 종료 시 데이터 유지 (파일 기반)
  - **참고**: 요구사항에 따라 메모리 기반으로 변경 가능

**함수:**
- `save_growth_log(plant_id, date, height)`: 성장 기록 저장
- `load_growth_history(plant_id)`: 성장 기록 조회

**API 엔드포인트:**
- `POST /api/plant/update-growth`: 성장 기록 저장
- `GET /api/plant/growth-insight-v2?plant_id=...`: 성장 기록 조회 및 분석

## 🔧 기술 스택 요약

### Python 라이브러리
- **FastAPI**: 웹 프레임워크
- **Transformers**: Hugging Face 모델 라이브러리
- **PyTorch**: 딥러닝 프레임워크
- **Diffusers**: 이미지 생성 라이브러리
- **SQLite**: 로컬 데이터베이스
- **Pillow**: 이미지 처리
- **Requests**: HTTP 요청

### 모델 저장 위치
- **로컬 캐시**: `./model_cache/` (설정: `app/config.py`의 `cache_dir`)
- **데이터베이스**: `./plant_growth.db` (SQLite 파일)

## 📝 주요 API 엔드포인트

1. **종분석**: `POST /api/plant/analyze-auto` (자동 모델 선택)
2. **병충해**: (별도 구현 예정)
3. **성장예측 그래프**: `POST /api/plant/growth-insight` (종분석 데이터 기반)

## 🚀 모델 로딩 전략

1. **전역 변수 캐싱**: 각 모델은 전역 변수로 한 번만 로드
2. **지연 로딩**: 첫 사용 시 자동 로드
3. **GPU 자동 감지**: CUDA 사용 가능 시 자동 GPU 할당
4. **에러 처리**: 모델 로딩 실패 시 기본값 반환

## 📌 참고사항

- 모든 모델은 Hugging Face Hub에서 자동 다운로드
- 첫 실행 시 인터넷 연결 필요
- 모델은 `model_cache/` 디렉토리에 저장되어 재사용
- GPU 메모리가 부족한 경우 CPU로 자동 전환
- Hugging Face 토큰은 선택사항 (rate limit 완화용)

