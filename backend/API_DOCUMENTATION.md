# 새싹아이 API 명세서

## 📋 목차
- [API 개요](#api-개요)
- [기본 정보](#기본-정보)
- [엔드포인트 목록](#엔드포인트-목록)
- [엔드포인트 상세](#엔드포인트-상세)
- [데이터 모델](#데이터-모델)
- [에러 처리](#에러-처리)

---

## API 개요

**새싹아이**는 반려식물 생애주기 관리 AI 서비스입니다. 식물 이미지를 분석하여 종을 식별하고, GPT-4o-mini를 활용하여 맞춤형 관리법과 성장 예측을 제공합니다.

### 핵심 기능
1. 🌿 **식물 종 식별/분류** (Image Classification) ✅ *구현 완료*
2. 🐛 **식물 병충해 식별** (Image Classification) 🚧 *구현 예정*
3. 📝 **식별된 식물의 관리법** (Text Generation) ✅ *구현 완료*
4. 📈 **식별된 식물의 성장 예상 과정 표현** (Text-to-Image) 🚧 *구현 예정*
5. 🌐 **텍스트 번역** (Translation) ✅ *구현 완료*

---

## 기본 정보

| 항목 | 내용 |
|------|------|
| **Base URL** | `http://localhost:8000` (개발 환경) |
| **API 버전** | `1.0.0` |
| **인증 방식** | 없음 (현재) |
| **문서 URL** | `http://localhost:8000/docs` (Swagger UI) |
| **Content-Type** | `multipart/form-data` (이미지 업로드) |

---

## 엔드포인트 목록

| 메서드 | 경로 | 설명 | 상태 |
|--------|------|------|------|
| `GET` | `/health` | 서버 헬스체크 | ✅ |
| `GET` | `/api/plant/test` | API 테스트 엔드포인트 | ✅ |
| `POST` | `/api/plant/analyze` | 기본 식물 분석 (ViT 모델) | ✅ |
| `POST` | `/api/plant/analyze-auto` | 자동 모델 선택 분석 | ✅ |
| `POST` | `/api/plant/analyze-v2` | PlantRecog 모델 분석 | ✅ |
| `POST` | `/api/plant/compare` | 두 모델 비교 분석 | ✅ |
| `POST` | `/api/plant/disease` | 식물 병충해 식별 | 🚧 |
| `POST` | `/api/plant/growth-image` | 성장 예상 과정 이미지 생성 | 🚧 |

---

## 엔드포인트 상세

### 1. 헬스체크

서버 상태를 확인하는 엔드포인트입니다.

**요청**
```http
GET /health
```

**응답**
```json
{
  "status": "healthy",
  "message": "새싹아이 API가 정상 작동 중입니다."
}
```

**응답 코드**: `200 OK`

---

### 2. API 테스트

사용 가능한 엔드포인트 목록을 확인하는 엔드포인트입니다.

**요청**
```http
GET /api/plant/test
```

**응답**
```json
{
  "message": "식물 분석 API가 정상 작동 중입니다.",
  "endpoints": {
    "v1": "/api/plant/analyze (Google ViT)",
    "v2": "/api/plant/analyze-v2 (PlantRecog)",
    "compare": "/api/plant/compare (Both Models)"
  }
}
```

**응답 코드**: `200 OK`

---

### 3. 식물 분석 (기본 - ViT 모델)

Google ViT 모델을 사용하여 식물 이미지를 분석합니다. 식물 종 식별, 관리 가이드, 성장 예측을 한 번에 제공합니다.

**요청**
```http
POST /api/plant/analyze
Content-Type: multipart/form-data
```

**요청 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `file` | File | ✅ | 식물 이미지 파일 (최대 10MB) |

**요청 예시 (cURL)**
```bash
curl -X POST "http://localhost:8000/api/plant/analyze" \
  -F "file=@plant_image.jpg"
```

**성공 응답** (`200 OK`)
```json
{
  "identification": {
    "plant_name": "몬스테라",
    "scientific_name": "Monstera Deliciosa",
    "confidence": 0.85,
    "common_names": ["몬스테라 델리시오사", "스위스 치즈 플랜트", "스플릿 리프"]
  },
  "care_guide": {
    "watering": "주 1-2회, 토양이 건조할 때 충분히 물을 주세요.",
    "sunlight": "밝은 간접광을 선호합니다. 직사광선은 피하세요.",
    "temperature": "18-24°C의 실내 온도가 적합합니다.",
    "humidity": "중간 정도의 습도(40-60%)를 유지하세요.",
    "fertilizer": "성장기(봄-여름)에는 월 1-2회 액체 비료를 주세요.",
    "soil": "배수가 잘 되는 일반 화분용 흙을 사용하세요.",
    "tips": [
      "과습에 주의하고, 물빠짐이 잘 되는 화분을 사용하세요",
      "정기적으로 잎의 먼지를 제거하여 광합성을 돕습니다",
      "통풍이 잘 되는 곳에 두어 병해충을 예방하세요"
    ]
  },
  "growth_prediction": {
    "stages": [
      {
        "stage": "current",
        "timeframe": "현재",
        "image_url": null,
        "description": "몬스테라의 초기 단계입니다. 새로운 환경에 적응하는 시기입니다."
      },
      {
        "stage": "1_month",
        "timeframe": "1개월 후",
        "image_url": null,
        "description": "새로운 잎이 나오기 시작하며 뿌리가 자리를 잡습니다."
      },
      {
        "stage": "3_months",
        "timeframe": "3개월 후",
        "image_url": null,
        "description": "풍성한 잎과 건강한 줄기를 가진 성숙한 모습입니다."
      },
      {
        "stage": "6_months",
        "timeframe": "6개월 후",
        "image_url": null,
        "description": "완전히 성장한 몬스테라의 모습입니다."
      }
    ]
  },
  "success": true,
  "message": "몬스테라 분석이 완료되었습니다."
}
```

**에러 응답**

| 상태 코드 | 설명 | 예시 |
|-----------|------|------|
| `400` | 이미지 파일이 아니거나 크기 초과 | `{"detail": "이미지 파일만 업로드 가능합니다."}` |
| `500` | 서버 내부 오류 | `{"detail": "식물 분석 중 오류가 발생했습니다: ..."}` |

---

### 4. 식물 분석 (자동 모델 선택)

두 모델(ViT, PlantRecog)을 모두 실행하고 신뢰도가 높은 결과를 자동으로 선택합니다.

**요청**
```http
POST /api/plant/analyze-auto
Content-Type: multipart/form-data
```

**요청 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `file` | File | ✅ | 식물 이미지 파일 (최대 10MB) |

**요청 예시 (cURL)**
```bash
curl -X POST "http://localhost:8000/api/plant/analyze-auto" \
  -F "file=@plant_image.jpg"
```

**성공 응답** (`200 OK`)

응답 형식은 `/api/plant/analyze`와 동일합니다.

```json
{
  "identification": {
    "plant_name": "장미",
    "scientific_name": "Rosa",
    "confidence": 0.92,
    "common_names": ["로즈", "장미꽃"]
  },
  "care_guide": { ... },
  "growth_prediction": { ... },
  "success": true,
  "message": "장미 분석이 완료되었습니다. (자동 모델 선택)"
}
```

**모델 선택 로직**
- ViT 모델 신뢰도 ≥ 50% → ViT 모델 결과 사용
- ViT 모델 신뢰도 < 50% → PlantRecog 모델 결과 사용

---

### 5. 식물 분석 (PlantRecog 모델)

PlantRecog 모델을 사용하여 식물 이미지를 분석합니다. 299종의 꽃 인식에 특화되어 있습니다.

**요청**
```http
POST /api/plant/analyze-v2
Content-Type: multipart/form-data
```

**요청 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `file` | File | ✅ | 식물 이미지 파일 (최대 10MB) |

**요청 예시 (cURL)**
```bash
curl -X POST "http://localhost:8000/api/plant/analyze-v2" \
  -F "file=@plant_image.jpg"
```

**성공 응답** (`200 OK`)

응답 형식은 `/api/plant/analyze`와 동일합니다.

```json
{
  "identification": {
    "plant_name": "튤립",
    "scientific_name": "Tulip",
    "confidence": 0.88,
    "common_names": ["튤립", "튤리파"]
  },
  "care_guide": { ... },
  "growth_prediction": { ... },
  "success": true,
  "message": "튤립 분석이 완료되었습니다. (PlantRecog 모델)"
}
```

---

### 6. 모델 비교

두 모델의 분석 결과를 비교하여 반환합니다.

**요청**
```http
POST /api/plant/compare
Content-Type: multipart/form-data
```

**요청 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `file` | File | ✅ | 식물 이미지 파일 (최대 10MB) |

**요청 예시 (cURL)**
```bash
curl -X POST "http://localhost:8000/api/plant/compare" \
  -F "file=@plant_image.jpg"
```

**성공 응답** (`200 OK`)
```json
{
  "success": true,
  "message": "두 모델의 분석이 완료되었습니다.",
  "models": {
    "vit": {
      "name": "Google ViT (ImageNet)",
      "result": {
        "plant_name": "몬스테라",
        "scientific_name": "Monstera Deliciosa",
        "confidence": 0.85,
        "common_names": ["몬스테라 델리시오사", "스위스 치즈 플랜트"]
      }
    },
    "plantrecog": {
      "name": "PlantRecog (299 Flowers)",
      "result": {
        "plant_name": "몬스테라",
        "scientific_name": "Monstera Deliciosa",
        "confidence": 0.78,
        "common_names": ["몬스테라", "스위스 치즈 플랜트"]
      }
    }
  }
}
```

---

### 7. 식물 병충해 식별 🚧

> **구현 예정**: 백엔드 팀원이 구현 예정입니다.

식물 이미지를 분석하여 병충해를 식별합니다.

**요청**
```http
POST /api/plant/disease
Content-Type: multipart/form-data
```

**요청 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `file` | File | ✅ | 식물 이미지 파일 (최대 10MB) |

**요청 예시 (cURL)**
```bash
curl -X POST "http://localhost:8000/api/plant/disease" \
  -F "file=@plant_image.jpg"
```

**성공 응답** (`200 OK`)

> **TODO**: 백엔드 팀원이 구현 후 응답 형식을 작성해주세요.

```json
{
  // TODO: 응답 스키마 작성 필요
}
```

**에러 응답**

| 상태 코드 | 설명 | 예시 |
|-----------|------|------|
| `400` | 이미지 파일이 아니거나 크기 초과 | `{"detail": "이미지 파일만 업로드 가능합니다."}` |
| `500` | 서버 내부 오류 | `{"detail": "병충해 식별 중 오류가 발생했습니다: ..."}` |

---

### 8. 성장 예상 과정 이미지 생성 🚧

> **구현 예정**: 백엔드 팀원이 구현 예정입니다.

식별된 식물의 성장 예상 과정을 이미지로 생성합니다 (Text-to-Image).

**요청**
```http
POST /api/plant/growth-image
Content-Type: application/json
```

**요청 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `plant_name` | `string` | ✅ | 식물 이름 |
| `stage` | `string` | ✅ | 성장 단계 (예: "1_month", "3_months", "6_months") |
| `prompt` | `string` | ❌ | 추가 프롬프트 (선택사항) |

**요청 예시 (cURL)**
```bash
curl -X POST "http://localhost:8000/api/plant/growth-image" \
  -H "Content-Type: application/json" \
  -d '{
    "plant_name": "몬스테라",
    "stage": "3_months",
    "prompt": "실내 화분에서 자라는 모습"
  }'
```

**성공 응답** (`200 OK`)

> **TODO**: 백엔드 팀원이 구현 후 응답 형식을 작성해주세요.

```json
{
  // TODO: 응답 스키마 작성 필요
  // 예상: image_url 또는 base64 인코딩된 이미지 데이터
}
```

**에러 응답**

| 상태 코드 | 설명 | 예시 |
|-----------|------|------|
| `400` | 잘못된 요청 파라미터 | `{"detail": "plant_name은 필수입니다."}` |
| `500` | 서버 내부 오류 | `{"detail": "이미지 생성 중 오류가 발생했습니다: ..."}` |

---

## 데이터 모델

### PlantIdentification

식물 식별 결과를 나타내는 모델입니다.

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `plant_name` | `string` | ✅ | 식물 종명 (한국어, GPT-4o-mini로 자동 번역됨) |
| `scientific_name` | `string` | ❌ | 학명 또는 영어 이름 (원본 모델 출력) |
| `confidence` | `float` | ✅ | 신뢰도 (0.0 ~ 1.0) |
| `common_names` | `string[]` | ❌ | 일반 명칭 목록 (한국어로 번역됨) |

**참고**: 
- `plant_name`과 `common_names`는 영어로 분류된 결과를 GPT-4o-mini로 자동 번역한 한국어 이름입니다
- `scientific_name`은 원본 모델의 영어 출력값을 그대로 유지합니다
- 번역 결과는 캐시되어 동일한 식물명에 대해서는 재번역하지 않습니다

**예시**
```json
{
  "plant_name": "몬스테라",
  "scientific_name": "Monstera Deliciosa",
  "confidence": 0.85,
  "common_names": ["몬스테라 델리시오사", "스위스 치즈 플랜트"]
}
```

---

### CareGuide

식물 관리 가이드를 나타내는 모델입니다.

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `watering` | `string` | ✅ | 물주기 방법 |
| `sunlight` | `string` | ✅ | 햇빛 요구사항 |
| `temperature` | `string` | ✅ | 적정 온도 |
| `humidity` | `string` | ✅ | 습도 요구사항 |
| `fertilizer` | `string` | ✅ | 비료 사용법 |
| `soil` | `string` | ✅ | 토양 정보 |
| `tips` | `string[]` | ✅ | 관리 팁 목록 |

**예시**
```json
{
  "watering": "주 1-2회, 토양이 건조할 때 충분히 물을 주세요.",
  "sunlight": "밝은 간접광을 선호합니다.",
  "temperature": "18-24°C의 실내 온도가 적합합니다.",
  "humidity": "중간 정도의 습도(40-60%)를 유지하세요.",
  "fertilizer": "성장기(봄-여름)에는 월 1-2회 액체 비료를 주세요.",
  "soil": "배수가 잘 되는 일반 화분용 흙을 사용하세요.",
  "tips": [
    "과습에 주의하고, 물빠짐이 잘 되는 화분을 사용하세요",
    "정기적으로 잎의 먼지를 제거하여 광합성을 돕습니다",
    "통풍이 잘 되는 곳에 두어 병해충을 예방하세요"
  ]
}
```

---

### GrowthStage

성장 단계를 나타내는 모델입니다.

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `stage` | `string` | ✅ | 성장 단계 식별자 (예: "current", "1_month") |
| `timeframe` | `string` | ✅ | 시간 프레임 (예: "현재", "1개월 후") |
| `image_url` | `string` | ❌ | 성장 예측 이미지 URL |
| `description` | `string` | ✅ | 단계 설명 |

**예시**
```json
{
  "stage": "1_month",
  "timeframe": "1개월 후",
  "image_url": null,
  "description": "새로운 잎이 나오기 시작하며 뿌리가 자리를 잡습니다."
}
```

---

### GrowthPrediction

성장 예측을 나타내는 모델입니다.

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `stages` | `GrowthStage[]` | ✅ | 성장 단계 목록 |

**예시**
```json
{
  "stages": [
    {
      "stage": "current",
      "timeframe": "현재",
      "image_url": null,
      "description": "몬스테라의 초기 단계입니다."
    },
    {
      "stage": "1_month",
      "timeframe": "1개월 후",
      "image_url": null,
      "description": "새로운 잎이 나오기 시작합니다."
    }
  ]
}
```

---

### PlantAnalysisResponse

식물 분석 종합 결과를 나타내는 모델입니다.

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `identification` | `PlantIdentification` | ✅ | 식물 식별 결과 |
| `care_guide` | `CareGuide` | ✅ | 관리 가이드 |
| `growth_prediction` | `GrowthPrediction` | ✅ | 성장 예측 |
| `success` | `boolean` | ✅ | 분석 성공 여부 |
| `message` | `string` | ✅ | 응답 메시지 |

**예시**
```json
{
  "identification": { ... },
  "care_guide": { ... },
  "growth_prediction": { ... },
  "success": true,
  "message": "몬스테라 분석이 완료되었습니다."
}
```

---

### DiseaseIdentification 🚧

> **구현 예정**: 백엔드 팀원이 구현 예정입니다.

식물 병충해 식별 결과를 나타내는 모델입니다.

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `disease_name` | `string` | ✅ | 병충해 이름 |
| `confidence` | `float` | ✅ | 신뢰도 (0.0 ~ 1.0) |
| `description` | `string` | ❌ | 병충해 설명 |
| `treatment` | `string[]` | ❌ | 치료 방법 목록 |

**예시**
```json
{
  // TODO: 백엔드 팀원이 구현 후 예시 작성
}
```

---

### GrowthImageResponse 🚧

> **구현 예정**: 백엔드 팀원이 구현 예정입니다.

성장 예상 과정 이미지 생성 결과를 나타내는 모델입니다.

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `image_url` | `string` | ❌ | 생성된 이미지 URL |
| `image_base64` | `string` | ❌ | Base64 인코딩된 이미지 데이터 |
| `stage` | `string` | ✅ | 성장 단계 |

**예시**
```json
{
  // TODO: 백엔드 팀원이 구현 후 예시 작성
}
```

---

### 에러 응답 형식

모든 에러는 다음 형식으로 반환됩니다:

```json
{
  "detail": "에러 메시지"
}
```

### HTTP 상태 코드

| 상태 코드 | 설명 | 발생 상황 |
|-----------|------|-----------|
| `200` | 성공 | 요청이 정상적으로 처리됨 |
| `400` | 잘못된 요청 | 이미지 파일이 아니거나 크기 초과 |
| `500` | 서버 오류 | 모델 로딩 실패, API 호출 오류 등 |

### 에러 메시지 예시

**이미지 파일이 아닌 경우**
```json
{
  "detail": "이미지 파일만 업로드 가능합니다."
}
```

**파일 크기 초과**
```json
{
  "detail": "파일 크기는 10MB 이하여야 합니다."
}
```

**신뢰도가 낮은 경우**

식물을 정확히 식별하지 못한 경우에도 기본 관리 가이드를 제공합니다. 이 경우 `success` 필드가 `false`로 설정됩니다:

```json
{
  "identification": {
    "plant_name": "일반 관엽식물",
    "confidence": 0.05,
    ...
  },
  "care_guide": { ... },
  "growth_prediction": { ... },
  "success": false,
  "message": "식물을 정확히 식별하지 못했습니다. 일반적인 관엽식물 관리 가이드를 제공합니다. 더 명확한 이미지를 업로드하시면 정확한 정보를 받을 수 있습니다."
}
```

---

## 사용 예시

### JavaScript (Fetch API)

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:8000/api/plant/analyze', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log('식물 분석 결과:', data);
```

### Python (requests)

```python
import requests

url = "http://localhost:8000/api/plant/analyze"
files = {'file': open('plant_image.jpg', 'rb')}

response = requests.post(url, files=files)
data = response.json()

print(f"식물명: {data['identification']['plant_name']}")
print(f"신뢰도: {data['identification']['confidence'] * 100:.1f}%")
```

### React (axios)

```javascript
import axios from 'axios';

const analyzePlant = async (imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);

  try {
    const response = await axios.post(
      'http://localhost:8000/api/plant/analyze',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('분석 오류:', error.response?.data);
    throw error;
  }
};
```

---

## 참고 사항

### 지원 이미지 형식
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- 기타 일반적인 이미지 형식

### 파일 크기 제한
- 최대 10MB

### 처리 시간
- 이미지 분석: 약 2-5초
- 식물명 번역: 약 0.5-2초 (GPT-4o-mini API 호출, 캐시된 경우 즉시 반환)
- 관리 가이드 생성: 약 3-7초 (GPT-4o-mini API 호출)
- 총 처리 시간: 약 5-12초 (번역이 캐시된 경우 더 빠름)

### 모델 정보

#### 이미지 분류 모델
- **ViT 모델**: [`umutbozdag/plant-identity`](https://huggingface.co/umutbozdag/plant-identity)
  - Vision Transformer (ViT) 기반 이미지 분류 모델
  - 20종 실내 식물 분류 (알로에, 대나무, 바질, 보스턴 고사리, 아이비, 고무나무, 몬스테라, 난초, 페이스릴리, 덩굴 식물, 스네이크 플랜트, 선인장 등)
  - 정확도: 약 69% (self-reported)
  - 모델 크기: 85.8M 파라미터
- **PlantRecog 모델**: PlantRecog API (299종 꽃 인식)

#### 언어 모델
- **GPT-4o-mini**: OpenAI의 경량 언어 모델
  - **식물 이름 번역**: 영어 식물 이름을 한국어로 자동 번역 (캐싱 지원)
  - **관리 가이드 생성**: 식물별 맞춤형 관리법 생성

#### 번역 기능 상세
- 식물 분류 모델에서 받은 영어 이름을 한국어로 번역합니다
- 번역 결과는 캐시에 저장되어 동일한 식물명에 대해서는 재번역하지 않습니다
- 번역 실패 시 원문(영어 이름)을 반환합니다

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0.0 | 2024-XX-XX | 초기 API 명세서 작성 |

---

## 문의

API 관련 문의사항이 있으시면 팀 채널로 연락 부탁드립니다.

