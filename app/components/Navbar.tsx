"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import AuthTopBar from "../auth-topbar";
import TopbarNotifications from "../topbar-notifications";
import { ChevronDown, Menu, X, Calendar, FolderOpen, Newspaper, MessageSquare, ShoppingBag } from "lucide-react";

interface NavbarProps {
  isLightMode?: boolean;
}

export default function Navbar({ isLightMode = false }: NavbarProps) {
  const [showannuairesDropdown, setShowannuairesDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMobileAnnuaires, setShowMobileAnnuaires] = useState(false);

  // --- POSITIONS INITIALES EN HAUT/GAUCHE POUR TOUT L'ÉCRAN ---
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [canDrag, setCanDrag] = useState(false);
  
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const annuairesOptions = [
    { label: "Combattants", href: "/annuaire/combattants" },
    { label: "Organisateurs", href: "/annuaire/organisateurs" },
    { label: "Coachs", href: "/annuaire/coachs" },
    { label: "Clubs", href: "/annuaire/clubs" },
    { label: "Arbitres", href: "/annuaire/arbitres" },
    { label: "Federation", href: "/annuaire/federation" },
    { label: "Fan", href: "/annuaire/fan" },
    { label: "Sponsor", href: "/annuaire/sponsor" },
    { label: "Vendeur", href: "/annuaire/vendeur" },
  ];

  // Placer la bulle en bas à droite par défaut au montage initial
  useEffect(() => {
    setPosition({
      x: window.innerWidth - 80,
      y: window.innerHeight - 100,
    });
  }, []);

  // --- LOGIQUE TACTILE ABSOLUE ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isMobileMenuOpen) return;

    isDragging.current = false;
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX, y: touch.clientY };
    initialPos.current = { ...position };

    longPressTimer.current = setTimeout(() => {
      setCanDrag(true);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isMobileMenuOpen) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStart.current.x;
    const deltaY = touch.clientY - dragStart.current.y;

    if (!canDrag && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    }

    if (canDrag) {
      // Bloquer le scroll natif de l'écran pendant le drag
      if (e.cancelable) e.preventDefault();
      
      isDragging.current = true;

      // Contraintes pour éviter que la bulle sorte de la surface de l'écran
      const newX = Math.max(10, Math.min(window.innerWidth - 66, initialPos.current.x + deltaX));
      const newY = Math.max(60, Math.min(window.innerHeight - 70, initialPos.current.y + deltaY));

      setPosition({ x: newX, y: newY });
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);

    if (!isDragging.current) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
      if (isMobileMenuOpen) setShowMobileAnnuaires(false);
    }

    setCanDrag(false);
    isDragging.current = false;
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setShowannuairesDropdown(false);
    }
  };

  return (
    <header 
      className={`fixed inset-x-0 top-0 z-[999] border-b backdrop-blur-xl shadow-sm transition-colors duration-300 ${
        isLightMode 
          ? "bg-slate-50/95 border-slate-200" 
          : "bg-black/95 border-neutral-800"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-[1680px] items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        
        {/* Zone Logo + Titre */}
        <Link href="/" className="flex items-center gap-3 group cursor-pointer shrink-0">
          <img 
            src="https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/Logo.png" 
            alt="Indesy Mialy Logo" 
            className="h-10 w-auto object-contain shrink-0" 
          />
          <div className="min-w-0 font-mono text-sm sm:text-base font-black uppercase tracking-[0.22em] select-none">
            <span className={isLightMode ? "text-red-600 group-hover:text-red-500" : "text-red-500 group-hover:text-red-400"}>
              INDESY{" "}
            </span>
            <span className={isLightMode ? "text-blue-600 group-hover:text-blue-500" : "text-blue-500 group-hover:text-blue-400"}>
              MIALY
            </span>
          </div>
        </Link>

        {/* Navigation Bureau */}
        <nav className="hidden items-center justify-center gap-x-6 gap-y-1 text-xs font-mono uppercase tracking-wider min-[900px]:flex text-[hsl(var(--text-muted))] mx-auto flex-1 max-w-max">
          <Link href="/events" className={`transition-colors whitespace-nowrap font-bold ${isLightMode ? "hover:text-blue-600" : "hover:text-amber-300"}`}>
            Évènements
          </Link>

          <div className="relative outline-none" onBlur={handleBlur}>
            <button 
              onClick={() => setShowannuairesDropdown(!showannuairesDropdown)}
              className={`flex items-center gap-1 transition-colors whitespace-nowrap font-bold uppercase focus:outline-none ${
                showannuairesDropdown || isLightMode ? "text-[hsl(var(--text-main))] hover:text-blue-600" : "hover:text-amber-300"
              }`}
            >
              annuaires
              <ChevronDown size={14} className={`transition-transform duration-200 ${showannuairesDropdown ? "rotate-180" : ""}`} />
            </button>

            {showannuairesDropdown && (
              <div className={`absolute left-0 mt-2 w-48 border shadow-xl z-[1000] rounded-none flex flex-col py-1 transition-all ${isLightMode ? "bg-slate-50 border-slate-200 text-slate-700" : "bg-neutral-950 border-neutral-900 text-neutral-300"}`}>
                {annuairesOptions.map((annuaires) => (
                  <Link
                    key={annuaires.label}
                    href={annuaires.href}
                    onClick={() => setShowannuairesDropdown(false)}
                    className={`px-4 py-2.5 text-left text-[11px] font-bold tracking-wider uppercase transition-colors ${isLightMode ? "hover:bg-slate-200 hover:text-blue-600" : "hover:bg-neutral-900 hover:text-amber-400"}`}
                  >
                    {annuaires.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/actualites" className={`transition-colors whitespace-nowrap font-bold ${isLightMode ? "hover:text-blue-600" : "hover:text-amber-300"}`}>
            Actualités
          </Link>
          <Link href="/discussions" className={`transition-colors whitespace-nowrap font-bold ${isLightMode ? "hover:text-blue-600" : "hover:text-amber-300"}`}>
            Discussion
          </Link>
          <Link href="/marketplace" className={`transition-colors whitespace-nowrap font-bold ${isLightMode ? "hover:text-blue-600" : "hover:text-amber-300"}`}>
            Marketplace
          </Link>
        </nav>

        {/* Zone Droite */}
        <div className="flex items-center gap-4 shrink-0">
          <TopbarNotifications />
          <AuthTopBar isLightMode={isLightMode} />
        </div>
      </div>

      {/* --- DUPLICATE MOBILE SYSTEM AVEC DÉPLACEMENT ABSOLU --- */}
      <div 
        className="min-[900px]:hidden fixed z-[10000] flex flex-col items-center touch-none"
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      >
        
        {/* Les sous-boutons (se déploient au-dessus de la bulle) */}
        <div className={`flex flex-col items-center gap-3 mb-4 absolute bottom-16 transition-all duration-300 origin-bottom ${
          isMobileMenuOpen ? "scale-100 opacity-100 pointer-events-auto" : "scale-75 opacity-0 pointer-events-none translate-y-10"
        }`}>
          
          {/* Marketplace */}
          <div className="flex items-center gap-2 group">
            <span className={`px-2 py-1 text-[10px] font-mono font-bold uppercase rounded shadow-md whitespace-nowrap ${isLightMode ? "bg-slate-100 text-slate-800" : "bg-neutral-900 text-neutral-200"}`}>Marketplace</span>
            <Link href="/marketplace" onClick={() => setIsMobileMenuOpen(false)} className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg ${isLightMode ? "bg-white border border-slate-200 text-slate-700" : "bg-neutral-900 border border-neutral-800 text-neutral-300"}`}>
              <ShoppingBag size={18} />
            </Link>
          </div>

          {/* Discussion */}
          <div className="flex items-center gap-2 group">
            <span className={`px-2 py-1 text-[10px] font-mono font-bold uppercase rounded shadow-md whitespace-nowrap ${isLightMode ? "bg-slate-100 text-slate-800" : "bg-neutral-900 text-neutral-200"}`}>Discussion</span>
            <Link href="/discussions" onClick={() => setIsMobileMenuOpen(false)} className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg ${isLightMode ? "bg-white border border-slate-200 text-slate-700" : "bg-neutral-900 border border-neutral-800 text-neutral-300"}`}>
              <MessageSquare size={18} />
            </Link>
          </div>

          {/* Actualités */}
          <div className="flex items-center gap-2 group">
            <span className={`px-2 py-1 text-[10px] font-mono font-bold uppercase rounded shadow-md whitespace-nowrap ${isLightMode ? "bg-slate-100 text-slate-800" : "bg-neutral-900 text-neutral-200"}`}>Actualités</span>
            <Link href="/actualites" onClick={() => setIsMobileMenuOpen(false)} className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg ${isLightMode ? "bg-white border border-slate-200 text-slate-700" : "bg-neutral-900 border border-neutral-800 text-neutral-300"}`}>
              <Newspaper size={18} />
            </Link>
          </div>

          {/* Section Annuaires complexes */}
          <div className="flex flex-col items-center relative">
            {showMobileAnnuaires && (
              <div className={`absolute bottom-14 right-0 mb-2 p-2 w-44 shadow-2xl border max-h-60 overflow-y-auto font-mono text-[10px] uppercase font-bold flex flex-col gap-1 ${isLightMode ? "bg-white border-slate-200 text-slate-700" : "bg-neutral-950 border-neutral-900 text-neutral-300"}`}>
                {annuairesOptions.map((opt) => (
                  <Link key={opt.label} href={opt.href} onClick={() => { setIsMobileMenuOpen(false); setShowMobileAnnuaires(false); }} className={`p-2 transition-colors ${isLightMode ? "hover:bg-slate-100 text-slate-800" : "hover:bg-neutral-900 text-neutral-200"}`}>
                    {opt.label}
                  </Link>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 group">
              <span className={`px-2 py-1 text-[10px] font-mono font-bold uppercase rounded shadow-md whitespace-nowrap ${isLightMode ? "bg-slate-100 text-slate-800" : "bg-neutral-900 text-neutral-200"}`}>Annuaires</span>
              <button onClick={() => setShowMobileAnnuaires(!showMobileAnnuaires)} className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg ${showMobileAnnuaires ? "bg-red-500 text-white" : isLightMode ? "bg-white border border-slate-200 text-slate-700" : "bg-neutral-900 border border-neutral-800 text-neutral-300"}`}>
                <FolderOpen size={18} />
              </button>
            </div>
          </div>

          {/* Évènements */}
          <div className="flex items-center gap-2 group">
            <span className={`px-2 py-1 text-[10px] font-mono font-bold uppercase rounded shadow-md whitespace-nowrap ${isLightMode ? "bg-slate-100 text-slate-800" : "bg-neutral-900 text-neutral-200"}`}>Évènements</span>
            <Link href="/events" onClick={() => setIsMobileMenuOpen(false)} className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg ${isLightMode ? "bg-white border border-slate-200 text-slate-700" : "bg-neutral-900 border border-neutral-800 text-neutral-300"}`}>
              <Calendar size={18} />
            </Link>
          </div>

        </div>

        {/* Le Bouton Principal Glissable */}
        <button
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-75 select-none overflow-hidden border-2 relative ${
            canDrag ? "scale-110 border-amber-400 opacity-90" : ""
          } ${
            isMobileMenuOpen 
              ? "bg-red-600 border-red-500 text-white rotate-90" 
              : isLightMode 
                ? "bg-slate-50 border-blue-600 text-slate-800" 
                : "bg-neutral-950 border-red-600 text-neutral-200"
          }`}
        >
          {isMobileMenuOpen ? (
            <X size={24} />
          ) : (
            <div className="w-full h-full flex items-center justify-center relative p-2 pointer-events-none">
              <img 
                src="https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/Logo.png" 
                alt="Menu" 
                className="w-full h-full object-contain opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <Menu size={16} className={isLightMode ? "text-blue-600" : "text-white"} />
              </div>
            </div>
          )}
        </button>

      </div>
    </header>
  );
}