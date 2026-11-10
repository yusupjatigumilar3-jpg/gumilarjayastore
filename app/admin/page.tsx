import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatRupiah, formatDate, todayWib } from '@/lib/utils';
import { PageHeader, StatusBadge, EmptyState } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard' };

export default async function AdminDashboard() {
  const supabase = createAdminClient();
  const today = todayWib();
  const head = { count: 'exact' as const, head: true };

  const [paid, sent, overdue, draft, products, customers, recent, overdueList] = await Promise.all([
    supabase.from('invoices').select('id', head).eq('status', 'dibayar'),
    supabase.from('invoices').select('id', head).eq('status', 'terkirim'),
    supabase.from('invoices').select('id', head).eq('status', 'terkirim').lt('due_date', today),
    supabase.from('invoices').select('id', head).eq('status', 'draft'),
    supabase.from('products').select('id', head),
    supabase.from('customers').select('id', head).eq('is_archived', false),
    supabase
      .from('invoices')
      .select('id, invoice_number, customer_name, total, status')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('invoices')
      .select('id, invoice_number, customer_name, total, due_date')
      .eq('status', 'terkirim')
      .lt('due_date', today)
      .order('due_date', { ascending: true })
      .limit(6),
  ]);

  const stats = [
    { label: 'Kwitansi lunas', value: paid.count, href: '/admin/kwitansi?status=dibayar', tone: 'good' },
    { label: 'Menunggu pembayaran', value: sent.count, href: '/admin/kwitansi?status=terkirim', tone: 'info' },
    { label: 'Lewat jatuh tempo', value: overdue.count, href: '/admin/kwitansi?status=terkirim', tone: (overdue.count ?? 0) > 0 ? 'warn' : '' },
    { label: 'Draft', value: draft.count, href: '/admin/kwitansi?status=draft', tone: '' },
    { label: 'Pelanggan', value: customers.count, href: '/admin/pelanggan-customers', tone: '' },
    { label: 'Produk', value: products.count, href: '/admin/produk', tone: '' },
  ];

  const recentList = recent.data || [];
  const lateList = overdueList.data || [];

  return (
    <>
      <PageHeader
        title="Dashboard"
        actions={
          <>
            <Link href="/admin/kwitansi/baru" className="btn btn-primary">+ Kwitansi</Link>
            <Link href="/admin/produk/baru" className="btn btn-ghost">+ Produk</Link>
          </>
        }
      />

      <div className="a-stats">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={`a-stat ${s.tone}`}>
            <b>{(s.value ?? 0).toLocaleString('id-ID')}</b>
            <span>{s.label}</span>
          </Link>
        ))}
      </div>

      <div className="a-grid-2">
        <section className="admin-card">
          <div className="a-card-title">
            <h3>Kwitansi terbaru</h3>
            <Link href="/admin/kwitansi" className="a-link">Lihat semua</Link>
          </div>
          {recentList.length === 0 ? (
            <EmptyState>Belum ada kwitansi.</EmptyState>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Nomor</th><th>Pelanggan</th><th className="a-num">Total</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {recentList.map((inv: any) => (
                    <tr key={inv.id}>
                      <td><Link href={`/admin/kwitansi/${inv.id}`} className="a-row-link">{inv.invoice_number}</Link></td>
                      <td>{inv.customer_name}</td>
                      <td className="a-num"><b>{formatRupiah(inv.total)}</b></td>
                      <td><StatusBadge status={inv.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-card">
          <div className="a-card-title">
            <h3>Perlu ditagih</h3>
            <Link href="/admin/kwitansi?status=terkirim" className="a-link">Lihat semua</Link>
          </div>
          {lateList.length === 0 ? (
            <EmptyState>Tidak ada kwitansi yang lewat jatuh tempo.</EmptyState>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Nomor</th><th>Pelanggan</th><th className="a-num">Total</th><th>Jatuh tempo</th></tr>
                </thead>
                <tbody>
                  {lateList.map((inv: any) => (
                    <tr key={inv.id}>
                      <td><Link href={`/admin/kwitansi/${inv.id}`} className="a-row-link">{inv.invoice_number}</Link></td>
                      <td>{inv.customer_name}</td>
                      <td className="a-num"><b>{formatRupiah(inv.total)}</b></td>
                      <td className="a-muted">{formatDate(inv.due_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
