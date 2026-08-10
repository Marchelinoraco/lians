'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Terjadi gangguan</h1>
      <p className="mt-2 text-muted">
        Halaman ini sedang tidak bisa dimuat. Silakan coba lagi, atau hubungi kami langsung lewat
        WhatsApp.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-lians-500 px-5 py-2.5 font-semibold text-white hover:bg-lians-600"
      >
        Coba lagi
      </button>
    </div>
  );
}
