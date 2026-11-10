import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminUser, unauthorized, badRequest, serverError, readJson } from '@/lib/admin-auth';

export async function GET() {
  if (!(await getAdminUser())) return unauthorized();
  const admin = createAdminClient();
  const { data, error } = await admin.from('faqs').select('*').order('sort_order');
  if (error) return serverError(error.message);
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  if (!(await getAdminUser())) return unauthorized();
  const b = await readJson(request);
  if (!b) return badRequest('Data tidak valid.');

  const question = String(b.question ?? '').trim().slice(0, 300);
  const answer = String(b.answer ?? '').trim().slice(0, 5000);
  if (!question || !answer) return badRequest('Pertanyaan dan jawaban wajib diisi.');

  const sort = Math.round(Number(b.sort_order));
  const admin = createAdminClient();
  const { error } = await admin.from('faqs').insert({
    question,
    answer,
    sort_order: Number.isFinite(sort) ? sort : 0,
  });
  if (error) return serverError(error.message);
  return NextResponse.json({ ok: true });
}
