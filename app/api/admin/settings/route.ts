import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminUser, unauthorized, badRequest, serverError, readJson } from '@/lib/admin-auth';

export async function GET() {
  if (!(await getAdminUser())) return unauthorized();

  const admin = createAdminClient();
  const { data, error } = await admin.from('settings').select('*');
  if (error) return serverError(error.message);
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  if (!(await getAdminUser())) return unauthorized();

  const body = await readJson(request);
  if (!body || Object.keys(body).length === 0) return badRequest('Body kosong');

  // Kunci pengaturan hanya huruf kecil, angka, dan garis bawah; nilai dibatasi panjangnya.
  const rows: { key: string; value: string }[] = [];
  for (const [key, value] of Object.entries(body)) {
    if (!/^[a-z0-9_]{1,64}$/.test(key)) return badRequest(`Nama pengaturan tidak valid: ${key}`);
    rows.push({ key, value: String(value ?? '').slice(0, 5000) });
  }

  const admin = createAdminClient();
  const { error } = await admin.from('settings').upsert(rows, { onConflict: 'key' });

  if (error) {
    console.error('Settings save error:', error);
    return serverError(error.message);
  }

  // Buang cache pengaturan agar perubahan langsung tampil di situs dan panel admin.
  revalidateTag('settings');

  return NextResponse.json({ ok: true, saved: rows.length });
}
