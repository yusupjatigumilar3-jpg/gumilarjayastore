import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/settings';
import { getAdminProfile } from '@/lib/admin-profile';
import AdminShell from '@/components/AdminShell';
import './admin.css';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // middleware.ts sudah memverifikasi login dan meneruskan identitas lewat header.
  // Kalau header tidak ada (jalur tak terduga), verifikasi sendiri ke Supabase Auth.
  const h = headers();
  let userId = h.get('x-admin-uid');
  let email = h.get('x-admin-email') || '';
  if (!userId) {
    const { data: { user } } = await createClient().auth.getUser();
    if (!user) redirect('/login');
    userId = user.id;
    email = user.email ?? '';
  }

  const [settings, profile] = await Promise.all([
    getSettings(),
    getAdminProfile(userId).catch(() => null),
  ]);

  const userName = profile?.full_name || profile?.username || email || 'Admin';

  return (
    <AdminShell settings={settings} userName={userName}>
      {children}
    </AdminShell>
  );
}
