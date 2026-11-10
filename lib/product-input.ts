// Validasi input produk (dipakai POST dan PATCH) supaya aturannya satu dan sama.
import { slugify } from '@/lib/utils';

const TYPES = ['digital', 'fisik'];

export type ProductInput = {
  name: string;
  category_id: string | null;
  type: string;
  price: number;
  discount_price: number | null;
  description: string;
  image: string | null;
  stock: number;
  download_url: string | null;
  is_featured: boolean;
  is_new: boolean;
  service_type: string | null;
  requires_manual_price: boolean;
  default_admin_fee: number;
  slug?: string;
};

function int(v: unknown): number {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? n : 0;
}

function text(v: unknown, max: number): string {
  return String(v ?? '').trim().slice(0, max);
}

export function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7);
}

export function makeSlug(name: string): string {
  const base = slugify(name).slice(0, 60).replace(/^-+|-+$/g, '');
  return `${base || 'produk'}-${randomSuffix()}`;
}

export function validateProduct(body: Record<string, any>): { ok: true; value: ProductInput } | { ok: false; error: string } {
  const name = text(body.name, 200);
  if (!name) return { ok: false, error: 'Nama produk wajib diisi.' };

  const type = TYPES.includes(body.type) ? body.type : 'digital';
  const price = int(body.price);
  if (price < 0) return { ok: false, error: 'Harga tidak boleh negatif.' };

  let discount: number | null = null;
  if (body.discount_price !== undefined && body.discount_price !== null && body.discount_price !== '') {
    discount = int(body.discount_price);
    if (discount < 0) return { ok: false, error: 'Harga diskon tidak boleh negatif.' };
    if (discount === 0) discount = null;
    else if (discount >= price) return { ok: false, error: 'Harga diskon harus lebih kecil dari harga normal.' };
  }

  const stock = int(body.stock);
  if (stock < 0) return { ok: false, error: 'Stok tidak boleh negatif.' };

  const adminFee = int(body.default_admin_fee);
  if (adminFee < 0) return { ok: false, error: 'Biaya admin tidak boleh negatif.' };

  const url = text(body.download_url, 2000);
  if (url && !/^https?:\/\//i.test(url)) return { ok: false, error: 'Link unduhan harus diawali http:// atau https://' };

  const value: ProductInput = {
    name,
    category_id: body.category_id ? String(body.category_id) : null,
    type,
    price,
    discount_price: discount,
    description: String(body.description ?? '').slice(0, 20000),
    image: text(body.image, 2000) || null,
    stock,
    download_url: url || null,
    is_featured: !!body.is_featured,
    is_new: !!body.is_new,
    service_type: text(body.service_type, 40) || null,
    requires_manual_price: !!body.requires_manual_price,
    default_admin_fee: adminFee,
  };
  const slug = text(body.slug, 120);
  if (slug) value.slug = slugify(slug) || undefined;
  return { ok: true, value };
}
