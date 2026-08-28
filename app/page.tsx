import type { Metadata } from "next";
import HeroAndFeatures from "@/components/home/HeroAndFeatures";
import HeroCarousel from "@/components/home/HeroCarousel";
import HeroStatusPanel from "@/components/home/HeroStatusPanel";
import LiveFightCenter from "@/components/home/LiveFightCenter";
import PlatformStats from "@/components/home/PlatformStats";
import { HomeMotionStory, HomePulseRibbon } from "@/components/home/HomeMotionStory";
import { PublicPage, PublicSection } from "@/components/ui";
import { PublicStructuredData } from "@/modules/discovery-core/components/PublicStructuredData";
import { HomeDiscoveryFeature } from "@/modules/discovery-core/features/HomeDiscoveryFeature";

export const metadata: Metadata = {
  title: "Indesy Mialy — Sports de combat à Madagascar",
  description: "Découvrez les combattants, clubs, événements, classements et médias des sports de combat malagasy.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Indesy Mialy",
    description: "La plateforme nationale des sports de combat à Madagascar.",
    type: "website",
  },
};

export default function Page() {
  return (
    <PublicPage>
      <PublicStructuredData />
      <HeroCarousel />
      <HomePulseRibbon />
      <HomeMotionStory />

      <main className="public-container">
        <PublicSection
          id="arena-control"
          eyebrow="Centre de l’arène"
          title="L’événement et le combat du moment"
          description="Suivez le prochain rendez-vous majeur et consultez les informations Fight Live actuellement disponibles."
        >
          <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,2fr)]">
            <HeroStatusPanel />
            <LiveFightCenter />
          </div>
        </PublicSection>

        <PublicSection
          id="platform-statistics"
          eyebrow="Données nationales"
          title="La scène malagasy en chiffres"
          description="Une lecture instantanée de l’activité des combattants, clubs, disciplines et événements."
        >
          <PlatformStats />
        </PublicSection>
      </main>

      <HeroAndFeatures />

      <main className="public-container">
        <HomeDiscoveryFeature />
      </main>
    </PublicPage>
  );
}
