import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminUser, unauthorized, badRequest, serverError, readJson } from '@/lib/admin-auth';
import { validateProduct, makeSlug } from '@/lib/product-input';

export async function POST(request: Request) {
  try {
    if (!(await getAdminUser())) return unauthorized();
    const body = await readJson(request);
    if (!body) return badRequest('Data tidak valid.');

    const parsed = validateProduct(body);
    if (!parsed.ok) return badRequest(parsed.error);

    const admin = createAdminClient();
    // Slug dibuat acak di belakang, dicoba ulang bila bentrok (kode 23505 = nilai kembar).
    for (let attempt = 0; attempt < 3; attempt++) {
      const slug = parsed.value.slug && attempt === 0 ? parsed.value.slug : makeSlug(parsed.value.name);
      const { data, error } = await admin
        .from('products')
        .insert({ ...parsed.value, slug })
        .select('id, slug')
        .single();
      if (!error) return NextResponse.json({ ok: true, product: data });
      if (error.code !== '23505') return serverError(error.message);
    }
    return serverError('Gagal membuat alamat (slug) unik. Coba lagi.');
  } catch (err: any) {
    return serverError(err.message || 'Gagal menyimpan');
  }
}
