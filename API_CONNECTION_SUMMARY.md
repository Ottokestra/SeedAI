# 🔗 API 연결 요약 (프론트엔드 ↔ 백엔드)

## 📋 연결 개요

### 백엔드 (FastAPI)
- **주소**: `http://localhost:8000`
- **CORS 설정**: ✅ 완료 (모든 localhost 허용)
- **엔드포인트**:
  - `POST /api/plant/analyze` - 기본 모델 (Google ViT)
  - `POST /api/plant/analyze-auto` - 자동 모델 선택 ⭐ (권장)
  - `POST /api/plant/analyze-v2` - PlantRecog 모델
  - `POST /api/plant/compare` - 두 모델 비교
  - `GET /health` - 헬스체크

### 프론트엔드 (React + Vite)
- **주소**: `http://localhost:5173`
- **API 클라이언트**: `src/api/client.js`
- **백엔드 URL**: `http://localhost:8000` (`.env` 파일에서 설정 가능)

---

## ✅ 수정된 파일 목록

### 1. **`frontend/src/api/client.js`** ⭐ 핵심
**변경사항**:
- API URL을 환경 변수로 설정 가능하게 변경
- 요청/응답 인터셉터 추가 (디버깅 및 에러 처리)
- 백엔드 연결 실패 시 명확한 에러 메시지 표시

```javascript
// 기존
const API_BASE_URL = `http://${window.location.hostname}:8000`;

// 수정 후
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

**인터셉터 추가**:
- 요청 시: `[API 요청] POST http://localhost:8000/api/plant/analyze-auto`
- 응답 시: `[API 응답] 200 /api/plant/analyze-auto`
- 오류 시: `[백엔드 연결 실패] 백엔드 서버가 실행 중인지 확인하세요`

---

### 2. **`frontend/src/pages/Identify.jsx`**
**변경사항**:
- 에러 처리 개선 (백엔드 연결 실패 시 상세 안내)

```javascript
// 에러 메시지 예시
if (error.code === 'ERR_NETWORK') {
  errorTitle = '백엔드 서버 연결 실패';
  errorMsg = '백엔드 서버가 실행 중인지 확인해주세요. (http://localhost:8000)';
}
```

---

### 3. **`frontend/src/pages/CareChat.jsx`**
**변경사항**:
- Identify.jsx와 동일한 에러 처리 적용

---

### 4. **`frontend/src/pages/GrowthStandalone.jsx`**
**변경사항**:
- Identify.jsx와 동일한 에러 처리 적용

---

### 5. **`frontend/.env.example`** (신규)
**내용**:
```env
# 백엔드 API URL
VITE_API_URL=http://localhost:8000
```

**사용법**:
1. `.env.example`을 복사하여 `.env` 파일 생성
2. 필요시 포트 번호 변경

---

### 6. **`BACKEND_START_GUIDE.md`** (신규) ⭐ 중요
**내용**: 백엔드 서버 실행 가이드 전체

---

## 🚀 실행 방법

### 1️⃣ 백엔드 실행 (필수!)

**새 터미널 열기:**
```powershell
cd C:\Users\301\dev\proj1\backend

# 가상환경 활성화 (처음만)
python -m venv venv
.\venv\Scripts\Activate

# 의존성 설치 (처음만)
pip install -r requirements.txt

# 서버 실행 ⭐
uvicorn app.main:app --reload --port 8000
```

**실행 확인:**
- 터미널에 `INFO: Uvicorn running on http://127.0.0.1:8000` 표시
- 브라우저에서 http://localhost:8000/docs 접속

---

### 2️⃣ 프론트엔드 실행

**기존 터미널 또는 새 터미널:**
```bash
cd C:\Users\301\dev\proj1\frontend
npm run dev
```

**실행 확인:**
- 터미널에 `Local: http://localhost:5173/` 표시
- 브라우저에서 접속

---

## 🔍 API 연결 테스트

### 방법 1: 브라우저 콘솔 확인
1. 프론트엔드에서 식별 페이지 접속
2. 이미지 업로드 후 "식별 시작" 클릭
3. **F12** (개발자 도구) → **Console** 탭 확인

**성공 시**:
```
[API 요청] POST http://localhost:8000/api/plant/analyze-auto
[API 응답] 200 /api/plant/analyze-auto
```

**실패 시**:
```
[백엔드 연결 실패] 백엔드 서버가 실행 중인지 확인하세요: http://localhost:8000
```

---

### 방법 2: 백엔드 직접 테스트
```bash
# PowerShell
Invoke-WebRequest -Uri http://localhost:8000/health

# CMD
curl http://localhost:8000/health
```

