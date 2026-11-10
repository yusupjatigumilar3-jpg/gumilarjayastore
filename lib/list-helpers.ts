// Pembantu untuk halaman daftar admin: halaman, pencarian aman, dan link.

export const PAGE_SIZE = 25;

export function parsePage(value: string | undefined): number {
  const n = parseInt(value || '1', 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 100000) : 1;
}

export function pageRange(page: number, size = PAGE_SIZE): [number, number] {
  const from = (page - 1) * size;
  return [from, from + size - 1];
}

export function totalPagesOf(count: number | null, size = PAGE_SIZE): number {
  return Math.max(1, Math.ceil((count ?? 0) / size));
}

// Buang karakter yang punya arti khusus di filter PostgREST (.or / ilike) supaya
// pencarian tidak error dan tidak bisa menyisipkan filter lain.
export function safeSearch(q: string | undefined | null, max = 80): string {
  return String(q ?? '')
    .replace(/[%,()*\\"_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function listHref(base: string, params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '' || v === null) continue;
    if (k === 'page' && Number(v) <= 1) continue;
    sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}
