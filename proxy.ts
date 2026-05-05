import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function requiresAuth(pathname: string) {
  return (
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/quotes") ||
    pathname.startsWith("/leads") ||
    pathname.startsWith("/mapping") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/subscribe") ||
    pathname.startsWith("/ai") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/sales")
  );
}

function requiresSubscription(pathname: string) {
  return (
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/quotes") ||
    pathname.startsWith("/leads") ||
    pathname.startsWith("/mapping")
  );
}

function requiresActiveSubscription(pathname: string) {
  return pathname.startsWith("/ai");
}

function isAuthPage(pathname: string) {
  return pathname === "/login" || pathname === "/auth/signup";
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
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
      console.error("Proxy auth error:", userError);
      return redirectTo(request, "/login");
    }

    if (!user && requiresAuth(pathname)) {
      return redirectTo(request, "/login");
    }

    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("subscription_status, onboarding_completed, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Proxy profile check error:", profileError);
        return NextResponse.next();
      }

      const role =
        profile?.role === "admin" || profile?.role === "sales"
          ? profile.role
          : "subscriber";

      if (user && isAuthPage(pathname)) {
        return redirectTo(request, role === "admin" ? "/admin" : role === "sales" ? "/sales" : "/");
      }

      if (pathname.startsWith("/admin") && role !== "admin") {
        return redirectTo(request, role === "sales" ? "/sales" : "/");
      }

      if (pathname.startsWith("/sales") && role !== "sales" && role !== "admin") {
        return redirectTo(request, "/");
      }

      if (pathname === "/" && role === "admin") {
        return redirectTo(request, "/admin");
      }

      if (pathname === "/" && role === "sales") {
        return redirectTo(request, "/sales");
      }

      const onboardingCompleted = Boolean(profile?.onboarding_completed);
      const shouldCheckOnboarding =
        role === "subscriber" &&
        (pathname === "/" ||
        pathname.startsWith("/invoices") ||
        pathname.startsWith("/quotes") ||
        pathname.startsWith("/leads") ||
        pathname.startsWith("/mapping") ||
        pathname.startsWith("/settings") ||
        pathname.startsWith("/subscribe") ||
        pathname.startsWith("/ai"));

      if (!onboardingCompleted && shouldCheckOnboarding && pathname !== "/onboarding") {
        return redirectTo(request, "/onboarding");
      }

      if (onboardingCompleted && pathname === "/onboarding") {
        return redirectTo(request, "/");
      }

      const subscriptionStatus = profile?.subscription_status || "inactive";
      const hasCoreAccess =
        subscriptionStatus === "trialing" || subscriptionStatus === "active";
      const hasAiAccess = subscriptionStatus === "active";

      if (requiresSubscription(pathname) || requiresActiveSubscription(pathname)) {
        if (requiresActiveSubscription(pathname) && !hasAiAccess) {
          return redirectTo(request, "/subscribe");
        }

        if (requiresSubscription(pathname) && !hasCoreAccess) {
          return redirectTo(request, "/subscribe");
        }
      }
    }

    return response;
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.[^/]+$).*)",
  ],
};
