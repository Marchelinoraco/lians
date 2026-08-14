import { neon } from '@neondatabase/serverless';

/**
 * Mengisi tiga artikel pembuka untuk blog LIANS.
 *
 * Isinya ditulis asli dan berdasarkan hal yang benar-benar berlaku di Manado —
 * bukan teks contoh yang harus dibuang. Silakan disunting lewat panel admin;
 * yang penting halaman blog tidak tayang kosong sejak hari pertama.
 *
 * Aman dijalankan ulang: artikel dengan slug yang sama dilewati.
 *
 * Jalankan: node --env-file=.env.local scripts/isi-blog-contoh.mjs
 */
const sql = neon(process.env.DATABASE_URL);

const ARTIKEL = [
  {
    slug: 'panduan-sewa-mobil-lepas-kunci-di-manado',
    publishedAt: '2026-08-04',
    title: {
      id: 'Panduan Sewa Mobil Lepas Kunci di Manado',
      en: 'A Practical Guide to Self-Drive Car Rental in Manado',
      zh: '万鸦老自驾租车实用指南',
      ko: '마나도 자차 운전 렌터카 안내',
    },
    excerpt: {
      id: 'Syarat, jaminan, dan hal-hal yang sebaiknya diperiksa sebelum kunci berpindah tangan.',
      en: 'Requirements, security, and the things worth checking before the keys change hands.',
      zh: '交车前应了解的条件、担保，以及值得检查的事项。',
      ko: '열쇠를 건네받기 전에 알아 둘 조건과 담보, 그리고 확인할 것들.',
    },
    body: {
      id: [
        'Sewa lepas kunci berarti Anda menyetir sendiri. Bebas berhenti di mana pun, tidak terikat jam kerja sopir, dan biasanya lebih murah untuk perjalanan beberapa hari. Yang perlu disiapkan sebenarnya tidak banyak, tetapi ada beberapa hal yang sering luput dan baru terasa saat sudah di jalan.',
        '## Yang perlu Anda siapkan',
        '- SIM A yang masih berlaku — bukan yang habis masa berlakunya minggu depan',
        '- KTP dan Kartu Keluarga asli, yang ditahan selama masa sewa',
        '- Deposit, yang besarnya kami sampaikan saat konfirmasi pemesanan',
        '- Usia minimal 21 tahun',
        'Jaminan berupa dokumen asli memang terasa berat bagi sebagian orang. Alasannya sederhana: kendaraan yang keluar tanpa jaminan apa pun adalah kendaraan yang mungkin tidak kembali, dan biaya itu pada akhirnya ditanggung pelanggan berikutnya lewat tarif yang lebih tinggi.',
        '## Periksa sebelum berangkat',
        'Kami memeriksa kondisi kendaraan bersama Anda saat serah terima dan merekamnya. Ini melindungi kedua pihak — Anda tidak akan ditagih untuk goresan yang sudah ada sebelumnya, dan kami punya catatan bila ada yang berubah.',
        'Manfaatkan momen itu. Perhatikan tekanan ban, ketinggian air radiator, dan apakah ban serep benar-benar ada dan terisi. Nyalakan AC sampai dingin sebelum keluar dari halaman. Lima menit di awal jauh lebih murah daripada satu jam menunggu di pinggir jalan.',
        '## Soal bahan bakar dan jalan',
        'Pada sewa lepas kunci, bahan bakar menjadi tanggungan penyewa, dan kendaraan dikembalikan dengan takaran yang setara saat diterima. Foto jarum bensin saat serah terima — itu menyelesaikan banyak perdebatan.',
        'Jalan di dalam kota Manado umumnya baik. Yang perlu diperhitungkan adalah tanjakan menuju Tomohon dan Tondano: gunakan gigi rendah saat menurun, jangan mengandalkan rem terus-menerus. Kalau berencana keluar Sulawesi Utara, beri tahu kami lebih dulu — bukan untuk melarang, tetapi supaya kendaraannya disiapkan sesuai jaraknya.',
        '## Kalau terjadi sesuatu',
        'Hubungi kami sebelum mengambil tindakan perbaikan sendiri. Bengkel yang kami tunjuk tahu riwayat kendaraannya, dan kesalahan penanganan di awal sering membuat biayanya berlipat.',
      ],
      en: [
        'Renting self-drive means you take the wheel. You stop wherever you like, you are not bound to a driver’s working hours, and for a trip of several days it usually costs less. There is not much to prepare, but a few things are easy to overlook and only become obvious once you are already on the road.',
        '## What you need',
        '- A valid Indonesian SIM A licence — not one expiring next week',
        '- Original ID card and family card, held for the duration of the rental',
        '- A cash deposit; we tell you the amount when confirming your booking',
        '- Minimum age of 21',
        'Handing over original documents feels like a lot to some people. The reason is simple: a vehicle that leaves with no security behind it is a vehicle that may not come back, and that cost eventually lands on the next customer as a higher rate.',
        '## Check before you go',
        'We inspect the vehicle together at handover and record its condition. That protects both sides — you will not be billed for a scratch that was already there, and we have a record if something changes.',
        'Use that moment. Look at tyre pressure, the radiator level, and whether the spare is actually there and inflated. Run the air conditioning until it is cold before you leave the yard. Five minutes at the start is far cheaper than an hour waiting at the roadside.',
        '## Fuel and roads',
        'On self-drive rentals fuel is yours to cover, and the vehicle comes back with the same level it went out with. Photograph the fuel gauge at handover — it settles a great many arguments.',
        'Roads within Manado are generally good. What deserves thought is the climb towards Tomohon and Tondano: use a low gear on the way down rather than riding the brakes. If you plan to leave North Sulawesi, tell us first — not to stop you, but so the vehicle is prepared for the distance.',
        '## If something happens',
        'Call us before arranging any repair yourself. The workshops we use know the vehicle’s history, and mishandling at the start often multiplies the cost.',
      ],
      zh: [
        '自驾租车意味着由您掌握方向盘。想停就停，不受司机工时限制，若行程有数日，通常也更划算。需要准备的其实不多，但有几件事容易被忽略，往往上路之后才发觉。',
        '## 需要准备什么',
        '- 有效的印尼 SIM A 驾照——不是下周就到期的那种',
        '- 身份证与户口簿原件，租期内由我们保管',
        '- 现金押金，金额于确认订单时告知',
        '- 年满 21 周岁',
        '交出证件原件，对某些人来说负担不轻。原因很简单：没有任何担保就驶出的车辆，可能一去不返，而这笔成本最终会以更高的价格落到下一位客人身上。',
        '## 出发前先检查',
        '交车时我们与您共同查验车况并录像存证。这对双方都是保障——您不会为原本就有的刮痕买单，而车况若有变化我们也有记录。',
        '请善用这一刻。留意胎压、水箱水位，以及备胎是否真的在车上且气压充足。驶离场地前，先把空调开到出冷风。起初的五分钟，远比在路边等候一小时划算。',
        '## 关于油费与路况',
        '自驾租车的油费由您承担，还车时油量应与接车时相当。交车时拍下油表——这能省去许多争执。',
        '万鸦老市区道路大致良好。需要留意的是前往多蒙贡与同达诺的爬坡路段：下坡请使用低档，切勿一路踩刹车。若计划驶出北苏拉威西省，请事先告知我们——不是为了阻止，而是让车辆按里程做好准备。',
        '## 万一出状况',
        '请先联系我们，不要自行安排维修。我们指定的修理厂了解车辆履历，而初期处置不当往往让费用成倍增加。',
      ],
      ko: [
        '자차 운전 대여는 직접 운전한다는 뜻입니다. 원하는 곳에서 멈출 수 있고, 기사의 근무 시간에 매이지 않으며, 며칠짜리 여행이라면 대개 더 저렴합니다. 준비할 것은 많지 않지만, 놓치기 쉬워 길 위에서야 알게 되는 몇 가지가 있습니다.',
        '## 필요한 것',
        '- 유효한 인도네시아 SIM A 면허 — 다음 주에 만료되는 것 말고',
        '- 신분증과 가족관계증명서 원본, 대여 기간 동안 보관',
        '- 현금 보증금, 금액은 예약 확정 시 안내',
        '- 만 21세 이상',
        '원본 서류를 맡기는 일이 부담스러운 분도 계십니다. 이유는 단순합니다. 아무 담보 없이 나간 차량은 돌아오지 않을 수 있고, 그 비용은 결국 다음 손님에게 더 높은 요금으로 돌아갑니다.',
        '## 출발 전 확인',
        '인수 시 함께 차량을 점검하고 상태를 영상으로 기록합니다. 양측을 보호하기 위함입니다. 원래 있던 흠집에 대해 청구받지 않으시고, 변화가 있으면 저희에게도 기록이 남습니다.',
        '그 시간을 활용하세요. 타이어 공기압, 냉각수 양, 그리고 스페어 타이어가 실제로 있고 공기가 들어 있는지 확인하세요. 마당을 나서기 전에 에어컨을 켜서 찬 바람이 나오는지 보세요. 처음의 5분이 길가에서 보내는 한 시간보다 훨씬 쌉니다.',
        '## 연료와 도로',
        '자차 운전 대여의 연료비는 대여자 부담이며, 인수하셨을 때와 같은 양으로 반납해 주셔야 합니다. 인수 시 연료 게이지를 사진으로 남겨 두세요. 많은 다툼이 그것으로 정리됩니다.',
        '마나도 시내 도로는 대체로 좋습니다. 유의할 곳은 토모혼과 톤다노로 오르는 구간입니다. 내려올 때는 브레이크에 의존하지 말고 저단 기어를 쓰세요. 북술라웨시를 벗어날 계획이라면 미리 알려 주세요. 막으려는 것이 아니라 거리에 맞게 차량을 준비하기 위해서입니다.',
        '## 문제가 생기면',
        '직접 수리를 맡기기 전에 저희에게 연락해 주세요. 저희가 이용하는 정비소는 차량 이력을 알고 있으며, 초기 대응이 잘못되면 비용이 몇 배로 늘어나는 일이 흔합니다.',
      ],
    },
  },

  {
    slug: 'rute-sehari-manado-ke-dataran-tinggi-minahasa',
    publishedAt: '2026-08-08',
    title: {
      id: 'Rute Sehari dari Manado ke Dataran Tinggi Minahasa',
      en: 'A One-Day Drive from Manado into the Minahasa Highlands',
      zh: '从万鸦老出发的米纳哈萨高原一日自驾',
      ko: '마나도에서 미나하사 고원까지, 하루 드라이브',
    },
    excerpt: {
      id: 'Danau, kawah, dan pasar tradisional dalam satu hari berkendara — beserta hal yang jarang disebutkan brosur.',
      en: 'Lakes, a crater, and a traditional market in a single day’s drive — plus what the brochures leave out.',
      zh: '一天车程走遍湖泊、火山口与传统市场——以及宣传册不会提的事。',
      ko: '하루 운전으로 호수와 분화구, 전통 시장까지 — 브로슈어가 빼놓는 이야기와 함께.',
    },
    body: {
      id: [
        'Manado panas dan lembap. Naik empat puluh menit ke arah selatan, suhunya turun cukup jauh sampai jaket tipis terasa masuk akal. Perjalanan sehari ke dataran tinggi Minahasa adalah rute paling sering diminta pelanggan kami, dan bisa dijalani sendiri dengan mobil sewaan.',
        '## Urutan yang masuk akal',
        '- Berangkat pagi dari Manado menuju Tomohon',
        '- Danau Linow, yang warnanya berganti sepanjang hari karena kandungan belerang',
        '- Makan siang di tepi Danau Tondano',
        '- Bukit Makatete menjelang sore, saat kota Manado terlihat dari ketinggian',
        'Urutan ini sengaja menaruh Linow di pagi hari. Warnanya paling jelas saat matahari masih tinggi, dan menjelang sore kabut sering turun sampai danau itu nyaris tidak terlihat.',
        '## Pasar Ekstrem Tomohon',
        'Pasar ini terkenal dan sering masuk daftar tempat wajib. Perlu dikatakan terus terang: yang dijual di sana termasuk daging yang tidak lazim bagi kebanyakan pengunjung, dan sebagian orang merasa sangat tidak nyaman melihatnya.',
        'Kalau Anda datang bersama anak-anak atau tidak yakin, lewati saja. Perjalanan ini tetap utuh tanpanya. Tidak ada yang perlu dibuktikan dengan memaksakan diri.',
        '## Yang jarang disebutkan',
        'Jalan menuju Tomohon menanjak panjang. Mobil bermesin kecil yang penuh muatan akan terasa berat, dan turunnya justru yang lebih menuntut — gunakan gigi rendah, jangan menahan rem sepanjang jalan.',
        'Kabut sering turun setelah pukul tiga sore di sekitar Linow dan Tetetana. Kalau tujuan Anda foto, berangkat lebih pagi jauh lebih menentukan daripada memilih hari apa.',
        'Sinyal telepon di beberapa titik antara Tondano dan Tetetana lemah. Unduh peta untuk dipakai luring sebelum berangkat.',
        '## Kalau tidak ingin menyetir',
        'Rute ini juga tersedia sebagai paket dengan pengemudi. Jalan menanjak, berkabut, dan berkelok bukan tempat yang menyenangkan untuk belajar medan baru — dan pengemudi yang hafal jalannya membuat Anda bisa benar-benar melihat pemandangannya.',
      ],
      en: [
        'Manado is hot and humid. Drive forty minutes south and the temperature drops far enough that a light jacket starts to make sense. A day trip into the Minahasa highlands is the route our customers ask for most, and it is entirely doable on your own in a rental car.',
        '## An order that works',
        '- Leave Manado early, heading for Tomohon',
        '- Lake Linow, whose colour shifts through the day because of its sulphur content',
        '- Lunch beside Lake Tondano',
        '- Makatete Hills in the late afternoon, when Manado spreads out below',
        'This order deliberately puts Linow in the morning. Its colour reads most clearly while the sun is still high, and by late afternoon mist often settles until the lake is barely visible.',
        '## The Tomohon Extreme Market',
        'This market is famous and appears on most must-see lists. It is worth saying plainly: what is sold there includes meat that is unfamiliar to most visitors, and some people find it genuinely distressing.',
        'If you are travelling with children, or you are unsure, skip it. The day holds together perfectly well without it. There is nothing to prove by pushing through.',
        '## What the brochures leave out',
        'The road to Tomohon is a long climb. A small engine with a full load will feel it, and the descent asks more of you than the ascent — use a low gear rather than riding the brakes the whole way down.',
        'Mist tends to come in after three in the afternoon around Linow and Tetetana. If photographs are the point, leaving early matters far more than which day you pick.',
        'Phone signal is weak at several points between Tondano and Tetetana. Download maps for offline use before you set off.',
        '## If you would rather not drive',
        'The same route is available with a driver. A climbing, misting, winding road is not a pleasant place to learn unfamiliar terrain — and someone who knows every bend leaves you free to actually look at the view.',
      ],
      zh: [
        '万鸦老炎热潮湿。往南开四十分钟，气温便下降到让人觉得该带件薄外套。前往米纳哈萨高原的一日行程，是我们客人问得最多的路线，租一辆车完全可以自行前往。',
        '## 合理的顺序',
        '- 清晨自万鸦老出发，前往多蒙贡',
        '- 利诺湖，湖水因含硫而整日变色',
        '- 在同达诺湖畔用午餐',
        '- 傍晚登马卡特特山，俯瞰脚下的万鸦老',
        '这个顺序特意把利诺湖排在上午。日头高时湖色最清晰，一到傍晚常常起雾，几乎看不见湖面。',
        '## 多蒙贡极限市场',
        '这座市场很有名，常被列为必访之地。有必要坦白说明：那里出售的肉类对多数访客而言相当陌生，有些人看了会非常不适。',
        '若您带着孩子，或心中没底，略过便是。少了这一站，行程依然完整。没有什么需要靠勉强自己来证明。',
        '## 宣传册不会提的事',
        '前往多蒙贡是一段长坡。小排量车满载时会明显吃力，而下坡比上坡更考验人——请使用低档，别一路踩着刹车。',
        '利诺湖与特特塔纳一带，下午三点后常起雾。若此行为拍照而来，早出发远比挑哪一天更关键。',
        '同达诺与特特塔纳之间数处手机信号微弱，出发前请先下载离线地图。',
        '## 若您不想自己开',
        '同一条路线也提供含司机的方案。既爬坡又起雾、弯道又多的路，并不适合边开边熟悉地形——熟路的司机能让您真正专心看风景。',
      ],
      ko: [
        '마나도는 덥고 습합니다. 남쪽으로 사십 분만 달리면 얇은 겉옷이 필요할 만큼 기온이 내려갑니다. 미나하사 고원으로 가는 당일 코스는 저희 손님들이 가장 많이 찾는 길이며, 렌터카로 직접 다녀오기에 충분합니다.',
        '## 무리 없는 순서',
        '- 이른 아침 마나도를 출발해 토모혼으로',
        '- 유황 성분 때문에 하루 종일 색이 바뀌는 리노우 호수',
        '- 톤다노 호숫가에서 점심',
        '- 늦은 오후 마카테테 언덕, 마나도가 발아래 펼쳐질 때',
        '이 순서는 리노우를 일부러 오전에 둡니다. 해가 높을 때 색이 가장 또렷하고, 늦은 오후에는 안개가 내려앉아 호수가 거의 보이지 않는 날이 많습니다.',
        '## 토모혼 익스트림 마켓',
        '이 시장은 유명하고 대개 필수 코스로 꼽힙니다. 솔직히 말씀드릴 것이 있습니다. 그곳에서 파는 고기 중에는 대부분의 방문객에게 낯선 것이 있고, 보고 나서 상당히 힘들어하는 분도 계십니다.',
        '아이와 함께 오셨거나 확신이 서지 않는다면 건너뛰셔도 됩니다. 그 한 곳이 빠져도 하루는 충분히 완결됩니다. 무리해서 증명할 것은 없습니다.',
        '## 브로슈어가 빼놓는 것',
        '토모혼으로 가는 길은 긴 오르막입니다. 작은 엔진에 짐을 가득 실으면 확실히 버거우며, 오르막보다 내리막이 더 까다롭습니다. 계속 브레이크를 밟지 말고 저단 기어를 쓰세요.',
        '리노우와 테테타나 일대는 오후 세 시가 지나면 안개가 끼는 편입니다. 사진이 목적이라면 어느 날을 고르느냐보다 일찍 출발하는 편이 훨씬 중요합니다.',
        '톤다노와 테테타나 사이 몇 곳은 휴대폰 신호가 약합니다. 출발 전 오프라인 지도를 내려받아 두세요.',
        '## 직접 운전하고 싶지 않다면',
        '같은 코스를 기사 포함으로도 이용하실 수 있습니다. 오르막에 안개, 굽이까지 겹친 길은 낯선 지형을 익히기에 즐거운 장소가 아닙니다. 길을 훤히 아는 사람이 운전하면 풍경을 제대로 볼 여유가 생깁니다.',
      ],
    },
  },

  {
    slug: 'memilih-kendaraan-untuk-rombongan',
    publishedAt: '2026-08-12',
    title: {
      id: 'Avanza, Innova, atau Hiace? Memilih Kendaraan untuk Rombongan',
      en: 'Avanza, Innova, or Hiace? Choosing a Vehicle for a Group',
      zh: 'Avanza、Innova 还是 Hiace？团队用车怎么选',
      ko: '아반자, 이노바, 하이에스? 단체 차량 고르기',
    },
    excerpt: {
      id: 'Jumlah kursi bukan satu-satunya pertimbangan. Koper, tanjakan, dan jarak tempuh sering lebih menentukan.',
      en: 'Seat count is not the only thing that matters. Luggage, hills, and distance often decide it.',
      zh: '座位数并非唯一考量。行李、坡道与里程往往更具决定性。',
      ko: '좌석 수만이 기준은 아닙니다. 짐과 오르막, 주행 거리가 더 결정적일 때가 많습니다.',
    },
    body: {
      id: [
        'Pertanyaan yang paling sering kami terima: "Kami berenam, cukup Avanza?" Jawabannya hampir selalu bergantung pada hal yang tidak disebutkan dalam pertanyaan itu — berapa koper yang dibawa, dan mau ke mana.',
        '## Hitung koper, bukan hanya orang',
        'Avanza berkursi tujuh, tetapi baris ketiga terpakai berarti ruang bagasi hampir habis. Enam orang dengan enam koper besar tidak muat, meskipun kursinya cukup. Ini penyebab paling umum rombongan harus bertukar kendaraan di hari keberangkatan.',
        '- Berdua atau bertiga dengan bagasi ringan: hatchback sudah memadai',
        '- Keluarga empat sampai lima orang dengan koper: Avanza atau Rush nyaman',
        '- Enam sampai tujuh orang dengan koper penuh: Innova, ruangnya lebih lega',
        '- Delapan orang ke atas: Hiace, dan bagasinya benar-benar terpisah',
        '## Tanjakan mengubah perhitungan',
        'Kalau rencana Anda hanya di dalam kota Manado, mesin kecil tidak menjadi masalah. Begitu tujuannya Tomohon, Tondano, atau Likupang, muatan penuh di jalan menanjak terasa berbeda.',
        'Innova bermesin diesel jauh lebih tenang di tanjakan panjang dengan muatan penuh dibanding Avanza. Untuk perjalanan sehari-hari di kota, perbedaannya tidak sepadan dengan selisih harganya; untuk rute pegunungan, sepadan.',
        '## Rombongan besar: satu Hiace atau dua mobil?',
        'Untuk sepuluh orang, dua Avanza kadang terlihat lebih murah daripada satu Hiace. Tetapi itu berarti dua sopir, dua tangki bensin, dan rombongan yang terpisah di jalan — dan biasanya satu mobil menunggu yang lain di setiap perhentian.',
        'Untuk perjalanan wisata dengan banyak perhentian, satu kendaraan besar hampir selalu lebih tenang. Untuk keperluan kantor dengan tujuan berbeda-beda, dua mobil justru lebih masuk akal.',
        '## Kalau ragu, sebutkan rencananya',
        'Beri tahu kami jumlah orang, jumlah koper, dan tujuannya. Menyarankan kendaraan yang tepat jauh lebih murah bagi kami daripada menukar kendaraan pada pagi keberangkatan.',
      ],
      en: [
        'The question we get most often is: "There are six of us, is an Avanza enough?" The answer almost always depends on what the question leaves out — how many suitcases, and where you are going.',
        '## Count the luggage, not just the people',
        'An Avanza seats seven, but using the third row leaves almost no boot space. Six people with six large suitcases will not fit, even though the seats are there. This is the single most common reason a group has to swap vehicles on the morning of departure.',
        '- Two or three people travelling light: a hatchback is plenty',
        '- A family of four or five with suitcases: an Avanza or Rush is comfortable',
        '- Six or seven with full luggage: an Innova, which has more room to give',
        '- Eight or more: a Hiace, where the luggage area is genuinely separate',
        '## Hills change the maths',
        'If your plans stay inside Manado, a small engine is no trouble at all. The moment the destination is Tomohon, Tondano, or Likupang, a full load on a long climb feels different.',
        'A diesel Innova is far more relaxed on a sustained climb under load than an Avanza. For everyday city driving the difference is not worth the price gap; for a mountain route, it is.',
        '## Large group: one Hiace or two cars?',
        'For ten people, two Avanzas can look cheaper than one Hiace. But that means two drivers, two fuel tanks, and a group split across the road — and usually one car waiting for the other at every stop.',
        'For sightseeing with many stops, one larger vehicle is almost always calmer. For company business with different destinations, two cars genuinely make more sense.',
        '## When in doubt, tell us the plan',
        'Give us the number of people, the number of suitcases, and where you are headed. Recommending the right vehicle costs us far less than swapping one out on the morning of departure.',
      ],
      zh: [
        '我们最常被问到的是：「我们六个人，Avanza 够吗？」答案几乎总是取决于问题里没说的部分——带几件行李，以及要去哪里。',
        '## 算行李，不只算人',
        'Avanza 有七个座位，但一旦用上第三排，后备厢几乎就没了空间。六个人带六件大行李装不下，即便座位够用。这也是团队在出发当天不得不换车的最常见原因。',
        '- 两三人轻装出行：两厢车已足够',
        '- 四五口之家带行李：Avanza 或 Rush 比较舒适',
        '- 六七人满载行李：Innova，空间更充裕',
        '- 八人以上：Hiace，行李区是真正独立的',
        '## 坡道会改变结论',
        '若行程只在万鸦老市区，小排量完全不成问题。一旦目的地是多蒙贡、同达诺或利库邦，满载爬坡的感受就完全不同。',
        '柴油版 Innova 在长坡满载时，比 Avanza 从容得多。日常市区通行，这份差别不值那个价差；走山路，则值得。',
        '## 大团队：一辆 Hiace 还是两辆车？',
        '十个人的话，两辆 Avanza 看起来可能比一辆 Hiace 便宜。但那意味着两位司机、两箱油，以及一路分散的队伍——而且几乎每一站都会有一辆车在等另一辆。',
        '若是多次停靠的观光行程，一辆大车几乎总是更省心；若是目的地各异的公务用车，两辆车反而更合理。',
        '## 拿不准就说说行程',
        '告诉我们人数、行李件数与目的地。为您推荐合适的车，对我们而言远比出发当天临时换车划算。',
      ],
      ko: [
        '가장 자주 받는 질문은 이것입니다. "여섯 명인데 아반자면 될까요?" 답은 거의 언제나 질문에 빠진 부분에 달려 있습니다. 캐리어가 몇 개인지, 그리고 어디로 가는지입니다.',
        '## 사람보다 짐을 세어 보세요',
        '아반자는 7인승이지만 3열을 쓰면 트렁크 공간이 거의 남지 않습니다. 좌석이 있어도 큰 캐리어 여섯 개를 든 여섯 명은 들어가지 않습니다. 출발 당일 차량을 바꿔야 하는 가장 흔한 이유가 바로 이것입니다.',
        '- 짐이 가벼운 두세 명: 해치백으로 충분',
        '- 캐리어를 든 4~5인 가족: 아반자나 러시가 편안',
        '- 짐을 가득 든 6~7명: 여유 공간이 있는 이노바',
        '- 8명 이상: 짐칸이 실제로 분리된 하이에스',
        '## 오르막이 계산을 바꿉니다',
        '마나도 시내에만 머무는 일정이라면 작은 엔진도 전혀 문제없습니다. 목적지가 토모혼, 톤다노, 리쿠팡이 되는 순간, 짐을 가득 싣고 긴 오르막을 오르는 느낌은 달라집니다.',
        '디젤 이노바는 짐을 실은 채 긴 오르막을 오를 때 아반자보다 훨씬 여유롭습니다. 일상적인 시내 주행이라면 그 차이가 가격 차만큼은 아니지만, 산길이라면 값을 합니다.',
        '## 대규모 일행: 하이에스 한 대냐, 승용차 두 대냐',
        '열 명이라면 아반자 두 대가 하이에스 한 대보다 싸 보일 수 있습니다. 하지만 그것은 기사 두 명, 연료 두 탱크, 그리고 길 위에서 갈라진 일행을 뜻합니다. 대개 매 정차마다 한 대가 다른 한 대를 기다리게 됩니다.',
        '정차가 잦은 관광 일정이라면 큰 차 한 대가 거의 언제나 더 편안합니다. 목적지가 제각각인 업무용이라면 두 대가 오히려 합리적입니다.',
        '## 망설여지면 일정을 알려 주세요',
        '인원수, 캐리어 개수, 목적지를 말씀해 주세요. 알맞은 차량을 추천하는 편이 출발 당일 차를 바꾸는 것보다 저희에게 훨씬 저렴합니다.',
      ],
    },
  },
];

