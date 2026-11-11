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

export default function InvoicePrintV4({ invoice, items, settings, publicUrl, customer }: Props) {
  const primary = settings.invoice_primary_color || settings.brand_primary_color || '#2563eb';
  const accent = settings.invoice_accent_color || settings.brand_secondary_color || '#10b981';
  const secondary = '#4b5563';
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
    <div className="invoice-v4">
      <svg className="inv4-top-curve" viewBox="0 0 600 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,0 L0,80 Q150,120 300,80 T600,40 L600,0 Z" fill={primary} />
      </svg>

      <div className="inv4-header">
        <div className="inv4-brand">
          {logoSrc ? (
            <img src={logoSrc} alt="Logo" className="inv4-logo" />
          ) : (
            <div className="inv4-logo-placeholder" style={{ background: '#fff', color: primary }}>
              {settings.brand_logo_text || 'GJ'}
            </div>
          )}
          <div>
            <div className="inv4-brand-name">{settings.site_name || 'Gumilar Jaya Store'}</div>
            <div className="inv4-brand-tagline">{settings.brand_tagline || 'Melayani dengan aman & tenang'}</div>
          </div>
        </div>

        <div className="inv4-contact">
          {settings.contact_whatsapp && (
            <div className="inv4-contact-row"><span>📱</span><span>{settings.contact_whatsapp}</span></div>
          )}
          {settings.contact_email && (
            <div className="inv4-contact-row"><span>✉</span><span>{settings.contact_email}</span></div>
          )}
          {settings.brand_address && (
            <div className="inv4-contact-row"><span>📍</span><span>{settings.brand_address}</span></div>
          )}
        </div>
      </div>

      <div className="inv4-title-wrap">
        <div className="inv4-title">INVOICE</div>
        <div className="inv4-title-line" style={{ background: primary }} />
      </div>

      <div className="inv4-meta">
        <div className="inv4-meta-col">
          <div className="inv4-meta-label">Invoice To</div>
          <div className="inv4-customer-name">{invoice.customer_name}</div>
          {customerCode && <div className="inv4-customer-code">Kode: {customerCode}</div>}
          {customerIds.length > 0 && (
            <div className="inv-ids">
              {customerIds.map((i, n) => (
                <div key={n}><span>{i.id_label}</span> <b>{i.id_number}</b></div>
              ))}
            </div>
          )}
          <div className="inv4-customer-detail">
            {invoice.customer_address && <div>{invoice.customer_address}</div>}
            {invoice.customer_email && <div>{invoice.customer_email}</div>}
            {invoice.customer_phone && <div>{invoice.customer_phone}</div>}
          </div>
        </div>

        <div className="inv4-meta-col inv4-meta-right">
          <div className="inv4-meta-item">
            <span className="inv4-meta-item-label">Invoice #</span>
            <span className="inv4-meta-item-value">{invoice.invoice_number}</span>
          </div>
          <div className="inv4-meta-item">
            <span className="inv4-meta-item-label">Date</span>
            <span className="inv4-meta-item-value">{formatDate(invoice.invoice_date)}</span>
          </div>
          {invoice.due_date && (
            <div className="inv4-meta-item">
              <span className="inv4-meta-item-label">Due Date</span>
              <span className="inv4-meta-item-value">{formatDate(invoice.due_date)}</span>
            </div>
          )}
          <div className="inv4-meta-item">
            <span className="inv4-meta-item-label">Status</span>
            <span className="inv4-status-pill" style={{ background: st.bg, color: st.text }}>
              {st.label}
            </span>
          </div>
        </div>
      </div>

      <div className="inv4-table-wrap">
        <table className="inv4-table">
          <thead>
            <tr>
              <th style={{ width: 50, textAlign: 'center' }}>No</th>
              <th>Item Description</th>
              <th style={{ width: 110, textAlign: 'right', background: primary, color: '#fff' }}>Price</th>
              <th style={{ width: 70, textAlign: 'center', background: primary, color: '#fff' }}>Qty</th>
              <th style={{ width: 130, textAlign: 'right', background: secondary, color: '#fff' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={it.id} className={i % 2 === 0 ? 'even' : 'odd'}>
                <td style={{ textAlign: 'center', color: '#64748b', fontFamily: 'SF Mono, Consolas, monospace' }}>
                  {String(i + 1).padStart(2, '0')}
                </td>
                <td><div className="inv4-item-desc">{it.description}</div></td>
                <td className="inv4-td-num">{formatRupiah(it.unit_price).replace('Rp ', '')}</td>
                <td style={{ textAlign: 'center' }}>{String(it.qty).padStart(2, '0')}</td>
                <td className="inv4-td-num inv4-td-bold">{formatRupiah(it.subtotal).replace('Rp ', '')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="inv4-summary">
        <div className="inv4-summary-left">
          <div className="inv4-section-label">Payment Info</div>
          <div className="inv4-payment-info">
            {settings.brand_bank_name && (
              <div className="inv4-payment-row"><span className="inv4-payment-key">Bank</span><span className="inv4-payment-val">{settings.brand_bank_name}</span></div>
            )}
            {settings.brand_bank_account && (
              <div className="inv4-payment-row"><span className="inv4-payment-key">Account #</span><span className="inv4-payment-val" style={{ fontFamily: 'monospace', fontWeight: 700 }}>{settings.brand_bank_account}</span></div>
            )}
            {settings.brand_bank_holder && (
              <div className="inv4-payment-row"><span className="inv4-payment-key">A/C Name</span><span className="inv4-payment-val">{settings.brand_bank_holder}</span></div>
            )}
          </div>

          {showQr && publicUrl && (
            <div className="inv4-qr-wrap">
              <QrSvg value={publicUrl} size={100} className="inv4-qr" />
              <div className="inv4-qr-caption">{settings.invoice_qr_caption || 'Scan untuk verifikasi kwitansi ini'}</div>
            </div>
          )}
        </div>

        <div className="inv4-summary-right">
          <div className="inv4-summary-row"><span>Sub Total</span><span className="inv4-summary-val">{formatRupiah(invoice.subtotal)}</span></div>
          {invoice.discount > 0 && (
            <div className="inv4-summary-row"><span>Discount</span><span className="inv4-summary-val" style={{ color: '#dc2626' }}>− {formatRupiah(invoice.discount)}</span></div>
          )}
          {invoice.tax > 0 && (
            <div className="inv4-summary-row"><span>Admin Fee</span><span className="inv4-summary-val">{formatRupiah(invoice.tax)}</span></div>
          )}
          <div className="inv4-summary-total">
            <div className="inv4-summary-total-label" style={{ background: secondary }}>Total</div>
            <div className="inv4-summary-total-value" style={{ background: primary }}>{formatRupiah(invoice.total)}</div>
          </div>
          <div className="inv4-terbilang">
            <div style={{ fontWeight: 700, color: '#0b1220', marginBottom: 4 }}>Terbilang:</div>
            <div style={{ fontStyle: 'italic' }}>{terbilang(invoice.total)}</div>
          </div>
        </div>
      </div>

      <div className="inv4-terms-sign">
        <div className="inv4-terms">
          <div className="inv4-section-label">Terms &amp; Conditions</div>
          <div className="inv4-terms-text">
            {invoice.notes || settings.invoice_footer_note || 'Bukti pembayaran ini merupakan Kwitansi Pembayaran yang sah.'}
          </div>
        </div>

        <div className="inv4-sign">
          {isPaid && (
            <div className="inv4-paid-stamp" style={{ borderColor: accent, color: accent }}>LUNAS</div>
          )}
          <div className="inv4-sign-line" style={{ background: primary }} />
          <div className="inv4-sign-name">{settings.invoice_signature_name || settings.site_name}</div>
          <div className="inv4-sign-title">{settings.invoice_signature_title || 'Admin'}</div>
        </div>
      </div>

      <svg className="inv4-bottom-curve" viewBox="0 0 600 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,100 L0,40 Q150,0 300,40 T600,60 L600,100 Z" fill={primary} />
      </svg>

      {publicUrl && (
        <div className="inv4-public no-print">
          <div className="inv4-public-label">Link publik kwitansi ini:</div>
          <div className="inv4-public-url">{publicUrl}</div>
        </div>
      )}
    </div>
  );
}