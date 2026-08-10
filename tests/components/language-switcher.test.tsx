import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';

describe('LanguageSwitcher', () => {
  it('menampilkan keempat bahasa dengan nama dalam bahasanya sendiri', () => {
    render(<LanguageSwitcher current="id" path="/mobil" />);
    for (const label of ['Indonesia', 'English', '中文', '한국어']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('menautkan ke halaman yang sama, bukan ke beranda', () => {
    render(<LanguageSwitcher current="id" path="/mobil/innova-zenix-g" />);
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
    expect(screen.getByRole('link', { name: 'Indonesia' })).toHaveAttribute('href', '/travel');
  });

  it('menandai bahasa yang sedang aktif', () => {
    render(<LanguageSwitcher current="zh" path="/" />);
    expect(screen.getByRole('link', { name: '中文' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: 'English' })).not.toHaveAttribute('aria-current');
  });

  it('memberi tiap tautan atribut hrefLang untuk mesin pencari', () => {
    render(<LanguageSwitcher current="id" path="/" />);
    expect(screen.getByRole('link', { name: '한국어' })).toHaveAttribute('hreflang', 'ko');
  });
});
