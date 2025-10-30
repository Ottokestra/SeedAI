import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Upload, Droplet, Sun, Thermometer, Info, TrendingUp, MessageSquare, Bot, User, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import GrowthChart from './GrowthChart';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// --- 기능 카드 데이터 ---
const features = [
  {
    id: 'identification',
    title: '식물 종 식별 및 분류',
    description: '사진 한 장으로 식물의 종을 정확하게 식별하고 분류합니다. AI 딥러닝 기술로 99% 이상의 정확도를 자랑합니다.',
    icon: <Upload className="h-8 w-8 text-green-600" />,
  },
  {
    id: 'care_guide',
    title: '맞춤형 관리법 제공',
    description: '식별된 식물에 최적화된 물주기, 햇빛, 온도, 습도 등 상세한 관리 가이드를 제공합니다.',
    icon: <Info className="h-8 w-8 text-green-600" />,
  },
  {
    id: 'growth_prediction',
    title: '성장 예상 분석',
    description: '현재 환경과 관리 상태를 기반으로 식물의 성장을 예측하고, 최적의 성장 조언을 제안합니다.',
    icon: <TrendingUp className="h-8 w-8 text-green-600" />,
  },
  {
    id: 'care_chat',
    title: '식물 관리법 AI 챗봇',
    description: '식물 관리에 대한 모든 궁금증을 AI 챗봇에게 물어보세요. 실시간으로 맞춤형 답변을 제공합니다.',
    icon: <MessageSquare className="h-8 w-8 text-green-600" />,
  },
];

export function FeaturesSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <section id="features" className="bg-white py-16 sm:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
            Features
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            최신 AI 기반 식물 관리 기능
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            AI 기술 관리의 모든 과정을 간편하고 정확하게 도와드립니다.
          </p>
        </motion.div>

        {/* 기능 카드 그리드 */}
        <motion.div 
          className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature) => (
            <motion.div key={feature.id} variants={itemVariants}>
              <FeatureDialog feature={feature} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// --- 팝업(Dialog)을 포함하는 카드 컴포넌트 ---
function FeatureDialog({ feature }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-green-50">
              {feature.icon}
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{feature.description}</p>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        {/* 기능 ID별로 다른 팝업 콘텐츠를 렌더링합니다. */}
        {feature.id === 'identification' && <IdentificationContent />}
        {feature.id === 'care_guide' && <CareGuideContent />}
        {feature.id === 'growth_prediction' && <GrowthPredictionContent />}
        {feature.id === 'care_chat' && <CareChatContent />} 
      </DialogContent>
    </Dialog>
  );
}

// --- 1. '식물 종 식별' 팝업 (이미지 표시 + 분석 데모) ---
function IdentificationContent() {
  const [status, setStatus] = useState('idle');

  const handleAnalyze = () => {
    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
    }, 2000);
  };

  const handleReset = () => {
    setStatus('idle');
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl">식물 종 식별 및 분류</DialogTitle>
        <DialogDescription>
          사진 한 장으로 식물의 종을 정확하게 식별하고 분류합니다.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4">
        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center rounded-lg border p-6">
            <img
              src="/images/mimg.jpg"
              alt="식물 샘플 이미지"
              className="mx-auto mb-4 max-h-60 w-auto rounded-md object-contain"
            />
            <p className="text-gray-600 text-center">
              분석하기 버튼을 눌러 AI 식별 기능을 체험해보세요
            </p>
          </div>
        )}
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center rounded-lg border p-12">
            <Loader2 className="h-12 w-12 animate-spin text-green-600" />
            <p className="mt-4 text-gray-600">분석 중입니다... 잠시만 기다려주세요.</p>
          </div>
        )}
        {status === 'success' && (
          <div className="rounded-lg border bg-green-50 p-6 text-center">
            <h3 className="text-xl font-semibold text-green-800 mb-4">분석 완료!</h3>
            <img
              src="/images/mimg.jpg"
              alt="분석 결과: 몬스테라 델리시오사"
              className="mx-auto mb-4 max-h-60 w-auto rounded-md object-contain"
            />
            <p className="text-lg">
              <span className="font-bold">품종:</span> 몬스테라 델리시오사
            </p>
            <p className="text-gray-600">
              <span className="font-bold">분류:</span> 천남성과 (Araceae)
            </p>
          </div>
        )}
      </div>
      <Button
        onClick={status === 'success' ? handleReset : handleAnalyze}
        disabled={status === 'loading'}
        className="w-full bg-green-600 text-white hover:bg-green-700"
      >
        {status === 'idle' && '분석하기'}
        {status === 'loading' && '분석 중...'}
        {status === 'success' && '다시 분석하기'}
      </Button>
    </>
  );
}

