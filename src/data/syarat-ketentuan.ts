import type { Localized } from '@/i18n';

export type BagianSyarat = {
  /** Dipakai sebagai anchor `#id` supaya satu pasal dapat ditautkan langsung. */
  id: string;
  judul: Localized<string>;
  isi: Localized<string[]>;
};

/**
 * Tanggal berlaku. Wajib diperbarui setiap kali isinya berubah — pengunjung
 * berhak tahu versi mana yang mereka setujui, dan ini yang jadi rujukan bila
 * ada sengketa.
 */
export const SYARAT_BERLAKU_SEJAK = '2026-08-14';

/**
 * Syarat dan ketentuan sewa LIANS.
 *
 * DITULIS ASLI berdasarkan aturan operasional LIANS sendiri. Struktur babnya
 * mengikuti yang lazim pada penyewaan kendaraan — itu bukan milik siapa-siapa —
 * tetapi setiap angka dan aturan di sini berasal dari pemilik LIANS.
 *
 * JANGAN menyalin klausul dari situs penyewaan lain. Bukan sekadar soal hak
 * cipta: dokumen ini mengikat. Apa pun yang tertulis di sini menjadi janji
 * LIANS saat ada sengketa, sehingga aturan milik perusahaan lain justru
 * mengikat LIANS pada operasi yang tidak dijalankannya.
 */
