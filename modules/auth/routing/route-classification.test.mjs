import assert from "node:assert/strict";
import test from "node:test";

import {
  anonymousRouteAction,
  classifyAuthRoute,
  classifyRoute,
  shouldRedirectAuthenticatedAuthRoute,
} from "./route-classification.ts";

const AUTH_ROUTE_MATRIX = [
  ["/auth", "general"],
  ["/auth/register", "general"],
  ["/auth/callback", "callback"],
  ["/auth/forgot-password", "general"],
  ["/auth/reset-password", "general"],
  ["/auth/verify", "general"],
  ["/auth/admin", "admin-entry"],
  ["/auth/vh-teck", "super-admin-entry"],
  ["/auth/vh-teck/mfa", "super-admin-mfa"],
  ["/auth/vh-teck/mfa/enroll", "super-admin-mfa"],
];

test("toutes les routes Auth physiques appartiennent au flux Auth", () => {
  for (const [pathname, authKind] of AUTH_ROUTE_MATRIX) {
    assert.deepEqual(classifyRoute(pathname), {
      authority: "auth-flow",
      authKind,
    });
    assert.equal(anonymousRouteAction(classifyRoute(pathname)), "allow");
  }
});

test("les futurs descendants Auth restent dans le flux Auth sans élargir les autres familles", () => {
  assert.equal(classifyAuthRoute("/auth/future-entry"), "general");
  assert.equal(classifyRoute("/authentication").authKind, "none");
  assert.equal(classifyRoute("/events/upcoming").authority, "public");
  assert.equal(classifyRoute("/dashboard").authority, "private");
});

test("un utilisateur connecté ne quitte que les écrans Auth généraux", () => {
  assert.equal(shouldRedirectAuthenticatedAuthRoute("general"), true);
  assert.equal(shouldRedirectAuthenticatedAuthRoute("callback"), false);
  assert.equal(shouldRedirectAuthenticatedAuthRoute("admin-entry"), false);
  assert.equal(shouldRedirectAuthenticatedAuthRoute("super-admin-entry"), false);
  assert.equal(shouldRedirectAuthenticatedAuthRoute("super-admin-mfa"), false);
});

test("les espaces privés conservent leur destination Auth spécialisée", () => {
  assert.equal(anonymousRouteAction(classifyRoute("/dashboard")), "general-auth");
  assert.equal(anonymousRouteAction(classifyRoute("/dashboard/admin")), "admin-auth");
  assert.equal(anonymousRouteAction(classifyRoute("/admin/database")), "admin-auth");
  assert.equal(anonymousRouteAction(classifyRoute("/vh-teck")), "super-admin-auth");
  assert.equal(anonymousRouteAction(classifyRoute("/vh-teck/security")), "super-admin-auth");
});

test("les anciennes routes super-admin restent neutralisées", () => {
  assert.equal(classifyRoute("/dashboard/super-admin").authority, "legacy-super-admin");
  assert.equal(classifyRoute("/dashboard/super-admin/users").authority, "legacy-super-admin");
  assert.equal(classifyRoute("/dashboard/super-admi").authority, "legacy-super-admin");
});
