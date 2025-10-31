import axios from 'axios';

// 백엔드 API URL (localhost:8000)
const API_BASE_URL = `http://${window.location.hostname}:8000`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

