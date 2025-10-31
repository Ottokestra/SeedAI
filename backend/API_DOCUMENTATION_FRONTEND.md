# 새싹아이 API 명세서 (프론트엔드용)

> 프론트엔드 개발자를 위한 간결한 API 가이드입니다.

## 📋 핵심 기능
1. 🌿 **식물 종 식별/분류** (Image Classification) ✅
2. 🐛 **식물 병충해 식별** (Image Classification) 🚧 *구현 예정*
3. 📝 **식별된 식물의 관리법** (Text Generation) ✅
4. 📈 **식별된 식물의 성장 예상 과정 표현** (Text-to-Image) 🚧 *구현 예정*
5. 🌐 **텍스트 번역** (Translation) ✅

---

## 📌 기본 정보

| 항목 | 내용 |
|------|------|
| **Base URL** | `http://localhost:8000` |
| **문서 URL** | `http://localhost:8000/docs` (Swagger UI) |
| **Content-Type** | `multipart/form-data` (이미지 업로드) |

---

## 🚀 주요 엔드포인트

### 1. 식물 분석 (추천)

**가장 많이 사용하는 엔드포인트입니다.** 자동으로 최적의 모델을 선택하여 분석합니다.

```http
POST /api/plant/analyze-auto
```

**요청**
```javascript
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('http://localhost:8000/api/plant/analyze-auto', {
  method: 'POST',
  body: formData
});

const data = await response.json();
```

**응답 예시**
```json
{
  "identification": {
    "plant_name": "몬스테라",
    "scientific_name": "Monstera Deliciosa",
    "confidence": 0.85,
    "common_names": ["몬스테라 델리시오사", "스위스 치즈 플랜트"]
  },
  "care_guide": {
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
  },
  "growth_prediction": {
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
  "message": "몬스테라 분석이 완료되었습니다. (자동 모델 선택)"
}
```

---

### 2. 다른 엔드포인트

| 엔드포인트 | 설명 | 상태 |
|-----------|------|------|
| `POST /api/plant/analyze` | 기본 모델 사용 (ViT) | ✅ |
| `POST /api/plant/analyze-v2` | PlantRecog 모델 사용 (299종 꽃) | ✅ |
| `POST /api/plant/compare` | 두 모델 결과 비교 | ✅ |
| `POST /api/plant/disease` | 식물 병충해 식별 | 🚧 |
| `POST /api/plant/growth-image` | 성장 예상 과정 이미지 생성 | 🚧 |
| `GET /health` | 서버 상태 확인 | ✅ |

---

### 3. 식물 병충해 식별 🚧

> **구현 예정**: 백엔드 팀원이 구현 예정입니다.

**요청**
```javascript
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('http://localhost:8000/api/plant/disease', {
  method: 'POST',
  body: formData
});

const data = await response.json();
```

**응답 예시**
```json
{
  // TODO: 백엔드 팀원이 구현 후 응답 형식 작성 필요
}
```

---

### 4. 성장 예상 과정 이미지 생성 🚧

> **구현 예정**: 백엔드 팀원이 구현 예정입니다.

**요청**
```javascript
const response = await fetch('http://localhost:8000/api/plant/growth-image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    plant_name: '몬스테라',
    stage: '3_months',
    prompt: '실내 화분에서 자라는 모습' // 선택사항
  })
});

const data = await response.json();
```

**응답 예시**
```json
{
  // TODO: 백엔드 팀원이 구현 후 응답 형식 작성 필요
  // 예상: image_url 또는 image_base64 필드 포함
}
```

---

## 📦 데이터 구조

### 응답 데이터 (`PlantAnalysisResponse`)

```typescript
interface PlantAnalysisResponse {
  identification: PlantIdentification;
  care_guide: CareGuide;
  growth_prediction: GrowthPrediction;
  success: boolean;
  message: string;
}
```

### 식물 식별 정보 (`PlantIdentification`)

