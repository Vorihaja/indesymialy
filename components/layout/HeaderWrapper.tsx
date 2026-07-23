"use client"
import { useState, useRef, useEffect } from "react"
import type { CSSProperties } from "react"
import BreakingNews from "../home/breaking-news"
import Navbar from "../navigation/Navbar"
import GlobalSearchBar from "../navigation/GlobalSearchBar"

export default function HeaderWrapper({ children }: { children: React.ReactNode }) {
  const [showSearch, setShowSearch] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const [headerHeight, setHeaderHeight] = useState(84)

  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    // Mesure initiale
    setHeaderHeight(el.offsetHeight)
    // Observe chaque changement de taille (chips, search bar, etc.)
    const observer = new ResizeObserver(() => {
      setHeaderHeight(el.offsetHeight)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* HEADER FIXED - 2 étages */}
      <div ref={headerRef} className="fixed top-0 inset-x-0 z-[100] flex flex-col bg-black border-b border-neutral-900">
        {/* Étage 1 : FLASH */}
        <div className="w-full min-h-[28px] bg-black">
          <BreakingNews />
        </div>
        {/* Étage 2 : NAVBAR */}
        <Navbar
          isLightMode={false}
          onToggleSearch={() => setShowSearch(v => !v)}
          showSearch={showSearch}
        />
        {/* Étage 3 : SEARCH si ouvert */}
        {showSearch && (
          <div className="w-full border-t border-neutral-900 bg-black">
            <GlobalSearchBar />
          </div>
        )}
      </div>

      {/* CONTENU - padding dynamique = hauteur réelle du header */}
      <div style={{ paddingTop: headerHeight, "--platform-header-height": `${headerHeight}px` } as CSSProperties} className="min-h-screen w-full bg-black">
        {children}
      </div>
    </>
  )
}
