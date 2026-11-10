// Komponen tampilan kecil yang dipakai bersama oleh semua halaman admin (server component).
import Link from 'next/link';
import type { ReactNode } from 'react';
import { listHref } from '@/lib/list-helpers';
import { STATUS_LABEL, isInvoiceStatus } from '@/lib/invoice-calc';

const ORDER_LABEL: Record<string, string> = {
  pending: 'Menunggu',
  paid: 'Dibayar',
  processing: 'Diproses',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

export function StatusBadge({ status }: { status: string }) {
  const label = isInvoiceStatus(status) ? STATUS_LABEL[status] : ORDER_LABEL[status] ?? status;
  return <span className={`status-badge status-${status}`}>{label}</span>;
}

export function PageHeader({
  title,
  count,
  actions,
}: {
  title: string;
  count?: number;
  actions?: ReactNode;
}) {
  return (
    <div className="a-head">
      <h1>
        {title}
        {count !== undefined && <span className="a-count"> ({count.toLocaleString('id-ID')})</span>}
      </h1>
      {actions && <div className="a-head-actions">{actions}</div>}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="a-empty">{children}</p>;
}

export function ErrorNote({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="a-alert">Gagal memuat data: {message}</p>;
}

// Kotak pencarian (form GET biasa, tanpa JavaScript). `hidden` membawa filter lain tetap aktif.
export function SearchBar({
  q,
  placeholder,
  reset,
  children,
}: {
  q: string;
  placeholder: string;
  reset?: string;
  children?: ReactNode;
}) {
  return (
    <form method="get" className="a-filters">
      <input type="search" name="q" defaultValue={q} placeholder={placeholder} aria-label="Cari" />
      {children}
      <button type="submit" className="btn btn-primary">Cari</button>
      {reset && <Link href={reset} className="btn btn-ghost">Reset</Link>}
    </form>
  );
}

export function Pagination({
  base,
  params,
  page,
  totalPages,
}: {
  base: string;
  params: Record<string, string | number | undefined>;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav className="a-pager" aria-label="Halaman">
      <span>Halaman {page} dari {totalPages}</span>
      <div>
        {page > 1 && <Link href={listHref(base, { ...params, page: page - 1 })} className="btn btn-ghost">← Sebelumnya</Link>}
        {page < totalPages && <Link href={listHref(base, { ...params, page: page + 1 })} className="btn btn-ghost">Berikutnya →</Link>}
      </div>
    </nav>
  );
}
