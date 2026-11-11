import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { formatRupiah } from '@/lib/utils';
import type { Product } from '@/lib/types';
import { getSettings } from '@/lib/settings';
import ProductCard from '@/components/ProductCard';

export const dynamic = 'force-dynamic';

async function getProduct(slug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('products')
    .select('*, categories(name, slug)')
    .eq('slug', slug)
    .maybeSingle();

  if (!data) return null;

  return {
    ...data,
    category_name: data.categories?.name || '',
    category_slug: data.categories?.slug || '',
  } as Product & { category_slug: string };
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: 'Produk tidak ditemukan' };
  return {
    title: product.name,
    description: product.description?.slice(0, 160),
    alternates: { canonical: `/produk/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.image ? [{ url: product.image }] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const supabase = createClient();
  const { data: relatedData } = await supabase
    .from('products')
    .select('*, categories(name)')
    .eq('category_id', product.category_id)
    .neq('id', product.id)
    .limit(4);

  const related: Product[] = (relatedData || []).map((p: any) => ({
    ...p,
    category_name: p.categories?.name || '',
  }));

  const isDigital = product.type === 'digital';
  const isPriceZero = !product.price || product.price === 0;
  const hasSold = (product.sold || 0) > 0;
  const hasRating = (product.rating || 0) > 0;

  // JSON-LD Structured Data untuk SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image || undefined,
    description: product.description,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'IDR',
      price: product.price,
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  function cleanPhone(p: string): string {
    let n = String(p).replace(/[^\d]/g, '');
    if (n.startsWith('0')) n = '62' + n.slice(1);
    if (!n.startsWith('62')) n = '62' + n;
    return n;
  }

  // Nomor dari Admin → Pengaturan (sama seperti halaman lain); variable env hanya cadangan.
  const settings = await getSettings();
  const waPhone = settings.contact_whatsapp || process.env.NEXT_PUBLIC_WHATSAPP || '';
  const waMessage = `Halo, saya tertarik dengan produk ini:\n\n*${product.name}*\nHarga: ${isPriceZero ? 'Hubungi untuk harga' : formatRupiah(product.discount_price || product.price)}\n\nMohon info lebih lanjut.`;
  const waLink = waPhone
    ? `https://wa.me/${cleanPhone(waPhone)}?text=${encodeURIComponent(waMessage)}`
    : '#';

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="section">
        <div className="wrap detail">
          <div className="detail-visual">
            {product.image ? (
              <img src={product.image} alt={product.name} />
            ) : (
              <svg width="80" height="80" viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <rect x="14" y="8" width="32" height="44" rx="1.5" />
                <path d="M20 18h20M20 25h20M20 32h12M20 39h20" />
              </svg>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <span className={`p-badge ${isDigital ? 'dig' : 'fis'}`} style={{ position: 'static' }}>
                {isDigital ? 'Digital' : 'Fisik'}
              </span>
            </div>

            <h1 style={{ marginBottom: 8 }}>{product.name}</h1>

            {product.category_slug && (
              <p style={{ color: 'var(--muted)', marginBottom: 20 }}>
                <Link href={`/kategori/${product.category_slug}`} style={{ color: 'var(--blue)' }}>
                  {product.category_name}
                </Link>
              </p>
            )}

            {/* Rating & Sold — hanya tampil kalau > 0 */}
            {(hasRating || hasSold) && (
              <div className="p-meta" style={{ marginBottom: 20, fontSize: '.9rem' }}>
                {hasRating && <span className="star">★</span>}
                {hasRating && hasSold && <span>{product.rating} · {product.sold} terjual</span>}
                {hasRating && !hasSold && <span>{product.rating}</span>}
                {!hasRating && hasSold && <span>{product.sold} terjual</span>}
                {product.stock > 0 && !isDigital && (hasRating || hasSold) && (
                  <>
                    <span>·</span>
                    <span>Stok {product.stock}</span>
                  </>
                )}
              </div>
            )}

            <p style={{ marginBottom: 28, fontSize: '1rem' }}>{product.description}</p>

            {!isPriceZero && (
              <div className="detail-price">
                {product.discount_price ? (
                  <>
                    <b>{formatRupiah(product.discount_price)}</b>
                    <s>{formatRupiah(product.price)}</s>
                  </>
                ) : (
                  <b>{formatRupiah(product.price)}</b>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-lg"
                style={{
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                }}
              >
                {isPriceZero ? '📱 Tanyakan Produk Ini' : '📱 Tanya via WhatsApp'}
              </a>
            </div>

            {isPriceZero && (
              <p style={{ marginTop: 14, fontSize: '.82rem', color: 'var(--muted)' }}>
                Hubungi kami via WhatsApp untuk info harga & ketersediaan.
              </p>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <h2 style={{ marginBottom: 24 }}>Produk terkait</h2>
            <div className="prod-grid">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} waPhone={waPhone} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
