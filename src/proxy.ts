import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // No user — let the request through (auth pages handle unauthenticated state)
  if (!user) return supabaseResponse;

  // Always-allowed paths — auth, API, and the legal/consent surfaces.
  // /accept-terms must be reachable even when terms aren't accepted; the legal
  // pages must be reachable so users can read them before consenting.
  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/medical-disclaimer')
  ) {
    return supabaseResponse;
  }

  // Consent gate — every authenticated user must have accepted terms.
  const meta = (user.user_metadata ?? {}) as { terms_accepted?: boolean };
  const termsAccepted = meta.terms_accepted === true;
  const onAcceptTerms = pathname === '/accept-terms';

  if (!termsAccepted && !onAcceptTerms) {
    return NextResponse.redirect(new URL('/accept-terms', request.url));
  }
  if (termsAccepted && onAcceptTerms) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded')
    .eq('id', user.id)
    .single();

  const onboarded = profile?.onboarded === true;
  const onOnboarding = pathname === '/onboarding';

  if (!onboarded && !onOnboarding) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  if (onboarded && onOnboarding) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
