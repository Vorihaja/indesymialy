"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ChevronDown,
  Dumbbell,
  Globe2,
  ImageIcon,
  LayoutGrid,
  Menu,
  MessageSquareText,
  Radio,
  Search,
  Trophy,
  Users,
  X,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";

import {
  IconButton,
  ThemeToggle,
} from "@/components/ui";

import AuthTopBar from "./AuthTopBar";

const LOGO_URL =
  "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/logo";


/**
 * Symbole social Indesy Korana.
 *
 * Le "K" représente Korana.
 * Le contour évoque simultanément :
 * - une conversation,
 * - un réseau,
 * - un espace communautaire.
 *
 * Cette icône est volontairement indépendante de la messagerie :
 * Korana est un réseau social complet, pas seulement un chat.
 */
function KoranaNavIcon({
  size = 22,
}: {
  size?: number;
}) {

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="overflow-visible"
    >

      {/* Cadre premium */}

      <rect
        x="2.75"
        y="2.75"
        width="18.5"
        height="18.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.35"
        opacity="0.9"
      />


      {/* K - ligne principale */}

      <path
        d="M7.7 7.15V16.85"
        stroke="currentColor"
        strokeWidth="2.15"
        strokeLinecap="round"
      />


      {/* K - branche supérieure */}

      <path
        d="M8.05 12L14.55 7.2"
        stroke="currentColor"
        strokeWidth="2.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />


      {/* K - branche inférieure */}

      <path
        d="M8.05 12L14.8 16.8"
        stroke="currentColor"
        strokeWidth="2.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />


      {/* Signature rouge Korana */}

      <path
        d="M17.55 7.05V10.15"
        stroke="#ff1638"
        strokeWidth="2.25"
        strokeLinecap="round"
      />


      {/* Micro accent */}

      <circle
        cx="17.55"
        cy="14.85"
        r="1.15"
        fill="#ff1638"
      />

    </svg>
  );
}

const primaryLinks = [
  ["Accueil", "/"],
  ["Actualités", "/actualites"],
  ["Événements", "/events"],
  ["Combattants", "/fighters"],
  ["Marketplace", "/marketplace"],
] as const;

const ecosystemGroups = [
  {
    title: "Communauté",
    items: [
      {
        label: "Indesy Korana",
        href: "/korana",
        description: "Réseau social des sports de combat",
        icon: MessageSquareText,
      },
      {
        label: "Discussions",
        href: "/discussion",
        description: "Échanges et communauté",
        icon: MessageSquareText,
      },
      {
        label: "Médias",
        href: "/media",
        description: "Photos, vidéos et galeries",
        icon: ImageIcon,
      },
    ],
  },
  {
    title: "Compétition",
    items: [
      {
        label: "Classements",
        href: "/rankings",
        description: "ELO, catégories et progression",
        icon: Trophy,
      },
      {
        label: "Disciplines",
        href: "/disciplines",
        description: "Toutes les disciplines",
        icon: Dumbbell,
      },
    ],
  },
  {
    title: "Écosystème",
    items: [
      {
        label: "Clubs",
        href: "/clubs",
        description: "Structures et équipes",
        icon: Building2,
      },
      {
        label: "Régions",
        href: "/regions",
        description: "La scène par territoire",
        icon: Globe2,
      },
      {
        label: "Annuaire",
        href: "/annuaire",
        description: "Tous les acteurs de la plateforme",
        icon: Users,
      },
    ],
  },
] as const;

type NavbarProps = {
  isLightMode?: boolean;
  onToggleSearch?: () => void;
  showSearch?: boolean;
};

