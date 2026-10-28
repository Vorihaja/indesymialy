"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { RoleGuard } from "@/modules/auth/guards";
import { FighterErpPrototype } from "@/modules/fighter-erp/features/FighterErpPrototype";
import type { FighterModuleId } from "@/modules/fighter-erp/types";
import { OrganizerErpPrototype } from "@/modules/organizer-erp";
import type { OrganizerModuleId } from "@/modules/organizer-erp/types";
import { UniversalErpPrototype } from "@/modules/universal-erp";
import type { UniversalRoleId } from "@/modules/universal-erp";

type FinanceErpRole =
  | "combattant"
  | "coach"
  | "officiel"
  | "arbitre"
  | "juge"
  | "club"
  | "organisateur"
  | "sponsor"
  | "federation"
  | "ligue"
  | "fan";

type RouteState = {
  moduleId: string;
  tab?: string;
  preserveRouteContent?: boolean;
  renderCanonicalRoute?: boolean;
  initialEventAction?: "create";
  initialEventId?: string;
};

const routeRoleSegments: Record<FinanceErpRole, string> = {
  combattant: "combattant",
  coach: "coach",
  officiel: "officiel",
  arbitre: "arbitre",
  juge: "juge",
  club: "club",
  organisateur: "organisateur",
  sponsor: "sponsor",
  federation: "federation",
  ligue: "ligue",
  fan: "fan",
};

const guardRoles: Record<FinanceErpRole, string> = {
  combattant: "fighter",
  coach: "coach",
  officiel: "official",
  arbitre: "referee",
  juge: "judge",
  club: "club",
  organisateur: "organizer",
  sponsor: "sponsor",
  federation: "federation",
  ligue: "league",
  fan: "fan",
};

const universalRoles: Partial<Record<FinanceErpRole, UniversalRoleId>> = {
  coach: "coach",
  officiel: "official",
  arbitre: "referee",
  juge: "judge",
  club: "club",
  sponsor: "sponsor",
  federation: "federation",
  ligue: "league",
  fan: "fan",
};

const commonRoutes: Record<string, RouteState> = {
  profile: { moduleId: "settings", tab: "Profil" },
  management: { moduleId: "settings" },
  statistics: { moduleId: "performance" },
  documents: { moduleId: "communication", tab: "Documents" },
  calendar: { moduleId: "calendar" },
  settings: { moduleId: "settings" },
  notifications: { moduleId: "settings", tab: "Notifications" },
};

