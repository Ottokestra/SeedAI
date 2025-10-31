import { motion } from 'framer-motion';
import { Info, Camera, Droplet, LineChart, Sprout, Calendar } from 'lucide-react';

export default function ProgramGuide() {
  return (
    <div className="bg-white">
      {/* 헤더 */}
      <section className="relative text-white py-16 overflow-hidden">
        {/* 자연 친화적 배경 이미지 */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=2070&auto=format&fit=crop"
            alt="햇살이 비치는 정원에서 물을 주는 장면"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-emerald-950/50" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            프로그램 사용방법
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg text-emerald-100"
          >
            새싹아이와 함께 식물을 더 쉽고 똑똑하게 관리해보세요
          </motion.p>
        </div>
      </section>

      {/* 본문 내용 */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* 섹션 1: 새싹아이란? */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative py-8 border-b border-emerald-100"
        >
          {/* 배경 이미지 */}
          <div className="absolute inset-0 opacity-[0.03]">
            <img
              src="https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=2070&auto=format&fit=crop"
              alt="초록 잎사귀가 가득한 자연 배경"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <Info className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-emerald-900 mb-3">
                🌱 새싹아이란?
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                새싹아이는 AI 기반 식물 관리 솔루션으로, 식물을 마치 우리의 아이처럼 돌보고 함께 성장할 수 있도록 돕습니다.
                복잡한 식물 관리 지식이 없어도, 사진 한 장으로 식물의 종류를 식별하고 맞춤형 관리법을 제공받을 수 있습니다.
              </p>
              <p className="text-neutral-700 leading-relaxed">
                자동화된 성장 예측, 건강 상태 모니터링, 케어 스케줄 관리를 통해 식물과 더 나은 공생을 만들어가세요.
              </p>
            </div>
          </div>
          </div>
        </motion.section>

        {/* 섹션 2: 식물 식별하기 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative py-8 border-b border-emerald-100"
        >
          {/* 배경 이미지 */}
          <div className="absolute inset-0 opacity-[0.03]">
            <img
              src="https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?q=80&w=2070&auto=format&fit=crop"
              alt="햇살 아래 초록 식물 잎"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <Camera className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-emerald-900 mb-3">
                📸 식물 식별하기
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                헤더의 <strong className="text-emerald-700">"종 식별"</strong> 메뉴를 클릭하거나, 홈 화면의{" "}
                <strong className="text-emerald-700">"내 식물 종 식별하고 케어 시작하기"</strong> 버튼을 눌러주세요.
              </p>
              <div className="bg-emerald-50 rounded-lg p-4 mb-3">
                <p className="text-neutral-800 font-medium mb-2">📋 식별 방법:</p>
                <ol className="list-decimal list-inside space-y-1 text-neutral-700">
                  <li>식물의 잎, 줄기, 또는 전체 모습이 잘 보이는 사진을 업로드합니다</li>
                  <li>AI가 자동으로 식물의 종류를 분석합니다 (약 10초 소요)</li>
                  <li>식별 결과에서 가장 확률이 높은 식물을 선택합니다</li>
                  <li>자동으로 관리법 페이지로 이동하여 맞춤 케어 정보를 확인합니다</li>
                </ol>
              </div>
              <p className="text-neutral-700 leading-relaxed text-sm">
                💡 <strong>Tip:</strong> 조명이 밝고 배경이 단순한 사진일수록 식별 정확도가 높아집니다.
              </p>
            </div>
          </div>
          </div>
        </motion.section>

        {/* 섹션 3: 관리법 보기 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative py-8 border-b border-emerald-100"
        >
          {/* 배경 이미지 */}
          <div className="absolute inset-0 opacity-[0.03]">
            <img
              src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=2070&auto=format&fit=crop"
              alt="물을 주는 손과 흙"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <Droplet className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-emerald-900 mb-3">
                💧 관리법 보기
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                식물 식별이 완료되면 자동으로 관리법 페이지로 이동합니다. 각 식물에 맞춘 상세한 관리 정보를 확인할 수 있습니다.
              </p>
              <div className="bg-emerald-50 rounded-lg p-4">
                <p className="text-neutral-800 font-medium mb-2">📋 제공되는 정보:</p>
                <ul className="list-disc list-inside space-y-1 text-neutral-700">
                  <li><strong>급수 관리:</strong> 물 주는 주기, 방법, 그리고 물 부족/과습 증상</li>
                  <li><strong>빛 관리:</strong> 적정 채광 조건과 위치 추천</li>
                  <li><strong>환경 관리:</strong> 온도, 습도, 통풍 등 최적 환경 설정</li>
                  <li><strong>영양 관리:</strong> 비료 주는 시기와 방법</li>
                </ul>
              </div>
            </div>
          </div>
          </div>
        </motion.section>

        {/* 섹션 4: 성장예측 및 우리아이 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative py-8"
        >
          {/* 배경 이미지 */}
          <div className="absolute inset-0 opacity-[0.03]">
            <img
              src="https://images.unsplash.com/photo-1490604001847-b712b0c2f967?q=80&w=2070&auto=format&fit=crop"
              alt="성장하는 식물과 흙"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <LineChart className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-emerald-900 mb-3">
                📊 성장예측 및 우리아이
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                식물을 등록하면 장기적인 성장 예측과 체계적인 케어 스케줄을 제공받을 수 있습니다.
              </p>
              
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                  <div className="flex items-center gap-2 mb-2">
                    <LineChart className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">성장 예측</h3>
                  </div>
                  <p className="text-neutral-700 text-sm leading-relaxed">
                    관리법 페이지에서 <strong>"성장 예측"</strong> 버튼을 클릭하면 12개월간의 예상 성장 그래프와 단계별 특징을 확인할 수 있습니다.
                    월별 키와 잎 변화, 개화 시기 등을 미리 파악하여 준비하세요.
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">우리아이 스케줄</h3>
                  </div>
                  <p className="text-neutral-700 text-sm leading-relaxed">
                    헤더의 <strong>"우리아이"</strong> 메뉴에서 등록한 모든 식물의 급수/일조 일정을 한눈에 관리할 수 있습니다.
                    캘린더로 각 식물의 케어 일정을 확인하고 체크하여 놓치지 마세요.
                  </p>
                </div>
              </div>

              <p className="text-neutral-700 leading-relaxed mt-4 text-sm">
                💡 <strong>Tip:</strong> 화분에 식물을 등록하고 매일 케어를 기록하면 더 정확한 성장 예측과 건강 알림을 받을 수 있습니다.
              </p>
            </div>
          </div>
          </div>
        </motion.section>

        {/* 하단 CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-8 text-white text-center"
        >
          <Sprout className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">지금 바로 시작해보세요!</h3>
          <p className="text-emerald-100 mb-6">
            첫 식물을 등록하고 새싹아이의 AI 케어 기능을 경험해보세요
          </p>
          <a
            href="/identify"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
          >
            식물 식별 시작하기
          </a>
        </motion.div>
      </div>
    </div>
  );
}

