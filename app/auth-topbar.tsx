"use client";

import Link from "next/link";

interface AuthTopBarProps {
  isLightMode?: boolean;
}

export default function AuthTopBar({ isLightMode = false }: AuthTopBarProps) {
  // Simuler un état de connexion (à adapter avec ton système de session Supabase / Auth réel)
  const isLoggedIn = false; 

  if (isLoggedIn) {
    return (
      <Link
        href="/dashboard"
        className={`font-mono text-xs font-bold uppercase tracking-wider border px-3 py-1.5 transition-colors ${
          isLightMode
            ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
            : "border-red-900/50 bg-red-950/40 text-red-400 hover:bg-red-950/60 hover:text-red-300"
        }`}
      >
        Mon Espace
      </Link>
    );
  }

  return (
    <Link
      href="/auth"
      className={`font-mono text-xs font-bold uppercase tracking-wider border px-3 py-1.5 transition-colors ${
        isLightMode
          ? "border-red-600 bg-red-600 text-white hover:bg-red-500 hover:border-red-500"
          : "border-red-700 bg-red-700 text-white hover:bg-red-600 hover:border-red-600"
      }`}
    >
      Se connecter
    </Link>
  );
}