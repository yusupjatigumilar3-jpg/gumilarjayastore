import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminUser, unauthorized, badRequest, serverError, readJson } from '@/lib/admin-auth';
import { validateSettings } from '@/lib/settings-schema';

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
  if (!body || Object.keys(body).length === 0) return badRequest('Tidak ada perubahan untuk disimpan.');

  // Aturan yang sama dengan form di browser (lib/settings-schema.ts), diperiksa ulang di server.
  const { values, errors } = validateSettings(body);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: 'Ada isian yang perlu diperbaiki.', fields: errors }, { status: 400 });
  }

  const rows = Object.entries(values).map(([key, value]) => ({ key, value }));
  const admin = createAdminClient();
  const { error } = await admin.from('settings').upsert(rows, { onConflict: 'key' });

  if (error) {
    console.error('Settings save error:', error);
    return serverError(error.message);
  }

  // Buang cache pengaturan agar perubahan langsung tampil di situs dan panel admin.
  revalidateTag('settings');

  // `values` dikirim balik karena sebagian dirapikan server (mis. nomor WA, tautan Instagram).
  return NextResponse.json({ ok: true, saved: rows.length, values });
}
