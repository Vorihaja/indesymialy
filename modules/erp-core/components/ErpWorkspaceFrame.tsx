import type {
  ReactNode,
  Ref,
} from "react";

type ErpWorkspaceFrameProps = {
  ariaLabel: string;
  sidebar: ReactNode;
  tabs?: ReactNode;
  mainRef?: Ref<HTMLElement>;
  children: ReactNode;
};

export function ErpWorkspaceFrame({
  ariaLabel,
  sidebar,
  tabs,
  mainRef,
  children,
}: ErpWorkspaceFrameProps) {
  return (
    <section
      className="erp-workspace-frame organizer-erp-shell text-zinc-100"
      aria-label={ariaLabel}
    >
      {sidebar}

      <div className="organizer-erp-main-column flex min-w-0 flex-1 flex-col">
        {tabs}

        <section
          ref={mainRef}
          className="organizer-erp-main flex-1 bg-[#0b0c0e] p-3 font-[Segoe_UI,Arial,Helvetica,Roboto,sans-serif] sm:p-4"
          aria-label={`Contenu ${ariaLabel}`}
        >
          {children}
        </section>
      </div>
    </section>
  );
}
