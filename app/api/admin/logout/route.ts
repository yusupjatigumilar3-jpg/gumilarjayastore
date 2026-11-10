import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Hanya POST. Dulu GET juga diterima, jadi gambar/tautan di situs lain bisa memaksa admin keluar.
export async function POST(request: Request) {
  const supabase = createClient();
  await supabase.auth.signOut();
  // 303: setelah POST, browser pindah ke /login dengan GET.
  return NextResponse.redirect(new URL('/login', new URL(request.url).origin), 303);
}
