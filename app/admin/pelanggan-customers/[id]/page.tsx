import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import CustomerForm from '@/components/CustomerForm';
import DeleteButton from '@/components/DeleteButton';
import { formatRupiah, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/admin/ui';
import type { Customer, Invoice } from '@/lib/types';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createAdminClient();

  const { data: customer } = await supabase
    .from('customers')
    .select('*, customer_ids(*)')
    .eq('id', params.id)
    .maybeSingle();

  if (!customer) notFound();

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, invoice_date, total, status, category')
    .eq('customer_id', params.id)
    .order('created_at', { ascending: false })
    .limit(20);

  // Data relasi datang sebagai `customer_ids`, sedangkan form membaca `ids`.
  // Dulu tidak dipetakan: form tampil tanpa ID, dan menyimpan akan MENGHAPUS semua ID pelanggan.
  const c = { ...customer, ids: (customer as any).customer_ids || [] } as Customer;
  const list = (invoices || []) as any[];

  const totalSpent = list.reduce((s, i) => s + (i.total || 0), 0);

  return (
    <>
      <div className="admin-card-head">
        <div>
          <div style={{ fontSize: '.72rem', color: '#64748b', letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
            Pelanggan · {c.customer_code}
          </div>
          <h1 style={{ margin: 0 }}>{c.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/admin/pelanggan-customers" className="btn btn-ghost">← Kembali</Link>
          {c.is_archived ? (
            <DeleteButton
              url={`/api/admin/customers/${c.id}`}
              method="PATCH"
              body={{ restore: true }}
              label="Pulihkan"
              variant="primary"
              confirmMessage=""
            />
          ) : (
            <DeleteButton
              url={`/api/admin/customers/${c.id}`}
              label="Arsipkan"
              confirmMessage={`Arsipkan pelanggan "${c.name}"? Kwitansi lamanya tetap tersimpan, dan pelanggan bisa dipulihkan dari daftar arsip.`}
              redirectTo="/admin/pelanggan-customers"
            />
          )}
        </div>
      </div>

      {c.is_archived && (
        <p className="a-alert" style={{ background: '#fef3c7', color: '#92400e' }}>
          Pelanggan ini diarsipkan, jadi tidak muncul di daftar aktif dan pemilih pelanggan di form kwitansi.
        </p>
      )}

      <div className="admin-grid-2" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start', marginBottom: 20 }}>
        <div style={{
          padding: 24,
          background: '#fff',
          border: '1px solid var(--line)',
          borderRadius: 14,
        }}>
          <div style={{ fontSize: '.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '.14em', fontWeight: 700, marginBottom: 8 }}>
            Total Belanja
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563eb', letterSpacing: '-.02em' }}>
            {formatRupiah(totalSpent)}
          </div>
          <div style={{ fontSize: '.82rem', color: '#64748b', marginTop: 4 }}>
            Dari {list.length} kwitansi
          </div>
        </div>

        <div style={{
          padding: 24,
          background: '#fff',
          border: '1px solid var(--line)',
          borderRadius: 14,
        }}>
          <div style={{ fontSize: '.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '.14em', fontWeight: 700, marginBottom: 8 }}>
            Terdaftar Sejak
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>
            {formatDate(c.created_at)}
          </div>
          <div style={{ fontSize: '.82rem', color: '#64748b', marginTop: 4 }}>
            {c.ids?.length || 0} ID pelanggan terdaftar
          </div>
        </div>
      </div>

      {/* FORM EDIT */}
      <CustomerForm initial={c} />

      {/* RIWAYAT KWITANSI */}
      <div className="admin-card" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 16 }}>Riwayat Kwitansi ({list.length})</h3>
        {list.length === 0 ? (
          <p style={{ color: 'var(--muted)', padding: '20px 0', textAlign: 'center' }}>
            Belum ada kwitansi untuk pelanggan ini.
          </p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nomor</th>
                <th>Tanggal</th>
                <th>Kategori</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <Link href={`/admin/kwitansi/${inv.id}`} style={{ color: '#2563eb', fontWeight: 600 }}>
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td>{formatDate(inv.invoice_date)}</td>
                  <td>{inv.category || '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatRupiah(inv.total)}</td>
                  <td>
                    <StatusBadge status={inv.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}