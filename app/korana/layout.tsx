import type {
  ReactNode,
} from "react";

import {
  KoranaShell,
} from "@/modules/korana/components/KoranaShell";

import "./korana.css";


export default function KoranaLayout({
  children,
}: {
  children: ReactNode;
}) {

  return (
    <KoranaShell>
      {children}
    </KoranaShell>
  );
}