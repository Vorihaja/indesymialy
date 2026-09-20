import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import "@/styles/indesy-system.css";
import './ui-r3c-density.css';
import './ui-r3d-home-cockpit.css';

import BackToTopButton from "@/components/common/BackToTopButton";
import HeaderWrapper from "@/components/layout/HeaderWrapper";
import { ThemeProvider } from "@/components/ui";
import { IndesyDialogProvider } from "@/components/ui/indesy-dialog";
import { OfficialFunctionProvider } from "@/modules/officials/function-context";
import { AuthProvider } from "@/providers/auth";
import { RoleRequestProvider } from "@/providers/roles/RoleRequestContext";
import { DisciplineFilterProvider } from "@/providers/search/discipline-filter-context";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "INDESY MIALY",
  description: "Plateforme officielle des arts martiaux et sports de combat à Madagascar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <Script id="theme-init" src="/theme-init.js" strategy="beforeInteractive" />
        <ThemeProvider>
          <IndesyDialogProvider>
            <DisciplineFilterProvider>
              <RoleRequestProvider>
                <AuthProvider>
                  <OfficialFunctionProvider>
                    <HeaderWrapper>{children}</HeaderWrapper>
                    <BackToTopButton />
                  </OfficialFunctionProvider>
                </AuthProvider>
              </RoleRequestProvider>
            </DisciplineFilterProvider>
          </IndesyDialogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
