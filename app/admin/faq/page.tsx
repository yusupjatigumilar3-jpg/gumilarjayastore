import { createAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from "@/components/admin/ui";
import FaqManager from '@/components/FaqManager';
import type { Faq } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'FAQ' };

export default async function AdminFaqPage() {
  const supabase = createAdminClient();
  const { data } = await supabase.from('faqs').select('*').order('sort_order');
  return (
    <>
      <PageHeader title="Pertanyaan Umum (FAQ)" />
      <FaqManager initial={(data || []) as Faq[]} />
    </>
  );
}