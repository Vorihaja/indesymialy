import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DisciplineFilterDropdown from "./discipline-filter-dropdown";
import { DisciplineFilterProvider } from "./discipline-filter-context";
import AuthTopBar from "./auth-topbar";
import TopbarNotifications from "./topbar-notifications";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Indesy Mialy",
  description: "Plateforme officielle des compétitions de combat à Madagascar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-950 text-slate-100">
        <DisciplineFilterProvider>
          <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-sm">
            <div className="mx-auto flex h-[86px] max-w-[1680px] items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-lg font-black text-slate-950 shadow-md shadow-amber-500/20">
                  IM
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-black uppercase tracking-[0.28em] text-amber-300 sm:text-xl lg:text-2xl">INDESY MIALY</p>
                  <DisciplineFilterDropdown />
                </div>
              </div>

              <nav className="hidden items-center gap-5 text-sm text-slate-200 xl:flex">
                {[
                  { label: 'Accueil', href: '/' },
                  { label: 'Évènements', href: '/dashboard/organisateur' },
                  { label: 'Combattants', href: '/combattants' },
                  { label: 'Organisateurs', href: '/dashboard/organisateur' },
                  { label: 'Marketplace', href: '/marketplace' },
                ].map((item) => (
                  <Link key={item.label} href={item.href} className="transition hover:text-amber-300">
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="flex flex-1 items-center justify-end gap-4 sm:justify-between sm:gap-3 xl:justify-end">
                <div className="hidden sm:flex max-w-[220px] items-center rounded-full bg-slate-900/80 px-3 py-2 text-sm text-slate-300 focus-within:ring-2 focus-within:ring-amber-400/30">
                  <span className="mr-2 text-slate-500">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="7" />
                      <line x1="16.65" y1="16.65" x2="21" y2="21" />
                    </svg>
                  </span>
                  <input
                    type="search"
                    placeholder="Rechercher..."
                    className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                  />
                </div>
                <TopbarNotifications />
                <AuthTopBar />
              </div>
            </div>
          </header>

          <div className="pt-[86px]">{children}</div>
        </DisciplineFilterProvider>
      </body>
    </html>
  );
}
