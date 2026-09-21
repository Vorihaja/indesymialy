const PUBLIC_ROUTE_ROOTS = [
  "/",
  "/auth",
  "/news",
  "/events",
  "/fighters",
  "/clubs",
  "/disciplines",
  "/annuaire",
  "/actualites",
  "/legal",
  "/contact",
  "/faq",
  "/support",
  "/marketplace",
  "/search",
  "/rankings",
  "/media",
] as const;

const PRIVATE_ROOT_PATHS = new Set([
  "/account",
  "/admin",
  "/dashboard",
  "/vh-teck",
  "/korana",
  "/onboarding",
  "/role-requests",
  "/messages",
  "/notifications",
]);

export type AuthRouteKind =
  | "none"
  | "general"
  | "callback"
  | "admin-entry"
  | "super-admin-entry"
  | "super-admin-mfa";

export type RouteAuthority =
  | "public"
  | "auth-flow"
  | "private"
  | "admin-private"
  | "super-admin-private"
  | "legacy-super-admin";

export type RouteClassification = {
  authority: RouteAuthority;
  authKind: AuthRouteKind;
};

export type AnonymousRouteAction =
  | "allow"
  | "general-auth"
  | "admin-auth"
  | "super-admin-auth";

function isRouteFamily(pathname: string, root: string): boolean {
  return pathname === root || pathname.startsWith(`${root}/`);
}

function isPublicIdentifierPath(pathname: string): boolean {
  return /^\/[a-z0-9](?:[a-z0-9-]{0,62})$/i.test(pathname)
    && !PRIVATE_ROOT_PATHS.has(pathname);
}

function isGeneralPublicPath(pathname: string): boolean {
  return PUBLIC_ROUTE_ROOTS.some((root) =>
    root === "/" ? pathname === root : isRouteFamily(pathname, root),
  );
}

export function classifyAuthRoute(pathname: string): AuthRouteKind {
  if (!isRouteFamily(pathname, "/auth")) return "none";
  if (isRouteFamily(pathname, "/auth/callback")) return "callback";
  if (isRouteFamily(pathname, "/auth/vh-teck/mfa")) return "super-admin-mfa";
  if (isRouteFamily(pathname, "/auth/vh-teck")) return "super-admin-entry";
  if (isRouteFamily(pathname, "/auth/admin")) return "admin-entry";
  return "general";
}

export function classifyRoute(pathname: string): RouteClassification {
  if (
    isRouteFamily(pathname, "/dashboard/super-admin")
    || isRouteFamily(pathname, "/dashboard/super-admi")
  ) {
    return { authority: "legacy-super-admin", authKind: "none" };
  }

  const authKind = classifyAuthRoute(pathname);
  if (authKind !== "none") return { authority: "auth-flow", authKind };

  if (isRouteFamily(pathname, "/admin") || isRouteFamily(pathname, "/dashboard/admin")) {
    return { authority: "admin-private", authKind: "none" };
  }

  if (isRouteFamily(pathname, "/vh-teck")) {
    return { authority: "super-admin-private", authKind: "none" };
  }

  if (isGeneralPublicPath(pathname) || isPublicIdentifierPath(pathname)) {
    return { authority: "public", authKind: "none" };
  }

  return { authority: "private", authKind: "none" };
}

export function shouldRedirectAuthenticatedAuthRoute(authKind: AuthRouteKind): boolean {
  return authKind === "general";
}

export function anonymousRouteAction(classification: RouteClassification): AnonymousRouteAction {
  switch (classification.authority) {
    case "public":
    case "auth-flow":
      return "allow";
    case "admin-private":
      return "admin-auth";
    case "super-admin-private":
      return "super-admin-auth";
    default:
      return "general-auth";
  }
}
