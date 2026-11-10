import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminUser, unauthorized, badRequest, serverError, readJson } from '@/lib/admin-auth';

export async function GET() {
  if (!(await getAdminUser())) return unauthorized();
  const admin = createAdminClient();
  const { data, error } = await admin.from('testimonials').select('*').order('sort_order');
  if (error) return serverError(error.message);
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  if (!(await getAdminUser())) return unauthorized();
  const b = await readJson(request);
  if (!b) return badRequest('Data tidak valid.');

  const name = String(b.name ?? '').trim().slice(0, 120);
  const content = String(b.content ?? '').trim().slice(0, 2000);
  if (!name || !content) return badRequest('Nama dan isi testimoni wajib diisi.');

  const sort = Math.round(Number(b.sort_order));
  const admin = createAdminClient();
  const { error } = await admin.from('testimonials').insert({
    name,
    city: String(b.city ?? '').trim().slice(0, 120),
    product_type: String(b.product_type ?? '').trim().slice(0, 120),
    content,
    sort_order: Number.isFinite(sort) ? sort : 0,
  });
  if (error) return serverError(error.message);
  return NextResponse.json({ ok: true });
}
