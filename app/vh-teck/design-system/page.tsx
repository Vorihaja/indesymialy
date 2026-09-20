import type { Metadata } from "next";
import {
  IndesyBrandMark,
  IndesyButton,
  IndesyEcosystemMap,
  IndesyPanel,
  IndesyStatusBadge,
  IndesyThemeToggle,
} from "@/components/ui/indesy";

export const metadata: Metadata = {
  title: "Fondation visuelle | Indesy Control Center",
  description: "Validation privée du système visuel unifié Indesy.",
};

export default function IndesyDesignSystemPage() {
  return (
    <main className="im-lab">
      <div className="im-lab__container">
        <header className="im-lab__topbar">
          <div className="im-lab__brand">
            <IndesyBrandMark size={31} />
            <div>
              <strong>INDESY</strong>
              <span>VISUAL SYSTEM · UI-R1</span>
            </div>
          </div>
          <IndesyThemeToggle />
        </header>

        <section className="im-lab__hero">
          <div>
            <p className="im-kicker">Fondation visuelle unifiée</p>
            <h1>
              Un écosystème cohérent.
              <br />
              <span>Quatre expériences distinctes.</span>
            </h1>
            <p>
              Cette page valide les couleurs, surfaces, états, composants et
              interactions qui guideront la refonte de Mialy, Korana, ERP et Bazar.
            </p>
          </div>
        </section>

        <div className="im-lab__status-row" aria-label="État de la fondation">
          <IndesyStatusBadge tone="active">Fondation active</IndesyStatusBadge>
          <IndesyStatusBadge tone="neutral">Graphite & argent</IndesyStatusBadge>
          <IndesyStatusBadge tone="warning">Intégration progressive</IndesyStatusBadge>
        </div>

        <IndesyEcosystemMap />

        <div className="im-lab__grid">
          <IndesyPanel kicker="Actions" title="Hiérarchie des boutons" accent>
            <p className="im-lab__sample-copy">
              Le rouge sert aux actions décisives. Les actions secondaires restent
              sobres et structurées.
            </p>
            <div className="im-lab__actions">
              <IndesyButton>Action principale</IndesyButton>
              <IndesyButton tone="secondary">Action secondaire</IndesyButton>
              <IndesyButton tone="ghost">Action discrète</IndesyButton>
            </div>
          </IndesyPanel>

          <IndesyPanel kicker="Surfaces" title="Panneaux opérationnels">
            <h3 className="im-lab__sample-title">Clarté avant décoration</h3>
            <p className="im-lab__sample-copy">
              Bordures fines, relief contenu et rayons faibles pour les interfaces
              publiques, sociales et professionnelles.
            </p>
          </IndesyPanel>

          <IndesyPanel kicker="Palette" title="Codes visuels permanents">
            <div className="im-color-strip" aria-label="Graphite, surface, argent, rouge et bleu" role="img">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </IndesyPanel>
        </div>
      </div>
    </main>
  );
}