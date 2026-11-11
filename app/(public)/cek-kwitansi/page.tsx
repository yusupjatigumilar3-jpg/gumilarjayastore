import CheckInvoiceForm from '@/components/CheckInvoiceForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cek Kwitansi',
  description: 'Cek kwitansi pembayaran Anda di Gumilar Jaya Store dengan nomor kwitansi.',
  alternates: { canonical: '/cek-kwitansi' },
};

export default function CheckInvoicePage() {
  return (
    <section className="section" style={{ paddingTop: 60 }}>
      <div className="wrap" style={{ maxWidth: 560 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span className="eyebrow">Cek Kwitansi</span>
          <h1 style={{ marginTop: 14, marginBottom: 12 }}>Lihat kwitansi Anda.</h1>
          <p style={{ color: 'var(--muted)' }}>
            Masukkan nomor kwitansi yang tertera pada bukti pembayaran Anda.
          </p>
        </div>

        <div style={{
          background: '#fff',
          border: '1px solid var(--line)',
          borderRadius: 20,
          padding: 32,
          boxShadow: '0 4px 24px rgba(15,23,42,.06)',
        }}>
          <CheckInvoiceForm />
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '.82rem', color: 'var(--muted)' }}>
          Nomor kwitansi berbentuk seperti <b>INV/2026/10/0001</b>
        </p>
      </div>
    </section>
  );
}
