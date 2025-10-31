import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { 
  Bug,
  Upload,
  Camera,
  Image as ImageIcon,
  X,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Shield,
  Info
} from 'lucide-react';
import { identifyPlant } from '../api/client';

export default function Disease() {
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

  // 병충해 진단 상태
  const [diseaseAnalysis, setDiseaseAnalysis] = useState({
    isAnalyzed: false,
    diseases: []
  });
  const [analyzing, setAnalyzing] = useState(false);

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

  // 종식별 - 파일 처리
  const processIdentifyFile = (f) => {
    if (!f) return;
    
    if (!f.type.startsWith('image/')) {
      toast({
        title: '이미지 파일만 업로드 가능합니다',
        variant: 'destructive',
      });
      return;
    }

    setIdentifyFile(f);
    const previewUrl = URL.createObjectURL(f);
    setIdentifyPreview(previewUrl);
    setIdentifyResult(null);
    setDiseaseAnalysis({ isAnalyzed: false, diseases: [] });
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
    setDiseaseAnalysis({ isAnalyzed: false, diseases: [] });
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // 종식별 다시 하기
  const handleReIdentify = () => {
    setShowIdentify(true);
    setIdentifyResult(null);
    setIdentifyFile(null);
    setIdentifyPreview('');
    setDiseaseAnalysis({ isAnalyzed: false, diseases: [] });
    localStorage.removeItem('latest-plant-identification');
  };

  // 병충해 분석 (임시 데이터)
  const handleDiseaseAnalysis = () => {
    setAnalyzing(true);
    
    toast({
      title: '병충해 분석 중...',
      description: 'AI가 이미지를 분석하고 있습니다.',
    });

    // 임시 데이터 생성
    setTimeout(() => {
      const mockDiseases = [
        {
          name: '흰가루병',
          probability: 85,
          severity: 'high',
          symptoms: '잎 표면에 흰색 가루 같은 곰팡이가 발생하며, 심하면 잎이 말라 떨어집니다.',
          treatment: '감염된 잎을 즉시 제거하고, 살균제를 7-10일 간격으로 2-3회 살포합니다. 통풍을 개선하고 잎에 물이 묻지 않도록 주의하세요.',
          prevention: '통풍이 잘 되는 곳에 배치하고, 과습을 피하며, 정기적으로 잎을 확인합니다.'
        },
        {
          name: '진딧물',
          probability: 65,
          severity: 'medium',
          symptoms: '새순이나 잎 뒷면에 작은 녹색/검은색 벌레가 군집하여 즙을 빨아먹습니다.',
          treatment: '물로 세척하거나 친환경 살충제(님오일, 제충국 등)를 사용합니다. 심한 경우 전용 살충제를 사용하세요.',
          prevention: '정기적으로 잎을 관찰하고, 통풍을 유지하며, 무당벌레 같은 천적을 활용할 수 있습니다.'
        },
        {
          name: '응애',
          probability: 30,
          severity: 'low',
          symptoms: '잎에 작은 반점이 생기고 거미줄 같은 실이 보이며, 잎 색이 퇴색됩니다.',
          treatment: '습도를 높이고 살비제를 사용합니다. 물로 잎을 자주 씻어주는 것도 도움이 됩니다.',
          prevention: '습도를 적절히 유지하고(50% 이상), 건조한 환경을 피하며, 정기적으로 잎을 점검합니다.'
        }
      ];

      setDiseaseAnalysis({
        isAnalyzed: true,
        diseases: mockDiseases
      });
      setAnalyzing(false);

      toast({
        title: '분석 완료!',
        description: `${mockDiseases.length}개의 병충해가 감지되었습니다.`,
      });
    }, 2000);
  };

  // 위험도에 따른 색상
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-700 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'low': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default: return '알 수 없음';
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-73px)] bg-emerald-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 헤더 */}
        <motion.header 
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-emerald-800 mb-3 flex items-center justify-center gap-2">
            <Bug className="w-8 h-8 text-emerald-500" />
            병충해 진단
          </h1>
          <p className="text-lg text-emerald-600">
            식물 이미지를 업로드하여 병충해를 진단받으세요
          </p>
        </motion.header>

        {/* 임시 데이터 안내 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
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
                    백엔드 개발 중이므로 임시 병충해 진단 데이터를 표시합니다. 실제 AI 진단은 곧 제공될 예정입니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 종식별 결과 표시 */}
        {identifyResult && !showIdentify && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
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
                    {!diseaseAnalysis.isAnalyzed && (
                      <Button
                        onClick={handleDiseaseAnalysis}
                        disabled={analyzing}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full"
                      >
                        {analyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            분석 중...
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            병충해 분석 시작
                          </>
                        )}
                      </Button>
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="rounded-2xl shadow-lg border-emerald-200">
              <CardHeader>
                <CardTitle className="text-emerald-800">식물 종 식별</CardTitle>
                <p className="text-sm text-emerald-600">
                  먼저 식물을 식별해주세요
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {!identifyPreview ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => processIdentifyFile(e.target.files?.[0])}
                          className="hidden"
                          id="gallery-upload-disease"
                        />
                        <label
                          htmlFor="gallery-upload-disease"
                          className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-emerald-300 rounded-xl hover:bg-emerald-50 cursor-pointer transition h-40"
                        >
                          <ImageIcon className="w-12 h-12 text-emerald-500 mb-2" />
                          <span className="text-sm font-medium text-emerald-700">
                            갤러리에서 선택
                          </span>
                        </label>
                      </div>

                      <div>
                        <input
                          ref={cameraInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => processIdentifyFile(e.target.files?.[0])}
                          className="hidden"
                          id="camera-upload-disease"
                        />
                        <label
                          htmlFor="camera-upload-disease"
                          className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-emerald-300 rounded-xl hover:bg-emerald-50 cursor-pointer transition h-40"
                        >
                          <Camera className="w-12 h-12 text-emerald-500 mb-2" />
                          <span className="text-sm font-medium text-emerald-700">
                            카메라로 촬영
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-emerald-700">
                        또는 식물 이름을 직접 입력하세요
                      </p>
                      <Input
                        placeholder="예: 몬스테라, 장미, 선인장"
                        className="rounded-lg border-emerald-200"
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
                  <div className="space-y-4">
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

        {/* 병충해 진단 결과 */}
        {diseaseAnalysis.isAnalyzed && diseaseAnalysis.diseases.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-emerald-800">
                진단 결과 ({diseaseAnalysis.diseases.length}개 발견)
              </h2>
              <Button
                onClick={handleDiseaseAnalysis}
                variant="outline"
                size="sm"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                다시 분석
              </Button>
            </div>

            {diseaseAnalysis.diseases.map((disease, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
              >
                <Card className={`rounded-xl shadow-md border-2 ${getSeverityColor(disease.severity)}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        {disease.name}
                      </CardTitle>
                      <Badge 
                        variant="outline" 
                        className={`${getSeverityColor(disease.severity)} border-2 px-3 py-1`}
                      >
                        위험도: {getSeverityLabel(disease.severity)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 감염 확률 */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">감염 확률</span>
                        <span className="text-sm font-bold">{disease.probability}%</span>
                      </div>
                      <Progress value={disease.probability} className="h-3" />
                    </div>

                    {/* 증상 */}
                    <div className="p-3 bg-white/50 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <span className="text-lg">📋</span>
                        증상
                      </h4>
                      <p className="text-sm">{disease.symptoms}</p>
                    </div>

                    {/* 대처 방법 */}
                    <div className="p-3 bg-white/50 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <span className="text-lg">💊</span>
                        대처 방법
                      </h4>
                      <p className="text-sm">{disease.treatment}</p>
                    </div>

                    {/* 예방법 */}
                    <div className="p-3 bg-white/50 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <span className="text-lg">🛡️</span>
                        예방법
                      </h4>
                      <p className="text-sm">{disease.prevention}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

