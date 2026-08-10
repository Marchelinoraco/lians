import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
      <p className="mt-2 text-muted">Halaman yang Anda cari tidak ada atau sudah dipindahkan.</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-lians-500 px-5 py-2.5 font-semibold text-white"
      >
        Kembali ke beranda
      </Link>
    </div>
  );
}
