import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import BreakingNews from "./breaking-news";
import GlobalSearchBar from "./components/GlobalSearchBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "INDESY MIALY | Combat Sports Platform",
  description: "Plateforme officielle des arts martiaux et sports de combat à Madagascar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full font-sans bg-black text-neutral-200">
        
        {/* 1. La Top Bar principale figée tout en haut (h-14 = 56px) */}
        <Navbar isLightMode={false} />

        {/* 2. La barre de Breaking News figée PILE en dessous (top-14 = 56px, h-7 = 28px) */}
        <div className="fixed top-14 inset-x-0 h-7 z-50 bg-black">
          <BreakingNews />
        </div>

        {/* 3. La barre de recherche globale fixée sous le Breaking News (top-21 ou top-[84px], h-7 = 28px) */}
        <GlobalSearchBar />

        {/* 4. Le contenu décalé de 112px (56px Navbar + 28px News + 28px SearchBar) */}
        <div className="pt-[112px] min-h-screen w-full">
          {children}
        </div>
        
      </body>
    </html>
  );
}