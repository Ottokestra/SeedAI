import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplet, Sun, Thermometer, Wind, Flower2, Lightbulb } from 'lucide-react';

export default function CareTips({ care }) {
  const sections = [
    { icon: Droplet, label: '물 주기', value: care.water, color: 'text-blue-600' },
    { icon: Sun, label: '햇빛', value: care.light, color: 'text-yellow-600' },
    { icon: Thermometer, label: '온도', value: care.temp, color: 'text-red-600' },
    { icon: Wind, label: '습도', value: care.humidity, color: 'text-cyan-600' },
    { icon: Flower2, label: '토양', value: care.soil, color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      {/* 항목별 관리 가이드 */}
      <section aria-label="관리 가이드">
        <h2 className="text-2xl font-bold text-emerald-800 mb-4">관리 가이드</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {sections.map((section) => (
            <Card key={section.label} className="rounded-xl border-emerald-200 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <section.icon className={`w-5 h-5 ${section.color}`} aria-hidden="true" />
                  <span className="text-emerald-800">{section.label}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-emerald-700 leading-relaxed">{section.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 케어 팁 */}
      <section aria-label="케어 팁">
        <h2 className="text-2xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-yellow-500" aria-hidden="true" />
          케어 팁
        </h2>
        <Card className="rounded-xl border-emerald-200 shadow-md">
          <CardContent className="pt-6">
            <ul className="space-y-3" role="list">
              {care.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5 bg-emerald-50 text-emerald-700 border-emerald-300">
                    TIP {idx + 1}
                  </Badge>
                  <span className="text-emerald-800 leading-relaxed flex-1">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

