import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { getGrowthById, getAllPlants } from '../data/growth';
import GrowthChart from '../components/GrowthChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Download, TrendingUp } from 'lucide-react';
import { exportToPDF } from '../utils/pdfExport';
import { useToast } from '@/hooks/use-toast';

// 통합 병합본 (main ⨉ dae)
export default function Growth() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const reportRef = useRef(null);

  const [selectedPlantId, setSelectedPlantId] = useState(id);
  const [showTempNotification, setShowTempNotification] = useState(false);
  
  // 백엔드 데이터가 있으면 우선 사용, 없으면 임시 데이터 사용
  const { identification, growthPrediction, uploadedImageUrl } = location.state || {};
  
  // 임시 성장 데이터 생성 함수
  const createTempGrowthData = (plantName, plantId) => {
    const baseGrowthRate = 3.5;
    const data = [];
    for (let i = 1; i <= 12; i++) {
      const height = Math.round((15 + (i - 1) * baseGrowthRate) * 10) / 10;
      data.push({
        month: `${i}개월`,
        height: height,
        min: Math.round(height * 0.9 * 10) / 10,
        max: Math.round(height * 1.1 * 10) / 10,
      });
    }
    return {
      id: plantId || id,
      name: plantName || '식물',
      scientificName: identification?.scientific_name || '',
      image: uploadedImageUrl || '/images/mimg.jpg',
      baseGrowthRate,
      data,
    };
  };

  // 무조건 데이터 표시 - 우선순위: 백엔드 실제 데이터 > 임시 데이터 > 목업 데이터
  let isRealData = false;
  
  const generateGrowthData = () => {
    if (growthPrediction && growthPrediction.stages && growthPrediction.stages.length > 0) {
      // 1. 백엔드에서 전달된 실제 성장 예측 데이터 사용
      isRealData = true;
      return {
        id,
        name: identification?.plant_name || id,
        scientificName: identification?.scientific_name || '',
        image: uploadedImageUrl || '/images/mimg.jpg',
        baseGrowthRate: 3.5,
        data: growthPrediction.stages.map((stage, idx) => ({
          month: stage.timeframe || `${idx + 1}개월`,
          height: stage.expected_height || (15 + idx * 3.5),
          min: (stage.expected_height || (15 + idx * 3.5)) * 0.9,
          max: (stage.expected_height || (15 + idx * 3.5)) * 1.1,
        })),
        stages: growthPrediction.stages,
      };
    } else if (identification) {
      // 2. 식별 데이터만 있는 경우 -> 무조건 임시 데이터 생성
      if (!showTempNotification) {
        setShowTempNotification(true);
      }
      return createTempGrowthData(identification.plant_name, id);
    } else {
      // 3. 아무 데이터도 없는 경우 -> 기본 임시 데이터 생성
      if (!showTempNotification) {
        setShowTempNotification(true);
      }
      const mockData = getGrowthById(selectedPlantId);
      return mockData || createTempGrowthData('식물', selectedPlantId || id);
    }
  };

  const growthData = generateGrowthData() || createTempGrowthData('기본 식물', id || 'default');
  
  // 임시 데이터 사용 알림
  useEffect(() => {
    if (showTempNotification && !isRealData) {
      toast({
        title: '임시 데이터 표시 중',
        description: '백엔드 개발 중이므로 임시 성장 데이터를 표시합니다.',
        variant: 'default',
      });
    }
  }, [showTempNotification, isRealData, toast]);
  
  const allPlants = getAllPlants();

  // PDF 내보내기
  async function handleExportPDF() {
    if (!reportRef.current) return;

    try {
      toast({
        title: 'PDF 생성 중...',
        description: '잠시만 기다려주세요.',
        variant: 'default',
      });

      await exportToPDF(reportRef.current, `${selectedPlantId}-growth-report.pdf`);

      toast({
        title: 'PDF 저장 완료',
        description: '성장 예측 리포트가 다운로드되었습니다.',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'PDF 생성 실패',
        description: '다시 시도해주세요.',
        variant: 'destructive',
      });
    }
  }

  return (
    <main className="w-full min-h-[calc(100vh-73px)] bg-emerald-50 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* 상단 헤더 + 드롭다운 */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-emerald-800 mb-2">🌿 예측해줘</h1>
            <p className="text-lg text-emerald-700">
              {growthData?.name || '식물'}의 12개월 성장 예측 데이터입니다.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <Select value={selectedPlantId} onValueChange={setSelectedPlantId}>
              <SelectTrigger className="w-[200px] rounded-lg border-emerald-300" aria-label="식물 선택">
                <SelectValue placeholder="식물 선택" />
              </SelectTrigger>
              <SelectContent>
                {allPlants.map((plant) => (
                  <SelectItem key={plant.id} value={plant.id}>
                    {plant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-full"
              aria-label="이전 페이지로 돌아가기"
            >
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              뒤로
            </Button>
          </div>
        </header>

        {/* PDF 출력 대상 영역 */}
        <div ref={reportRef} className="space-y-6 bg-white p-8 rounded-2xl shadow-lg border-emerald-200">
          {/* 요약 정보 */}
          <section aria-label="성장 요약">
            <Card className="rounded-xl border-emerald-200 bg-white">
              <CardHeader>
                <CardTitle className="text-emerald-800 text-xl">예측 요약</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-emerald-600 mb-1">기본 성장률</p>
                  <p className="text-2xl font-bold text-emerald-800">
                    {growthData?.baseGrowthRate || 3.5} cm/월
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-emerald-600 mb-1">12개월 후 예상 높이</p>
                  <p className="text-2xl font-bold text-emerald-800">
                    {growthData?.data?.[11]?.height || growthData?.data?.[growthData.data.length - 1]?.height || 50} cm
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-emerald-600 mb-1">예상 범위</p>
                  <p className="text-2xl font-bold text-emerald-800">
                    ±10%
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 차트 */}
          <section aria-label="성장 차트">
            <Card className="rounded-xl border-emerald-200">
              <CardHeader>
                <CardTitle className="text-emerald-800">12개월 성장 예측 차트</CardTitle>
              </CardHeader>
              <CardContent>
                {growthData?.data && growthData.data.length > 0 ? (
                  <GrowthChart data={growthData.data} plantName={growthData.name} />
                ) : (
                  <p className="text-center text-emerald-600 py-8">데이터를 불러오는 중...</p>
                )}
              </CardContent>
            </Card>
          </section>

          {/* 상세 데이터 테이블 */}
          <section aria-label="상세 데이터">
            <Card className="rounded-xl border-emerald-200">
              <CardHeader>
                <CardTitle className="text-emerald-800">월별 상세 데이터</CardTitle>
              </CardHeader>
              <CardContent>
                {growthData?.data && growthData.data.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" role="table">
                      <thead>
                        <tr className="border-b-2 border-emerald-200">
                          <th className="text-left py-3 px-4 text-emerald-800 font-bold">기간</th>
                          <th className="text-right py-3 px-4 text-emerald-800 font-bold">예상 높이</th>
                          <th className="text-right py-3 px-4 text-emerald-800 font-bold">최소</th>
                          <th className="text-right py-3 px-4 text-emerald-800 font-bold">최대</th>
                        </tr>
                      </thead>
                      <tbody>
                        {growthData.data.map((row, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-emerald-100 hover:bg-emerald-50"
                          >
                            <td className="py-3 px-4 text-emerald-700">{row.month}</td>
                            <td className="py-3 px-4 text-right font-bold text-emerald-800">
                              {row.height} cm
                            </td>
                            <td className="py-3 px-4 text-right text-emerald-600">
                              {row.min} cm
                            </td>
                            <td className="py-3 px-4 text-right text-emerald-600">
                              {row.max} cm
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-emerald-600 py-8">데이터를 불러오는 중...</p>
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        {/* PDF 내보내기 버튼 */}
        <div className="flex justify-center">
          <Button
            onClick={handleExportPDF}
            className="px-8 py-6 text-lg font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg"
            aria-label="PDF 리포트 내보내기"
          >
            <Download className="w-5 h-5 mr-2" aria-hidden="true" />
            PDF 리포트 내보내기
          </Button>
        </div>
      </div>
    </main>
  );
}

