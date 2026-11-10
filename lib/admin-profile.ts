import { unstable_cache } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';

// Nama admin hampir tidak pernah berubah, jadi tidak perlu dibaca dari database di setiap halaman.
export const getAdminProfile = unstable_cache(
  async (userId: string): Promise<{ username: string | null; full_name: string | null } | null> => {
    const { data, error } = await createAdminClient()
      .from('admin_profiles')
      .select('username, full_name')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ?? null;
  },
  ['admin-profile'],
  { revalidate: 300, tags: ['admin-profile'] }
);
