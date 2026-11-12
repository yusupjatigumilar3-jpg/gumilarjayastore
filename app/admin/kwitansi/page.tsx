import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatRupiah, formatDate } from '@/lib/utils';
import { INVOICE_STATUSES, STATUS_LABEL, isInvoiceStatus } from '@/lib/invoice-calc';
import { parsePage, pageRange, totalPagesOf, safeSearch, listHref } from '@/lib/list-helpers';
import { PageHeader, SearchBar, Pagination, EmptyState, ErrorNote, StatusBadge } from '@/components/admin/ui';
import Icon from '@/components/admin/Icon';
import DeleteButton from '@/components/DeleteButton';
import DuplicateInvoiceButton from '@/components/DuplicateInvoiceButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Kwitansi' };

type SearchParams = { q?: string; status?: string; page?: string };

export default async function InvoicesPage({ searchParams }: { searchParams: SearchParams }) {
  const q = safeSearch(searchParams.q);
  const status = isInvoiceStatus(searchParams.status) ? searchParams.status : '';
  const page = parsePage(searchParams.page);

  const supabase = createAdminClient();

  // Hitungan asli (count exact), pencarian, filter status, dan halaman.
  // Dulu semua kwitansi dimuat sekaligus dan terpotong diam-diam di 1000 baris.
  let query = supabase
    .from('invoices')
    .select('id, invoice_number, invoice_date, customer_name, total, status', { count: 'exact' });

  if (status) query = query.eq('status', status);
  if (q) query = query.or(`invoice_number.ilike.%${q}%,customer_name.ilike.%${q}%`);

  const [from, to] = pageRange(page);
  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);

  const totalPages = totalPagesOf(count);
  if (page > totalPages) redirect(listHref('/admin/kwitansi', { q, status, page: totalPages }));

  const list = (data || []) as any[];
  const filtered = !!(q || status);

  return (
    <>
      <PageHeader
        title="Kwitansi"
        count={count ?? 0}
        actions={<Link href="/admin/kwitansi/baru" className="btn btn-primary">+ Buat Kwitansi</Link>}
      />

      <div className="admin-card">
        <SearchBar q={q} placeholder="Cari nomor kwitansi atau nama pelanggan…" reset={filtered ? '/admin/kwitansi' : undefined}>
          <select name="status" defaultValue={status} aria-label="Status">
            <option value="">Semua status</option>
            {INVOICE_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </SearchBar>

        <ErrorNote message={error?.message} />

        {list.length === 0 ? (
          <EmptyState>{filtered ? 'Tidak ada kwitansi yang cocok dengan pencarian.' : 'Belum ada kwitansi.'}</EmptyState>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nomor</th><th>Tanggal</th><th>Pelanggan</th>
                  <th className="a-num">Total</th><th>Status</th><th className="a-num">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {list.map((inv) => (
                  <tr key={inv.id}>
                    <td><Link href={`/admin/kwitansi/${inv.id}`} className="a-row-link">{inv.invoice_number}</Link></td>
                    <td className="a-muted">{formatDate(inv.invoice_date)}</td>
                    <td><b>{inv.customer_name}</b></td>
                    <td className="a-num"><b>{formatRupiah(inv.total)}</b></td>
                    <td><StatusBadge status={inv.status} /></td>
                    <td className="a-num" style={{ whiteSpace: 'nowrap' }}>
                      <Link href={`/admin/kwitansi/${inv.id}`} className="a-icon-link" aria-label={`Buka ${inv.invoice_number}`}><Icon name="eye" /></Link>{' '}
                      <Link href={`/admin/kwitansi/${inv.id}/edit`} className="a-icon-link" aria-label={`Edit ${inv.invoice_number}`}><Icon name="edit" /></Link>{' '}
                      <DuplicateInvoiceButton id={inv.id} number={inv.invoice_number} />
                      <DeleteButton
                        url={`/api/admin/invoices/${inv.id}`}
                        confirmMessage={
                          inv.status === 'dibayar'
                            ? `Kwitansi ${inv.invoice_number} sudah LUNAS. Menghapusnya menghilangkan bukti pembayaran secara permanen (pertimbangkan status Batal). Tetap hapus?`
                            : `Hapus kwitansi ${inv.invoice_number}?`
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination base="/admin/kwitansi" params={{ q, status }} page={page} totalPages={totalPages} />
      </div>
    </>
  );
}
