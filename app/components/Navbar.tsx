"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import AuthTopBar from "../auth-topbar";
import TopbarNotifications from "../topbar-notifications";
import { Menu, X, Calendar, FolderOpen, Newspaper, MessageSquare, ShoppingBag, SlidersHorizontal } from "lucide-react";

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
      <div className="mx-auto flex h-14 max-w- items-center justify-between px-4 lg:px-8 gap-4">

        <Link href="/" className="flex items-center gap-3 shrink-0">
          <img src="https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/Logo.png" alt="Logo" className="h-10 w-auto" />
          <div className="font-mono font-black text-sm tracking-[0.22em]"><span className="text-red-500">INDESY </span><span className="text-blue-500">MIALY</span></div>
        </Link>

        {/* MENU DESKTOP - TOUJOURS VISIBLE à partir de 768px */}
        <nav className="hidden md:flex items-center gap-x-5 text- font-mono font-bold uppercase tracking-widest">
          <Link href="/events" className="hover:text-amber-300 whitespace-nowrap">Évènements</Link>
          <Link href="/annuaire" className="text-white border-b border-white pb-0.5 whitespace-nowrap">Annuaires</Link>
          <Link href="/actualites" className="hover:text-amber-300 whitespace-nowrap">Actualités</Link>
          <Link href="/discussions" className="hover:text-amber-300 whitespace-nowrap">Discussion</Link>
          <Link href="/marketplace" className="hover:text-amber-300 whitespace-nowrap">Marketplace</Link>
        </nav>

        <div className="flex items-center gap-2.5 shrink-0">
          {onToggleSearch && (
            <button onClick={onToggleSearch} className={`w-9 h-9 rounded-full grid place-items-center border ${showSearch? "bg-white text-black border-white" : "bg-neutral-900 border-neutral-800 text-white"}`}>
              <SlidersHorizontal size={14} />
            </button>
          )}
          <TopbarNotifications />
          <AuthTopBar isLightMode={isLightMode} />
        </div>
      </div>

      {/* BULLE MOBILE */}
      {isMounted && (
        <div className="md:hidden fixed z-[10000] flex flex-col items-center" style={{ left: `${position.x}px`, top: `${position.y}px` }}>
          <div className={`flex flex-col items-center gap-3 mb-4 absolute bottom-16 transition-all ${isMobileMenuOpen? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none translate-y-10"}`}>
            <Link href="/annuaire" onClick={()=>setIsMobileMenuOpen(false)} className="flex items-center gap-2"><span className="px-2 py-1 text- font-mono font-bold uppercase bg-white text-black rounded">Annuaires</span><div className="w-11 h-11 rounded-full bg-white text-black grid place-items-center"><FolderOpen size={18}/></div></Link>
            <Link href="/events" onClick={()=>setIsMobileMenuOpen(false)} className="w-11 h-11 rounded-full bg-neutral-900 border border-neutral-800 grid place-items-center"><Calendar size={18}/></Link>
            <Link href="/actualites" onClick={()=>setIsMobileMenuOpen(false)} className="w-11 h-11 rounded-full bg-neutral-900 border border-neutral-800 grid place-items-center"><Newspaper size={18}/></Link>
            <Link href="/discussions" onClick={()=>setIsMobileMenuOpen(false)} className="w-11 h-11 rounded-full bg-neutral-900 border border-neutral-800 grid place-items-center"><MessageSquare size={18}/></Link>
            <Link href="/marketplace" onClick={()=>setIsMobileMenuOpen(false)} className="w-11 h-11 rounded-full bg-neutral-900 border border-neutral-800 grid place-items-center"><ShoppingBag size={18}/></Link>
          </div>
          <button onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} className={`w-14 h-14 rounded-full grid place-items-center border-2 shadow-2xl ${isMobileMenuOpen? "bg-red-600 border-red-500 rotate-90" : "bg-black border-red-600"}`}>
            {isMobileMenuOpen? <X size={22}/> : <Menu size={22}/>}
          </button>
        </div>
      )}
    </header>
  );
}