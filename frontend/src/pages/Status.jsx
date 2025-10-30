import { useState } from "react";
import StepCard from "../components/StepCard";
import { Upload, Bot, ActivitySquare, NotebookText, Trees } from "lucide-react";
import { useNavigate } from "react-router-dom";

const steps = [
  {
    icon: Upload,
    title: "사진 업로드",
    desc: "내 식물의 사진을 올려주세요.",
    alt: "사진 업로드 아이콘"
  },
  {
    icon: Bot,
    title: "AI 종 식별/분류",
    desc: "식물의 종류를 AI가 판별합니다.",
    alt: "AI 식별 아이콘"
  },
  {
    icon: ActivitySquare,
    title: "상태 진단",
    desc: "건강상태 및 문제를 분석해요.",
    alt: "상태 진단 아이콘"
  },
  {
    icon: NotebookText,
    title: "관리법 제공",
    desc: "맞춤형 관리법 정보를 안내해요.",
    alt: "관리법 제공 아이콘"
  },
  {
    icon: Trees,
    title: "성장 예측",
    desc: "성장 과정과 예측 정보를 확인!",
    alt: "성장 예측 아이콘"
  }
];

export default function Status() {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  
  // 데모용 라우팅 핸들러
  function gotoNext() {
    if (current === 0) navigate("/identify");
    else if (current === 3) navigate("/care/ficus-elastica");
    else if (current === 4) navigate("/growth/ficus-elastica");
    else setCurrent((p) => (p < steps.length - 1 ? p + 1 : p));
  }

  return (
    <main className="w-full flex flex-col items-center py-10">
      {/* 상단 진행 플로우 */}
      <nav aria-label="진행 단계 플로우" className="flex mb-10 gap-2 w-full max-w-2xl justify-center">
        {steps.map((step, idx) => (
          <button
            key={step.title}
            onClick={() => setCurrent(idx)}
            className={`flex-1 px-3 py-2 rounded-full font-medium text-sm transition  focus:outline-none 
              ${current === idx ? "bg-emerald-500 text-white shadow lg:scale-105" : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"}`}
            aria-current={current === idx ? "step" : undefined}
          >
            {step.title}
          </button>
        ))}
      </nav>
      {/* 카드 5개 그리드 */}
      <section aria-label="단계별 안내 카드" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl px-4 mb-12">
        {steps.map((step, idx) => (
          <StepCard key={step.title} {...step} active={idx === current} />
        ))}
      </section>
      {/* 다음 버튼 */}
      <button
        onClick={gotoNext}
        disabled={current === steps.length - 1}
        className="mt-4 px-8 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg transition shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-60"
        aria-label="다음 단계로 이동"
      >
        다음으로
      </button>
    </main>
  );
}

