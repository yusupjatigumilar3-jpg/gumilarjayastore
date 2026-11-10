import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatDate } from '@/lib/utils';
import { parsePage, pageRange, totalPagesOf, safeSearch, listHref } from '@/lib/list-helpers';
import { PageHeader, SearchBar, Pagination, EmptyState, ErrorNote } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pelanggan' };

type SearchParams = { q?: string; page?: string };

export default async function CustomersPage({ searchParams }: { searchParams: SearchParams }) {
  const q = safeSearch(searchParams.q);
  const page = parsePage(searchParams.page);

  const supabase = createAdminClient();
  let query = supabase
    .from('customers')
    .select('id, customer_code, name, email, phone, created_at, customer_ids(id, id_label, id_number)', { count: 'exact' })
    .eq('is_archived', false);
  if (q) query = query.or(`name.ilike.%${q}%,customer_code.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);

  const [from, to] = pageRange(page);
  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);

  const totalPages = totalPagesOf(count);
  if (page > totalPages) redirect(listHref('/admin/pelanggan-customers', { q, page: totalPages }));

  const list = (data || []) as any[];

  return (
    <>
      <PageHeader title="Pelanggan" count={count ?? 0} />

      <div className="admin-card">
        <SearchBar q={q} placeholder="Cari nama, kode, email, atau telepon…" reset={q ? '/admin/pelanggan-customers' : undefined} />
        <ErrorNote message={error?.message} />

        {list.length === 0 ? (
          <EmptyState>
            {q ? 'Tidak ada pelanggan yang cocok.' : 'Belum ada pelanggan. Pelanggan muncul di sini setelah dibuat dari form kwitansi atau di-import.'}
          </EmptyState>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Kode</th><th>Nama</th><th>Kontak</th><th>ID Pelanggan</th><th>Terdaftar</th></tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id}>
                    <td><code style={{ fontSize: '.8rem' }}>{c.customer_code}</code></td>
                    <td><Link href={`/admin/pelanggan-customers/${c.id}`} className="a-row-link">{c.name}</Link></td>
                    <td>
                      {c.email && <div style={{ fontSize: '.82rem' }}>{c.email}</div>}
                      {c.phone && <div className="a-muted" style={{ fontSize: '.82rem' }}>{c.phone}</div>}
                      {!c.email && !c.phone && <span className="a-muted">—</span>}
                    </td>
                    <td>
                      {(c.customer_ids || []).length === 0 ? (
                        <span className="a-muted">—</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {c.customer_ids.map((id: any) => (
                            <span key={id.id} className="a-chip blue" style={{ width: 'fit-content' }}>
                              {id.id_label}: {id.id_number}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="a-muted" style={{ fontSize: '.82rem' }}>{formatDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination base="/admin/pelanggan-customers" params={{ q }} page={page} totalPages={totalPages} />
      </div>
    </>
  );
}
