import { http, HttpResponse, delay } from 'msw';

export const handlers = [
  http.post('/api/identify', async ({ request }) => {
    await delay(1500); // 로딩 시뮬레이션

    const formData = await request.formData();
    const images = formData.getAll('image');

    // 파일 미선택 에러
    if (!images || images.length === 0) {
      return HttpResponse.json(
        { detail: '이미지를 선택해주세요.' },
        { status: 400 }
      );
    }

    // Mock 응답
    return HttpResponse.json({
      topK: [
        { id: 'ficus-elastica', name: '고무나무', conf: 0.92 },
        { id: 'monstera-deliciosa', name: '몬스테라', conf: 0.78 },
        { id: 'pothos', name: '스킨답서스(포토스)', conf: 0.65 },
      ],
      diagnosis: ['과습 의심', '광량 부족', '통풍 개선 권장'],
    });
  }),
];

