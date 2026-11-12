import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import DeleteButton from '@/components/DeleteButton';
import DuplicateProductButton from '@/components/DuplicateProductButton';
import ProductForm from '@/components/ProductForm';
import type { Category, Product } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createAdminClient();
  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from('products').select('*').eq('id', params.id).maybeSingle(),
    supabase.from('categories').select('*').order('sort_order'),
  ]);

  if (!product) notFound();

  return (
    <>
      <div className="admin-card-head">
        <h1>Edit Produk</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <DuplicateProductButton id={(product as Product).id} name={(product as Product).name} variant="button" />
          <DeleteButton
            url={`/api/admin/products/${(product as Product).id}`}
            label="Hapus Produk"
            confirmMessage={`Hapus produk "${(product as Product).name}"? Kwitansi lama tetap utuh.`}
            redirectTo="/admin/produk"
          />
          <Link href="/admin/produk" className="btn btn-ghost">← Kembali</Link>
        </div>
      </div>
      <ProductForm
        initial={product as Product}
        categories={(categories || []) as Category[]}
      />
    </>
  );
}