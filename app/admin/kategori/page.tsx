import { createAdminClient } from '@/lib/supabase/admin';
import { PageHeader, EmptyState, ErrorNote } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Kategori' };

export default async function CategoriesPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, description')
    .order('sort_order');
  const list = (data || []) as any[];

  return (
    <>
      <PageHeader title="Kategori" count={list.length} />
      <div className="admin-card">
        <ErrorNote message={error?.message} />
        {list.length === 0 ? (
          <EmptyState>Belum ada kategori.</EmptyState>
        ) : (
          <div className="a-cat-grid">
            {list.map((c) => (
              <div key={c.id} className="a-cat">
                <b>{c.name}</b>
                <p>{c.description || '—'}</p>
                <code>{c.slug}</code>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
