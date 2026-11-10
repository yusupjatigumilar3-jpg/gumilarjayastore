import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/settings';
import AdminShell from '@/components/AdminShell';
import './admin.css';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Pengaturan dan profil tidak saling bergantung, jadi diambil bersamaan.
  const [settings, { data: profile }] = await Promise.all([
    getSettings(),
    supabase.from('admin_profiles').select('username, full_name').eq('id', user.id).maybeSingle(),
  ]);

  const userName = profile?.full_name || profile?.username || user.email || 'Admin';

  return (
    <AdminShell settings={settings} userName={userName}>
      {children}
    </AdminShell>
  );
}