**응답 예시**:
```json
{
  "status": "healthy",
  "message": "새싹아이 API가 정상 작동 중입니다."
}
```

---

## 🐛 트러블슈팅

### 문제 1: `ERR_CONNECTION_REFUSED` ⭐ 가장 흔한 오류
**증상**: 
- 브라우저에서 "백엔드 서버 연결 실패" 토스트 메시지
- 콘솔에 `net::ERR_CONNECTION_REFUSED` 오류

**원인**: 백엔드 서버가 실행되지 않음

**해결**:
1. 새 터미널에서 백엔드 서버 실행
2. http://localhost:8000/docs 접속 확인

---

### 문제 2: CORS 오류
**증상**: 
```
Access to XMLHttpRequest at 'http://localhost:8000/...' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**원인**: 백엔드 CORS 설정 문제

**해결**: 
- 백엔드 `main.py`에 CORS 설정이 있는지 확인 (이미 설정됨 ✅)
- 설정이 있다면 백엔드 재시작

---

### 문제 3: 포트 충돌
**증상**: `Address already in use` 또는 `EADDRINUSE`

**원인**: 이미 다른 프로세스가 포트 사용 중

**해결 (Windows)**:
```powershell
# 8000 포트 사용 프로세스 확인
netstat -ano | findstr :8000

# 프로세스 종료
taskkill /PID <PID번호> /F
```

**또는 다른 포트 사용**:
```bash
# 백엔드를 8001 포트로 실행
uvicorn app.main:app --reload --port 8001

# 프론트엔드 .env 파일 수정
VITE_API_URL=http://localhost:8001
```

---

## 📊 API 호출 흐름

```
사용자
  ↓ (이미지 업로드)
프론트엔드 (React)
  ↓ (identifyPlant 함수 호출)
API 클라이언트 (client.js)
  ↓ (POST /api/plant/analyze-auto)
백엔드 (FastAPI)
  ↓ (AI 모델 분석)
응답 (JSON)
  ↓
프론트엔드
  ↓
결과 표시
```

---

## 📝 API 응답 형식

### 성공 응답
```json
{
  "identification": {
    "plant_name": "몬스테라 델리시오사",
    "scientific_name": "Monstera deliciosa",
    "confidence": 0.95,
    "common_names": ["Monstera", "Swiss Cheese Plant"]
  },
  "care_guide": {
    "watering": "주 1-2회...",
    "sunlight": "밝은 간접광...",
    "temperature": "18-24°C...",
    "humidity": "중간 습도...",
    "fertilizer": "월 1회...",
    "soil": "배수가 잘 되는 흙...",
    "tips": ["팁1", "팁2", "팁3"]
  },
  "growth_prediction": {
    "stages": [...]
  },
  "success": true,
  "message": "몬스테라 델리시오사 분석이 완료되었습니다."
}
```

### 오류 응답
```json
{
  "detail": "이미지 파일만 업로드 가능합니다."
}
```

---

## ✅ 체크리스트

실행 전 확인:
- [ ] Python 3.11+ 설치
- [ ] Node.js 18+ 설치
- [ ] backend 디렉토리에 가상환경 생성
- [ ] backend 의존성 설치 (`pip install -r requirements.txt`)
- [ ] frontend 의존성 설치 (`npm install`)

실행 확인:
- [ ] 백엔드 서버 실행 중 (http://localhost:8000/docs)
- [ ] 프론트엔드 실행 중 (http://localhost:5173)
- [ ] 브라우저 콘솔에 API 요청/응답 로그 확인
- [ ] 이미지 업로드 및 식별 테스트

---

## 🎯 빠른 참조

| 항목 | 주소/명령어 |
|------|------------|
| 백엔드 실행 | `cd backend; uvicorn app.main:app --reload --port 8000` |
| 백엔드 API 문서 | http://localhost:8000/docs |
| 백엔드 헬스체크 | http://localhost:8000/health |
| 프론트엔드 실행 | `cd frontend; npm run dev` |
| 프론트엔드 주소 | http://localhost:5173 |
| API 클라이언트 | `frontend/src/api/client.js` |
| 백엔드 가이드 | `BACKEND_START_GUIDE.md` |

---

## 📞 문의

문제가 지속되면:
1. **백엔드 로그 확인**: 터미널에서 에러 메시지 확인
2. **프론트엔드 콘솔 확인**: F12 → Console 탭
3. **네트워크 탭 확인**: F12 → Network 탭에서 실패한 요청 확인

---

**마지막 업데이트**: 2025-10-31  
**백엔드 버전**: v2.0  
**프론트엔드 버전**: v3.0

