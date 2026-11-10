import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Dipakai semua API admin. Satu tempat untuk cek login, jadi tidak ada route yang lupa.
export async function getAdminUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function serverError(message: string) {
  return NextResponse.json({ error: message }, { status: 500 });
}

// Body JSON yang rusak jadi null, bukan melempar error 500.
export async function readJson(request: Request): Promise<Record<string, any> | null> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}
