import type { TourPackage } from './types';

export const oneDayBunaken: TourPackage = {
  slug: 'one-day-bunaken',
  category: 'one-day',
  days: 1,
  nights: 0,
  sortOrder: 30,
  images: [],

  name: {
    id: 'One Day Trip Bunaken',
    en: 'Bunaken Day Trip',
    zh: '布纳肯一日游',
    ko: '부나켄 당일 트립',
  },

  tagline: {
    id: 'Taman laut yang membuat Manado dikenal, dalam satu hari.',
    en: 'The marine park that made Manado famous, in a single day.',
    zh: '让万鸦老闻名的海洋公园，一天走完。',
    ko: '마나도를 알린 해양공원을 하루에.',
  },

  duration: {
    id: '1 hari · dapat diringkas menjadi 4 jam',
    en: 'Full day · can be shortened to about 4 hours',
    zh: '全天 · 可缩短至约 4 小时',
    ko: '1일 · 약 4시간으로 단축 가능',
  },

  destinations: {
    id: ['Pulau Bunaken', 'Taman Laut Bunaken', 'Pantai Liang', 'Pulau Manado Tua'],
    en: ['Bunaken Island', 'Bunaken Marine Park', 'Liang Beach', 'Manado Tua Island'],
    zh: ['布纳肯岛', '布纳肯海洋公园', '良海滩', '老万鸦老岛'],
    ko: ['부나켄 섬', '부나켄 해양공원', '리앙 해변', '마나도 투아 섬'],
  },

  intro: {
    id: [
      'Kami jemput di hotel, lalu longboat berangkat dari Dermaga Megamas pukul delapan. Pulau Manado Tua terlihat jelas dari kapal sepanjang perjalanan — kerucut gunung yang muncul langsung dari laut, dan biasanya jadi foto pertama sebelum sampai tujuan.',
      'Di Bunaken, waktu terbagi antara Pantai Liang dan tepian taman lautnya. Yang membuat tempat ini terkenal bukan pantainya melainkan dinding karangnya: dasar laut menurun tajam beberapa meter dari garis pantai, sehingga ikan karang terlihat jelas bahkan dari permukaan. Snorkeling maupun diving sama-sama bisa, dan pemandu snorkeling ikut mendampingi di air. Kalau waktu Anda mepet, satu hari ini bisa dipadatkan menjadi sekitar empat jam.',
    ],
    en: [
      'We collect you from your hotel, then the longboat leaves Megamas pier at eight. Manado Tua island stays in view the whole crossing — a cone rising straight out of the sea, and usually the first photo of the day before anyone reaches the island.',
      'On Bunaken the time splits between Liang Beach and the edge of the marine park. What made this place famous is not the beach but the wall: the seabed drops away sharply a few metres from shore, so reef fish are visible even from the surface. Snorkelling and diving both work here, and a snorkelling guide stays with you in the water. If your schedule is tight, the day can be compressed into roughly four hours.',
    ],
    zh: [
      '我们到酒店接您，随后长艇八点从美嘉码头出发。整段航程都能看见老万鸦老岛——一座直接从海面升起的锥形山，通常是抵岛前的第一张照片。',
      '在布纳肯，时间分给良海滩与海洋公园边缘。让此地闻名的不是沙滩，而是那道海墙：距岸数米海床便陡然下沉，因此从水面就能清楚看见珊瑚鱼。浮潜与潜水皆可，浮潜向导会全程在水中陪同。若您行程紧凑，这一天可压缩为约四小时。',
    ],
    ko: [
      '호텔로 모시러 간 뒤 롱보트가 여덟 시에 메가마스 선착장을 출발합니다. 건너는 내내 마나도 투아 섬이 보입니다. 바다에서 곧장 솟은 원뿔형 산으로, 대개 섬에 닿기 전 그날의 첫 사진이 됩니다.',
      '부나켄에서는 리앙 해변과 해양공원 가장자리로 시간이 나뉩니다. 이곳을 유명하게 만든 것은 해변이 아니라 벽입니다. 해안에서 몇 미터만 나가면 해저가 가파르게 떨어져, 수면에서도 산호초 물고기가 또렷이 보입니다. 스노클링과 다이빙 모두 가능하고 스노클링 가이드가 물속에서 동행합니다. 일정이 빠듯하면 하루를 약 네 시간으로 줄일 수 있습니다.',
    ],
  },

  highlights: {
    id: [
      'Dinding karang Bunaken, terlihat jelas bahkan dari permukaan',
      'Antar-jemput hotel sudah termasuk',
      'Pemandu snorkeling mendampingi di dalam air',
      'Dokumentasi atas dan bawah air dengan kamera dan GoPro',
    ],
    en: [
      'The Bunaken reef wall, visible even from the surface',
      'Hotel pickup and drop-off included',
      'A snorkelling guide stays with you in the water',
      'Above- and underwater photography with camera and GoPro',
    ],
    zh: [
      '布纳肯珊瑚海墙，水面即可清楚看见',
      '含酒店接送',
      '浮潜向导全程水中陪同',
      '相机与 GoPro 拍摄水上水下影像',
    ],
    ko: [
      '수면에서도 보이는 부나켄 산호 벽',
      '호텔 픽업·드롭 포함',
      '스노클링 가이드가 물속에서 동행',
      '카메라와 GoPro로 수상·수중 촬영',
    ],
  },

  itinerary: [
    {
      label: { id: 'Sepanjang hari', en: 'Across the day', zh: '全天行程', ko: '하루 일정' },
      steps: [
        {
          title: {
            id: 'Penjemputan di hotel dan pengarahan singkat',
            en: 'Hotel pickup and a short briefing',
            zh: '酒店接送与简短行前说明',
            ko: '호텔 픽업 및 간단한 브리핑',
          },
        },
        {
          time: '08.00',
          title: {
            id: 'Longboat berangkat dari Dermaga Megamas',
            en: 'The longboat leaves Megamas pier',
            zh: '长艇自美嘉码头出发',
            ko: '롱보트가 메가마스 선착장 출발',
          },
        },
        {
          title: {
            id: 'Melintas dekat Pulau Manado Tua, berhenti untuk foto dari kapal',
            en: 'Passing Manado Tua island, pausing for photos from the boat',
            zh: '途经老万鸦老岛，于船上停留拍照',
            ko: '마나도 투아 섬 인근 통과, 배 위에서 사진 촬영',
          },
        },
        {
          title: {
            id: 'Tiba di Bunaken — foto di Pantai Liang, camilan pisang goreng sambal',
            en: 'Arrive at Bunaken — photos at Liang Beach, fried banana with chilli paste',
            zh: '抵达布纳肯——良海滩拍照，享用炸香蕉配辣酱',
            ko: '부나켄 도착 — 리앙 해변에서 사진, 삼발을 곁들인 튀긴 바나나 간식',
          },
        },
        {
          title: {
            id: 'Snorkeling atau diving di tepi taman laut, didampingi pemandu',
            en: 'Snorkelling or diving at the edge of the marine park with a guide',
            zh: '在海洋公园边缘浮潜或潜水，向导陪同',
            ko: '가이드와 함께 해양공원 가장자리에서 스노클링 또는 다이빙',
          },
        },
        {
          title: {
            id: 'Makan siang di rumah makan, lalu waktu bebas',
            en: 'Lunch at a local restaurant, then free time',
            zh: '在当地餐馆用午餐，随后自由活动',
            ko: '현지 식당에서 점심 후 자유 시간',
          },
        },
        {
          title: {
            id: 'Kembali ke Manado dan diantar ke hotel',
            en: 'Return to Manado and drop-off at your hotel',
            zh: '返回万鸦老并送回酒店',
            ko: '마나도로 귀항 후 호텔까지 이동',
          },
        },
      ],
    },
  ],

  includes: {
    id: [
      'Antar-jemput hotel',
      'Longboat Manado–Bunaken pulang-pergi',
      'Toilet di kapal',
      'Pas pelabuhan dan tiket masuk pulau',
      'Makan siang di rumah makan',
      'Camilan pisang goreng sambal',
      'Minuman ringan dan air mineral',
      'Pemandu snorkeling',
      'Pemandu wisata',
      'Asuransi pelayaran',
      'Dokumentasi kamera dan GoPro, termasuk bawah air',
    ],
    en: [
      'Hotel pickup and drop-off',
      'Return longboat, Manado to Bunaken',
      'Toilet on board',
      'Harbour pass and island entry ticket',
      'Lunch at a local restaurant',
      'Fried banana with chilli paste',
      'Soft drinks and bottled water',
      'Snorkelling guide',
      'Tour guide',
      'Marine travel insurance',
      'Camera and GoPro documentation, including underwater',
    ],
    zh: [
      '酒店接送',
      '万鸦老—布纳肯长艇往返',
      '船上卫生间',
      '港口通行费与上岛门票',
      '当地餐馆午餐',
      '炸香蕉配辣酱',
      '软饮与瓶装水',
      '浮潜向导',
      '导游',
      '航行保险',
      '相机与 GoPro 摄影，含水下',
    ],
    ko: [
      '호텔 픽업·드롭',
      '마나도–부나켄 롱보트 왕복',
      '선상 화장실',
      '항구 이용료 및 섬 입장권',
      '현지 식당 점심',
      '삼발을 곁들인 튀긴 바나나',
      '음료와 생수',
      '스노클링 가이드',
      '투어 가이드',
      '해상 여행자 보험',
      '수중 포함 카메라·GoPro 촬영',
    ],
  },

  excludes: {
    id: [
      'Sewa alat snorkeling',
      'Sewa alat diving',
      'Alat snorkeling milik pemandu',
      'Tip untuk pemandu dan kru (sukarela)',
    ],
    en: [
      'Snorkelling gear rental',
      'Diving gear rental',
      'The guide’s own snorkelling equipment',
      'Tips for the guide and crew (at your discretion)',
    ],
    zh: ['浮潜装备租赁', '潜水装备租赁', '向导自用浮潜装备', '导游与船员小费（自愿）'],
    ko: ['스노클링 장비 대여', '다이빙 장비 대여', '가이드 본인 스노클링 장비', '가이드와 선원 팁 (자율)'],
  },

  meetingPoint: {
    id: 'Penjemputan di hotel, kapal berangkat dari Dermaga Megamas',
    en: 'Hotel pickup; the boat departs from Megamas pier',
    zh: '酒店接送，船只自美嘉码头出发',
    ko: '호텔 픽업, 선박은 메가마스 선착장에서 출발',
  },

  notes: {
    id: [
      'Alat snorkeling dan diving disewakan terpisah. Beri tahu kami saat memesan agar disiapkan.',
      'Bunaken adalah kawasan taman laut — karang tidak boleh diinjak atau dipegang, dan pemandu akan mengingatkan bila perlu.',
    ],
    en: [
      'Snorkelling and diving gear are rented separately. Tell us when you book so it is ready for you.',
      'Bunaken is a protected marine park — the coral must not be stood on or touched, and your guide will say so if needed.',
    ],
    zh: [
      '浮潜与潜水装备另行租赁。预订时请告知我们以便提前备妥。',
      '布纳肯属海洋保护区——不可踩踏或触摸珊瑚，必要时向导会提醒。',
    ],
    ko: [
      '스노클링과 다이빙 장비는 별도 대여입니다. 예약 시 알려 주시면 준비해 두겠습니다.',
      '부나켄은 해양보호구역입니다. 산호를 밟거나 만지면 안 되며, 필요할 때 가이드가 안내합니다.',
    ],
  },
};
