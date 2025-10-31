# 📦 설치 가이드

## ✅ 사전 요구사항

- Python 3.11 이상
- Node.js 18 이상
- 인터넷 연결 (첫 실행 시 모델 다운로드)

## 🔧 백엔드 설치 (터미널)

### 1단계: 백엔드 디렉토리로 이동
```bash
cd backend
```

### 2단계: 가상환경 생성 (이미 있다면 생략)
```bash
python -m venv venv
```

### 3단계: 가상환경 활성화
**Windows (cmd):**
```bash
venv\Scripts\activate
```

**Windows (PowerShell):**
```bash
venv\Scripts\Activate.ps1
```

### 4단계: 패키지 설치 (필수!)
```bash
pip install -r requirements.txt
```

**설치되는 주요 패키지:**
- FastAPI (웹 프레임워크)
- PyTorch (딥러닝 프레임워크)
- Transformers (Hugging Face 모델)
- Uvicorn (서버)

**⏰ 소요 시간:** 약 10-30분 (인터넷 속도에 따라)

### 5단계: 서버 실행
```bash
uvicorn app.main:app --reload --port 8000
```

**✅ 첫 실행 시:**
- AI 모델이 자동으로 다운로드됩니다 (약 300MB)
- `model_cache/` 폴더에 저장됩니다
- 이후 실행은 빠릅니다

**✅ 성공 확인:**
- 터미널에 `Uvicorn running on http://127.0.0.1:8000` 메시지 표시
- 브라우저에서 `http://localhost:8000/docs` 접속 → API 문서 확인

---

## 🎨 프론트엔드 설치 (터미널)

**새 터미널 창을 열어서:**

### 1단계: 프론트엔드 디렉토리로 이동
```bash
cd SeedAI\frontend
```

### 2단계: 패키지 설치 (필수!)
```bash
npm install
```

**설치되는 주요 패키지:**
- React 18
- Vite
- Recharts (그래프 라이브러리)
- Axios (HTTP 클라이언트)
- TailwindCSS

**⏰ 소요 시간:** 약 2-5분

### 3단계: 개발 서버 실행
```bash
npm run dev
```

**✅ 성공 확인:**
- 터미널에 `Local: http://localhost:5173` 메시지 표시
- 브라우저에서 자동으로 열림

---

## 🚀 전체 실행 순서 (요약)

### 터미널 1: 백엔드
```bash
cd backend
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 터미널 2: 프론트엔드
```bash
cd SeedAI\frontend
npm install
npm run dev
```

---

## ⚠️ 문제 해결

### 백엔드 설치 오류

**Python 버전 확인:**
```bash
python --version
# Python 3.11 이상 필요
```

**가상환경 재생성:**
```bash
rmdir /s /q venv
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**PyTorch 설치 오류:**
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
```

### 프론트엔드 설치 오류

**Node.js 버전 확인:**
```bash
node --version
# Node.js 18 이상 권장
```

**node_modules 재설치:**
```bash
rmdir /s /q node_modules
npm install
```

### 모델 다운로드 실패

**인터넷 연결 확인:**
- 첫 실행 시 인터넷 연결 필요
- 방화벽/프록시 설정 확인

**수동 다운로드 (필요 시):**
- 모델은 Hugging Face에서 자동 다운로드
- 문제가 있으면 `model_cache/` 폴더 삭제 후 재시도

---

## 📝 참고사항

1. **가상환경 활성화 확인:**
   - 터미널 프롬프트에 `(venv)` 표시되어야 함
   - 안 보이면 `venv\Scripts\activate` 다시 실행

2. **포트 충돌:**
   - 백엔드: 8000 포트 사용 중이면 다른 포트 지정
   - 프론트엔드: 5173 포트 사용 중이면 자동으로 다른 포트 사용

3. **첫 실행이 느린 이유:**
   - 정상입니다! 모델 다운로드 중
   - 이후 실행은 훨씬 빠릅니다

---

**✅ 설치가 완료되면 브라우저에서 `http://localhost:5173` 접속하여 테스트하세요!**

