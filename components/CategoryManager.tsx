'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type CategoryRowData = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sort_order: number;
  product_count: number;
};

const input = { width: '100%', padding: '8px 10px', border: '1px solid var(--a-line, #e2e8f0)', borderRadius: 7 } as const;

async function call(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || 'Aksi gagal');
  return data;
}

export default function CategoryManager({ initial }: { initial: CategoryRowData[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [icon, setIcon] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await fn();
      router.refresh();
    } catch (e: any) {
      setError(e.message || 'Aksi gagal');
    } finally {
      setBusy(false);
    }
  }

  const add = () =>
    run(async () => {
      await call('/api/admin/categories', 'POST', {
        name, description: desc, icon, sort_order: (initial.length ? initial[initial.length - 1].sort_order : 0) + 1,
      });
      setName(''); setDesc(''); setIcon('');
    });

  return (
    <>
      {error && <div className="a-alert" role="alert" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="admin-card">
        <h3>Tambah Kategori</h3>
        <form
          onSubmit={(e) => { e.preventDefault(); if (name.trim()) add(); }}
          style={{ display: 'grid', gridTemplateColumns: '70px 1fr 2fr auto', gap: 10, alignItems: 'end' }}
        >
          <div><label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, marginBottom: 6 }}>Ikon</label><input style={input} value={icon} maxLength={8} onChange={(e) => setIcon(e.target.value)} placeholder="📘" /></div>
          <div><label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, marginBottom: 6 }}>Nama *</label><input style={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Kategori baru" /></div>
          <div><label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, marginBottom: 6 }}>Deskripsi</label><input style={input} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Deskripsi singkat" /></div>
          <button type="submit" className="btn btn-primary" disabled={busy || !name.trim()}>+ Tambah</button>
        </form>
      </div>

      <div className="admin-card">
        <h3>Daftar Kategori ({initial.length})</h3>
        {initial.length === 0 ? (
          <p className="a-muted" style={{ padding: '16px 0' }}>Belum ada kategori.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Ikon</th><th>Nama</th><th>Deskripsi</th><th>Urutan</th><th className="a-num">Produk</th><th className="a-num">Aksi</th></tr>
              </thead>
              <tbody>
                {initial.map((c) => (
                  <Row key={c.id} c={c} busy={busy} run={run} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function Row({ c, busy, run }: { c: CategoryRowData; busy: boolean; run: (fn: () => Promise<void>) => void }) {
  const [name, setName] = useState(c.name);
  const [desc, setDesc] = useState(c.description);
  const [icon, setIcon] = useState(c.icon);
  const [order, setOrder] = useState(c.sort_order);
  const changed = name !== c.name || desc !== c.description || icon !== c.icon || order !== c.sort_order;

  const save = () => run(() => call(`/api/admin/categories/${c.id}`, 'PATCH', { name, description: desc, icon, sort_order: order }));
  const remove = () => {
    const warn = c.product_count > 0 ? ` ${c.product_count} produk di dalamnya akan menjadi tanpa kategori (produknya tidak terhapus).` : '';
    if (!confirm(`Hapus kategori "${c.name}"?${warn}`)) return;
    run(() => call(`/api/admin/categories/${c.id}`, 'DELETE'));
  };

  return (
    <tr>
      <td style={{ width: 70 }}><input style={input} value={icon} maxLength={8} onChange={(e) => setIcon(e.target.value)} aria-label="Ikon" /></td>
      <td><input style={input} value={name} onChange={(e) => setName(e.target.value)} aria-label="Nama" />
        <code style={{ fontSize: '.7rem', color: '#94a3b8' }}>{c.slug}</code></td>
      <td><input style={input} value={desc} onChange={(e) => setDesc(e.target.value)} aria-label="Deskripsi" /></td>
      <td style={{ width: 80 }}><input style={input} type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value) || 0)} aria-label="Urutan" /></td>
      <td className="a-num">{c.product_count}</td>
      <td className="a-num" style={{ whiteSpace: 'nowrap' }}>
        {changed && <button onClick={save} className="btn btn-primary btn-icon" disabled={busy || !name.trim()}>Simpan</button>}
        <button onClick={remove} className="btn btn-danger btn-icon" disabled={busy} style={{ marginLeft: 6 }}>Hapus</button>
      </td>
    </tr>
  );
}
