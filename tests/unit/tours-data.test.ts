import { describe, it, expect } from 'vitest';
import { LOCALES } from '@/i18n';
import { TOUR_PACKAGES, TOUR_SLUGS, getTourBySlug } from '@/data/tours';

describe('data paket tours', () => {
  it('memuat paket dan slug yang unik', () => {
    expect(TOUR_PACKAGES.length).toBeGreaterThan(0);
    expect(new Set(TOUR_SLUGS).size).toBe(TOUR_SLUGS.length);
  });

  it('menemukan paket lewat slug dan mengembalikan null untuk slug asing', () => {
    expect(getTourBySlug(TOUR_SLUGS[0])?.slug).toBe(TOUR_SLUGS[0]);
    expect(getTourBySlug('tidak-ada')).toBeNull();
  });

  it('slug hanya huruf kecil, angka, dan tanda hubung', () => {
    for (const s of TOUR_SLUGS) expect(s).toMatch(/^[a-z0-9-]+$/);
  });

  // Terjemahan yang kosong jatuh ke bahasa Indonesia dan menghasilkan halaman
  // setengah Indonesia setengah asing — lebih buruk daripada bolong.
  it('setiap paket lengkap dalam empat bahasa', () => {
    for (const p of TOUR_PACKAGES) {
      for (const l of LOCALES) {
        expect(p.name[l], `${p.slug}.name.${l}`).toBeTruthy();
        expect(p.tagline[l], `${p.slug}.tagline.${l}`).toBeTruthy();
        expect(p.duration[l], `${p.slug}.duration.${l}`).toBeTruthy();
        expect(p.intro[l]?.length, `${p.slug}.intro.${l}`).toBeGreaterThan(0);
        expect(p.highlights[l]?.length, `${p.slug}.highlights.${l}`).toBeGreaterThan(0);
        expect(p.destinations[l]?.length, `${p.slug}.destinations.${l}`).toBeGreaterThan(0);
        expect(p.includes[l]?.length, `${p.slug}.includes.${l}`).toBeGreaterThan(0);
        expect(p.excludes[l]?.length, `${p.slug}.excludes.${l}`).toBeGreaterThan(0);
      }
    }
  });

  it('setiap langkah rangkaian acara lengkap dalam empat bahasa', () => {
    for (const p of TOUR_PACKAGES) {
      for (const hari of p.itinerary) {
        for (const l of LOCALES) {
          expect(hari.label[l], `${p.slug}.hari.${l}`).toBeTruthy();
        }
        for (const step of hari.steps) {
          for (const l of LOCALES) {
            expect(step.title[l], `${p.slug}.langkah.${l}`).toBeTruthy();
          }
        }
      }
    }
  });

  it('catatan dan titik kumpul, bila ada, juga lengkap empat bahasa', () => {
    for (const p of TOUR_PACKAGES) {
      for (const l of LOCALES) {
        if (p.meetingPoint) expect(p.meetingPoint[l], `${p.slug}.meetingPoint.${l}`).toBeTruthy();
        if (p.notes) expect(p.notes[l]?.length, `${p.slug}.notes.${l}`).toBeGreaterThan(0);
      }
    }
  });

  it('jumlah hari pada rangkaian acara cocok dengan kolom days', () => {
    for (const p of TOUR_PACKAGES) {
      if (p.category !== 'multi-day') continue;
      expect(p.itinerary.length, p.slug).toBe(p.days);
    }
  });

  // Harga adalah keputusan pemilik: seluruh paket mengarah ke WhatsApp.
  // Dua tes ini menahan harga agar tidak diam-diam masuk kembali.
  it('tidak ada paket yang memuat kolom harga', () => {
    for (const p of TOUR_PACKAGES) {
      const kunci = Object.keys(p);
      expect(
        kunci.some((k) => /price|harga|rate|cost|tarif/i.test(k)),
        p.slug,
      ).toBe(false);
    }
  });

  it('tidak ada angka rupiah di dalam teks paket', () => {
    for (const p of TOUR_PACKAGES) {
      const teks = JSON.stringify(p);
      expect(teks.match(/Rp\s?[0-9]/gi), `${p.slug} memuat nominal rupiah`).toBeNull();
      expect(teks.match(/[0-9]{3}\.000/g), `${p.slug} memuat nominal rupiah`).toBeNull();
    }
  });
});
