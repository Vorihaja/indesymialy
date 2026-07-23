import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DisciplineFilterProvider } from "../providers/search/discipline-filter-context";
import { RoleRequestProvider } from "../providers/roles/RoleRequestContext";
import HeaderWrapper from "../components/layout/HeaderWrapper";
import BackToTopButton from "../components/common/BackToTopButton";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "INDESY MIALY",
  description: "Plateforme officielle des arts martiaux et sports de combat à Madagascar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full font-sans bg-black text-neutral-200">
        <DisciplineFilterProvider>
          <RoleRequestProvider>
            <HeaderWrapper>{children}</HeaderWrapper>
            <BackToTopButton />
          </RoleRequestProvider>
        </DisciplineFilterProvider>
      </body>
    </html>
  );
}