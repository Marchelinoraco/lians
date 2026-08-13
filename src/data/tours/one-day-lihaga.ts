import type { TourPackage } from './types';

export const oneDayLihaga: TourPackage = {
  slug: 'one-day-lihaga',
  category: 'one-day',
  days: 1,
  nights: 0,
  sortOrder: 50,
  images: [],

  name: {
    id: 'One Day Trip Lihaga',
    en: 'Lihaga Island Day Trip',
    zh: '利哈加岛一日游',
    ko: '리하가 섬 당일 트립',
  },

  tagline: {
    id: 'Pulau kecil tanpa penghuni, pasirnya putih dan lautnya dangkal.',
    en: 'A small uninhabited island, white sand and shallow water.',
    zh: '无人居住的小岛，白沙浅海。',
    ko: '사람이 살지 않는 작은 섬, 흰 모래와 얕은 바다.',
  },

  duration: {
    id: '1 hari · berangkat 07.00 atau 09.00, tergantung paket',
    en: 'Full day · departing 07:00 or 09:00 depending on the option',
    zh: '全天 · 视方案於 07:00 或 09:00 出发',
    ko: '1일 · 선택에 따라 07:00 또는 09:00 출발',
  },

  destinations: {
    id: ['Pulau Lihaga', 'Dermaga Serei, Likupang'],
    en: ['Lihaga Island', 'Serei pier, Likupang'],
    zh: ['利哈加岛', '利库邦 塞雷码头'],
    ko: ['리하가 섬', '리쿠팡 세레이 선착장'],
  },

  intro: {
    id: [
      'Lihaga tidak berpenghuni. Tidak ada warung, tidak ada penginapan, dan itu justru alasan orang datang: pasir putihnya bersih dan lautnya dangkal jauh ke tengah, cocok untuk yang ingin main air tanpa harus bisa berenang dalam. Snorkeling dilakukan di tepian pulau, bukan di laut lepas.',
      'Pulau ini dicapai dari Dermaga Serei di Likupang, sekitar dua jam berkendara ke utara dari Manado, lalu menyeberang dengan perahu. Karena tidak ada apa pun di pulau, semuanya dibawa dari darat — nasi kotak, air minum, payung pantai, bean bag. Yang perlu Anda putuskan hanyalah apakah berangkat sendiri sampai Dermaga Serei atau dijemput dari Manado.',
    ],
    en: [
      'Lihaga is uninhabited. No warungs, no lodgings — and that is precisely why people come: clean white sand and water that stays shallow a long way out, which suits anyone who wants to be in the sea without being a strong swimmer. Snorkelling happens along the island’s edge, not out in open water.',
      'The island is reached from Serei pier in Likupang, roughly two hours north of Manado by road, then a boat crossing. Since nothing is sold on the island, everything comes from the mainland — boxed meals, drinking water, beach umbrellas, bean bags. The only thing you need to decide is whether you make your own way to Serei pier or are collected from Manado.',
    ],
    zh: [
      '利哈加无人居住。没有小吃摊，也没有住宿——而这正是人们前来的理由：洁净白沙，海水向外延伸很远仍然很浅，适合想下水又不擅深泳的人。浮潜在岛缘进行，而非外海。',
      '前往此岛需从利库邦的塞雷码头出发，自万鸦老向北驱车约两小时，再乘船横渡。岛上无任何售卖，一切皆自陆地带上——便当、饮用水、沙滩伞、懒人沙发。您唯一需要决定的，是自行前往塞雷码头，还是由我们从万鸦老接送。',
    ],
    ko: [
      '리하가에는 사람이 살지 않습니다. 가게도 숙소도 없습니다. 바로 그 점이 사람들이 찾는 이유입니다. 깨끗한 흰 모래와 멀리까지 얕게 이어지는 바다는 깊이 헤엄치지 못해도 물놀이를 즐기고 싶은 사람에게 알맞습니다. 스노클링은 먼바다가 아니라 섬 가장자리에서 합니다.',
      '섬은 리쿠팡의 세레이 선착장에서 갑니다. 마나도에서 북쪽으로 차로 약 두 시간, 이어서 배로 건넙니다. 섬에서는 아무것도 팔지 않으므로 모든 것을 육지에서 가져갑니다. 도시락, 마실 물, 비치 파라솔, 빈백입니다. 정하실 것은 세레이 선착장까지 직접 오실지, 마나도에서 모시러 갈지뿐입니다.',
    ],
  },

  highlights: {
    id: [
      'Pulau tanpa penghuni, pasir putih dan air dangkal',
      'Snorkeling di tepian pulau, aman untuk pemula',
      'Payung pantai dan bean bag disiapkan di lokasi',
      'Nasi kotak halal dan air mineral sudah termasuk',
    ],
    en: [
      'An uninhabited island with white sand and shallow water',
      'Snorkelling along the island’s edge, gentle for beginners',
      'Beach umbrellas and bean bags set up on site',
      'Halal boxed meal and drinking water included',
    ],
    zh: [
      '无人小岛，白沙浅水',
      '岛缘浮潜，适合初学者',
      '现场备有沙滩伞与懒人沙发',
      '含清真便当与饮用水',
    ],
    ko: [
      '흰 모래와 얕은 바다의 무인도',
      '초보자에게도 편한 섬 가장자리 스노클링',
      '현장에 비치 파라솔과 빈백 준비',
      '할랄 도시락과 생수 포함',
    ],
  },

  itinerary: [
    {
      label: { id: 'Sepanjang hari', en: 'Across the day', zh: '全天行程', ko: '하루 일정' },
      steps: [
        {
          time: '07.00',
          title: {
            id: 'Penjemputan di hotel atau Megamas (Paket B dan C)',
            en: 'Hotel or Megamas pickup (options B and C)',
            zh: '酒店或美嘉接送（方案 B 与 C）',
            ko: '호텔 또는 메가마스 픽업 (B·C 옵션)',
          },
        },
        {
          time: '09.00',
          title: {
            id: 'Berkumpul di Dermaga Serei, Likupang, lalu pengarahan',
            en: 'Meet at Serei pier, Likupang, then briefing',
            zh: '在利库邦塞雷码头集合并进行行前说明',
            ko: '리쿠팡 세레이 선착장 집합 후 브리핑',
          },
        },
        {
          title: {
            id: 'Menyeberang dengan perahu menuju Pulau Lihaga',
            en: 'Boat crossing to Lihaga Island',
            zh: '乘船横渡前往利哈加岛',
            ko: '배로 리하가 섬까지 이동',
          },
        },
        {
          title: {
            id: 'Menyusuri pulau dan sesi foto, payung serta bean bag dipasang di pantai',
            en: 'Walking the island and photos; umbrellas and bean bags set up on the beach',
            zh: '环岛漫步与拍照，沙滩上架设遮阳伞与懒人沙发',
            ko: '섬 산책과 사진 촬영, 해변에 파라솔과 빈백 설치',
          },
        },
        {
          title: {
            id: 'Makan siang, lalu waktu bebas — berenang atau berkano',
            en: 'Lunch, then free time — swimming or canoeing',
            zh: '午餐，随后自由活动——游泳或划独木舟',
            ko: '점심 후 자유 시간 — 수영 또는 카누',
          },
        },
        {
          title: {
            id: 'Snorkeling di tepian pulau, didampingi pemandu',
            en: 'Snorkelling along the island’s edge with a guide',
            zh: '在向导陪同下于岛缘浮潜',
            ko: '가이드와 함께 섬 가장자리에서 스노클링',
          },
        },
        {
          title: {
            id: 'Kembali ke dermaga dan diantar ke hotel',
            en: 'Back to the pier and drop-off at your hotel',
            zh: '返回码头并送回酒店',
            ko: '선착장으로 돌아와 호텔까지 이동',
          },
        },
      ],
    },
  ],

  includes: {
    id: [
      'Transportasi darat (Paket B dan C)',
      'Perahu pulang-pergi menuju Lihaga',
      'Pas pelabuhan dan tiket masuk pulau',
      'Nasi kotak halal',
      'Air mineral',
      'Pendampingan snorkeling',
      'Payung pantai dan bean bag',
      'Toilet',
      'Pemandu wisata',
      'Asuransi Jasa Raharja',
      'Dokumentasi kamera dan GoPro bawah air',
      'Hand sanitizer',
    ],
    en: [
      'Ground transport (options B and C)',
      'Return boat to Lihaga',
      'Harbour pass and island entry ticket',
      'Halal boxed meal',
      'Drinking water',
      'Snorkelling assistance',
      'Beach umbrellas and bean bags',
      'Toilet facilities',
      'Tour guide',
      'Jasa Raharja travel insurance',
      'Camera and underwater GoPro documentation',
      'Hand sanitiser',
    ],
    zh: [
      '陆路交通（方案 B 与 C）',
      '往返利哈加的船只',
      '港口通行费与上岛门票',
      '清真便当',
      '饮用水',
      '浮潜陪同',
      '沙滩伞与懒人沙发',
      '卫生间',
      '导游',
      'Jasa Raharja 保险',
      '相机与 GoPro 水下摄影',
      '免洗洗手液',
    ],
    ko: [
      '육상 교통 (B·C 옵션)',
      '리하가 왕복 선박',
      '항구 이용료 및 섬 입장권',
      '할랄 도시락',
      '생수',
      '스노클링 동행',
      '비치 파라솔과 빈백',
      '화장실',
      '투어 가이드',
      'Jasa Raharja 여행자 보험',
      '카메라·GoPro 수중 촬영',
      '손 소독제',
    ],
  },

  excludes: {
    id: [
      'Alat snorkeling dan diving pribadi',
      'Alat snorkeling milik pemandu',
      'Tip untuk pemandu dan sopir (sukarela)',
    ],
    en: [
      'Personal snorkelling and diving equipment',
      'The guide’s own snorkelling equipment',
      'Tips for the guide and driver (at your discretion)',
    ],
    zh: ['个人浮潜与潜水装备', '向导自用浮潜装备', '导游与司机小费（自愿）'],
    ko: ['개인 스노클링·다이빙 장비', '가이드 본인 스노클링 장비', '가이드와 기사 팁 (자율)'],
  },

  meetingPoint: {
    id: 'Paket A berkumpul di Dermaga Serei, Likupang pukul 09.00. Paket B dan C dijemput di hotel atau Megamas pukul 07.00.',
    en: 'Option A meets at Serei pier, Likupang, at 09:00. Options B and C are collected from your hotel or Megamas at 07:00.',
    zh: '方案 A 于 09:00 在利库邦塞雷码头集合；方案 B 与 C 于 07:00 在酒店或美嘉接送。',
    ko: 'A 옵션은 09:00에 리쿠팡 세레이 선착장 집합, B·C 옵션은 07:00에 호텔 또는 메가마스에서 픽업합니다.',
  },

  notes: {
    id: [
      'Tersedia tiga varian. Paket A tanpa transportasi darat — Anda menuju Dermaga Serei sendiri. Paket B dan C sudah termasuk penjemputan dari Manado, dan perjalanan daratnya sekitar dua jam.',
      'Tidak ada warung atau penginapan di Lihaga. Bawa perlengkapan pribadi secukupnya; makan dan minum sudah kami siapkan dari darat.',
    ],
    en: [
      'Three variants are available. Option A comes without ground transport — you make your own way to Serei pier. Options B and C include pickup from Manado, with roughly two hours on the road.',
      'There are no shops or lodgings on Lihaga. Bring what you need personally; food and drink are carried over from the mainland by us.',
    ],
    zh: [
      '共三种方案。方案 A 不含陆路交通，需自行前往塞雷码头；方案 B 与 C 含万鸦老接送，陆路车程约两小时。',
      '利哈加岛上没有商店或住宿。请自备个人所需物品，餐食与饮水由我们自陆地带上。',
    ],
    ko: [
      '세 가지 옵션이 있습니다. A 옵션은 육상 교통이 없어 세레이 선착장까지 직접 오셔야 합니다. B·C 옵션은 마나도 픽업이 포함되며 육로로 약 두 시간 걸립니다.',
      '리하가에는 상점도 숙소도 없습니다. 개인 용품은 챙겨 오시고, 식사와 음료는 저희가 육지에서 준비해 갑니다.',
    ],
  },
};
