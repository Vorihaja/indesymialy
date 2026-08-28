export function SuperAdminLoadingState() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3, 4, 5].map(
        (item) => (
          <div
            key={item}
            className="h-32 animate-pulse border border-[#272a31] bg-[#111318]"
          />
        ),
      )}
    </div>
  );
}

export function SuperAdminErrorState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="border border-red-500/30 bg-red-500/5 p-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-400">
        Control Center indisponible
      </p>

      <p className="mt-2 text-sm text-red-200">
        {message}
      </p>
    </div>
  );
}

export function SuperAdminPanel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "border border-[#272a31] bg-[#111318]",
        className,
      ].join(" ")}
    >
      <header className="border-b border-[#272a31] px-5 py-4">
        <h2 className="text-xs font-black uppercase tracking-[0.16em] text-zinc-200">
          {title}
        </h2>

        {subtitle && (
          <p className="mt-1 text-[11px] text-zinc-600">
            {subtitle}
          </p>
        )}
      </header>

      <div className="p-5">
        {children}
      </div>
    </section>
  );
}
