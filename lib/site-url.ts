import { headers } from 'next/headers';

// Alamat dasar situs untuk tautan dan QR di kwitansi cetak. Selalu domain resmi, bukan domain
// tempat halaman kebetulan dibuka (mis. URL preview Vercel). Pakai NEXT_PUBLIC_SITE_URL bila diisi
// domain sungguhan; jika kosong atau masih localhost, pakai host permintaan.
export function getBaseUrl(): string {
  const envBase = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
  if (envBase !== '' && !/localhost|127\.0\.0\.1/.test(envBase)) return envBase;

  const host = headers().get('host') || 'localhost:3000';
  const proto = host.includes('localhost') ? 'http' : 'https';
  return `${proto}://${host}`;
}

export function invoicePublicUrl(publicToken: string): string {
  return `${getBaseUrl()}/invoice/${publicToken}`;
}
