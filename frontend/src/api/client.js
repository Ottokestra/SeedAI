import axios from 'axios';

// 백엔드 API URL 설정
// 환경 변수가 있으면 사용, 없으면 localhost:8000 사용
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30초
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 (디버깅용)
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API 요청] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API 요청 오류]', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 (에러 처리)
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API 응답] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      console.error('[백엔드 연결 실패] 백엔드 서버가 실행 중인지 확인하세요:', API_BASE_URL);
    } else if (error.response) {
      console.error(`[API 오류] ${error.response.status}:`, error.response.data);
    } else {
      console.error('[알 수 없는 오류]', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * 식물 종 식별 API 호출 (자동 모델 선택, 한국어 번역)
 * @param {File} imageFile - 업로드할 이미지 파일 (단일 파일)
 * @returns {Promise} PlantAnalysisResponse 객체
 * {
 *   identification: { plant_name, scientific_name, confidence, common_names },
 *   care_guide: { watering, sunlight, temperature, humidity, fertilizer, soil, tips },
 *   growth_prediction: { stages: [{ stage, timeframe, image_url, description }] },
 *   success: boolean,
 *   message: string
 * }
 */
export async function identifyPlant(imageFile) {
  try {
    const formData = new FormData();
    formData.append('file', imageFile); // 백엔드가 기대하는 키 이름

    const response = await apiClient.post('/api/plant/analyze-auto', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('식물 분석 오류:', error);
    throw error;
  }
}

/**
 * 헬스체크 API 호출
 * @returns {Promise} 헬스체크 결과
 */
export async function healthCheck() {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    console.error('헬스체크 오류:', error);
    throw error;
  }
}

export default apiClient;

