"use client";

import { SellerAgendaFeature } from "@/modules/seller-agenda";

import { SellerVariantsFeature } from "@/modules/products/features/SellerVariantsFeature";

import { SellerCategoriesFeature } from "@/modules/products/features/SellerCategoriesFeature";
import { SellerMediaFeature } from "@/modules/products/features/SellerMediaFeature";
import { SellerPricingFeature } from "@/modules/products/features/SellerPricingFeature";

import { SellerDeliveryFeature } from "@/modules/delivery";
import { InventoryFeature } from "@/modules/inventory";
import {
  FinanceFeature,
} from "@/modules/finance-erp";

import {
  SellerPromotionsAdvancedFeature,
  SellerPromotionsFeature,
} from "@/modules/promotions";
import { OrdersFeature } from "@/modules/orders";
import { RealModuleDataView } from "@/modules/organizer-erp/components/RealModuleDataView";
import { SellerProductsFeature } from "@/modules/products";
import { SellerDashboardFeature } from "@/modules/seller-dashboard";
import { SellerMarketplaceFeature } from "@/modules/seller-marketplace";
import { SellerCustomersFeature } from "@/modules/seller-customers";
import { SellerPerformanceFeature } from "@/modules/seller-performance";
import { SellerPersonnelFeature } from "@/modules/seller-personnel";

type SellerErpModuleViewProps = {
  moduleId: string;
  moduleLabel: string;
  tab: string;
  onTabChange: (tab: string) => void;
};

export function SellerErpModuleView({
  moduleId,
  moduleLabel,
  tab,
  onTabChange,
}: SellerErpModuleViewProps) {
  /*
   * Dashboard vendeur rÃƒÆ’Ã‚Â©el.
   */
  if (moduleId === "overview") {
    return <SellerDashboardFeature />;
  }

  /*
   * Catalogue.
   *
   * La vue principale utilise dÃƒÆ’Ã‚Â©jÃƒÆ’Ã‚Â  le vÃƒÆ’Ã‚Â©ritable module produit.
   * Les sous-domaines spÃƒÆ’Ã‚Â©cialisÃƒÆ’Ã‚Â©s restent sur le moteur ERP
   * gÃƒÆ’Ã‚Â©nÃƒÆ’Ã‚Â©rique tant que nous ne les avons pas refondus.
   */
  if (
    moduleId === "catalog" &&
    (
      !tab ||
      tab === "products"
    )
  ) {
    return <SellerProductsFeature />;
  }

  /*
   * Commandes vendeur rÃƒÆ’Ã‚Â©elles.
   */

  if (
    moduleId === "catalog" &&
    tab === "categories"
  ) {
    return <SellerCategoriesFeature />;
  }

  if (
    moduleId === "catalog" &&
    tab === "media"
  ) {
    return <SellerMediaFeature />;
  }

  if (
    moduleId === "catalog" &&
    tab === "pricing"
  ) {
    return <SellerPricingFeature />;
  }

  if (
    moduleId === "catalog" &&
    tab === "variants"
  ) {
    return <SellerVariantsFeature />;
  }
  if (moduleId === "orders") {
    return <OrdersFeature seller />;
  }

  /*
   * AutoritÃƒÆ’Ã‚Â© stock rÃƒÆ’Ã‚Â©elle.
   */
  if (moduleId === "inventory") {
    return <InventoryFeature />;
  }

  /*
   * CRM vendeur existant.
   */
  if (moduleId === "customers") {
    return <SellerCustomersFeature tab={tab} />;
  }

  /*
   * Livraison rÃƒÆ’Ã‚Â©elle.
   */
  if (moduleId === "delivery") {
    return <SellerDeliveryFeature tab={tab} />;
  }

  /*
   * Finances vendeur.
   */
  if (moduleId === "finance") {
    return (
      <FinanceFeature
        role="vendeur"
      />
    );
  }

  /*
   * La Marketplace vendeur conserve pour l'instant
   * le cockpit commercial rÃƒÆ’Ã‚Â©el existant.
   */
    if (
    (
      moduleId === "promotions" ||
      moduleId === "promotion"
    ) &&
    tab === "bundles"
  ) {
    return (
      <SellerPromotionsAdvancedFeature
        view="bundles"
      />
    );
  }

  if (
    (
      moduleId === "promotions" ||
      moduleId === "promotion"
    ) &&
    tab === "partnerships"
  ) {
    return (
      <SellerPromotionsAdvancedFeature
        view="partnerships"
      />
    );
  }
if (
    (
      moduleId === "promotions" ||
      moduleId === "promotion"
    ) &&
    (
      tab === "campaigns" ||
      tab === "promo-codes"
    )
  ) {
    return (
      <SellerPromotionsFeature
        view={
          tab === "promo-codes"
            ? "codes"
            : "campaigns"
        }
      />
    );
  }

  if (moduleId === "performance") {
    return <SellerPerformanceFeature tab={tab} />;
  }

  if (moduleId === "personnel") {
    return <SellerPersonnelFeature />;
  }


  /*
   * Agenda vendeur réel.
   *
   * Les entrées manuelles sont détenues par seller_agenda_items.
   * Les échéances dérivées restent détenues par leurs domaines sources.
   */
  if (moduleId === "calendar") {
    return <SellerAgendaFeature />;
  }
  if (moduleId === "marketplace") {
    return <SellerMarketplaceFeature />;
  }

  /*
   * Fallback ERP universel :
   *
   * catÃƒÆ’Ã‚Â©gories,
   * variantes,
   * mÃƒÆ’Ã‚Â©dias,
   * promotions,
   * performance,
   * paramÃƒÆ’Ã‚Â¨tres,
   * personnel,
   * agenda,
   * Sales Live,
   * et tout sous-module non encore spÃƒÆ’Ã‚Â©cialisÃƒÆ’Ã‚Â©.
   */
  return (
    <RealModuleDataView
      role="seller"
      moduleId={moduleId}
      moduleLabel={moduleLabel}
      tab={tab || moduleLabel}
      onTabChange={onTabChange}
    />
  );
}
