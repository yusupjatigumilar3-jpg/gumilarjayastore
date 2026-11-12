import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminUser, unauthorized, badRequest, serverError, readJson } from '@/lib/admin-auth';
import { validateCategory } from '@/lib/category-input';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await getAdminUser())) return unauthorized();
    const body = await readJson(request);
    if (!body) return badRequest('Data tidak valid.');
    const parsed = validateCategory(body);
    if (!parsed.ok) return badRequest(parsed.error);

    // Slug tidak berubah agar tautan toko yang sudah dibagikan tetap jalan.
    const { data, error } = await createAdminClient()
      .from('categories').update(parsed.value).eq('id', params.id).select('id');
    if (error) return serverError(error.message);
    if (!data || data.length === 0) return NextResponse.json({ error: 'Kategori tidak ditemukan.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return serverError(err.message || 'Gagal');
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await getAdminUser())) return unauthorized();
    // Produk di kategori ini tidak ikut terhapus; kolom category_id-nya menjadi kosong.
    const { error } = await createAdminClient().from('categories').delete().eq('id', params.id);
    if (error) return serverError(error.message);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return serverError(err.message || 'Gagal');
  }
}
