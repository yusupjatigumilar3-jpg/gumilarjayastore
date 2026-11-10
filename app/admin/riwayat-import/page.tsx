import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatDateTime } from '@/lib/utils';
import { parsePage, pageRange, totalPagesOf, listHref } from '@/lib/list-helpers';
import { PageHeader, Pagination, EmptyState, ErrorNote } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Riwayat Import' };

export default async function ImportHistoryPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = parsePage(searchParams.page);

  const supabase = createAdminClient();
  const [from, to] = pageRange(page);
  const { data, count, error } = await supabase
    .from('import_logs')
    .select('id, created_at, import_type, filename, total_rows, success_rows, failed_rows', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  const totalPages = totalPagesOf(count);
  if (page > totalPages) redirect(listHref('/admin/riwayat-import', { page: totalPages }));

  const list = (data || []) as any[];

  return (
    <>
      <PageHeader
        title="Riwayat Import"
        count={count ?? 0}
        actions={<Link href="/admin/import" className="btn btn-primary">+ Import Baru</Link>}
      />
      <div className="admin-card">
        <ErrorNote message={error?.message} />
        {list.length === 0 ? (
          <EmptyState>Belum ada riwayat.</EmptyState>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tanggal</th><th>Jenis</th><th>File</th>
                  <th className="a-num">Total</th><th className="a-num">Sukses</th><th className="a-num">Gagal</th>
                </tr>
              </thead>
              <tbody>
                {list.map((log) => (
                  <tr key={log.id}>
                    <td className="a-muted" style={{ fontSize: '.82rem' }}>{formatDateTime(log.created_at)}</td>
                    <td><span className="badge">{log.import_type}</span></td>
                    <td style={{ fontSize: '.82rem' }}>{log.filename || '—'}</td>
                    <td className="a-num">{log.total_rows}</td>
                    <td className="a-num" style={{ color: '#059669', fontWeight: 600 }}>{log.success_rows}</td>
                    <td className="a-num" style={{ color: log.failed_rows > 0 ? '#dc2626' : '#64748b', fontWeight: 600 }}>{log.failed_rows}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination base="/admin/riwayat-import" params={{}} page={page} totalPages={totalPages} />
      </div>
    </>
  );
}
