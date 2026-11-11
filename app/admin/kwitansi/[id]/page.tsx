import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSettings } from '@/lib/settings';
import InvoicePrint from '@/components/InvoicePrint';
import PrintButton from '@/components/PrintButton';
import TemplateSwitcher from '@/components/TemplateSwitcher';
import { invoicePublicUrl } from '@/lib/site-url';
import { loadInvoiceCustomer } from '@/lib/invoice-view';
import type { Invoice, InvoiceItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminInvoiceDetail({
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

  const { data: items } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoice.id)
    .order('created_at');

  const [settings, customer] = await Promise.all([
    getSettings(),
    loadInvoiceCustomer(supabase, invoice.customer_id),
  ]);
  // QR dan tautan di kwitansi cetak selalu memakai domain resmi (lihat lib/site-url.ts).
  const publicUrl = invoicePublicUrl(invoice.public_token);

  return (
    <>
      <div className="admin-card-head no-print">
        <h1>Kwitansi {invoice.invoice_number}</h1>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/admin/kwitansi" className="btn btn-ghost">← Kembali</Link>
          <PrintButton />
        </div>
      </div>

      <TemplateSwitcher current={settings.invoice_template || 'v3'} />

      <InvoicePrint
        invoice={invoice as Invoice}
        items={(items || []) as InvoiceItem[]}
        settings={settings}
        publicUrl={publicUrl}
        customer={customer}
      />
    </>
  );
}