import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Scan, Leaf, ShieldCheck } from 'lucide-react';

const steps = [
  {
    step: "01",
    title: "식물 사진 촬영",
    description: "스마트폰으로 식물 사진을 찍거나 갤러리에서 선택하세요.",
    icon: <Camera className="h-8 w-8 text-white" />
  },
  {
    step: "02",
    title: "AI 분석 시작",
    description: "AI가 자동으로 식물을 식별하고 현재 상태를 분석합니다.",
    icon: <Scan className="h-8 w-8 text-white" />
  },
  {
    step: "03",
    title: "맞춤 정보 제공",
    description: "식물에 최적화된 관리법과 성장 예측 정보를 받아보세요.",
    icon: <Leaf className="h-8 w-8 text-white" />
  },
  {
    step: "04",
    title: "지속적인 관리",
    description: "정기적인 알림과 관리 팁으로 건강한 식물을 유지하세요.",
    icon: <ShieldCheck className="h-8 w-8 text-white" />
  }
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-green-50/50 py-16 sm:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
            How It Works
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            간단한 4단계로 시작하세요
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            복잡한 설정 없이 누구나 쉽게 사용할 수 있습니다.
          </p>
        </div>

        {/* 4단계 카드 그리드 */}
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <Card key={step.step} className="bg-white text-center shadow-lg">
              <CardContent className="p-6">
                <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                  <span className="absolute -top-2 -left-2 text-7xl font-bold text-gray-100">
                    {step.step}
                  </span>
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-lg bg-green-600">
                    {step.icon}
                  </div>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-gray-600">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

