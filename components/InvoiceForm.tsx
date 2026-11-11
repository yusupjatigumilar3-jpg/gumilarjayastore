'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Invoice, InvoiceItem, Customer } from '@/lib/types';
import { formatRupiah } from '@/lib/utils';
import {
  computeTotals,
  localDateString,
  paymentTypeFor,
  toInt,
  validateInvoiceInput,
} from '@/lib/invoice-calc';
import CustomerPicker from '@/components/CustomerPicker';

type Item = {
  description: string;
  qty: number;
  unit_price: number;
  product_id: string | null;
  admin_fee: number;
  penalty: number;
};

type Product = { id: string; name: string; price: number; service_type?: string; default_admin_fee?: number };

const PAYMENT_METHODS = [
  'Tunai',
  'Transfer BCA',
  'Transfer Mandiri',
  'Transfer BNI',
  'Transfer BRI',
  'QRIS',
  'GoPay',
  'OVO',
  'DANA',
  'ShopeePay',
  'Lainnya',
];

const DEFAULT_ADMIN_FEE = 2500;

export default function InvoiceForm({
  initial,
  initialItems,
  products,
  initialCustomer,
  defaultAdminFee = DEFAULT_ADMIN_FEE,
}: {
  initial: Invoice | null;
  initialItems: InvoiceItem[];
  products: Product[];
  initialCustomer?: Customer | null;
  /** Biaya admin untuk kwitansi baru (dari Admin → Pengaturan). */
  defaultAdminFee?: number;
}) {
  const router = useRouter();
  // Tanggal lokal (WIB). toISOString() memakai UTC sehingga sebelum jam 07.00 WIB tanggalnya mundur sehari.
  const today = localDateString();

  const [customer, setCustomer] = useState<Customer | null>(initialCustomer || null);
  const [manualMode, setManualMode] = useState(false);
  // Pada edit, relasi pelanggan lama dipertahankan sampai admin benar-benar menggantinya.
  const [customerTouched, setCustomerTouched] = useState(false);

  const [form, setForm] = useState({
    invoice_number: initial?.invoice_number || '',
    customer_name: initial?.customer_name || '',
    customer_email: initial?.customer_email || '',
    customer_phone: initial?.customer_phone || '',
    customer_address: initial?.customer_address || '',
    invoice_date: initial?.invoice_date || today,
    due_date: initial?.due_date || '',
    status: initial?.status || 'draft',
    payment_method: initial?.payment_method || 'Tunai',
    notes: initial?.notes || '',
    discount: initial?.discount || 0,
    // Biaya admin tersimpan di kolom `tax`. Dulu dibaca dari `admin_fee` (kolom milik import) dan
    // memakai `|| 2500`, sehingga membuka kwitansi lama untuk diedit mengubah biaya admin & total diam-diam.
    admin: initial ? toInt(initial.tax) : defaultAdminFee,
  });

  const [items, setItems] = useState<Item[]>(
    initialItems.length > 0
      ? initialItems.map((it) => ({
          description: it.description,
          qty: it.qty,
          unit_price: it.unit_price,
          product_id: it.product_id,
          admin_fee: (it as any).admin_fee || 0,
          penalty: (it as any).penalty || 0,
        }))
      : [{
          description: '',
          qty: 1,
          unit_price: 0,
          product_id: null,
          admin_fee: 0,
          penalty: 0,
        }]
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const paymentType = paymentTypeFor(form.payment_method);
  const { subtotal, total } = computeTotals(items, form.discount, form.admin);
  const discountTooBig = (Number(form.discount) || 0) > subtotal;
  // Kolom data pelanggan tampil saat input manual, dan selalu saat edit (supaya data di kwitansi bisa dicek/diubah).
  const showCustomerFields = manualMode || !!initial;

  function handlePickCustomer(c: Customer | null) {
    setCustomer(c);
    setCustomerTouched(true);
    if (c) {
      setManualMode(false);
      setForm((f) => ({
        ...f,
        customer_name: c.name,
        customer_email: c.email || '',
        customer_phone: c.phone || '',
        customer_address: c.address || '',
      }));
    } else if (!initial) {
      // "Ganti" pada kwitansi baru: kosongkan data lama agar tidak ikut tersimpan tanpa terlihat.
      setForm((f) => ({ ...f, customer_name: '', customer_email: '', customer_phone: '', customer_address: '' }));
    }
  }

  function updateItem(idx: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, {
      description: '', qty: 1, unit_price: 0, product_id: null, admin_fee: 0, penalty: 0,
    }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  }

  function pickProduct(idx: number, productId: string) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    updateItem(idx, {
      product_id: p.id,
      description: p.name,
      unit_price: p.price,
      admin_fee: p.default_admin_fee || 0,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setError('');

    const customer_id = customer ? customer.id : customerTouched ? null : (initial?.customer_id ?? null);
    const customer_id_display = customer
      ? customer.customer_code || ''
      : customerTouched ? '' : (initial?.customer_id_display ?? '');

    const payload = {
      ...form,
      payment_type: paymentType,
      customer_id,
      customer_id_display,
      due_date: form.due_date || null,
      discount: Number(form.discount) || 0,
      admin_fee: Number(form.admin) || 0,
      items,
    };

    // Validasi yang sama persis dengan server (lib/invoice-calc.ts), supaya pesan error langsung jelas.
    const check = validateInvoiceInput(payload);
    if (!check.ok) {
      setError(check.error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    try {
      const url = initial ? `/api/admin/invoices/${initial.id}` : '/api/admin/invoices';
      const method = initial ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan');
      router.push(`/admin/kwitansi/${data.id || initial?.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-card">
      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 9,
          background: '#fee2e2', color: '#991b1b',
          fontSize: '.86rem', marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      {initial?.status === 'dibayar' && (
        <div style={{
          padding: '12px 16px', borderRadius: 9,
          background: '#fef3c7', color: '#92400e',
          fontSize: '.84rem', marginBottom: 20, lineHeight: 1.5,
        }}>
          Kwitansi ini sudah berstatus <b>Lunas</b>. Mengubah item, diskon, atau biaya admin akan mengubah
          nilai bukti pembayaran yang mungkin sudah diterima pelanggan.
        </div>
      )}

      {/* === PELANGGAN === */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>Pelanggan</h3>
        <CustomerPicker
          value={customer}
          onChange={handlePickCustomer}
          onManualFill={() => {
            setCustomer(null);
            setCustomerTouched(true);
            setManualMode(true);
          }}
        />

        {showCustomerFields && (
          <>
            {initial && (
              <div style={{ marginTop: 12, fontSize: '.76rem', color: '#64748b' }}>
                Data di bawah inilah yang tercetak di kwitansi (salinan saat kwitansi dibuat).
              </div>
            )}
            <div className="admin-form-grid" style={{ marginTop: 12 }}>
              <div>
                <label>Nama Pelanggan *</label>
                <input type="text" value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
                <label>Email</label>
                <input type="email" value={form.customer_email}
                  onChange={(e) => setForm({ ...form, customer_email: e.target.value })} />
              </div>
              <div>
                <label>Telepon</label>
                <input type="text" value={form.customer_phone}
                  onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
                <label>Alamat</label>
                <textarea rows={2} value={form.customer_address}
                  onChange={(e) => setForm({ ...form, customer_address: e.target.value })} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* === INFO KWITANSI === */}
      <div style={{ marginBottom: 24, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
        <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>Informasi Kwitansi</h3>
        <div className="admin-form-grid">
          <div>
            <label>Nomor Kwitansi</label>
            <input type="text" value={form.invoice_number}
              onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
              placeholder={initial ? 'Nomor kwitansi' : 'Akan dibuat otomatis kalau kosong'} />

            <label>Tanggal</label>
            <input type="date" value={form.invoice_date}
              onChange={(e) => setForm({ ...form, invoice_date: e.target.value })} required />

            <label>Jatuh Tempo</label>
            <input type="date" value={form.due_date} min={form.invoice_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div>
            <label>Status</label>
            <select value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
              <option value="draft">Draft</option>
              <option value="terkirim">Terkirim</option>
              <option value="dibayar">Lunas</option>
              <option value="batal">Batal</option>
            </select>

            <label>Metode Pembayaran</label>
            <select value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <label>Tipe Pembayaran</label>
            <div style={{
              padding: '11px 14px', border: '1px solid #e2e8f0',
              borderRadius: 10, background: '#f8fafc',
              fontSize: '.85rem', fontWeight: 700,
              color: paymentType === 'tunai' ? '#059669' : '#2563eb',
            }}>
              {paymentType === 'tunai' ? '💵 TUNAI' : '💳 NON TUNAI'}
            </div>
          </div>
        </div>
      </div>

      {/* === ITEMS === */}
      <div style={{ marginBottom: 24, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
        <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>Item Kwitansi</h3>

        <div style={{ display: 'grid', gap: 8 }}>
          {items.map((item, idx) => (
            <div key={idx} style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1.5fr 60px 120px 120px 40px',
              gap: 6, alignItems: 'center',
            }}>
              <select value={item.product_id || ''}
                onChange={(e) => pickProduct(idx, e.target.value)}
                style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '.85rem' }}>
                <option value="">— Produk —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <input type="text" placeholder="Deskripsi" value={item.description}
                onChange={(e) => updateItem(idx, { description: e.target.value })}
                style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '.85rem' }} />
              <input type="number" min="1" value={item.qty}
                onChange={(e) => updateItem(idx, { qty: parseInt(e.target.value) || 1 })}
                style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '.85rem' }} />
              <input type="number" min="0" value={item.unit_price}
                onChange={(e) => updateItem(idx, { unit_price: parseInt(e.target.value) || 0 })}
                style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '.85rem' }}
                placeholder="Harga" />
              <input type="text" readOnly value={formatRupiah(item.qty * item.unit_price)}
                style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '.85rem', background: '#f8fafc' }} />
              <button type="button" onClick={() => removeItem(idx)} disabled={items.length <= 1}
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  border: '1px solid #fecaca', background: '#fef2f2',
                  color: '#dc2626', cursor: 'pointer', fontSize: '1rem',
                }}>×</button>
            </div>
          ))}
        </div>

        <button type="button" onClick={addItem} className="btn btn-ghost"
          style={{ marginTop: 12, fontSize: '.85rem' }}>
          + Tambah Item
        </button>
      </div>

      {/* === TOTAL === */}
      <div style={{ paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
        <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>Total & Catatan</h3>
        <div className="admin-form-grid">
          <div>
            <label>Catatan</label>
            <textarea rows={4} value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '10px 14px', background: '#f8fafc',
              borderRadius: 8, fontSize: '.9rem',
            }}>
              <span style={{ color: '#64748b' }}>Subtotal</span>
              <b style={{ fontFamily: 'monospace' }}>{formatRupiah(subtotal)}</b>
            </div>

            <label style={{ marginTop: 4 }}>Admin (Rp)</label>
            <input type="number" min="0" value={form.admin}
              onChange={(e) => setForm({ ...form, admin: parseInt(e.target.value) || 0 })}
              style={{
                width: '100%', padding: '11px 14px',
                border: '1px solid #e2e8f0', borderRadius: 10,
                fontSize: '.9rem', fontWeight: 700,
              }} />
            <div style={{ fontSize: '.72rem', color: '#64748b', marginTop: -6 }}>
              Default: Rp {defaultAdminFee.toLocaleString('id-ID')}
            </div>

            <label>Diskon (Rp)</label>
            <input type="number" min="0" value={form.discount}
              onChange={(e) => setForm({ ...form, discount: parseInt(e.target.value) || 0 })}
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: '.9rem',
                border: `1px solid ${discountTooBig ? '#f87171' : '#e2e8f0'}`,
              }} />
            {discountTooBig && (
              <div style={{ fontSize: '.74rem', color: '#dc2626', marginTop: -4 }}>
                Diskon melebihi subtotal — kurangi sebelum menyimpan.
              </div>
            )}

            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '14px 16px', background: '#eff6ff',
              borderRadius: 10, marginTop: 8,
            }}>
              <b style={{ fontSize: '1.05rem' }}>Total</b>
              <b style={{ color: '#2563eb', fontSize: '1.2rem', fontFamily: 'monospace' }}>
                {formatRupiah(total)}
              </b>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'flex-end', gap: 10,
        paddingTop: 20, borderTop: '1px solid #e2e8f0', marginTop: 20,
      }}>
        <button type="button" onClick={() => router.back()} className="btn btn-ghost">Batal</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Menyimpan…' : 'Simpan Kwitansi'}
        </button>
      </div>
    </form>
  );
}
