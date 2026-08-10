import { format } from 'date-fns';

// Tanpa O, I, L, 0, 1 — kode ini dibacakan lewat telepon dan WhatsApp.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateBookingCode(now: Date, random: () => number = Math.random): string {
  const tanggal = format(now, 'yyyyMMdd');
  let suffix = '';
  for (let i = 0; i < 4; i += 1) {
    suffix += ALPHABET[Math.floor(random() * ALPHABET.length)];
  }
  return `LNS-${tanggal}-${suffix}`;
}
