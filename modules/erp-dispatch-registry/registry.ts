import type { ErpCanonicalRole, ErpDispatchRegistryEntry, ErpImplementationStatus, ErpScope, ErpCapabilityMap } from "./types";

const makeEntry = (
  canonicalRole: ErpCanonicalRole,
  moduleId: string,
  implementationStatus: ErpImplementationStatus,
  handlerKey: string,
  authority: string,
  scope: ErpScope,
  capabilities: ErpCapabilityMap,
): ErpDispatchRegistryEntry => {
  const confirmedHandlerKeys = new Set([
    "finance-erp",
    "erp-calendar",
    "seller-agenda",
    "seller-dashboard",
    "seller-products",
    "seller-orders",
    "inventory-erp",
    "seller-customers",
    "seller-delivery",
    "seller-promotions",
    "seller-performance",
    "seller-marketplace",
    "seller-personnel",
    "official-assignments",
    "official-availability",
    "official-scorecards",
    "fight-live",
    "organizer-events",
    "organizer-fight-center",
    "organizer-ticketing",
    "organizer-team",
    "organizer-operations",
    "organizer-partners",
    "organizer-personnel",
    "organizer-settings",
    "club-members",
    "fighter-performance",
    "club-performance",
    "federation-overview",
    "league-overview",
    "club-overview",
    "coach-overview",
    "platform-overview",
    "admin-overview",
    "organizer-overview",
    "sponsor-overview",
    "official-overview",
    "fan-overview",
    "organizer-performance",
    "sponsor-performance",
    "fighter-competitions",
    "fighter-profile",
    "fighter-overview",
    "role-live",
    "marketplace-public",
    "admin-marketplace-moderation",
    "super-admin-marketplace",]);

  if (
    implementationStatus !== "implemented" ||
    !confirmedHandlerKeys.has(handlerKey) ||
    (canonicalRole === "organizer" && moduleId === "control-room")
  ) {
    return {
      canonicalRole,
      moduleId,
      implementationStatus: "unavailable",
      handlerKey: "unavailable",
      authority: "not-implemented",
      scope: "none",
      capabilities: { read: false, create: false, update: false, delete: false },
    };
  }

  let entry: ErpDispatchRegistryEntry = {
    canonicalRole,
    moduleId,
    implementationStatus,
    handlerKey,
    authority,
    scope,
    capabilities,
  };

  if (moduleId === "finance") {
    const organizationRoles = new Set<ErpCanonicalRole>([
      "admin", "federation", "league", "club", "organizer", "sponsor", "seller",
    ]);
    const personalRoles = new Set<ErpCanonicalRole>(["fighter", "coach", "official", "fan"]);
    const scope = organizationRoles.has(canonicalRole)
      ? "organization"
      : personalRoles.has(canonicalRole)
        ? "personal"
        : "organization";
    entry = {
      ...entry,
      scope,
      readScope: scope,
      mutationScope: scope,
      capabilityMode: "permission-aware",
      capabilityPolicy: "Owner is selected from authorized profile or organization contexts; RPC authorization remains authoritative.",
    };
  }

  if (moduleId === "calendar") {
    entry = {
      ...entry,
      readScope: entry.scope,
      mutationScope: entry.scope,
      capabilityMode: "source-aware",
      capabilityPolicy: "Manual entries are mutable only within the authorized owner scope; derived events, fights, assignments, and orders remain read-only.",
    };
  }

  if (canonicalRole === "seller" && moduleId === "marketplace") {
    entry = {
      ...entry,
      scope: "organization",
      readScope: "public",
      mutationScope: "organization",
      capabilityMode: "permission-aware",
      capabilityPolicy: "Catalog reads may be public; mutations are restricted to the seller organization.",
    };
  }

  if (canonicalRole === "fighter" && moduleId === "fight-room") {
    entry = {
      ...entry,
      capabilities: { read: true, create: false, update: false, delete: false },
      capabilityMode: "permission-aware",
      capabilityPolicy: "Fighter workspace reads the assigned fight; control mutations are restricted to authorized officials or organizers.",
    };
  }

  if (canonicalRole === "organizer" && moduleId === "events") {
    entry = {
      ...entry,
      capabilityMode: "permission-aware",
      capabilityPolicy: "Organizer event workflow authorizes mutations within accessible organizations and events.",
    };
  }

  if (canonicalRole === "official" && moduleId === "assignments") {
    entry = {
      ...entry,
      capabilities: { read: true, create: false, update: true, delete: false },
      capabilityMode: "permission-aware",
      capabilityPolicy: "Official may read and respond to own assignments; creation and deletion belong to assignment authorities.",
    };
  }

  if (canonicalRole === "official" && moduleId === "availability") {
    entry = {
      ...entry,
      capabilities: { read: true, create: true, update: true, delete: false },
      capabilityMode: "permission-aware",
      capabilityPolicy: "Official manages own availability records; deletion is not exposed as a global CRUD right.",
    };
  }

  if (canonicalRole === "official" && moduleId === "scorecards") {
    entry = {
      ...entry,
      capabilities: { read: true, create: true, update: true, delete: false },
      capabilityMode: "permission-aware",
      capabilityPolicy: "Judge submits or corrects own scorecards while cards remain tied to the assigned fight and lock state.",
    };
  }

  if (canonicalRole === "official" && (moduleId === "live" || moduleId === "fights")) {
    entry = {
      ...entry,
      capabilities: { read: true, create: true, update: true, delete: false },
      capabilityMode: "permission-aware",
      capabilityPolicy: "Assigned referees and timekeepers control the timer; assigned operational officials record live actions; deletion is never exposed.",
    };
  }

  if (moduleId === "live" && handlerKey === "role-live") {
    const platformManager = canonicalRole === "admin" || canonicalRole === "super-admin";
    entry = {
      ...entry,
      capabilities: platformManager
        ? { read: true, update: true }
        : { read: true, create: false, update: false, delete: false },
      readScope: platformManager ? "platform" : "public",
      mutationScope: platformManager ? "event" : "none",
      capabilityMode: "permission-aware",
      capabilityPolicy: platformManager
        ? "Platform administrators use deployed Fight Live event authority; database authorization remains final."
        : "Public live projection only; no timer, official action, judging, decision, or publication controls.",
    };
  }

  return entry;
};

