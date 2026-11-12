'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/admin/Icon';

// Salin kwitansi menjadi draft baru, lalu buka halaman edit salinannya.
export default function DuplicateInvoiceButton({
  id,
  number,
  variant = 'icon',
}: {
  id: string;
  number: string;
  variant?: 'icon' | 'button';
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!confirm(`Salin kwitansi ${number} menjadi draft baru?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/invoices/${id}/duplicate`, { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.id) throw new Error(data?.error || 'Gagal menyalin kwitansi');
      router.push(`/admin/kwitansi/${data.id}/edit`);
      router.refresh();
    } catch (err: any) {
      alert(`${err.message || 'Gagal menyalin kwitansi'}. Coba lagi.`);
      setLoading(false);
    }
  }

  if (variant === 'button') {
    return (
      <button type="button" onClick={handleClick} disabled={loading} className="btn btn-ghost">
        {loading ? 'Menyalin…' : 'Salin Kwitansi'}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="a-icon-link"
      aria-label={`Salin ${number}`}
      title="Salin"
      style={{ background: 'none', border: 0, cursor: 'pointer' }}
    >
      {loading ? '…' : <span style={{ fontWeight: 700, fontSize: '.8rem' }}>Salin</span>}
    </button>
  );
}
