// src/pages/Growth.jsx
import React, { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import GrowthChart from "../components/GrowthChart";
import useGrowthData from "../hooks/useGrowthData";
import { loadPlantMeta } from "../utils/storage";

export default function Growth() {
  const location = useLocation();
  const { run, loading, error, payload } = useGrowthData();

  // 분석 페이지에서 넘어온 값 (없을 수 있음)
  const originalFile = location?.state?.originalFile || location?.state?.file || null;
  const speciesFromNav = location?.state?.identification?.plant_name || location?.state?.species || null;

  // 최초 진입 시 자동 호출
  useEffect(() => {
    const meta = loadPlantMeta();
    const startSpecies = speciesFromNav || meta?.plant_name || meta?.scientific_name || null;
    run({ file: originalFile, species: startSpecies, periods: 12 }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- 응답 매핑 ----------
  const g = payload?.growth_graph || null;
  const periodUnit = g?.period_unit === "week" ? "W" : "M";
  const chartRows = useMemo(() => {
    if (!g || !g.good_growth || !Array.isArray(g.good_growth) || g.good_growth.length === 0) {
      return [];
    }
    
    try {
      return g.good_growth.map((p, i) => {
        if (!p || typeof p.period === 'undefined' || typeof p.size === 'undefined') {
          return null;
        }
        
        let label;
        if (p.period === 0) {
          label = "현재";
        } else if (periodUnit === "W") {
          label = `W${p.period}`;
        } else {
          label = `M${p.period}`;
        }
        
        return {
          label,
          good: typeof p.size === 'number' ? p.size : 0,
          bad: (g.bad_growth && Array.isArray(g.bad_growth) && g.bad_growth[i] && typeof g.bad_growth[i].size === 'number') 
            ? g.bad_growth[i].size 
            : null
        };
      }).filter(item => item !== null);
    } catch (err) {
      console.error("차트 데이터 변환 오류:", err);
      return [];
    }
  }, [g, periodUnit]);

  // monthly_data를 백엔드 응답 형식에 맞게 변환
  const monthlyData = useMemo(() => {
    const raw = payload?.monthly_data || [];
    if (!raw || !Array.isArray(raw)) return [];
    
    return raw.map((row, idx) => {
      const period = row.period || (idx === 0 ? "현재" : `${idx}개월`);
      const expected = row.expected_height || 0;
      const good = row.good_condition_height || row.good || null;
      const bad = row.bad_condition_height || row.bad || null;
      const typical = expected || (good && bad ? (good + bad) / 2 : (good || bad || 0));
      
      return {
        label: period,
        typical: typeof typical === 'number' ? typical : 0,
        good: typeof good === 'number' ? good : null,
        bad: typeof bad === 'number' ? bad : null
      };
    });
  }, [payload?.monthly_data]);

  const analysisText = payload?.comprehensive_analysis || "";

  return (
    <main className="max-w-6xl mx-auto p-4">
      <header className="mb-4">
        <h2 className="text-2xl font-semibold text-emerald-900">성장 예측</h2>
        <p className="text-emerald-700">{(payload?.identification?.plant_name || "식물")}의 12개월 성장 예측 데이터입니다.</p>
      </header>

      {/* 차트 */}
      <section className="mb-6 border border-emerald-200 rounded-xl p-4">
        <h3 className="font-semibold text-emerald-900 mb-2">12개월 성장 예측 차트</h3>
        {loading && <div className="text-emerald-700">계산 중…</div>}
        {error && <div className="text-red-600 text-sm">에러: {error?.status} {error?.message}</div>}
        <GrowthChart
          rows={chartRows}
          min={g?.min_size ?? 0}
          max={g?.max_size ?? 200}
          unitLabel="cm"
        />
      </section>

      {/* 월별 데이터 + AI 분석 (좌/우) */}
      <section className="border border-emerald-200 rounded-xl p-4">
        <h3 className="font-semibold text-emerald-900 mb-4">월별 데이터 전체</h3>
        {monthlyData.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 왼쪽: 표 */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">기간</th>
                    <th className="text-right py-2 px-2">일반(cm)</th>
                    <th className="text-right py-2 px-2 text-emerald-700">좋음(cm)</th>
                    <th className="text-right py-2 px-2 text-red-600">나쁨(cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((r, idx) => (
                    <tr key={idx} className="border-b hover:bg-emerald-50/40">
                      <td className="py-2 px-2">{r.label}</td>
                      <td className="py-2 px-2 text-right">{r.typical?.toFixed?.(1) ?? r.typical} cm</td>
                      <td className="py-2 px-2 text-right text-emerald-700 font-semibold">{r.good?.toFixed?.(1) ?? r.good} cm</td>
                      <td className="py-2 px-2 text-right text-red-600">{r.bad?.toFixed?.(1) ?? r.bad} cm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 오른쪽: 종합 설명 */}
            <aside className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg whitespace-pre-line">
              <h4 className="font-bold text-blue-800 mb-3 text-lg">AI 종합 설명 및 조언</h4>
              <div className="text-blue-800 leading-relaxed">{analysisText || "분석 텍스트가 없습니다."}</div>
            </aside>
          </div>
        ) : (
          <div className="text-center py-8 text-emerald-600">월별 데이터가 없습니다.</div>
        )}
      </section>
    </main>
  );
}
