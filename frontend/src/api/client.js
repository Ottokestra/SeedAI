// src/api/client.js
import axios from "axios";

const base =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) ||
  (typeof process !== "undefined" && process.env?.VITE_API_BASE) ||
  "http://localhost:8000"; // 기본값: 백엔드 서버 주소

// 디버깅: baseURL 확인
if (typeof window !== "undefined") {
  console.log("[API Client] baseURL:", base || "설정되지 않음");
}

export const api = axios.create({
  baseURL: base || "http://localhost:8000",  // 빈 문자열 방지
  timeout: 60_000,  // 60초로 증가 (타임아웃 오류 방지)
  headers: { Accept: "application/json" },
  withCredentials: false,
});

export function detailAxiosError(err) {
  const info = {
    message: err?.message,
    status: err?.response?.status,
    data: err?.response?.data,
    url: err?.config?.url,
    method: err?.config?.method,
  };
  console.error("AxiosError detail:", info);
  return info;
}

/* ------------------------------------------------------------------ */
/*  High-level API wrappers (Identify / Growth / Monthly)             */
/*  기존 코드 호환: Identify.jsx 에서 identifyPlant 를 그대로 사용 가능   */
/* ------------------------------------------------------------------ */

// 1) 이미지로 종 식별 (기존 Identify.jsx 호환용)
//    - 우선 /api/plant/analyze-auto 시도 (백엔드 실제 경로)
export async function identifyPlant(file) {
  if (!(file instanceof File)) {
    throw new Error("identifyPlant: File 객체를 전달하세요.");
  }
  
  try {
    const fd = new FormData();
    fd.append("file", file, file.name || "image.jpg");
    
    const url = "/api/plant/analyze-auto";
    console.log("[identifyPlant] 요청 URL:", api.defaults.baseURL + url);
    
    const { data } = await api.post(url, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    
    // 기대형식: { identification: { plant_name, scientific_name, ... }, success: true, ... }
    if (data?.identification?.plant_name) {
      return {
        success: data.success !== false,
        identification: data.identification,
        care_guide: data.care_guide,
        growth_prediction: data.growth_prediction,
        message: data.message || "식물 식별이 완료되었습니다."
      };
    }
    
    // fallback: 다른 형식의 응답 처리
    const plantName =
      data?.plant_name ||
      data?.identification?.plant_name ||
      "Unknown";
    return {
      success: true,
      identification: {
        plant_name: plantName,
        scientific_name: data?.identification?.scientific_name || null,
        confidence: data?.identification?.confidence ?? 0.5,
        common_names: data?.identification?.common_names || [],
      },
      care_guide: data.care_guide,
      growth_prediction: data.growth_prediction,
      message: "식물 식별이 완료되었습니다."
    };
  } catch (e) {
    console.error("identifyPlant 오류:", detailAxiosError(e));
    // /analyze-auto 실패 시 /growth-insight 로 fallback
    try {
      const fd = new FormData();
      fd.append("file", file, file.name || "image.jpg");
      const url = "/api/plant/growth-insight";
      console.log("[identifyPlant fallback] 요청 URL:", api.defaults.baseURL + url);
      
      const { data } = await api.post(url, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      const plantName =
        data?.identification?.plant_name ||
        data?.growth_graph?.plant_name ||
        "Unknown";
      return {
        success: true,
        identification: {
          plant_name: plantName,
          scientific_name: data?.identification?.scientific_name || null,
          confidence: data?.identification?.confidence ?? 0.5,
          common_names: data?.identification?.common_names || [],
        },
        message: "식물 식별이 완료되었습니다."
      };
    } catch (e2) {
      console.error("growth-insight fallback 오류:", e2);
      throw new Error(`식물 식별에 실패했습니다: ${e2.message || "서버 오류"}`);
    }
  }
}

// 2) 성장 인사이트(파일 있으면 멀티파트)
export async function getGrowthInsight({ file, species_hint, period_unit = "month", max_periods = 12 } = {}) {
  const fd = new FormData();
  if (file) {
    if (!(file instanceof File)) {
      throw new Error("getGrowthInsight: File 객체를 전달하세요.");
    }
    fd.append("file", file, file.name || "image.jpg");
  }
  if (species_hint) fd.append("species_hint", species_hint);
  
  // 쿼리 파라미터로 period_unit과 max_periods 전달
  const url = `/api/plant/growth-insight?period_unit=${period_unit}&max_periods=${max_periods}`;
  console.log("[getGrowthInsight] 요청 URL:", api.defaults.baseURL + url);
  
  const { data } = await api.post(url, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data; // { growth_graph, monthly_data, comprehensive_analysis }
}

// 3) 세션에 저장된 종명으로 월별 분석
export async function getMonthlyDataAnalysis(name, periods = 12) {
  if (!name) throw new Error("getMonthlyDataAnalysis: name(종명)이 필요합니다.");
  const url = "/api/plant/monthly-data-analysis";
  console.log("[getMonthlyDataAnalysis] 요청 URL:", api.defaults.baseURL + url, "params:", { plant_name: name, max_months: periods });
  
  const { data } = await api.get(url, {
    params: { plant_name: name, max_months: periods },
  });
  return data; // { growth_graph, monthly_data, comprehensive_analysis }
}