export const SYARAT_KETENTUAN: BagianSyarat[] = [
  {
    id: 'penyewa',
    judul: {
      id: 'Ketentuan penyewa',
      en: 'Who may rent',
      zh: '承租人资格',
      ko: '대여 자격',
    },
    isi: {
      id: [
        'Penyewa berusia minimal 21 tahun dan memiliki SIM A yang masih berlaku untuk sewa lepas kunci.',
        'Kartu identitas asli wajib ditunjukkan saat serah terima kendaraan.',
        'Kendaraan hanya boleh dikemudikan oleh orang yang namanya tercatat pada perjanjian sewa. Bila ada pengemudi pengganti, beri tahu kami lebih dulu.',
      ],
      en: [
        'Renters must be at least 21 years old and hold a valid Indonesian SIM A licence for self-drive rentals.',
        'An original identity document must be presented when the vehicle is handed over.',
        'Only the person named on the rental agreement may drive the vehicle. If someone else will drive, tell us beforehand.',
      ],
      zh: [
        '自驾租车的承租人须年满 21 周岁，并持有有效的印尼 SIM A 驾照。',
        '交车时须出示身份证件原件。',
        '仅限租赁合约上载明的本人驾驶。如需更换驾驶人，请事先告知我们。',
      ],
      ko: [
        '자차 운전 대여의 경우 만 21세 이상이며 유효한 인도네시아 SIM A 면허를 소지해야 합니다.',
        '차량 인수 시 신분증 원본을 제시해 주셔야 합니다.',
        '차량은 대여 계약서에 기재된 본인만 운전할 수 있습니다. 다른 분이 운전하실 경우 미리 알려 주세요.',
      ],
    },
  },

  {
    id: 'pemesanan',
    judul: {
      id: 'Pemesanan dan pembayaran',
      en: 'Booking and payment',
      zh: '预订与付款',
      ko: '예약과 결제',
    },
    isi: {
      id: [
        'Pemesanan dianggap sah setelah dikonfirmasi LIANS lewat WhatsApp, bukan sejak formulir dikirim.',
        'Tarif yang berlaku adalah tarif yang kami konfirmasikan saat pemesanan.',
        'Pelunasan dilakukan paling lambat saat serah terima kendaraan, kecuali disepakati lain.',
      ],
      en: [
        'A booking is confirmed once LIANS confirms it on WhatsApp, not at the moment the form is submitted.',
        'The rate that applies is the one we confirm at the time of booking.',
        'Full payment is due no later than vehicle handover, unless agreed otherwise.',
      ],
      zh: [
        '订单以 LIANS 通过 WhatsApp 确认为准，而非提交表单当时即成立。',
        '适用价格为我们在确认订单时告知的价格。',
        '除另有约定外，全额款项最迟应于交车时结清。',
      ],
      ko: [
        '예약은 양식 제출 시점이 아니라 LIANS가 WhatsApp으로 확인한 시점에 성립합니다.',
        '적용 요금은 예약 확정 시 저희가 안내한 요금입니다.',
        '별도 합의가 없는 한 잔금은 늦어도 차량 인수 시까지 결제해 주셔야 합니다.',
      ],
    },
  },

  {
    id: 'jaminan',
    judul: {
      id: 'Jaminan',
      en: 'Security',
      zh: '担保',
      ko: '보증',
    },
    isi: {
      id: [
        'Untuk sewa lepas kunci, LIANS menahan KTP dan Kartu Keluarga asli selama masa sewa.',
        'Deposit uang juga dikenakan; besarnya kami sampaikan saat konfirmasi pemesanan dan dikembalikan penuh setelah kendaraan diperiksa dan tidak ada kerusakan atau tunggakan.',
        'Seluruh jaminan dikembalikan pada hari kendaraan kembali dalam keadaan sesuai perjanjian.',
        'Untuk perjalanan ke luar Sulawesi Utara, LIANS dapat meminta jaminan tambahan.',
      ],
      en: [
        'For self-drive rentals, LIANS holds the original ID card and family card for the duration of the rental.',
        'A cash deposit also applies. We tell you the amount when confirming your booking, and it is returned in full once the vehicle has been inspected and there is no damage or outstanding charge.',
        'All security is returned on the day the vehicle comes back in the agreed condition.',
        'For journeys outside North Sulawesi, LIANS may ask for additional security.',
      ],
      zh: [
        '自驾租车期间，LIANS 将保管身份证与户口簿原件。',
        '另收取现金押金，金额于确认订单时告知；车辆查验无损坏且无欠费后全额退还。',
        '车辆按约定状态归还当日，全部担保即予退还。',
        '前往北苏拉威西省以外地区，LIANS 可要求追加担保。',
      ],
      ko: [
        '자차 운전 대여의 경우 대여 기간 동안 신분증과 가족관계증명서 원본을 보관합니다.',
        '현금 보증금도 적용됩니다. 금액은 예약 확정 시 안내드리며, 차량 점검 후 손상이나 미납금이 없으면 전액 반환됩니다.',
        '차량이 약정된 상태로 반납된 당일에 모든 담보를 돌려드립니다.',
        '북술라웨시주 외 지역으로 이동하실 경우 추가 담보를 요청할 수 있습니다.',
      ],
    },
  },

  {
    id: 'serah-terima',
    judul: {
      id: 'Serah terima kendaraan',
      en: 'Vehicle handover',
      zh: '车辆交接',
      ko: '차량 인수·반납',
    },
    isi: {
      id: [
        'Kondisi kendaraan diperiksa bersama saat diserahkan dan saat dikembalikan. Kami merekam kondisinya sebagai bukti bagi kedua pihak.',
        'Periksa dan sampaikan setiap goresan, penyok, atau kerusakan yang sudah ada sebelum kendaraan Anda bawa. Kerusakan yang tidak tercatat saat serah terima dianggap terjadi selama masa sewa.',
        'Kendaraan dikembalikan dalam keadaan bersih seperti saat diterima. Biaya pembersihan dikenakan bila kendaraan kembali dalam keadaan sangat kotor.',
      ],
      en: [
        'The vehicle is inspected together at handover and at return. We record its condition as evidence for both sides.',
        'Please point out any existing scratch, dent, or fault before you drive away. Damage not recorded at handover is treated as having occurred during the rental.',
        'The vehicle should come back as clean as it was received. A cleaning charge applies if it is returned heavily soiled.',
      ],
      zh: [
        '交车与还车时双方共同查验车况，我们会录像存证，以保障双方。',
        '请在开走前指出既有的刮痕、凹陷或故障。交接时未记录的损伤，视为租赁期间发生。',
        '车辆应以接车时的清洁程度归还。若严重污损，将收取清洁费用。',
      ],
      ko: [
        '차량 상태는 인수 시와 반납 시 함께 점검합니다. 양측을 위해 상태를 영상으로 기록합니다.',
        '출발 전에 기존의 흠집, 찌그러짐, 결함을 알려 주세요. 인수 시 기록되지 않은 손상은 대여 기간 중 발생한 것으로 봅니다.',
        '차량은 인수하셨을 때와 같은 청결 상태로 반납해 주세요. 심하게 오염된 경우 청소 비용이 부과됩니다.',
      ],
    },
  },

  {
    id: 'bbm',
    judul: {
      id: 'Bahan bakar, tol, dan parkir',
      en: 'Fuel, tolls, and parking',
      zh: '燃油、通行费与停车费',
      ko: '연료·통행료·주차료',
    },
    isi: {
      id: [
        'Pada sewa lepas kunci, bahan bakar menjadi tanggungan penyewa. Kendaraan dikembalikan dengan takaran bahan bakar yang setara saat diterima.',
        'Biaya tol, parkir, dan denda tilang selama masa sewa menjadi tanggungan penyewa.',
        'Pada paket Pelayanan, bahan bakar sudah termasuk sesuai rute yang disepakati. Perjalanan di luar rute itu dihitung tambahan.',
      ],
      en: [
        'On self-drive rentals, fuel is the renter’s responsibility. Return the vehicle with the same fuel level it was received with.',
        'Tolls, parking, and traffic fines incurred during the rental are the renter’s responsibility.',
        'On Pelayanan (with driver) packages, fuel is included for the agreed route. Travel beyond that route is charged separately.',
      ],
      zh: [
        '自驾租车的燃油由承租人承担，还车时油量应与接车时相当。',
        '租赁期间发生的通行费、停车费与交通罚款由承租人承担。',
        '含司机套餐已包含约定路线内的燃油；超出该路线的行程另行计费。',
      ],
      ko: [
        '자차 운전 대여의 연료비는 대여자 부담이며, 인수 시와 같은 연료량으로 반납해 주셔야 합니다.',
        '대여 기간 중 발생한 통행료, 주차료, 교통 범칙금은 대여자 부담입니다.',
        '기사 포함 패키지는 합의된 경로에 한해 연료가 포함됩니다. 경로를 벗어난 운행은 별도 청구됩니다.',
      ],
    },
  },

  {
    id: 'wilayah',
    judul: {
      id: 'Wilayah pemakaian',
      en: 'Where the vehicle may go',
      zh: '用车区域',
      ko: '운행 지역',
    },
    isi: {
      id: [
        'Kendaraan boleh dibawa ke mana saja, termasuk menyeberang pulau, dengan satu syarat: tujuannya diberitahukan dan disetujui LIANS sebelum berangkat.',
        'Membawa kendaraan keluar wilayah tanpa persetujuan lebih dulu merupakan pelanggaran perjanjian sewa, dan seluruh risiko yang timbul menjadi tanggungan penyewa.',
        'Untuk perjalanan jauh atau menyeberang pulau, sampaikan rencana rute Anda saat memesan agar kami dapat menyiapkan kendaraan yang sesuai.',
      ],
      en: [
        'The vehicle may be taken anywhere, including across to other islands, on one condition: the destination is disclosed to and approved by LIANS before departure.',
        'Taking the vehicle outside the agreed area without prior approval breaches the rental agreement, and every risk arising from it falls on the renter.',
        'For long journeys or island crossings, tell us your route when booking so we can prepare a suitable vehicle.',
      ],
      zh: [
        '车辆可前往任何地区，包括跨岛，惟须于出发前将目的地告知 LIANS 并获得同意。',
        '未经事先同意将车辆驶离约定区域，即构成违约，由此产生的一切风险由承租人承担。',
        '长途或跨岛行程，请于预订时告知路线，以便我们安排合适的车辆。',
      ],
      ko: [
        '차량은 섬을 건너는 것을 포함해 어디든 이동할 수 있습니다. 다만 출발 전에 목적지를 LIANS에 알리고 승인을 받으셔야 합니다.',
        '사전 승인 없이 약정 지역을 벗어나는 것은 대여 계약 위반이며, 이로 인해 발생하는 모든 위험은 대여자가 부담합니다.',
        '장거리 또는 섬 간 이동은 예약 시 경로를 알려 주시면 알맞은 차량을 준비해 드립니다.',
      ],
    },
  },

  {
    id: 'keterlambatan',
    judul: {
      id: 'Keterlambatan pengembalian',
      en: 'Late return',
      zh: '逾期还车',
      ko: '반납 지연',
    },
    isi: {
      id: [
        'Keterlambatan pengembalian dihitung sebagai tambahan sewa satu hari penuh, berapa pun lamanya keterlambatan itu.',
        'Bila Anda memperkirakan akan terlambat, hubungi kami sesegera mungkin. Kendaraan sering sudah dipesan penyewa berikutnya, dan pemberitahuan lebih awal memungkinkan kami mengatur ulang.',
        'Perpanjangan masa sewa dapat dilakukan bila kendaraan belum dipesan orang lain, dan dihitung dengan tarif harian yang berlaku.',
      ],
      en: [
        'A late return is charged as one additional full rental day, however long the delay.',
        'If you expect to be late, contact us as early as you can. The vehicle is often already booked by the next renter, and early warning lets us rearrange.',
        'Extensions are possible when the vehicle has not been booked by someone else, and are charged at the applicable daily rate.',
      ],
      zh: [
        '逾期还车按加收一整天租金计算，无论逾期时间长短。',
        '若预计会迟到，请尽早联系我们。车辆往往已被下一位客人预订，提前告知可让我们重新安排。',
        '若车辆尚未被他人预订，可办理续租，按适用日租金计费。',
      ],
      ko: [
        '반납이 지연되면 지연 시간과 관계없이 하루치 대여료가 추가로 부과됩니다.',
        '늦어질 것 같으면 가능한 한 빨리 연락해 주세요. 차량은 이미 다음 손님이 예약한 경우가 많아, 미리 알려 주시면 일정을 조정할 수 있습니다.',
        '다른 예약이 없는 경우 연장이 가능하며, 해당 일 요금이 적용됩니다.',
      ],
    },
  },

  {
    id: 'larangan',
    judul: {
      id: 'Larangan selama masa sewa',
      en: 'What is not allowed',
      zh: '租赁期间禁止事项',
      ko: '대여 중 금지 사항',
    },
    isi: {
      id: [
        'Dilarang merokok di dalam kendaraan. Biaya pembersihan dikenakan bila tercium bau rokok saat pengembalian.',
        'Kendaraan tidak boleh disewakan kembali, dipinjamkan, atau dijaminkan kepada pihak lain.',
        'Kendaraan tidak boleh dipakai untuk balapan, menarik kendaraan lain, mengangkut muatan melebihi kapasitas, atau kegiatan yang melanggar hukum.',
        'Mengemudi dalam pengaruh alkohol atau obat-obatan terlarang membatalkan seluruh perlindungan dan menjadi tanggung jawab penuh penyewa.',
      ],
      en: [
        'Smoking inside the vehicle is not permitted. A cleaning charge applies if cigarette odour is detected at return.',
        'The vehicle may not be sub-rented, lent, or pledged as security to anyone else.',
        'The vehicle may not be used for racing, towing, carrying loads beyond its capacity, or any unlawful activity.',
        'Driving under the influence of alcohol or illegal drugs voids all protection and leaves the renter fully liable.',
      ],
      zh: [
        '车内禁止吸烟。还车时若察觉烟味，将收取清洁费用。',
        '不得将车辆转租、外借或质押予他人。',
        '不得用于赛车、拖曳其他车辆、超载运输或任何违法活动。',
        '酒后或受管制药物影响驾驶，将使一切保障失效，并由承租人承担全部责任。',
      ],
      ko: [
        '차량 내 흡연은 금지됩니다. 반납 시 담배 냄새가 확인되면 청소 비용이 부과됩니다.',
        '차량을 재대여, 대여, 또는 담보로 제공할 수 없습니다.',
        '경주, 견인, 정원·적재 한도 초과 운송, 위법 행위에 사용할 수 없습니다.',
        '음주 또는 불법 약물 상태의 운전은 모든 보상을 무효로 하며, 전적으로 대여자의 책임입니다.',
      ],
    },
  },

  {
    id: 'kerusakan',
    judul: {
      id: 'Kerusakan, kehilangan, dan kecelakaan',
      en: 'Damage, loss, and accidents',
      zh: '损坏、遗失与事故',
      ko: '손상·분실·사고',
    },
    isi: {
      id: [
        'Selama masa sewa, kerusakan dan kehilangan yang terjadi pada kendaraan menjadi tanggung jawab penuh penyewa, termasuk biaya perbaikan dan penggantian suku cadang.',
        'Selain biaya perbaikan, penyewa menanggung kehilangan pendapatan sewa selama kendaraan tidak dapat dioperasikan karena perbaikan tersebut.',
        'Segera hubungi LIANS bila terjadi kecelakaan, kerusakan, atau kehilangan — sebelum mengambil tindakan perbaikan sendiri.',
        'Pada kecelakaan yang melibatkan pihak lain atau menimbulkan korban, laporkan juga kepada kepolisian dan simpan salinan laporannya.',
      ],
      en: [
        'During the rental, damage to or loss of the vehicle is the renter’s full responsibility, including repair costs and replacement parts.',
        'Beyond repair costs, the renter covers the rental income lost while the vehicle cannot be operated because of those repairs.',
        'Contact LIANS immediately in the event of an accident, damage, or loss — before arranging any repair yourself.',
        'Where an accident involves another party or causes injury, report it to the police as well and keep a copy of the report.',
      ],
      zh: [
        '租赁期间车辆的损坏或遗失，由承租人承担全部责任，包括维修费用与零件更换费用。',
        '除维修费用外，承租人还须赔偿因维修而无法营运期间的租金损失。',
        '发生事故、损坏或遗失时，请立即联系 LIANS，切勿自行安排维修。',
        '若事故涉及第三方或造成人员伤亡，另请向警方报案并保留报案回执。',
      ],
      ko: [
        '대여 기간 중 차량의 손상과 분실은 수리비와 부품 교체비를 포함해 전적으로 대여자의 책임입니다.',
        '수리비 외에도, 수리로 인해 차량을 운행할 수 없는 기간의 대여 수입 손실을 대여자가 부담합니다.',
        '사고, 손상, 분실이 발생하면 직접 수리를 진행하기 전에 즉시 LIANS로 연락해 주세요.',
        '상대방이 있거나 인명 피해가 있는 사고는 경찰에도 신고하고 신고서 사본을 보관해 주세요.',
      ],
    },
  },

  {
    id: 'pembatalan',
    judul: {
      id: 'Pembatalan dan perubahan',
      en: 'Cancellation and changes',
      zh: '取消与变更',
      ko: '취소와 변경',
    },
    isi: {
      id: [
        'Pembatalan sehari atau lebih sebelum tanggal mulai tidak dikenakan biaya.',
        'Pembatalan pada hari keberangkatan dikenakan biaya setara satu hari sewa.',
        'Perubahan tanggal dapat dilakukan tanpa biaya sepanjang kendaraan masih tersedia pada tanggal baru.',
        'Bila LIANS yang membatalkan karena kendaraan tidak dapat disediakan, kami menawarkan kendaraan pengganti atau mengembalikan seluruh pembayaran Anda.',
      ],
      en: [
        'Cancelling a day or more before the start date is free of charge.',
        'Cancelling on the day of departure is charged at one day’s rental.',
        'Dates can be changed at no cost as long as the vehicle is available on the new date.',
        'If LIANS cancels because the vehicle cannot be provided, we offer a replacement vehicle or refund everything you have paid.',
      ],
      zh: [
        '于起租日前一天或更早取消，不收取费用。',
        '于出发当日取消，收取相当于一天租金的费用。',
        '在新日期仍有车可用的前提下，可免费变更日期。',
        '若因 LIANS 无法提供车辆而取消，我们将提供替代车辆或全额退款。',
      ],
      ko: [
        '이용 시작일 하루 전 또는 그 이전 취소는 무료입니다.',
        '출발 당일 취소는 1일 대여료가 부과됩니다.',
        '변경하려는 날짜에 차량이 있다면 날짜 변경은 무료입니다.',
        'LIANS의 사정으로 차량을 제공하지 못해 취소되는 경우, 대체 차량을 안내하거나 결제하신 금액을 전액 환불해 드립니다.',
      ],
    },
  },

  {
    id: 'pengemudi',
    judul: {
      id: 'Sewa dengan pengemudi',
      en: 'Rentals with a driver',
      zh: '含司机租车',
      ko: '기사 포함 대여',
    },
    isi: {
      id: [
        'Pada paket Pelayanan, kendaraan, pengemudi, dan bahan bakar sudah termasuk dalam tarif harian.',
        'Jam kerja pengemudi disepakati saat pemesanan. Pemakaian di luar jam yang disepakati dihitung sebagai tambahan.',
        'Untuk perjalanan menginap di luar kota, akomodasi dan makan pengemudi menjadi tanggungan penyewa, kecuali disepakati lain.',
        'Pengemudi berhak menolak permintaan yang melanggar hukum atau membahayakan keselamatan.',
      ],
      en: [
        'On Pelayanan packages, the vehicle, driver, and fuel are all included in the daily rate.',
        'The driver’s working hours are agreed at booking. Use beyond the agreed hours is charged as an extra.',
        'For overnight trips out of town, the driver’s accommodation and meals are the renter’s responsibility unless agreed otherwise.',
        'The driver may decline any request that is unlawful or unsafe.',
      ],
      zh: [
        '含司机套餐的日租金已包含车辆、司机与燃油。',
        '司机工作时间于预订时约定，超出约定时段将另行计费。',
        '外地过夜行程，除另有约定外，司机的住宿与餐费由承租人承担。',
        '司机有权拒绝任何违法或危及安全的要求。',
      ],
      ko: [
        '기사 포함 패키지는 차량, 기사, 연료가 모두 일 요금에 포함됩니다.',
        '기사의 근무 시간은 예약 시 합의합니다. 합의된 시간을 넘는 이용은 추가 요금이 부과됩니다.',
        '외지 숙박 일정의 경우, 별도 합의가 없는 한 기사의 숙박비와 식비는 대여자 부담입니다.',
        '기사는 위법하거나 안전을 위협하는 요청을 거절할 수 있습니다.',
      ],
    },
  },

  {
    id: 'tur-tiket',
    judul: {
      id: 'Paket wisata dan tiket pesawat',
      en: 'Tour packages and flight tickets',
      zh: '旅游套餐与机票',
      ko: '투어 패키지와 항공권',
    },
    isi: {
      id: [
        'Harga paket wisata dan tiket pesawat tidak ditampilkan di situs ini karena bergantung pada tanggal, jumlah peserta, dan ketersediaan. Penawaran kami sampaikan lewat WhatsApp setelah permintaan Anda masuk.',
        'Rangkaian acara paket wisata dapat berubah karena cuaca, kondisi laut, atau keadaan di luar kendali kami. Bila satu tujuan tidak dapat dicapai, kami menawarkan penggantinya.',
        'Tiket pesawat tunduk pada syarat maskapai penerbit, termasuk aturan perubahan jadwal, pembatalan, dan pengembalian dana.',
        'LIANS bertindak sebagai penyedia dan pemesan layanan. Ketentuan khusus setiap paket disampaikan saat penawaran dan menjadi bagian dari perjanjian.',
      ],
      en: [
        'Tour and flight prices are not shown on this site because they depend on dates, group size, and availability. We send a quote on WhatsApp once your request arrives.',
        'Tour itineraries may change because of weather, sea conditions, or circumstances beyond our control. If a destination cannot be reached, we offer an alternative.',
        'Flight tickets are subject to the issuing airline’s conditions, including its rules on schedule changes, cancellation, and refunds.',
        'LIANS acts as the provider and booking agent for these services. The specific terms of each package are given with the quote and form part of the agreement.',
      ],
      zh: [
        '本站不显示旅游套餐与机票价格，因其取决于日期、人数与可订情况。收到您的申请后，我们将通过 WhatsApp 提供报价。',
        '旅游行程可能因天气、海况或其他不可控因素调整。若某处无法抵达，我们将提供替代方案。',
        '机票适用出票航空公司的条款，包括其改期、取消与退款规定。',
        'LIANS 作为服务提供者与代订方。各套餐的具体条款于报价时告知，并构成协议的一部分。',
      ],
      ko: [
        '투어와 항공권 가격은 날짜, 인원, 좌석 상황에 따라 달라지므로 본 사이트에 표시하지 않습니다. 요청이 접수되면 WhatsApp으로 견적을 보내 드립니다.',
        '투어 일정은 날씨, 해상 상황 등 저희가 통제할 수 없는 사정으로 변경될 수 있습니다. 방문이 어려운 곳이 있으면 대체 일정을 안내해 드립니다.',
        '항공권은 발권 항공사의 조건을 따르며, 여기에는 일정 변경·취소·환불 규정이 포함됩니다.',
        'LIANS는 해당 서비스의 제공자이자 예약 대행자로서 행위합니다. 각 패키지의 개별 조건은 견적과 함께 안내되며 계약의 일부가 됩니다.',
      ],
    },
  },

  {
    id: 'data-pribadi',
    judul: {
      id: 'Data pribadi',
      en: 'Personal data',
      zh: '个人资料',
      ko: '개인정보',
    },
    isi: {
      id: [
        'Data yang Anda kirimkan lewat formulir di situs ini — nama, nomor WhatsApp, email, dan catatan — kami gunakan hanya untuk memproses pemesanan dan menghubungi Anda.',
        'Kami tidak menjual atau menyerahkan data Anda kepada pihak ketiga untuk keperluan pemasaran.',
        'Anda dapat meminta data Anda dihapus dari catatan kami kapan saja lewat WhatsApp, kecuali data yang wajib kami simpan untuk keperluan pembukuan.',
      ],
      en: [
        'The details you send through the forms on this site — name, WhatsApp number, email, and notes — are used only to process your booking and to contact you.',
        'We do not sell or pass your details to third parties for marketing.',
        'You may ask us to delete your details from our records at any time via WhatsApp, except for records we are required to keep for accounting purposes.',
      ],
      zh: [
        '您通过本站表单提交的资料——姓名、WhatsApp 号码、电子邮箱与备注——仅用于处理订单及与您联系。',
        '我们不会为营销目的出售或转交您的资料予第三方。',
        '除依法须保存的账务记录外，您可随时通过 WhatsApp 要求我们删除您的资料。',
      ],
      ko: [
        '본 사이트 양식으로 보내 주신 정보 — 성함, WhatsApp 번호, 이메일, 메모 — 는 예약 처리와 연락 목적으로만 사용합니다.',
        '마케팅 목적으로 제3자에게 정보를 판매하거나 제공하지 않습니다.',
        '회계상 보관 의무가 있는 기록을 제외하고, WhatsApp을 통해 언제든 정보 삭제를 요청하실 수 있습니다.',
      ],
    },
  },

  {
    id: 'hukum',
    judul: {
      id: 'Hukum yang berlaku',
      en: 'Governing law',
      zh: '适用法律',
      ko: '준거법',
    },
    isi: {
      id: [
        'Perjanjian sewa ini tunduk pada hukum Republik Indonesia.',
        'Perselisihan diupayakan diselesaikan secara musyawarah lebih dulu. Bila tidak tercapai, penyelesaiannya melalui pengadilan yang berwenang di Manado.',
        'Ketentuan ini dapat berubah sewaktu-waktu. Yang berlaku bagi pemesanan Anda adalah ketentuan yang tayang pada saat pemesanan dikonfirmasi.',
      ],
      en: [
        'This rental agreement is governed by the laws of the Republic of Indonesia.',
        'Disputes are to be settled by discussion first. Failing that, they are resolved through the competent court in Manado.',
        'These terms may change from time to time. The version that applies to your booking is the one published when your booking was confirmed.',
      ],
      zh: [
        '本租赁协议适用印度尼西亚共和国法律。',
        '争议应先经友好协商解决；协商不成的，提交万鸦老有管辖权的法院处理。',
        '本条款可能不时修订。适用于您订单的，是订单确认当时所公布的版本。',
      ],
      ko: [
        '본 대여 계약에는 인도네시아 공화국 법이 적용됩니다.',
        '분쟁은 먼저 협의로 해결하며, 협의가 이루어지지 않을 경우 마나도의 관할 법원을 통해 해결합니다.',
        '본 약관은 수시로 변경될 수 있습니다. 귀하의 예약에 적용되는 것은 예약이 확정된 시점에 게시되어 있던 버전입니다.',
      ],
    },
  },
];
