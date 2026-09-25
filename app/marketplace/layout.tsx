import { MarketplaceShell } from "@/modules/marketplace/components/MarketplaceShell";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MarketplaceShell>
      {children}
    </MarketplaceShell>
  );
}