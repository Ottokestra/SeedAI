// src/pages/Growth.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

import GrowthChart from "../components/GrowthChart";
import useGrowthData from "../hooks/useGrowthData";
import { loadPlantMeta } from "../utils/storage";

import { getGrowthById, getAllPlants } from "../data/growth";
import { exportToPDF } from "../utils/pdfExport";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Download, TrendingUp } from "lucide-react";

// 통합 병합본 (main ⨉ dae)
export default function Growth() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    const reportRef = useRef(null);

    // 드롭다운 선택 상태
    const [selectedPlantId, setSelectedPlantId] = useState(id);
    const [showTempNotification, setShowTempNotification] = useState(false);

    // 네비게이션/분석 페이지에서 넘어온 값 (있을 수도, 없을 수도 있음)
    const identification = location?.state?.identification || null;
    const growthPrediction = location?.state?.growthPrediction || null;
    const uploadedImageUrl = location?.state?.uploadedImageUrl || null;
    const originalFile = location?.state?.originalFile || location?.state?.file || null;
    const speciesFromNav =
        location?.state?.identification?.plant_name ||
        location?.state?.species ||
        null;

    // 백엔드 훅
    const { run, loading, error, payload } = useGrowthData();

    // 최초 진입 시 자동 호출 (백엔드 우선)
    useEffect(() => {
        const meta = loadPlantMeta();
        const startSpecies = speciesFromNav || meta?.plant_name || meta?.scientific_name || null;
        run({ file: originalFile, species: startSpecies, periods: 12 }).catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 디버깅 로그 (dae 추가사항 반영)
    useEffect(() => {
        if (process?.env?.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.log("[Growth] payload:", payload);
            // eslint-disable-next-line no-console
            console.log("[Growth] growth_graph:", payload?.growth_graph);
        }
    }, [payload]);

    /* ------------------------------------------------------------------ */
    /* 폴백용 임시 데이터 생성                                            */
    /* ------------------------------------------------------------------ */
    const createTempGrowthData = (plantName, plantId) => {
        const baseGrowthRate = 3.5;
        const data = [];
        for (let i = 1; i <= 12; i++) {
            const height = Math.round((15 + (i - 1) * baseGrowthRate) * 10) / 10;
            data.push({
                label: `${i}개월`,
                // 차트/테이블 통일을 위해 'typical/good/bad' 구조로 변환
                typical: height,
                good: Math.round(height * 1.1 * 10) / 10, // 상한
                bad: Math.round(height * 0.9 * 10) / 10, // 하한
            });
        }
        return {
            id: plantId || id,
            name: plantName || "식물",
            scientificName: identification?.scientific_name || "",
            image: uploadedImageUrl || "/images/mimg.jpg",
            baseGrowthRate,
            rows: data,
            min: Math.min(...data.map((d) => d.bad ?? d.typical ?? 0)),
            max: Math.max(...data.map((d) => d.good ?? d.typical ?? 0)),
        };
    };

    /* ------------------------------------------------------------------ */
    /* 데이터 매핑 (우선순위: 백엔드 payload > 네비 전달 growthPrediction > 임시/목업) */
    /* ------------------------------------------------------------------ */
    const allPlants = getAllPlants();

    const {
        isRealData,
        chartRows,
        monthlyRows,
        summary,
        analysisText,
        minValue,
        maxValue,
        displayName,
    } = useMemo(() => {
        // 1) 백엔드 payload 기반 (dae의 라벨/안전성 보강 로직 포함)
        const g = payload?.growth_graph || null;

        if (g && Array.isArray(g.good_growth) && g.good_growth.length > 0) {
            const periodUnit = g?.period_unit === "week" ? "W" : "M";

            const rowsFromGraph =
                g.good_growth
                    .map((p, i) => {
                        if (!p || typeof p.period === "undefined" || typeof p.size === "undefined") {
                            return null;
                        }

                        let label;
                        if (p.period === 0) label = "현재";
                        else label = `${periodUnit}${p.period}`; // Wn 또는 Mn

                        const good = typeof p.size === "number" ? p.size : 0;
                        const bad =
                            g.bad_growth &&
                            Array.isArray(g.bad_growth) &&
                            g.bad_growth[i] &&
                            typeof g.bad_growth[i].size === "number"
                                ? g.bad_growth[i].size
                                : null;

                        // typical은 good/bad 평균 또는 good
                        const typical =
                            typeof good === "number" && typeof bad === "number"
                                ? (good + bad) / 2
                                : good ?? 0;

                        return { label, typical, good, bad };
                    })
                    .filter(Boolean) || [];

            // monthly_data 형식도 표로 변환 (dae 보강키 반영)
            const monthly = (payload?.monthly_data || []).map((row, idx) => {
                const period = row.period || (idx === 0 ? "현재" : `${idx}개월`);
                const expected = row.expected_height || 0;
                const good = row.good_condition_height ?? row.good ?? (expected || null);
                const bad = row.bad_condition_height ?? row.bad ?? (expected || null);
                const typical =
                    expected ||
                    (typeof good === "number" && typeof bad === "number"
                        ? (good + bad) / 2
                        : good || bad || 0);
                return {
                    label: period,
                    typical: typeof typical === "number" ? typical : 0,
                    good: typeof good === "number" ? good : null,
                    bad: typeof bad === "number" ? bad : null,
                };
            });

            const allForMinMax = rowsFromGraph.length ? rowsFromGraph : monthly;
            const computedMin = Math.min(
                ...allForMinMax.map((r) => (typeof r.bad === "number" ? r.bad : r.typical ?? 0))
            );
            const computedMax = Math.max(
                ...allForMinMax.map((r) => (typeof r.good === "number" ? r.good : r.typical ?? 0))
            );

            const baseGrowthRate = 3.5; // 표시용 기본값 유지
            const last =
                (rowsFromGraph.length
                    ? rowsFromGraph[rowsFromGraph.length - 1]
                    : monthly[monthly.length - 1]) || {};

            return {
                isRealData: true,
                chartRows: rowsFromGraph,
                monthlyRows: monthly,
                analysisText: payload?.comprehensive_analysis || "",
                // 서버 제공 min/max가 우선, 없으면 계산값 사용
                minValue: g?.min_size ?? computedMin ?? 0,
                maxValue: g?.max_size ?? computedMax ?? 200,
                summary: {
                    baseGrowthRate,
                    lastHeight: last?.typical ?? 0,
                    rangeText: "±(조건별 범위)",
                },
                displayName:
                    payload?.identification?.plant_name ||
                    identification?.plant_name ||
                    id,
            };
        }

        // 2) 네비에서 전달된 growthPrediction (첫 코드 호환)
        if (growthPrediction && Array.isArray(growthPrediction.stages) && growthPrediction.stages.length > 0) {
            const rows = growthPrediction.stages.map((stage, idx) => {
                const h = stage.expected_height || 15 + idx * 3.5;
                return {
                    label: stage.timeframe || `${idx + 1}개월`,
                    typical: h,
                    good: Math.round(h * 1.1 * 10) / 10,
                    bad: Math.round(h * 0.9 * 10) / 10,
                };
            });

            const minValue = Math.min(...rows.map((r) => r.bad ?? r.typical ?? 0));
            const maxValue = Math.max(...rows.map((r) => r.good ?? r.typical ?? 0));

            return {
                isRealData: true,
                chartRows: rows,
                monthlyRows: rows, // 테이블 재사용
                analysisText: "",
                minValue,
                maxValue,
                summary: {
                    baseGrowthRate: 3.5,
                    lastHeight: rows[rows.length - 1]?.typical ?? 0,
                    rangeText: "±10%",
                },
                displayName: identification?.plant_name || id,
            };
        }

        // 3) 임시/목업 데이터
        const mock = getGrowthById(selectedPlantId);
        const temp = mock
            ? {
                id: mock.id,
                name: mock.name,
                scientificName: identification?.scientific_name || "",
                image: uploadedImageUrl || "/images/mimg.jpg",
                baseGrowthRate: 3.5,
                rows:
                    (mock.data || []).map((d) => ({
                        label: d.month,
                        typical: d.height,
                        good: d.max,
                        bad: d.min,
                    })) || [],
            }
            : createTempGrowthData(identification?.plant_name || "식물", selectedPlantId || id);

        const minValue = Math.min(...(temp.rows.length ? temp.rows.map((r) => r.bad ?? r.typical ?? 0) : [0]));
        const maxValue = Math.max(...(temp.rows.length ? temp.rows.map((r) => r.good ?? r.typical ?? 0) : [200]));

        return {
            isRealData: false,
            chartRows: temp.rows,
            monthlyRows: temp.rows,
            analysisText: "",
            minValue,
            maxValue,
            summary: {
                baseGrowthRate: temp.baseGrowthRate ?? 3.5,
                lastHeight: temp.rows?.[temp.rows.length - 1]?.typical ?? 50,
                rangeText: "±10%",
            },
            displayName: temp.name || "식물",
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [payload, growthPrediction, identification?.plant_name, identification?.scientific_name, uploadedImageUrl, id, selectedPlantId]);

    // 임시 데이터 사용 안내 토스트 (첫 번째 코드 유지)
    useEffect(() => {
        if (!isRealData && !showTempNotification) {
            setShowTempNotification(true);
            toast({
                title: "임시 데이터 표시 중",
                description: "백엔드 개발 중이므로 임시 성장 데이터를 표시합니다.",
                variant: "default",
            });
        }
    }, [isRealData, showTempNotification, toast]);

    // PDF 내보내기
    async function handleExportPDF() {
        if (!reportRef.current) return;
        try {
            toast({ title: "PDF 생성 중...", description: "잠시만 기다려주세요.", variant: "default" });
            await exportToPDF(
                reportRef.current,
                `${selectedPlantId || displayName}-growth-report.pdf`
            );
            toast({ title: "PDF 저장 완료", description: "성장 예측 리포트가 다운로드되었습니다.", variant: "default" });
        } catch (error) {
            toast({ title: "PDF 생성 실패", description: "다시 시도해주세요.", variant: "destructive" });
        }
    }

    return (
        <main className="w-full py-12 px-4">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* 상단 헤더 + 드롭다운/뒤로 버튼 */}
                <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-emerald-800 mb-2 flex items-center gap-2">
                            <TrendingUp className="w-8 h-8 text-emerald-500" aria-hidden="true" />
                            성장 예측
                        </h1>
                        <p className="text-lg text-emerald-700">
                            {(displayName || "식물")}의 12개월 성장 예측 데이터입니다.
                        </p>
                        {loading && (
                            <div className="text-emerald-700 mt-1 text-sm">계산 중…</div>
                        )}
                        {error && (
                            <div className="text-red-600 text-sm mt-1">에러: {error?.status} {error?.message}</div>
                        )}
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
                <div ref={reportRef} className="space-y-6 bg-white p-8 rounded-2xl shadow-lg">
                    {/* 요약 카드 */}
                    <section aria-label="성장 요약">
                        <Card className="rounded-xl border-emerald-200">
                            <CardHeader>
                                <CardTitle className="text-emerald-800">성장 요약</CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-sm text-emerald-600 mb-1">기본 성장률</p>
                                    <p className="text-2xl font-bold text-emerald-800">
                                        {summary?.baseGrowthRate ?? 3.5} cm/월
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-emerald-600 mb-1">12개월 후 예상 높이</p>
                                    <p className="text-2xl font-bold text-emerald-800">
                                        {(summary?.lastHeight ?? 50)?.toFixed?.(1) ?? summary?.lastHeight ?? 50} cm
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-emerald-600 mb-1">예상 범위</p>
                                    <p className="text-2xl font-bold text-emerald-800">{summary?.rangeText || "±10%"}</p>
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
                                {chartRows && chartRows.length > 0 ? (
                                    <GrowthChart rows={chartRows} min={minValue ?? 0} max={maxValue ?? 200} unitLabel="cm" />
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
                                {monthlyRows && monthlyRows.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm" role="table">
                                            <thead>
                                            <tr className="border-b-2 border-emerald-200">
                                                <th className="text-left py-3 px-4 text-emerald-800 font-bold">기간</th>
                                                <th className="text-right py-3 px-4 text-emerald-800 font-bold">일반</th>
                                                <th className="text-right py-3 px-4 text-emerald-800 font-bold">좋음</th>
                                                <th className="text-right py-3 px-4 text-emerald-800 font-bold">나쁨</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {monthlyRows.map((r, idx) => (
                                                <tr key={idx} className="border-b border-emerald-100 hover:bg-emerald-50">
                                                    <td className="py-3 px-4 text-emerald-700">{r.label}</td>
                                                    <td className="py-3 px-4 text-right font-bold text-emerald-800">{(r.typical?.toFixed?.(1) ?? r.typical) ?? "-"} cm</td>
                                                    <td className="py-3 px-4 text-right text-emerald-600">{(r.good?.toFixed?.(1) ?? r.good) ?? "-"} cm</td>
                                                    <td className="py-3 px-4 text-right text-emerald-600">{(r.bad?.toFixed?.(1) ?? r.bad) ?? "-"} cm</td>
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

                    {/* AI 종합 설명 (백엔드가 제공하는 경우) */}
                    {analysisText ? (
                        <section aria-label="AI 종합 설명">
                            <Card className="rounded-xl border-blue-200">
                                <CardHeader>
                                    <CardTitle className="text-blue-800">AI 종합 설명 및 조언</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <aside className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg whitespace-pre-line text-blue-800 leading-relaxed">
                                        {analysisText}
                                    </aside>
                                </CardContent>
                            </Card>
                        </section>
                    ) : null}
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
