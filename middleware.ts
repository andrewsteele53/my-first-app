import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function requiresAuth(pathname: string) {
  return (
    pathname === "/" ||
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/leads") ||
    pathname.startsWith("/mapping") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/subscribe")
  );
}

function requiresSubscription(pathname: string) {
  return pathname.startsWith("/leads") || pathname.startsWith("/mapping");
}

function isAuthPage(pathname: string) {
  return pathname === "/login" || pathname === "/auth/signup";
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.next();
    }

    let response = NextResponse.next({
      request,
    });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError && requiresAuth(pathname)) {
      console.error("Middleware auth error:", userError);
      return redirectTo(request, "/login");
    }

    if (!user && requiresAuth(pathname)) {
      return redirectTo(request, "/login");
    }

    if (user && isAuthPage(pathname)) {
      return redirectTo(request, "/");
    }

    if (user && requiresSubscription(pathname)) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_subscribed")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Middleware subscription check error:", profileError);
        return NextResponse.next();
      }

      const isSubscribed = Boolean(profile?.is_subscribed);

      if (!isSubscribed) {
        return redirectTo(request, "/subscribe");
      }
    }

    return response;
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.[^/]+$).*)",
  ],
};
