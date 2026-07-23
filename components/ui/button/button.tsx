"use client";

import type { ButtonProps } from "./button.types";

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "btn",
        `btn-${variant}`,
        `btn-${size}`,
        loading ? "is-loading" : "",
        className,
      ].join(" ")}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {leftIcon}
      <span>{loading ? "Chargement..." : children}</span>
      {!loading && rightIcon}
    </button>
  );
}