// ============================================================
//  Types Ã¢â‚¬â€ Gumilar Jaya Store
// ============================================================

// ============ PRODUCTS & CATEGORIES ============
export type ProductType = 'digital' | 'fisik';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category_id: string | null;
  type: ProductType;
  price: number;
  discount_price: number | null;
  description: string;
  image: string | null;
  images: string[];
  stock: number;
  sold: number;
  rating: number;
  download_url: string | null;
  is_featured: boolean;
  is_new: boolean;
  service_type?: string | null;
  requires_manual_price?: boolean;
  default_admin_fee?: number;
  created_at: string;
  updated_at: string;
  // optional join
  category_name?: string;
  category_slug?: string;
}

// ============ TESTIMONIALS ============
export interface Testimonial {
  id: string;
  name: string;
  city: string;
  product_type: string;
  content: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

// ============ FAQS ============
export interface Faq {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

// ============ SETTINGS ============
export interface Setting {
  key: string;
  value: string;
  updated_at: string;
}

export interface SettingsMap {
  [key: string]: string;
}

// ============ SUBSCRIBERS ============
export interface Subscriber {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

// ============ CUSTOMERS ============
export type CustomerIdType = 'pln' | 'internet' | 'pdam' | 'telkom' | 'bpjs' | 'gas' | 'air' | 'lainnya';

export interface CustomerId {
  id: string;
  customer_id: string;
  id_type: CustomerIdType;
  id_label: string;
  id_number: string;
  is_primary: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  customer_code: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  ids?: CustomerId[];
  customer_ids?: CustomerId[];
}

// Data pelanggan yang ikut tampil di kwitansi cetak.
export interface InvoiceCustomerInfo {
  customer_code: string;
  ids: { id_label: string; id_number: string }[];
}

// ============ INVOICES ============
export interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  invoice_date: string;
  due_date: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: 'draft' | 'terkirim' | 'dibayar' | 'batal';
  payment_method: string;
  notes: string;
  public_token: string;
  // V4 - import fields
  external_ref?: string;
  category?: string;
  token_number?: string;
  penalty?: number;
  admin_fee?: number;
  payment_time?: string;
  period?: string;
  import_batch?: string;
  imported_at?: string;
  // V3 - customer relation
  customer_id?: string;
  customer_id_display?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string | null;
  description: string;
  qty: number;
  unit_price: number;
  subtotal: number;
}

// ============ ORDERS ============
export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  items: any[];
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  payment_method: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

// ============ IMPORT LOGS ============
export interface ImportLog {
  id: string;
  batch_id: string;
  import_type: 'customers' | 'invoices';
  filename: string;
  total_rows: number;
  success_rows: number;
  failed_rows: number;
  skipped_rows: number;
  errors: any[];
  created_at: string;
}