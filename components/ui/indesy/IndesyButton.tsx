import type { ButtonHTMLAttributes, ReactNode } from "react";

type IndesyButtonTone = "primary" | "secondary" | "ghost";
type IndesyButtonScale = "sm" | "md" | "lg";

export interface IndesyButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: IndesyButtonTone;
  scale?: IndesyButtonScale;
  icon?: ReactNode;
}

export function IndesyButton({
  tone = "primary",
  scale = "md",
  icon,
  className = "",
  children,
  type = "button",
  ...props
}: IndesyButtonProps) {
  return (
    <button
      type={type}
      className={`im-button im-button--${tone} im-button--${scale} ${className}`.trim()}
      {...props}
    >
      {children}
      {icon}
    </button>
  );
}