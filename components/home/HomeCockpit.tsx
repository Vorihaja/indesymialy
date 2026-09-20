"use client";

import type {
  KeyboardEvent,
  ReactNode,
} from "react";
import { useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Radio,
  RefreshCw,
  Shield,
  Store,
  Swords,
  Target,
  Trophy,
  UsersRound,
  Zap,
  type LucideIcon,
} from "lucide-react";

import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";

import GlobalSearchBar from "@/components/navigation/GlobalSearchBar";
import { useDiscovery } from "@/modules/discovery-core/hooks/useDiscovery";
import { useHomeSeason } from "@/modules/home-season";

type HomeSection =
  | "season"
  | "news"
  | "events"
  | "rankings"
  | "fighters"
  | "clubs"
  | "ecosystem";

interface SectionDefinition {
  id: HomeSection;
  number: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

const SECTIONS: SectionDefinition[] = [
  {
    id: "season",
    number: "01",
    label: "Accueil",
    shortLabel: "Portail national",
    icon: Swords,
  },
  {
    id: "news",
    number: "02",
    label: "Actualités",
    shortLabel: "Actus",
    icon: Radio,
  },
  {
    id: "events",
    number: "03",
    label: "Évènements",
    shortLabel: "Évènements",
    icon: CalendarDays,
  },
  {
    id: "rankings",
    number: "04",
    label: "Classements",
    shortLabel: "Classements",
    icon: Trophy,
  },
  {
    id: "fighters",
    number: "05",
    label: "Combattants",
    shortLabel: "Combattants",
    icon: Target,
  },
  {
    id: "clubs",
    number: "06",
    label: "Clubs",
    shortLabel: "Clubs",
    icon: Shield,
  },

];

const DATE_FORMATTER = new Intl.DateTimeFormat("fr-MG", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Indian/Antananarivo",
});

function PanelHeading({
  eyebrow,
  title,
  description,
  href,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <header className="home-cockpit-panel-heading">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      {href && action ? (
        <Link href={href} className="home-cockpit-panel-action">
          {action}
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      ) : null}
    </header>
  );
}

function Metric({
  value,
  label,
}: {
  value: number | string;
  label: string;
}) {
  return (
    <div className="home-cockpit-metric">
      <strong>
        {typeof value === "number"
          ? value.toLocaleString("fr-MG")
          : value}
      </strong>
      <span>{label}</span>
    </div>
  );
}

function DataRow({
  index,
  title,
  meta,
  href,
  trailing,
}: {
  index: number;
  title: string;
  meta?: string;
  href?: string;
  trailing?: ReactNode;
}) {
  const content = (
    <>
      <span className="home-cockpit-row-index">
        {String(index + 1).padStart(2, "0")}
      </span>

      <span className="home-cockpit-row-copy">
        <strong>{title}</strong>
        {meta ? <small>{meta}</small> : null}
      </span>

      {trailing ? (
        <span className="home-cockpit-row-trailing">{trailing}</span>
      ) : null}

      {href ? <ArrowRight aria-hidden="true" size={15} /> : null}
    </>
  );

  return href ? (
    <Link href={href} className="home-cockpit-row">
      {content}
    </Link>
  ) : (
    <div className="home-cockpit-row">{content}</div>
  );
}

function Feedback({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="home-cockpit-feedback" role="status">
      <Zap aria-hidden="true" />
      <strong>{title}</strong>
      <p>{description}</p>

      {onRetry ? (
        <button type="button" onClick={onRetry}>
          <RefreshCw aria-hidden="true" size={15} />
          Réessayer
        </button>
      ) : null}
    </div>
  );
}

const ECOSYSTEM = [
  {
    label: "Indesy Mialy",
    status: "Cœur",
    description: "Portail national, profils publics et identité sportive.",
    href: "/",
    icon: Swords,
  },
  {
    label: "Indesy Korana",
    status: "Social",
    description: "Discussions, communautés et circulation de l’actualité.",
    href: "/korana",
    icon: UsersRound,
  },
  {
    label: "Indesy ERP",
    status: "Pro",
    description: "Workspaces opérationnels adaptés à chaque rôle.",
    href: "/account",
    icon: Target,
  },
  {
    label: "Indesy Bazar",
    status: "Séparé",
    description: "Marketplace connectée à l’identité Indesy.",
    href: "/marketplace",
    icon: Store,
  },
] as const;

