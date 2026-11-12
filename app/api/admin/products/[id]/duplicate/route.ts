import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminUser, unauthorized, serverError } from '@/lib/admin-auth';
import { makeSlug } from '@/lib/product-input';

// Salin produk (tanpa id/slug/tanggal lama) dengan nama "… (Salin)".
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await getAdminUser())) return unauthorized();
    const admin = createAdminClient();
    const { data: src, error: srcErr } = await admin.from('products').select('*').eq('id', params.id).maybeSingle();
    if (srcErr) return serverError(srcErr.message);
    if (!src) return NextResponse.json({ error: 'Produk tidak ditemukan.' }, { status: 404 });

    const { id: _id, slug: _slug, created_at: _c, updated_at: _u, ...rest } = src as Record<string, any>;
    const name = `${String(src.name).slice(0, 190)} (Salin)`;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await admin
        .from('products')
        .insert({ ...rest, name, slug: makeSlug(src.name) })
        .select('id')
        .single();
      if (!error) return NextResponse.json({ ok: true, id: data.id });
      if (error.code !== '23505') return serverError(error.message);
    }
    return serverError('Gagal membuat alamat (slug) unik. Coba lagi.');
  } catch (err: any) {
    return serverError(err.message || 'Gagal');
  }
}
