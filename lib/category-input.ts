// Validasi input kategori (dipakai POST dan PATCH).
import { slugify } from '@/lib/utils';

export type CategoryInput = {
  name: string;
  description: string;
  icon: string;
  sort_order: number;
};

export function validateCategory(body: Record<string, any>): { ok: true; value: CategoryInput } | { ok: false; error: string } {
  const name = String(body.name ?? '').trim().slice(0, 100);
  if (!name) return { ok: false, error: 'Nama kategori wajib diisi.' };
  const order = Math.round(Number(body.sort_order));
  return {
    ok: true,
    value: {
      name,
      description: String(body.description ?? '').trim().slice(0, 300),
      icon: String(body.icon ?? '').trim().slice(0, 8),
      sort_order: Number.isFinite(order) ? order : 0,
    },
  };
}

export function categorySlug(name: string, attempt = 0): string {
  const base = slugify(name).slice(0, 60).replace(/^-+|-+$/g, '') || 'kategori';
  return attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
}
