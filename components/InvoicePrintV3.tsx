import type { Invoice, InvoiceItem, InvoiceCustomerInfo } from '@/lib/types';
import QrSvg from '@/components/QrSvg';
import { formatRupiah, formatDate } from '@/lib/utils';
import { terbilang } from '@/lib/terbilang';

interface Props {
  invoice: Invoice & { customer_id_display?: string };
  items: InvoiceItem[];
  settings: Record<string, string>;
  publicUrl?: string;
  customer?: InvoiceCustomerInfo;
}

export default function InvoicePrintV3({ invoice, items, settings, publicUrl, customer }: Props) {
  const primary = settings.invoice_primary_color || settings.brand_primary_color || '#2563eb';
  const accent = settings.invoice_accent_color || settings.brand_secondary_color || '#10b981';
  const isPaid = invoice.status === 'dibayar';
  const showQr = settings.invoice_show_qr !== 'false';
  const logoSrc = settings.brand_logo_url || '';

  const customerCode = invoice.customer_id_display || customer?.customer_code || '';
  const customerIds = customer?.ids ?? [];

  const statusColor: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: '#f1f5f9', text: '#475569', label: 'DRAFT' },
    terkirim: { bg: '#fef3c7', text: '#92400e', label: 'TERKIRIM' },
    dibayar: { bg: '#d1fae5', text: '#065f46', label: 'LUNAS' },
    batal: { bg: '#fee2e2', text: '#991b1b', label: 'BATAL' },
  };
  const st = statusColor[invoice.status] || statusColor.draft;

  return (
    <div className="invoice-v3">
      <div className="inv3-band" style={{ background: primary }}>
        <div className="inv3-band-left">
          {logoSrc ? (
            <img src={logoSrc} alt="Logo" style={{ width: 60, height: 60, objectFit: 'contain', background: '#fff', borderRadius: 14, padding: 6 }} />
          ) : (
            <div className="inv3-logo">{settings.brand_logo_text || 'GJ'}</div>
          )}
          <div>
            <div className="inv3-brand">{settings.site_name || 'Gumilar Jaya Store'}</div>
            <div className="inv3-tagline">{settings.brand_tagline || 'Melayani dengan aman & tenang'}</div>
          </div>
        </div>
        <div className="inv3-band-right">
          <div className="inv3-band-label">BUKTI PEMBAYARAN</div>
          <div className="inv3-band-number">{invoice.invoice_number}</div>
        </div>
      </div>

      <div className="inv3-top">
        <div className="inv3-customer">
          <div className="inv3-section-label">Ditagihkan Kepada</div>
          <div className="inv3-customer-name">{invoice.customer_name}</div>
          {customerCode && <div className="inv3-customer-code">Kode: {customerCode}</div>}
          {customerIds.length > 0 && (
            <div className="inv-ids">
              {customerIds.map((i, n) => (
                <div key={n}><span>{i.id_label}</span> <b>{i.id_number}</b></div>
              ))}
            </div>
          )}
          <div className="inv3-customer-detail">
            {invoice.customer_address && <div>{invoice.customer_address}</div>}
            {invoice.customer_email && <div>{invoice.customer_email}</div>}
            {invoice.customer_phone && <div>{invoice.customer_phone}</div>}
          </div>
        </div>

        <div className="inv3-dates">
          <div className="inv3-date-row"><span>Tanggal</span><b>{formatDate(invoice.invoice_date)}</b></div>
          {invoice.due_date && (
            <div className="inv3-date-row"><span>Jatuh Tempo</span><b>{formatDate(invoice.due_date)}</b></div>
          )}
          {invoice.payment_method && (
            <div className="inv3-date-row"><span>Metode</span><b>{invoice.payment_method}</b></div>
          )}
          <div className="inv3-status-wrap">
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 99,
              fontSize: '.7rem', fontWeight: 700, letterSpacing: '.12em',
              background: st.bg, color: st.text,
            }}>{st.label}</span>
          </div>
        </div>
      </div>

      <div className="inv3-status-bar" style={{
        background: isPaid ? '#f0fdf4' : invoice.status === 'batal' ? '#fef2f2' : '#fffbeb',
        borderColor: isPaid ? '#86efac' : invoice.status === 'batal' ? '#fca5a5' : '#fcd34d',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.6rem', color: isPaid ? '#059669' : invoice.status === 'batal' ? '#dc2626' : '#d97706' }}>
            {isPaid ? '✓' : invoice.status === 'batal' ? '×' : '!'}
          </span>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: isPaid ? '#059669' : invoice.status === 'batal' ? '#dc2626' : '#d97706' }}>
              {isPaid ? 'LUNAS' : invoice.status === 'batal' ? 'DIBATALKAN' : 'BELUM DIBAYAR'}
            </div>
          </div>
        </div>
      </div>

      <div className="inv3-items">
        <table className="inv3-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>Deskripsi</th>
              <th style={{ width: 60, textAlign: 'center' }}>Qty</th>
              <th style={{ width: 130, textAlign: 'right' }}>Harga</th>
              <th style={{ width: 150, textAlign: 'right' }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={it.id}>
                <td style={{ color: '#94a3b8', fontWeight: 700, fontFamily: 'monospace' }}>{String(i + 1).padStart(2, '0')}</td>
                <td><div className="inv3-item-name">{it.description}</div></td>
                <td style={{ textAlign: 'center', fontWeight: 600 }}>{it.qty}</td>
                <td className="inv3-num">{formatRupiah(it.unit_price).replace('Rp ', '')}</td>
                <td className="inv3-num inv3-num-bold">{formatRupiah(it.subtotal).replace('Rp ', '')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="inv3-bottom">
        <div className="inv3-notes">
          <div className="inv3-section-label">Catatan</div>
          <div className="inv3-notes-text">
            {invoice.notes || settings.invoice_footer_note || 'Bukti pembayaran ini merupakan Kwitansi Pembayaran yang sah.'}
          </div>
          <div className="inv3-thanks" style={{ color: primary }}>
            {settings.invoice_thank_you || 'Terima kasih atas kepercayaan Anda.'}
          </div>

          {showQr && publicUrl && (
            <div className="inv3-qr">
              <QrSvg value={publicUrl} size={100} />
              <div style={{ fontSize: '.68rem', color: '#64748b', marginTop: 6, maxWidth: 140 }}>
                {settings.invoice_qr_caption || 'Scan untuk verifikasi kwitansi ini'}
              </div>
            </div>
          )}
        </div>

        <div className="inv3-totals">
          <div className="inv3-total-row"><span>Subtotal</span><b>{formatRupiah(invoice.subtotal)}</b></div>
          {invoice.discount > 0 && (
            <div className="inv3-total-row"><span>Diskon</span><b style={{ color: '#dc2626' }}>− {formatRupiah(invoice.discount)}</b></div>
          )}
          {invoice.tax > 0 && (
            <div className="inv3-total-row"><span>Biaya Admin</span><b>{formatRupiah(invoice.tax)}</b></div>
          )}
          <div className="inv3-grand" style={{ borderColor: primary }}>
            <span>TOTAL</span>
            <span style={{ color: primary }}>{formatRupiah(invoice.total)}</span>
          </div>
          <div style={{
            marginTop: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 8,
            fontSize: '.76rem', color: '#475569', fontStyle: 'italic',
            borderLeft: `3px solid ${primary}`, lineHeight: 1.5,
          }}>
            <b style={{ fontStyle: 'normal', color: '#0b1220' }}>Terbilang:</b><br />
            {terbilang(invoice.total)}
          </div>
        </div>
      </div>

      <div className="inv3-footer">
        <div className="inv3-payment">
          <div className="inv3-section-label">Instruksi Pembayaran</div>
          <div className="inv3-bank-box">
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: primary }}>{settings.brand_bank_name || 'BCA'}</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '.06em', fontFamily: 'monospace' }}>
              {settings.brand_bank_account || '1234567890'}
            </div>
            <div style={{ fontSize: '.82rem', color: '#64748b', marginTop: 4 }}>
              a/n {settings.brand_bank_holder || settings.site_name}
            </div>
          </div>
        </div>

        <div className="inv3-stamp-col">
          {isPaid && (
            <div className="inv3-stamp" style={{ borderColor: accent, color: accent }}>LUNAS</div>
          )}
          <div className="inv3-signature">
            <div style={{ fontSize: '.72rem', color: '#64748b', marginBottom: 8 }}>Hormat kami,</div>
            <div style={{ borderTop: '1.5px solid #0b1220', paddingTop: 8, fontWeight: 700, fontSize: '.88rem' }}>
              {settings.invoice_signature_name || settings.site_name}
            </div>
          </div>
        </div>
      </div>

      <div className="inv3-strip">
        <span>● {settings.invoice_strip_text || 'Transaksi Aman, Hati Tenang'}</span>
        <span>{settings.contact_email || 'halo@gumilarjaya.store'}</span>
      </div>
    </div>
  );
}