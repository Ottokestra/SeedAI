import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getCareById } from '../data/careDB';
import CareTips from '../components/CareTips';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bug } from 'lucide-react';

export default function Care() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
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
