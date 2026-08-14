import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';

/**
 * Pemilih bahasa berbentuk daftar yang dibuka, bukan empat tautan berjejer —
 * nama keempat bahasa sekaligus mendesak bilah atas sampai 中文 dan 한국어
 * terpecah per aksara. Karena itu tautannya baru ada setelah daftar dibuka.
 */
function bukaDaftar() {
  fireEvent.click(screen.getByRole('button'));
}

describe('LanguageSwitcher', () => {
  it('menutup daftar secara bawaan dan hanya menampilkan bahasa yang aktif', () => {
    render(<LanguageSwitcher current="zh" path="/mobil" />);

    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Indonesia' })).not.toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent('中文');
  });

  it('menampilkan keempat bahasa dengan nama dalam bahasanya sendiri setelah dibuka', () => {
    render(<LanguageSwitcher current="id" path="/mobil" />);
    bukaDaftar();

    for (const label of ['Indonesia', 'English', '中文', '한국어']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('menautkan ke halaman yang sama, bukan ke beranda', () => {
    render(<LanguageSwitcher current="id" path="/mobil/innova-zenix-g" />);
    bukaDaftar();

    expect(screen.getByRole('link', { name: '한국어' })).toHaveAttribute(
      'href',
      '/ko/mobil/innova-zenix-g',
    );
    expect(screen.getByRole('link', { name: '中文' })).toHaveAttribute(
      'href',
      '/zh/mobil/innova-zenix-g',
    );
  });

  it('tidak memberi awalan pada tautan bahasa Indonesia', () => {
    render(<LanguageSwitcher current="en" path="/travel" />);
    bukaDaftar();

    expect(screen.getByRole('link', { name: 'Indonesia' })).toHaveAttribute('href', '/travel');
  });

  it('menandai bahasa yang sedang aktif', () => {
    render(<LanguageSwitcher current="zh" path="/" />);
    bukaDaftar();

    expect(screen.getByRole('link', { name: '中文' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: 'English' })).not.toHaveAttribute('aria-current');
  });

  it('memberi tiap tautan atribut hrefLang untuk mesin pencari', () => {
    render(<LanguageSwitcher current="id" path="/" />);
    bukaDaftar();

    expect(screen.getByRole('link', { name: '한국어' })).toHaveAttribute('hreflang', 'ko');
  });

  it('menutup daftar setelah salah satu bahasa dipilih', () => {
    render(<LanguageSwitcher current="id" path="/" />);
    bukaDaftar();

    fireEvent.click(screen.getByRole('link', { name: 'English' }));
    expect(screen.queryByRole('link', { name: 'English' })).not.toBeInTheDocument();
  });

  it('menutup daftar saat tombol Escape ditekan', () => {
    render(<LanguageSwitcher current="id" path="/" />);
    bukaDaftar();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('link', { name: '中文' })).not.toBeInTheDocument();
  });
});
