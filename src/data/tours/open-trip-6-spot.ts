import type { TourPackage } from './types';

export const openTrip6Spot: TourPackage = {
  slug: 'open-trip-6-spot',
  category: 'open-trip',
  days: 1,
  nights: 0,
  sortOrder: 10,
  images: [],

  name: {
    id: 'Open Trip 6 Spot — Bunaken, Nain, Siladen',
    en: 'Open Trip, Six Stops — Bunaken, Nain, Siladen',
    zh: '布纳肯、纳因、西拉登 六站拼船一日游',
    ko: '부나켄·나인·실라덴 6개 스팟 오픈 트립',
  },

  tagline: {
    id: 'Satu hari, enam titik, satu kapal bersama.',
    en: 'One day, six stops, one shared boat.',
    zh: '一天，六个停靠点，一艘拼船。',
    ko: '하루, 여섯 곳, 한 배에 함께.',
  },

  duration: {
    id: '1 hari · 07.30–17.00 WITA',
    en: 'Full day · 07:30–17:00 WITA',
    zh: '全天 · 07:30–17:00（WITA）',
    ko: '1일 · 07:30–17:00 (WITA)',
  },

  destinations: {
    id: ['Bunaken', 'Nain', 'Siladen', 'New Bunaken'],
    en: ['Bunaken', 'Nain', 'Siladen', 'New Bunaken'],
    zh: ['布纳肯', '纳因', '西拉登', '新布纳肯'],
    ko: ['부나켄', '나인', '실라덴', '뉴 부나켄'],
  },

  intro: {
    id: [
      'Kapal lepas dari Dermaga Megamas pukul delapan pagi dan baru merapat lagi menjelang sore. Di antaranya ada enam titik: perairan Bunaken yang membuat Manado dikenal penyelam sedunia, pasir timbul Nain yang hanya muncul dari laut saat air surut, pantai Siladen, dan New Bunaken.',
      'Ini open trip — Anda bergabung dengan peserta lain di kapal dua dek, bukan menyewa satu kapal untuk rombongan sendiri. Itu yang membuatnya jauh lebih ringan daripada trip privat, dan itu pula yang membuat harinya ramai: biasanya campur, ada yang datang berdua, ada yang serombongan kantor. Kru menyiapkan makan siang di atas kapal, dan dokumentasi foto sudah termasuk — tidak perlu menitipkan ponsel ke orang asing demi satu foto yang layak dibawa pulang.',
    ],
    en: [
      'The boat leaves Megamas pier at eight in the morning and does not dock again until late afternoon. In between are six stops: the Bunaken waters that put Manado on every diver’s map, the Nain sandbar that surfaces only at low tide, Siladen beach, and New Bunaken.',
      'This is an open trip — you join other travellers on a two-deck boat rather than chartering one for your own group. That is what makes it far lighter on the wallet than a private trip, and also what makes the day sociable: usually a mix, some couples, some office groups. The crew serves lunch on board, and photography is included — no handing your phone to a stranger for one usable picture.',
    ],
    zh: [
      '船早上八点从美嘉码头出发，直到傍晚才返港。中间停靠六处：让万鸦老在潜水界闻名的布纳肯海域、只在退潮时浮出海面的纳因沙洲、西拉登海滩，以及新布纳肯。',
      '这是拼船团——您与其他旅客同乘一艘双层船，而不是包下整船。费用因此比包船低得多，一天也因此热闹：通常是混合团，有情侣，也有公司同事。船员在船上备好午餐，摄影已含在内，不必把手机交给陌生人只为拍一张能带回家的照片。',
    ],
    ko: [
      '배는 아침 여덟 시에 메가마스 선착장을 떠나 늦은 오후에야 다시 정박합니다. 그 사이 여섯 곳에 들릅니다. 마나도를 다이버들의 지도에 올려놓은 부나켄 해역, 썰물 때만 바다 위로 드러나는 나인 모래톱, 실라덴 해변, 그리고 뉴 부나켄입니다.',
      '오픈 트립입니다. 배를 통째로 빌리는 것이 아니라 2층 배에 다른 여행자들과 함께 탑니다. 그래서 전세 트립보다 훨씬 부담이 적고, 하루가 북적입니다. 보통은 섞여 있습니다. 둘이 온 사람도, 회사 단체도 있습니다. 선원이 배 위에서 점심을 준비하고 사진 촬영도 포함되어 있습니다. 가져갈 만한 사진 한 장을 위해 낯선 사람에게 휴대폰을 맡길 필요가 없습니다.',
    ],
  },

  highlights: {
    id: [
      'Enam titik dalam satu hari pelayaran',
      'Kapal dua dek, ada toilet dan area teduh',
      'Makan siang dan dokumentasi foto sudah termasuk',
      'Tiga pilihan: ikut tur saja, tur dengan snorkeling, atau tur dengan diving',
    ],
    en: [
      'Six stops in a single day at sea',
      'Two-deck boat with a toilet and shaded seating',
      'Lunch and photo documentation included',
      'Three ways to join: sightseeing only, with snorkelling, or with diving',
    ],
    zh: [
      '一天航程停靠六处',
      '双层船，配有卫生间与遮阳区',
      '含午餐与摄影记录',
      '三种参加方式：纯游览、含浮潜、含潜水',
    ],
    ko: [
      '하루 항해로 여섯 곳',
      '화장실과 그늘 좌석을 갖춘 2층 배',
      '점심과 사진 촬영 포함',
      '세 가지 선택: 관광만, 스노클링 포함, 다이빙 포함',
    ],
  },

  // Sumber hanya menerbitkan jam berangkat dan jam kembali, bukan jadwal rinci
  // per titik. Ditulis apa adanya; sisanya tidak dikarang.
  itinerary: [
    {
      label: { id: 'Sepanjang hari', en: 'Across the day', zh: '全天行程', ko: '하루 일정' },
      steps: [
        {
          time: '07.30',
          title: {
            id: 'Berkumpul di Dermaga Manado Bay Megamas, di belakang gedung HOKBEN',
            en: 'Meet at Manado Bay Megamas pier, behind the HOKBEN building',
            zh: '在美嘉万鸦老湾码头集合，HOKBEN 大楼后方',
            ko: '마나도 베이 메가마스 선착장 집합, HOKBEN 건물 뒤편',
          },
        },
        {
          time: '08.00',
          title: {
            id: 'Kapal berangkat menuju titik pertama',
            en: 'The boat departs for the first stop',
            zh: '船只启航前往第一站',
            ko: '첫 번째 스팟을 향해 출항',
          },
        },
        {
          title: {
            id: 'Enam titik: Bunaken, Nain, Siladen, New Bunaken, dan titik snorkeling atau diving',
            en: 'Six stops: Bunaken, Nain, Siladen, New Bunaken, and the snorkelling or diving site',
            zh: '六个停靠点：布纳肯、纳因、西拉登、新布纳肯，以及浮潜或潜水点',
            ko: '여섯 스팟: 부나켄, 나인, 실라덴, 뉴 부나켄, 그리고 스노클링 또는 다이빙 포인트',
          },
        },
        {
          title: {
            id: 'Makan siang disiapkan kru di atas kapal',
            en: 'Lunch prepared by the crew on board',
            zh: '船员在船上准备午餐',
            ko: '선원이 배 위에서 점심 준비',
          },
        },
        {
          time: '17.00',
          title: {
            id: 'Kembali merapat di Manado',
            en: 'Back at the Manado pier',
            zh: '返回万鸦老码头',
            ko: '마나도 선착장 귀항',
          },
        },
      ],
    },
  ],

  includes: {
    id: [
      'Kapal dua dek (berbagi dengan peserta lain)',
      'Kru dan nakhoda',
      'Makan siang',
      'Pemandu wisata',
      'Asuransi pelayaran',
      'Dokumentasi foto',
      'Karaoke di kapal',
    ],
    en: [
      'Two-deck boat, shared with other travellers',
      'Crew and skipper',
      'Lunch',
      'Tour guide',
      'Marine travel insurance',
      'Photo documentation',
      'Karaoke on board',
    ],
    zh: [
      '双层船（与其他旅客拼船）',
      '船员与船长',
      '午餐',
      '导游',
      '航行保险',
      '摄影记录',
      '船上卡拉OK',
    ],
    ko: [
      '2층 배 (다른 여행자와 함께 탑승)',
      '선원과 선장',
      '점심',
      '투어 가이드',
      '해상 여행자 보험',
      '사진 촬영',
      '선상 노래방',
    ],
  },

  excludes: {
    id: ['Tip untuk pemandu dan kru (sukarela)'],
    en: ['Tips for the guide and crew (at your discretion)'],
    zh: ['导游与船员小费（自愿）'],
    ko: ['가이드와 선원 팁 (자율)'],
  },

  meetingPoint: {
    id: 'Dermaga Manado Bay Megamas, di belakang gedung HOKBEN',
    en: 'Manado Bay Megamas pier, behind the HOKBEN building',
    zh: '美嘉万鸦老湾码头，HOKBEN 大楼后方',
    ko: '마나도 베이 메가마스 선착장, HOKBEN 건물 뒤편',
  },

  notes: {
    id: [
      'Open trip berangkat pada tanggal yang sudah dijadwalkan, bukan setiap hari. Hubungi kami untuk tanggal terdekat.',
      'Pasir timbul Nain hanya muncul saat air surut, sehingga tampak berbeda dari satu perjalanan ke perjalanan lain.',
    ],
    en: [
      'Open trips run on scheduled dates rather than daily. Message us for the nearest departure.',
      'The Nain sandbar surfaces only at low tide, so it looks different from one trip to the next.',
    ],
    zh: [
      '拼船团按既定日期发船，并非每日出发。请联系我们查询最近班次。',
      '纳因沙洲只在退潮时浮现，因此每次航程所见都不相同。',
    ],
    ko: [
      '오픈 트립은 매일이 아니라 정해진 날짜에 출발합니다. 가장 가까운 출발일은 문의해 주세요.',
      '나인 모래톱은 썰물 때만 드러나므로 매번 다른 모습을 보입니다.',
    ],
  },
};
