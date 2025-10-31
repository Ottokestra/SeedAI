# 🚀 백엔드 서버 실행 가이드

## ⚠️ 중요: 프론트엔드와 백엔드 모두 실행해야 합니다!

프론트엔드(React)만 실행하면 **ERR_CONNECTION_REFUSED 오류**가 발생합니다.
백엔드(FastAPI) 서버를 먼저 실행해주세요.

---

## 📋 실행 순서

### 1단계: 백엔드 서버 실행 (필수!)

**새 터미널을 여세요** (현재 터미널은 프론트엔드가 실행 중)

#### Windows PowerShell:
```powershell
# 1. 백엔드 디렉토리로 이동
cd C:\Users\301\dev\proj1\backend

# 2. 가상환경 활성화 (처음에만)
python -m venv venv
.\venv\Scripts\Activate

# 3. 의존성 설치 (처음에만)
pip install -r requirements.txt

# 4. 서버 실행 ⭐
uvicorn app.main:app --reload --port 8000
```

#### Windows CMD:
```cmd
# 1. 백엔드 디렉토리로 이동
cd C:\Users\301\dev\proj1\backend

# 2. 가상환경 활성화 (처음에만)
python -m venv venv
venv\Scripts\activate.bat

# 3. 의존성 설치 (처음에만)
pip install -r requirements.txt

# 4. 서버 실행 ⭐
uvicorn app.main:app --reload --port 8000
```

#### macOS/Linux:
```bash
# 1. 백엔드 디렉토리로 이동
cd backend

# 2. 가상환경 활성화 (처음에만)
python3 -m venv venv
source venv/bin/activate

# 3. 의존성 설치 (처음에만)
pip install -r requirements.txt

# 4. 서버 실행 ⭐
uvicorn app.main:app --reload --port 8000
```

### ✅ 백엔드 서버 실행 확인

터미널에 다음과 같은 메시지가 나타나면 성공:

```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

브라우저에서 접속:
- API 문서: http://localhost:8000/docs
- 헬스체크: http://localhost:8000/health

---

### 2단계: 프론트엔드 실행

**별도의 터미널에서** 프론트엔드를 실행하세요:

```bash
cd frontend
npm run dev
```

프론트엔드는 `http://localhost:5173`에서 실행됩니다.

---

## 🔍 트러블슈팅

### 문제 1: `ERR_CONNECTION_REFUSED`
**증상**: 프론트엔드에서 Network Error 발생

**원인**: 백엔드 서버가 실행되지 않음

**해결**:
1. 새 터미널을 열고 백엔드 서버 실행
2. 브라우저에서 http://localhost:8000/health 접속 테스트

---

### 문제 2: `uvicorn: command not found`
**증상**: uvicorn 명령어를 찾을 수 없음

**원인**: 가상환경이 활성화되지 않았거나 uvicorn이 설치되지 않음

**해결**:
```bash
# 가상환경 활성화 확인
# PowerShell: (venv) 표시가 앞에 있어야 함
.\venv\Scripts\Activate

# uvicorn 설치
pip install uvicorn
```

---

### 문제 3: `ModuleNotFoundError: No module named 'app'`
**증상**: Python 모듈을 찾을 수 없음

**원인**: backend 디렉토리가 아닌 다른 곳에서 실행

**해결**:
```bash
# backend 디렉토리로 이동
cd C:\Users\301\dev\proj1\backend

# 다시 실행
uvicorn app.main:app --reload --port 8000
```

---

### 문제 4: 포트 8000이 이미 사용 중
**증상**: `Address already in use` 오류

**원인**: 이미 다른 프로세스가 8000 포트 사용 중

**해결**:
```powershell
# Windows: 8000 포트 사용 프로세스 찾기
netstat -ano | findstr :8000

# 프로세스 종료 (PID 확인 후)
taskkill /PID <PID> /F

# 또는 다른 포트로 실행
uvicorn app.main:app --reload --port 8001
# 이 경우 프론트엔드 .env 파일도 수정 필요: VITE_API_URL=http://localhost:8001
```

---

## 📝 실행 체크리스트

- [ ] Python 3.11 이상 설치 확인: `python --version`
- [ ] Node.js 18 이상 설치 확인: `node --version`
- [ ] backend 디렉토리에서 가상환경 생성: `python -m venv venv`
- [ ] 가상환경 활성화: `.\venv\Scripts\Activate` (Windows)
- [ ] 백엔드 의존성 설치: `pip install -r requirements.txt`
- [ ] 백엔드 서버 실행: `uvicorn app.main:app --reload --port 8000`
- [ ] 백엔드 동작 확인: http://localhost:8000/docs 접속
- [ ] frontend 디렉토리에서 의존성 설치: `npm install`
- [ ] 프론트엔드 실행: `npm run dev`
- [ ] 프론트엔드 접속: http://localhost:5173

---

## 🎯 빠른 시작 (이미 설정 완료한 경우)

**터미널 1 (백엔드):**
```bash
cd backend
.\venv\Scripts\Activate  # Windows
uvicorn app.main:app --reload --port 8000
```

**터미널 2 (프론트엔드):**
```bash
cd frontend
npm run dev
```

**완료!** 🎉
- 백엔드: http://localhost:8000
- 프론트엔드: http://localhost:5173

---

## 💡 팁

- 백엔드 서버는 **항상 먼저** 실행하세요
- 코드 수정 시 자동으로 재시작됩니다 (`--reload` 옵션)
- Ctrl+C로 서버를 종료할 수 있습니다
- VSCode에서는 **Split Terminal** (Ctrl+Shift+5)로 두 터미널을 동시에 볼 수 있습니다

