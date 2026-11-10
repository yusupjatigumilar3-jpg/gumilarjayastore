import Link from 'next/link';
import CustomerForm from '@/components/CustomerForm';
import { PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Tambah Pelanggan' };

export default function NewCustomerPage() {
  return (
    <>
      <PageHeader
        title="Tambah Pelanggan"
        actions={<Link href="/admin/pelanggan-customers" className="btn btn-ghost">← Kembali</Link>}
      />
      <CustomerForm />
    </>
  );
}
