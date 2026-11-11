import { createAdminClient } from '@/lib/supabase/admin';
import { PageHeader, ErrorNote } from '@/components/admin/ui';
import SettingsForm from '@/components/SettingsForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pengaturan' };

export default async function SettingsPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('settings').select('key, value');

  const initial: Record<string, string> = {};
  (data || []).forEach((row: { key: string; value: string | null }) => { initial[row.key] = row.value || ''; });

  return (
    <>
      <PageHeader title="Pengaturan Situs" />
      {/* Bila database tidak terbaca, form tidak ditampilkan: menyimpan dari form kosong
          akan menimpa pengaturan asli dengan nilai bawaan. */}
      {error ? <ErrorNote message={error.message} /> : <SettingsForm initial={initial} />}
    </>
  );
}
