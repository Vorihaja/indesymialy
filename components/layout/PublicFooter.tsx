import Link from "next/link";

import { Brand } from "@/components/ui";

const FOOTER_GROUPS = [
  {
    title: "Explorer",
    links: [
      ["Accueil", "/"],
      ["Actualités", "/actualites"],
      ["Discussions", "/discussion"],
      ["Évènements", "/events"],
      ["Classements", "/rankings"],
    ],
  },
  {
    title: "Écosystème",
    links: [
      ["Combattants", "/fighters"],
      ["Clubs", "/clubs"],
      ["Médias", "/media"],
      ["Marketplace", "/marketplace"],
      ["Disciplines", "/disciplines"],
    ],
  },
  {
    title: "Assistance",
    links: [
      ["Centre d’aide", "/help"],
      ["FAQ", "/faq"],
      ["Support", "/support"],
      ["Contact", "/contact"],
    ],
  },
  {
    title: "Informations légales",
    links: [
      ["Confidentialité", "/legal/privacy"],
      ["Conditions", "/legal/terms"],
      ["Cookies", "/legal/cookies"],
      ["Sécurité", "/legal/safety"],
      ["Règles de la communauté", "/legal/community-guidelines"],
    ],
  },
] as const;

export default function PublicFooter() {
  return (
    <footer className="public-footer" aria-label="Pied de page">
      <div className="public-footer-grid">
        <div className="public-footer-brand">
          <Brand />
          <p className="ds-caption">
            La plateforme des arts martiaux et sports de combat à Madagascar.
          </p>
        </div>

        {FOOTER_GROUPS.map((group) => (
          <section key={group.title}>
            <h2>{group.title}</h2>
            <nav aria-label={group.title}>
              {group.links.map(([label, href]) => (
                <Link key={href} href={href}>{label}</Link>
              ))}
            </nav>
          </section>
        ))}
      </div>

      <div className="public-footer-bottom">
        <span>© {new Date().getFullYear()} Indesy Mialy. Tous droits réservés.</span>
        <span>Madagascar</span>
      </div>
    </footer>
  );
}
