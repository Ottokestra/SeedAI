import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Trash2,
  Loader2,
  Upload,
  X,
  RefreshCw,
  Camera,
  Image as ImageIcon,
  ArrowRight
} from 'lucide-react';
import { identifyPlant } from '../api/client';

export default function CareChat() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // 종식별 관련 상태
  const [showIdentify, setShowIdentify] = useState(false);
  const [identifyFile, setIdentifyFile] = useState(null);
  const [identifyPreview, setIdentifyPreview] = useState('');
  const [identifyLoading, setIdentifyLoading] = useState(false);
  const [identifyResult, setIdentifyResult] = useState(null);

  // 로컬스토리지에서 저장된 종식별 정보 불러오기
  useEffect(() => {
    const savedIdentification = localStorage.getItem('latest-plant-identification');
    if (savedIdentification) {
      try {
        const data = JSON.parse(savedIdentification);
        setIdentifyResult(data);
        setIdentifyPreview(data.uploadedImageUrl);
        setShowIdentify(false); // 이미 식별된 식물이 있으면 식별 UI 숨김
      } catch (error) {
        console.error('Error loading saved identification:', error);
      }
    } else {
      setShowIdentify(true); // 저장된 식물이 없으면 식별 UI 표시
    }
  }, []);

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

  // 종식별 - 파일 처리
  const processIdentifyFile = (f) => {
    if (!f) return;
    
    if (!f.type.startsWith('image/')) {
      toast({
        title: '이미지 파일만 업로드 가능합니다',
        description: 'jpg, png 등의 이미지 파일을 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setIdentifyFile(f);
    const previewUrl = URL.createObjectURL(f);
    setIdentifyPreview(previewUrl);
    setIdentifyResult(null);
  };

  // 종식별 실행
  const handleIdentifySubmit = async () => {
    if (!identifyFile) {
      toast({
        title: '이미지를 선택해주세요',
        description: '식별할 식물 이미지를 업로드해야 합니다.',
        variant: 'destructive',
      });
      return;
    }

    setIdentifyLoading(true);

    try {
      const data = await identifyPlant(identifyFile);
      
      if (data.success) {
        const savedData = {
          identification: data.identification,
          careGuide: data.care_guide,
          growthPrediction: data.growth_prediction,
          uploadedImageUrl: identifyPreview,
          timestamp: new Date().toISOString(),
        };
        
        // 로컬스토리지에 저장
        localStorage.setItem('latest-plant-identification', JSON.stringify(savedData));
        setIdentifyResult(savedData);
        setShowIdentify(false);

        toast({
          title: '식별 완료!',
          description: data.message || `${data.identification.plant_name} 식별 완료`,
          variant: 'default',
        });
      } else {
        toast({
          title: '식별 실패',
          description: data.message || '식물을 식별할 수 없습니다.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Identify error:', error);
      toast({
        title: '식별 실패',
        description: '네트워크 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIdentifyLoading(false);
    }
  };

  // 종식별 이미지 제거
  const handleRemoveIdentifyImage = () => {
    setIdentifyFile(null);
    setIdentifyPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // 종식별 다시 하기
  const handleReIdentify = () => {
    setShowIdentify(true);
    setIdentifyResult(null);
    setIdentifyFile(null);
    setIdentifyPreview('');
    localStorage.removeItem('latest-plant-identification');
  };

  // 관리법 상세 보기
  const handleViewCareDetail = () => {
    if (identifyResult && identifyResult.identification) {
      const plantId = identifyResult.identification.plant_name.toLowerCase().replace(/\s+/g, '-');
      navigate(`/care/${plantId}`, { 
        state: { 
          identification: identifyResult.identification,
          careGuide: identifyResult.careGuide,
          uploadedImageUrl: identifyResult.uploadedImageUrl
        } 
      });
    }
  };

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
    <div className="w-full min-h-[calc(100vh-73px)] flex flex-col bg-emerald-50">
      <div className="max-w-4xl mx-auto w-full p-4 space-y-6">
        {/* 헤더 */}
        <motion.header 
          className="text-center py-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-emerald-800 mb-3 flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-emerald-500" />
            식물 관리법
          </h1>
          <p className="text-lg text-emerald-600">
            식물을 식별하고 AI 상담을 통해 관리법을 알아보세요
          </p>
        </motion.header>

        {/* 종식별 결과 표시 */}
        {identifyResult && !showIdentify && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="rounded-2xl shadow-lg border-emerald-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-emerald-800">현재 식별된 식물</CardTitle>
                  <Button
                    onClick={handleReIdentify}
                    variant="outline"
                    size="sm"
                    className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-lg"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    다시 식별하기
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  {identifyPreview && (
                    <img
                      src={identifyPreview}
                      alt="식별된 식물"
                      className="w-32 h-32 rounded-xl object-cover shadow-md"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-emerald-800 mb-2">
                      {identifyResult.identification.plant_name}
                    </h3>
                    {identifyResult.identification.scientific_name && (
                      <p className="text-emerald-600 italic mb-3">
                        {identifyResult.identification.scientific_name}
                      </p>
                    )}
                    <Button
                      onClick={handleViewCareDetail}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full"
                    >
                      상세 관리법 보기
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 종식별 UI */}
        {showIdentify && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="rounded-2xl shadow-lg border-emerald-200">
              <CardHeader>
                <CardTitle className="text-emerald-800">식물 종 식별</CardTitle>
                <p className="text-sm text-emerald-600">
                  먼저 관리할 식물을 식별해주세요
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 이미지 업로드 영역 */}
                {!identifyPreview ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {/* 갤러리에서 선택 */}
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => processIdentifyFile(e.target.files?.[0])}
                          className="hidden"
                          id="gallery-upload"
                        />
                        <label
                          htmlFor="gallery-upload"
                          className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-emerald-300 rounded-xl hover:bg-emerald-50 cursor-pointer transition h-40"
                        >
                          <ImageIcon className="w-12 h-12 text-emerald-500 mb-2" />
                          <span className="text-sm font-medium text-emerald-700">
                            갤러리에서 선택
                          </span>
                        </label>
                      </div>

                      {/* 카메라로 촬영 */}
                      <div>
                        <input
                          ref={cameraInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => processIdentifyFile(e.target.files?.[0])}
                          className="hidden"
                          id="camera-upload"
                        />
                        <label
                          htmlFor="camera-upload"
                          className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-emerald-300 rounded-xl hover:bg-emerald-50 cursor-pointer transition h-40"
                        >
                          <Camera className="w-12 h-12 text-emerald-500 mb-2" />
                          <span className="text-sm font-medium text-emerald-700">
                            카메라로 촬영
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* 텍스트로 입력 */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-emerald-700">
                        또는 식물 이름을 직접 입력하세요
                      </p>
                      <Input
                        placeholder="예: 몬스테라, 장미, 선인장"
                        className="rounded-lg border-emerald-200"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            // 텍스트 입력으로 임시 데이터 생성
                            const plantName = e.target.value.trim();
                            const tempData = {
                              identification: {
                                plant_name: plantName,
                                scientific_name: '',
                                confidence: 1.0,
                              },
                              careGuide: null,
                              growthPrediction: null,
                              uploadedImageUrl: '/images/mimg.jpg',
                              timestamp: new Date().toISOString(),
                            };
                            localStorage.setItem('latest-plant-identification', JSON.stringify(tempData));
                            setIdentifyResult(tempData);
                            setIdentifyPreview('/images/mimg.jpg');
                            setShowIdentify(false);
                            toast({
                              title: '식물 등록 완료',
                              description: `${plantName}이(가) 등록되었습니다.`,
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 미리보기 */}
                    <div
                      className="w-full aspect-video rounded-xl border-2 border-emerald-200"
                      style={{
                        backgroundImage: `url(${identifyPreview})`,
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                      }}
                    />
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={handleIdentifySubmit}
                        disabled={identifyLoading}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full"
                      >
                        {identifyLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            식별 중...
                          </>
                        ) : (
                          '식별 시작'
                        )}
                      </Button>
                      <Button
                        onClick={handleRemoveIdentifyImage}
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50 rounded-full"
                      >
                        <X className="w-4 h-4 mr-2" />
                        삭제
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* AI 상담 채팅 (종식별 완료 후에만 표시) */}
        {identifyResult && !showIdentify && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="rounded-2xl shadow-lg border-emerald-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-emerald-800">AI 관리 상담</CardTitle>
                  {messages.length > 1 && (
                    <Button
                      onClick={handleClearChat}
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      초기화
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* 메시지 영역 */}
                <div className="h-[400px] overflow-y-auto px-2 py-4 space-y-4 mb-4">
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
                        <div className={`flex gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            message.role === 'user' 
                              ? 'bg-emerald-500 text-white' 
                              : 'bg-white border-2 border-emerald-300 text-emerald-600'
                          }`}>
                            {message.role === 'user' ? (
                              <User className="w-4 h-4" />
                            ) : (
                              <Bot className="w-4 h-4" />
                            )}
                          </div>
                          <div className={`px-4 py-2 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-emerald-50 text-emerald-900'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="flex gap-2 max-w-[80%]">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white border-2 border-emerald-300 text-emerald-600">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="px-4 py-2 rounded-lg bg-emerald-50">
                          <div className="flex items-center gap-2 text-emerald-600">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">답변 생성 중...</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* 예시 질문 */}
                {messages.length === 1 && (
                  <div className="mb-4">
                    <p className="text-sm text-emerald-700 font-medium mb-2">💡 이런 질문을 해보세요:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {exampleQuestions.slice(0, 4).map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleExampleClick(question)}
                          className="text-left px-3 py-2 bg-white hover:bg-emerald-50 border border-emerald-200 hover:border-emerald-400 rounded-lg text-xs text-emerald-700 transition"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 입력 영역 */}
                <form onSubmit={handleSubmit} className="flex gap-2">
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
                    placeholder="식물 관리에 대해 질문해보세요..."
                    className="flex-1 min-h-[60px] max-h-[120px] resize-none rounded-lg border-emerald-200"
                    disabled={isLoading}
                    rows={1}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="self-end bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
