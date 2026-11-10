import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import { parsePage, pageRange, totalPagesOf, safeSearch, listHref } from '@/lib/list-helpers';
import { PageHeader, SearchBar, Pagination, EmptyState, ErrorNote, StatusBadge } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pesanan' };

type SearchParams = { q?: string; page?: string };

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const q = safeSearch(searchParams.q);
  const page = parsePage(searchParams.page);

  const supabase = createAdminClient();
  let query = supabase
    .from('orders')
    .select('id, order_number, created_at, customer_name, total, status', { count: 'exact' });
  if (q) query = query.or(`order_number.ilike.%${q}%,customer_name.ilike.%${q}%`);

  const [from, to] = pageRange(page);
  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);

  const totalPages = totalPagesOf(count);
  if (page > totalPages) redirect(listHref('/admin/pesanan', { q, page: totalPages }));

  const list = (data || []) as any[];

  return (
    <>
      <PageHeader title="Pesanan" count={count ?? 0} />
      <div className="admin-card">
        <SearchBar q={q} placeholder="Cari nomor pesanan atau nama…" reset={q ? '/admin/pesanan' : undefined} />
        <ErrorNote message={error?.message} />

        {list.length === 0 ? (
          <EmptyState>{q ? 'Tidak ada pesanan yang cocok.' : 'Belum ada pesanan.'}</EmptyState>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Nomor</th><th>Tanggal</th><th>Pelanggan</th><th className="a-num">Total</th><th>Status</th></tr>
              </thead>
              <tbody>
                {list.map((o) => (
                  <tr key={o.id}>
                    <td><b>{o.order_number}</b></td>
                    <td className="a-muted">{formatDateTime(o.created_at)}</td>
                    <td><b>{o.customer_name}</b></td>
                    <td className="a-num"><b>{formatRupiah(o.total)}</b></td>
                    <td><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination base="/admin/pesanan" params={{ q }} page={page} totalPages={totalPages} />
      </div>
    </>
  );
}
