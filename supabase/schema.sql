-- ============================================================
--  GUMILAR JAYA STORE — Skema database lengkap (Supabase / PostgreSQL)
--
--  Cara pakai: Supabase Dashboard -> SQL Editor -> New query ->
--  tempel seluruh isi file ini -> Run.
--
--  AMAN DIJALANKAN BERULANG dan aman untuk database yang sudah berisi:
--    * tabel dibuat hanya bila belum ada (create table if not exists)
--    * kolom yang kurang ditambahkan (add column if not exists)
--    * data yang sudah ada tidak dihapus atau diubah
--
--  Isi:
--    1. Tabel
--    2. Kolom tambahan untuk database lama
--    3. Index
--    4. Fungsi nomor otomatis (kwitansi & kode pelanggan) + trigger updated_at
--    5. Keamanan (Row Level Security)
--    6. Storage bucket gambar produk
--    7. Data awal pengaturan
-- ============================================================


-- ============================================================
--  1. TABEL
-- ============================================================

-- ---------- Toko ----------
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text not null default '',
  icon        text not null default '',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists products (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  slug                  text not null unique,
  category_id           uuid references categories(id) on delete set null,
  type                  text not null default 'digital' check (type in ('digital', 'fisik')),
  price                 bigint not null default 0 check (price >= 0),
  discount_price        bigint check (discount_price is null or discount_price >= 0),
  description           text not null default '',
  image                 text,
  images                text[] not null default '{}',
  stock                 integer not null default 0,
  sold                  integer not null default 0,
  rating                numeric(2,1) not null default 0 check (rating between 0 and 5),
  download_url          text,
  is_featured           boolean not null default false,
  is_new                boolean not null default false,
  service_type          text,
  requires_manual_price boolean not null default false,
  default_admin_fee     bigint not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table if not exists testimonials (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  city         text not null default '',
  product_type text not null default '',
  content      text not null,
  sort_order   integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists faqs (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  answer     text not null,
  sort_order integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- Belum ada alur checkout di aplikasi; halaman admin "Pesanan" sudah membacanya.
create table if not exists orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique,
  customer_name    text not null,
  customer_email   text not null default '',
  customer_phone   text not null default '',
  customer_address text not null default '',
  items            jsonb not null default '[]'::jsonb,
  subtotal         bigint not null default 0,
  discount         bigint not null default 0,
  total            bigint not null default 0,
  status           text not null default 'pending',
  payment_method   text not null default '',
  notes            text not null default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------- Pelanggan ----------
create table if not exists customers (
  id            uuid primary key default gen_random_uuid(),
  customer_code text not null unique,
  name          text not null,
  email         text not null default '',
  phone         text not null default '',
  address       text not null default '',
  notes         text not null default '',
  is_archived   boolean not null default false,   -- "hapus" di aplikasi = arsip
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Satu pelanggan bisa punya banyak nomor ID (PLN, PDAM, BPJS, dst.)
create table if not exists customer_ids (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  id_type     text not null default 'lainnya'
              check (id_type in ('pln','internet','pdam','telkom','bpjs','gas','air','lainnya')),
  id_label    text not null default 'ID',
  id_number   text not null,
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------- Kwitansi ----------
create table if not exists invoices (
  id                  uuid primary key default gen_random_uuid(),
  invoice_number      text not null unique,
  -- Token acak untuk link publik /invoice/[token]; tidak bisa ditebak dari nomor kwitansi.
  public_token        text not null unique default replace(gen_random_uuid()::text, '-', ''),
  customer_id         uuid references customers(id) on delete set null,
  customer_id_display text not null default '',
  -- Data pelanggan disalin ke kwitansi agar cetakan lama tidak berubah saat profil diedit.
  customer_name       text not null,
  customer_email      text not null default '',
  customer_phone      text not null default '',
  customer_address    text not null default '',
  invoice_date        date not null default ((now() at time zone 'Asia/Jakarta')::date),
  due_date            date,
  subtotal            bigint not null default 0,
  discount            bigint not null default 0,
  tax                 bigint not null default 0,   -- PENTING: kolom ini dipakai sebagai BIAYA ADMIN
  total               bigint not null default 0,
  status              text not null default 'draft'
                      check (status in ('draft', 'terkirim', 'dibayar', 'batal')),
  payment_method      text not null default '',
  payment_type        text not null default 'tunai' check (payment_type in ('tunai', 'non_tunai')),
  notes               text not null default '',
  -- Kolom hasil import Excel
  external_ref        text not null default '',
  category            text not null default '',
  token_number        text not null default '',
  penalty             bigint not null default 0,
  admin_fee           bigint not null default 0,
  payment_time        text not null default '',
  period              text not null default '',
  import_batch        text,
  imported_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists invoice_items (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references invoices(id) on delete cascade,
  product_id  uuid references products(id) on delete set null,
  description text not null,
  qty         integer not null default 1 check (qty >= 1),
  unit_price  bigint not null default 0,
  subtotal    bigint not null default 0,
  admin_fee   bigint not null default 0,
  penalty     bigint not null default 0,
  -- clock_timestamp() berbeda tiap baris, jadi urutan item = urutan input (id UUID itu acak).
  created_at  timestamptz not null default clock_timestamp()
);

-- ---------- Admin & sistem ----------
create table if not exists admin_profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text unique,
  full_name  text,
  created_at timestamptz not null default now()
);

create table if not exists import_logs (
  id           uuid primary key default gen_random_uuid(),
  batch_id     text not null,
  import_type  text not null check (import_type in ('customers', 'invoices')),
  filename     text not null default '',
  total_rows   integer not null default 0,
  success_rows integer not null default 0,
  failed_rows  integer not null default 0,
  skipped_rows integer not null default 0,
  errors       jsonb not null default '[]'::jsonb,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- Penghitung nomor otomatis (satu baris per bulan untuk kwitansi, satu untuk kode pelanggan)
create table if not exists doc_counters (
  key        text primary key,
  last_value integer not null default 0
);


-- ============================================================
--  2. KOLOM TAMBAHAN UNTUK DATABASE LAMA
--  (tidak berefek bila kolomnya sudah ada)
-- ============================================================

alter table products add column if not exists images                text[]  not null default '{}';
alter table products add column if not exists sold                  integer not null default 0;
alter table products add column if not exists rating                numeric(2,1) not null default 0;
alter table products add column if not exists service_type          text;
alter table products add column if not exists requires_manual_price boolean not null default false;
alter table products add column if not exists default_admin_fee     bigint  not null default 0;
alter table products add column if not exists updated_at            timestamptz not null default now();

alter table customers add column if not exists is_archived boolean     not null default false;
alter table customers add column if not exists updated_at  timestamptz not null default now();

alter table invoices add column if not exists customer_id         uuid references customers(id) on delete set null;
alter table invoices add column if not exists customer_id_display text   not null default '';
alter table invoices add column if not exists payment_type        text   not null default 'tunai';
alter table invoices add column if not exists external_ref        text   not null default '';
alter table invoices add column if not exists category            text   not null default '';
alter table invoices add column if not exists token_number        text   not null default '';
alter table invoices add column if not exists penalty             bigint not null default 0;
alter table invoices add column if not exists admin_fee           bigint not null default 0;
alter table invoices add column if not exists payment_time        text   not null default '';
alter table invoices add column if not exists period              text   not null default '';
alter table invoices add column if not exists import_batch        text;
alter table invoices add column if not exists imported_at         timestamptz;
alter table invoices add column if not exists updated_at          timestamptz not null default now();

alter table invoice_items add column if not exists product_id uuid references products(id) on delete set null;
alter table invoice_items add column if not exists admin_fee  bigint not null default 0;
alter table invoice_items add column if not exists penalty    bigint not null default 0;
alter table invoice_items add column if not exists created_at timestamptz not null default clock_timestamp();

-- Token publik: isi untuk kwitansi lama yang belum punya, lalu wajibkan.
alter table invoices add column if not exists public_token text;
update invoices set public_token = replace(gen_random_uuid()::text, '-', '') where public_token is null;
alter table invoices alter column public_token set default replace(gen_random_uuid()::text, '-', '');
alter table invoices alter column public_token set not null;
create unique index if not exists uq_invoices_public_token on invoices(public_token);


-- ============================================================
--  3. INDEX
-- ============================================================

create index if not exists idx_categories_sort        on categories(sort_order);

create index if not exists idx_products_created_at    on products(created_at desc);
create index if not exists idx_products_featured      on products(is_featured);
create index if not exists idx_products_new           on products(is_new);
create index if not exists idx_products_type          on products(type);
create index if not exists idx_products_category      on products(category_id);

create index if not exists idx_customers_created_at   on customers(created_at desc);
create index if not exists idx_customers_active       on customers(created_at desc) where is_archived = false;
create index if not exists idx_customer_ids_number    on customer_ids(id_number);
create index if not exists idx_customer_ids_customer  on customer_ids(customer_id);

create index if not exists idx_invoices_invoice_date  on invoices(invoice_date desc);
create index if not exists idx_invoices_created_at    on invoices(created_at desc);
create index if not exists idx_invoices_customer_id   on invoices(customer_id);
create index if not exists idx_invoices_status        on invoices(status);
create index if not exists idx_invoices_category      on invoices(category);
create index if not exists idx_invoices_external_ref  on invoices(external_ref) where external_ref <> '';

create index if not exists idx_invoice_items_invoice  on invoice_items(invoice_id, created_at);

create index if not exists idx_subscribers_created_at on subscribers(created_at desc);
create index if not exists idx_testimonials_sort      on testimonials(sort_order);
create index if not exists idx_faqs_sort              on faqs(sort_order);
create index if not exists idx_import_logs_created_at on import_logs(created_at desc);


-- ============================================================
--  4. FUNGSI & TRIGGER
-- ============================================================

-- updated_at otomatis
create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_products_updated  on products;
create trigger trg_products_updated  before update on products  for each row execute function set_updated_at();
drop trigger if exists trg_customers_updated on customers;
create trigger trg_customers_updated before update on customers for each row execute function set_updated_at();
drop trigger if exists trg_invoices_updated  on invoices;
create trigger trg_invoices_updated  before update on invoices  for each row execute function set_updated_at();
drop trigger if exists trg_orders_updated    on orders;
create trigger trg_orders_updated    before update on orders    for each row execute function set_updated_at();
drop trigger if exists trg_settings_updated  on settings;
create trigger trg_settings_updated  before update on settings  for each row execute function set_updated_at();

-- Nomor kwitansi otomatis: GJS/TAHUN/BULAN/0001 (bulan menurut WIB, urutan reset tiap bulan).
-- Aman untuk permintaan bersamaan: penghitung dikunci per baris, jadi tidak ada nomor kembar.
-- Dipanggil aplikasi lewat .rpc('next_invoice_number').
create or replace function next_invoice_number()
returns text
language plpgsql
set search_path = public
as $$
declare
  v_ym     text := to_char(now() at time zone 'Asia/Jakarta', 'YYYY/MM');
  v_key    text := 'invoice:' || to_char(now() at time zone 'Asia/Jakarta', 'YYYY-MM');
  v_prefix text := 'GJS/' || to_char(now() at time zone 'Asia/Jakarta', 'YYYY/MM') || '/';
  v_seed   integer;
  v_next   integer;
begin
  update doc_counters set last_value = last_value + 1
   where key = v_key
   returning last_value into v_next;

  if v_next is null then
    -- Bulan ini belum punya penghitung: mulai dari nomor tertinggi yang sudah ada
    -- (kwitansi bernomor manual atau hasil import ikut diperhitungkan).
    select coalesce(max(substring(invoice_number from char_length(v_prefix) + 1)::integer), 0)
      into v_seed
      from invoices
     where invoice_number like v_prefix || '%'
       and substring(invoice_number from char_length(v_prefix) + 1) ~ '^[0-9]{1,9}$';

    insert into doc_counters as c (key, last_value)
    values (v_key, v_seed + 1)
    on conflict (key) do update set last_value = c.last_value + 1
    returning c.last_value into v_next;
  end if;

  return v_prefix || lpad(v_next::text, 4, '0');
end;
$$;

revoke all on function next_invoice_number() from public, anon, authenticated;
grant execute on function next_invoice_number() to service_role;

-- Kode pelanggan otomatis: CUS-00001.
-- Hanya dibuat bila BELUM ada, supaya format kode lama di database Anda tidak berubah.
do $outer$
begin
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'next_customer_code'
  ) then
    execute $fn$
      create function next_customer_code()
      returns text
      language plpgsql
      set search_path = public
      as $body$
      declare
        v_seed integer;
        v_next integer;
      begin
        update doc_counters set last_value = last_value + 1
         where key = 'customer'
         returning last_value into v_next;

        if v_next is null then
          select coalesce(max(substring(customer_code from 5)::integer), 0)
            into v_seed
            from customers
           where customer_code ~ '^CUS-[0-9]{1,9}$';

          insert into doc_counters as c (key, last_value)
          values ('customer', v_seed + 1)
          on conflict (key) do update set last_value = c.last_value + 1
          returning c.last_value into v_next;
        end if;

        return 'CUS-' || lpad(v_next::text, 5, '0');
      end;
      $body$
    $fn$;
    execute 'revoke all on function next_customer_code() from public, anon, authenticated';
    execute 'grant execute on function next_customer_code() to service_role';
  end if;
end
$outer$;


-- ============================================================
--  5. KEAMANAN (Row Level Security)
--
--  NEXT_PUBLIC_SUPABASE_ANON_KEY terlihat oleh semua pengunjung situs.
--  Karena itu semua tabel dikunci, dan hanya data etalase toko yang boleh dibaca
--  publik. Panel admin & API memakai SUPABASE_SERVICE_ROLE_KEY yang melewati RLS.
--  Tabel tanpa policy (customers, invoices, subscribers, dst.) hanya bisa
--  diakses lewat service role, jadi data pelanggan & kwitansi tidak bocor.
-- ============================================================

alter table categories     enable row level security;
alter table products       enable row level security;
alter table testimonials   enable row level security;
alter table faqs           enable row level security;
alter table settings       enable row level security;
alter table subscribers    enable row level security;
alter table orders         enable row level security;
alter table customers      enable row level security;
alter table customer_ids   enable row level security;
alter table invoices       enable row level security;
alter table invoice_items  enable row level security;
alter table admin_profiles enable row level security;
alter table import_logs    enable row level security;
alter table doc_counters   enable row level security;

-- Dibaca publik (halaman toko memakai anon key)
drop policy if exists "public read categories" on categories;
create policy "public read categories" on categories for select to anon, authenticated using (true);

drop policy if exists "public read products" on products;
create policy "public read products" on products for select to anon, authenticated using (true);

drop policy if exists "public read active testimonials" on testimonials;
create policy "public read active testimonials" on testimonials for select to anon, authenticated using (is_active);

drop policy if exists "public read active faqs" on faqs;
create policy "public read active faqs" on faqs for select to anon, authenticated using (is_active);

drop policy if exists "public read settings" on settings;
create policy "public read settings" on settings for select to anon, authenticated using (true);

-- Admin yang login boleh membaca profilnya sendiri (dipakai layout admin)
drop policy if exists "read own admin profile" on admin_profiles;
create policy "read own admin profile" on admin_profiles for select to authenticated using (id = auth.uid());


-- ============================================================
--  6. STORAGE: bucket gambar produk (dipakai /api/admin/upload)
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;


-- ============================================================
--  7. DATA AWAL PENGATURAN
--  Tidak menimpa nilai yang sudah Anda ubah di menu Pengaturan.
-- ============================================================

insert into settings (key, value) values
  ('site_name',            'Gumilar Jaya Store'),
  ('site_tagline',         'Produk digital & fisik, dipilih satu per satu.'),
  ('site_description',     'Template, e-book, apparel, hingga kopi specialty.'),
  ('contact_email',        'halo@gumilarjaya.store'),
  ('contact_whatsapp',     ''),
  ('social_instagram',     ''),
  ('social_tiktok',        ''),
  ('hero_eyebrow',         'Marketplace terkurasi · Sejak 2019'),
  ('hero_title',           'Produk digital & fisik, dipilih satu per satu.'),
  ('hero_subtitle',        'Template, e-book, apparel, hingga kopi specialty.'),
  ('stat_customers',       '12.400+'),
  ('stat_products',        '380+'),
  ('stat_rating',          '4,9/5'),
  ('stat_ontime',          '98%'),
  ('brand_logo_text',      'GJ'),
  ('brand_tagline',        'Melayani dengan aman & tenang'),
  ('brand_address',        'Garut, Jawa Barat, Indonesia'),
  ('brand_bank_name',      'BCA'),
  ('brand_bank_account',   '1234567890'),   -- CONTOH: ganti di menu Pengaturan sebelum mencetak kwitansi
  ('brand_bank_holder',    'Gumilar Jaya Store'),
  ('invoice_footer_note',  'Bukti pembayaran ini merupakan Kwitansi Pembayaran yang sah.'),
  ('invoice_thank_you',    'Terima kasih atas kepercayaan Anda.'),
  ('invoice_strip_text',   'Transaksi Aman, Hati Tenang'),
  ('invoice_primary_color','#2563eb'),
  ('invoice_accent_color', '#10b981')
on conflict (key) do nothing;

-- Kategori contoh (hapus tanda -- bila ingin dipakai; belum ada menu tambah kategori di admin):
-- insert into categories (name, slug, description, icon, sort_order) values
--   ('Template',  'template',  'Template siap pakai',        '📐', 1),
--   ('E-book',    'e-book',    'Buku digital',               '📘', 2),
--   ('Apparel',   'apparel',   'Pakaian & merchandise',      '👕', 3),
--   ('Kopi',      'kopi',      'Kopi specialty',             '☕', 4)
-- on conflict (slug) do nothing;


-- ============================================================
--  CEK HASIL (opsional, jalankan terpisah setelah di atas berhasil)
--
--  select c.relname as tabel, c.relrowsecurity as rls_aktif
--    from pg_class c join pg_namespace n on n.oid = c.relnamespace
--   where n.nspname = 'public' and c.relkind = 'r' order by 1;
--
--  select next_invoice_number();   -- contoh: GJS/2026/11/0001
-- ============================================================
