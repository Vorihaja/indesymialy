import ErpAuthGuard from"@/components/auth/ErpAuthGuard";export default function Layout({children}:{children:React.ReactNode}){return <ErpAuthGuard>{children}</ErpAuthGuard>;}