export const ERP_DISPATCH_REGISTRY: readonly ErpDispatchRegistryEntry[] = [
  makeEntry("super-admin", "overview", "implemented", "platform-overview", "platform-erp", "platform", { read: true }),
  makeEntry("super-admin", "platform", "implemented", "platform-core", "platform-erp", "platform", { read: true }),
  makeEntry("super-admin", "users", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("super-admin", "organizations", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("super-admin", "governance", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("super-admin", "content", "implemented", "generic-erp", "real-erp-supabase", "platform", { read: true, create: true, update: true, delete: true }),
  makeEntry("super-admin", "finance", "implemented", "finance-erp", "finance-erp", "platform", { read: true, create: true, update: true, delete: true }),
  makeEntry("super-admin", "calendar", "implemented", "erp-calendar", "erp-calendar", "personal", { read: true, create: true, update: true, delete: true }),
  makeEntry("super-admin", "marketplace", "implemented", "super-admin-marketplace", "super-admin-marketplace", "platform", { read: true }),
  makeEntry("super-admin", "personnel", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("super-admin", "analytics", "implemented", "generic-erp", "real-erp-supabase", "platform", { read: true }),
  makeEntry("super-admin", "settings", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("super-admin", "live", "implemented", "role-live", "fight-live", "platform", { read: true, update: true }),

  makeEntry("admin", "overview", "implemented", "admin-overview", "platform-erp", "platform", { read: true }),
  makeEntry("admin", "users", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("admin", "organizations", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("admin", "moderation", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("admin", "events", "implemented", "generic-erp", "real-erp-supabase", "event", { read: true, create: true, update: true, delete: true }),
  makeEntry("admin", "support", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("admin", "finance", "implemented", "finance-erp", "finance-erp", "platform", { read: true, create: true, update: true, delete: true }),
  makeEntry("admin", "calendar", "implemented", "erp-calendar", "erp-calendar", "personal", { read: true, create: true, update: true, delete: true }),
  makeEntry("admin", "marketplace", "implemented", "admin-marketplace-moderation", "admin-marketplace-moderation", "platform", { read: true }),
  makeEntry("admin", "personnel", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("admin", "reports", "implemented", "generic-erp", "real-erp-supabase", "platform", { read: true }),
  makeEntry("admin", "settings", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("admin", "live", "implemented", "role-live", "fight-live", "platform", { read: true, update: true }),

  makeEntry("federation", "overview", "implemented", "federation-overview", "real-erp-supabase", "organization", { read: true }),
  makeEntry("federation", "affiliations", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("federation", "members", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("federation", "competitions", "implemented", "generic-erp", "real-erp-supabase", "event", { read: true, create: true, update: true, delete: true }),
  makeEntry("federation", "sport", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("federation", "licenses", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("federation", "training", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("federation", "finance", "implemented", "finance-erp", "finance-erp", "platform", { read: true, create: true, update: true, delete: true }),
  makeEntry("federation", "calendar", "implemented", "erp-calendar", "erp-calendar", "personal", { read: true, create: true, update: true, delete: true }),
  makeEntry("federation", "personnel", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("federation", "communication", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("federation", "performance", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true }),
  makeEntry("federation", "settings", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("federation", "live", "implemented", "role-live", "fight-live-public", "public", { read: true }),

  makeEntry("league", "overview", "implemented", "league-overview", "real-erp-supabase", "organization", { read: true }),
  makeEntry("league", "clubs", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("league", "members", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("league", "competitions", "implemented", "generic-erp", "real-erp-supabase", "event", { read: true, create: true, update: true, delete: true }),
  makeEntry("league", "officials", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("league", "development", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("league", "documents", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("league", "finance", "implemented", "finance-erp", "finance-erp", "platform", { read: true, create: true, update: true, delete: true }),
  makeEntry("league", "calendar", "implemented", "erp-calendar", "erp-calendar", "personal", { read: true, create: true, update: true, delete: true }),
  makeEntry("league", "personnel", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("league", "performance", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true }),
  makeEntry("league", "settings", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("league", "live", "implemented", "role-live", "fight-live-public", "public", { read: true }),

  makeEntry("club", "overview", "implemented", "club-overview", "real-erp-supabase", "organization", { read: true }),
  makeEntry("club", "members", "implemented", "club-members", "club-members", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("club", "training", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("club", "competitions", "implemented", "generic-erp", "real-erp-supabase", "event", { read: true, create: true, update: true, delete: true }),
  makeEntry("club", "sport", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("club", "medical", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("club", "licenses", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("club", "finance", "implemented", "finance-erp", "finance-erp", "platform", { read: true, create: true, update: true, delete: true }),
  makeEntry("club", "calendar", "implemented", "erp-calendar", "erp-calendar", "personal", { read: true, create: true, update: true, delete: true }),
  makeEntry("club", "personnel", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("club", "communication", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("club", "performance", "implemented", "club-performance", "club-performance", "organization", { read: true }),
  makeEntry("club", "settings", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("club", "live", "implemented", "role-live", "fight-live-public", "public", { read: true }),

  makeEntry("coach", "overview", "implemented", "coach-overview", "real-erp-supabase", "personal", { read: true }),
  makeEntry("coach", "athletes", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("coach", "training", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("coach", "camps", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("coach", "competitions", "implemented", "generic-erp", "real-erp-supabase", "event", { read: true, create: true, update: true, delete: true }),
  makeEntry("coach", "performance", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true }),
  makeEntry("coach", "medical", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("coach", "team", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("coach", "finance", "implemented", "finance-erp", "finance-erp", "platform", { read: true, create: true, update: true, delete: true }),
  makeEntry("coach", "calendar", "implemented", "erp-calendar", "erp-calendar", "personal", { read: true, create: true, update: true, delete: true }),
  makeEntry("coach", "personnel", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("coach", "communication", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("coach", "settings", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("coach", "live", "implemented", "role-live", "fight-live-public", "public", { read: true }),

  makeEntry("fighter", "overview", "implemented", "fighter-overview", "real-erp-supabase", "personal", { read: true }),
  makeEntry("fighter", "profile", "implemented", "fighter-profile", "fighter-profile", "personal", { read: true }),
  makeEntry("fighter", "career", "implemented", "generic-erp", "real-erp-supabase", "fighter", { read: true }),
  makeEntry("fighter", "training", "implemented", "generic-erp", "real-erp-supabase", "fighter", { read: true, create: true, update: true, delete: true }),
  makeEntry("fighter", "fight-preparation", "implemented", "generic-erp", "real-erp-supabase", "fighter", { read: true, create: true, update: true, delete: true }),
  makeEntry("fighter", "competitions", "implemented", "fighter-competitions", "fighter-competitions", "event", { read: true }),
  makeEntry("fighter", "health", "implemented", "generic-erp", "real-erp-supabase", "fighter", { read: true, create: true, update: true, delete: true }),
  makeEntry("fighter", "team", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("fighter", "finance", "implemented", "finance-erp", "finance-erp", "platform", { read: true, create: true, update: true, delete: true }),
  makeEntry("fighter", "sponsors", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("fighter", "performance", "implemented", "fighter-performance", "fighter-performance", "fighter", { read: true }),
  makeEntry("fighter", "marketplace", "implemented", "marketplace-public", "marketplace-public", "public", { read: true }),
  makeEntry("fighter", "calendar", "implemented", "erp-calendar", "erp-calendar", "personal", { read: true, create: true, update: true, delete: true }),
  makeEntry("fighter", "settings", "implemented", "generic-erp", "real-erp-supabase", "personal", { read: true, create: true, update: true, delete: true }),
  makeEntry("fighter", "fight-room", "implemented", "fight-live", "fight-live", "event", { read: true, create: true, update: true, delete: true }),

  makeEntry("organizer", "overview", "implemented", "organizer-overview", "real-erp-supabase", "organization", { read: true }),
  makeEntry("organizer", "events", "implemented", "organizer-events", "real-erp-supabase", "event", { read: true, create: true, update: true, delete: true }),
  makeEntry("organizer", "fight-center", "implemented", "organizer-fight-center", "fight-center-supabase", "event", { read: true, create: true, update: true, delete: true }),
  makeEntry("organizer", "ticketing", "implemented", "organizer-ticketing", "event-ticketing", "event", { read: true, create: true, update: true, delete: true }),
  makeEntry("organizer", "team", "implemented", "organizer-team", "event-team", "event", { read: true, create: true, update: true, delete: true }),
  makeEntry("organizer", "operations", "implemented", "organizer-operations", "event-operations", "event", { read: true, create: true, update: true, delete: true }),
  makeEntry("organizer", "partners", "implemented", "organizer-partners", "event-partners", "event", { read: true, create: true, update: true, delete: true }),
  makeEntry("organizer", "finance", "implemented", "finance-erp", "finance-erp", "platform", { read: true, create: true, update: true, delete: true }),
  makeEntry("organizer", "performance", "implemented", "organizer-performance", "event-performance", "event", { read: true }),
  makeEntry("organizer", "marketplace", "implemented", "marketplace-public", "marketplace-public", "public", { read: true }),
  makeEntry("organizer", "calendar", "implemented", "erp-calendar", "erp-calendar", "personal", { read: true, create: true, update: true, delete: true }),
  makeEntry("organizer", "settings", "implemented", "real-erp-generic", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("organizer", "personnel", "implemented", "organizer-personnel", "event-team", "event", { read: true, create: true, update: true, delete: true }),
  makeEntry("organizer", "control-room", "implemented", "fight-live", "fight-live", "event", { read: true, create: true, update: true, delete: true }),

  makeEntry("official", "overview", "implemented", "official-overview", "real-erp-supabase", "personal", { read: true }),
  makeEntry("official", "assignments", "implemented", "official-assignments", "official-assignments", "event", { read: true, create: true, update: true, delete: true }),
  makeEntry("official", "availability", "implemented", "official-availability", "official-availability", "personal", { read: true, create: true, update: true, delete: true }),
  makeEntry("official", "licenses", "implemented", "generic-erp", "real-erp-supabase", "personal", { read: true }),
  makeEntry("official", "training", "implemented", "generic-erp", "real-erp-supabase", "personal", { read: true }),
  makeEntry("official", "finance", "implemented", "finance-erp", "finance-erp", "platform", { read: true, create: true, update: true, delete: true }),
  makeEntry("official", "communication", "implemented", "generic-erp", "real-erp-supabase", "personal", { read: true, create: true, update: true, delete: true }),
  makeEntry("official", "calendar", "implemented", "erp-calendar", "erp-calendar", "personal", { read: true, create: true, update: true, delete: true }),
  makeEntry("official", "marketplace", "implemented", "marketplace-public", "marketplace-public", "public", { read: true }),
  makeEntry("official", "settings", "implemented", "generic-erp", "real-erp-supabase", "personal", { read: true, create: true, update: true, delete: true }),
  makeEntry("official", "live", "implemented", "fight-live", "fight-live", "event", { read: true, create: true, update: true, delete: true }),
  makeEntry("official", "fights", "implemented", "fight-live", "fight-live", "event", { read: true, create: true, update: true, delete: true }),
  makeEntry("official", "evaluations", "implemented", "generic-erp", "real-erp-supabase", "personal", { read: true, create: true, update: true, delete: true }),
  makeEntry("official", "scorecards", "implemented", "official-scorecards", "official-scorecards", "event", { read: true, create: true, update: true, delete: true }),
  makeEntry("official", "performance", "implemented", "generic-erp", "real-erp-supabase", "personal", { read: true }),

  makeEntry("sponsor", "overview", "implemented", "sponsor-overview", "real-erp-supabase", "organization", { read: true }),
  makeEntry("sponsor", "portfolio", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("sponsor", "opportunities", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("sponsor", "contracts", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("sponsor", "campaigns", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("sponsor", "deliverables", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("sponsor", "activations", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("sponsor", "finance", "implemented", "finance-erp", "finance-erp", "platform", { read: true, create: true, update: true, delete: true }),
  makeEntry("sponsor", "calendar", "implemented", "erp-calendar", "erp-calendar", "personal", { read: true, create: true, update: true, delete: true }),
  makeEntry("sponsor", "marketplace", "implemented", "marketplace-public", "marketplace-public", "public", { read: true }),
  makeEntry("sponsor", "personnel", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("sponsor", "performance", "implemented", "sponsor-performance", "sponsor-performance", "organization", { read: true }),
  makeEntry("sponsor", "settings", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("sponsor", "live", "implemented", "role-live", "fight-live-public", "public", { read: true }),

  makeEntry("seller", "overview", "implemented", "seller-dashboard", "seller-dashboard", "organization", { read: true }),
  makeEntry("seller", "catalog", "implemented", "seller-products", "seller-products", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("seller", "orders", "implemented", "seller-orders", "seller-orders", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("seller", "inventory", "implemented", "inventory-erp", "inventory-erp", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("seller", "customers", "implemented", "seller-customers", "seller-customers", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("seller", "delivery", "implemented", "seller-delivery", "seller-delivery", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("seller", "promotions", "implemented", "seller-promotions", "seller-promotions", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("seller", "finance", "implemented", "finance-erp", "finance-erp", "platform", { read: true, create: true, update: true, delete: true }),
  makeEntry("seller", "performance", "implemented", "seller-performance", "seller-performance", "organization", { read: true }),
  makeEntry("seller", "settings", "implemented", "generic-erp", "real-erp-supabase", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("seller", "live", "implemented", "role-live", "fight-live-public", "public", { read: true }),
  makeEntry("seller", "marketplace", "implemented", "seller-marketplace", "seller-marketplace", "public", { read: true, create: true, update: true, delete: true }),
  makeEntry("seller", "calendar", "implemented", "seller-agenda", "seller-agenda", "organization", { read: true, create: true, update: true, delete: true }),
  makeEntry("seller", "personnel", "implemented", "seller-personnel", "seller-personnel", "organization", { read: true, create: true, update: true, delete: true }),

  makeEntry("fan", "overview", "implemented", "fan-overview", "real-erp-supabase", "personal", { read: true }),
  makeEntry("fan", "finance", "implemented", "finance-erp", "finance-erp", "platform", { read: true, create: true, update: true, delete: true }),
  makeEntry("fan", "following", "implemented", "generic-erp", "real-erp-supabase", "personal", { read: true, create: true, update: true, delete: true }),
  makeEntry("fan", "events", "implemented", "generic-erp", "real-erp-supabase", "event", { read: true, create: true, update: true, delete: true }),
  makeEntry("fan", "live", "implemented", "role-live", "fight-live-public", "public", { read: true }),
  makeEntry("fan", "content", "implemented", "generic-erp", "real-erp-supabase", "public", { read: true }),
  makeEntry("fan", "community", "implemented", "generic-erp", "real-erp-supabase", "public", { read: true, create: true, update: true, delete: true }),
  makeEntry("fan", "tickets", "implemented", "generic-erp", "real-erp-supabase", "personal", { read: true, create: true, update: true, delete: true }),
  makeEntry("fan", "marketplace", "implemented", "marketplace-public", "marketplace-public", "public", { read: true }),
  makeEntry("fan", "rewards", "implemented", "generic-erp", "real-erp-supabase", "personal", { read: true }),
  makeEntry("fan", "settings", "implemented", "generic-erp", "real-erp-supabase", "personal", { read: true, create: true, update: true, delete: true }),
  makeEntry("club", "marketplace", "implemented", "marketplace-public", "marketplace-public", "public", { read: true }),
  makeEntry("coach", "marketplace", "implemented", "marketplace-public", "marketplace-public", "public", { read: true }),
  makeEntry("federation", "marketplace", "implemented", "marketplace-public", "marketplace-public", "public", { read: true }),
  makeEntry("league", "marketplace", "implemented", "marketplace-public", "marketplace-public", "public", { read: true }),
  makeEntry("fan", "calendar", "implemented", "erp-calendar", "erp-calendar", "personal", { read: true, create: true, update: true, delete: true }),
  makeEntry("fan", "personnel", "unavailable", "unavailable", "not-implemented", "none", { read: false, create: false, update: false, delete: false }),

  makeEntry("super-admin", "department", "unavailable", "unavailable", "not-implemented", "none", { read: false, create: false, update: false, delete: false }),
  makeEntry("admin", "finance-legacy", "unavailable", "unavailable", "not-implemented", "none", { read: false, create: false, update: false, delete: false }),
  makeEntry("fighter", "documents", "unavailable", "unavailable", "not-implemented", "none", { read: false, create: false, update: false, delete: false }),
  makeEntry("organizer", "documents", "unavailable", "unavailable", "not-implemented", "none", { read: false, create: false, update: false, delete: false }),
  makeEntry("seller", "documents", "unavailable", "unavailable", "not-implemented", "none", { read: false, create: false, update: false, delete: false }),
  makeEntry("sponsor", "documents", "unavailable", "unavailable", "not-implemented", "none", { read: false, create: false, update: false, delete: false }),
  makeEntry("official", "documents", "unavailable", "unavailable", "not-implemented", "none", { read: false, create: false, update: false, delete: false }),
  makeEntry("fan", "documents", "unavailable", "unavailable", "not-implemented", "none", { read: false, create: false, update: false, delete: false }),
  makeEntry("seller", "catalog-legacy", "unavailable", "unavailable", "not-implemented", "none", { read: false, create: false, update: false, delete: false }),
] as const satisfies readonly ErpDispatchRegistryEntry[];
