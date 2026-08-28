import type { Metadata } from 'next';
import Script from 'next/script';
import { Geist,Geist_Mono } from 'next/font/google';
import './globals.css';
import { DisciplineFilterProvider } from '@/providers/search/discipline-filter-context';
import { RoleRequestProvider } from '@/providers/roles/RoleRequestContext';
import { AuthProvider } from '@/providers/auth';
import { ThemeProvider } from '@/components/ui';
import HeaderWrapper from '@/components/layout/HeaderWrapper';
import BackToTopButton from '@/components/common/BackToTopButton';
const geistSans=Geist({variable:'--font-geist-sans',subsets:['latin']});
const geistMono=Geist_Mono({variable:'--font-geist-mono',subsets:['latin']});
export const metadata:Metadata={title:'INDESY MIALY',description:'Plateforme officielle des arts martiaux et sports de combat à Madagascar.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang='fr' suppressHydrationWarning className={geistSans.variable+' '+geistMono.variable+' h-full antialiased'}><body className='min-h-full font-sans'><Script id='theme-init' src='/theme-init.js' strategy='beforeInteractive'/><ThemeProvider><DisciplineFilterProvider><RoleRequestProvider><AuthProvider><HeaderWrapper>{children}</HeaderWrapper><BackToTopButton/></AuthProvider></RoleRequestProvider></DisciplineFilterProvider></ThemeProvider></body></html>}
