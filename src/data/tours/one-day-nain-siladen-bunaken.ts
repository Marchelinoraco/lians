import type { TourPackage } from './types';

export const oneDayNainSiladenBunaken: TourPackage = {
  slug: 'one-day-nain-siladen-bunaken',
  category: 'one-day',
  days: 1,
  nights: 0,
  sortOrder: 40,
  images: [],

  name: {
    id: 'Private One Day Trip — Nain, Siladen, Bunaken',
    en: 'Private Day Trip — Nain, Siladen, Bunaken',
    zh: '纳因、西拉登、布纳肯 私人包船一日游',
    ko: '나인·실라덴·부나켄 프라이빗 당일 트립',
  },

  tagline: {
    id: 'Tiga pulau dalam satu hari, kapalnya milik rombongan Anda sendiri.',
    en: 'Three islands in one day, with the boat to your group alone.',
    zh: '一天三岛，整艘船只属于您的团队。',
    ko: '하루 세 개의 섬, 배는 오직 일행만을 위해.',
  },

  duration: {
    id: '1 hari · 07.30–17.00 WITA, sekitar 10 jam',
    en: 'Full day · 07:30–17:00 WITA, about 10 hours',
    zh: '全天 · 07:30–17:00（WITA），约 10 小时',
    ko: '1일 · 07:30–17:00 (WITA), 약 10시간',
  },

  destinations: {
    id: ['Pulau Nain', 'Pasir timbul Nain', 'Pulau Siladen', 'Pulau Bunaken'],
    en: ['Nain Island', 'Nain sandbar', 'Siladen Island', 'Bunaken Island'],
    zh: ['纳因岛', '纳因沙洲', '西拉登岛', '布纳肯岛'],
    ko: ['나인 섬', '나인 모래톱', '실라덴 섬', '부나켄 섬'],
  },

  intro: {
    id: [
      'Perbedaannya dengan open trip ada pada kapalnya: di sini satu kapal hanya untuk rombongan Anda. Tidak menunggu peserta lain, tidak berbagi jadwal, dan lama berhenti di tiap pulau bisa disesuaikan di tempat bersama pemandu.',
      'Urutannya Nain, Siladen, lalu Bunaken. Di Nain ada pasir timbul — hamparan pasir yang muncul di tengah laut saat air surut, dan kapal besar tidak bisa merapat ke sana sehingga dipindahkan dulu ke perahu kecil. Siladen jadi tempat makan siang, pantainya berpasir putih dan lebih tenang daripada dua pulau lainnya. Sisa waktu paling panjang diberikan ke Bunaken, karena di situlah snorkeling dan diving sebenarnya berlangsung.',
    ],
    en: [
      'What separates this from the open trip is the boat: here one boat carries your group alone. No waiting on other passengers, no shared schedule, and how long you linger at each island can be adjusted on the spot with your guide.',
      'The order runs Nain, Siladen, then Bunaken. Nain has the sandbar — a stretch of sand that emerges mid-ocean at low tide, and since the main boat cannot reach it you transfer to a small craft first. Siladen is where lunch happens; its white-sand beach is quieter than either of the other two. The longest stretch of the day goes to Bunaken, because that is where the snorkelling and diving actually take place.',
    ],
    zh: [
      '与拼船团的差别在于船：这里整艘船只载您的团队。无需等候其他旅客，不与他人共用行程，每座岛的停留时长可与向导现场调整。',
      '顺序为纳因、西拉登，再到布纳肯。纳因有沙洲——退潮时于海中浮现的一片沙地，大船无法靠近，需先换乘小艇。西拉登是午餐地点，白沙海滩比另外两岛更为安静。一天中最长的时段留给布纳肯，因为浮潜与潜水实际都在那里进行。',
    ],
    ko: [
      '오픈 트립과 다른 점은 배입니다. 여기서는 한 척이 일행만을 태웁니다. 다른 승객을 기다릴 필요도, 일정을 공유할 필요도 없고, 각 섬에 머무는 시간은 가이드와 현장에서 조정할 수 있습니다.',
      '순서는 나인, 실라덴, 그리고 부나켄입니다. 나인에는 모래톱이 있습니다. 썰물 때 바다 한가운데 드러나는 모래밭으로, 큰 배가 닿을 수 없어 작은 배로 갈아탑니다. 실라덴에서는 점심을 먹습니다. 흰 모래 해변이 나머지 두 섬보다 조용합니다. 하루 중 가장 긴 시간은 부나켄에 배정됩니다. 스노클링과 다이빙이 실제로 이루어지는 곳이기 때문입니다.',
    ],
  },

  highlights: {
    id: [
      'Kapal privat — hanya untuk rombongan Anda',
      'Pasir timbul Nain, dicapai dengan perahu kecil',
      'Makan siang di pantai berpasir putih Siladen',
      'Waktu terpanjang di Bunaken untuk snorkeling atau diving',
    ],
    en: [
      'A private boat for your group only',
      'The Nain sandbar, reached by small boat',
      'Lunch on Siladen’s white-sand beach',
      'The longest stretch at Bunaken for snorkelling or diving',
    ],
    zh: [
      '包船——仅供您的团队使用',
      '换乘小艇抵达纳因沙洲',
      '在西拉登白沙滩用午餐',
      '布纳肯停留最久，用于浮潜或潜水',
    ],
    ko: [
      '일행만을 위한 전세 보트',
      '작은 배로 닿는 나인 모래톱',
      '실라덴 흰 모래 해변에서의 점심',
      '스노클링·다이빙을 위해 부나켄에 가장 긴 시간',
    ],
  },

  itinerary: [
    {
      label: { id: 'Sepanjang hari', en: 'Across the day', zh: '全天行程', ko: '하루 일정' },
      steps: [
        {
          time: '07.30',
          title: {
            id: 'Berkumpul di Dermaga Kawasan Megamas dan pengarahan',
            en: 'Meet at the Megamas pier and briefing',
            zh: '在美嘉区码头集合并进行行前说明',
            ko: '메가마스 선착장 집합 및 브리핑',
          },
        },
        {
          time: '08.00',
          title: {
            id: 'Berangkat dengan longboat',
            en: 'Depart by longboat',
            zh: '搭乘长艇出发',
            ko: '롱보트로 출발',
          },
        },
        {
          title: {
            id: 'Pulau Nain, sekitar satu jam — pindah ke perahu kecil menuju pasir timbul',
            en: 'Nain Island, about an hour — transfer to a small boat for the sandbar',
            zh: '纳因岛约一小时——换乘小艇前往沙洲',
            ko: '나인 섬 약 한 시간 — 모래톱으로 가기 위해 작은 배로 환승',
          },
        },
        {
          title: {
            id: 'Pulau Siladen, sekitar satu jam — makan siang di pantai',
            en: 'Siladen Island, about an hour — lunch on the beach',
            zh: '西拉登岛约一小时——海滩午餐',
            ko: '실라덴 섬 약 한 시간 — 해변에서 점심',
          },
        },
        {
          title: {
            id: 'Pulau Bunaken — snorkeling atau diving, waktu paling panjang hari itu',
            en: 'Bunaken Island — snorkelling or diving, the longest stop of the day',
            zh: '布纳肯岛——浮潜或潜水，当天停留最久',
            ko: '부나켄 섬 — 스노클링 또는 다이빙, 그날 가장 긴 정박',
          },
        },
        {
          time: '17.00',
          title: {
            id: 'Kembali ke Manado',
            en: 'Return to Manado',
            zh: '返回万鸦老',
            ko: '마나도로 귀항',
          },
        },
      ],
    },
  ],

  includes: {
    id: [
      'Longboat pulang-pergi, privat untuk rombongan Anda',
      'Toilet di kapal',
      'Perahu kecil untuk menyeberang di Nain',
      'Pas pelabuhan',
      'Tiket masuk pulau untuk WNI',
      'Nasi kotak untuk makan siang',
      'Air mineral dan minuman dingin',
      'Pemandu snorkeling',
      'Pemandu wisata',
      'Asuransi pelayaran',
      'Dokumentasi kamera dan GoPro, termasuk bawah air',
      'Hand sanitizer',
    ],
    en: [
      'Return longboat, private to your group',
      'Toilet on board',
      'Small boat transfer at Nain',
      'Harbour pass',
      'Island entry tickets for Indonesian citizens',
      'Boxed lunch',
      'Bottled water and cold drinks',
      'Snorkelling guide',
      'Tour guide',
      'Marine travel insurance',
      'Camera and GoPro documentation, including underwater',
      'Hand sanitiser',
    ],
    zh: [
      '长艇往返，您的团队包船',
      '船上卫生间',
      '纳因换乘小艇',
      '港口通行费',
      '印尼公民上岛门票',
      '午餐便当',
      '瓶装水与冷饮',
      '浮潜向导',
      '导游',
      '航行保险',
      '相机与 GoPro 摄影，含水下',
      '免洗洗手液',
    ],
    ko: [
      '일행 전용 롱보트 왕복',
      '선상 화장실',
      '나인에서 작은 배 환승',
      '항구 이용료',
      '인도네시아 국민 대상 섬 입장권',
      '도시락 점심',
      '생수와 시원한 음료',
      '스노클링 가이드',
      '투어 가이드',
      '해상 여행자 보험',
      '수중 포함 카메라·GoPro 촬영',
      '손 소독제',
    ],
  },

  excludes: {
    id: [
      'Transportasi darat menuju dermaga',
      'Sewa alat snorkeling',
      'Sewa alat diving',
      'Alat snorkeling milik pemandu',
      'Tip untuk pemandu dan kru (sukarela)',
    ],
    en: [
      'Ground transport to the pier',
      'Snorkelling gear rental',
      'Diving gear rental',
      'The guide’s own snorkelling equipment',
      'Tips for the guide and crew (at your discretion)',
    ],
    zh: [
      '前往码头的陆路交通',
      '浮潜装备租赁',
      '潜水装备租赁',
      '向导自用浮潜装备',
      '导游与船员小费（自愿）',
    ],
    ko: [
      '선착장까지의 육상 교통',
      '스노클링 장비 대여',
      '다이빙 장비 대여',
      '가이드 본인 스노클링 장비',
      '가이드와 선원 팁 (자율)',
    ],
  },

  meetingPoint: {
    id: 'Dermaga Kawasan Megamas, pukul 07.30 WITA',
    en: 'Megamas pier, 07:30 WITA',
    zh: '美嘉区码头，07:30（WITA）',
    ko: '메가마스 선착장, 07:30 (WITA)',
  },

  notes: {
    id: [
      'Transportasi darat menuju dermaga belum termasuk. Bila diperlukan, LIANS dapat menyiapkannya terpisah — sebutkan saat memesan.',
      'Pasir timbul Nain bergantung pada pasang surut, sehingga luasnya berbeda pada tiap perjalanan dan sesekali tidak muncul sama sekali.',
    ],
    en: [
      'Ground transport to the pier is not included. LIANS can arrange it separately — mention it when you book.',
      'The Nain sandbar depends on the tide, so its size differs from trip to trip and occasionally it does not appear at all.',
    ],
    zh: [
      '不含前往码头的陆路交通。如有需要，LIANS 可另行安排——预订时请说明。',
      '纳因沙洲取决于潮汐，每次航程面积不同，偶尔完全不会浮现。',
    ],
    ko: [
      '선착장까지의 육상 교통은 포함되지 않습니다. 필요하시면 LIANS가 별도로 준비해 드립니다. 예약 시 말씀해 주세요.',
      '나인 모래톱은 조수에 따라 달라 매번 넓이가 다르며, 드물게 전혀 드러나지 않기도 합니다.',
    ],
  },
};
