import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { GARAGE_RESERVED } from "@/lib/garage-routes";

function isPublicGaragePath(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "garage") return false;
  if (parts[1] === "discover" && parts.length === 2) return true;
  // /garage/[username]
  if (parts.length === 2 && !GARAGE_RESERVED.has(parts[1])) return true;
  // /garage/builds/[id]
  if (parts[1] === "builds" && parts.length === 3) return true;
  // /garage/[username]/vehicles/[id]
  if (
    parts.length === 4 &&
    !GARAGE_RESERVED.has(parts[1]) &&
    parts[2] === "vehicles"
  ) {
    return true;
  }
  // /garage/[username]/gallery|followers|following
  if (
    parts.length === 3 &&
    !GARAGE_RESERVED.has(parts[1]) &&
    (parts[2] === "gallery" ||
      parts[2] === "followers" ||
      parts[2] === "following")
  ) {
    return true;
  }
  return false;
}

function requiresAuth(pathname: string): boolean {
  if (pathname.startsWith("/admin")) return true;
  if (!pathname.startsWith("/garage")) return false;
  if (pathname.startsWith("/garage/sign-in")) return false;
  if (pathname.startsWith("/garage/sign-up")) return false;
  // Shopify Storefront cart — guests can checkout without a Garage account.
  if (pathname === "/garage/cart" || pathname.startsWith("/garage/cart/")) {
    return false;
  }
  if (isPublicGaragePath(pathname)) return false;
  return true;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthPage =
    pathname.startsWith("/garage/sign-in") ||
    pathname.startsWith("/garage/sign-up");
  const isOnboarding = pathname.startsWith("/garage/onboarding");
  const isCallback = pathname.startsWith("/auth/callback");

  if (!user && requiresAuth(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/garage/sign-in";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/garage";
    return NextResponse.redirect(redirectUrl);
  }

  if (
    user &&
    !isOnboarding &&
    !isCallback &&
    !isAuthPage &&
    pathname.startsWith("/garage")
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, username")
      .eq("id", user.id)
      .maybeSingle();

    if (profile && (!profile.onboarding_completed || !profile.username)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/garage/onboarding";
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (user && isOnboarding) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, username")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.onboarding_completed && profile.username) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/garage";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
