import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { 
  TrendingUp,
  Upload,
  Camera,
  Image as ImageIcon,
  X,
  Loader2,
  RefreshCw,
  ArrowRight,
  Info
} from 'lucide-react';
import { identifyPlant } from '../api/client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

export default function GrowthStandalone() {
  const { toast } = useToast();
  const navigate = useNavigate();
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
        setShowIdentify(false);
      } catch (error) {
        console.error('Error loading saved identification:', error);
      }
    } else {
      setShowIdentify(true);
    }
  }, []);

  // 임시 성장 데이터 생성
  const generateGrowthData = () => {
    if (!identifyResult) return null;

    const plantName = identifyResult.identification.plant_name;
    const baseGrowthRate = 3.5;
    
    // 잘 키웠을 때 데이터
    const optimalData = [];
    // 못 키웠을 때 데이터
    const poorData = [];
    
    for (let i = 1; i <= 12; i++) {
      const optimalHeight = Math.round((15 + (i - 1) * baseGrowthRate) * 10) / 10;
      const poorHeight = Math.round((15 + (i - 1) * (baseGrowthRate * 0.6)) * 10) / 10;
      
      optimalData.push({
        month: `${i}개월`,
        optimal: optimalHeight,
        poor: poorHeight,
      });
      
      poorData.push({
        month: `${i}개월`,
        height: poorHeight,
      });
    }
    
    return {
      plantName,
      optimalData,
      lastOptimalHeight: optimalData[11].optimal,
      lastPoorHeight: poorData[11].height,
      baseGrowthRate,
    };
  };

  const growthData = generateGrowthData();

  // 드래그 앤 드롭 상태
  const [dragActive, setDragActive] = useState(false);

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

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processIdentifyFile(e.dataTransfer.files[0]);
    }
  };

  // 종식별 실행
  const handleIdentifySubmit = async () => {
    if (!identifyFile) {
      toast({
        title: '이미지를 선택해주세요',
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
        
        localStorage.setItem('latest-plant-identification', JSON.stringify(savedData));
        setIdentifyResult(savedData);
        setShowIdentify(false);

        toast({
          title: '식별 완료!',
          description: `${data.identification.plant_name} 식별 완료`,
        });
      } else {
        toast({
          title: '식별 실패',
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

  // 우리아이로 이동
  const handleGoToMyChild = () => {
    navigate('/mychild');
  };

  return (
    <div className="w-full min-h-[calc(100vh-73px)] bg-emerald-50 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* 헤더 */}
        <motion.header 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-emerald-800 mb-3">🌿 예측해줘</h1>
          <p className="text-lg text-emerald-700">
            식물을 식별하고 12개월 성장 예측을 확인하세요
          </p>
        </motion.header>

        {/* 종식별 결과 표시 */}
        {identifyResult && !showIdentify && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="rounded-2xl shadow-lg border-emerald-200 bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-emerald-800 text-xl">현재 식별된 식물</CardTitle>
                  <Button
                    onClick={handleReIdentify}
                    variant="outline"
                    size="sm"
                    className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-500 rounded-lg transition-all"
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
                      <p className="text-emerald-600 italic">
                        {identifyResult.identification.scientific_name}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 종식별 UI */}
        {showIdentify && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {!identifyPreview ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                      {/* 갤러리에서 선택 */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => processIdentifyFile(e.target.files?.[0])}
                        className="hidden"
                        id="gallery-upload-growth"
                      />
                      <label
                        htmlFor="gallery-upload-growth"
                        className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-emerald-300 rounded-xl hover:bg-emerald-50 cursor-pointer transition-all hover:border-emerald-500 hover:scale-105 bg-white"
                      >
                        <ImageIcon className="w-16 h-16 text-emerald-500 mb-3" />
                        <span className="text-lg font-semibold text-emerald-700 mb-1">
                          갤러리에서 선택
                        </span>
                        <span className="text-sm text-emerald-600">
                          저장된 사진 선택
                        </span>
                      </label>

                      {/* 카메라로 촬영 */}
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => processIdentifyFile(e.target.files?.[0])}
                        className="hidden"
                        id="camera-upload-growth"
                      />
                      <label
                        htmlFor="camera-upload-growth"
                        className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-emerald-300 rounded-xl hover:bg-emerald-50 cursor-pointer transition-all hover:border-emerald-500 hover:scale-105 bg-white"
                      >
                        <Camera className="w-16 h-16 text-emerald-500 mb-3" />
                        <span className="text-lg font-semibold text-emerald-700 mb-1">
                          카메라로 촬영
                        </span>
                        <span className="text-sm text-emerald-600">
                          웹캠으로 촬영
                        </span>
                      </label>
                    </div>

                  {/* 드래그 앤 드롭 안내 */}
                  <div
                    className={`p-6 border-2 border-dashed rounded-xl text-center transition-all ${
                      dragActive
                        ? 'border-emerald-500 bg-emerald-100'
                        : 'border-emerald-200 bg-emerald-50'
                    }`}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className={`w-12 h-12 mx-auto mb-2 transition-all ${
                      dragActive ? 'text-emerald-600 scale-110' : 'text-emerald-400'
                    }`} />
                    <p className="text-emerald-700 font-medium">
                      {dragActive ? '이미지를 여기에 놓으세요!' : '또는 이미지를 드래그 & 드롭'}
                    </p>
                    <p className="text-sm text-emerald-600 mt-1">
                      JPG, PNG 등 이미지 파일
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-emerald-700">
                      또는 식물 이름을 직접 입력하세요
                    </p>
                    <Input
                      placeholder="예: 몬스테라, 장미, 선인장"
                      className="rounded-lg border-emerald-200 focus:border-emerald-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
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
                <>
                  <div
                    className="w-full aspect-video rounded-xl border-2 border-emerald-200 bg-white overflow-hidden"
                    style={{
                      backgroundImage: `url(${identifyPreview})`,
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={handleRemoveIdentifyImage}
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                    >
                      <X className="w-4 h-4 mr-2" />
                      이미지 삭제
                    </Button>
                  </div>

                  <div className="flex justify-center">
                    <Button
                      onClick={handleIdentifySubmit}
                      disabled={identifyLoading}
                      className="px-10 py-6 text-lg font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {identifyLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          식별 중...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-5 h-5 mr-2" />
                          예측 시작
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
          </motion.div>
        )}

        {/* 로딩 오버레이 */}
        {identifyLoading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-emerald-500 animate-spin" />
                <h3 className="text-xl font-bold text-emerald-800 mb-2">이미지 분석 중...</h3>
                <p className="text-emerald-600">
                  AI가 식물을 식별하고 있습니다. 잠시만 기다려주세요.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 성장 그래프 (종식별 완료 후에만 표시) */}
        {identifyResult && !showIdentify && growthData && (
          <>
            {/* 임시 데이터 안내 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="rounded-xl shadow-md border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-800 font-medium mb-1">
                        임시 데이터 표시 중
                      </p>
                      <p className="text-xs text-blue-700">
                        백엔드 개발 중이므로 임시 성장 데이터를 표시합니다. 실제 데이터는 곧 제공될 예정입니다.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 비교 그래프 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="rounded-2xl shadow-lg border-emerald-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-emerald-800 text-xl">
                    12개월 예측 비교 그래프
                  </CardTitle>
                  <p className="text-sm text-emerald-600">
                    최적 관리 vs 부족한 관리
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={growthData.optimalData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                        <XAxis 
                          dataKey="month" 
                          stroke="#047857"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke="#047857"
                          style={{ fontSize: '12px' }}
                          label={{ value: '높이 (cm)', angle: -90, position: 'insideLeft', style: { fill: '#047857' } }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#f0fdf4', 
                            border: '1px solid #86efac',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="optimal" 
                          stroke="#10b981" 
                          strokeWidth={3}
                          name="최적 관리" 
                          dot={{ fill: '#10b981', r: 5 }}
                          activeDot={{ r: 7 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="poor" 
                          stroke="#f59e0b" 
                          strokeWidth={3}
                          strokeDasharray="5 5"
                          name="부족한 관리" 
                          dot={{ fill: '#f59e0b', r: 5 }}
                          activeDot={{ r: 7 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 그래프 설명 */}
                  <div className="mt-6 grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
                      <h4 className="font-bold text-emerald-800 mb-2 flex items-center gap-2">
                        <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                        최적 관리 (12개월 후: {growthData.lastOptimalHeight}cm)
                      </h4>
                      <ul className="text-sm text-emerald-700 space-y-1">
                        <li>• 적절한 물 공급</li>
                        <li>• 충분한 햇빛</li>
                        <li>• 정기적인 비료</li>
                        <li>• 병충해 예방</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-xl border-2 border-amber-200">
                      <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                        <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
                        부족한 관리 (12개월 후: {growthData.lastPoorHeight}cm)
                      </h4>
                      <ul className="text-sm text-amber-700 space-y-1">
                        <li>• 불규칙한 물주기</li>
                        <li>• 햇빛 부족</li>
                        <li>• 비료 미흡</li>
                        <li>• 관리 소홀</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 케어 팁 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="rounded-2xl shadow-lg border-emerald-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-emerald-800 text-xl">
                    {growthData.plantName} 관리 팁
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 rounded-xl">
                      <h4 className="font-bold text-emerald-800 mb-2">💧 물주기</h4>
                      <p className="text-sm text-emerald-700">
                        흙의 상태를 확인하여 표면이 마르면 충분히 물을 주세요. 
                        과습은 뿌리 썩음의 원인이 되므로 주의하세요.
                      </p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-xl">
                      <h4 className="font-bold text-emerald-800 mb-2">☀️ 햇빛</h4>
                      <p className="text-sm text-emerald-700">
                        간접광이 잘 드는 곳에 배치하세요. 
                        직사광선은 잎을 태울 수 있으니 피하는 것이 좋습니다.
                      </p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-xl">
                      <h4 className="font-bold text-emerald-800 mb-2">🌡️ 온도</h4>
                      <p className="text-sm text-emerald-700">
                        18-27°C 사이가 적당합니다. 
                        급격한 온도 변화는 식물에게 스트레스를 줄 수 있습니다.
                      </p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-xl">
                      <h4 className="font-bold text-emerald-800 mb-2">🌱 비료</h4>
                      <p className="text-sm text-emerald-700">
                        성장기(봄-여름)에는 2주에 한 번, 휴면기(가을-겨울)에는 한 달에 한 번 액체비료를 주세요.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 우리아이로 이동 버튼 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex justify-center"
            >
              <Button
                onClick={handleGoToMyChild}
                className="px-8 py-6 text-lg font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg"
              >
                우리아이에서 관리 계획 세우기
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

