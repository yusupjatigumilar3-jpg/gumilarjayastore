// Validasi input pelanggan (dipakai POST dan PATCH) supaya aturannya satu dan sama.

const ID_TYPES = ['pln', 'internet', 'pdam', 'telkom', 'bpjs', 'gas', 'air', 'lainnya'];

export type CustomerFields = {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
};

export type CustomerIdRow = {
  customer_id: string;
  id_type: string;
  id_label: string;
  id_number: string;
  is_primary: boolean;
};

const clip = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

export function parseCustomer(
  body: Record<string, any>
): { ok: true; value: CustomerFields } | { ok: false; error: string } {
  const name = clip(body.name, 200);
  if (!name) return { ok: false, error: 'Nama pelanggan wajib diisi.' };

  const email = clip(body.email, 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Format email tidak valid.' };
  }

  return {
    ok: true,
    value: {
      name,
      email,
      phone: clip(body.phone, 50),
      address: clip(body.address, 500),
      notes: clip(body.notes, 2000),
    },
  };
}

// Ubah daftar ID dari form menjadi baris tabel; baris tanpa nomor dibuang, nomor kembar dilewati.
export function buildIdRows(raw: unknown, customerId: string): CustomerIdRow[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const rows: CustomerIdRow[] = [];
  for (const i of raw) {
    const number = clip(i?.id_number, 100);
    if (!number) continue;
    const type = ID_TYPES.includes(i?.id_type) ? i.id_type : 'lainnya';
    const key = `${type}:${number}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      customer_id: customerId,
      id_type: type,
      id_label: clip(i?.id_label, 60) || 'ID',
      id_number: number,
      is_primary: rows.length === 0,
    });
  }
  return rows;
}
