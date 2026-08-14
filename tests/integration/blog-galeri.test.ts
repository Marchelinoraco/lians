import { describe, it, expect, afterAll, vi } from 'vitest';
import { eq } from 'drizzle-orm';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { db } = await import('@/db');
const { posts, galleryItems } = await import('@/db/schema');
const { createPost, updatePost, deletePost } = await import('@/actions/admin-posts');
const { createGalleryItem, deleteGalleryItem } = await import('@/actions/admin-gallery');
const { getPublishedPosts, getPublishedPostBySlug, getAllPosts } = await import('@/queries/posts');
const { getPublishedGallery } = await import('@/queries/gallery');

const jalankan = process.env.DATABASE_URL ? describe : describe.skip;
const artikelDibuat: string[] = [];
const fotoDibuat: string[] = [];
const bersesi = () => authMock.mockResolvedValue({ user: { id: 'uji', email: 'uji@lians.id' } });

const slugUji = () => `uji-${Math.random().toString(36).slice(2, 9)}`;

const artikelDasar = (over: Record<string, unknown> = {}) => ({
  slug: slugUji(),
  title: { id: 'Judul Uji' },
  excerpt: { id: 'Ringkasan uji' },
  body: { id: ['Paragraf pertama.'] },
  coverImage: [],
  publishedAt: '2026-08-01',
  isPublished: true,
  ...over,
});

const fotoDasar = (over: Record<string, unknown> = {}) => ({
  image: [{ url: 'https://res.cloudinary.com/demo/image/upload/a.jpg', publicId: 'a', alt: 'Uji' }],
  caption: { id: 'Keterangan uji' },
  isPublished: true,
  sortOrder: 0,
  ...over,
});

jalankan('blog dan galeri', () => {
  it('menolak membuat artikel tanpa sesi', async () => {
    authMock.mockResolvedValue(null);
    expect(await createPost(artikelDasar())).toMatchObject({ ok: false });
  });

  it('menolak menambah foto galeri tanpa sesi', async () => {
    authMock.mockResolvedValue(null);
    expect(await createGalleryItem(fotoDasar())).toMatchObject({ ok: false });
  });

  it('menyimpan artikel dan menampilkannya di kueri publik', async () => {
    bersesi();
    const data = artikelDasar();
    const hasil = await createPost(data);
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    artikelDibuat.push(hasil.data.id);

    const terbit = await getPublishedPosts();
    expect(terbit.some((p) => p.id === hasil.data.id)).toBe(true);
    expect((await getPublishedPostBySlug(data.slug))?.id).toBe(hasil.data.id);
  });

  // Tanpa penyaring isPublished di kueri, siapa pun yang menebak slug dapat
  // membaca draf yang belum siap terbit.
  it('menyembunyikan artikel yang belum terbit dari kueri publik', async () => {
    bersesi();
    const data = artikelDasar({ isPublished: false });
    const hasil = await createPost(data);
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    artikelDibuat.push(hasil.data.id);

    expect((await getPublishedPosts()).some((p) => p.id === hasil.data.id)).toBe(false);
    expect(await getPublishedPostBySlug(data.slug)).toBeNull();

    // Tetapi admin harus tetap melihatnya untuk dilanjutkan.
    expect((await getAllPosts()).some((p) => p.id === hasil.data.id)).toBe(true);
  });

  it('menolak slug yang sudah dipakai artikel lain', async () => {
    bersesi();
    const data = artikelDasar();
    const a = await createPost(data);
    expect(a.ok).toBe(true);
    if (a.ok) artikelDibuat.push(a.data.id);

    const b = await createPost(artikelDasar({ slug: data.slug }));
    expect(b.ok).toBe(false);
    if (b.ok) return;
    expect(b.message).toMatch(/sudah dipakai/i);
  });

  it('menolak slug berhuruf besar atau berspasi', async () => {
    bersesi();
    expect(await createPost(artikelDasar({ slug: 'Judul Artikel' }))).toMatchObject({ ok: false });
    expect(await createPost(artikelDasar({ slug: 'HURUF-BESAR' }))).toMatchObject({ ok: false });
  });

  it('menolak artikel tanpa isi bahasa Indonesia', async () => {
    bersesi();
    expect(await createPost(artikelDasar({ body: { id: [] } }))).toMatchObject({ ok: false });
    expect(await createPost(artikelDasar({ body: { id: ['   '] } }))).toMatchObject({ ok: false });
  });

  it('mengurutkan artikel dari yang terbaru', async () => {
    bersesi();
    const lama = await createPost(artikelDasar({ publishedAt: '2020-01-01' }));
    const baru = await createPost(artikelDasar({ publishedAt: '2099-01-01' }));
    expect(lama.ok && baru.ok).toBe(true);
    if (!lama.ok || !baru.ok) return;
    artikelDibuat.push(lama.data.id, baru.data.id);

    const daftar = await getPublishedPosts();
    const iBaru = daftar.findIndex((p) => p.id === baru.data.id);
    const iLama = daftar.findIndex((p) => p.id === lama.data.id);
    expect(iBaru).toBeLessThan(iLama);
  });

  it('mengubah dan menghapus artikel', async () => {
    bersesi();
    const hasil = await createPost(artikelDasar());
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;

    const slugBaru = slugUji();
    expect(await updatePost(hasil.data.id, artikelDasar({ slug: slugBaru }))).toMatchObject({
      ok: true,
    });

    const [row] = await db.select().from(posts).where(eq(posts.id, hasil.data.id));
    expect(row.slug).toBe(slugBaru);

    expect(await deletePost(hasil.data.id)).toMatchObject({ ok: true });
  });

  it('menyimpan foto galeri dan menghormati urutannya', async () => {
    bersesi();
    const kedua = await createGalleryItem(fotoDasar({ sortOrder: 20 }));
    const pertama = await createGalleryItem(fotoDasar({ sortOrder: 10 }));
    expect(kedua.ok && pertama.ok).toBe(true);
    if (!kedua.ok || !pertama.ok) return;
    fotoDibuat.push(kedua.data.id, pertama.data.id);

    const daftar = await getPublishedGallery();
    const iPertama = daftar.findIndex((g) => g.id === pertama.data.id);
    const iKedua = daftar.findIndex((g) => g.id === kedua.data.id);
    expect(iPertama).toBeLessThan(iKedua);
  });

  it('menolak foto galeri tanpa gambar', async () => {
    bersesi();
    expect(await createGalleryItem(fotoDasar({ image: [] }))).toMatchObject({ ok: false });
  });

  it('menyembunyikan foto yang tidak diterbitkan', async () => {
    bersesi();
    const hasil = await createGalleryItem(fotoDasar({ isPublished: false }));
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    fotoDibuat.push(hasil.data.id);

    expect((await getPublishedGallery()).some((g) => g.id === hasil.data.id)).toBe(false);
  });

  it('menghapus foto galeri', async () => {
    bersesi();
    const hasil = await createGalleryItem(fotoDasar());
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;

    expect(await deleteGalleryItem(hasil.data.id)).toMatchObject({ ok: true });
  });
});

afterAll(async () => {
  for (const id of artikelDibuat) await db.delete(posts).where(eq(posts.id, id));
  for (const id of fotoDibuat) await db.delete(galleryItems).where(eq(galleryItems.id, id));
});