// --- 2. '맞춤형 관리법' 팝업 (텍스트 정보) ---
function CareGuideContent() {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl">몬스테라 델리시오사 맞춤 관리법</DialogTitle>
      </DialogHeader>
      <div className="max-h-[60vh] overflow-y-auto py-4 pr-4 space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
            <Droplet className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold">물주기</h4>
            <p className="text-gray-600">봄, 여름에는 흙 표면이 마르면 듬뿍 물을 줍니다. 겨울에는 주 1회 정도로 줄여주세요.</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100">
            <Sun className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <h4 className="font-semibold">햇빛</h4>
            <p className="text-gray-600">직사광선은 피하고, 밝은 간접광이 드는 곳이 좋습니다. 직사광선은 잎을 태울 수 있습니다.</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
            <Thermometer className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h4 className="font-semibold">온도</h4>
            <p className="text-gray-600">18-27°C가 가장 좋습니다. 10°C 이하로 내려가지 않도록 겨울철에 주의해주세요.</p>
          </div>
        </div>
      </div>
    </>
  );
}

// --- 3. '성장 예상 분석' 팝업 (그래프) ---
function GrowthPredictionContent() {
  // 샘플 성장 데이터
  const sampleData = [
    { month: '1개월', height: 15, min: 13.5, max: 16.5 },
    { month: '2개월', height: 22, min: 19.8, max: 24.2 },
    { month: '3개월', height: 30, min: 27, max: 33 },
    { month: '4개월', height: 38, min: 34.2, max: 41.8 },
    { month: '5개월', height: 45, min: 40.5, max: 49.5 },
    { month: '6개월', height: 52, min: 46.8, max: 57.2 },
  ];

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl">성장 예상 분석</DialogTitle>
        <DialogDescription>
          AI가 식물의 성장 패턴을 분석하여 예상 성장 그래프를 제공합니다.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4">
        <p className="mb-4 text-gray-600">
          몬스테라 델리시오사의 6개월 성장 예측 데이터입니다.
        </p>
        <GrowthChart data={sampleData} plantName="몬스테라 델리시오사" />
        <div className="mt-4 rounded-lg bg-green-50 p-4">
          <p className="text-sm text-gray-700">
            <strong>예측 정보:</strong> 현재 환경 조건에서 최적의 관리를 했을 때의 성장 예측입니다. 
            실제 성장은 물주기, 햇빛, 온도 등의 환경 요인에 따라 달라질 수 있습니다.
          </p>
        </div>
      </div>
    </>
  );
}

// --- 4. '식물 관리법 AI 챗봇' 팝업 (챗봇 시연) ---
function CareChatContent() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: '안녕하세요! 🌱 AI 식물 관리 상담사입니다.\n식물 관리에 대해 무엇이든 물어보세요!',
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // 예시 질문
  const exampleQuestions = [
    '몬스테라 물주기는 어떻게 하나요?',
    '잎이 노랗게 변하는 이유는?',
    '햇빛을 많이 받아야 하는 식물은?',
  ];

  const handleSendMessage = () => {
    if (!input.trim() || isTyping) return;

    // 사용자 메시지 추가
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // AI 응답 시뮬레이션
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `"${userMessage.content}"에 대한 답변입니다.\n\n몬스테라의 경우 흙이 마르면 충분히 물을 주세요. 간접광이 좋으며, 18-27°C가 적당합니다. 🌿\n\n더 궁금한 점이 있으시면 언제든 물어보세요!`,
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleExampleClick = (question) => {
    setInput(question);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-green-600" />
          식물 관리법 AI 챗봇
        </DialogTitle>
        <DialogDescription>
          식물 관리에 대한 모든 궁금증을 AI에게 물어보세요
        </DialogDescription>
      </DialogHeader>
      
      {/* 메시지 영역 */}
      <div className="max-h-[400px] overflow-y-auto space-y-3 py-4 px-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Bot className="w-5 h-5 text-green-600" />
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-2 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <Bot className="w-5 h-5 text-green-600" />
            </div>
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 예시 질문 (메시지가 1개일 때만) */}
      {messages.length === 1 && (
        <div className="space-y-2 pb-4">
          <p className="text-sm text-gray-600 font-medium">💡 이런 질문을 해보세요:</p>
          <div className="flex flex-wrap gap-2">
            {exampleQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(question)}
                className="text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 입력 영역 */}
      <div className="flex gap-2 pt-2 border-t">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="질문을 입력하세요..."
          className="flex-1 min-h-[60px] resize-none"
          disabled={isTyping}
        />
        <Button
          onClick={handleSendMessage}
          disabled={isTyping || !input.trim()}
          className="self-end bg-green-600 hover:bg-green-700"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* 전체 기능 링크 */}
      <div className="pt-3 border-t">
        <Link to="/care">
          <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50">
            전체 챗봇 기능 사용하기 →
          </Button>
        </Link>
      </div>
    </>
  );
}

