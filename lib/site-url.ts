import { headers } from 'next/headers';

// Alamat dasar situs untuk tautan dan QR di kwitansi. Otomatis mengikuti domain yang sedang
// dipakai (host permintaan), jadi tidak perlu diubah saat domain berganti dan tidak bergantung
// pada NEXT_PUBLIC_SITE_URL yang bisa tertinggal domain lama.
// Pengecualian: di deployment Preview Vercel dipakai domain produksi, karena URL preview
// biasanya dilindungi login Vercel dan tidak bisa dibuka pelanggan.
export function getBaseUrl(): string {
  const h = headers();
  const host = (h.get('x-forwarded-host') || h.get('host') || '').split(',')[0].trim();

  if (process.env.VERCEL_ENV === 'preview') {
    const prod = (process.env.VERCEL_PROJECT_PRODUCTION_URL || '').trim();
    if (prod) return `https://${prod}`;
  }

  if (host) {
    const local = /^(localhost|127\.0\.0\.1)(:|$)/.test(host);
    const proto = (h.get('x-forwarded-proto') || (local ? 'http' : 'https')).split(',')[0].trim();
    return `${proto}://${host}`;
  }

  // Tanpa host permintaan (jarang): pakai pengaturan manual.
  const envBase = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
  return envBase || 'http://localhost:3000';
}

export function invoicePublicUrl(publicToken: string): string {
  return `${getBaseUrl()}/invoice/${publicToken}`;
}
