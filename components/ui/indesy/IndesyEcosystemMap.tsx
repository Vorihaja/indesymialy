"use client";

import { useState } from "react";

type ProductKey = "mialy" | "korana" | "erp" | "bazar";

type ProductDefinition = {
  mark: string;
  title: string;
  short: string;
  type: string;
  description: string;
  modules: string[];
};

const PRODUCTS: Record<ProductKey, ProductDefinition> = {
  mialy: {
    mark: "IM",
    title: "Indesy Mialy",
    short: "Portail national & identité",
    type: "Portail central",
    description:
      "La porte d’entrée publique : actualités, événements, classements, profils, clubs et médias.",
    modules: ["Actualités", "Événements", "Classements", "Profils", "Clubs"],
  },
  korana: {
    mark: "K",
    title: "Indesy Korana",
    short: "Communauté & contenus",
    type: "Espace social",
    description:
      "La couche communautaire : publications, discussions, groupes, médias et conversations.",
    modules: ["Fil d’actualité", "Discussions", "Groupes", "Messagerie", "Médias"],
  },
  erp: {
    mark: "E",
    title: "Indesy ERP",
    short: "Opérations par rôle",
    type: "Espace professionnel",
    description:
      "Le système opérationnel pour piloter clubs, événements, finances, tâches et conformité.",
    modules: ["Tableau de bord", "Agenda", "Finances", "Événements", "Gestion métier"],
  },
  bazar: {
    mark: "B",
    title: "Indesy Bazar",
    short: "Commerce spécialisé",
    type: "Plateforme séparée",
    description:
      "L’univers commerce autonome pour les équipements, services, locations et transactions.",
    modules: ["Catalogue", "Boutiques", "Location", "Commandes", "Paiements"],
  },
};

const PRODUCT_ORDER: ProductKey[] = ["mialy", "korana", "erp", "bazar"];

export function IndesyEcosystemMap() {
  const [activeKey, setActiveKey] = useState<ProductKey>("mialy");
  const activeProduct = PRODUCTS[activeKey];

  return (
    <section className="im-ecosystem" aria-label="Carte interactive de l’écosystème Indesy">
      <div className="im-ecosystem__map">
        {PRODUCT_ORDER.map((key) => {
          const product = PRODUCTS[key];
          return (
            <button
              key={key}
              type="button"
              className="im-product-node"
              aria-pressed={activeKey === key}
              onClick={() => setActiveKey(key)}
            >
              <span className="im-product-node__mark">{product.mark}</span>
              <span>
                <strong>{product.title}</strong>
                <small>{product.short}</small>
              </span>
            </button>
          );
        })}
      </div>

      <div className="im-ecosystem__detail" aria-live="polite">
        <p className="im-kicker">{activeProduct.type}</p>
        <div className="im-ecosystem__detail-head">
          <span className="im-ecosystem__detail-mark">{activeProduct.mark}</span>
          <h2>{activeProduct.title}</h2>
        </div>
        <p>{activeProduct.description}</p>
        <div className="im-ecosystem__chips" aria-label="Modules principaux">
          {activeProduct.modules.map((module) => (
            <span key={module} className="im-ecosystem__chip">
              {module}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}