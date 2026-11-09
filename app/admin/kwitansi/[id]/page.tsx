import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSettings } from '@/lib/settings';
import InvoicePrint from '@/components/InvoicePrint';
import PrintButton from '@/components/PrintButton';
import TemplateSwitcher from '@/components/TemplateSwitcher';
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

  const settings = await getSettings();
  // Link/QR di kwitansi cetak harus selalu domain resmi, bukan domain tempat admin kebetulan membuka halaman
  // (mis. URL preview Vercel). Pakai NEXT_PUBLIC_SITE_URL bila sudah diisi dengan domain sungguhan;
  // jika kosong / masih localhost, pakai host permintaan seperti sebelumnya.
  const envBase = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
  const envUsable = envBase !== '' && !/localhost|127\.0\.0\.1/.test(envBase);
  const h = headers();
  const host = h.get('host') || 'localhost:3000';
  const proto = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = envUsable ? envBase : `${proto}://${host}`;
  const publicUrl = `${baseUrl}/invoice/${invoice.public_token}`;

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
      />
    </>
  );
}