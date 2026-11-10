import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminUser, unauthorized, badRequest, serverError, readJson } from '@/lib/admin-auth';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!(await getAdminUser())) return unauthorized();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('customers')
    .select('*, customer_ids(*)')
    .eq('id', params.id)
    .maybeSingle();

  if (error) return serverError(error.message);
  return NextResponse.json({ data });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!(await getAdminUser())) return unauthorized();

  const body = await readJson(request);
  if (!body) return badRequest('Data tidak valid.');

  const name = String(body.name ?? '').trim().slice(0, 200);
  if (!name) return badRequest('Nama pelanggan wajib diisi.');

  const admin = createAdminClient();

  const { data: updated, error } = await admin
    .from('customers')
    .update({
      name,
      email: String(body.email ?? '').trim().slice(0, 200),
      phone: String(body.phone ?? '').trim().slice(0, 50),
      address: String(body.address ?? '').trim().slice(0, 500),
      notes: String(body.notes ?? '').trim().slice(0, 2000),
    })
    .eq('id', params.id)
    .select('id');

  if (error) return serverError(error.message);
  if (!updated || updated.length === 0) return NextResponse.json({ error: 'Pelanggan tidak ditemukan.' }, { status: 404 });

  // Ganti daftar ID: hapus lalu isi ulang. Kalau pengisian gagal, ID lama dipulihkan
  // (dulu gagal di tengah berarti semua ID pelanggan hilang).
  if (Array.isArray(body.ids)) {
    const idRows = body.ids
      .filter((i: any) => i && String(i.id_number ?? '').trim())
      .map((i: any, idx: number) => ({
        customer_id: params.id,
        id_type: i.id_type || 'lainnya',
        id_label: i.id_label || 'ID',
        id_number: String(i.id_number).trim().slice(0, 100),
        is_primary: idx === 0,
      }));

    const { data: oldRows } = await admin.from('customer_ids').select('*').eq('customer_id', params.id);

    const { error: delErr } = await admin.from('customer_ids').delete().eq('customer_id', params.id);
    if (delErr) return serverError(delErr.message);

    if (idRows.length > 0) {
      const { error: idErr } = await admin.from('customer_ids').insert(idRows);
      if (idErr) {
        if (oldRows && oldRows.length > 0) await admin.from('customer_ids').insert(oldRows);
        return serverError(idErr.message);
      }
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await getAdminUser())) return unauthorized();

  const admin = createAdminClient();
  // Soft delete: hanya diarsipkan, kwitansi lama tetap utuh.
  const { error } = await admin.from('customers').update({ is_archived: true }).eq('id', params.id);

  if (error) return serverError(error.message);
  return NextResponse.json({ ok: true });
}
