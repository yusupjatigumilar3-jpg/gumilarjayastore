import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminUser, unauthorized, serverError } from '@/lib/admin-auth';
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
