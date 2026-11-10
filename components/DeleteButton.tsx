'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Tombol aksi dengan konfirmasi (hapus, arsipkan, pulihkan). Nama lama dipertahankan
// agar pemakaian yang sudah ada tetap jalan.
export default function DeleteButton({
  url,
  label = 'Hapus',
  confirmMessage = 'Yakin ingin menghapus?',
  method = 'DELETE',
  body,
  redirectTo,
  variant = 'danger',
}: {
  url: string;
  label?: string;
  confirmMessage?: string;
  method?: 'DELETE' | 'PATCH' | 'POST';
  body?: Record<string, unknown>;
  redirectTo?: string;
  variant?: 'danger' | 'primary' | 'ghost';
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (confirmMessage && !confirm(confirmMessage)) return;
    setLoading(true);
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        // Tampilkan alasan dari server bila ada.
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Aksi gagal');
      }
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      alert(`${err.message || 'Aksi gagal'}. Coba lagi.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`btn btn-${variant} btn-icon`}
      disabled={loading}
      style={{ marginLeft: 6 }}
    >
      {loading ? '…' : label}
    </button>
  );
}