const roleRoutes: Record<FinanceErpRole, Record<string, RouteState>> = {
  combattant: {
    assessments: { moduleId: "performance", tab: "Sport" },
    attendance: { moduleId: "training", tab: "Présences" },
    career: { moduleId: "career", tab: "Parcours" },
    compliance: { moduleId: "health", tab: "Certificats" },
    contracts: { moduleId: "career", tab: "Contrats" },
    documents: { moduleId: "profile", tab: "Documents" },
    events: { moduleId: "competitions", tab: "Calendrier" },
    "fight-live": { moduleId: "fight-room", tab: "Direct", preserveRouteContent: true },
    "fight-preparation": { moduleId: "fight-preparation", tab: "Camp" },
    "fight-proposals": { moduleId: "competitions", tab: "Invitations" },
    finance: { moduleId: "finance", preserveRouteContent: true },
    licenses: { moduleId: "profile", tab: "Documents" },
    medical: { moduleId: "health", tab: "Suivi médical" },
    messages: { moduleId: "team", preserveRouteContent: true },
    objectives: { moduleId: "training", tab: "Objectifs" },
    performance: { moduleId: "performance", tab: "Synthèse" },
    programs: { moduleId: "training", tab: "Programmes" },
    record: { moduleId: "career", tab: "Palmarès" },
    registrations: { moduleId: "competitions", tab: "Inscriptions" },
    "sponsor-offers": { moduleId: "sponsors", tab: "Offres" },
    sponsors: { moduleId: "sponsors", tab: "Partenaires" },
    subscription: { moduleId: "settings", tab: "Compte" },
    training: { moduleId: "training", tab: "Séances" },
    weight: { moduleId: "health", tab: "Poids" },
  },
  coach: {
    assessments: { moduleId: "performance", tab: "Évaluations" },
    athletes: { moduleId: "athletes", tab: "Roster" },
    attendance: { moduleId: "training", tab: "Présences" },
    compliance: { moduleId: "settings", tab: "Droits" },
    contracts: { moduleId: "finance", tab: "Contrats" },
    documents: { moduleId: "communication", tab: "Documents" },
    "fight-preparation": { moduleId: "camps", tab: "Préparation" },
    finance: { moduleId: "finance", preserveRouteContent: true },
    licenses: { moduleId: "medical", tab: "Aptitudes" },
    management: { moduleId: "team" },
    messages: { moduleId: "communication", tab: "Messages", preserveRouteContent: true },
    objectives: { moduleId: "training", tab: "Programmes" },
    performance: { moduleId: "performance", tab: "Progression" },
    programs: { moduleId: "training", tab: "Programmes" },
    training: { moduleId: "training", tab: "Séances" },
  },
  officiel: {
    assignments: { moduleId: "assignments", tab: "À venir", preserveRouteContent: true },
    contracts: { moduleId: "finance", tab: "À recevoir" },
    documents: { moduleId: "licenses", tab: "Documents" },
    "fight-live": { moduleId: "live", tab: "Direct", preserveRouteContent: true },
    finance: { moduleId: "finance", preserveRouteContent: true },
    licenses: { moduleId: "licenses", tab: "Licence" },
    management: { moduleId: "settings" },
    messages: { moduleId: "communication", tab: "Messages", preserveRouteContent: true },
    payments: { moduleId: "finance", preserveRouteContent: true },
    scorecards: { moduleId: "scorecards", renderCanonicalRoute: true },
  },
  arbitre: {
    assignments: { moduleId: "assignments", tab: "À venir" , preserveRouteContent: true },
    contracts: { moduleId: "finance", tab: "À recevoir" },
    documents: { moduleId: "licenses", tab: "Documents" },
    "fight-live": { moduleId: "live", tab: "Direct", preserveRouteContent: true },
    finance: { moduleId: "finance", preserveRouteContent: true },
    licenses: { moduleId: "licenses", tab: "Licence" },
    management: { moduleId: "settings" },
    messages: { moduleId: "communication", tab: "Messages", preserveRouteContent: true },
    payments: { moduleId: "finance", preserveRouteContent: true },
  },
  juge: {
    assignments: { moduleId: "assignments", tab: "À venir" },
    contracts: { moduleId: "finance", tab: "À recevoir" },
    documents: { moduleId: "licenses", tab: "Documents" },
    "fight-live": { moduleId: "live", tab: "Direct", preserveRouteContent: true },
    finance: { moduleId: "finance", preserveRouteContent: true },
    licenses: { moduleId: "licenses", tab: "Licence" },
    management: { moduleId: "settings" },
    messages: { moduleId: "settings", preserveRouteContent: true },
    payments: { moduleId: "finance", preserveRouteContent: true },
  },
  club: {
    attendance: { moduleId: "members", tab: "Présences" },
    competitions: { moduleId: "competitions", tab: "Calendrier" },
    compliance: { moduleId: "licenses", tab: "Demandes" },
    contracts: { moduleId: "finance", tab: "Cotisations" },
    documents: { moduleId: "communication", tab: "Documents" },
    events: { moduleId: "competitions", tab: "Calendrier" },
    finance: { moduleId: "finance", preserveRouteContent: true },
    licenses: { moduleId: "licenses", tab: "Actives" },
    management: { moduleId: "members", tab: "Tous" },
    members: { moduleId: "members", tab: "Tous" },
    memberships: { moduleId: "members", tab: "Adhésions" },
    messages: { moduleId: "communication", tab: "Messages", preserveRouteContent: true },
    payments: { moduleId: "finance", preserveRouteContent: true },
    performance: { moduleId: "performance", tab: "Combattants" },
    profile: { moduleId: "settings", tab: "Club" },
    programs: { moduleId: "training", tab: "Programmes" },
    registrations: { moduleId: "competitions", tab: "Inscriptions" },
    scouting: { moduleId: "sport", tab: "Talents" },
    statistics: { moduleId: "performance", tab: "Rapports" },
    subscription: { moduleId: "settings", tab: "Abonnement" },
    "talent-pool": { moduleId: "sport", tab: "Talents" },
    training: { moduleId: "training", tab: "Séances" },
  },
  organisateur: {
    compliance: { moduleId: "operations", tab: "Sécurité" },
    contracts: { moduleId: "partners", tab: "Contrats" },
    documents: { moduleId: "operations", tab: "Documents" },
    events: { moduleId: "events", tab: "Tous les événements" },
    "fight-live": { moduleId: "control-room", tab: "live", preserveRouteContent: true },
    "fight-proposals": { moduleId: "fight-center", renderCanonicalRoute: true },
    finance: { moduleId: "finance", preserveRouteContent: true },
    management: { moduleId: "team", tab: "Staff" },
    messages: { moduleId: "operations", tab: "Communication", preserveRouteContent: true },
    payments: { moduleId: "finance", preserveRouteContent: true },
    settings: { moduleId: "settings", tab: "Organisation" },
  },
  sponsor: {
    budget: { moduleId: "finance", preserveRouteContent: true },
    compliance: { moduleId: "settings", tab: "Droits" },
    contracts: { moduleId: "contracts", tab: "Actifs" },
    documents: { moduleId: "deliverables", tab: "Preuves" },
    finance: { moduleId: "finance", preserveRouteContent: true },
    management: { moduleId: "portfolio", tab: "Organisations" },
    messages: { moduleId: "campaigns", tab: "Contenus", preserveRouteContent: true },
    offers: { moduleId: "opportunities", tab: "Reçues" },
    payments: { moduleId: "finance", preserveRouteContent: true },
  },
  federation: {
    compliance: { moduleId: "licenses", tab: "Contrôles" },
    "development-programs": { moduleId: "training", tab: "Sessions" },
    finance: { moduleId: "finance", preserveRouteContent: true },
    licenses: { moduleId: "licenses", tab: "Délivrance" },
    management: { moduleId: "settings", tab: "Utilisateurs" },
    memberships: { moduleId: "affiliations", tab: "Renouvellements" },
    messages: { moduleId: "communication", tab: "Messages", preserveRouteContent: true },
    payments: { moduleId: "finance", preserveRouteContent: true },
    performance: { moduleId: "performance", tab: "National" },
    rankings: { moduleId: "competitions", tab: "Classements" },
    reports: { moduleId: "finance", preserveRouteContent: true },
    scouting: { moduleId: "sport", tab: "Sélections" },
    "talent-pool": { moduleId: "sport", tab: "Sélections" },
  },
  ligue: {
    compliance: { moduleId: "clubs", tab: "Conformité" },
    "development-programs": { moduleId: "development", tab: "Programmes" },
    finance: { moduleId: "finance", preserveRouteContent: true },
    licenses: { moduleId: "documents", tab: "Règlements" },
    management: { moduleId: "clubs", tab: "Affiliés" },
    memberships: { moduleId: "clubs", tab: "Demandes" },
    messages: { moduleId: "documents", tab: "Circulaires", preserveRouteContent: true },
    payments: { moduleId: "finance", preserveRouteContent: true },
    performance: { moduleId: "performance", tab: "Clubs" },
    rankings: { moduleId: "performance", tab: "Compétitions" },
    reports: { moduleId: "finance", preserveRouteContent: true },
    scouting: { moduleId: "development", tab: "Talents" },
    "talent-pool": { moduleId: "development", tab: "Talents" },
  },
  fan: {
    finance: { moduleId: "finance", preserveRouteContent: true },
    management: { moduleId: "settings", tab: "Profil" },
    messages: { moduleId: "community", tab: "Discussions" },
  },
};

