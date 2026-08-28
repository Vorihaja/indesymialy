"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import {
  usePathname,
} from "next/navigation";

import BreakingNews from "../home/breaking-news";
import Navbar from "../navigation/Navbar";
import GlobalSearchBar from "../navigation/GlobalSearchBar";
import PublicFooter from "./PublicFooter";


export default function HeaderWrapper({
  children,
}: {
  children: ReactNode;
}) {

  const pathname =
    usePathname();

  const isHome =
    pathname === "/";


  // =========================================================
  // ROUTE GROUPS
  // =========================================================

  const isAuth =
    pathname === "/auth" ||
    pathname.startsWith("/auth/");


  const isSuperAdminControlCenter =
    pathname === "/vh-teck" ||
    pathname.startsWith("/vh-teck/");


  const isKorana =
    pathname === "/korana" ||
    pathname.startsWith("/korana/");


  const isErp =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/");


  const isAdmin =
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  // =========================================================
  // ACCOUNT WORKSPACE
  //
  // Le compte personnel suit le même contrat spatial que
  // les ERP : viewport restant, shell interne et scrolls
  // indépendants.
  // =========================================================

  const isAccountWorkspace =
    pathname === "/account" ||
    pathname.startsWith("/account/");


  const usesWorkspaceViewport =
    isErp ||
    isAccountWorkspace;


  // =========================================================
  // FULLY ISOLATED APPLICATION SHELLS
  //
  // These surfaces provide their own complete navigation.
  // =========================================================

  const isFullyIsolated =
    isAuth ||
    isSuperAdminControlCenter ||
    isKorana ||
    isAdmin;


  // =========================================================
  // PUBLIC / ERP HEADER STATE
  //
  // ERP normal contract:
  //
  // Breaking News = 28 px
  // Navbar        = 56 px
  // Total         = 84 px
  //
  // ResizeObserver remains the source of truth so Search can
  // increase this value automatically when opened.
  // =========================================================

  const [
    showSearch,
    setShowSearch,
  ] =
    useState(false);


  const [
    headerHeight,
    setHeaderHeight,
  ] =
    useState(84);


  const headerRef =
    useRef<HTMLElement>(
      null,
    );


  // =========================================================
  // CLOSE SEARCH WITH ESCAPE
  // =========================================================

  useEffect(() => {

    if (
      isFullyIsolated
    ) {

      return;
    }


    const close = (
      event: KeyboardEvent,
    ) => {

      if (
        event.key === "Escape"
      ) {

        setShowSearch(
          false,
        );
      }
    };


    document.addEventListener(
      "keydown",
      close,
    );


    return () => {

      document.removeEventListener(
        "keydown",
        close,
      );
    };

  }, [
    isFullyIsolated,
  ]);


  // =========================================================
  // MEASURE REAL HEADER HEIGHT
  // =========================================================

  useEffect(() => {

    if (
      isFullyIsolated
    ) {

      return;
    }


    const element =
      headerRef.current;


    if (!element) {

      return;
    }


    const measure =
      () => {

        const nextHeight =
          element.offsetHeight;


        if (
          nextHeight > 0
        ) {

          setHeaderHeight(
            nextHeight,
          );
        }
      };


    measure();


    const observer =
      new ResizeObserver(
        measure,
      );


    observer.observe(
      element,
    );


    return () => {

      observer.disconnect();
    };

  }, [
    isFullyIsolated,
    isErp,
    showSearch,
  ]);


  // =========================================================
  // FULLY ISOLATED SHELLS
  //
  // /auth
  // /admin
  // /korana
  // /vh-teck
  // =========================================================

  if (
    isFullyIsolated
  ) {

    return (
      <>
        {children}
      </>
    );
  }


  // =========================================================
  // ERP
  //
  // IMPORTANT CONTRACT:
  //
  // 1. ERP keeps Breaking News.
  // 2. ERP keeps global Navbar / AuthTopBar.
  // 3. Header receives data-erp="true".
  // 4. Container receives public-content--erp.
  // 5. NO paddingTop here.
  //
  // erp-shell.css positions public-content--erp below the
  // measured --platform-header-height.
  //
  // erp-shell-root then fills exactly this available viewport.
  // =========================================================

  if (usesWorkspaceViewport) {

    return (
      <>
        <header
          ref={
            headerRef
          }
          className="public-header"
        data-erp={usesWorkspaceViewport ? "true" : undefined}
        >

          <div className="min-h-[28px]">
            <BreakingNews />
          </div>


          <Navbar
            onToggleSearch={() =>
              setShowSearch(
                (value) =>
                  !value,
              )
            }
            showSearch={
              showSearch
            }
          />


          {showSearch ? (

            <div className="public-search-row">
              <GlobalSearchBar />
            </div>

          ) : null}

        </header>


        <div
          className="public-content public-content--erp"
          style={
            {
              "--platform-header-height":
                `${headerHeight}px`,
            } as CSSProperties
          }
        >
          {children}
        </div>
      </>
    );
  }


  // =========================================================
  // PUBLIC INDESY MIALY
  // =========================================================

  return (
    <>
      <header
        ref={
          headerRef
        }
        className="public-header"
      >

        <div className="min-h-[28px]">
          <BreakingNews />
        </div>


        <Navbar
          onToggleSearch={() =>
            setShowSearch(
              (value) =>
                !value,
            )
          }
          showSearch={
            showSearch
          }
        />


        {showSearch ? (

          <div className="public-search-row">
            <GlobalSearchBar />
          </div>

        ) : null}

      </header>


      <div
        className="public-content"
        style={
          {
            paddingTop:
              headerHeight,

            "--platform-header-height":
              `${headerHeight}px`,
          } as CSSProperties
        }
      >
        {children}
      </div>


      {isHome ? <PublicFooter /> : null}
    </>
  );
}