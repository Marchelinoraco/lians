import { MessageCircle } from 'lucide-react';

export function WhatsAppFloat({ url, label }: { url: string; label: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-colors hover:bg-emerald-600"
    >
      <MessageCircle className="h-6 w-6" aria-hidden />
    </a>
  );
}
