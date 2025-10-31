import { motion } from "framer-motion";
import { ArrowRight, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";

export default function Home() {
  return (
    <div className="bg-white text-neutral-900">
      {/* Hero */}
      <section
        className="relative min-h-[88vh] flex items-center justify-center overflow-hidden"
        aria-label="새싹아이 서비스 소개 히어로"
      >
        {/* 배경 이미지 - 줌인 애니메이션 */}
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1920&auto=format&fit=crop"
          alt="빛이 스며드는 실내 식물"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-emerald-950/40" />
        
        {/* 중앙 콘텐츠 - 순차적 애니메이션 */}
        <div className="relative z-10 max-w-4xl px-6 text-center text-white">
          {/* 제목 - 단어별 애니메이션 */}
          <motion.h1 
            className="text-4xl md:text-6xl font-extrabold leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-block"
            >
              우리 아이처럼, 당신의 식물을 키워줄{" "}
            </motion.span>
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6, type: "spring", stiffness: 100 }}
              className="text-emerald-300 inline-block"
            >
              새싹아이
            </motion.span>
          </motion.h1>
          
          {/* 서브 텍스트 */}
          <motion.p 
            className="mt-4 text-lg md:text-xl text-emerald-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
           복잡한 식물 관리, 인공지능이 쉽고 정확하게 분석하고 안내합니다.
          </motion.p>
          
          {/* 버튼 그룹 - stagger 애니메이션 */}
          <motion.div 
            className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.2,
                  delayChildren: 0.9,
                }
              }
            }}
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/identify"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-medium text-emerald-950 shadow-lg hover:bg-emerald-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 transition-colors"
                aria-label="내 식물 종 식별하고 케어 시작하기"
              >
                <Camera className="w-5 h-5" /> 내 식물 종 식별하고 케어 시작하기
              </Link>
            </motion.div>
            
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.95 }}
            >
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-5 py-3 font-medium text-white border border-white/30 backdrop-blur hover:bg-white/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/30 transition-colors"
              >
                더 알아보기 <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          </motion.div>
        </div>
        
        {/* 스크롤 다운 아이콘 - bounce 애니메이션 */}
        <motion.a 
          href="#why"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: { delay: 1.2, duration: 0.6 }
          }}
        >
          <motion.div
            animate={{ 
              y: [0, 10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="flex flex-col items-center gap-2 cursor-pointer group"
          >
            <span className="text-white/80 text-sm font-medium group-hover:text-white transition-colors">
              Scroll
            </span>
            <motion.div 
              className="w-6 h-10 rounded-full border-2 border-white/80 flex items-start justify-center p-2 group-hover:border-white transition-colors"
              whileHover={{ scale: 1.1 }}
            >
              <motion.div 
                className="w-1.5 h-1.5 bg-white/80 rounded-full group-hover:bg-white"
                animate={{ y: [0, 12, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </motion.div>
        </motion.a>
      </section>

      {/* Why Section */}
      <section id="why" className="max-w-5xl mx-auto px-6 py-16">
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="text-3xl md:text-4xl font-bold text-emerald-900"
        >
          왜 새싹아이인가요?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.45 }}
          className="mt-4 text-neutral-700 leading-relaxed"
        >
          식물 집사님, 이런 고민을 하시나요? <br className="hidden md:block" />
          "우리 집 환경에 이 식물이 잘 자랄 수 있을까?"<br />
          "물은 언제, 얼마나 줘야 하는지 매번 헷갈려요."<br />
          "갑자기 잎이 노래지는데, 병든 건지 과습인지 모르겠어요."
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-6 rounded-2xl border bg-emerald-50 p-5 text-emerald-900"
        >
          <p className="leading-relaxed">
            <strong className="font-semibold">[새싹아이]</strong>는 식물을 '물만 주는 대상'이 아닌,
            <strong className="font-semibold"> '함께 살아가는 생명'</strong>으로 여기고 가장 과학적이고 맞춤화된 솔루션을 제공합니다.
          </p>
        </motion.div>
      </section>

      {/* Features Section - 사용자 컴포넌트 사용 */}
      <FeaturesSection />

      {/* How It Works Section - 사용자 컴포넌트 사용 */}
      <HowItWorksSection />

      {/* Definition */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="text-3xl md:text-4xl font-bold text-emerald-900"
        >
          식물 케어란?
        </motion.h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="rounded-2xl border p-6"
          >
            <p className="leading-relaxed text-neutral-700">
              식물 케어(Plant Care)는 식물의 건강한 성장을 위한 종합 솔루션입니다. 단순히 물만 주는 행위를 넘어,
              식물이 건강하게 자라나고 환경적인 기능을 최적화할 수 있도록 체계적인 조건과 관리를 제공하는 총체적인 활동을 의미합니다.
            </p>
            <ul className="mt-4 space-y-2 text-neutral-800 list-disc list-inside">
              <li>
                <strong>물 관리(관수)</strong>: 식물의 종류, 토양 상태, 계절을 고려하여 적절한 시기와 양을 공급합니다.
              </li>
              <li>
                <strong>환경 조성</strong>: 뿌리 호흡을 돕는 통풍과 식물의 종류에 맞는 적정 채광량을 맞춰줍니다.
              </li>
              <li>
                <strong>지속 관리</strong>: 수형 유지를 위한 전지/전정 및 병해충 예방 활동이 포함됩니다.
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="rounded-2xl overflow-hidden border"
          >
            <motion.img
              src="https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=2070&auto=format&fit=crop"
              alt="깔끔하게 정리된 실내 식물 공간"
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.4 }}
            />
          </motion.div>
        </div>
      </section>

      {/* CTA Strip */}
      <section className="bg-emerald-600 overflow-hidden">
        <motion.div
          className="max-w-5xl mx-auto px-6 py-10 text-white flex flex-col md:flex-row items-center justify-between gap-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.h3
            className="text-2xl font-semibold"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            오늘부터 더 똑똑하게 키워요, 새싹아이와 함께
          </motion.h3>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/identify"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              지금 시작하기 <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
