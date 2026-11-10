'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { SettingsMap } from '@/lib/types';
import Icon, { type IconName } from '@/components/admin/Icon';

type Item = { href: string; label: string; icon: IconName; exact?: boolean };

const GROUPS: { title: string; items: Item[] }[] = [
  { title: '', items: [{ href: '/admin', label: 'Dashboard', icon: 'dashboard', exact: true }] },
  {
    title: 'Transaksi',
    items: [
      { href: '/admin/kwitansi', label: 'Kwitansi', icon: 'receipt' },
      { href: '/admin/pesanan', label: 'Pesanan', icon: 'cart' },
      { href: '/admin/pelanggan-customers', label: 'Pelanggan', icon: 'users' },
    ],
  },
  {
    title: 'Katalog',
    items: [
      { href: '/admin/produk', label: 'Produk', icon: 'box' },
      { href: '/admin/kategori', label: 'Kategori', icon: 'tag' },
      { href: '/admin/testimoni', label: 'Testimoni', icon: 'message' },
      { href: '/admin/faq', label: 'FAQ', icon: 'help' },
    ],
  },
  {
    title: 'Data',
    items: [
      { href: '/admin/import', label: 'Import', icon: 'download' },
      { href: '/admin/riwayat-import', label: 'Riwayat Import', icon: 'clock' },
    ],
  },
  { title: 'Sistem', items: [{ href: '/admin/pengaturan', label: 'Pengaturan', icon: 'sliders' }] },
];

export default function AdminShell({
  settings,
  userName,
  children,
}: {
  settings: SettingsMap;
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '';
  const [open, setOpen] = useState(false);

  // Tutup menu setiap pindah halaman; Esc juga menutup.
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');

  const logoSrc = settings.brand_logo_url || '';
  const initials = (settings.brand_logo_text || 'GJ').slice(0, 2).toUpperCase();

  return (
    <div className="a-shell">
      <div className={`a-scrim ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

      <aside className={`a-side ${open ? 'open' : ''}`} aria-label="Menu admin">
        <Link href="/admin" className="a-brand">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt="" className="a-brand-logo" />
          ) : (
            <span className="a-brand-mark">{initials}</span>
          )}
          <span className="a-brand-text">
            <b>{settings.site_name || 'Gumilar Jaya'}</b>
            <small>Admin</small>
          </span>
        </Link>

        <nav className="a-nav">
          {GROUPS.map((g, i) => (
            <div className="a-nav-group" key={g.title || i}>
              {g.title && <div className="a-nav-title">{g.title}</div>}
              {g.items.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  className={`a-nav-link ${isActive(m.href, m.exact) ? 'active' : ''}`}
                  aria-current={isActive(m.href, m.exact) ? 'page' : undefined}
                >
                  <Icon name={m.icon} />
                  {m.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="a-main">
        <header className="a-top">
          <button
            type="button"
            className="a-btn a-menu-btn"
            onClick={() => setOpen((v) => !v)}
            aria-label="Buka menu"
            aria-expanded={open}
          >
            <Icon name="menu" />
          </button>
          <span className="a-top-greet">Halo, <b>{userName}</b></span>
          <Link href="/" target="_blank" rel="noopener" className="a-btn">
            <Icon name="external" /><span className="a-btn-label">Lihat situs</span>
          </Link>
          <form action="/api/admin/logout" method="POST">
            <button type="submit" className="a-btn">
              <Icon name="logout" /><span className="a-btn-label">Keluar</span>
            </button>
          </form>
        </header>

        <main className="a-body">{children}</main>
      </div>
    </div>
  );
}