```typescript
interface PlantIdentification {
  plant_name: string;        // 한국어 식물명
  scientific_name?: string;   // 학명/영어명
  confidence: number;        // 신뢰도 (0.0 ~ 1.0)
  common_names?: string[];   // 일반 명칭 목록 (한국어)
}
```

### 관리 가이드 (`CareGuide`)

```typescript
interface CareGuide {
  watering: string;      // 물주기 방법
  sunlight: string;      // 햇빛 요구사항
  temperature: string;  // 적정 온도
  humidity: string;     // 습도 요구사항
  fertilizer: string;   // 비료 사용법
  soil: string;         // 토양 정보
  tips: string[];       // 관리 팁 목록
}
```

### 성장 예측 (`GrowthPrediction`)

```typescript
interface GrowthPrediction {
  stages: GrowthStage[];
}

interface GrowthStage {
  stage: string;        // "current", "1_month", "3_months", "6_months"
  timeframe: string;    // "현재", "1개월 후" 등
  image_url: string | null;
  description: string;  // 단계 설명
}
```

### 병충해 식별 🚧 (`DiseaseIdentification`)

> **구현 예정**: 백엔드 팀원이 구현 예정입니다.

```typescript
interface DiseaseIdentification {
  disease_name: string;      // 병충해 이름
  confidence: number;         // 신뢰도 (0.0 ~ 1.0)
  description?: string;       // 병충해 설명
  treatment?: string[];      // 치료 방법 목록
}
```

### 성장 이미지 응답 🚧 (`GrowthImageResponse`)

> **구현 예정**: 백엔드 팀원이 구현 예정입니다.

```typescript
interface GrowthImageResponse {
  image_url?: string;        // 생성된 이미지 URL
  image_base64?: string;     // Base64 인코딩된 이미지 데이터
  stage: string;              // 성장 단계
}
```

## ⚠️ 에러 처리

### 에러 응답 형식

```json
{
  "detail": "에러 메시지"
}
```

### 주요 에러 코드

| 상태 코드 | 설명 | 해결 방법 |
|-----------|------|-----------|
| `400` | 이미지 파일이 아니거나 크기 초과 | 이미지 파일 확인 (최대 10MB) |
| `500` | 서버 오류 | 잠시 후 재시도 |

### 신뢰도가 낮은 경우

식물을 정확히 식별하지 못한 경우에도 기본 관리 가이드를 제공합니다:

```json
{
  "success": false,
  "message": "식물을 정확히 식별하지 못했습니다. 일반적인 관엽식물 관리 가이드를 제공합니다.",
  "identification": {
    "plant_name": "일반 관엽식물",
    "confidence": 0.05
  },
  ...
}
```

---

## 💻 사용 예시

### React (axios)

```javascript
import axios from 'axios';

const analyzePlant = async (imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);

  try {
    const response = await axios.post(
      'http://localhost:8000/api/plant/analyze-auto',
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

// 사용 예시
const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const result = await analyzePlant(file);
    console.log('식물명:', result.identification.plant_name);
    console.log('신뢰도:', result.identification.confidence);
    console.log('관리 가이드:', result.care_guide);
  } catch (error) {
    alert('분석 중 오류가 발생했습니다.');
  }
};
```

### JavaScript (Fetch API)

```javascript
const analyzePlant = async (imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);

  const response = await fetch('http://localhost:8000/api/plant/analyze-auto', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '분석 실패');
  }

  return await response.json();
};
```

---

## 📝 주의사항

- **파일 크기**: 최대 10MB
- **지원 형식**: JPEG, PNG, WebP 등 일반적인 이미지 형식
- **처리 시간**: 약 5-12초 (첫 요청 시 더 오래 걸릴 수 있음)
- **신뢰도**: `confidence`가 0.1 미만이면 `success: false`로 반환됩니다

---

## 🔗 참고

- **Swagger UI**: `http://localhost:8000/docs`에서 API를 직접 테스트할 수 있습니다
- **헬스체크**: `GET /health`로 서버 상태를 확인할 수 있습니다

