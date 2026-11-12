'use client';

import { useEffect } from 'react';

// Saat dicetak, kwitansi diperkecil otomatis (bila perlu) supaya muat satu halaman A4,
// berapa pun jumlah itemnya. Layar biasa tidak berubah.
const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
const MARGIN_MM = 8;
const PX_PER_MM = 96 / 25.4;
const DESIGN_W_PX = 800; // lebar tata letak saat cetak, sebelum diperkecil

export default function FitToA4({ selector = '.a4-fit' }: { selector?: string }) {
  useEffect(() => {
    const els = () => Array.from(document.querySelectorAll<HTMLElement>(selector));

    function fit() {
      const availW = (PAGE_W_MM - MARGIN_MM * 2) * PX_PER_MM;
      const availH = (PAGE_H_MM - MARGIN_MM * 2 - 2) * PX_PER_MM; // sisakan 2mm agar tidak meluber
      for (const el of els()) {
        el.style.zoom = '';
        el.style.width = `${DESIGN_W_PX}px`;
        el.style.maxWidth = 'none';
        let scale = Math.min(1, availW / DESIGN_W_PX);
        // Teks tidak mengecil persis linear saat di-zoom, jadi ukur ulang dan perkecil sampai muat.
        for (let i = 0; i < 8; i++) {
          el.style.zoom = String(scale);
          const h = el.getBoundingClientRect().height;
          if (h <= availH) break;
          scale = Math.floor(scale * (availH / h) * 0.99 * 1000) / 1000;
        }
      }
    }
    function reset() {
      for (const el of els()) {
        el.style.zoom = '';
        el.style.width = '';
        el.style.maxWidth = '';
      }
    }

    window.addEventListener('beforeprint', fit);
    window.addEventListener('afterprint', reset);
    // Cadangan untuk browser yang tidak memicu beforeprint (mis. sebagian Safari).
    const mq = window.matchMedia('print');
    const onMq = (e: MediaQueryListEvent) => (e.matches ? fit() : reset());
    mq.addEventListener?.('change', onMq);
    return () => {
      window.removeEventListener('beforeprint', fit);
      window.removeEventListener('afterprint', reset);
      mq.removeEventListener?.('change', onMq);
    };
  }, [selector]);

  return null;
}
