"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthTopBar from "./AuthTopBar";
import { Menu, X, Calendar, FolderOpen, Newspaper, MessageSquareText, ShoppingBag, SlidersHorizontal } from "lucide-react";

interface NavbarProps {
  isLightMode?: boolean;
  onToggleSearch?: () => void;
  showSearch?: boolean;
}

export default function Navbar({ isLightMode = false, onToggleSearch, showSearch }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [canDrag, setCanDrag] = useState(false);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const pathname = usePathname();
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  const navLinks = [
    { href: "/events", label: "Évènements", icon: Calendar },
    { href: "/annuaire", label: "Annuaires", icon: FolderOpen },
    { href: "/actualites", label: "Actualités", icon: Newspaper },
    { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  ];

  useEffect(() => {
    setIsMounted(true);
    setPosition({ x: window.innerWidth - 80, y: window.innerHeight - 100 });
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isMobileMenuOpen) return;
    isDragging.current = false;
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX, y: touch.clientY };
    initialPos.current = {...position };
    longPressTimer.current = setTimeout(() => { setCanDrag(true); }, 500);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStart.current.x;
    const deltaY = touch.clientY - dragStart.current.y;
    if (!canDrag && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    }
    if (canDrag) {
      isDragging.current = true;
      const newX = Math.max(10, Math.min(window.innerWidth - 66, initialPos.current.x + deltaX));
      const newY = Math.max(60, Math.min(window.innerHeight - 70, initialPos.current.y + deltaY));
      setPosition({ x: newX, y: newY });
    }
  };
  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (!isDragging.current) setIsMobileMenuOpen(!isMobileMenuOpen);
    setCanDrag(false); isDragging.current = false;
  };

  return (
    <header className={`relative w-full h-14 z-50 border-b backdrop-blur-xl ${isLightMode? "bg-slate-50/95 border-slate-200" : "bg-black/95 border-neutral-800"}`}>
      <div className="mx-auto flex h-14 max-w-[1680px] items-center justify-between px-4 lg:px-8 gap-4">

        <Link href="/" className="flex items-center gap-3 shrink-0">
          <img src="https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/logo" alt="logo_indesy_mialy" className="h-10 w-auto" />
          <div className="font-mono font-black text-sm tracking-[0.3em]"><span className="text-red-500">INDESY </span><span className="text-blue-500">MIALY</span></div>
        </Link>

        {/* MENU DESKTOP - TOUJOURS VISIBLE à partir de 768px */}
        <nav className="hidden md:flex items-center gap-x-5 text-xs font-mono font-bold uppercase tracking-widest">
          {navLinks.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`whitespace-nowrap transition-colors ${
                  active
                    ? "text-white border-b border-white pb-0.5 font-bold"
                    : "text-white-400 hover:text-amber-300"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5 shrink-0">
          {onToggleSearch && (
            <button onClick={onToggleSearch} className={`w-9 h-9 rounded-full grid place-items-center border ${showSearch? "bg-white text-black border-white" : "bg-neutral-900 border-neutral-800 text-white"}`}>
              <SlidersHorizontal size={14} />
            </button>
          )}

          {/* NOUVELLE ICÔNE DE MESSAGERIE UI LOOK MODERN CYBER */}
          <Link 
            href="/discussion" 
            className="relative flex items-center justify-center w-9 h-9 border border-neutral-800 bg-neutral-900/40 rounded-lg text-neutral-400 hover:text-white hover:border-red-500/50 hover:bg-neutral-900 transition-all duration-300 group"
            aria-label="Messages"
          >
            <span className="absolute inset-0 rounded-lg bg-red-500/0 group-hover:bg-red-500/5 blur-md transition-all duration-300" />
            <MessageSquareText 
              size={14} 
              className="relative z-10 transform group-hover:scale-105 group-hover:-translate-y-0.5 transition-all duration-300" 
            />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2 z-20">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="absolute bottom-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>

          <AuthTopBar isLightMode={isLightMode} />
        </div>
      </div>

      {/* BULLE MOBILE */}
      {isMounted && (
        <div className="md:hidden fixed z-[10000] flex flex-col items-center" style={{ left: `${position.x}px`, top: `${position.y}px` }}>
          <div className={`flex flex-col items-center gap-3 mb-4 absolute bottom-16 transition-all ${isMobileMenuOpen? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none translate-y-10"}`}>
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`relative w-11 h-11 rounded-full grid place-items-center border transition-all ${
                    active
                      ? "bg-white border-white text-black"
                      : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  <span className={`absolute right-full mr-3 px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border shadow-lg whitespace-nowrap transition-colors ${
                    active
                      ? "bg-white border-white text-black"
                      : "bg-neutral-950 border-neutral-800 text-neutral-200"
                  }`}>
                    {label}
                  </span>
                  <Icon size={18} />
                </Link>
              );
            })}
          </div>
          <button onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} className={`w-14 h-14 rounded-full grid place-items-center border-2 shadow-2xl ${isMobileMenuOpen? "bg-red-600 border-red-500 rotate-90" : "bg-black border-red-600"}`}>
            {isMobileMenuOpen? <X size={22}/> : <Menu size={22}/>}
          </button>
        </div>
      )}
    </header>
  );
}