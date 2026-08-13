import type { TourPackage } from './types';

export const bunakenNainSiladen2h1m: TourPackage = {
  slug: '2h1m-bunaken-nain-siladen',
  category: 'multi-day',
  days: 2,
  nights: 1,
  sortOrder: 80,
  images: [],

  name: {
    id: '2 Hari 1 Malam — Bunaken, Nain, Siladen',
    en: '2 Days 1 Night — Bunaken, Nain, Siladen',
    zh: '两天一夜 — 布纳肯、纳因、西拉登',
    ko: '1박 2일 — 부나켄·나인·실라덴',
  },

  tagline: {
    id: 'Menginap di pulaunya, bukan pulang ke kota.',
    en: 'Sleep on the island rather than returning to the city.',
    zh: '夜宿岛上，不返回城市。',
    ko: '도시로 돌아가지 않고 섬에서 하룻밤.',
  },

  duration: {
    id: '2 hari 1 malam · menginap di resort Pulau Bunaken',
    en: '2 days, 1 night · staying at a resort on Bunaken Island',
    zh: '两天一夜 · 入住布纳肯岛度假村',
    ko: '1박 2일 · 부나켄 섬 리조트 숙박',
  },

  destinations: {
    id: ['Pulau Siladen', 'Atol Nain', 'Pulau Bunaken', 'Pantai Liang'],
    en: ['Siladen Island', 'Nain atoll', 'Bunaken Island', 'Liang Beach'],
    zh: ['西拉登岛', '纳因环礁', '布纳肯岛', '良海滩'],
    ko: ['실라덴 섬', '나인 환초', '부나켄 섬', '리앙 해변'],
  },

  intro: {
    id: [
      'Bedanya dengan trip sehari terletak pada malamnya: Anda menginap di resort di Pulau Bunaken, bukan kembali ke hotel di kota. Itu mengubah banyak hal. Sore hari pulau menjadi sepi setelah kapal-kapal harian pulang, malamnya gelap dan berbintang tanpa lampu kota, dan pagi berikutnya Anda sudah berada di tempatnya — tidak perlu menyeberang lagi satu jam untuk mulai snorkeling.',
      'Hari pertama menyusuri Siladen dan atol Nain sebelum menuju penginapan. Hari kedua diberikan penuh untuk perairan Bunaken, dua titik snorkeling dengan jeda makan siang di antaranya. Kamar diisi berdua atau bertiga.',
    ],
    en: [
      'What separates this from the day trip is the night: you stay at a resort on Bunaken Island rather than returning to a hotel in the city. That changes a great deal. The island empties out in the late afternoon once the day boats leave, the night is dark and full of stars without city light, and the next morning you are already there — no hour-long crossing before you can get in the water.',
      'The first day traces Siladen and the Nain atoll before reaching the resort. The second is given entirely to the Bunaken waters, two snorkelling sites with lunch in between. Rooms take two or three people.',
    ],
    zh: [
      '与一日游的差别在于那一夜：您入住布纳肯岛上的度假村，而非返回城中酒店。这改变了许多。傍晚日归船只离去后，岛上归于寂静；夜里没有城市灯火，星空清朗；次日清晨您已身在其中——无需再航行一小时才能下水。',
      '第一天游历西拉登与纳因环礁，随后前往住宿。第二天完全留给布纳肯海域，两处浮潜点，中间以午餐相隔。客房为两至三人房。',
    ],
    ko: [
      '당일 트립과의 차이는 밤에 있습니다. 시내 호텔로 돌아가지 않고 부나켄 섬 리조트에 묵습니다. 그것이 많은 것을 바꿉니다. 늦은 오후 당일 배들이 떠나면 섬은 조용해지고, 도시 불빛이 없는 밤에는 별이 가득하며, 다음 날 아침에는 이미 그곳에 있습니다. 물에 들어가려고 한 시간을 다시 건널 필요가 없습니다.',
      '첫날은 실라덴과 나인 환초를 둘러본 뒤 숙소로 향합니다. 둘째 날은 온전히 부나켄 해역에 할애되며, 점심을 사이에 두고 두 곳에서 스노클링합니다. 객실은 2~3인용입니다.',
    ],
  },

  highlights: {
    id: [
      'Menginap di resort Pulau Bunaken, bukan hotel kota',
      'Pulau menjadi sepi setelah kapal harian pulang',
      'Dua titik snorkeling di hari kedua',
      'Atol Nain dan pantai Siladen di hari pertama',
    ],
    en: [
      'A resort on Bunaken Island rather than a city hotel',
      'The island quietens once the day boats leave',
      'Two snorkelling sites on the second day',
      'The Nain atoll and Siladen beach on the first',
    ],
    zh: [
      '入住布纳肯岛度假村而非城中酒店',
      '日归船只离去后岛上归于宁静',
      '第二天两处浮潜点',
      '第一天造访纳因环礁与西拉登海滩',
    ],
    ko: [
      '시내 호텔이 아닌 부나켄 섬 리조트',
      '당일 배들이 떠나면 조용해지는 섬',
      '둘째 날 두 곳의 스노클링 포인트',
      '첫날의 나인 환초와 실라덴 해변',
    ],
  },

  itinerary: [
    {
      label: { id: 'Hari 1 — Siladen, Nain, menuju Bunaken', en: 'Day 1 — Siladen, Nain, on to Bunaken', zh: '第一天 — 西拉登、纳因，前往布纳肯', ko: '1일차 — 실라덴, 나인, 부나켄으로' },
      steps: [
        { title: { id: 'Berkumpul, pengarahan, dan pemeriksaan kesiapan', en: 'Meet, briefing, and readiness check', zh: '集合、行前说明与状态确认', ko: '집합, 브리핑, 준비 상태 확인' } },
        { title: { id: 'Berlayar menuju Pulau Siladen', en: 'Sail to Siladen Island', zh: '航行前往西拉登岛', ko: '실라덴 섬으로 항해' } },
        { title: { id: 'Makan siang', en: 'Lunch', zh: '午餐', ko: '점심' } },
        { title: { id: 'Menyeberang ke atol Nain', en: 'Cross to the Nain atoll', zh: '横渡至纳因环礁', ko: '나인 환초로 이동' } },
        { title: { id: 'Tiba di Bunaken dan check-in resort', en: 'Arrive at Bunaken and check in at the resort', zh: '抵达布纳肯并入住度假村', ko: '부나켄 도착 후 리조트 체크인' } },
        { title: { id: 'Makan malam di resort, lalu istirahat', en: 'Dinner at the resort, then rest', zh: '度假村晚餐，随后休息', ko: '리조트에서 저녁 식사 후 휴식' } },
      ],
    },
    {
      label: { id: 'Hari 2 — Perairan Bunaken', en: 'Day 2 — The Bunaken waters', zh: '第二天 — 布纳肯海域', ko: '2일차 — 부나켄 해역' },
      steps: [
        { title: { id: 'Sarapan dan check-out', en: 'Breakfast and check-out', zh: '早餐并退房', ko: '조식 및 체크아웃' } },
        { title: { id: 'Persiapan di pantai', en: 'Preparation on the beach', zh: '海滩准备', ko: '해변에서 준비' } },
        { title: { id: 'Snorkeling titik pertama', en: 'First snorkelling site', zh: '第一处浮潜点', ko: '첫 번째 스노클링 포인트' } },
        { title: { id: 'Makan siang', en: 'Lunch', zh: '午餐', ko: '점심' } },
        { title: { id: 'Snorkeling titik kedua', en: 'Second snorkelling site', zh: '第二处浮潜点', ko: '두 번째 스노클링 포인트' } },
        { title: { id: 'Bilas dan waktu bebas', en: 'Rinse off and free time', zh: '冲洗与自由活动', ko: '샤워 후 자유 시간' } },
        { title: { id: 'Kembali ke Manado', en: 'Return to Manado', zh: '返回万鸦老', ko: '마나도로 귀항' } },
      ],
    },
  ],

  includes: {
    id: [
      'Kapal selama dua hari',
      'Menginap di resort Bunaken, sekamar berdua atau bertiga',
      'Tiket masuk objek wisata',
      'Air mineral sepanjang perjalanan',
      '3× makan: 1 makan malam di resort, 1 nasi kotak, 1 di rumah makan',
      'Pemandu snorkeling',
      'Pelampung',
      'Pas pelabuhan',
      'Asuransi Jasa Raharja',
      'Dokumentasi tanpa batas dengan kamera dan GoPro bawah air',
      'Camilan pisang goreng',
    ],
    en: [
      'Boat for both days',
      'Resort stay on Bunaken, two or three to a room',
      'Entrance fees to the sites',
      'Drinking water throughout',
      'Three meals: one resort dinner, one boxed meal, one at a restaurant',
      'Snorkelling guide',
      'Life jackets',
      'Harbour pass',
      'Jasa Raharja travel insurance',
      'Unlimited documentation with camera and underwater GoPro',
      'Fried banana snacks',
    ],
    zh: [
      '两日船只',
      '布纳肯度假村住宿，两至三人一房',
      '景点门票',
      '全程饮用水',
      '三餐：度假村晚餐一次、便当一次、餐馆一次',
      '浮潜向导',
      '救生衣',
      '港口通行费',
      'Jasa Raharja 保险',
      '相机与水下 GoPro 摄影，张数不限',
      '炸香蕉点心',
    ],
    ko: [
      '이틀간의 선박',
      '부나켄 리조트 숙박, 2~3인 1실',
      '관광지 입장료',
      '전 일정 생수',
      '식사 3회: 리조트 저녁 1회, 도시락 1회, 식당 1회',
      '스노클링 가이드',
      '구명조끼',
      '항구 이용료',
      'Jasa Raharja 여행자 보험',
      '카메라와 수중 GoPro 촬영, 장수 제한 없음',
      '튀긴 바나나 간식',
    ],
  },

  excludes: {
    id: [
      'Tiket pesawat',
      'Alat snorkeling dan diving pribadi',
      'Alat snorkeling milik pemandu',
      'Menu dan minuman tambahan',
      'Biaya acara malam bila ada',
      'Tip untuk pemandu dan kru (sukarela)',
    ],
    en: [
      'Flight tickets',
      'Personal snorkelling and diving equipment',
      'The guide’s own snorkelling equipment',
      'Extra menu items and drinks',
      'Any evening event fees',
      'Tips for the guide and crew (at your discretion)',
    ],
    zh: ['机票', '个人浮潜与潜水装备', '向导自用浮潜装备', '加点与额外饮品', '夜间活动费用（如有）', '导游与船员小费（自愿）'],
    ko: ['항공권', '개인 스노클링·다이빙 장비', '가이드 본인 스노클링 장비', '추가 메뉴와 음료', '야간 행사 비용 (있을 경우)', '가이드와 선원 팁 (자율)'],
  },

  notes: {
    id: [
      'Anda menginap di pulau, bukan di kota. Bawa perlengkapan pribadi secukupnya karena pilihan di pulau terbatas.',
      'Setelah kapal harian pulang, pulau menjadi jauh lebih sepi — itu bagian dari daya tariknya, dan juga berarti hiburan malam sangat terbatas.',
    ],
    en: [
      'You stay on the island, not in the city. Bring what you need with you; choices on the island are limited.',
      'Once the day boats leave, the island becomes very quiet — that is part of the appeal, and it also means evening entertainment is minimal.',
    ],
    zh: [
      '您住在岛上而非城中。请自备所需物品，岛上选择有限。',
      '日归船只离去后，岛上会非常安静——这既是其魅力所在，也意味着夜间几乎没有娱乐。',
    ],
    ko: [
      '시내가 아니라 섬에서 묵습니다. 섬에서는 선택지가 제한적이니 필요한 물건은 챙겨 오세요.',
      '당일 배들이 떠나면 섬은 매우 조용해집니다. 그것이 매력이기도 하지만 야간 즐길 거리는 거의 없다는 뜻이기도 합니다.',
    ],
  },
};
