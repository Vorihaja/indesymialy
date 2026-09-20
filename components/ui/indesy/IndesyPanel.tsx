import type { ReactNode } from "react";

type IndesyPanelProps = {
  title?: string;
  kicker?: string;
  action?: ReactNode;
  children: ReactNode;
  accent?: boolean;
  className?: string;
};

export function IndesyPanel({
  title,
  kicker,
  action,
  children,
  accent = false,
  className = "",
}: IndesyPanelProps) {
  const hasHeader = Boolean(title || kicker || action);

  return (
    <section
      className={`im-panel ${accent ? "im-panel--accent" : ""} ${className}`.trim()}
    >
      {hasHeader ? (
        <header className="im-panel__header">
          <div className="im-panel__header-copy">
            {kicker ? <p className="im-panel__kicker">{kicker}</p> : null}
            {title ? <h2 className="im-panel__title">{title}</h2> : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className="im-panel__body">{children}</div>
    </section>
  );
}