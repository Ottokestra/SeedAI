import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Loader2, AlertTriangle, CheckCircle, Bug, Shield, X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export default function PestDisease() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  // 파일 선택 처리
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setResult(null);
    }
  };

  // 드래그 앤 드롭
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setResult(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // 이미지 제거
  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
  };

  // 분석 시작 (임시 데이터)
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setAnalyzing(true);

    // 임시 분석 결과 (3초 후)
    setTimeout(() => {
      // 랜덤으로 건강/병충해 결과 생성
      const isHealthy = Math.random() > 0.5;

      if (isHealthy) {
        setResult({
          status: 'healthy',
          confidence: 95.8,
          message: '건강한 식물입니다!',
          description: '현재 식물은 병충해 증상이 발견되지 않았습니다. 계속해서 좋은 관리를 유지하세요.',
          tips: [
            '현재의 물주기 패턴을 유지하세요',
            '정기적으로 잎을 확인하여 예방하세요',
            '통풍이 잘 되는 환경을 유지하세요'
          ]
        });
      } else {
        setResult({
          status: 'disease',
          confidence: 87.3,
          diseaseType: '잎마름병 (Leaf Blight)',
          severity: 'medium',
          message: '병충해가 발견되었습니다',
          description: '잎에 갈색 반점과 마른 부분이 관찰됩니다. 빠른 조치가 필요합니다.',
          symptoms: [
            '잎 끝부분이 갈색으로 변함',
            '잎에 불규칙한 반점이 생김',
            '일부 잎이 시들고 마름'
          ],
          causes: [
            '과습 또는 물 부족',
            '통풍 불량',
            '과도한 직사광선'
          ],
          solutions: [
            '영향받은 잎을 제거하세요',
            '물주기를 조절하여 흙이 적절히 마르도록 하세요',
            '통풍이 잘 되는 곳으로 이동하세요',
            '친환경 살균제를 사용하세요',
            '직사광선을 피하고 간접광 환경을 제공하세요'
          ],
          prevention: [
            '정기적으로 잎을 확인하고 청소하세요',
            '과습을 피하고 배수가 잘 되도록 하세요',
            '적절한 간격으로 식물을 배치하세요'
          ]
        });
      }
      setAnalyzing(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Bug className="w-10 h-10 text-emerald-600" />
            <h1 className="text-4xl font-bold text-emerald-900">
              병충해 진단
            </h1>
          </div>
          <p className="text-lg text-neutral-600">
            AI가 식물의 병충해를 진단하고 해결책을 제시합니다
          </p>
          <p className="text-sm text-amber-600 mt-2">
            ⚠️ 현재는 시연용 임시 데이터를 사용합니다. 백엔드 연동 후 실제 진단이 가능합니다.
          </p>
        </motion.div>

        {/* 이미지 업로드 */}
        {!preview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-2 border-dashed border-emerald-300 bg-emerald-50/30">
              <CardContent className="p-12">
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="text-center"
                >
                  <Upload className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
                  <h3 className="text-xl font-semibold text-emerald-900 mb-2">
                    식물 사진 업로드
                  </h3>
                  <p className="text-neutral-600 mb-6">
                    병충해가 의심되는 식물의 잎이나 줄기를 촬영해주세요
                  </p>
                  <input
                    type="file"
                    id="file-upload"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label htmlFor="file-upload">
                    <Button
                      as="span"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      사진 선택하기
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 이미지 미리보기 및 분석 */}
        {preview && !result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>업로드된 이미지</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="text-neutral-500 hover:text-neutral-700"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="relative">
                  <img
                    src={preview}
                    alt="업로드된 식물"
                    className="w-full h-96 object-cover rounded-lg shadow-lg"
                  />
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-6 text-lg"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      AI 분석 중...
                    </>
                  ) : (
                    <>
                      <Bug className="w-5 h-5 mr-2" />
                      병충해 진단 시작
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 분석 결과 */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* 이미지 */}
            <Card>
              <CardContent className="p-6">
                <img
                  src={preview}
                  alt="분석된 식물"
                  className="w-full h-64 object-cover rounded-lg shadow-md"
                />
              </CardContent>
            </Card>

            {/* 진단 결과 */}
            <Card className={`border-2 ${result.status === 'healthy' ? 'border-green-400 bg-green-50' : 'border-amber-400 bg-amber-50'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {result.status === 'healthy' ? (
                      <>
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <span className="text-green-900">{result.message}</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                        <span className="text-amber-900">{result.message}</span>
                      </>
                    )}
                  </CardTitle>
                  <Badge variant={result.status === 'healthy' ? 'success' : 'warning'}>
                    신뢰도: {result.confidence}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-neutral-700">{result.description}</p>

                {result.status === 'disease' && (
                  <>
                    {/* 병명 */}
                    <div className="bg-white rounded-lg p-4 border border-amber-200">
                      <h4 className="font-semibold text-amber-900 mb-2">진단명</h4>
                      <p className="text-lg font-bold text-amber-700">{result.diseaseType}</p>
                      <Badge className="mt-2" variant={
                        result.severity === 'high' ? 'destructive' :
                        result.severity === 'medium' ? 'warning' : 'secondary'
                      }>
                        심각도: {result.severity === 'high' ? '높음' : result.severity === 'medium' ? '중간' : '낮음'}
                      </Badge>
                    </div>

                    {/* 증상 */}
                    <div className="bg-white rounded-lg p-4 border border-amber-200">
                      <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        관찰된 증상
                      </h4>
                      <ul className="space-y-1">
                        {result.symptoms.map((symptom, idx) => (
                          <li key={idx} className="text-neutral-700 flex items-start gap-2">
                            <span className="text-amber-500 mt-1">•</span>
                            <span>{symptom}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 원인 */}
                    <div className="bg-white rounded-lg p-4 border border-amber-200">
                      <h4 className="font-semibold text-amber-900 mb-2">가능한 원인</h4>
                      <ul className="space-y-1">
                        {result.causes.map((cause, idx) => (
                          <li key={idx} className="text-neutral-700 flex items-start gap-2">
                            <span className="text-amber-500 mt-1">•</span>
                            <span>{cause}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 해결 방법 */}
                    <div className="bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg p-4 border border-emerald-300">
                      <h4 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        치료 및 해결 방법
                      </h4>
                      <ul className="space-y-2">
                        {result.solutions.map((solution, idx) => (
                          <li key={idx} className="text-emerald-800 flex items-start gap-2">
                            <span className="text-emerald-600 font-bold mt-1">{idx + 1}.</span>
                            <span>{solution}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 예방법 */}
                    <div className="bg-white rounded-lg p-4 border border-emerald-200">
                      <h4 className="font-semibold text-emerald-900 mb-2">재발 방지 팁</h4>
                      <ul className="space-y-1">
                        {result.prevention.map((tip, idx) => (
                          <li key={idx} className="text-neutral-700 flex items-start gap-2">
                            <span className="text-emerald-500 mt-1">✓</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {result.status === 'healthy' && (
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      관리 팁
                    </h4>
                    <ul className="space-y-1">
                      {result.tips.map((tip, idx) => (
                        <li key={idx} className="text-neutral-700 flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 액션 버튼 */}
            <div className="flex gap-4">
              <Button
                onClick={handleRemoveImage}
                variant="outline"
                className="flex-1"
              >
                다시 진단하기
              </Button>
              <Button
                onClick={() => navigate('/care')}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              >
                관리법 확인하기
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

