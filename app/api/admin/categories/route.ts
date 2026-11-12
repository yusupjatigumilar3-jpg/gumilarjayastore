import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminUser, unauthorized, badRequest, serverError, readJson } from '@/lib/admin-auth';
import { validateCategory, categorySlug } from '@/lib/category-input';

export async function GET() {
  try {
    if (!(await getAdminUser())) return unauthorized();
    const { data, error } = await createAdminClient().from('categories').select('*').order('sort_order');
    if (error) return serverError(error.message);
    return NextResponse.json({ data });
  } catch (err: any) {
    return serverError(err.message || 'Gagal');
  }
}

export async function POST(request: Request) {
  try {
    if (!(await getAdminUser())) return unauthorized();
    const body = await readJson(request);
    if (!body) return badRequest('Data tidak valid.');
    const parsed = validateCategory(body);
    if (!parsed.ok) return badRequest(parsed.error);

    const admin = createAdminClient();
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await admin
        .from('categories')
        .insert({ ...parsed.value, slug: categorySlug(parsed.value.name, attempt) })
        .select('*')
        .single();
      if (!error) return NextResponse.json({ ok: true, category: data });
      if (error.code !== '23505') return serverError(error.message);
    }
    return serverError('Gagal membuat slug unik. Coba lagi.');
  } catch (err: any) {
    return serverError(err.message || 'Gagal');
  }
}
