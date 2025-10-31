# 📋 백엔드 사용 API/모델 정리 (팀 공유용)

## 🎯 주요 기능별 사용 모델

### 1️⃣ 종분석 (Plant Identification)

#### **모델 1: umutbozdag/plant-identity** (로컬 실행)
- **용도**: 식물 종 식별 (20종 전문)
- **언어**: Python (Transformers)
- **실행 위치**: `app/services/classifier.py`
- **특징**: 
  - 로컬에서 실행 (API 키 불필요)
  - 첫 실행 시 Hugging Face Hub에서 자동 다운로드
  - 모델 캐싱: `model_cache/` 디렉토리

#### **모델 2: PlantRecog API** (외부 API)
- **용도**: 식물 종 식별 (299종 꽃)
- **API 엔드포인트**: `https://plantrecog.sarthak.work/predict`
- **언어**: Python (requests 라이브러리)
- **특징**: 인터넷 연결 필요, 30초 타임아웃

#### **자동 모델 선택 로직**
- 모델1 신뢰도 ≥ 50% → 모델1 사용
- 모델1 신뢰도 < 50% → 모델2 사용
- **API**: `POST /api/plant/analyze-auto`

---

### 2️⃣ 번역 (Translation)

#### **모델: facebook/nllb-200-distilled-600M**
- **용도**: 영어 식물 이름 → 한국어 번역
- **언어**: Python (Transformers)
- **실행 위치**: `app/services/classifier.py`
- **번역 방향**: eng_Latn → kor_Hang
- **특징**: 번역 결과 캐싱 (중복 번역 방지)

---

### 3️⃣ 성장예측 그래프 (Growth Prediction)

#### **알고리즘: 로지스틱 곡선 기반**
- **언어**: Python (순수 계산)
- **실행 위치**: `app/services/growth.py`
- **생성 데이터**:
  - ✅ 좋은 생장 그래프 (최적 관리 시, 30% 빠른 성장)
  - ⚠️ 나쁜 생장 그래프 (관리 부족 시, 30% 느린 성장)
  - 📊 예상 생장 그래프 (일반 관리 시)
- **단위**: 
  - y축: 식물 크기 (cm)
  - x축: 기간 (주 또는 월 단위 선택 가능)
- **API**: `POST /api/plant/growth-insight?period_unit=month&max_periods=12`

---

### 4️⃣ 텍스트 생성 (Text Generation)

#### **모델: GPT-2 (gpt2)**
- **용도**: 관리 가이드 및 성장 분석 텍스트 생성
- **언어**: Python (Transformers)
- **현재 상태**: ⚠️ 모델은 준비되어 있으나, **실제 사용은 기본 템플릿 기반**
- **이유**: 한국어 지원 제한 및 리소스 절감
- **실행 위치**: `app/services/guide.py`

---

### 5️⃣ 이미지 생성 (Image Generation)

#### **모델: Stability AI SD-Turbo (stabilityai/sd-turbo)**
- **용도**: 성장 예측 이미지 생성
- **언어**: Python (Diffusers)
- **현재 상태**: ⚠️ **비활성화됨** (리소스 절감)
- **실행 위치**: `app/services/growth.py`

---

## 📊 데이터 저장 방식

### **메모리 기반 저장**
- **용도**: 성장 기록 저장 (임시)
- **언어**: Python (메모리 딕셔너리)
- **저장 위치**: `app/services/db_utils.py`
- **특징**:
  - ✅ 웹 서버 실행 중에만 유지
  - ❌ 서버 종료 시 모든 데이터 사라짐
  - ✅ 브라우저 창 닫으면 사라짐 (요구사항 충족)

---

## 🔧 기술 스택 요약

| 항목 | 기술 | 용도 |
|------|------|------|
| **웹 프레임워크** | FastAPI | API 서버 |
| **딥러닝 프레임워크** | PyTorch | 모델 실행 |
| **모델 라이브러리** | Transformers | Hugging Face 모델 사용 |
| **이미지 생성** | Diffusers | 이미지 생성 (현재 비활성화) |
| **이미지 처리** | Pillow | 이미지 전처리 |
| **HTTP 요청** | Requests | 외부 API 호출 |

---

## 📍 주요 API 엔드포인트

### **종분석**
```bash
POST /api/plant/analyze-auto
# 파일: multipart/form-data
# 응답: PlantAnalysisResponse (identification, care_guide, growth_prediction)
```

### **성장예측 그래프**
```bash
POST /api/plant/growth-insight
# 파일: multipart/form-data
# 파라미터: period_unit=month|week, max_periods=12
# 응답: PlantGrowthInsightResponse (identification, growth_graph, analysis_text)
```

### **성장 기록 저장**
```bash
POST /api/plant/update-growth
# Body: { plant_id, date, height }
# 저장: 메모리 기반 (서버 종료 시 사라짐)
```

---

## 💡 핵심 사항

1. **모든 모델은 로컬 실행** (API 키 불필요)
2. **첫 실행 시 자동 다운로드** (Hugging Face Hub)
3. **모델 캐싱**: `./model_cache/` 디렉토리
4. **GPU 자동 감지**: 가능하면 GPU 사용, 아니면 CPU
5. **데이터 저장**: 메모리 기반 (서버 재시작 시 초기화)

---

## 📝 현재 활성화 상태

| 모델/기능 | 상태 | 비고 |
|-----------|------|------|
| 종분석 (모델1) | ✅ 활성화 | umutbozdag/plant-identity |
| 종분석 (모델2) | ✅ 활성화 | PlantRecog API |
| 번역 | ✅ 활성화 | NLLB |
| 성장예측 그래프 | ✅ 활성화 | 로지스틱 곡선 알고리즘 |
| 월별 분석 텍스트 | ✅ 활성화 | 템플릿 기반 |
| 텍스트 생성 | ⚠️ 준비됨 | 실제 사용 안 함 |
| 이미지 생성 | ⚠️ 준비됨 | 실제 사용 안 함 |

---

## 🔗 참고 파일

- **모델 설정**: `app/config.py`
- **종분석**: `app/services/classifier.py`
- **성장예측**: `app/services/growth.py`
- **관리 가이드**: `app/services/guide.py`
- **데이터 저장**: `app/services/db_utils.py`
- **API 엔드포인트**: `app/api/plant.py`

---

**작성일**: 2024년
**버전**: v2.0
**팀 공유용 요약 문서**

