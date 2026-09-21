import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  anonymousRouteAction,
  classifyRoute,
  shouldRedirectAuthenticatedAuthRoute,
} from "@/modules/auth/routing/route-classification";

function redirectWithCookies(location: URL, source: NextResponse): NextResponse {
  const redirected = NextResponse.redirect(location);
  source.cookies.getAll().forEach((cookie) => redirected.cookies.set(cookie));
  return redirected;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestPath = `${pathname}${request.nextUrl.search}`;
  const classification = classifyRoute(pathname);

  if (classification.authority === "legacy-super-admin") {
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

  if (
    user &&
    classification.authority === "auth-flow" &&
    shouldRedirectAuthenticatedAuthRoute(classification.authKind)
  ) {
    return redirectWithCookies(new URL("/dashboard", request.url), response);
  }

  if (!user) {
    const action = anonymousRouteAction(classification);

    if (action === "admin-auth" || action === "super-admin-auth") {
      const loginPath = action === "admin-auth" ? "/auth/admin" : "/auth/vh-teck";
      const loginUrl = new URL(loginPath, request.url);
      loginUrl.searchParams.set("next", requestPath);
      return redirectWithCookies(loginUrl, response);
    }

    if (action === "general-auth") {
      const loginUrl = new URL("/auth", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return redirectWithCookies(loginUrl, response);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|theme-init\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
