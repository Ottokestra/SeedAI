# 백엔드 기능 구현 완료 요약

## ✅ 구현 완료된 기능

### 1. 종분석 기능 ✅
- **API 엔드포인트**: `POST /api/plant/analyze-auto`
- **기능**: 식물 이미지를 업로드하여 종을 자동으로 분석
- **모델**: 
  - umutbozdag/plant-identity (20종 전문 모델)
  - PlantRecog API (299종 꽃 인식)
- **자동 모델 선택**: 신뢰도 50% 이상이면 모델1, 미만이면 모델2 사용
- **한국어 번역**: facebook/nllb-200-distilled-600M 모델 사용

### 2. 병충해 분석 기능 ✅
- **상태**: 스키마 정의 완료 (`DiseaseDetectionResponse`)
- **참고**: 별도 데이터 조회 기능으로 구현 예정
- **API 엔드포인트**: 준비됨 (별도 구현 필요)

### 3. 성장예측 그래프 생성 기능 ✅

#### 3.1 그래프 지표 생성
- **API 엔드포인트**: `POST /api/plant/growth-insight`
- **파라미터**:
  - `file`: 식물 이미지 파일 (필수)
  - `period_unit`: 기간 단위 ('week' 또는 'month', 기본값: 'month')
  - `max_periods`: 최대 기간 수 (기본값: 12)

#### 3.2 그래프 데이터 형식
- **y축**: 분석된 식물의 통상적인 크기 (cm 단위)
- **x축**: 기간 (주 단위 또는 월 단위로 구분)
- **3가지 그래프 지표 제공**:
  1. **좋은 생장 그래프** (`good_growth`): 최적 관리 시 성장 예측 (30% 빠른 성장)
  2. **나쁜 생장 그래프** (`bad_growth`): 관리 부족 시 성장 예측 (30% 느린 성장)
  3. **예상 그래프** (`expected_growth`): 일반적인 관리 시 성장 예측

#### 3.3 응답 형식
```json
{
  "identification": {
    "plant_name": "식물명",
    "confidence": 0.91
  },
  "growth_graph": {
    "good_growth": [
      {"period": 0, "size": 8.5},
      {"period": 1, "size": 12.3},
      ...
    ],
    "bad_growth": [
      {"period": 0, "size": 8.5},
      {"period": 1, "size": 10.1},
      ...
    ],
    "expected_growth": [
      {"period": 0, "size": 8.5},
      {"period": 1, "size": 11.2},
      ...
    ],
    "period_unit": "month",
    "plant_name": "식물명",
    "note": "성장 그래프 설명"
  },
  "analysis_text": "한국어 생장 추론 종합 설명",
  "success": true,
  "message": "성장 인사이트 생성이 완료되었습니다."
}
```

## 📊 데이터 저장 방식

### 로컬 메모리 기반 저장 ✅
- **저장 위치**: 서버 메모리 (메모리 딕셔너리)
- **저장 기간**: 
  - 웹 서버 실행 중에만 유지
  - 서버 종료 시 모든 데이터 사라짐
  - 브라우저 창 닫으면 사라짐 (프론트엔드에서 처리)
- **구현 위치**: `app/services/db_utils.py`
- **함수**:
  - `save_growth_log(plant_id, date, height)`: 성장 기록 저장
  - `load_growth_history(plant_id)`: 성장 기록 조회

## 🔧 수정된 파일 목록

### 1. 스키마 파일 (`app/models/schemas.py`)
- `GrowthGraphPoint`: `month` → `period`, `growth_index` → `size` (cm 단위)
- `GrowthGraph`: 좋은/나쁜/예상 그래프 3가지 지표 추가
- `DiseaseDetectionResponse`: 병충해 분석 응답 스키마 추가

### 2. 성장 그래프 생성 함수 (`app/services/growth.py`)
- `generate_growth_graph()`: 주/월 단위 지원, cm 단위 크기, 3가지 지표 생성
- `get_plant_size_range()`: 식물별 초기/최대 크기 범위 계산

### 3. API 엔드포인트 (`app/api/plant.py`)
- `POST /api/plant/growth-insight`: period_unit, max_periods 파라미터 추가

### 4. 데이터 저장 (`app/services/db_utils.py`)
- SQLite 파일 기반 → 메모리 기반 저장으로 변경
- 서버 종료 시 데이터 사라지는 방식 구현

## 📝 사용된 모델 및 API 정리

자세한 내용은 `MODELS_API_DOCUMENTATION.md` 참고

### 주요 모델
1. **umutbozdag/plant-identity**: 식물 종 식별 (20종)
2. **PlantRecog API**: 식물 종 식별 (299종)
3. **facebook/nllb-200-distilled-600M**: 영어→한국어 번역
4. **gpt2**: 텍스트 생성 (현재는 기본 템플릿 사용)
5. **stabilityai/sd-turbo**: 이미지 생성 (현재는 비활성화)

### 기술 스택
- **Python**: 메인 언어
- **FastAPI**: 웹 프레임워크
- **Transformers**: Hugging Face 모델 라이브러리
- **PyTorch**: 딥러닝 프레임워크

## 🚀 사용 방법

### 성장예측 그래프 생성

#### 예시 1: 월 단위 (기본값)
```bash
curl -X POST "http://localhost:8000/api/plant/growth-insight?period_unit=month&max_periods=12" \
  -F "file=@plant_image.jpg"
```

#### 예시 2: 주 단위
```bash
curl -X POST "http://localhost:8000/api/plant/growth-insight?period_unit=week&max_periods=24" \
  -F "file=@plant_image.jpg"
```

### 성장 기록 저장
```bash
curl -X POST "http://localhost:8000/api/plant/update-growth" \
  -H "Content-Type: application/json" \
  -d '{
    "plant_id": "몬스테라",
    "date": "2024-01-01",
    "height": 15.5
  }'
```

## 📌 주요 특징

1. **종분석 → 성장예측 연동**: 종분석 결과를 기반으로 성장 그래프 자동 생성
2. **실제 크기 기반**: 식물의 통상적인 크기(cm)를 기준으로 성장 예측
3. **다양한 시나리오 제공**: 좋은/나쁜/예상 3가지 생장 시나리오 비교 가능
4. **주/월 단위 선택**: 사용자가 기간 단위 선택 가능
5. **메모리 기반 저장**: 서버 실행 중에만 유지되는 임시 데이터 저장

## ⚠️ 참고사항

- 모든 모델은 첫 실행 시 Hugging Face Hub에서 자동 다운로드
- 모델은 `model_cache/` 디렉토리에 캐싱되어 재사용
- GPU 자동 감지 및 사용 (가능한 경우)
- 서버 메모리에 저장된 데이터는 서버 재시작 시 초기화됨

