// Satu sumber kebenaran untuk Pengaturan Situs: daftar kolom di form, nilai awal,
// dan aturan validasi (dipakai form di browser DAN API di server).
import { cleanPhone } from '@/lib/whatsapp';

export type FieldType =
  | 'text' | 'textarea' | 'email' | 'phone' | 'social'
  | 'color' | 'image' | 'toggle' | 'number' | 'template';

export type Field = {
  key: string;
  label: string;
  type: FieldType;
  help?: string;
  placeholder?: string;
  default?: string;
  max?: number;
  required?: boolean;
  platform?: 'instagram' | 'tiktok';
  options?: string[];
  wide?: boolean;
};

export type Group = { id: string; title: string; description?: string; fields: Field[] };

export const SETTINGS_GROUPS: Group[] = [
  {
    id: 'brand',
    title: 'Identitas Situs',
    description: 'Nama dan tampilan merek. Tampil di header, footer, tab browser, dan kwitansi.',
    fields: [
      { key: 'site_name', label: 'Nama situs', type: 'text', required: true, max: 80, placeholder: 'Gumilar Jaya Store' },
      { key: 'site_tagline', label: 'Slogan situs', type: 'text', max: 150 },
      { key: 'site_description', label: 'Deskripsi situs', type: 'textarea', max: 300, wide: true, help: 'Dipakai mesin pencari dan saat tautan dibagikan.' },
      { key: 'brand_logo_text', label: 'Singkatan logo', type: 'text', max: 3, placeholder: 'GJ', help: 'Maksimal 3 huruf. Tampil bila logo gambar belum diunggah.' },
      { key: 'brand_tagline', label: 'Slogan di kwitansi', type: 'text', max: 100 },
      { key: 'brand_address', label: 'Alamat usaha', type: 'textarea', max: 300, wide: true, help: 'Tampil di kwitansi.' },
      { key: 'brand_logo_url', label: 'Logo', type: 'image', wide: true, help: 'Format JPG, PNG, WEBP, atau GIF, maksimal 5 MB. Disarankan persegi atau transparan.' },
      { key: 'brand_favicon_url', label: 'Ikon tab browser (favicon)', type: 'image', wide: true, help: 'Bila kosong, logo dipakai.' },
      { key: 'brand_primary_color', label: 'Warna utama', type: 'color', default: '#2563eb' },
      { key: 'brand_secondary_color', label: 'Warna pendamping', type: 'color', default: '#10b981' },
    ],
  },
  {
    id: 'contact',
    title: 'Kontak & Media Sosial',
    description: 'Tampil di footer, halaman produk, dan kwitansi.',
    fields: [
      { key: 'contact_email', label: 'Email', type: 'email', max: 120, placeholder: 'halo@domain.com' },
      { key: 'contact_whatsapp', label: 'Nomor WhatsApp', type: 'phone', placeholder: '08123456789', help: 'Ditulis bebas (08…, +62…); disimpan sebagai 62812… untuk tautan wa.me.' },
      { key: 'social_instagram', label: 'Instagram', type: 'social', platform: 'instagram', placeholder: '@namaakun atau https://instagram.com/…' },
      { key: 'social_tiktok', label: 'TikTok', type: 'social', platform: 'tiktok', placeholder: '@namaakun atau https://tiktok.com/@…' },
    ],
  },
  {
    id: 'hero',
    title: 'Halaman Depan',
    description: 'Teks utama dan angka statistik di beranda toko.',
    fields: [
      { key: 'hero_eyebrow', label: 'Teks kecil di atas judul', type: 'text', max: 100 },
      { key: 'hero_title', label: 'Judul utama', type: 'textarea', max: 150, wide: true },
      { key: 'hero_subtitle', label: 'Sub judul', type: 'textarea', max: 300, wide: true },
      { key: 'stat_customers', label: 'Statistik: pelanggan', type: 'text', max: 20, placeholder: '12.400+' },
      { key: 'stat_products', label: 'Statistik: produk', type: 'text', max: 20, placeholder: '380+' },
      { key: 'stat_rating', label: 'Statistik: rating', type: 'text', max: 20, placeholder: '4,9/5' },
      { key: 'stat_ontime', label: 'Statistik: tepat waktu', type: 'text', max: 20, placeholder: '98%' },
    ],
  },
  {
    id: 'bank',
    title: 'Rekening Pembayaran',
    description: 'Tampil di kwitansi sebagai tujuan pembayaran.',
    fields: [
      { key: 'brand_bank_name', label: 'Nama bank', type: 'text', max: 60, placeholder: 'BCA' },
      { key: 'brand_bank_account', label: 'Nomor rekening', type: 'text', max: 40, help: 'Periksa lagi sebelum mencetak kwitansi. Nomor contoh bawaan harus diganti.' },
      { key: 'brand_bank_holder', label: 'Atas nama', type: 'text', max: 80 },
    ],
  },
  {
    id: 'invoice',
    title: 'Kwitansi',
    description: 'Tampilan dan teks pada kwitansi cetak.',
    fields: [
      { key: 'invoice_template', label: 'Model kwitansi', type: 'template', options: ['v3', 'v4'], default: 'v3', wide: true, help: 'Berlaku langsung saat dipilih.' },
      { key: 'invoice_primary_color', label: 'Warna utama kwitansi', type: 'color', default: '#2563eb' },
      { key: 'invoice_accent_color', label: 'Warna aksen kwitansi', type: 'color', default: '#10b981' },
      { key: 'invoice_show_qr', label: 'Tampilkan QR verifikasi', type: 'toggle', default: 'true', help: 'QR mengarah ke halaman kwitansi di situs, supaya keasliannya bisa dicek.' },
      { key: 'invoice_qr_caption', label: 'Teks di bawah QR', type: 'text', max: 80, placeholder: 'Scan untuk verifikasi kwitansi ini' },
      { key: 'invoice_signature_name', label: 'Nama penandatangan', type: 'text', max: 80 },
      { key: 'invoice_signature_title', label: 'Jabatan penandatangan', type: 'text', max: 60, placeholder: 'Admin' },
      { key: 'invoice_footer_note', label: 'Catatan kaki', type: 'textarea', max: 300, wide: true, help: 'Dipakai bila kwitansi tidak punya catatan sendiri.' },
      { key: 'invoice_thank_you', label: 'Kalimat terima kasih', type: 'text', max: 120 },
      { key: 'invoice_strip_text', label: 'Teks pita', type: 'text', max: 80 },
      { key: 'listrik_default_admin_fee', label: 'Biaya admin bawaan (Rp)', type: 'number', default: '2500', help: 'Terisi otomatis saat membuat kwitansi baru; tetap bisa diubah per kwitansi.' },
    ],
  },
  {
    id: 'wa',
    title: 'Tombol Chat WhatsApp',
    description: 'Popup bantuan di beranda dan pesan otomatis yang dikirim pelanggan.',
    fields: [
      { key: 'wa_popup_enabled', label: 'Tampilkan popup chat', type: 'toggle', default: 'true' },
      { key: 'wa_popup_title', label: 'Judul popup', type: 'text', max: 80, default: 'Butuh bantuan?' },
      { key: 'wa_popup_subtitle', label: 'Keterangan popup', type: 'text', max: 150, default: 'Chat kami via WhatsApp — balas cepat di jam kerja' },
      { key: 'wa_popup_button', label: 'Teks tombol', type: 'text', max: 40, default: 'Chat via WhatsApp' },
      {
        key: 'wa_template_order', label: 'Pesan untuk pemesanan', type: 'textarea', max: 600, wide: true,
        default: 'Halo, saya ingin memesan:\n\nProduk: {produk}\nJumlah: {jumlah}\n\nNama: {nama}\nAlamat: {alamat}\n\nMohon info ketersediaan dan total harga.',
        help: 'Kata dalam kurung kurawal diganti otomatis: {produk} {jumlah} {nama} {alamat}.',
      },
      { key: 'wa_template_general', label: 'Pesan untuk pertanyaan umum', type: 'textarea', max: 600, wide: true, default: 'Halo, saya ingin bertanya tentang produk.' },
    ],
  },
];

