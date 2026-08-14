import { describe, expect, it } from 'vitest';
import { berbentukUuid } from '@/lib/uuid';

describe('berbentukUuid', () => {
  it('menerima UUID sungguhan dari basis data', () => {
    expect(berbentukUuid('3f2504e0-4f89-41d3-9a0c-0305e82c3301')).toBe(true);
    expect(berbentukUuid('3F2504E0-4F89-41D3-9A0C-0305E82C3301')).toBe(true);
  });

  it('menolak segmen alamat yang bukan id — inilah yang dulu memicu 500', () => {
    for (const salah of ['baru', 'manual', 'tidak-ada', '', '123', 'undefined']) {
      expect(berbentukUuid(salah)).toBe(false);
    }
  });

  it('menolak UUID yang panjangnya nyaris benar', () => {
    expect(berbentukUuid('3f2504e0-4f89-41d3-9a0c-0305e82c330')).toBe(false);
    expect(berbentukUuid('3f2504e0-4f89-41d3-9a0c-0305e82c33011')).toBe(false);
    expect(berbentukUuid('3f2504e0-4f89-41d3-9a0c-0305e82c330g')).toBe(false);
  });
});
