import { createAdminClient } from '@/lib/supabase/admin';
import { PageHeader, ErrorNote } from '@/components/admin/ui';
import CategoryManager, { type CategoryRowData } from '@/components/CategoryManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Kategori' };

export default async function CategoriesPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, description, icon, sort_order, products(count)')
    .order('sort_order');

  const list: CategoryRowData[] = ((data || []) as any[]).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description || '',
    icon: c.icon || '',
    sort_order: c.sort_order ?? 0,
    product_count: c.products?.[0]?.count ?? 0,
  }));

  return (
    <>
      <PageHeader title="Kategori" count={list.length} />
      <ErrorNote message={error?.message} />
      <CategoryManager initial={list} />
    </>
  );
}
