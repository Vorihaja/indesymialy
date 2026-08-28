import type {
  HTMLAttributes,
  ReactNode,
} from "react";

const cx = (
  ...values: Array<string | false | null | undefined>
) => values.filter(Boolean).join(" ");

export function PublicPage({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx("public-page", className)}
      {...props}
    />
  );
}

export function PublicHero({
  eyebrow,
  title,
  description,
  actions,
  aside,
  compact = false,
  className,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <header
      className={cx(
        "public-hero",
        compact && "public-hero-compact",
        className,
      )}
    >
      <div
        className="public-hero-grid"
        aria-hidden="true"
      />

      <div
        className="public-hero-glow"
        aria-hidden="true"
      />

      <div className="public-hero-copy">
        <div className="public-eyebrow">
          {eyebrow}
        </div>

        <h1 className={compact ? "ds-h1" : "ds-display"}>
          {title}
        </h1>

        {description ? (
          <p className="public-lead">
            {description}
          </p>
        ) : null}

        {actions ? (
          <div className="public-actions">
            {actions}
          </div>
        ) : null}
      </div>

      {aside ? (
        <div className="public-hero-aside">
          {aside}
        </div>
      ) : null}
    </header>
  );
}

export function PublicSection({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
  id,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const titleId = id ? `${id}-title` : undefined;

  return (
    <section
      id={id}
      className={cx("public-section", className)}
      aria-labelledby={titleId}
    >
      <header className="public-section-heading">
        <div className="public-section-heading-copy">
          {eyebrow ? (
            <div className="public-eyebrow">
              {eyebrow}
            </div>
          ) : null}

          <h2
            id={titleId}
            className="ds-h2"
          >
            {title}
          </h2>

          {description ? (
            <p className="public-section-description">
              {description}
            </p>
          ) : null}
        </div>

        {action ? (
          <div className="public-section-action">
            {action}
          </div>
        ) : null}
      </header>

      <div className="public-section-content">
        {children}
      </div>
    </section>
  );
}

export function PublicFilterBar({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx("public-filter-bar", className)}
      {...props}
    />
  );
}

export function PublicEmpty({
  title,
  description,
}: {
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div
      className="public-empty"
      role="status"
    >
      <span
        className="public-empty-mark"
        aria-hidden="true"
      >
        <img
          src="https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/logo"
          alt=""
        />
      </span>

      <h2 className="ds-h3">
        {title}
      </h2>

      {description ? (
        <p>{description}</p>
      ) : null}
    </div>
  );
}