export default function Navbar({
  onToggleSearch,
  showSearch = false,
}: NavbarProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [ecosystemOpen, setEcosystemOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const ecosystemRef = useRef<HTMLDivElement>(null);

  const active = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  };

  const ecosystemIsActive = useMemo(
    () =>
      ecosystemGroups.some((group) =>
        group.items.some((item) => active(item.href)),
      ),
    [pathname],
  );

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setEcosystemOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        ecosystemRef.current &&
        !ecosystemRef.current.contains(event.target as Node)
      ) {
        setEcosystemOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handlePointerDown,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown,
      );
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop;

      const scrollHeight =
        document.documentElement.scrollHeight -
        window.innerHeight;

      setScrolled(scrollTop > 24);

      setScrollProgress(
        scrollHeight > 0
          ? Math.min(
              100,
              (scrollTop / scrollHeight) * 100,
            )
          : 0,
      );
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll,
      );
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setEcosystemOpen(false);
  }, [pathname]);

  const mainLinks = primaryLinks.map(
    ([label, href], index) => {
      const isActive = active(href);

      return (
        <motion.div
          key={href}
          initial={
            reduceMotion
              ? false
              : {
                  opacity: 0,
                  y: -8,
                }
          }
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: reduceMotion ? 0 : 0.35,
            delay: reduceMotion
              ? 0
              : index * 0.035,
          }}
        >
          <Link
            href={href}
            className="public-nav-link"
            aria-current={
              isActive ? "page" : undefined
            }
          >
            <span>{label}</span>

            <span
              className="public-nav-link-line"
              aria-hidden="true"
            />
          </Link>
        </motion.div>
      );
    },
  );

  return (
    <motion.div
      className="public-navbar"
      data-scrolled={scrolled}
      initial={
        reduceMotion
          ? false
          : {
              opacity: 0,
              y: -20,
            }
      }
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: reduceMotion ? 0 : 0.55,
        ease: "easeOut",
      }}
    >
      {/* ===================================================
          PROGRESSION DE PAGE
      =================================================== */}
      <div
        className="public-navbar-progress"
        aria-hidden="true"
      >
        <motion.div
          className="public-navbar-progress-fill"
          animate={{
            width: `${scrollProgress}%`,
          }}
          transition={{
            duration: reduceMotion ? 0 : 0.15,
          }}
        />
      </div>

      <div className="public-navbar-inner">
        {/* =================================================
            MARQUE
        ================================================= */}
        <Link
          href="/"
          className="public-brand"
          aria-label="Indesy Mialy — Accueil"
        >
          <motion.span
            className="public-brand-logo"
            whileHover={
              reduceMotion
                ? undefined
                : {
                    scale: 1.06,
                  }
            }
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 20,
            }}
          >
            <img
              src={LOGO_URL}
              alt=""
              aria-hidden="true"
            />

            <span
              className="public-brand-logo-glow"
              aria-hidden="true"
            />
          </motion.span>

          <span className="public-brand-copy">
            <span className="public-brand-name">
              INDESY <strong>MIALY</strong>
            </span>

            <span className="public-brand-tagline">
              Plateforme de sports de combat
            </span>
          </span>
        </Link>

        {/* =================================================
            NAVIGATION DESKTOP
        ================================================= */}
        <nav
          className="public-nav-links"
          aria-label="Navigation principale"
        >
          {mainLinks}

          <div
            ref={ecosystemRef}
            className="public-ecosystem"
          >
            <button
              type="button"
              className="public-nav-link public-ecosystem-trigger"
              data-active={ecosystemIsActive}
              aria-expanded={ecosystemOpen}
              aria-haspopup="true"
              onClick={() =>
                setEcosystemOpen((value) => !value)
              }
            >
              <span>Écosystème</span>

              <ChevronDown
                size={14}
                className="public-ecosystem-chevron"
                aria-hidden="true"
              />

              <span
                className="public-nav-link-line"
                aria-hidden="true"
              />
            </button>

            <AnimatePresence>
              {ecosystemOpen ? (
                <motion.div
                  className="public-ecosystem-panel"
                  initial={
                    reduceMotion
                      ? false
                      : {
                          opacity: 0,
                          y: -8,
                          scale: 0.985,
                        }
                  }
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: -8,
                    scale: 0.985,
                  }}
                  transition={{
                    duration: reduceMotion
                      ? 0
                      : 0.22,
                    ease: "easeOut",
                  }}
                >
                  <motion.div
                    className="public-ecosystem-scan"
                    aria-hidden="true"
                    animate={
                      reduceMotion
                        ? undefined
                        : {
                            x: ["-120%", "320%"],
                          }
                    }
                    transition={
                      reduceMotion
                        ? undefined
                        : {
                            duration: 2.6,
                            repeat: Infinity,
                            repeatDelay: 4,
                            ease: "easeInOut",
                          }
                    }
                  />

                  <header className="public-ecosystem-head">
                    <div>
                      <span>INDESY MIALY</span>

                      <strong>
                        Écosystème de la plateforme
                      </strong>
                    </div>

                    <LayoutGrid
                      size={20}
                      aria-hidden="true"
                    />
                  </header>

                  <div className="public-ecosystem-grid">
                    {ecosystemGroups.map(
                      (group, groupIndex) => (
                        <motion.section
                          key={group.title}
                          initial={
                            reduceMotion
                              ? false
                              : {
                                  opacity: 0,
                                  y: 8,
                                }
                          }
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          transition={{
                            duration: reduceMotion
                              ? 0
                              : 0.28,
                            delay: reduceMotion
                              ? 0
                              : groupIndex * 0.06,
                          }}
                        >
                          <h3>
                            {group.title}
                          </h3>

                          <div>
                            {group.items.map(
                              (item) => {
                                const Icon =
                                  item.icon;

                                return (
                                  <Link
                                    key={item.href}
                                    href={item.href}
                                    className="public-ecosystem-item"
                                    aria-current={
                                      active(
                                        item.href,
                                      )
                                        ? "page"
                                        : undefined
                                    }
                                  >
                                    <span className="public-ecosystem-item-icon">
                                      <Icon
                                        size={18}
                                        aria-hidden="true"
                                      />
                                    </span>

                                    <span>
                                      <strong>
                                        {
                                          item.label
                                        }
                                      </strong>

                                      <small>
                                        {
                                          item.description
                                        }
                                      </small>
                                    </span>
                                  </Link>
                                );
                              },
                            )}
                          </div>
                        </motion.section>
                      ),
                    )}
                  </div>

                  <footer className="public-ecosystem-foot">
                    <Link
                      href="/annuaire"
                      className="public-ecosystem-all"
                    >
                      Explorer toute la plateforme

                      <span aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </footer>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </nav>

        {/* =================================================
            ACTIONS
        ================================================= */}
        <div className="public-nav-actions">
          <Link
            href="/live"
            className="public-live-link optional-mobile"
            aria-label="Combat en direct"
          >
            <span className="public-live-dot" />

            <Radio
              size={15}
              aria-hidden="true"
            />

            <span>DIRECT</span>
          </Link>

          {onToggleSearch ? (
            <IconButton
              variant={
                showSearch
                  ? "primary"
                  : "ghost"
              }
              aria-label={
                showSearch
                  ? "Fermer la recherche"
                  : "Ouvrir la recherche"
              }
              aria-expanded={showSearch}
              onClick={onToggleSearch}
            >
              <Search size={17} />
            </IconButton>
          ) : null}

          <Link
            href="/korana"
            className="group relative ds-button ds-ghost ds-icon-button optional-mobile text-zinc-300 transition hover:text-white"
            aria-label="Indesy Korana"
            title="Indesy Korana"
          >
            <span
              className="transition-transform duration-200 group-hover:scale-110"
              aria-hidden="true"
            >
              <KoranaNavIcon size={22} />
            </span>

            <span
              className="pointer-events-none absolute -bottom-0.5 left-1/2 h-[2px] w-0 -translate-x-1/2 bg-[#ff1638] transition-all duration-200 group-hover:w-4"
              aria-hidden="true"
            />
          </Link>

          <ThemeToggle compact />

          <AuthTopBar />

          <IconButton
            className="public-mobile-button"
            variant="ghost"
            aria-label={
              mobileOpen
                ? "Fermer le menu"
                : "Ouvrir le menu"
            }
            aria-expanded={mobileOpen}
            aria-controls="public-mobile-menu"
            onClick={() =>
              setMobileOpen((value) => !value)
            }
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={
                  mobileOpen
                    ? "close"
                    : "menu"
                }
                initial={
                  reduceMotion
                    ? false
                    : {
                        opacity: 0,
                        rotate: -25,
                      }
                }
                animate={{
                  opacity: 1,
                  rotate: 0,
                }}
                exit={{
                  opacity: 0,
                  rotate: 25,
                }}
                transition={{
                  duration: reduceMotion
                    ? 0
                    : 0.18,
                }}
              >
                {mobileOpen ? (
                  <X size={19} />
                ) : (
                  <Menu size={19} />
                )}
              </motion.span>
            </AnimatePresence>
          </IconButton>
        </div>
      </div>

      {/* ===================================================
          MENU MOBILE
      =================================================== */}
      <AnimatePresence>
        {mobileOpen ? (
          <motion.nav
            id="public-mobile-menu"
            className="public-mobile-menu"
            aria-label="Navigation mobile"
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    height: 0,
                  }
            }
            animate={{
              opacity: 1,
              height: "auto",
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
            transition={{
              duration: reduceMotion
                ? 0
                : 0.28,
              ease: "easeInOut",
            }}
          >
            <div className="public-mobile-menu-head">
              <div>
                <span>INDESY MIALY</span>

                <strong>
                  CENTRE DE COMMANDEMENT
                </strong>
              </div>

              <Link
                href="/live"
                className="public-mobile-live"
                aria-label="Combat en direct"
              >
                <span className="public-live-dot" />
                DIRECT
              </Link>
            </div>

            <div className="public-mobile-primary-links">
              {primaryLinks.map(
                ([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    className="public-nav-link"
                    aria-current={
                      active(href)
                        ? "page"
                        : undefined
                    }
                  >
                    <span>{label}</span>

                    <span
                      className="public-nav-link-line"
                      aria-hidden="true"
                    />
                  </Link>
                ),
              )}
            </div>

            <div className="public-mobile-ecosystem">
              <div className="public-mobile-ecosystem-title">
                ÉCOSYSTÈME
              </div>

              {ecosystemGroups.map(
                (group) => (
                  <section key={group.title}>
                    <h3>
                      {group.title}
                    </h3>

                    {group.items.map(
                      (item) => {
                        const Icon =
                          item.icon;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="public-mobile-ecosystem-link"
                          >
                            <Icon
                              size={17}
                              aria-hidden="true"
                            />

                            <span>
                              {item.label}
                            </span>
                          </Link>
                        );
                      },
                    )}
                  </section>
                ),
              )}
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>

      {!reduceMotion ? (
        <motion.div
          className="public-navbar-scanner"
          aria-hidden="true"
          animate={{
            x: ["-120%", "220%"],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            repeatDelay: 5,
            ease: "easeInOut",
          }}
        />
      ) : null}
    </motion.div>
  );
}
