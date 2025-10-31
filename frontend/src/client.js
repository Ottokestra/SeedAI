// Safe axios instance with env-based base URL
import axios from "axios";

const base =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== "undefined" && process.env && process.env.VITE_API_BASE) ||
  "http://localhost:8000";

// Example: set in .env => VITE_API_BASE=http://localhost:8000
export const api = axios.create({
  baseURL: base,
  timeout: 60000, // 60초로 증가 (월별 데이터 분석 대기 시간)
  headers: { Accept: "application/json" },
  withCredentials: false
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

