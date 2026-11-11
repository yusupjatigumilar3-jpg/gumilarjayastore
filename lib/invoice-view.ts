import { createAdminClient } from '@/lib/supabase/admin';
import type { InvoiceCustomerInfo } from '@/lib/types';

// Data pelanggan yang ikut dicetak di kwitansi: kode pelanggan dan ID pelanggan (ID PLN, dst.).
// Diambil dari data pelanggan terkini; kwitansi lama tanpa pelanggan tertaut mengembalikan undefined.
export async function loadInvoiceCustomer(
  admin: ReturnType<typeof createAdminClient>,
  customerId: string | null | undefined
): Promise<InvoiceCustomerInfo | undefined> {
  if (!customerId) return undefined;

  const { data } = await admin
    .from('customers')
    .select('customer_code, customer_ids(id_label, id_number, is_primary, created_at)')
    .eq('id', customerId)
    .maybeSingle();
  if (!data) return undefined;

  const ids = ((data as any).customer_ids || []) as {
    id_label: string;
    id_number: string;
    is_primary: boolean;
    created_at: string;
  }[];
  ids.sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.created_at.localeCompare(b.created_at));

  return {
    customer_code: (data as any).customer_code || '',
    ids: ids.map((i) => ({ id_label: i.id_label, id_number: i.id_number })),
  };
}
