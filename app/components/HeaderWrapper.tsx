"use client"
import { useState } from "react"
import BreakingNews from "../breaking-news"
import Navbar from "./Navbar"
import GlobalSearchBar from "./GlobalSearchBar"

export default function HeaderWrapper({ children }: { children: React.ReactNode }) {
  const [showSearch, setShowSearch] = useState(false)

  return (
    <>
      {/* HEADER FIXED - 2 étages */}
      <div className="fixed top-0 inset-x-0 z-[100] flex flex-col bg-black border-b border-neutral-900">
        {/* Étage 1 : FLASH */}
        <div className="w-full min-h-[28px] bg-black">
          <BreakingNews />
        </div>
        {/* Étage 2 : NAVBAR */}
        <Navbar
          isLightMode={false}
          onToggleSearch={() => setShowSearch(v =>!v)}
          showSearch={showSearch}
        />
        {/* Étage 3 : SEARCH si ouvert */}
        {showSearch && (
          <div className="w-full border-t border-neutral-900 bg-black">
            <GlobalSearchBar />
          </div>
        )}
      </div>

      {/* CONTENU - padding = hauteur du header fixed */}
      <div className={`${showSearch? "pt-[124px]" : "pt-[84px]"} min-h-screen w-full bg-black`}>
        {children}
      </div>
    </>
  )
}