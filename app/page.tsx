import type { Metadata } from "next";

import HomeCockpit from "@/components/home/HomeCockpit";
import { PublicPage } from "@/components/ui";
import { PublicStructuredData } from "@/modules/discovery-core/components/PublicStructuredData";

export const metadata: Metadata = {
  title: "Indesy Mialy — Sports de combat à Madagascar",
  description:
    "Découvrez les combattants, clubs, évènements, classements et médias des sports de combat malagasy.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Indesy Mialy",
    description:
      "La plateforme nationale des sports de combat à Madagascar.",
    type: "website",
  },
};

export default function Page() {
  return (
    <PublicPage className="home-cockpit-page">
      <PublicStructuredData />
      <HomeCockpit />
    </PublicPage>
  );
}