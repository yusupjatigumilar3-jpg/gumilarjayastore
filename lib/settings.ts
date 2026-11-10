import { unstable_cache } from 'next/cache';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import type { SettingsMap } from '@/lib/types';

const DEFAULTS: SettingsMap = {
  site_name: 'Gumilar Jaya Store',
  site_tagline: 'Produk digital & fisik, dipilih satu per satu.',
  site_description: 'Template, e-book, apparel, hingga kopi specialty.',
  contact_email: 'halo@gumilarjaya.store',
  contact_whatsapp: '',
  social_instagram: '',
  social_tiktok: '',
  hero_eyebrow: 'Marketplace terkurasi · Sejak 2019',
  hero_title: 'Produk digital & fisik, dipilih satu per satu.',
  hero_subtitle: 'Template, e-book, apparel, hingga kopi specialty.',
  stat_customers: '12.400+',
  stat_products: '380+',
  stat_rating: '4,9/5',
  stat_ontime: '98%',
};

// Pengaturan jarang berubah tapi dibaca di hampir setiap halaman, jadi disimpan 5 menit.
// Menyimpan di Admin → Pengaturan langsung membuang cache ini (revalidateTag('settings')).
// Bila pembacaan gagal, fungsi MELEMPAR error supaya hasil gagal tidak ikut tersimpan di cache.
const loadSettings = unstable_cache(
  async (): Promise<SettingsMap> => {
    const { data, error } = await createAdminClient().from('settings').select('key, value');
    if (error || !data) throw new Error(error?.message || 'settings tidak terbaca');
    const map: SettingsMap = {};
    data.forEach((row: { key: string; value: string | null }) => {
      map[row.key] = row.value || '';
    });
    return map;
  },
  ['site-settings'],
  { revalidate: 300, tags: ['settings'] }
);

export async function getSettings(): Promise<SettingsMap> {
  // Memanggil cookies() menandai halaman sebagai dinamis, sama seperti sebelum ada cache.
  // Tanpa ini halaman publik bisa dibekukan saat build dan tidak mengikuti perubahan pengaturan.
  cookies();
  try {
    return await loadSettings();
  } catch {
    return DEFAULTS;
  }
}
