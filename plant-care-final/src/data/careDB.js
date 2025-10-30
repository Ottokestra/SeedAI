/**
 * 식물별 관리법 데이터베이스
 * 구조: { water, light, temp, humidity, soil, tips[] }
 */

export const careDatabase = {
  'ficus-elastica': {
    id: 'ficus-elastica',
    name: '고무나무',
    scientificName: 'Ficus elastica',
    image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=400&q=80',
    water: '표토가 마르면 충분히 관수 (주 1~2회)',
    light: '밝은 간접광 (직사광선 피함)',
    temp: '18~27°C (최저 10°C 이상 유지)',
    humidity: '40~60% (건조해도 잘 견딤)',
    soil: '배수가 잘되는 흙, pH 6.0~6.5',
    tips: [
      '과습에 약하니 물 빠짐 확인',
      '잎에 먼지가 쌓이면 젖은 천으로 닦기',
      '겨울철 물 주기 횟수 줄이기',
      '잎이 처지면 물 부족 신호',
    ],
  },
  'monstera-deliciosa': {
    id: 'monstera-deliciosa',
    name: '몬스테라',
    scientificName: 'Monstera deliciosa',
    image: 'https://images.unsplash.com/photo-1614594895304-fe7116ac3b58?auto=format&fit=crop&w=400&q=80',
    water: '표토 2~3cm 마르면 충분히 관수 (주 1회)',
    light: '밝은 간접광~반음지 (직사광선 피함)',
    temp: '20~30°C (최저 15°C 이상)',
    humidity: '60~80% (높은 습도 선호)',
    soil: '배수 좋은 부엽토+펄라이트 혼합',
    tips: [
      '공중뿌리는 자르지 말고 지주대에 고정',
      '잎이 갈라지지 않으면 광량 부족',
      '분무기로 잎 주변 습도 유지',
      '덩굴성이므로 지지대 설치 권장',
    ],
  },
  'spathiphyllum': {
    id: 'spathiphyllum',
    name: '스파티필름',
    scientificName: 'Spathiphyllum spp.',
    image: 'https://images.unsplash.com/photo-1593482892290-f54927ae1bb6?auto=format&fit=crop&w=400&q=80',
    water: '표토가 마르기 전 충분히 관수 (주 2~3회)',
    light: '낮은 광량에서도 생존 가능 (밝은 간접광 최적)',
    temp: '18~25°C',
    humidity: '50~70% (습도 높을수록 좋음)',
    soil: '배수 잘되는 흙 + 유기물',
    tips: [
      '잎 끝이 갈변하면 염소 제거한 물 사용',
      '흰색 꽃이 녹색으로 변하면 노화 신호',
      '공기정화 능력 우수',
      '물을 좋아하지만 과습 주의',
    ],
  },
  pothos: {
    id: 'pothos',
    name: '스킨답서스(포토스)',
    scientificName: 'Epipremnum aureum',
    image: 'https://images.unsplash.com/photo-1572688484228-7e93f7f6f3d0?auto=format&fit=crop&w=400&q=80',
    water: '표토가 마르면 충분히 관수 (주 1회)',
    light: '간접광~반음지 (낮은 광량에서도 생존)',
    temp: '18~29°C',
    humidity: '40~60%',
    soil: '배수 좋은 범용 배양토',
    tips: [
      '초보자에게 추천하는 식물',
      '물꽂이로 번식 가능',
      '덩굴이 길어지면 가지치기',
      '황변은 과습, 갈변은 건조 신호',
    ],
  },
};

/**
 * ID로 관리법 조회
 * @param {string} id - 식물 ID
 * @returns {object|null} 관리법 객체 또는 null
 */
export function getCareById(id) {
  return careDatabase[id] || null;
}

/**
 * 모든 식물 ID 목록
 * @returns {string[]}
 */
export function getAllPlantIds() {
  return Object.keys(careDatabase);
}

