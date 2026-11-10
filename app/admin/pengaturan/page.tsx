import { createAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from "@/components/admin/ui";
import SettingsForm from '@/components/SettingsForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pengaturan' };

export default async function SettingsPage() {
  const supabase = createAdminClient();
  const { data } = await supabase.from('settings').select('*').order('category').order('key');
  return (
    <>
      <PageHeader title="Pengaturan Situs" />
      <SettingsForm initial={data || []} />
    </>
  );
}