/** 081234567890 dan +6281234567890 sama-sama menjadi 6281234567890. */
export function normalizePhone(phone: string): string {
  const digit = phone.replace(/\D/g, '');
  if (digit.startsWith('62')) return digit;
  if (digit.startsWith('0')) return `62${digit.slice(1)}`;
  return `62${digit}`;
}

export function waLink(phone: string, message: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}
