import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import InvoiceForm from '@/components/InvoiceForm';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Buat Kwitansi' };

export default async function NewInvoicePage() {
  const supabase = createAdminClient();
  const [{ data: products }, settings] = await Promise.all([
    supabase.from('products').select('id, name, price').order('name'),
    getSettings(),
  ]);
  const fee = parseInt(settings.listrik_default_admin_fee || '', 10);
  const defaultAdminFee = Number.isFinite(fee) && fee >= 0 ? fee : 2500;

  return (
    <>
      <div className="admin-card-head">
        <h1>Buat Kwitansi Baru</h1>
        <Link href="/admin/kwitansi" className="btn btn-ghost">← Kembali</Link>
      </div>
      <InvoiceForm initial={null} initialItems={[]} products={products || []} defaultAdminFee={defaultAdminFee} />
    </>
  );
}