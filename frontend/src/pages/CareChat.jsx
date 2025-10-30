import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Trash2,
  Loader2
} from 'lucide-react';

export default function CareChat() {
  const { toast } = useToast();
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: '안녕하세요! 🌱 AI 식물 관리 상담사입니다.\n식물 관리에 대해 무엇이든 물어보세요!',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 예시 질문들
  const exampleQuestions = [
    '몬스테라 물주기 주기는 어떻게 되나요?',
    '잎이 노랗게 변하는 이유가 뭔가요?',
    '겨울철 식물 관리법을 알려주세요',
    '햇빛을 많이 받아야 하는 식물은?',
    '초보자가 키우기 쉬운 식물 추천해주세요',
    '식물 잎에 흰 가루가 생겼어요',
  ];

  // 메시지 전송
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) {
      toast({
        title: '메시지를 입력해주세요',
        variant: 'destructive',
      });
      return;
    }

    // 사용자 메시지 추가
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // 백엔드 API 호출 시뮬레이션 (나중에 실제 API로 교체)
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `"${input.trim()}"에 대한 답변입니다.\n\n현재 백엔드 개발 중이므로, 실제 AI 응답은 곧 제공됩니다. 🌿\n\n몬스테라의 경우:\n• 물주기: 흙이 마르면 충분히 주세요\n• 햇빛: 간접광이 좋습니다\n• 온도: 18-27°C가 적당합니다\n\n더 궁금한 점이 있으시면 언제든 물어보세요!`,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  // 예시 질문 클릭
  const handleExampleClick = (question) => {
    setInput(question);
    textareaRef.current?.focus();
  };

  // 대화 초기화
  const handleClearChat = () => {
    if (confirm('모든 대화 내역을 삭제하시겠습니까?')) {
      setMessages([
        {
          id: 1,
          role: 'assistant',
          content: '안녕하세요! 🌱 AI 식물 관리 상담사입니다.\n식물 관리에 대해 무엇이든 물어보세요!',
          timestamp: new Date().toISOString(),
        }
      ]);
      toast({
        title: '대화 내역이 삭제되었습니다',
      });
    }
  };

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // textarea 높이 자동 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  return (
    <div className="w-full h-[calc(100vh-73px)] flex flex-col bg-emerald-50">
      <div className="max-w-4xl mx-auto w-full flex flex-col h-full">
        {/* 헤더 */}
        <motion.header 
          className="py-6 px-4 bg-white border-b border-emerald-200"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-emerald-800 mb-2 flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-emerald-500" />
                AI 식물 관리법 상담
              </h1>
              <p className="text-emerald-600">
                식물 관리에 대해 무엇이든 물어보세요
              </p>
            </div>
            {messages.length > 1 && (
              <Button
                onClick={handleClearChat}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                대화 초기화
              </Button>
            )}
          </div>
        </motion.header>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* 아바타 */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-white border-2 border-emerald-300 text-emerald-600'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-5 h-5" />
                    ) : (
                      <Bot className="w-5 h-5" />
                    )}
                  </div>

                  {/* 메시지 카드 */}
                  <Card className={`${
                    message.role === 'user'
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-white border-emerald-200'
                  } shadow-md`}>
                    <CardContent className="p-4">
                      <p className={`text-sm whitespace-pre-wrap ${
                        message.role === 'user' ? 'text-white' : 'text-emerald-900'
                      }`}>
                        {message.content}
                      </p>
                      <p className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-emerald-100' : 'text-emerald-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* 로딩 표시 */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex gap-3 max-w-[80%]">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-white border-2 border-emerald-300 text-emerald-600">
                  <Bot className="w-5 h-5" />
                </div>
                <Card className="bg-white border-emerald-200 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">답변을 생성하고 있습니다...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 예시 질문 (메시지가 1개일 때만 표시) */}
        {messages.length === 1 && (
          <motion.div 
            className="px-4 pb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <p className="text-sm text-emerald-700 font-medium mb-3">💡 이런 질문을 해보세요:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {exampleQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(question)}
                  className="text-left px-4 py-3 bg-white hover:bg-emerald-50 border border-emerald-200 hover:border-emerald-400 rounded-lg text-sm text-emerald-700 transition"
                >
                  {question}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* 입력 영역 */}
        <div className="bg-white border-t border-emerald-200 p-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="식물 관리에 대해 질문해보세요... (Shift+Enter로 줄바꿈)"
              className="flex-1 min-h-[60px] max-h-[200px] resize-none rounded-lg border-emerald-200 focus:ring-2 focus:ring-emerald-500"
              disabled={isLoading}
              rows={1}
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="self-end px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
          <p className="text-xs text-emerald-600 mt-2 text-center">
            Enter로 전송 • Shift+Enter로 줄바꿈
          </p>
        </div>
      </div>
    </div>
  );
}

