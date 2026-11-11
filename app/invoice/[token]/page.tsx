import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSettings } from '@/lib/settings';
import InvoicePrint from '@/components/InvoicePrint';
import PrintButton from '@/components/PrintButton';
import { invoicePublicUrl } from '@/lib/site-url';
import { loadInvoiceCustomer } from '@/lib/invoice-view';
import type { Invoice, InvoiceItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function InvoicePublicPage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = createAdminClient();

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('public_token', params.token)
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

  return (
    <>
      <style>{`
        body{background:#eef2f8;padding:40px 20px}
        .toolbar-print{max-width:820px;margin:0 auto 20px;display:flex;justify-content:space-between;gap:10px}
        @media print{
          body{background:#fff;padding:0}
          .toolbar-print,.no-print{display:none!important}
          .invoice-print{box-shadow:none;border-radius:0}
        }
      `}</style>

      <div className="toolbar-print no-print">
        <a href="/cek-kwitansi" className="btn btn-ghost">← Cek Kwitansi Lain</a>
        <PrintButton />
      </div>

      <InvoicePrint
        invoice={invoice as Invoice}
        items={(items || []) as InvoiceItem[]}
        settings={settings}
        publicUrl={invoicePublicUrl(invoice.public_token)}
        customer={customer}
      />
    </>
  );
}