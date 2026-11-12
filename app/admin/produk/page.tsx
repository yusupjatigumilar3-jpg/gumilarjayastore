import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatRupiah } from '@/lib/utils';
import { PAGE_SIZE, parsePage, pageRange, totalPagesOf, safeSearch, listHref } from '@/lib/list-helpers';
import { PageHeader, SearchBar, Pagination, EmptyState, ErrorNote } from '@/components/admin/ui';
import Icon from '@/components/admin/Icon';
import DeleteButton from '@/components/DeleteButton';
import DuplicateProductButton from '@/components/DuplicateProductButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Produk' };

type SearchParams = { q?: string; type?: string; kategori?: string; page?: string };

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const q = safeSearch(searchParams.q);
  const type = searchParams.type === 'digital' || searchParams.type === 'fisik' ? searchParams.type : '';
  const kategori = /^[0-9a-f-]{36}$/i.test(searchParams.kategori || '') ? String(searchParams.kategori) : '';
  const page = parsePage(searchParams.page);

  const supabase = createAdminClient();
  // Hanya kolom yang tampil di tabel (dulu select * ikut membawa deskripsi panjang tiap produk),
  // dan dibatasi per halaman (dulu semua produk dimuat, terpotong diam-diam di 1000).
  let query = supabase
    .from('products')
    .select('id, name, price, discount_price, type, image, service_type, categories(name)', { count: 'exact' });
  if (type) query = query.eq('type', type);
  if (kategori) query = query.eq('category_id', kategori);
  if (q) query = query.ilike('name', `%${q}%`);

  const { data: cats } = await supabase.from('categories').select('id, name').order('sort_order');
  const [from, to] = pageRange(page);
  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);

  const totalPages = totalPagesOf(count);
  if (page > totalPages) redirect(listHref('/admin/produk', { q, type, kategori, page: totalPages }));

  const list = (data || []) as any[];
  const filtered = !!(q || type || kategori);

  return (
    <>
      <PageHeader
        title="Produk"
        count={count ?? 0}
        actions={<Link href="/admin/produk/baru" className="btn btn-primary">+ Tambah Produk</Link>}
      />

      <div className="admin-card">
        <SearchBar q={q} placeholder="Cari nama produk…" reset={filtered ? '/admin/produk' : undefined}>
          <select name="type" defaultValue={type} aria-label="Tipe">
            <option value="">Semua tipe</option>
            <option value="digital">Digital</option>
            <option value="fisik">Fisik</option>
          </select>
          <select name="kategori" defaultValue={kategori} aria-label="Kategori">
            <option value="">Semua kategori</option>
            {(cats || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </SearchBar>

        <ErrorNote message={error?.message} />

        {list.length === 0 ? (
          <EmptyState>{filtered ? 'Tidak ada produk yang cocok.' : 'Belum ada produk.'}</EmptyState>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 56 }}></th>
                  <th>Nama</th>
                  <th>Kategori</th>
                  <th>Tipe</th>
                  <th className="a-num">Harga</th>
                  <th className="a-num">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image} alt="" className="a-thumb" loading="lazy" width={42} height={42} />
                      ) : (
                        <div className="a-thumb a-thumb-ph">{p.service_type === 'listrik' ? '⚡' : p.type === 'digital' ? 'D' : 'F'}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{p.name}</div>
                      {p.service_type === 'listrik' && <span className="a-chip">⚡ Listrik</span>}
                    </td>
                    <td>{p.categories?.name || '—'}</td>
                    <td><span className={`badge ${p.type}`}>{p.type}</span></td>
                    <td className="a-num" style={{ fontWeight: 700 }}>
                      {formatRupiah(p.discount_price || p.price)}
                      {p.discount_price ? <div className="a-muted" style={{ fontWeight: 400, fontSize: '.75rem', textDecoration: 'line-through' }}>{formatRupiah(p.price)}</div> : null}
                    </td>
                    <td className="a-num" style={{ whiteSpace: 'nowrap' }}>
                      <Link href={`/admin/produk/${p.id}`} className="a-icon-link" aria-label={`Edit ${p.name}`}><Icon name="edit" /></Link>{' '}
                      <DuplicateProductButton id={p.id} name={p.name} />
                      <DeleteButton
                        url={`/api/admin/products/${p.id}`}
                        confirmMessage={`Hapus produk "${p.name}"? Kwitansi lama tetap utuh, hanya tautan ke produk ini yang dilepas.`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination base="/admin/produk" params={{ q, type, kategori }} page={page} totalPages={totalPages} />
      </div>
    </>
  );
}