export default function HomeCockpit() {
  const [active, setActive] = useState<HomeSection>("season");
  const reducedMotion = useReducedMotion();

  const {
    snapshot: season,
    loading: seasonLoading,
    error: seasonError,
    refresh: refreshSeason,
  } = useHomeSeason();

  const {
    snapshot: discovery,
    loading: discoveryLoading,
    error: discoveryError,
  } = useDiscovery();

  const breakingNews = discovery?.breakingNews ?? [];

  const badges: Record<HomeSection, string> = {
    season: season ? String(season.season) : "LIVE",
    news: String(discovery?.breakingNews.length ?? 0),
    events: String(season?.statistics.upcoming ?? 0),
    rankings: String(discovery?.rankings.length ?? 0),
    fighters: String(discovery?.fighters.length ?? 0),
    clubs: String(discovery?.clubs.length ?? 0),
    ecosystem: "4",
  };

  const handleTabKeyboard = (
    event: KeyboardEvent<HTMLDivElement>,
  ) => {
    if (
      event.key !== "ArrowDown" &&
      event.key !== "ArrowUp" &&
      event.key !== "ArrowRight" &&
      event.key !== "ArrowLeft" &&
      event.key !== "Home" &&
      event.key !== "End"
    ) {
      return;
    }

    event.preventDefault();

    const tabs = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]',
      ),
    );

    const currentIndex = tabs.findIndex(
      (tab) => tab === document.activeElement,
    );

    let nextIndex = currentIndex < 0 ? 0 : currentIndex;

    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;

    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextIndex = (nextIndex + 1) % tabs.length;
    }

    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      nextIndex = (nextIndex - 1 + tabs.length) % tabs.length;
    }

    const nextTab = tabs[nextIndex];
    const nextSection = SECTIONS[nextIndex];

    nextTab?.focus();

    if (nextSection) {
      setActive(nextSection.id);
    }
  };

  const renderPanel = () => {
    if (active === "ecosystem") {
      return (
        <>
          <PanelHeading
            eyebrow="Architecture interactive"
            title="Un système, quatre expériences"
            description="Chaque univers possède sa fonction, tout en partageant la même identité Indesy."
          />

          <div className="home-cockpit-ecosystem">
            {ECOSYSTEM.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  href={item.href}
                  className="home-cockpit-product"
                  key={item.label}
                >
                  <span className="home-cockpit-product-icon">
                    <Icon aria-hidden="true" />
                  </span>

                  <span>
                    <small>{item.status}</small>
                    <strong>{item.label}</strong>
                    <p>{item.description}</p>
                  </span>

                  <ArrowRight aria-hidden="true" size={16} />
                </Link>
              );
            })}
          </div>

          <div className="home-cockpit-services">
            {[
              "Identité unique",
              "Profils & rôles",
              "Messagerie",
              "Agenda",
              "Paiements",
            ].map((service) => (
              <span key={service}>{service}</span>
            ))}
          </div>
        </>
      );
    }

    const usesSeason =
      active === "season" || active === "events";

    if (
      (usesSeason && seasonLoading) ||
      (!usesSeason && discoveryLoading)
    ) {
      return (
        <div className="home-cockpit-loader">
          <IndesyDualOrbitLoader
            variant="data"
            label="Synchronisation des données Indesy"
          />
        </div>
      );
    }

    if (usesSeason && seasonError) {
      return (
        <Feedback
          title="Données de saison indisponibles"
          description={seasonError}
          onRetry={() => void refreshSeason()}
        />
      );
    }

    if (!usesSeason && discoveryError) {
      return (
        <Feedback
          title="Données publiques indisponibles"
          description={discoveryError}
        />
      );
    }

    switch (active) {
      case "season":
        return (
          <>
            <PanelHeading
              eyebrow={
                season
                  ? `Saison ${season.season}`
                  : "Calendrier national"
              }
              title="Le combat malagasy, maintenant"
              description="Indesy Mialy réunit l’actualité, les acteurs et les rendez-vous des sports de combat malagasy."
              href="/events"
            />

            <div className="home-cockpit-season-layout">
              <div className="home-cockpit-season-main">
                <div className="home-cockpit-metrics">
                  <Metric
                    value={season?.statistics.events ?? 0}
                    label="Évènements"
                  />
                  <Metric
                    value={season?.statistics.upcoming ?? 0}
                    label="À venir"
                  />
                  <Metric
                    value={season?.statistics.completed ?? 0}
                    label="Terminés"
                  />
                  <Metric
                    value={season?.statistics.fights ?? 0}
                    label="Combats"
                  />
                </div>

                <div className="home-cockpit-season-signal">
                  <Radio aria-hidden="true" size={16} />
                  <span>
                    Données publiques synchronisées avec la plateforme
                  </span>
                </div>
              </div>

              {season?.nextEvent ? (
                <Link
                  href={`/events/${season.nextEvent.id}`}
                  className="home-cockpit-event-card"
                >
                  <small>Prochain rendez-vous</small>
                  <strong>{season.nextEvent.title}</strong>
                  <span>
                    <CalendarDays aria-hidden="true" size={15} />
                    {DATE_FORMATTER.format(
                      new Date(season.nextEvent.startsAt),
                    )}
                  </span>
                  {season.nextEvent.venue ? (
                    <p>{season.nextEvent.venue}</p>
                  ) : null}
                  <em>
                    Voir l’évènement
                    <ArrowRight aria-hidden="true" size={15} />
                  </em>
                </Link>
              ) : (
                <Feedback
                  title="Aucun évènement à venir"
                  description="Le calendrier sera actualisé à la prochaine publication."
                />
              )}
            </div>
          </>
        );

      case "news": {
        const news = discovery?.breakingNews.slice(0, 4) ?? [];

        return (
          <>
            <PanelHeading
              eyebrow="Signal national"
              title="Actualités Indesy"
              description="Les informations actuellement publiées dans l’écosystème des sports de combat."
              href="/actualites"
              action="Toutes les actualités"
            />

            {news.length ? (
              <div className="home-cockpit-list">
                {news.map((item, index) => (
                  <DataRow
                    key={`${item}-${index}`}
                    index={index}
                    title={item}
                    meta="Communiqué public"
                  />
                ))}
              </div>
            ) : (
              <Feedback
                title="Aucune actualité publiée"
                description="Les prochains communiqués apparaîtront ici."
              />
            )}
          </>
        );
      }

      case "events":
        return (
          <>
            <PanelHeading
              eyebrow="Calendrier public"
              title="Prochain évènement"
              description="Le rendez-vous immédiatement accessible depuis les données officielles de la saison."
              href="/events"
              action="Voir le calendrier"
            />

            {season?.nextEvent ? (
              <div className="home-cockpit-event-focus">
                <span className="home-cockpit-event-symbol">
                  <CalendarDays aria-hidden="true" />
                </span>

                <div>
                  <small>
                    {season.nextEvent.type ?? "Évènement sportif"}
                  </small>
                  <h3>{season.nextEvent.title}</h3>
                  <p>
                    {DATE_FORMATTER.format(
                      new Date(season.nextEvent.startsAt),
                    )}
                  </p>
                  {season.nextEvent.venue ? (
                    <strong>{season.nextEvent.venue}</strong>
                  ) : null}
                </div>

                <Link href={`/events/${season.nextEvent.id}`}>
                  Ouvrir
                  <ArrowRight aria-hidden="true" size={16} />
                </Link>
              </div>
            ) : (
              <Feedback
                title="Aucun rendez-vous programmé"
                description="Aucun évènement public à venir n’est actuellement disponible."
              />
            )}

            <div className="home-cockpit-metrics home-cockpit-metrics-compact">
              <Metric
                value={season?.statistics.events ?? 0}
                label="Total saison"
              />
              <Metric
                value={season?.statistics.upcoming ?? 0}
                label="À venir"
              />
              <Metric
                value={season?.statistics.completed ?? 0}
                label="Terminés"
              />
              <Metric
                value={season?.statistics.fights ?? 0}
                label="Combats"
              />
            </div>
          </>
        );

      case "rankings": {
        const rankings = discovery?.rankings.slice(0, 4) ?? [];

        return (
          <>
            <PanelHeading
              eyebrow="Performance nationale"
              title="Tête des classements"
              description="Les combattants les mieux positionnés selon les données publiques disponibles."
              href="/rankings"
              action="Tous les classements"
            />

            {rankings.length ? (
              <div className="home-cockpit-list">
                {rankings.map((item, index) => (
                  <DataRow
                    key={item.id}
                    index={index}
                    title={item.name}
                    meta={[
                      item.discipline,
                      item.category,
                    ].filter(Boolean).join(" · ")}
                    href={item.href ?? "/rankings"}
                    trailing={`${item.elo} ELO`}
                  />
                ))}
              </div>
            ) : (
              <Feedback
                title="Classements indisponibles"
                description="Les classements apparaîtront dès que les données sportives seront publiées."
              />
            )}
          </>
        );
      }

      case "fighters": {
        const fighters = discovery?.fighters.slice(0, 4) ?? [];

        return (
          <>
            <PanelHeading
              eyebrow="Talents malagasy"
              title="Combattants en vue"
              description="Une sélection issue du répertoire public des combattants Indesy."
              href="/fighters"
              action="Tous les combattants"
            />

            {fighters.length ? (
              <div className="home-cockpit-list">
                {fighters.map((fighter, index) => (
                  <DataRow
                    key={fighter.id}
                    index={index}
                    title={fighter.name}
                    meta={[
                      fighter.disciplines[0],
                      fighter.weightCategory,
                      fighter.region,
                    ].filter(Boolean).join(" · ")}
                    href={`/${fighter.identifier ?? fighter.id}`}
                    trailing={`${fighter.record.wins}-${fighter.record.losses}-${fighter.record.draws}`}
                  />
                ))}
              </div>
            ) : (
              <Feedback
                title="Aucun combattant publié"
                description="Les profils publics validés apparaîtront ici."
              />
            )}
          </>
        );
      }

      case "clubs": {
        const clubs = discovery?.clubs.slice(0, 4) ?? [];

        return (
          <>
            <PanelHeading
              eyebrow="Réseau national"
              title="Clubs et académies"
              description="Les structures présentes dans le répertoire sportif public."
              href="/clubs"
              action="Tous les clubs"
            />

            {clubs.length ? (
              <div className="home-cockpit-list">
                {clubs.map((club, index) => (
                  <DataRow
                    key={club.id}
                    index={index}
                    title={club.name}
                    meta={[
                      club.disciplines[0],
                      club.city,
                      club.region,
                    ].filter(Boolean).join(" · ")}
                    href={`/${club.identifier ?? club.id}`}
                    trailing={club.official ? "Officiel" : undefined}
                  />
                ))}
              </div>
            ) : (
              <Feedback
                title="Aucun club publié"
                description="Les clubs publics apparaîtront ici après leur publication."
              />
            )}
          </>
        );

      }
      default:
        return null;
    }
  };

  const selectedSection =
    SECTIONS.find((section) => section.id === active) ?? SECTIONS[0];

  return (
    <section
      className="home-cockpit"
      aria-labelledby="home-cockpit-title"
    >
      <div className="home-cockpit-grid" aria-hidden="true" />
      <div className="home-cockpit-glow" aria-hidden="true" />

      <motion.header
        className="home-cockpit-header home-cockpit-command-strip"
        initial={reducedMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reducedMotion ? 0 : 0.42,
          ease: "easeOut",
        }}
      >
        <h1
          id="home-cockpit-title"
          className="home-cockpit-visually-hidden"
        >
          Indesy Mialy — portail national des sports de combat malagasy
        </h1>

        <div
          className="home-cockpit-breaking-news"
          aria-label="Breaking News Indesy"
        >
          <span className="home-cockpit-breaking-label">
            <Radio aria-hidden="true" size={13} />
            Breaking News
          </span>

          <div
            className="home-cockpit-breaking-viewport"
            aria-live="polite"
          >
            {breakingNews.length > 0 ? (
              <div
                className={[
                  "home-cockpit-breaking-track",
                  breakingNews.length > 1 ? "is-animated" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {breakingNews.map((item, index) => (
                  <span key={"primary-" + index}>
                    {item}
                  </span>
                ))}

                {breakingNews.length > 1
                  ? breakingNews.map((item, index) => (
                      <span
                        key={"duplicate-" + index}
                        aria-hidden="true"
                      >
                        {item}
                      </span>
                    ))
                  : null}
              </div>
            ) : (
              <span className="home-cockpit-breaking-empty">
                Aucune actualité urgente publiée.
              </span>
            )}
          </div>

          <span className="home-cockpit-breaking-live">
            En direct
          </span>
        </div>
      </motion.header>

      <div className="home-cockpit-stage">
        <nav
          className="home-cockpit-navigation"
          aria-label="Sections de la page d’accueil"
        >
          <div
            className="home-cockpit-tabs"
            role="tablist"
            aria-orientation="vertical"
            onKeyDown={handleTabKeyboard}
          >
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const selected = active === section.id;

              return (
                <motion.button
                  type="button"
                  role="tab"
                  id={`home-tab-${section.id}`}
                  aria-controls="home-cockpit-panel"
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  className={selected ? "is-active" : undefined}
                  onClick={() => setActive(section.id)}
                  whileHover={reducedMotion ? undefined : { x: 4 }}
                  whileTap={reducedMotion ? undefined : { scale: 0.985 }}
                  transition={{ duration: reducedMotion ? 0 : 0.16 }}
                  key={section.id}
                >
                  {selected ? (
                    <motion.span
                      className="home-cockpit-tab-active-rail"
                      layoutId="home-cockpit-active-tab"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className="home-cockpit-tab-number">
                    {section.number}
                  </span>

                  <span className="home-cockpit-tab-icon">
                    <Icon aria-hidden="true" />
                  </span>

                  <span className="home-cockpit-tab-label">
                    <strong>{section.label}</strong>
                    <small>{section.shortLabel}</small>
                  </span>

                  <span className="home-cockpit-tab-badge">
                    {badges[section.id]}
                  </span>

                  <ArrowRight
                    className="home-cockpit-tab-arrow"
                    aria-hidden="true"
                    size={15}
                  />
                </motion.button>
              );
            })}
          </div>
        </nav>

        <div
          id="home-cockpit-panel"
          className="home-cockpit-panel"
          role="tabpanel"
          aria-labelledby={`home-tab-${selectedSection.id}`}
          aria-live="polite"
        >
            <motion.div
              className="home-cockpit-panel-tools"
              aria-label="Recherche et filtres des contenus"
              initial={
                reducedMotion
                  ? false
                  : { opacity: 0, y: -6 }
              }
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reducedMotion ? 0 : 0.35,
                delay: reducedMotion ? 0 : 0.08,
              }}
            >
              <span className="home-cockpit-tools-label">
                Explorer
              </span>

              <div className="home-cockpit-panel-search">
                <GlobalSearchBar compact />
              </div>
            </motion.div>

            <AnimatePresence mode="wait" initial={false}>
            <motion.div
              className="home-cockpit-panel-inner"
              key={active}
              initial={{
                opacity: 0,
                x: reducedMotion ? 0 : 22,
                scale: reducedMotion ? 1 : 0.992,
                filter: reducedMotion ? "none" : "blur(5px)",
              }}
              animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
              exit={{
                opacity: 0,
                x: reducedMotion ? 0 : -14,
                scale: reducedMotion ? 1 : 0.996,
                filter: reducedMotion ? "none" : "blur(3px)",
              }}
              transition={{
                duration: reducedMotion ? 0 : 0.34,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {renderPanel()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <footer className="home-cockpit-footer">
        <span>
          <span className="home-cockpit-live-dot" aria-hidden="true" />
          Écosystème connecté
        </span>

        <div>
          <span>Identité</span>
          <span>Sport</span>
          <span>Social</span>
          <span>ERP</span>
          <span>Marketplace</span>
        </div>
      </footer>
    </section>
  );
}