function resolveRoute(pathname: string, role: FinanceErpRole): RouteState | null {
  const root = `/dashboard/${routeRoleSegments[role]}`;
  const relative = pathname.slice(root.length).replace(/^\/+/, "");

  if (!relative) return null;

  const parts = relative.split("/");
  const segment = parts[0] ?? "";

  if (role === "organisateur" && segment === "events") {
    const eventId = parts[1];
    const detail = parts[2];

    if (eventId === "new") {
      return {
        moduleId: "events",
        tab: "Tous les événements",
        initialEventAction: "create",
      };
    }

    if (eventId && detail) {
      const eventDetailRoutes: Record<string, RouteState> = {
        checklists: { moduleId: "operations", tab: "Checklists" },
        "fight-card": { moduleId: "fight-center", tab: "Fight Card" },
        participants: { moduleId: "events", tab: "Clubs engagés" },
        planning: { moduleId: "operations", tab: "Planning" },
        reports: { moduleId: "performance", tab: "Rapports" },
        results: { moduleId: "fight-center", tab: "Résultats" },
        sponsors: { moduleId: "partners", tab: "Sponsors" },
        staff: { moduleId: "team", tab: "Staff" },
        tickets: {
          moduleId: "ticketing",
          tab: parts[3] === "access" ? "Contrôle d’accès" : "Types de billets",
        },
      };

      return eventDetailRoutes[detail] ?? {
        moduleId: "events",
        tab: "Tous les événements",
        initialEventId: eventId,
      };
    }

    return {
      moduleId: "events",
      tab: "Tous les événements",
      initialEventId: eventId,
    };
  }

  return roleRoutes[role][segment] ?? commonRoutes[segment] ?? { moduleId: segment };
}

function FinanceErpWorkspace({
  role,
  route,
  children,
}: {
  role: FinanceErpRole;
  route: RouteState;
  children?: ReactNode;
}) {
  const routeContent = route.preserveRouteContent ? children : undefined;

  if (role === "combattant") {
    return (
      <FighterErpPrototype
        initialModule={route.moduleId as FighterModuleId}
        initialTab={route.tab}
        routeContent={routeContent}
      />
    );
  }

  if (role === "organisateur") {
    return (
      <OrganizerErpPrototype
        initialModule={route.moduleId as OrganizerModuleId}
        initialTab={route.tab}
        initialEventAction={route.initialEventAction}
        initialEventId={route.initialEventId}
        routeContent={routeContent}
      />
    );
  }

  const universalRole = universalRoles[role];

  if (!universalRole) return <>{children}</>;

  return (
    <UniversalErpPrototype
      role={universalRole}
      initialModule={route.moduleId}
      initialTab={route.tab}
      routeContent={routeContent}
    />
  );
}

export function FinanceErpRouteIntegration({
  role,
  children,
}: {
  role: FinanceErpRole;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const route = resolveRoute(pathname, role);

  if (!route) return <>{children}</>;

  if (route.renderCanonicalRoute) {
    return <>{children}</>;
  }

  return (
    <RoleGuard role={guardRoles[role]}>
      <FinanceErpWorkspace role={role} route={route}>
        {children}
      </FinanceErpWorkspace>
    </RoleGuard>
  );
}
