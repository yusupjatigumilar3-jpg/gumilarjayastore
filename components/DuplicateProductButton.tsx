'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Salin produk, lalu buka halaman edit salinannya.
export default function DuplicateProductButton({ id, name, variant = 'icon' }: { id: string; name: string; variant?: 'icon' | 'button' }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!confirm(`Salin produk "${name}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${id}/duplicate`, { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.id) throw new Error(data?.error || 'Gagal menyalin produk');
      router.push(`/admin/produk/${data.id}`);
      router.refresh();
    } catch (err: any) {
      alert(`${err.message || 'Gagal menyalin produk'}. Coba lagi.`);
      setLoading(false);
    }
  }

  if (variant === 'button') {
    return <button type="button" onClick={handleClick} disabled={loading} className="btn btn-ghost">{loading ? 'Menyalin…' : 'Salin Produk'}</button>;
  }
  return (
    <button type="button" onClick={handleClick} disabled={loading} className="a-icon-link" aria-label={`Salin ${name}`} title="Salin"
      style={{ background: 'none', border: 0, cursor: 'pointer' }}>
      {loading ? '…' : <span style={{ fontWeight: 700, fontSize: '.8rem' }}>Salin</span>}
    </button>
  );
}
