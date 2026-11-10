'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Customer } from '@/lib/types';
import { ID_TYPE_OPTIONS } from '@/lib/customer-helpers';

interface IdInput {
  id?: string;
  id_type: string;
  id_label: string;
  id_number: string;
}

// Tanpa `initial` = mode tambah pelanggan baru; dengan `initial` = mode edit.
export default function CustomerForm({ initial }: { initial?: Customer }) {
  const router = useRouter();
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [address, setAddress] = useState(initial?.address || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [ids, setIds] = useState<IdInput[]>(
    (initial?.ids || []).map((i) => ({
      id: i.id,
      id_type: i.id_type,
      id_label: i.id_label,
      id_number: i.id_number,
    }))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function updateId(idx: number, patch: Partial<IdInput>) {
    setIds((prev) => prev.map((i, n) => (n === idx ? { ...i, ...patch } : i)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const res = await fetch(isEdit ? `/api/admin/customers/${initial!.id}` : '/api/admin/customers', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, phone, address, notes,
          ids: ids.filter((i) => i.id_number.trim()),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan');

      if (!isEdit) {
        // Pelanggan baru: langsung buka halamannya (kode pelanggan sudah dibuat server).
        router.push(`/admin/pelanggan-customers/${data.id}`);
        router.refresh();
        return;
      }

      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-card">
      <h3 style={{ marginBottom: 16 }}>{isEdit ? 'Edit Data Pelanggan' : 'Data Pelanggan Baru'}</h3>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 9, background: '#fee2e2', color: '#991b1b', fontSize: '.86rem', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="admin-form-grid">
        <div>
          <label>Nama *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} autoFocus={!isEdit} />

          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

          <label>Telepon / WA</label>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <div>
          <label>Alamat</label>
          <textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />

          <label>Catatan</label>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      {/* IDs */}
      <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', borderRadius: 12 }}>
        <div style={{ fontSize: '.78rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#64748b', marginBottom: 12 }}>
          ID Pelanggan
        </div>

        {ids.length === 0 && (
          <p style={{ color: '#94a3b8', fontSize: '.85rem', marginBottom: 12 }}>Belum ada ID terdaftar.</p>
        )}

        {ids.map((id, idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '200px 1fr 40px', gap: 8, marginBottom: 8 }}>
            <select
              value={id.id_type}
              onChange={(e) => {
                const t = e.target.value;
                const opt = ID_TYPE_OPTIONS.find((o) => o.value === t);
                updateId(idx, { id_type: t, id_label: opt?.label || 'ID' });
              }}
              style={{ padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: '.86rem' }}
            >
              {ID_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Nomor ID"
              value={id.id_number}
              onChange={(e) => updateId(idx, { id_number: e.target.value })}
              style={{ padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: '.86rem', fontFamily: 'SF Mono, Consolas, monospace' }}
            />
            <button
              type="button"
              onClick={() => setIds((prev) => prev.filter((_, i) => i !== idx))}
              className="btn btn-danger"
              style={{ padding: 0 }}
            >
              ×
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setIds((prev) => [...prev, { id_type: 'lainnya', id_label: 'ID Lainnya', id_number: '' }])}
          className="btn btn-ghost"
          style={{ fontSize: '.8rem', padding: '6px 12px' }}
        >
          + Tambah ID
        </button>
      </div>

      <div className="admin-form-actions">
        {saved && (
          <span style={{ marginRight: 'auto', color: '#16a34a', fontWeight: 600, alignSelf: 'center' }}>
            ✓ Tersimpan
          </span>
        )}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
        </button>
      </div>
    </form>
  );
}