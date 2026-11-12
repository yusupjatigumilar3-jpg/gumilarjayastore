'use client';

import { useEffect, useRef, useState } from 'react';

// Preview & unduh PDF kwitansi. Isi PDF = persis isi preview: satu halaman A4.
// Pustaka html2canvas + jsPDF dimuat dari CDN hanya saat tombol ditekan (tidak membebani halaman).
const H2C_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
const JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

const PAGE_W = 1240; // A4 pada 150 dpi
const PAGE_H = 1754;
const MARGIN = 47; // ~8 mm
const RENDER_W = 800; // lebar tata letak kwitansi saat dirender

const loaded: Record<string, Promise<void>> = {};
function loadScript(src: string): Promise<void> {
  if (!loaded[src]) {
    loaded[src] = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        delete loaded[src];
        reject(new Error('Gagal memuat pustaka PDF. Periksa koneksi internet.'));
      };
      document.head.appendChild(s);
    });
  }
  return loaded[src];
}

/** Render kwitansi ke kanvas satu halaman A4 (putih, margin, diperkecil bila terlalu tinggi). */
async function renderPage(): Promise<HTMLCanvasElement> {
  const w = window as any;
  await Promise.all([loadScript(H2C_URL), loadScript(JSPDF_URL)]);
  const source = document.querySelector<HTMLElement>('.a4-fit .invoice-v3, .a4-fit .invoice-v4');
  if (!source) throw new Error('Kwitansi tidak ditemukan di halaman.');

  // Salinan di luar layar dengan lebar tetap, supaya hasil sama di HP maupun komputer.
  const holder = document.createElement('div');
  holder.style.cssText = `position:fixed;left:-10000px;top:0;width:${RENDER_W}px;background:#fff;`;
  const clone = source.cloneNode(true) as HTMLElement;
  clone.style.cssText = `width:${RENDER_W}px;max-width:none;margin:0;box-shadow:none;border-radius:0;`;
  holder.appendChild(clone);
  document.body.appendChild(holder);
  try {
    if ((document as any).fonts?.ready) await (document as any).fonts.ready;
    const shot: HTMLCanvasElement = await w.html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: RENDER_W,
      windowWidth: RENDER_W,
      logging: false,
    });

    const page = document.createElement('canvas');
    page.width = PAGE_W;
    page.height = PAGE_H;
    const ctx = page.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);
    const maxW = PAGE_W - MARGIN * 2;
    const maxH = PAGE_H - MARGIN * 2;
    const ratio = shot.width / shot.height;
    let dw = maxW;
    let dh = dw / ratio;
    if (dh > maxH) { dh = maxH; dw = dh * ratio; }
    ctx.drawImage(shot, (PAGE_W - dw) / 2, MARGIN, dw, dh);
    return page;
  } finally {
    holder.remove();
  }
}

function savePdf(page: HTMLCanvasElement, filename: string) {
  const { jsPDF } = (window as any).jspdf;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  pdf.addImage(page.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 297);
  pdf.save(filename);
}

export default function InvoicePdfActions({ invoiceNumber }: { invoiceNumber: string }) {
  const [busy, setBusy] = useState<'' | 'preview' | 'download'>('');
  const [preview, setPreview] = useState<{ src: string; canvas: HTMLCanvasElement } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const filename = `Bukti-Pembayaran-${invoiceNumber.replace(/[^A-Za-z0-9]+/g, '-')}.pdf`;

  async function run(kind: 'preview' | 'download') {
    if (busy) return;
    setBusy(kind);
    try {
      const page = await renderPage();
      if (kind === 'download') savePdf(page, filename);
      else setPreview({ src: page.toDataURL('image/jpeg', 0.92), canvas: page });
    } catch (err: any) {
      alert(`${err?.message || 'Gagal membuat PDF'}\n\nSebagai alternatif, gunakan tombol Print / PDF.`);
    } finally {
      setBusy('');
    }
  }

  useEffect(() => {
    if (!preview) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPreview(null); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [preview]);

  return (
    <>
      <button type="button" className="btn btn-ghost no-print" onClick={() => run('preview')} disabled={!!busy}>
        {busy === 'preview' ? 'Memuat…' : '👁 Preview'}
      </button>
      <button type="button" className="btn btn-ghost no-print" onClick={() => run('download')} disabled={!!busy}>
        {busy === 'download' ? 'Membuat PDF…' : '⬇ Unduh PDF'}
      </button>

      {preview && (
        <div
          className="no-print"
          role="dialog"
          aria-modal="true"
          aria-label="Preview kwitansi"
          onClick={(e) => { if (e.target === e.currentTarget) setPreview(null); }}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 16, overflow: 'auto' }}
        >
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button type="button" className="btn btn-primary" onClick={() => savePdf(preview.canvas, filename)}>⬇ Unduh PDF</button>
            <button ref={closeRef} type="button" className="btn btn-ghost" style={{ background: '#fff' }} onClick={() => setPreview(null)}>Tutup</button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview.src}
            alt={`Preview ${invoiceNumber}`}
            style={{ width: 'min(100%, 794px)', height: 'auto', background: '#fff', boxShadow: '0 10px 40px rgba(0,0,0,.4)' }}
          />
        </div>
      )}
    </>
  );
}
