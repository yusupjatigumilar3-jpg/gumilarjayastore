import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminUser, unauthorized, badRequest, serverError, readJson } from '@/lib/admin-auth';
import { validateProduct } from '@/lib/product-input';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await getAdminUser())) return unauthorized();
    const body = await readJson(request);
    if (!body) return badRequest('Data tidak valid.');

    const parsed = validateProduct(body);
    if (!parsed.ok) return badRequest(parsed.error);

    // Slug tidak diubah saat edit supaya tautan produk yang sudah dibagikan tetap jalan.
    const { slug: _slug, ...fields } = parsed.value;
    const admin = createAdminClient();
    const { data, error } = await admin.from('products').update(fields).eq('id', params.id).select('id');
    if (error) return serverError(error.message);
    if (!data || data.length === 0) return NextResponse.json({ error: 'Produk tidak ditemukan.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return serverError(err.message || 'Gagal');
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await getAdminUser())) return unauthorized();
    const admin = createAdminClient();
    const { error } = await admin.from('products').delete().eq('id', params.id);
    if (error) return serverError(error.message);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return serverError(err.message || 'Gagal');
  }
}
