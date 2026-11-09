import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import InvoiceForm from '@/components/InvoiceForm';
import type { Customer, Invoice, InvoiceItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function EditInvoicePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createAdminClient();
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();
  if (!invoice) notFound();

  const [{ data: items }, { data: products }, customerRes] = await Promise.all([
    supabase.from('invoice_items').select('*').eq('invoice_id', invoice.id).order('created_at'),
    supabase.from('products').select('id, name, price').order('name'),
    // Muat pelanggan yang tertaut agar form edit menampilkan & mempertahankan relasinya
    // (sebelumnya form edit selalu tampil tanpa pelanggan dan kolom datanya tersembunyi).
    invoice.customer_id
      ? supabase.from('customers').select('*, customer_ids(*)').eq('id', invoice.customer_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <>
      <div className="admin-card-head">
        <h1>Edit Kwitansi {invoice.invoice_number}</h1>
        <Link href={`/admin/kwitansi/${invoice.id}`} className="btn btn-ghost">← Kembali</Link>
      </div>
      <InvoiceForm
        initial={invoice as Invoice}
        initialItems={(items || []) as InvoiceItem[]}
        products={products || []}
        initialCustomer={(customerRes.data as Customer | null) || null}
      />
    </>
  );
}
