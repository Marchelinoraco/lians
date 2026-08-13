import type { TourPackage } from './types';

export const bunakenMinahasa2h1m: TourPackage = {
  slug: '2h1m-bunaken-minahasa',
  category: 'multi-day',
  days: 2,
  nights: 1,
  sortOrder: 70,
  images: [],

  name: {
    id: '2 Hari 1 Malam — Bunaken dan Minahasa Highland',
    en: '2 Days 1 Night — Bunaken and Minahasa Highland',
    zh: '两天一夜 — 布纳肯与米纳哈萨高原',
    ko: '1박 2일 — 부나켄과 미나하사 하이랜드',
  },

  tagline: {
    id: 'Sehari di laut, sehari di pegunungan.',
    en: 'A day at sea, a day in the mountains.',
    zh: '一天出海，一天上山。',
    ko: '하루는 바다에서, 하루는 산에서.',
  },

  duration: {
    id: '2 hari 1 malam · menginap di hotel Manado',
    en: '2 days, 1 night · hotel stay in Manado',
    zh: '两天一夜 · 入住万鸦老酒店',
    ko: '1박 2일 · 마나도 호텔 숙박',
  },

  destinations: {
    id: ['Bunaken', 'Kota Manado', 'Pasar Tomohon', 'Puncak Tetetana', 'Benteng Moraya', 'Danau Tondano', 'Danau Linow'],
    en: ['Bunaken', 'Manado city', 'Tomohon Market', 'Tetetana Peak', 'Moraya Fort', 'Lake Tondano', 'Lake Linow'],
    zh: ['布纳肯', '万鸦老市区', '多蒙贡市场', '特特塔纳峰', '莫拉亚堡', '同达诺湖', '利诺湖'],
    ko: ['부나켄', '마나도 시내', '토모혼 시장', '테테타나 봉우리', '모라야 요새', '톤다노 호수', '리노우 호수'],
  },

  intro: {
    id: [
      'Dua hari dengan dua wajah yang berbeda. Hari pertama di laut — menyeberang ke Bunaken, snorkeling atau diving di taman lautnya, lalu berkeliling kota Manado sampai makan malam. Hari kedua naik ke dataran tinggi Minahasa, tempat udaranya dingin dan pemandangannya berganti dari laut menjadi danau dan kawah.',
      'Ini bentuk paling ringkas untuk melihat dua sisi Sulawesi Utara tanpa harus tinggal lama. Anda menginap satu malam di hotel Manado, sekamar berdua atau bertiga, dan barang tidak perlu dipindah-pindah karena kota ini jadi titik pusat kedua hari.',
    ],
    en: [
      'Two days with two very different faces. The first is at sea — crossing to Bunaken, snorkelling or diving in the marine park, then a loop through Manado city until dinner. The second climbs into the Minahasa highlands, where the air turns cold and the view shifts from ocean to lakes and a crater.',
      'This is the most compact way to see both sides of North Sulawesi without a long stay. You spend one night at a hotel in Manado, two or three to a room, and nothing needs repacking because the city anchors both days.',
    ],
    zh: [
      '两天，两副面孔。第一天在海上——渡海前往布纳肯，在海洋公园浮潜或潜水，随后环游万鸦老市区直至晚餐。第二天登上米纳哈萨高原，空气转凉，景致由海洋换成湖泊与火山口。',
      '这是不必久留即可看遍北苏拉威西两面的最紧凑方式。您在万鸦老酒店住一晚，两至三人一房，行李无需搬动，因为两天都以此城为中心。',
    ],
    ko: [
      '전혀 다른 두 얼굴의 이틀입니다. 첫날은 바다에서 — 부나켄으로 건너가 해양공원에서 스노클링이나 다이빙을 하고, 저녁 식사까지 마나도 시내를 둘러봅니다. 둘째 날은 미나하사 고원으로 올라갑니다. 공기가 차가워지고 풍경은 바다에서 호수와 분화구로 바뀝니다.',
      '오래 머물지 않고 북술라웨시의 두 면을 보는 가장 압축된 방법입니다. 마나도 호텔에서 1박하며 2~3인 1실을 씁니다. 이틀 모두 이 도시가 중심이라 짐을 다시 쌀 일이 없습니다.',
    ],
  },

  highlights: {
    id: [
      'Laut dan pegunungan dalam dua hari berurutan',
      'Satu hotel saja — tidak perlu berpindah menginap',
      'Snorkeling di taman laut Bunaken dengan pemandu',
      'Danau Linow dan Danau Tondano di hari kedua',
    ],
    en: [
      'Sea and mountains on consecutive days',
      'A single hotel — no moving between stays',
      'Guided snorkelling in the Bunaken marine park',
      'Lake Linow and Lake Tondano on the second day',
    ],
    zh: [
      '连续两天，海山兼得',
      '仅住一间酒店，无需换宿',
      '在布纳肯海洋公园由向导带领浮潜',
      '第二天造访利诺湖与同达诺湖',
    ],
    ko: [
      '이틀 연속으로 바다와 산',
      '호텔 한 곳만 — 숙소 이동 없음',
      '가이드와 함께하는 부나켄 해양공원 스노클링',
      '둘째 날의 리노우 호수와 톤다노 호수',
    ],
  },

  itinerary: [
    {
      label: { id: 'Hari 1 — Bunaken dan kota Manado', en: 'Day 1 — Bunaken and Manado city', zh: '第一天 — 布纳肯与万鸦老市区', ko: '1일차 — 부나켄과 마나도 시내' },
      steps: [
        { title: { id: 'Penjemputan di bandara', en: 'Airport pickup', zh: '机场接机', ko: '공항 픽업' } },
        { title: { id: 'Menuju Dermaga Megamas dan menyeberang ke Bunaken', en: 'To Megamas pier and the crossing to Bunaken', zh: '前往美嘉码头并渡海至布纳肯', ko: '메가마스 선착장으로 이동 후 부나켄으로 도항' } },
        { title: { id: 'Foto di Pantai Liang, lalu snorkeling atau diving', en: 'Photos at Liang Beach, then snorkelling or diving', zh: '良海滩拍照，随后浮潜或潜水', ko: '리앙 해변 사진 촬영 후 스노클링 또는 다이빙' } },
        { title: { id: 'Makan siang', en: 'Lunch', zh: '午餐', ko: '점심' } },
        { title: { id: 'Berkeliling kota Manado', en: 'A loop through Manado city', zh: '环游万鸦老市区', ko: '마나도 시내 투어' } },
        { title: { id: 'Makan malam, lalu check-in hotel', en: 'Dinner, then hotel check-in', zh: '晚餐后入住酒店', ko: '저녁 식사 후 호텔 체크인' } },
      ],
    },
    {
      label: { id: 'Hari 2 — Minahasa Highland', en: 'Day 2 — Minahasa Highland', zh: '第二天 — 米纳哈萨高原', ko: '2일차 — 미나하사 하이랜드' },
      steps: [
        { title: { id: 'Sarapan di hotel dan check-out', en: 'Hotel breakfast and check-out', zh: '酒店早餐并退房', ko: '호텔 조식 및 체크아웃' } },
        { title: { id: 'Pasar Ekstrem Tomohon', en: 'Tomohon Extreme Market', zh: '多蒙贡极限市场', ko: '토모혼 익스트림 마켓' } },
        { title: { id: 'Puncak Tetetana', en: 'Tetetana Peak', zh: '特特塔纳峰', ko: '테테타나 봉우리' } },
        { title: { id: 'Benteng Moraya', en: 'Moraya Fort', zh: '莫拉亚堡', ko: '모라야 요새' } },
        { title: { id: 'Makan siang di tepi Danau Tondano', en: 'Lunch beside Lake Tondano', zh: '同达诺湖畔午餐', ko: '톤다노 호숫가에서 점심' } },
        { title: { id: 'Danau Linow, rehat kopi dan camilan', en: 'Lake Linow, coffee break and snacks', zh: '利诺湖，咖啡与点心', ko: '리노우 호수, 커피 브레이크와 간식' } },
        { title: { id: 'Belanja oleh-oleh, lalu diantar ke bandara atau hotel', en: 'Souvenir shopping, then drop-off at the airport or your hotel', zh: '选购伴手礼，随后送往机场或酒店', ko: '기념품 쇼핑 후 공항 또는 호텔로 이동' } },
      ],
    },
  ],

  includes: {
    id: [
      'Kendaraan ber-AC',
      'Sopir merangkap pemandu',
      'BBM dan parkir di semua lokasi',
      'Hotel 1 malam, sekamar berdua atau bertiga',
      'Tiket masuk objek wisata',
      'Air mineral sepanjang perjalanan',
      '3× makan di rumah makan dan 1× sarapan hotel',
      'Kapal ke Bunaken pulang-pergi',
      'Pemandu snorkeling',
      'Pelampung',
      'Asuransi Jasa Raharja',
      'Dokumentasi atas dan bawah air dengan GoPro',
      'Camilan dan kopi di Danau Linow',
    ],
    en: [
      'Air-conditioned vehicle',
      'Driver who also guides',
      'Fuel and parking at every stop',
      'One night hotel, two or three to a room',
      'Entrance fees to the sites',
      'Drinking water throughout',
      'Three restaurant meals and one hotel breakfast',
      'Return boat to Bunaken',
      'Snorkelling guide',
      'Life jackets',
      'Jasa Raharja travel insurance',
      'Above- and underwater documentation with GoPro',
      'Snacks and coffee at Lake Linow',
    ],
    zh: [
      '空调车辆',
      '司机兼导游',
      '各站燃油与停车费',
      '酒店一晚，两至三人一房',
      '景点门票',
      '全程饮用水',
      '餐馆用餐三次与酒店早餐一次',
      '往返布纳肯船只',
      '浮潜向导',
      '救生衣',
      'Jasa Raharja 保险',
      'GoPro 水上水下摄影',
      '利诺湖点心与咖啡',
    ],
    ko: [
      '에어컨 차량',
      '가이드를 겸한 기사',
      '전 구간 연료와 주차비',
      '호텔 1박, 2~3인 1실',
      '관광지 입장료',
      '전 일정 생수',
      '식당 식사 3회와 호텔 조식 1회',
      '부나켄 왕복 선박',
      '스노클링 가이드',
      '구명조끼',
      'Jasa Raharja 여행자 보험',
      'GoPro 수상·수중 촬영',
      '리노우 호수에서의 간식과 커피',
    ],
  },

  excludes: {
    id: [
      'Tiket pesawat',
      'Alat snorkeling dan diving pribadi',
      'Alat snorkeling milik pemandu',
      'Menu tambahan dan jus',
      'Tip untuk sopir dan pemandu (sukarela)',
    ],
    en: [
      'Flight tickets',
      'Personal snorkelling and diving equipment',
      'The guide’s own snorkelling equipment',
      'Extra menu items and juices',
      'Tips for the driver and guide (at your discretion)',
    ],
    zh: ['机票', '个人浮潜与潜水装备', '向导自用浮潜装备', '加点与果汁', '司机与导游小费（自愿）'],
    ko: ['항공권', '개인 스노클링·다이빙 장비', '가이드 본인 스노클링 장비', '추가 메뉴와 주스', '기사와 가이드 팁 (자율)'],
  },

  meetingPoint: {
    id: 'Penjemputan di Bandara Sam Ratulangi atau hotel Anda',
    en: 'Pickup at Sam Ratulangi Airport or your hotel',
    zh: '于萨姆·拉图兰吉机场或您的酒店接送',
    ko: '삼 라툴랑기 공항 또는 숙소에서 픽업',
  },

  notes: {
    id: [
      'Bawa jaket tipis untuk hari kedua — dataran tinggi Minahasa jauh lebih dingin daripada Manado.',
      'Hotel dipesankan dengan kamar berdua atau bertiga. Beri tahu kami komposisi rombongan saat memesan.',
    ],
    en: [
      'Bring a light jacket for the second day — the Minahasa highlands are far cooler than Manado.',
      'Hotel rooms are booked as doubles or triples. Tell us how your group is made up when you book.',
    ],
    zh: [
      '第二天请带薄外套——米纳哈萨高原比万鸦老凉爽得多。',
      '酒店按双人或三人房预订。预订时请告知我们同行人数组成。',
    ],
    ko: [
      '둘째 날을 위해 얇은 겉옷을 챙기세요. 미나하사 고원은 마나도보다 훨씬 서늘합니다.',
      '호텔은 2인실 또는 3인실로 예약됩니다. 예약 시 일행 구성을 알려 주세요.',
    ],
  },
};
