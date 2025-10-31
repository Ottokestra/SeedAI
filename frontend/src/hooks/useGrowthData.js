// src/hooks/useGrowthData.js
import { useCallback, useState } from "react";
import { getGrowthInsight, getMonthlyDataAnalysis, detailAxiosError } from "../api/client";
import { loadPlantMeta } from "../utils/storage";

/** growth-insight 호출 흐름(가드 포함) */
export default function useGrowthData() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [payload, setPayload] = useState(null);

  const run = useCallback(async ({ file, species, periods = 12 }) => {
    setLoading(true); setError(null);
    try {
      // 1) 파일 있으면 multipart 업로드 (절대 blob: 문자열 넣지 말 것!)
      if (file && typeof file !== "string" && typeof File !== "undefined" && file instanceof File) {
        const data = await getGrowthInsight({ 
          file, 
          species_hint: species,
          period_unit: "month",
          max_periods: periods
        });
        setPayload(data);
        return data;
      }

      // 2) 파일이 없으면 세션(or 인자)에서 종명을 가져와 월별 분석 호출
      const meta = loadPlantMeta();
      const name = species || meta?.plant_name || meta?.scientific_name;
      if (!name) throw new Error("식물 종 정보를 찾을 수 없습니다. 분석 페이지에서 먼저 저장해주세요.");

      const data = await getMonthlyDataAnalysis(name, periods);
      setPayload(data);
      return data;
    } catch (err) {
      setError(detailAxiosError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { run, loading, error, payload };
}
