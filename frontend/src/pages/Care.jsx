import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getCareById } from '../data/careDB';
import CareTips from '../components/CareTips';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bug } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Care() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // 백엔드 데이터가 있으면 우선 사용, 없으면 목업 데이터 사용
  const { identification, careGuide, uploadedImageUrl } = location.state || {};

  // careGuide를 CareTips 컴포넌트 형식으로 변환 (필드명 매핑)
  const care = careGuide ? {
    id,
    name: identification?.plant_name || id,
    scientificName: identification?.scientific_name || '',
    image: uploadedImageUrl || '/images/mimg.jpg',
    // 백엔드 필드명 → 프론트엔드 필드명 매핑
    water: careGuide.watering || '',
    light: careGuide.sunlight || '',
    temp: careGuide.temperature || '',
    humidity: careGuide.humidity || '',
    soil: careGuide.soil || '',
    tips: careGuide.tips || []
  } : getCareById(id);

  // 병해충 진단 목업 데이터 (백엔드 개발 중)
  const [diseaseAnalysis, setDiseaseAnalysis] = useState({
    isAnalyzed: false,
    diseases: []
  });

  // 병해충 분석 시뮬레이션 (실제로는 백엔드 API 호출)
  function handleDiseaseAnalysis() {
    toast({
      title: '병해충 분석 중...',
      description: 'AI가 이미지를 분석하고 있습니다.',
      variant: 'default',
    });

    // 목업 데이터 (실제로는 백엔드 응답)
    setTimeout(() => {
      setDiseaseAnalysis({
        isAnalyzed: true,
        diseases: [
          {
            name: '흰가루병',
            probability: 85,
            severity: 'high',
            symptoms: '잎 표면에 흰색 가루 같은 곰팡이가 발생',
            treatment: '감염된 잎 제거 후 살균제 살포, 통풍 개선'
          },
          {
            name: '진딧물',
            probability: 65,
            severity: 'medium',
            symptoms: '새순이나 잎 뒷면에 작은 벌레가 군집',
            treatment: '물로 세척하거나 친환경 살충제 사용'
          },
          {
            name: '응애',
            probability: 30,
            severity: 'low',
            symptoms: '잎에 작은 반점과 거미줄 같은 실',
            treatment: '습도 유지 및 살비제 사용'
          }
        ]
      });

      toast({
        title: '분석 완료!',
        description: '병해충 진단 결과를 확인하세요.',
        variant: 'default',
      });
    }, 2000);
  }

  // 위험도에 따른 색상
  function getSeverityColor(severity) {
    switch (severity) {
      case 'high': return 'text-red-700 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'low': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  }

  function getSeverityLabel(severity) {
    switch (severity) {
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default: return '알 수 없음';
    }
  }

  // 404 처리
  if (!care) {
    return (
      <main className="w-full flex items-center justify-center px-4 py-12">
        <Card className="max-w-md w-full rounded-2xl shadow-lg">
          <CardContent className="pt-10 pb-8 text-center space-y-4">
            <h1 className="text-3xl font-bold text-emerald-800">식물을 찾을 수 없습니다</h1>
            <p className="text-emerald-700">
              요청하신 식물 ID(<code className="bg-emerald-100 px-2 py-1 rounded">{id}</code>)에 대한
              관리법이 존재하지 않습니다.
            </p>
            <Button
              onClick={() => navigate(-1)}
              className="mt-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full"
              aria-label="이전 페이지로 돌아가기"
            >
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              뒤로가기
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="w-full py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 상단 헤더 */}
        <header className="flex flex-col md:flex-row items-center gap-6 bg-white rounded-2xl shadow-lg p-6">
          <img
            src={care.image}
            alt={`${care.name} 이미지`}
            className="w-32 h-32 rounded-xl object-cover shadow-md"
          />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-bold text-emerald-800 mb-2">{care.name}</h1>
            <p className="text-lg text-emerald-600 italic">{care.scientificName}</p>
          </div>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-full"
            aria-label="이전 페이지로 돌아가기"
          >
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            뒤로가기
          </Button>
        </header>

        {/* 관리법 상세 */}
        <CareTips care={care} />

        {/* 액션 버튼 - 병해충 진단 */}
        <Button
          onClick={() => {
            // 현재 이미지를 병해충 페이지로 전달
            navigate('/pest', {
              state: {
                uploadedImageUrl,
                plantName: care.name
              }
            });
          }}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg py-6 text-lg font-bold"
        >
          <Bug className="w-5 h-5 mr-2" />
          병해충 진단하기
        </Button>
      </div>
    </main>
  );
}

