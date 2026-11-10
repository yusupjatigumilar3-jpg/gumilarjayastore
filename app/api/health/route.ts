import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Diagnosis koneksi Supabase. Tidak pernah menampilkan isi kunci, hanya ada/tidaknya dan hasil tes.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  let host = '';
  try { host = new URL(url).host; } catch { host = url ? '(URL tidak valid)' : ''; }

  const out: Record<string, unknown> = {
    env: {
      url: host || 'KOSONG',
      anon_key: anon ? `ada (${anon.slice(0, 6)}…, ${anon.length} karakter)` : 'KOSONG',
      service_role_key: service ? `ada (${service.slice(0, 6)}…, ${service.length} karakter)` : 'KOSONG',
    },
  };

  if (url && anon) {
    const r = await createClient(url, anon).from('settings').select('key, value').eq('key', 'site_name').maybeSingle();
    out.anon_baca_settings = r.error
      ? { ok: false, error: r.error.message, code: r.error.code }
      : { ok: true, site_name: r.data?.value ?? '(baris site_name tidak ada)' };
  }
  if (url && service) {
    const r = await createClient(url, service).from('settings').select('key', { count: 'exact', head: true });
    out.service_role_baca_settings = r.error
      ? { ok: false, error: r.error.message, code: r.error.code }
      : { ok: true, jumlah_baris: r.count };
  }
  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
}
