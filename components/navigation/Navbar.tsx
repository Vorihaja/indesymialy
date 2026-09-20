"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { IconButton, ThemeToggle } from "@/components/ui";

import AuthTopBar from "./AuthTopBar";

const LOGO_URL =
  "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/logo";

const ECOSYSTEM_LINKS = [
  { id: "mialy", number: "01", label: "Mialy", descriptor: "Sport", href: "/" },
  { id: "korana", number: "02", label: "Korana", descriptor: "Social", href: "/korana" },
  { id: "erp", number: "03", label: "ERP", descriptor: "Gestion", href: "/account" },
  { id: "bazar", number: "04", label: "Bazar", descriptor: "Marketplace", href: "/marketplace" },
] as const;

type EcosystemId = (typeof ECOSYSTEM_LINKS)[number]["id"];

const NON_MIALY_PREFIXES = [
  "/korana",
  "/account",
  "/dashboard",
  "/admin",
  "/vh-teck",
  "/marketplace",
] as const;

type NavbarProps = {
  onToggleSearch?: () => void;
  showSearch?: boolean;
};

export default function Navbar({ onToggleSearch, showSearch = false }: NavbarProps) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const [mobileOpenPath, setMobileOpenPath] = useState<string | null>(null);
  const mobileOpen = mobileOpenPath === pathname;
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLElement>(null);

  const isExperienceActive = (id: EcosystemId, href: string) => {
    if (id === "mialy") {
      return !NON_MIALY_PREFIXES.some(
        (prefix) =>
          pathname === prefix || pathname.startsWith(`${prefix}/`),
      );
    }

    if (id === "erp") {
      return (
        pathname === "/account" ||
        pathname.startsWith("/account/") ||
        pathname === "/dashboard" ||
        pathname.startsWith("/dashboard/")
      );
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const closeMobileMenu = (restoreFocus = true) => {
    setMobileOpenPath(null);
    if (restoreFocus) requestAnimationFrame(() => mobileButtonRef.current?.focus());
  };


  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const available = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(scrollTop > 24);
      setScrollProgress(available > 0 ? Math.min(100, (scrollTop / available) * 100) : 0);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const menu = mobileMenuRef.current;
    const focusableSelector = "a[href],button:not([disabled]),[tabindex]:not([tabindex='-1'])";
    const focusFirst = window.requestAnimationFrame(() => {
      menu?.querySelector<HTMLElement>(focusableSelector)?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMobileMenu();
        return;
      }

      if (event.key !== "Tab" || !menu) return;
      const focusable = Array.from(menu.querySelectorAll<HTMLElement>(focusableSelector));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFirst);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  return (
    <motion.div
      className="public-navbar"
      data-scrolled={scrolled}
      initial={reducedMotion ? false : { opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.35 }}
    >
      <div className="public-navbar-progress" aria-hidden="true">
        <motion.div
          className="public-navbar-progress-fill"
          animate={{ width: `${scrollProgress}%` }}
          transition={{ duration: reducedMotion ? 0 : 0.12 }}
        />
      </div>

      <div className="public-navbar-inner">
        <Link href="/" className="public-brand" aria-label="Indesy Mialy — Accueil">
          <span className="public-brand-logo">
            <img src={LOGO_URL} alt="" aria-hidden="true" />
            <span className="public-brand-logo-glow" aria-hidden="true" />
          </span>
          <span className="public-brand-copy">
            <span className="public-brand-name">
              <span className="public-brand-indesy">INDESY</span>{" "}
              <strong>MIALY</strong>
            </span>
            <span className="public-brand-tagline">Sports de combat malagasy</span>
          </span>
        </Link>

        <nav
          className="public-nav-links public-nav-links--experiences"
          aria-label="Expériences de l’écosystème Indesy"
        >
          {ECOSYSTEM_LINKS.map(({ id, number, label, descriptor, href }) => {
            const selected = isExperienceActive(id, href);
            return (
              <Link
                key={id}
                href={href}
                className="public-nav-link public-experience-link"
                data-experience={id}
                aria-current={selected ? "page" : undefined}
              >
                {selected ? (
                  <motion.span
                    className="public-experience-active-surface"
                    layoutId="public-experience-active-desktop"
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                    aria-hidden="true"
                  />
                ) : null}
                <span className="public-experience-number">{number}</span>
                <span className="public-experience-copy">
                  <strong>{label}</strong>
                  <small>{descriptor}</small>
                </span>
                <span className="public-nav-link-line" aria-hidden="true" />
              </Link>
            );
          })}
        </nav>

        <div className="public-nav-actions">
          {onToggleSearch ? (
            <IconButton
              variant={showSearch ? "primary" : "ghost"}
              aria-label={showSearch ? "Fermer la recherche globale" : "Ouvrir la recherche globale"}
              aria-expanded={showSearch}
              onClick={onToggleSearch}
            >
              <Search size={17} aria-hidden="true" />
            </IconButton>
          ) : null}
          <ThemeToggle compact />
          <AuthTopBar />
          <button
            ref={mobileButtonRef}
            type="button"
            className="ds-button ds-ghost ds-icon-button public-mobile-button"
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
            aria-controls="public-mobile-menu"
            onClick={() =>
              mobileOpen
                ? closeMobileMenu(false)
                : setMobileOpenPath(pathname)
            }
          >
            {mobileOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.nav
            ref={mobileMenuRef}
            id="public-mobile-menu"
            className="public-mobile-menu"
            aria-label="Navigation mobile"
            initial={reducedMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.22 }}
          >
            <div className="public-mobile-menu-head">
              <div><span>INDESY</span><strong>ECOSYSTEME</strong></div>
              <button type="button" onClick={() => closeMobileMenu()} aria-label="Fermer la navigation">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="public-mobile-primary-links public-mobile-primary-links--experiences">
              {ECOSYSTEM_LINKS.map(({ id, number, label, descriptor, href }) => {
                const selected = isExperienceActive(id, href);
                return (
                  <Link
                    key={id}
                    href={href}
                    className="public-nav-link public-experience-link"
                    data-experience={id}
                    aria-current={selected ? "page" : undefined}
                  >
                    {selected ? (
                      <motion.span
                        className="public-experience-active-surface"
                        layoutId="public-experience-active-mobile"
                        aria-hidden="true"
                      />
                    ) : null}
                    <span className="public-experience-number">{number}</span>
                    <span className="public-experience-copy">
                      <strong>{label}</strong>
                      <small>{descriptor}</small>
                    </span>
                    <span className="public-nav-link-line" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
