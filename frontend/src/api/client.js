// src/api/client.js
import axios from "axios";

/**
 * Base URL 우선순위:
 * 1) import.meta.env.VITE_API_BASE 또는 process.env.VITE_API_BASE
 * 2) http://{window.location.hostname}:8000 (프론트/백엔드 동일 호스트일 때 유용)
 * 3) http://localhost:8000
 */
const envBase =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) ||
    (typeof process !== "undefined" && process.env?.VITE_API_BASE);

const hostBase =
    typeof window !== "undefined" && window.location?.hostname
        ? `http://${window.location.hostname}:8000`
        : undefined;

const base = envBase || hostBase || "http://localhost:8000";

// 디버깅: baseURL 확인
if (typeof window !== "undefined") {
    console.log("[API Client] baseURL:", base || "설정되지 않음");
}

/** 공용 Axios 인스턴스 */
export const api = axios.create({
    baseURL: base,
    timeout: 60_000, // 타임아웃 60초
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    withCredentials: false,
});

// 과거 호환: apiClient 별칭 및 default export
export const apiClient = api;
export default api;

/** Axios 에러 상세 로깅 유틸 */
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
/*  High-level API wrappers (Identify / Growth / Monthly / Health)    */
/* ------------------------------------------------------------------ */

/**
 * 식물 종 식별 API (자동 모델 선택, 한국어 번역)
 * 1차: /api/plant/analyze-auto
 * 실패 시 2차: /api/plant/growth-insight (fallback)
 *
 * @param {File} file - 업로드할 이미지 파일
 * @returns {Promise<{
 *   identification?: { plant_name?: string, scientific_name?: string|null, confidence?: number, common_names?: string[] },
 *   care_guide?: any,
 *   growth_prediction?: any,
 *   success: boolean,
 *   message?: string
 * }>}
 */
export async function identifyPlant(file) {
    if (!(file instanceof File)) {
        throw new Error("identifyPlant: File 객체를 전달하세요.");
    }

    const buildOK = (data) => {
        // 기대형식 정규화
        const id = data?.identification || {};
        const plantName =
            id?.plant_name || data?.plant_name || data?.growth_graph?.plant_name || "Unknown";
        return {
            success: data?.success !== false,
            identification: {
                plant_name: plantName,
                scientific_name: id?.scientific_name ?? null,
                confidence: id?.confidence ?? 0.5,
                common_names: id?.common_names || [],
            },
            care_guide: data?.care_guide,
            growth_prediction: data?.growth_prediction,
            message: data?.message || "식물 식별이 완료되었습니다.",
        };
    };

    try {
        const fd = new FormData();
        fd.append("file", file, file.name || "image.jpg");

        const url = "/api/plant/analyze-auto";
        console.log("[identifyPlant] 요청 URL:", api.defaults.baseURL + url);

        const { data } = await api.post(url, fd, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        return buildOK(data);
    } catch (e) {
        console.error("identifyPlant 오류:", detailAxiosError(e));
        // fallback: /growth-insight
        try {
            const fd = new FormData();
            fd.append("file", file, file.name || "image.jpg");

            const url = "/api/plant/growth-insight";
            console.log("[identifyPlant fallback] 요청 URL:", api.defaults.baseURL + url);

            const { data } = await api.post(url, fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            return buildOK(data);
        } catch (e2) {
            console.error("growth-insight fallback 오류:", detailAxiosError(e2));
            throw new Error(`식물 식별에 실패했습니다: ${e2?.message || "서버 오류"}`);
        }
    }
}

/**
 * 성장 인사이트 (파일 있으면 multipart)
 * @param {{ file?: File, species_hint?: string, period_unit?: "month"|"week"|"day", max_periods?: number }} params
 * @returns {Promise<any>} { growth_graph, monthly_data, comprehensive_analysis }
 */
export async function getGrowthInsight({
                                           file,
                                           species_hint,
                                           period_unit = "month",
                                           max_periods = 12,
                                       } = {}) {
    const fd = new FormData();
    if (file) {
        if (!(file instanceof File)) {
            throw new Error("getGrowthInsight: File 객체를 전달하세요.");
        }
        fd.append("file", file, file.name || "image.jpg");
    }
    if (species_hint) fd.append("species_hint", species_hint);

    const url = `/api/plant/growth-insight?period_unit=${period_unit}&max_periods=${max_periods}`;
    console.log("[getGrowthInsight] 요청 URL:", api.defaults.baseURL + url);

    const { data } = await api.post(url, fd, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
}

/**
 * 세션/종명 기반 월별 분석
 * @param {string} name - 종명(plant_name)
 * @param {number} periods - 개월수
 * @returns {Promise<any>} { growth_graph, monthly_data, comprehensive_analysis }
 */
export async function getMonthlyDataAnalysis(name, periods = 12) {
    if (!name) throw new Error("getMonthlyDataAnalysis: name(종명)이 필요합니다.");
    const url = "/api/plant/monthly-data-analysis";
    console.log(
        "[getMonthlyDataAnalysis] 요청 URL:",
        api.defaults.baseURL + url,
        "params:",
        { plant_name: name, max_months: periods }
    );

    const { data } = await api.get(url, {
        params: { plant_name: name, max_months: periods },
    });
    return data;
}

/**
 * 헬스체크 API
 * @returns {Promise<any>}
 */
export async function healthCheck() {
    try {
        const { data } = await api.get("/health");
        return data;
    } catch (error) {
        console.error("헬스체크 오류:", detailAxiosError(error));
        throw error;
    }
}
