import type { TourPackage } from './types';

export const sunsetManado: TourPackage = {
  slug: 'sunset-manado',
  category: 'open-trip',
  days: 1,
  nights: 0,
  sortOrder: 20,
  images: [],

  name: {
    id: 'Open Trip Sunset Manado',
    en: 'Manado Sunset Open Trip',
    zh: '万鸦老日落拼船之旅',
    ko: '마나도 선셋 오픈 트립',
  },

  tagline: {
    id: 'Tiga jam di teluk, dari sore sampai lampu kota menyala.',
    en: 'Three hours on the bay, from late afternoon until the city lights come on.',
    zh: '海湾上的三小时，从黄昏到华灯初上。',
    ko: '만에서 보내는 세 시간, 늦은 오후부터 도시에 불이 켜질 때까지.',
  },

  duration: {
    id: '3 jam · kumpul 16.30, kembali 20.00 WITA',
    en: '3 hours · meet 16:30, back by 20:00 WITA',
    zh: '3 小时 · 16:30 集合，20:00 返回（WITA）',
    ko: '3시간 · 16:30 집합, 20:00 귀항 (WITA)',
  },

  destinations: {
    id: ['Teluk Manado', 'Perairan Bahu', 'Malalayang'],
    en: ['Manado Bay', 'Bahu waters', 'Malalayang'],
    zh: ['万鸦老湾', '巴胡海域', '马拉拉扬'],
    ko: ['마나도 만', '바후 해역', '말랄라양'],
  },

  intro: {
    id: [
      'Kapal berangkat pukul lima sore dan menyusur teluk sampai matahari turun di balik Pulau Manado Tua. Rutenya ke arah Bahu dan Malalayang, menyesuaikan jumlah peserta sore itu. Tiga jam, tanpa perlu bangun pagi dan tanpa perlu berenang.',
      'Dek kapal ditata untuk duduk lama: ada bean bag, listrik menyala penuh, WiFi, dan toilet. Kopi dan teh tersedia sepanjang perjalanan. Karaoke ikut disiapkan, jadi bagian mana pun dari sore itu bisa jadi ramai atau tenang, tergantung rombongan yang naik. Dokumentasi foto sudah termasuk, dikerjakan dengan kamera dan lampu — bukan sekadar ponsel, karena cahaya sore memang sulit.',
    ],
    en: [
      'The boat leaves at five in the afternoon and traces the bay until the sun drops behind Manado Tua island. The route runs towards Bahu and Malalayang, adjusted to how many people are aboard that evening. Three hours, no early start, no swimming required.',
      'The deck is set up for sitting a while: bean bags, full power, WiFi, and a toilet. Coffee and tea are served throughout. Karaoke is on board too, so the evening turns lively or quiet depending on who joins. Photography is included and shot with a proper camera and lighting — evening light is genuinely difficult, and a phone rarely wins against it.',
    ],
    zh: [
      '船在下午五点出发，沿海湾航行，直到太阳落到老万鸦老岛背后。航线朝巴胡与马拉拉扬方向，视当晚人数调整。三小时，无需早起，也不必下水。',
      '甲板是为久坐而布置的：懒人沙发、全程供电、WiFi 与卫生间。全程供应咖啡与茶。船上也备有卡拉OK，因此这个傍晚是热闹还是安静，取决于同船的人。摄影已含在内，使用相机与补光灯拍摄——傍晚的光线本就难拍，手机往往力不从心。',
    ],
    ko: [
      '배는 오후 다섯 시에 출발해 해가 마나도 투아 섬 뒤로 떨어질 때까지 만을 따라 항해합니다. 항로는 바후와 말랄라양 방향이며, 그날 저녁 인원에 따라 조정됩니다. 세 시간, 일찍 일어날 필요도 물에 들어갈 필요도 없습니다.',
      '갑판은 오래 앉아 있기 좋게 꾸며져 있습니다. 빈백, 상시 전원, WiFi, 화장실이 있습니다. 커피와 차가 내내 제공됩니다. 노래방도 준비되어 있어 그 저녁이 북적일지 조용할지는 함께 탄 사람들에 달렸습니다. 사진 촬영이 포함되며 카메라와 조명으로 찍습니다. 저녁 빛은 원래 까다로워서 휴대폰으로는 좀처럼 담기지 않습니다.',
    ],
  },

  highlights: {
    id: [
      'Matahari terbenam di teluk, bukan dari daratan',
      'Bean bag, WiFi, listrik, dan toilet di kapal',
      'Kopi, teh, dan air mineral sepanjang perjalanan',
      'Dokumentasi foto dengan kamera dan lampu, tanpa batas jumlah',
    ],
    en: [
      'Sunset from the water rather than from the shore',
      'Bean bags, WiFi, power, and a toilet on board',
      'Coffee, tea, and drinking water throughout',
      'Unlimited photography, shot with a camera and lighting',
    ],
    zh: [
      '在海上而非岸上看日落',
      '船上备有懒人沙发、WiFi、电源与卫生间',
      '全程供应咖啡、茶与饮用水',
      '使用相机与补光灯拍摄，张数不限',
    ],
    ko: [
      '해변이 아닌 바다 위에서 보는 일몰',
      '선상 빈백, WiFi, 전원, 화장실',
      '커피, 차, 생수 상시 제공',
      '카메라와 조명으로 촬영, 장수 제한 없음',
    ],
  },

  itinerary: [
    {
      label: { id: 'Sore hingga malam', en: 'Late afternoon into evening', zh: '傍晚至夜间', ko: '늦은 오후부터 밤까지' },
      steps: [
        {
          time: '16.30',
          title: {
            id: 'Berkumpul di Dermaga Megamas, samping kanan Gedung KONI Manado',
            en: 'Meet at Megamas pier, to the right of the KONI Manado building',
            zh: '在美嘉码头集合，万鸦老 KONI 大楼右侧',
            ko: '메가마스 선착장 집합, KONI 마나도 건물 오른편',
          },
        },
        {
          time: '17.00',
          title: {
            id: 'Kapal berangkat menyusur teluk ke arah Bahu dan Malalayang',
            en: 'The boat sets out along the bay towards Bahu and Malalayang',
            zh: '船只沿海湾驶向巴胡与马拉拉扬',
            ko: '바후와 말랄라양 방향으로 만을 따라 출항',
          },
        },
        {
          title: {
            id: 'Matahari terbenam di balik Pulau Manado Tua, dilanjut sesi foto dan karaoke',
            en: 'Sunset behind Manado Tua island, then photos and karaoke',
            zh: '日落于老万鸦老岛之后，接着拍照与卡拉OK',
            ko: '마나도 투아 섬 뒤로 지는 일몰, 이어서 사진 촬영과 노래방',
          },
        },
        {
          time: '20.00',
          title: {
            id: 'Kembali merapat di Dermaga Megamas',
            en: 'Back at Megamas pier',
            zh: '返回美嘉码头',
            ko: '메가마스 선착장 귀항',
          },
        },
      ],
    },
  ],

  includes: {
    id: [
      'Kapal sunset dengan area duduk bean bag',
      'Kru dan nakhoda',
      'BBM',
      'Pemandu wisata',
      'Toilet di kapal',
      'Karaoke dan musik',
      'WiFi dan listrik',
      'Air mineral, kopi, dan teh',
      'Dokumentasi foto tanpa batas dengan kamera dan lampu',
    ],
    en: [
      'Sunset boat with bean bag seating',
      'Crew and skipper',
      'Fuel',
      'Tour guide',
      'Toilet on board',
      'Karaoke and music',
      'WiFi and power outlets',
      'Drinking water, coffee, and tea',
      'Unlimited photography with camera and lighting',
    ],
    zh: [
      '配懒人沙发座位的日落游船',
      '船员与船长',
      '燃油',
      '导游',
      '船上卫生间',
      '卡拉OK与音乐',
      'WiFi 与电源',
      '饮用水、咖啡与茶',
      '相机与补光灯摄影，张数不限',
    ],
    ko: [
      '빈백 좌석을 갖춘 선셋 보트',
      '선원과 선장',
      '연료',
      '투어 가이드',
      '선상 화장실',
      '노래방과 음악',
      'WiFi와 전원',
      '생수, 커피, 차',
      '카메라와 조명 촬영, 장수 제한 없음',
    ],
  },

  excludes: {
    id: [
      'Minuman di luar yang disediakan paket',
      'Membawa minuman dari luar tidak diperbolehkan',
      'Tip untuk kru (sukarela)',
    ],
    en: [
      'Drinks beyond those provided in the package',
      'Bringing your own drinks on board is not permitted',
      'Tips for the crew (at your discretion)',
    ],
    zh: ['套餐以外的饮品', '不得自带饮品上船', '船员小费（自愿）'],
    ko: ['패키지에 포함되지 않은 음료', '외부 음료 반입 불가', '선원 팁 (자율)'],
  },

  meetingPoint: {
    id: 'Dermaga Megamas, samping kanan Gedung KONI Manado',
    en: 'Megamas pier, to the right of the KONI Manado building',
    zh: '美嘉码头，万鸦老 KONI 大楼右侧',
    ko: '메가마스 선착장, KONI 마나도 건물 오른편',
  },

  notes: {
    id: [
      'Keberangkatan memerlukan minimal sepuluh peserta. Bila Anda datang berdua atau bertiga, hubungi kami lebih dulu untuk memastikan sore itu jadi berangkat.',
      'Ini perjalanan menyusur teluk, bukan trip ke pulau — tidak ada agenda berenang atau snorkeling.',
    ],
    en: [
      'Departure requires at least ten participants. If you are travelling as a pair or a trio, message us first to check whether that evening is running.',
      'This is a cruise along the bay, not an island trip — there is no swimming or snorkelling on the schedule.',
    ],
    zh: [
      '发船需至少十位参加者。若您仅两三人同行，请先联系我们确认当晚是否成行。',
      '这是海湾巡航，而非上岛行程——行程中没有游泳或浮潜安排。',
    ],
    ko: [
      '출항에는 최소 열 명이 필요합니다. 두세 명이 함께 오신다면 그날 저녁 운항 여부를 먼저 문의해 주세요.',
      '만을 따라 도는 크루즈이며 섬 투어가 아닙니다. 수영이나 스노클링 일정은 없습니다.',
    ],
  },
};
