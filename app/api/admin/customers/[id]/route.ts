import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminUser, unauthorized, badRequest, serverError, readJson } from '@/lib/admin-auth';
import { parseCustomer, buildIdRows } from '@/lib/customer-input';

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

  const admin = createAdminClient();

  // Pulihkan pelanggan yang diarsipkan.
  if (body.restore === true) {
    const { data: restored, error: restoreErr } = await admin
      .from('customers')
      .update({ is_archived: false })
      .eq('id', params.id)
      .select('id');
    if (restoreErr) return serverError(restoreErr.message);
    if (!restored || restored.length === 0) return NextResponse.json({ error: 'Pelanggan tidak ditemukan.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  const parsed = parseCustomer(body);
  if (!parsed.ok) return badRequest(parsed.error);

  const { data: updated, error } = await admin
    .from('customers')
    .update(parsed.value)
    .eq('id', params.id)
    .select('id');

  if (error) return serverError(error.message);
  if (!updated || updated.length === 0) return NextResponse.json({ error: 'Pelanggan tidak ditemukan.' }, { status: 404 });

  // Ganti daftar ID: hapus lalu isi ulang. Kalau pengisian gagal, ID lama dipulihkan
  // (dulu gagal di tengah berarti semua ID pelanggan hilang).
  if (Array.isArray(body.ids)) {
    const idRows = buildIdRows(body.ids, params.id);

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
