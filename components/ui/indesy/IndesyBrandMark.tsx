import type { CSSProperties } from "react";

type IndesyBrandMarkProps = {
  size?: number;
  className?: string;
  label?: string;
};

export function IndesyBrandMark({
  size = 30,
  className = "",
  label,
}: IndesyBrandMarkProps) {
  const style = {
    "--im-mark-size": `${size}px`,
  } as CSSProperties;

  return (
    <span
      className={`im-brand-mark ${className}`.trim()}
      style={style}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <span className="im-brand-mark__energy im-brand-mark__energy--red" />
      <span className="im-brand-mark__energy im-brand-mark__energy--blue" />
    </span>
  );
}