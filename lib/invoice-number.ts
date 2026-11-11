import type { createAdminClient } from '@/lib/supabase/admin';

type AdminClient = ReturnType<typeof createAdminClient>;

/** Tahun & bulan menurut WIB (server biasanya berjalan di UTC, jadi tanggal 1 pukul 00–07 WIB bisa salah bulan). */
export function jakartaYearMonth(d: Date = new Date()): { year: string; month: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(d);
  return {
    year: parts.find((p) => p.type === 'year')?.value || String(d.getFullYear()),
    month: parts.find((p) => p.type === 'month')?.value || String(d.getMonth() + 1).padStart(2, '0'),
  };
}

/** Awalan nomor bukti pembayaran. Harus sama dengan fungsi SQL next_invoice_number (supabase/schema.sql). */
export const INVOICE_PREFIX = 'INV';

/**
 * Satu-satunya pembuat nomor kwitansi otomatis (form baru, endpoint next-number).
 * Memakai fungsi SQL next_invoice_number (sama seperti import) agar penomoran
 * tidak bentrok; bila tidak ada, hitung manual dari nomor tertinggi bulan ini.
 */
export async function generateInvoiceNumber(admin: AdminClient): Promise<string> {
  const { data, error } = await admin.rpc('next_invoice_number');
  if (!error && typeof data === 'string' && data.trim()) return data.trim();

  const { year, month } = jakartaYearMonth();
  const prefix = `${INVOICE_PREFIX}/${year}/${month}/`;
  const { data: rows } = await admin
    .from('invoices')
    .select('invoice_number')
    .like('invoice_number', `%/${year}/${month}/%`)
    .order('invoice_number', { ascending: false })
    .limit(200);

  // Ambil angka tertinggi dari awalan apa pun (nomor lama "GJS/..." ikut dihitung);
  // nomor manual non-numerik (mis. ".../ABC") diabaikan, bukan menghasilkan "NaN".
  const re = new RegExp(`^[A-Za-z]+/${year}/${month}/(\\d+)$`);
  let max = 0;
  for (const r of rows || []) {
    const m = re.exec(String(r.invoice_number || ''));
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return prefix + String(max + 1).padStart(4, '0');
}
