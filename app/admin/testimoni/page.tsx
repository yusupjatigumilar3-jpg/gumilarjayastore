import { createAdminClient } from '@/lib/supabase/admin';
import { PageHeader } from "@/components/admin/ui";
import TestimonialManager from '@/components/TestimonialManager';
import type { Testimonial } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Testimoni' };

export default async function AdminTestimonialsPage() {
  const supabase = createAdminClient();
  const { data } = await supabase.from('testimonials').select('*').order('sort_order');
  return (
    <>
      <PageHeader title="Testimoni" />
      <TestimonialManager initial={(data || []) as Testimonial[]} />
    </>
  );
}