// Kunci lama yang tidak dipakai di kode mana pun; disembunyikan dari bagian "Lainnya".
export const HIDDEN_KEYS = new Set([
  'listrik_default_penalty', 'whatsapp_template', 'app_maintenance', 'app_maintenance_message',
]);

export const ALL_FIELDS: Field[] = SETTINGS_GROUPS.flatMap((g) => g.fields);
const FIELD_BY_KEY: Record<string, Field> = Object.fromEntries(ALL_FIELDS.map((f) => [f.key, f]));
export const SCHEMA_KEYS = new Set(ALL_FIELDS.map((f) => f.key));

// ---------- normalisasi ----------

const HEX = /^#[0-9a-f]{6}$/i;
const KEY_RE = /^[a-z0-9_]{1,64}$/;

export function socialUrl(raw: string, platform: 'instagram' | 'tiktok'): string | null {
  const v = String(raw ?? '').trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) {
    try { new URL(v); return v; } catch { return null; }
  }
  const handle = v.replace(/^@/, '');
  if (!/^[A-Za-z0-9._]{1,40}$/.test(handle)) return null;
  return platform === 'tiktok' ? `https://www.tiktok.com/@${handle}` : `https://www.instagram.com/${handle}`;
}

function checkField(f: Field, raw: unknown): { value: string } | { error: string } {
  const v = String(raw ?? '').trim();
  const limit = f.max ?? (f.type === 'textarea' ? 2000 : 200);

  if (!v) {
    if (f.required) return { error: `${f.label} wajib diisi.` };
    return { value: '' };
  }

  switch (f.type) {
    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { error: 'Format email tidak valid.' };
      break;
    case 'phone': {
      const n = cleanPhone(v);
      if (n.length < 10 || n.length > 15) return { error: 'Nomor WhatsApp tidak valid (10–15 angka, contoh 08123456789).' };
      return { value: n };
    }
    case 'social': {
      const u = socialUrl(v, f.platform || 'instagram');
      if (u === null) return { error: 'Isi dengan @namaakun atau tautan lengkap (https://…).' };
      return { value: u };
    }
    case 'color':
      if (!HEX.test(v)) return { error: 'Warna harus berformat #RRGGBB, contoh #2563eb.' };
      return { value: v.toLowerCase() };
    case 'image':
      if (!/^https?:\/\/\S+$/i.test(v)) return { error: 'Alamat gambar tidak valid. Unggah ulang gambarnya.' };
      return { value: v };
    case 'toggle':
      return { value: v === 'true' ? 'true' : 'false' };
    case 'number': {
      const digits = v.replace(/[.\s,]/g, '');
      if (!/^\d{1,9}$/.test(digits)) return { error: 'Isi dengan angka bulat, contoh 2500.' };
      return { value: String(parseInt(digits, 10)) };
    }
    case 'template':
      if (!f.options?.includes(v)) return { error: 'Model kwitansi tidak dikenal.' };
      return { value: v };
  }

  if (v.length > limit) return { error: `Maksimal ${limit} karakter (sekarang ${v.length}).` };
  return { value: v };
}

/** Validasi dan rapikan nilai yang dikirim. Hanya kunci yang dikirim yang diperiksa. */
export function validateSettings(input: Record<string, unknown>): {
  values: Record<string, string>;
  errors: Record<string, string>;
} {
  const values: Record<string, string> = {};
  const errors: Record<string, string> = {};

  for (const [key, raw] of Object.entries(input)) {
    if (!KEY_RE.test(key)) { errors[key] = 'Nama pengaturan tidak valid.'; continue; }
    const f = FIELD_BY_KEY[key];
    if (!f) {
      // Kunci di luar skema (data lama): boleh, sebagai teks biasa.
      const v = String(raw ?? '').trim();
      if (v.length > 5000) errors[key] = 'Terlalu panjang (maksimal 5000 karakter).';
      else values[key] = v;
      continue;
    }
    const r = checkField(f, raw);
    if ('error' in r) errors[key] = r.error;
    else values[key] = r.value;
  }
  return { values, errors };
}