async function coba(fn, label) {
  for (let i = 1; i <= 5; i += 1) {
    try {
      return await fn();
    } catch (e) {
      if (i === 5) throw new Error(`${label} gagal setelah 5 percobaan: ${e.message}`);
      console.log(`  ${label}: percobaan ${i} gagal, mengulang…`);
      await new Promise((r) => setTimeout(r, i * 2000));
    }
  }
}

let dibuat = 0;
let dilewati = 0;

for (const a of ARTIKEL) {
  const ada = await coba(() => sql`select id from posts where slug = ${a.slug}`, `cek ${a.slug}`);

  if (ada.length > 0) {
    console.log(`  dilewati (sudah ada): ${a.slug}`);
    dilewati += 1;
    continue;
  }

  await coba(
    () => sql`
      insert into posts (slug, title, excerpt, body, cover_image, is_published, published_at)
      values (${a.slug}, ${JSON.stringify(a.title)}::jsonb, ${JSON.stringify(a.excerpt)}::jsonb,
              ${JSON.stringify(a.body)}::jsonb, '[]'::jsonb, true, ${a.publishedAt})`,
    `menyimpan ${a.slug}`,
  );

  console.log(`  dibuat: ${a.slug}`);
  dibuat += 1;
}

console.log(`\n${dibuat} artikel dibuat, ${dilewati} dilewati.`);
