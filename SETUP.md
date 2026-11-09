# Setup: Supabase + Vercel

Aplikasi ini butuh **4 environment variable**. Tanpa tiga yang pertama, halaman toko kosong dan login admin gagal.

| Variable | Isi | Rahasia? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL, mis. `https://abcd1234.supabase.co` | Tidak |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Kunci `anon` / *publishable* | Tidak (terlihat di browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Kunci `service_role` / *secret* | **YA. Jangan dibagikan atau di-commit** |
| `NEXT_PUBLIC_SITE_URL` | Domain situs, mis. `https://gumilarjayastore.vercel.app` (tanpa `/` di akhir) | Tidak |

Opsional: `NEXT_PUBLIC_WHATSAPP` (nomor WhatsApp di halaman produk).

## Urutan setup

1. **Buat tabel.** Supabase → **SQL Editor** → New query → tempel isi `supabase/schema.sql` → **Run**.
   Aman dijalankan berulang dan aman untuk database yang sudah berisi data.
2. **Ambil kunci.** Supabase → **Project Settings → API** (atau **API Keys**). Salin Project URL, kunci `anon`/publishable, dan kunci `service_role`/secret.
3. **Isi di Vercel.** Project → **Settings → Environment Variables** → tambahkan keempat variable di atas untuk **Production, Preview, dan Development**. Tandai `SUPABASE_SERVICE_ROLE_KEY` sebagai *Sensitive*.
4. **Deploy ulang.** Vercel → **Deployments** → titik tiga pada deployment terbaru → **Redeploy**.
   Wajib: variable `NEXT_PUBLIC_*` dibaca saat build, jadi mengubahnya tanpa redeploy tidak berefek.
5. **Buat akun admin.** Supabase → **Authentication → Users → Add user → Create new user** → isi email dan password → centang **Auto Confirm User**.
6. **Tutup pendaftaran terbuka.** Supabase → **Authentication → Sign In / Providers** → matikan **Allow new users to sign up**. Kalau tidak, siapa pun bisa mendaftar dan masuk ke panel admin.
7. **(Opsional) Nama di panel admin.** Jalankan di SQL Editor:
   ```sql
   insert into admin_profiles (id, username, full_name)
   select id, 'admin', 'Nama Anda' from auth.users where email = 'email-admin@anda.com'
   on conflict (id) do update set full_name = excluded.full_name;
   ```
8. **Isi data toko.** Menu admin belum punya tombol tambah kategori. Tambahkan lewat Supabase → **Table Editor → categories**, atau pakai contoh yang di-comment di akhir `supabase/schema.sql`.

## Cek apakah sudah terhubung

- Buka `https://domain-anda/login` dan masuk dengan akun dari langkah 5. Berhasil masuk ke `/admin` berarti URL dan anon key benar.
- Buka **Admin → Pengaturan** lalu simpan. Berhasil berarti service role key dan tabel `settings` benar.
- Buat satu kwitansi di **Admin → Kwitansi**. Nomornya `GJS/TAHUN/BULAN/0001`.

## Pesan error yang sering muncul

| Pesan | Penyebab |
|---|---|
| `Supabase URL atau SERVICE_ROLE_KEY tidak diset di environment` | Variable belum diisi di Vercel, atau belum redeploy |
| `Email atau password salah.` | Akun belum dibuat (langkah 5), atau belum Auto Confirm |
| `relation "..." does not exist` | `supabase/schema.sql` belum dijalankan |
| `Invalid API key` | Kunci salah salin, atau tertukar antara anon dan service_role |
| `permission denied` / data toko kosong padahal tabel terisi | Bagian keamanan (RLS) di `schema.sql` belum dijalankan lengkap |

## Catatan keamanan

- Semua tabel memakai Row Level Security. Pengunjung (anon key) hanya bisa membaca etalase toko: produk, kategori, testimoni dan FAQ aktif, serta pengaturan. Data pelanggan, kwitansi, dan pelanggan newsletter hanya bisa diakses lewat service role (server Vercel).
- Kolom `download_url` produk ikut terbaca publik karena halaman toko memakai `select('*')`. Jangan taruh link unduhan berbayar di sana sebelum alur pembayaran dibuat.
- Kolom `tax` di tabel `invoices` dipakai sebagai **Biaya Admin**.
