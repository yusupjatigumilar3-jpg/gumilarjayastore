import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminUser, unauthorized, badRequest, serverError } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Ekstensi diambil dari tipe file yang sudah divalidasi, bukan dari nama file buatan pengguna.
const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export async function POST(request: Request) {
  try {
    if (!(await getAdminUser())) return unauthorized();

    const fd = await request.formData();
    const file = fd.get('file');

    if (!file || typeof file === 'string') return badRequest('File tidak ada');
    if (file.size > 5 * 1024 * 1024) return badRequest('File maksimal 5MB');

    const ext = EXT_BY_TYPE[file.type];
    if (!ext) return badRequest('Hanya JPG, PNG, WEBP, GIF');

    const admin = createAdminClient();
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadErr } = await admin.storage
      .from('products')
      .upload(filename, buffer, { contentType: file.type, upsert: false });

    if (uploadErr) {
      console.error('Upload error:', uploadErr);
      return serverError(uploadErr.message);
    }

    const { data } = admin.storage.from('products').getPublicUrl(filename);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err: any) {
    console.error('Upload error:', err);
    return serverError(err.message || 'Gagal upload');
  }
}
