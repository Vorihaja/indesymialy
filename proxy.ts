import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/", "/auth", "/news", "/events", "/fighters", "/clubs", "/disciplines",
  "/annuaire", "/actualites", "/legal", "/contact", "/faq", "/support",
  "/marketplace", "/search", "/rankings", "/media",
];

const PRIVATE_ROOT_PATHS = new Set([
  "/account", "/admin", "/dashboard", "/vh-teck", "/korana",
  "/onboarding", "/role-requests", "/messages", "/notifications",
]);

function isPublicIdentifierPath(pathname: string) {
  return /^\/[a-z0-9](?:[a-z0-9-]{0,62})$/i.test(pathname) && !PRIVATE_ROOT_PATHS.has(pathname);
}

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) =>
    path === "/" ? pathname === path : pathname === path || pathname.startsWith(`${path}/`),
  );
}

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/") ||
    pathname === "/dashboard/admin" || pathname.startsWith("/dashboard/admin/");
}

function isSuperAdminPath(pathname: string) {
  return pathname === "/vh-teck" || pathname.startsWith("/vh-teck/");
}

function redirectWithCookies(location: URL, source: NextResponse): NextResponse {
  const redirected = NextResponse.redirect(location);
  source.cookies.getAll().forEach((cookie) => redirected.cookies.set(cookie));
  return redirected;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestPath = `${pathname}${request.nextUrl.search}`;
  const isLegacySuperAdminPath =
    pathname === "/dashboard/super-admin" ||
    pathname.startsWith("/dashboard/super-admin/") ||
    pathname === "/dashboard/super-admi" ||
    pathname.startsWith("/dashboard/super-admi/");

  if (isLegacySuperAdminPath) {
    return new NextResponse("Page introuvable", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-indesy-request-path", requestPath);
  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isPrivateAuthPath =
    pathname === "/auth/admin" || pathname.startsWith("/auth/admin/") ||
    pathname === "/auth/vh-teck" || pathname.startsWith("/auth/vh-teck/");

  if (
    user &&
    pathname.startsWith("/auth") &&
    !pathname.startsWith("/auth/callback") &&
    !isPrivateAuthPath
  ) {
    return redirectWithCookies(new URL("/dashboard", request.url), response);
  }

  if (!user && isAdminPath(pathname)) {
    const loginUrl = new URL("/auth/admin", request.url);
    loginUrl.searchParams.set("next", requestPath);
    return redirectWithCookies(loginUrl, response);
  }

  if (!user && isSuperAdminPath(pathname)) {
    const loginUrl = new URL("/auth/vh-teck", request.url);
    loginUrl.searchParams.set("next", requestPath);
    return redirectWithCookies(loginUrl, response);
  }

  if (!user && !isPublicPath(pathname) && !isPublicIdentifierPath(pathname)) {
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return redirectWithCookies(loginUrl, response);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|theme-init\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
