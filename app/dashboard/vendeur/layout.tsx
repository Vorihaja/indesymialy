"use client";

import type {
  ReactNode,
} from "react";

import {
  usePathname,
} from "next/navigation";

import {
  RoleGuard,
} from "@/modules/auth/guards";

import {
  UniversalErpPrototype,
} from "@/modules/universal-erp";


type SellerRouteState = {
  moduleId: string;
  tab?: string;
  preserveRouteContent?: boolean;
};


function resolveSellerRoute(
  pathname: string,
): SellerRouteState {
  const root =
    "/dashboard/vendeur";

  const relative =
    pathname
      .slice(root.length)
      .replace(/^\/+/, "");

  const segment =
    relative.split("/")[0] ?? "";


  switch (segment) {
    case "":
      return {
        moduleId: "overview",
        preserveRouteContent: true,
      };

    case "products":
      return {
        moduleId: "catalog",
        tab: "Produits",
        preserveRouteContent: true,
      };

    case "orders":
      return {
        moduleId: "orders",
        tab: "Toutes",
      };

    case "inventory":
      return {
        moduleId: "inventory",
        tab: "Inventaire",
      };

    case "customers":
      return {
        moduleId: "customers",
        tab: "Tous",
      };

    case "delivery":
      return {
        moduleId: "delivery",
        tab: "Expéditions",
      };

    /*
     * FIN-2C
     * Route canonique Indesy Finance.
     */
    case "finance":
      return {
        moduleId: "finance",
        preserveRouteContent: true,
      };
    case "revenue":
      return {
        moduleId: "finance",
        tab: "Revenus",
        preserveRouteContent: true,
      };

    case "transactions":
      return {
        moduleId: "finance",
        tab: "Transactions",
        preserveRouteContent: true,
      };

    case "management":
      return {
        moduleId: "personnel",
      };

    case "marketplace":
      return {
        moduleId: "marketplace",
        preserveRouteContent: true,
      };

    case "promotions":
      return {
        moduleId: "promotions",
        tab: "Campagnes",
      };

    case "performance":
      return {
        moduleId: "performance",
        tab: "Ventes",
      };

    case "settings":
      return {
        moduleId: "settings",
        tab: "Boutique",
      };

    case "calendar":
      return {
        moduleId: "calendar",
      };

    case "live":
      return {
        moduleId: "live",
        tab: "Direct",
      };

    case "messages":
      return {
        moduleId: "overview",
        preserveRouteContent: true,
      };

    /*
     * Messagerie et autres deep links métier ne doivent
     * jamais quitter le shell.
     *
     * Ils gardent donc le workspace vendeur même lorsqu'ils
     * n'ont pas encore un module universel dédié.
     */
    default:
      return {
        moduleId: "overview",
      };
  }
}


export default function SellerDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname =
    usePathname();

  const route =
    resolveSellerRoute(
      pathname,
    );

  return (
    <RoleGuard role="seller">
      <UniversalErpPrototype
        role="seller"
        initialModule={
          route.moduleId
        }
        initialTab={
          route.tab
        }
        routeContent={
          route.preserveRouteContent
            ? children
            : undefined
        }
      />
    </RoleGuard>
  );
}
