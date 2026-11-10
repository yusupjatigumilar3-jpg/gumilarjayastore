import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: any;
          }>
        ) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login') && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === '/login' && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Teruskan identitas admin yang SUDAH diverifikasi ke layout, supaya layout tidak perlu
  // memanggil Supabase Auth sekali lagi di setiap pindah halaman. Header dari klien
  // selalu dibuang dulu, jadi tidak bisa dipalsukan.
  if (pathname.startsWith('/admin')) {
    const headers = new Headers(request.headers);
    headers.delete('x-admin-uid');
    headers.delete('x-admin-email');
    if (user) {
      headers.set('x-admin-uid', user.id);
      headers.set('x-admin-email', user.email ?? '');
    }
    const forwarded = NextResponse.next({ request: { headers } });
    supabaseResponse.cookies.getAll().forEach((c) => forwarded.cookies.set(c));
    return forwarded;
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
