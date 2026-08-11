import { neon } from '@neondatabase/serverless';

/**
 * Mengisi teks halaman Tentang dan kontak dari company profile LIANS.
 * Jalankan sekali: node --env-file=.env.local scripts/isi-tentang.mjs
 *
 * Setelah ini, ubah lewat admin.lians.id/pengaturan — perubahan dari sana
 * langsung menyegarkan situs publik, sedangkan skrip ini tidak.
 */
const sql = neon(process.env.DATABASE_URL);

const aboutText = {
  id: `CV. Lian Sejahtera — dikenal sebagai Lians Tour & Travel — berdiri sejak 2018 di Manado, Sulawesi Utara.

Kami melayani tiga hal: pemesanan tiket pesawat domestik, paket wisata di Sulawesi Utara, serta penyewaan kendaraan dengan maupun tanpa pengemudi.

Untuk tiket pesawat, kami bekerja sama langsung dengan Garuda Indonesia, Citilink, Batik Air, Lion Air, Wings Air, dan Super Air Jet. Perubahan jadwal, pembatalan, dan pengembalian dana dapat diurus lewat kami tanpa Anda perlu menghubungi maskapai sendiri.

Untuk perjalanan wisata, kami menyusun paket yang sudah mencakup transportasi, penginapan, konsumsi, dan tiket masuk, serta dapat disesuaikan dengan kebutuhan rombongan Anda.

Untuk transportasi, armada kami mencakup Toyota Alphard, Fortuner, Avanza, Xenia, Innova Reborn, Innova Zenix, Mitsubishi Xpander, Hiace Premio, Hiace Commuter, bus pariwisata, hingga speedboat dan yacht — lengkap dengan pengemudi berpengalaman.

Kepercayaan yang kami jaga datang dari instansi dan perusahaan seperti Pengadilan Tinggi Sulawesi Utara, Ditlantas Polda Sulut, Inspektorat Provinsi Sulawesi Utara, Kodam XIII/Merdeka, Dinas Kesehatan Provinsi Sulut, Dinas Perhubungan Kota Bitung, Bawaslu Provinsi Sulut dan Kota Manado, serta PT Wanatiara Persada, PT Rimba Kurnia Alam, PT Karunia Jaya Marine, dan PT Nipsea Paint and Chemical.

Badan usaha: CV. Lian Sejahtera, NIB 9120305102189, berstatus Pengusaha Kena Pajak.`,

  en: `CV. Lian Sejahtera — known as Lians Tour & Travel — has served Manado, North Sulawesi since 2018.

We do three things: domestic flight bookings, tour packages across North Sulawesi, and vehicle rental with or without a driver.

For flights, we work directly with Garuda Indonesia, Citilink, Batik Air, Lion Air, Wings Air, and Super Air Jet. Reschedules, cancellations, and refunds go through us, so you never have to deal with the airline yourself.

For tours, our packages cover transport, accommodation, meals, and entrance fees, and can be shaped around what your group actually needs.

For transport, our fleet spans the Toyota Alphard, Fortuner, Avanza, Xenia, Innova Reborn, Innova Zenix, Mitsubishi Xpander, Hiace Premio, Hiace Commuter, tour buses, and even speedboats and a yacht — experienced drivers included.

Our clients include the North Sulawesi High Court, the North Sulawesi Police Traffic Directorate, the Provincial Inspectorate, Kodam XIII/Merdeka, the Provincial Health Office, the Bitung City Transport Office, the election supervisory boards of North Sulawesi and Manado, along with PT Wanatiara Persada, PT Rimba Kurnia Alam, PT Karunia Jaya Marine, and PT Nipsea Paint and Chemical.

Registered as CV. Lian Sejahtera, business licence number 9120305102189, VAT-registered.`,

  zh: `CV. Lian Sejahtera（品牌名 Lians Tour & Travel）自 2018 年起在北苏拉威西省万鸦老提供服务。

我们主营三项业务：国内机票预订、北苏拉威西旅游套餐，以及自驾或含司机的租车服务。

机票方面，我们与鹰航、Citilink、Batik Air、Lion Air、Wings Air 及 Super Air Jet 直接合作。改期、取消与退款均可由我们代办，您无需自行联系航空公司。

旅游方面，套餐已包含交通、住宿、餐饮与景点门票，并可根据团队的实际需求调整。

交通方面，车队涵盖丰田 Alphard、Fortuner、Avanza、Xenia、Innova Reborn、Innova Zenix、三菱 Xpander、Hiace Premio、Hiace Commuter、旅游巴士，以及快艇与游艇，并可配备经验丰富的司机。

我们的客户包括北苏拉威西高等法院、北苏拉威西警察局交通局、省监察厅、Kodam XIII/Merdeka、省卫生局、比通市交通局、北苏拉威西省与万鸦老市选举监督委员会，以及 PT Wanatiara Persada、PT Rimba Kurnia Alam、PT Karunia Jaya Marine 与 PT Nipsea Paint and Chemical。

企业注册名称：CV. Lian Sejahtera，营业执照号 9120305102189，已登记为增值税纳税人。`,

  ko: `CV. Lian Sejahtera(브랜드명 Lians Tour & Travel)는 2018년부터 북술라웨시 마나도에서 서비스를 제공해 왔습니다.

저희는 세 가지 일을 합니다: 국내선 항공권 예약, 북술라웨시 여행 패키지, 그리고 기사 포함 또는 자차 운전 렌터카입니다.

항공권은 가루다 인도네시아, 시티링크, 바틱에어, 라이온에어, 윙스에어, 슈퍼에어젯과 직접 협력합니다. 일정 변경, 취소, 환불 모두 저희를 통해 처리되므로 항공사에 직접 연락하실 필요가 없습니다.

여행 패키지에는 교통, 숙박, 식사, 입장료가 포함되며 단체의 실제 필요에 맞게 조정할 수 있습니다.

차량은 토요타 알파드, 포츄너, 아반자, 제니아, 이노바 리본, 이노바 제닉스, 미쓰비시 엑스팬더, 하이에스 프레미오, 하이에스 커뮤터, 관광버스, 그리고 스피드보트와 요트까지 보유하고 있으며 숙련된 기사도 함께 배정해 드립니다.

북술라웨시 고등법원, 북술라웨시 경찰청 교통국, 주 감사원, Kodam XIII/Merdeka, 주 보건국, 비통시 교통국, 북술라웨시주 및 마나도시 선거감독위원회를 비롯해 PT Wanatiara Persada, PT Rimba Kurnia Alam, PT Karunia Jaya Marine, PT Nipsea Paint and Chemical 등이 저희 고객입니다.

사업자명: CV. Lian Sejahtera, 사업자등록번호 9120305102189, 부가가치세 등록 사업자.`,
};

const perubahan = {
  aboutText,
  email: 'lian.tt@yahoo.com',
  phone: '081143902688',
};

for (const [key, value] of Object.entries(perubahan)) {
  await sql`
    insert into site_settings (key, value, updated_at)
    values (${key}, ${JSON.stringify(value)}::jsonb, now())
    on conflict (key) do update set value = ${JSON.stringify(value)}::jsonb, updated_at = now()`;
}

console.log('diperbarui: aboutText (4 bahasa), email, phone');
