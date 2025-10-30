# 🚀 새싹아이 빠른 시작 가이드

## 🎉 API 토큰 불필요!

v2.0부터는 Hugging Face API 토큰 없이도 바로 사용할 수 있습니다!
모델이 자동으로 다운로드되고 로컬에서 실행됩니다.

## 1단계: 백엔드 설정

```bash
# 백엔드 디렉토리로 이동
cd backend

# 가상환경 생성
python -m venv venv

# 가상환경 활성화
# macOS/Linux:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# 패키지 설치 (첫 실행 시 시간이 걸릴 수 있습니다)
pip install -r requirements.txt

# 서버 실행
uvicorn app.main:app --reload --port 8000
```

**중요**: 첫 실행 시 AI 모델이 자동으로 다운로드됩니다 (약 300MB).
이후 실행은 빠릅니다!

백엔드가 http://localhost:8000 에서 실행됩니다.

## 2단계: 프론트엔드 설정

**새 터미널 창을 열어서:**

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드가 http://localhost:5173 에서 실행됩니다.

## 3단계: 사용하기

1. 브라우저에서 http://localhost:5173 접속
2. "지금 시작하기" 버튼 클릭
3. 식물 사진 업로드
4. 분석 결과 확인!

## 💡 간단 요약

### 필요한 것
✅ Python 3.11+  
✅ Node.js 18+  
✅ 8GB 이상 RAM  
✅ 인터넷 연결 (첫 실행 시)  

### 필요 없는 것
❌ Hugging Face API 토큰  
❌ 복잡한 설정  
❌ GPU (선택사항)  

## 🔧 문제 해결

### 백엔드가 시작되지 않는 경우
- Python 버전 확인: `python --version` (3.11 이상 필요)
- 가상환경이 활성화되었는지 확인
- 의존성 재설치: `pip install -r requirements.txt --force-reinstall`

### 프론트엔드가 시작되지 않는 경우
- Node.js 버전 확인: `node --version` (18 이상 권장)
- node_modules 삭제 후 재설치:
  ```bash
  rm -rf node_modules
  npm install
  ```

### 첫 실행이 너무 느린 경우
- 정상입니다! AI 모델 다운로드 중입니다 (약 300MB)
- 진행 상황은 터미널에서 확인할 수 있습니다
- 이후 실행은 훨씬 빠릅니다

### 메모리 부족 오류
- RAM이 부족합니다. 최소 8GB 필요
- 다른 프로그램을 종료하고 다시 시도
- 또는 더 작은 모델 사용 (config.py 수정)

### PyTorch 설치 오류
CPU 버전으로 설치:
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
```

## 🎯 API 테스트

백엔드가 정상 작동하는지 확인:
```bash
curl http://localhost:8000/health
```

예상 응답:
```json
{
  "status": "healthy",
  "message": "새싹아이 API가 정상 작동 중입니다."
}
```

API 문서 확인:
```
http://localhost:8000/docs
```

## 📂 디렉토리 구조

첫 실행 후 생성되는 디렉토리:
```
backend/
├── model_cache/  # AI 모델 저장 (자동 생성)
└── venv/        # Python 가상환경
```

이 디렉토리들은 `.gitignore`에 포함되어 있습니다.

## 🚀 성능 최적화

### GPU 사용 (선택사항)
CUDA 지원 GPU가 있다면 자동으로 감지되어 사용됩니다.
GPU 사용 시 추론 속도가 훨씬 빠릅니다.

### 모델 캐싱
모델은 한 번만 로드되고 메모리에 캐싱됩니다.
서버를 재시작하지 않는 한 다시 로드되지 않습니다.

## 📚 추가 정보

더 자세한 내용은 README.md를 참고하세요!

---

문제가 계속되면 GitHub 이슈를 등록해주세요.

**즐거운 식물 관리 되세요!** 🌱✨
