"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import GlobalSearchBar from "@/components/navigation/GlobalSearchBar";
import Navbar from "@/components/navigation/Navbar";

import PublicFooter from "./PublicFooter";

const ISOLATED_ROUTE_PREFIXES = [
  "/auth",
  "/admin",
  "/vh-teck",
  "/korana",
  "/account",
  "/onboarding",
  "/role-requests",
  "/messages",
  "/notifications",
] as const;

function isRouteWithin(
  pathname: string,
  prefix: string,
) {
  return (
    pathname === prefix ||
    pathname.startsWith(`${prefix}/`)
  );
}

export default function HeaderWrapper({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const usesWorkspaceViewport =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/");

  const isolated = ISOLATED_ROUTE_PREFIXES.some(
    (prefix) =>
      isRouteWithin(pathname, prefix),
  );

  const [
    searchOpenPath,
    setSearchOpenPath,
  ] = useState<string | null>(null);

  const showSearch =
    searchOpenPath === pathname;

  const [
    headerHeight,
    setHeaderHeight,
  ] = useState(84);

  const headerRef =
    useRef<HTMLElement>(null);

  useEffect(() => {
    if (isolated) {
      return;
    }

    const closeSearch = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        setSearchOpenPath(null);
      }
    };

    document.addEventListener(
      "keydown",
      closeSearch,
    );

    return () =>
      document.removeEventListener(
        "keydown",
        closeSearch,
      );
  }, [isolated]);

  useEffect(() => {
    if (
      isolated ||
      !headerRef.current
    ) {
      return;
    }

    const header =
      headerRef.current;

    const measure = () => {
      if (header.offsetHeight > 0) {
        setHeaderHeight(
          header.offsetHeight,
        );
      }
    };

    const observer =
      new ResizeObserver(measure);

    measure();
    observer.observe(header);

    return () =>
      observer.disconnect();
  }, [
    isolated,
    showSearch,
  ]);

  if (isolated) {
    return <>{children}</>;
  }

  const contentStyle = (
    usesWorkspaceViewport
      ? {
          "--platform-header-height":
            `${headerHeight}px`,
        }
      : {
          paddingTop: headerHeight,
          "--platform-header-height":
            `${headerHeight}px`,
        }
  ) as CSSProperties & { "--platform-header-height": string };

  return (
    <>
      <a
        className="public-skip-link"
        href="#main-content"
      >
        Aller au contenu principal
      </a>

      <header
        ref={headerRef}
        className="public-header"
        data-erp={
          usesWorkspaceViewport
            ? "true"
            : undefined
        }
      >
        <Navbar
          showSearch={
            usesWorkspaceViewport ||
            isHome
              ? false
              : showSearch
          }
          onToggleSearch={
            usesWorkspaceViewport ||
            isHome
              ? undefined
              : () =>
                  setSearchOpenPath(
                    (current) =>
                      current === pathname
                        ? null
                        : pathname,
                  )
          }
        />

        {!usesWorkspaceViewport &&
        !isHome &&
        showSearch ? (
          <div className="public-search-row">
            <GlobalSearchBar />
          </div>
        ) : null}
      </header>

      <div
        id="main-content"
        className={
          usesWorkspaceViewport
            ? "public-content public-content--erp"
            : "public-content"
        }
        style={contentStyle}
        tabIndex={-1}
      >
        {children}
      </div>

      {usesWorkspaceViewport
        ? null
        : <PublicFooter />}
    </>
  );
}