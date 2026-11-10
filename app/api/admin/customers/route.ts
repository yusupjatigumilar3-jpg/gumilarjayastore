import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminUser, unauthorized, badRequest, serverError, readJson } from '@/lib/admin-auth';
import { parseCustomer, buildIdRows } from '@/lib/customer-input';
import { safeSearch } from '@/lib/list-helpers';

// Dipakai pemilih pelanggan di form kwitansi (pencarian cepat, maksimal 50 hasil).
export async function GET(request: Request) {
  try {
    if (!(await getAdminUser())) return unauthorized();

    const q = safeSearch(new URL(request.url).searchParams.get('q'));

    const admin = createAdminClient();
    let query = admin
      .from('customers')
      .select('*, customer_ids(*)')
      .eq('is_archived', false)
      .order('name', { ascending: true })
      .limit(50);

    if (q) query = query.or(`name.ilike.%${q}%,customer_code.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);

    const { data, error } = await query;
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

    const parsed = parseCustomer(body);
    if (!parsed.ok) return badRequest(parsed.error);

    const admin = createAdminClient();

    // Kode pelanggan (CUS-00001, ...) dibuat di database. Dicoba ulang bila bentrok (23505).
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: code } = await admin.rpc('next_customer_code');
      const customer_code =
        typeof code === 'string' && code ? code : `CUS-${Date.now().toString().slice(-8)}${attempt}`;

      const { data: created, error } = await admin
        .from('customers')
        .insert({ ...parsed.value, customer_code, is_archived: false })
        .select('id, customer_code')
        .single();

      if (error) {
        if (error.code === '23505') continue;
        return serverError(error.message);
      }

      const idRows = buildIdRows(body.ids, created.id);
      if (idRows.length > 0) {
        const { error: idErr } = await admin.from('customer_ids').insert(idRows);
        if (idErr) {
          // Batalkan pelanggan yang baru dibuat supaya tidak tersisa data setengah jadi.
          await admin.from('customers').delete().eq('id', created.id);
          return serverError(idErr.message);
        }
      }

      return NextResponse.json({ ok: true, id: created.id, customer_code: created.customer_code });
    }

    return serverError('Gagal membuat kode pelanggan unik. Coba lagi.');
  } catch (err: any) {
    return serverError(err.message || 'Gagal menyimpan');
  }
}
