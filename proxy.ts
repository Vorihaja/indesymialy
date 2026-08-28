import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/", "/auth", "/news", "/events", "/fighters", "/clubs", "/disciplines",
  "/annuaire", "/actualites", "/legal", "/contact", "/faq", "/support",
  "/marketplace", "/search",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) =>
    path === "/" ? pathname === path : pathname === path || pathname.startsWith(`${path}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
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

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (user && pathname.startsWith("/auth") && !pathname.startsWith("/auth/callback")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!user && !isPublicPath(pathname)) {
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
