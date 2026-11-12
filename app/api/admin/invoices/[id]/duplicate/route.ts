import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateInvoiceNumber } from '@/lib/invoice-number';
import { todayWib } from '@/lib/utils';

const UNIQUE_VIOLATION = '23505';
const MAX_TRIES = 3;

// Salin kwitansi: header + item disalin menjadi DRAFT baru dengan nomor baru,
// tanggal hari ini, dan token publik baru. Status/lunas tidak ikut disalin.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const s = createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const { data: src, error: srcErr } = await admin.from('invoices').select('*').eq('id', params.id).maybeSingle();
    if (srcErr) return NextResponse.json({ error: srcErr.message }, { status: 500 });
    if (!src) return NextResponse.json({ error: 'Kwitansi tidak ditemukan' }, { status: 404 });

    const { data: items, error: itemsErr } = await admin
      .from('invoice_items')
      .select('product_id, description, qty, unit_price, subtotal, admin_fee, penalty')
      .eq('invoice_id', params.id)
      .order('created_at', { ascending: true });
    if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 });

    let created: { id: string } | null = null;
    for (let i = 0; i < MAX_TRIES; i++) {
      const { data, error } = await admin.from('invoices').insert({
        invoice_number: await generateInvoiceNumber(admin),
        customer_id: src.customer_id,
        customer_id_display: src.customer_id_display,
        customer_name: src.customer_name,
        customer_email: src.customer_email,
        customer_phone: src.customer_phone,
        customer_address: src.customer_address,
        invoice_date: todayWib(),
        due_date: null,
        subtotal: src.subtotal,
        discount: src.discount,
        tax: src.tax,
        total: src.total,
        status: 'draft',
        payment_method: src.payment_method,
        payment_type: src.payment_type,
        notes: src.notes,
      }).select('id').single();
      if (!error && data) { created = data; break; }
      if (error?.code === UNIQUE_VIOLATION) continue;
      return NextResponse.json({ error: error?.message || 'Gagal menyalin kwitansi' }, { status: 500 });
    }
    if (!created) return NextResponse.json({ error: 'Gagal membuat nomor kwitansi baru. Coba lagi.' }, { status: 409 });

    if ((items || []).length > 0) {
      const rows = (items || []).map((it: any) => ({ invoice_id: created!.id, ...it }));
      const { error: insErr } = await admin.from('invoice_items').insert(rows);
      if (insErr) {
        await admin.from('invoices').delete().eq('id', created.id);
        return NextResponse.json({ error: insErr.message }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: true, id: created.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal' }, { status: 500 });
  }
}
