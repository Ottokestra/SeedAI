/**
 * 식물별 성장 예측 데이터
 * 구조: { month: string, height: number, min: number, max: number }
 * min/max는 예상 범위 (±10%)
 */

export const growthDatabase = {
  'ficus-elastica': {
    id: 'ficus-elastica',
    name: '고무나무',
    baseGrowthRate: 3.5, // cm/month
    data: [
      { month: '1개월', height: 15, min: 13.5, max: 16.5 },
      { month: '2개월', height: 18.5, min: 16.7, max: 20.4 },
      { month: '3개월', height: 22, min: 19.8, max: 24.2 },
      { month: '4개월', height: 25.5, min: 23.0, max: 28.1 },
      { month: '5개월', height: 29, min: 26.1, max: 31.9 },
      { month: '6개월', height: 32.5, min: 29.3, max: 35.8 },
      { month: '7개월', height: 36, min: 32.4, max: 39.6 },
      { month: '8개월', height: 39.5, min: 35.6, max: 43.5 },
      { month: '9개월', height: 43, min: 38.7, max: 47.3 },
      { month: '10개월', height: 46.5, min: 41.9, max: 51.2 },
      { month: '11개월', height: 50, min: 45.0, max: 55.0 },
      { month: '12개월', height: 53.5, min: 48.2, max: 58.9 },
    ],
  },
  'monstera-deliciosa': {
    id: 'monstera-deliciosa',
    name: '몬스테라',
    baseGrowthRate: 5.0, // cm/month
    data: [
      { month: '1개월', height: 20, min: 18.0, max: 22.0 },
      { month: '2개월', height: 25, min: 22.5, max: 27.5 },
      { month: '3개월', height: 30, min: 27.0, max: 33.0 },
      { month: '4개월', height: 35, min: 31.5, max: 38.5 },
      { month: '5개월', height: 40, min: 36.0, max: 44.0 },
      { month: '6개월', height: 45, min: 40.5, max: 49.5 },
      { month: '7개월', height: 50, min: 45.0, max: 55.0 },
      { month: '8개월', height: 55, min: 49.5, max: 60.5 },
      { month: '9개월', height: 60, min: 54.0, max: 66.0 },
      { month: '10개월', height: 65, min: 58.5, max: 71.5 },
      { month: '11개월', height: 70, min: 63.0, max: 77.0 },
      { month: '12개월', height: 75, min: 67.5, max: 82.5 },
    ],
  },
  'spathiphyllum': {
    id: 'spathiphyllum',
    name: '스파티필름',
    baseGrowthRate: 2.0, // cm/month
    data: [
      { month: '1개월', height: 10, min: 9.0, max: 11.0 },
      { month: '2개월', height: 12, min: 10.8, max: 13.2 },
      { month: '3개월', height: 14, min: 12.6, max: 15.4 },
      { month: '4개월', height: 16, min: 14.4, max: 17.6 },
      { month: '5개월', height: 18, min: 16.2, max: 19.8 },
      { month: '6개월', height: 20, min: 18.0, max: 22.0 },
      { month: '7개월', height: 22, min: 19.8, max: 24.2 },
      { month: '8개월', height: 24, min: 21.6, max: 26.4 },
      { month: '9개월', height: 26, min: 23.4, max: 28.6 },
      { month: '10개월', height: 28, min: 25.2, max: 30.8 },
      { month: '11개월', height: 30, min: 27.0, max: 33.0 },
      { month: '12개월', height: 32, min: 28.8, max: 35.2 },
    ],
  },
  pothos: {
    id: 'pothos',
    name: '스킨답서스(포토스)',
    baseGrowthRate: 4.0, // cm/month
    data: [
      { month: '1개월', height: 18, min: 16.2, max: 19.8 },
      { month: '2개월', height: 22, min: 19.8, max: 24.2 },
      { month: '3개월', height: 26, min: 23.4, max: 28.6 },
      { month: '4개월', height: 30, min: 27.0, max: 33.0 },
      { month: '5개월', height: 34, min: 30.6, max: 37.4 },
      { month: '6개월', height: 38, min: 34.2, max: 41.8 },
      { month: '7개월', height: 42, min: 37.8, max: 46.2 },
      { month: '8개월', height: 46, min: 41.4, max: 50.6 },
      { month: '9개월', height: 50, min: 45.0, max: 55.0 },
      { month: '10개월', height: 54, min: 48.6, max: 59.4 },
      { month: '11개월', height: 58, min: 52.2, max: 63.8 },
      { month: '12개월', height: 62, min: 55.8, max: 68.2 },
    ],
  },
};

/**
 * ID로 성장 데이터 조회
 * @param {string} id - 식물 ID
 * @returns {object|null} 성장 데이터 또는 null
 */
export function getGrowthById(id) {
  return growthDatabase[id] || null;
}

/**
 * 모든 식물 목록 (드롭다운용)
 * @returns {Array<{id: string, name: string}>}
 */
export function getAllPlants() {
  return Object.values(growthDatabase).map((plant) => ({
    id: plant.id,
    name: plant.name,
  }));
}

