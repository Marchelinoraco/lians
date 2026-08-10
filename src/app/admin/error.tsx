'use client';

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
      <h1 className="text-lg font-bold text-red-800">Terjadi kesalahan</h1>
      <p className="mt-2 text-sm text-red-700">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
      >
        Coba lagi
      </button>
    </div>
  );
}
