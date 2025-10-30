# 새싹아이 - 식물 케어 서비스

AI 기반 식물 관리 웹 애플리케이션입니다.

## 주요 기능

### 홈 페이지
- **Hero 섹션**: 서비스 소개 및 빠른 시작
- **Features 섹션**: 4가지 주요 기능 소개 (Dialog 팝업 포함)
  - 식물 종 식별 및 분류
  - 맞춤형 관리법 제공
  - 성장 예상 분석 (그래프)
  - 질병 관리 및 진단
- **How It Works 섹션**: 4단계 사용 방법
- **식물 케어란?**: 서비스 설명 섹션

### 주요 페이지
- **식물 종 식별**: AI 기반 식물 식별
- **관리법**: 식물별 상세 관리 가이드
- **성장 예측**: 12개월 성장 데이터 및 차트
- **우리아이 스케줄**: 일조/급수 일정 관리

## 기술 스택

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Lucide React
- **Animation**: Framer Motion
- **Charts**: Recharts
- **Routing**: React Router Dom
- **API Mocking**: MSW (Mock Service Worker)
- **PDF Export**: html2canvas, jsPDF

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프리뷰
npm run preview
```

## 프로젝트 구조

```
plant-care-final/
├── public/
│   ├── images/         # 이미지 리소스
│   └── videos/         # 비디오 리소스
├── src/
│   ├── api/           # API 클라이언트
│   ├── components/    # 재사용 컴포넌트
│   │   ├── home/      # 홈 페이지 컴포넌트
│   │   └── ui/        # UI 컴포넌트
│   ├── data/          # 데이터베이스 (관리법, 성장 데이터)
│   ├── hooks/         # 커스텀 훅
│   ├── layouts/       # 레이아웃 컴포넌트
│   ├── mocks/         # MSW 핸들러
│   ├── pages/         # 페이지 컴포넌트
│   ├── styles/        # 전역 스타일
│   ├── utils/         # 유틸리티 함수
│   ├── App.jsx        # 메인 앱 컴포넌트
│   └── main.jsx       # 엔트리 포인트
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## 주요 라이브러리

- `@radix-ui/*`: 접근성 있는 UI 컴포넌트
- `framer-motion`: 애니메이션
- `recharts`: 차트 라이브러리
- `lucide-react`: 아이콘
- `msw`: API 모킹
- `html2canvas`, `jspdf`: PDF 내보내기

## 개발 노트

- Mock API를 사용하여 백엔드 없이 프론트엔드 개발 가능
- localStorage를 활용한 클라이언트 사이드 데이터 저장
- Radix UI를 사용한 접근성 있는 UI 구현
- Recharts를 사용한 성장 예측 그래프 시각화

