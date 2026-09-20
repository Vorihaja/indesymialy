import type { ReactNode } from "react";

type IndesyStatusTone = "active" | "warning" | "danger" | "neutral";

type IndesyStatusBadgeProps = {
  tone?: IndesyStatusTone;
  children: ReactNode;
  className?: string;
};

export function IndesyStatusBadge({
  tone = "neutral",
  children,
  className = "",
}: IndesyStatusBadgeProps) {
  return (
    <span className={`im-status im-status--${tone} ${className}`.trim()}>
      {children}
    </span>
  );
}