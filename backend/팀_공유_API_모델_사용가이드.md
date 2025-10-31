# 📚 팀 공유: API 및 모델 사용 가이드

> **작성일**: 2024년 최신 버전  
> **목적**: 백엔드에서 사용하는 API와 모델에 대한 명확한 이해를 돕기 위한 문서

---

## 🎯 목차

1. [주요 기능별 모델 사용 현황](#주요-기능별-모델-사용-현황)
2. [API 엔드포인트 상세 설명](#api-엔드포인트-상세-설명)
3. [데이터 흐름도](#데이터-흐름도)
4. [주요 변경 사항](#주요-변경-사항)

---

## 주요 기능별 모델 사용 현황

### 1️⃣ 식물 종 식별 (Plant Identification)

#### **현재 사용 중인 방법**

| 모델/서비스 | 용도 | 상태 | 특징 |
|------------|------|------|------|
| **umutbozdag/plant-identity** | 20종 전문 식물 식별 | ✅ **활성화** | 로컬 실행, GPU 자동 감지 |
| **PlantRecog API** | 299종 꽃 인식 | ✅ **활성화** | 외부 REST API (인터넷 필요) |
| **자동 선택 로직** | 두 모델 비교 후 최적 선택 | ✅ **활성화** | 신뢰도 기반 자동 선택 |

#### **자동 선택 로직 설명**

```
식물 이미지 업로드
    ↓
모델1 (umutbozdag/plant-identity) 실행
    ↓
신뢰도 ≥ 50%? 
    ├─ YES → 모델1 결과 사용 ✅
    └─ NO  → 모델2 (PlantRecog API) 실행 후 결과 사용
```

**사용 위치**: `app/services/classifier.py`  
**API 엔드포인트**: `POST /api/plant/analyze-auto`  
**한국어 번역**: `facebook/nllb-200-distilled-600M` 모델 자동 사용

---

### 2️⃣ 성장 예측 그래프 (Growth Prediction)

#### **알고리즘: 로지스틱 곡선 기반**

**AI 모델 사용 안 함** - 순수 수학 계산 알고리즘

- **언어**: Python (NumPy 기반)
- **실행 위치**: `app/services/growth.py`
- **생성되는 데이터**:
  - ✅ **좋은 조건 성장 그래프**: 최적 관리 시 성장 예측 (30% 빠른 성장)
  - ⚠️ **나쁜 조건 성장 그래프**: 관리 부족 시 성장 예측 (30% 느린 성장)

**차트 데이터 구조**:
```json
{
  "growth_graph": {
    "good_growth": [
      {"period": 0, "size": 9.0},
      {"period": 1, "size": 12.5},
      ...
    ],
    "bad_growth": [
      {"period": 0, "size": 9.0},
      {"period": 1, "size": 11.0},
      ...
    ],
    "min_size": 8.0,
    "max_size": 22.2,
    "period_unit": "month"
  }
}
```

**API 엔드포인트**: 
- `POST /api/plant/growth-insight` (이미지 있을 때)
- `GET /api/plant/monthly-data-analysis?plant_name=...` (저장된 데이터 기반)

---

### 3️⃣ 텍스트 생성 (Text Generation)

#### **현재 사용 중인 방법**

| 모델/방법 | 상태 | 설명 |
|----------|------|------|
| **Qwen 모델 (llama.cpp)** | ⚠️ **선택적 활성화** | 로컬 LLM (옵션) |
| **템플릿 기반 생성** | ✅ **기본 사용** | 빠르고 안정적 (무료) |

#### **동작 방식**

```
텍스트 생성 요청
    ↓
LLM_PROVIDER 환경변수 확인
    ├─ "none" 또는 모델 파일 없음 → 템플릿 폴백 사용 ✅ (기본값)
    └─ "llama_cpp" + 모델 파일 있음 → Qwen 모델 시도 (타임아웃: 10초)
                                           ↓
                                    실패 시 템플릿 폴백
```

**사용 위치**: `app/services/textgen_adapter.py`  
**환경변수 설정**:
```bash
LLM_PROVIDER=none  # 기본값 (템플릿 사용)
# 또는
LLM_PROVIDER=llama_cpp  # Qwen 모델 사용 (선택사항)
LLM_MODEL_PATH=./models/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf
LLM_TIMEOUT=10  # 타임아웃 (초)
```

**⚠️ 중요**: 
- 기본값은 `LLM_PROVIDER=none` (템플릿 기반 사용)
- Qwen 모델은 선택사항이며, 타임아웃 내 완료하지 못하면 자동으로 템플릿 폴백 사용

#### **비활성화된 모델**

| 모델 | 상태 | 이유 |
|------|------|------|
| **koGPT2 (skt/kogpt2-base-v2)** | ❌ **비활성화** | Qwen 모델 사용으로 변경 |
| **GPT-2 (gpt2)** | ❌ **비활성화** | 한국어 지원 제한 |

**변경 내역**:
- `app/services/guide.py`: `load_text_generator()` 비활성화
- `app/config.py`: `text_generation_model="none"` 설정

---

### 4️⃣ 번역 (Translation)

#### **모델: facebook/nllb-200-distilled-600M**

- **용도**: 영어 식물 이름 → 한국어 번역
- **상태**: ✅ **활성화**
- **번역 방향**: `eng_Latn` → `kor_Hang`
- **특징**: 
  - 번역 결과 캐싱 (중복 번역 방지)
  - 모델 로딩 실패 시 원문 반환
- **사용 위치**: `app/services/classifier.py`

---

### 5️⃣ 이미지 생성 (Image Generation)

| 모델 | 상태 | 설명 |
|------|------|------|
| **Stability AI SD-Turbo** | ❌ **비활성화** | 리소스 절감을 위해 미사용 |

---

## API 엔드포인트 상세 설명

### 🌿 **종분석 API**

#### `POST /api/plant/analyze-auto`

**기능**: 식물 이미지를 업로드하여 종을 자동 분석 (한국어 결과)

**요청**:
```bash
curl -X POST "http://localhost:8000/api/plant/analyze-auto" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@plant_image.jpg"
```

**응답**:
```json
{
  "identification": {
    "plant_name": "장미",
    "scientific_name": "Rosa",
    "confidence": 0.95,
    "common_names": ["장미꽃", "로즈"]
  },
  "care_guide": { ... },
  "growth_prediction": { ... },
  "success": true
}
```

**사용 모델**:
1. `umutbozdag/plant-identity` (20종 전문)
2. `PlantRecog API` (299종, 외부 API)
3. 자동 선택 로직 적용
4. `facebook/nllb-200-distilled-600M` (번역)

---

### 📈 **성장 예측 그래프 API**

#### `POST /api/plant/growth-insight`

**기능**: 식물 이미지 기반 성장 예측 그래프 생성

**요청**:
```bash
curl -X POST "http://localhost:8000/api/plant/growth-insight?period_unit=month&max_periods=12" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@plant_image.jpg"
```

**응답**:
```json
{
  "identification": { ... },
  "growth_graph": {
    "good_growth": [
      {"period": 0, "size": 9.0},
      {"period": 1, "size": 12.5},
      ...
    ],
    "bad_growth": [
      {"period": 0, "size": 9.0},
      {"period": 1, "size": 11.0},
      ...
    ],
    "min_size": 8.0,
    "max_size": 22.2,
    "period_unit": "month"
  },
  "monthly_data": [
    {
      "period": "현재",
      "expected_height": 9.0,
      "good_condition_height": 9.0,
      "bad_condition_height": 9.0
    },
    ...
  ],
  "comprehensive_analysis": "요약\n- 대상: 장미...",
  "success": true
}
```

**사용 기술**:
- **종분석**: `classify_plant_auto_select_kr()`
- **그래프 생성**: 로지스틱 곡선 알고리즘 (순수 계산)
- **텍스트 분석**: 템플릿 기반 또는 Qwen LLM (선택적)

---

#### `GET /api/plant/monthly-data-analysis`

**기능**: 저장된 식물 데이터 기반 월별 분석 (이미지 없을 때)

**요청**:
```bash
curl "http://localhost:8000/api/plant/monthly-data-analysis?plant_name=장미&max_months=12"
```

**응답**: `growth_graph` 포함 (최신 업데이트)

**데이터 저장 위치**: `../plant-care-final/data/identifications.json`

---

## 데이터 흐름도

### 🔄 **성장 예측 전체 흐름**

```
[프론트엔드]
  ↓ 이미지 업로드 또는 저장된 데이터 사용
[백엔드 API]
  ├─ 이미지 있음 → POST /api/plant/growth-insight
  │     ├─ 종분석 (classify_plant_auto_select_kr)
  │     ├─ 데이터 저장 (save_identification_data)
  │     ├─ 그래프 생성 (generate_growth_graph)
  │     ├─ 월별 데이터 생성
  │     └─ 텍스트 분석 (render_plant_analysis)
  │
  └─ 이미지 없음 → GET /api/plant/monthly-data-analysis
        ├─ 저장된 데이터 로드 (load_identification_data)
        ├─ 그래프 생성 (generate_growth_graph)
        ├─ 월별 데이터 생성
        └─ 텍스트 분석 (render_plant_analysis)
  ↓
[응답 반환]
  ├─ growth_graph (차트 데이터)
  ├─ monthly_data (월별 테이블)
  └─ comprehensive_analysis (AI 분석 텍스트)
```

---

## 주요 변경 사항

### ✅ **최근 업데이트 (2024년)**

1. **LLM 모델 변경**
   - ❌ koGPT2 비활성화
   - ✅ Qwen 모델 지원 추가 (선택적)
   - ✅ 템플릿 폴백 기본 사용 (빠르고 안정적)

2. **타임아웃 추가**
   - LLM 호출 타임아웃: 10초 (기본값)
   - 타임아웃 초과 시 자동 템플릿 폴백

3. **차트 데이터 포함**
   - `monthly-data-analysis` API에 `growth_graph` 필드 추가
   - 프론트엔드에서 차트 표시 가능

4. **디버깅 로그 추가**
   - 데이터 저장/로드 과정 로깅
   - 차트 데이터 확인 로그

---

## 기술 스택 요약

| 카테고리 | 기술 | 용도 |
|---------|------|------|
| **웹 프레임워크** | FastAPI | REST API 서버 |
| **딥러닝 프레임워크** | PyTorch | 이미지 분류 모델 실행 |
| **모델 라이브러리** | Transformers (Hugging Face) | 사전 학습 모델 사용 |
| **로컬 LLM** | llama.cpp | Qwen 모델 실행 (선택적) |
| **이미지 처리** | Pillow | 이미지 전처리 |
| **HTTP 요청** | Requests | 외부 API 호출 |
| **데이터 저장** | JSON 파일 | 식물 분석 데이터 저장 |

---

## 모델 캐싱 및 저장

### **모델 저장 위치**
```
backend/
  ├── model_cache/           # Hugging Face 모델 캐시
  │   ├── models--umutbozdag--plant-identity/
  │   ├── models--facebook--nllb-200-distilled-600M/
  │   └── ...
  └── models/                # 로컬 LLM 모델 (선택적)
      └── Qwen2.5-1.5B-Instruct-Q4_K_M.gguf
```

### **데이터 저장 위치**
```
plant-care-final/
  └── data/
      ├── identifications.json    # 식물 분석 데이터
      └── growth_history.json     # 성장 기록 (미사용)
```

---

## 환경변수 설정

### `.env` 파일 예시

```bash
# LLM 설정 (선택적)
LLM_PROVIDER=none  # "none" 또는 "llama_cpp"
LLM_MODEL_PATH=./models/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf
LLM_MAX_TOKENS=512
LLM_THREADS=8
LLM_TEMPERATURE=0.6
LLM_TIMEOUT=10

# Hugging Face 토큰 (선택적, rate limit 완화용)
HUGGINGFACE_TOKEN=your_token_here

# 캐시 디렉토리
CACHE_DIR=./model_cache
```

---

## 🔗 참고 파일

### **코드 위치**
- **API 엔드포인트**: `app/api/plant.py`
- **종분석**: `app/services/classifier.py`
- **성장예측**: `app/services/growth.py`
- **텍스트 생성**: `app/services/textgen_adapter.py`
- **데이터 저장**: `app/services/db_utils.py`
- **설정**: `app/config.py`
- **스키마**: `app/models/schemas.py`

---

## 💡 핵심 포인트

1. **모든 모델은 로컬 실행** (API 키 불필요)
2. **첫 실행 시 자동 다운로드** (Hugging Face Hub)
3. **GPU 자동 감지** (가능하면 GPU, 아니면 CPU)
4. **템플릿 폴백 기본 사용** (빠르고 안정적)
5. **Qwen LLM은 선택사항** (타임아웃 내 완료 실패 시 템플릿 사용)

---

## 📞 문의

문서에 대한 질문이나 수정 사항이 있으면 팀 리더에게 문의하세요.

**마지막 업데이트**: 2024년  
**버전**: v3.0 (LLM 모델 변경 및 차트 데이터 포함)

