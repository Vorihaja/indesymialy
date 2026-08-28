"use client";

import Link from "next/link";

import {
  Loader,
  PublicSection,
} from "@/components/ui";

import { SearchGroups } from "../components/DiscoveryViews";
import { useDiscovery } from "../hooks/useDiscovery";
import { DiscoveryFeature } from "./DiscoveryFeature";

/**
 * ============================================================
 * HOME DISCOVERY FEATURE
 * ============================================================
 *
 * Organise les contenus publics secondaires de la page d'accueil.
 *
 * Ordre éditorial :
 * 1. Événements
 * 2. Actualités
 * 3. Écosystème sportif
 * 4. Marketplace
 *
 * Les données restent fournies par le module Discovery.
 * Aucune donnée provisoire n'est déclarée dans ce composant.
 */
export function HomeDiscoveryFeature() {
  const {
    snapshot,
    loading,
  } = useDiscovery();

  if (loading) {
    return (
      <section
        className="
          grid
          min-h-64
          place-items-center
          border-y
          border-[var(--ds-border)]
          bg-[var(--ds-surface)]
        "
        aria-busy="true"
        aria-label="Chargement des contenus publics"
      >
        <Loader label="Chargement de la scène nationale" />
      </section>
    );
  }

  if (!snapshot) {
    return (
      <PublicSection
        eyebrow="Indesy Mialy"
        title="La scène nationale se prépare"
        description="Les contenus publics seront disponibles dès leur publication."
      >
        <div
          className="
            border
            border-[var(--ds-border)]
            bg-[var(--ds-surface)]
            px-5
            py-8
            text-sm
            text-[var(--ds-text-muted)]
          "
          role="status"
        >
          Aucun contenu public n’est disponible pour le moment.
        </div>
      </PublicSection>
    );
  }

  const events = snapshot.search.filter(
    (item) => item.kind === "event",
  );

  const news = snapshot.search.filter(
    (item) => item.kind === "news",
  );

  const products = snapshot.search.filter(
    (item) => item.kind === "product",
  );

  return (
    <div className="home-discovery">
      {/* =====================================================
          ÉVÉNEMENTS
      ===================================================== */}
      <PublicSection
        eyebrow="Prochains rendez-vous"
        title="L’arène vous attend"
        description="Découvrez les galas, compétitions et événements qui rythment les sports de combat malagasy."
        action={
          <Link
            href="/events"
            className="ds-button ds-outline"
          >
            Voir le calendrier
          </Link>
        }
      >
        <SearchGroups items={events} />
      </PublicSection>

      {/* =====================================================
          ACTUALITÉS
      ===================================================== */}
      <PublicSection
        eyebrow="À la une"
        title="L’actualité des sports de combat"
        description="Résultats, annonces, parcours et informations qui font vivre la scène nationale."
        action={
          <Link
            href="/actualites"
            className="ds-button ds-outline"
          >
            Toutes les actualités
          </Link>
        }
      >
        <SearchGroups items={news} />
      </PublicSection>

      {/* =====================================================
          COMBATTANTS, CLUBS, CLASSEMENTS, DISCIPLINES, MÉDIAS
      ===================================================== */}
      <DiscoveryFeature view="home" />

      {/* =====================================================
          MARKETPLACE
      ===================================================== */}
      <PublicSection
        eyebrow="Marketplace"
        title="Équipez votre performance"
        description="Découvrez les équipements, produits et services proposés par les vendeurs de l’écosystème Indesy Mialy."
        action={
          <Link
            href="/marketplace"
            className="ds-button ds-outline"
          >
            Explorer le catalogue
          </Link>
        }
      >
        <SearchGroups items={products} />
      </PublicSection>
    </div>
  );
}