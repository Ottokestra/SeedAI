import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Leaf } from 'lucide-react';

export default function ResultList({ identification, careGuide, growthPrediction, uploadedImageUrl }) {
  const navigate = useNavigate();

  if (!identification) {
    return null;
  }

  // 식물 ID 생성 (URL 파라미터용)
  const plantId = identification.plant_name.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full space-y-6 mt-8">
      {/* 식별 결과 */}
      <section aria-label="식별 결과">
        <h2 className="text-2xl font-bold text-emerald-800 mb-4">식별 결과</h2>
        <Card className="rounded-2xl shadow-lg border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <Leaf className="w-5 h-5 text-emerald-500" aria-hidden="true" />
              {identification.plant_name}
              {identification.scientific_name && (
                <span className="text-sm font-normal text-emerald-600 italic">
                  ({identification.scientific_name})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 신뢰도 Progress Bar */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-emerald-700">신뢰도</span>
                <span className="text-sm font-bold text-emerald-800">
                  {(identification.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={identification.confidence * 100} 
                className="h-3 bg-emerald-100"
                aria-label={`신뢰도 ${(identification.confidence * 100).toFixed(1)}%`}
              />
            </div>

            {/* 다른 가능성 */}
            {identification.common_names && identification.common_names.length > 0 && (
              <div>
                <span className="text-sm font-medium text-emerald-700 mb-2 block">
                  다른 가능성:
                </span>
                <div className="flex flex-wrap gap-2">
                  {identification.common_names.slice(0, 3).map((name, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    >
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={() => navigate(`/care/${plantId}`, { 
                  state: { identification, careGuide, uploadedImageUrl } 
                })}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-full"
                aria-label={`${identification.plant_name} 관리법 보기`}
              >
                관리법 보기
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 관리 팁 (진단 결과 대신) */}
      {careGuide && careGuide.tips && careGuide.tips.length > 0 && (
        <section aria-label="관리 팁">
          <h2 className="text-2xl font-bold text-emerald-800 mb-4">관리 팁</h2>
          <Card className="rounded-2xl shadow-lg border-emerald-200 bg-emerald-50">
            <CardContent className="pt-6">
              <ul className="space-y-2" role="list">
                {careGuide.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-emerald-800">
                    <span className="text-emerald-600 font-bold">💡</span>
                    <span className="font-medium">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

