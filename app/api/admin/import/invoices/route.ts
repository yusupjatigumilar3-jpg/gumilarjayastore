import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  parseNumber, parseDate, parseTime, normalizeCategory,
  detectIdType, idTypeLabel,
} from '@/lib/import-helpers';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface Row {
  _rowNum?: number;
  external_ref: string;
  invoice_date: string;
  category: string;
  id_number: string;
  customer_name: string;
  address: string;
  token_number: string;
  subtotal: number;
  penalty: number;
  admin_fee: number;
  total: number;
  payment_time: string;
  period: string;
}
export async function POST(request: Request) {
  const s = createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const rows: Row[] = body.rows || [];
  const filename = body.filename || '';
  const batchId = body.batchId || `IMP-INV-${Date.now()}`;
  const chunkIndex = body.chunkIndex ?? 0;
  const isLastChunk = body.isLastChunk !== false;
  const autoCreateCustomer = body.autoCreateCustomer !== false;

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, batch_id: batchId, total: 0, success: 0, failed: 0, skipped: 0, errors: [] });
  }

  const admin = createAdminClient();
  const errors: any[] = [];
  let success = 0;
  let skipped = 0;
  let failed = 0;

  // ---------- STEP 1: Pre-validate + dedup external_refs ----------
  const externalRefs = rows
    .map((r) => (r.external_ref || '').trim())
    .filter((r) => r);

  let existingRefs = new Set<string>();
  if (externalRefs.length > 0) {
    // Batch query — cek yang sudah ada sekaligus
    const { data: existing } = await admin
      .from('invoices')
      .select('external_ref')
      .in('external_ref', externalRefs);
    existing?.forEach((e: any) => existingRefs.add(e.external_ref));
  }

  // ---------- STEP 2: Pre-create customers (batch) ----------
  const customerMap = new Map<string, string>(); // id_number → customer_id

  if (autoCreateCustomer) {
    // Kumpulkan unique (id_number, name, address) pairs
    const uniqueCustomers = new Map<string, { id_number: string; name: string; address: string }>();
    for (const row of rows) {
      const idNum = (row.id_number || '').trim();
      if (idNum && !uniqueCustomers.has(idNum)) {
        uniqueCustomers.set(idNum, {
          id_number: idNum,
          name: row.customer_name.trim(),
          address: row.address || '',
        });
      }
    }

    // Batch query existing customers
    const idNumbers = Array.from(uniqueCustomers.keys());
    if (idNumbers.length > 0) {
      const { data: existingIds } = await admin
        .from('customer_ids')
        .select('id_number, customer_id')
        .in('id_number', idNumbers);

      existingIds?.forEach((ei: any) => {
        customerMap.set(ei.id_number, ei.customer_id);
      });
    }

    // Buat pelanggan yang belum ada (batch insert)
    const toCreate = Array.from(uniqueCustomers.values()).filter((c) => !customerMap.has(c.id_number));

    if (toCreate.length > 0) {
      // Ambil customer codes sekaligus
      const customerCodes: string[] = [];
      for (let i = 0; i < toCreate.length; i++) {
        const { data: code } = await admin.rpc('next_customer_code');
        customerCodes.push(code as unknown as string);
      }

      // Batch insert customers
      const customerRows = toCreate.map((c, i) => ({
        customer_code: customerCodes[i],
        name: c.name,
        email: '',
        phone: '',
        address: c.address,
        notes: '',
      }));

      const { data: newCustomers, error: custErr } = await admin
        .from('customers')
        .insert(customerRows)
        .select('id, name');

      if (custErr) {
        return NextResponse.json({ error: `Gagal buat pelanggan: ${custErr.message}` }, { status: 500 });
      }

      // Map customer_id
      const nameToId = new Map<string, string>();
      newCustomers?.forEach((c: any) => nameToId.set(c.name, c.id));

      // Batch insert customer_ids
      const customerIdsRows = toCreate.map((c) => {
        const idType = detectIdType(c.id_number);
        return {
          customer_id: nameToId.get(c.name)!,
          id_type: idType,
          id_label: idTypeLabel(idType),
          id_number: c.id_number,
          is_primary: true,
        };
      });

      const { error: cidErr } = await admin.from('customer_ids').insert(customerIdsRows);
      if (cidErr) {
        return NextResponse.json({ error: `Gagal buat ID pelanggan: ${cidErr.message}` }, { status: 500 });
      }

      // Update customerMap
      toCreate.forEach((c) => {
        const cid = nameToId.get(c.name);
        if (cid) customerMap.set(c.id_number, cid);
      });
    }
  }

  // ---------- STEP 3: Generate invoice numbers (batch) ----------
  const invoiceNumbers: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const { data: num } = await admin.rpc('next_invoice_number');
    invoiceNumbers.push((num as unknown as string) || `INV/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(chunkIndex * 100 + i + 1).padStart(4, '0')}`);
  }

  // ---------- STEP 4: Batch insert invoices ----------
  const invoiceRows: any[] = [];
  const validRowIndexes: number[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = row._rowNum || (chunkIndex * 100 + i + 2);

    // Validasi
    if (!row.customer_name || !row.customer_name.trim()) {
      errors.push({ row: rowNum, error: 'Nama pelanggan kosong' });
      failed++;
      continue;
    }
    if (!row.invoice_date) {
      errors.push({ row: rowNum, error: 'Tanggal kosong' });
      failed++;
      continue;
    }

    // Skip duplikat
    const extRef = (row.external_ref || '').trim();
    if (extRef && existingRefs.has(extRef)) {
      skipped++;
      continue;
    }

    // Hitung total
    const subtotal = parseNumber(row.subtotal);
    const penalty = parseNumber(row.penalty);
    const adminFee = parseNumber(row.admin_fee);
    const total = parseNumber(row.total) || (subtotal + penalty + adminFee);

    // Customer id
    const idNum = (row.id_number || '').trim();
    const customerId = idNum ? customerMap.get(idNum) || null : null;

    invoiceRows.push({
      invoice_number: invoiceNumbers[i],
      customer_id: customerId,
      customer_id_display: '',
      customer_name: row.customer_name.trim(),
      customer_address: (row.address || '').trim(),
      customer_email: '',
      customer_phone: '',
      invoice_date: parseDate(row.invoice_date),
      due_date: null,
      subtotal,
      discount: 0,
      tax: 0,
      total,
      status: 'dibayar',
      payment_method: '',
      notes: row.period || '',
      external_ref: extRef,
      category: normalizeCategory(row.category || ''),
      token_number: (row.token_number || '').trim(),
      penalty,
      admin_fee: adminFee,
      payment_time: parseTime(row.payment_time),
      period: (row.period || '').trim(),
      import_batch: batchId,
      imported_at: new Date().toISOString(),
    });
    validRowIndexes.push(i);
  }

  if (invoiceRows.length > 0) {
    const { data: insertedInvoices, error: invErr } = await admin
      .from('invoices')
      .insert(invoiceRows)
      .select('id');

    if (invErr) {
      return NextResponse.json({
        ok: false,
        error: invErr.message,
        batch_id: batchId,
        total: rows.length,
        success: 0,
        failed: rows.length,
        skipped: 0,
        errors: [{ row: 'ALL', error: invErr.message }],
      }, { status: 500 });
    }

    // ---------- STEP 5: Batch insert invoice_items ----------
    const itemRows: any[] = [];
    for (let i = 0; i < invoiceRows.length; i++) {
      const inv = invoiceRows[i];
      const invoiceId = insertedInvoices?.[i]?.id;
      if (!invoiceId) continue;

      if (inv.subtotal > 0) {
        itemRows.push({
          invoice_id: invoiceId,
          description: inv.notes || inv.category,
          qty: 1,
          unit_price: inv.subtotal,
          subtotal: inv.subtotal,
        });
      }
      if (inv.admin_fee > 0) {
        itemRows.push({
          invoice_id: invoiceId,
          description: 'Biaya Admin',
          qty: 1,
          unit_price: inv.admin_fee,
          subtotal: inv.admin_fee,
        });
      }
      if (inv.penalty > 0) {
        itemRows.push({
          invoice_id: invoiceId,
          description: 'Denda',
          qty: 1,
          unit_price: inv.penalty,
          subtotal: inv.penalty,
        });
      }
    }

    if (itemRows.length > 0) {
      const { error: itemErr } = await admin.from('invoice_items').insert(itemRows);
      if (itemErr) {
        console.error('Gagal insert items:', itemErr.message);
        // Tidak fail keseluruhan, hanya catat
      }
    }

    success = invoiceRows.length;
  }

  // ---------- STEP 6: Log hasil (hanya chunk terakhir) ----------
  if (isLastChunk) {
    await admin.from('import_logs').insert({
      batch_id: batchId,
      import_type: 'invoices',
      filename,
      total_rows: rows.length,
      success_rows: success,
      failed_rows: failed,
      skipped_rows: skipped,
      errors: errors.slice(0, 100),
      created_by: user.id,
    });
  }

  return NextResponse.json({
    ok: true,
    batch_id: batchId,
    chunk_index: chunkIndex,
    total: rows.length,
    success,
    failed,
    skipped,
    errors: errors.slice(0, 20),
  });
}