export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function slugUnik(dasar: string, terpakai: string[]): string {
  const awal = slugify(dasar) || `kendaraan-${Date.now()}`;
  if (!terpakai.includes(awal)) return awal;

  let n = 2;
  while (terpakai.includes(`${awal}-${n}`)) n += 1;
  return `${awal}-${n}`;
}
