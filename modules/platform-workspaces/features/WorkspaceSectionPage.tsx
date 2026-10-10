import { AdminOrganizationsFeature } from "@/modules/admin-organizations";
import { ErpCalendarWorkspace } from "@/modules/erp-calendar";
import {
  resolveCanonicalErpRole,
  resolveErpModuleEntry,
} from "@/modules/erp-dispatch-registry";
import { RealModuleDataView } from "@/modules/organizer-erp/components/RealModuleDataView";
import { SellerAgendaFeature } from "@/modules/seller-agenda";
import { FinanceFeature } from "@/modules/finance-erp";
import { isRoleLiveRole, RoleLiveFeature } from "@/modules/fight-live";
import { getWorkspaceDefinition, getWorkspaceSectionLabel } from "../config";
import type { WorkspaceRole, WorkspaceSection } from "../types";
import { PersonnelWorkspace } from "@/modules/personnel-erp";

export function WorkspaceSectionPage({
  role,
  section,
}: {
  role: WorkspaceRole;
  section: WorkspaceSection;
}) {
  /*
   * INDESY CRUD FALLBACK P0
   *
   * Une route Agenda ne doit jamais etre resolue comme un CRUD events.
   * Le vendeur conserve seller_agenda_items comme autorite.
   */
  const resolvedRegistryEntry = resolveErpModuleEntry(
    resolveCanonicalErpRole(role) ?? role,
    section,
  );

  if (!resolvedRegistryEntry) {
    if (process.env.NODE_ENV === "development") {
      throw new Error(
        `[ERP dispatch] Missing registry entry for ${role}/${section}`,
      );
    }

    return (
      <section
        role="status"
        className="grid min-h-56 place-items-center border border-red-500/30 bg-[#151619] p-6 text-center"
      >
        <div>
          <p className="mt-3 text-[12px] font-semibold text-zinc-100">
            Module non modifiable
          </p>
        </div>
      </section>
    );
  }

  if (resolvedRegistryEntry.implementationStatus === "unavailable") {
    return (
      <section
        role="status"
        className="grid min-h-56 place-items-center border border-amber-500/30 bg-[#151619] p-6 text-center"
      >
        <div>
          <p className="mt-3 text-[12px] font-semibold text-zinc-100">
            Module en cours de développement
          </p>
        </div>
      </section>
    );
  }

  if (section === "calendar") {
    return role === "seller"
      ? <SellerAgendaFeature />
      : <ErpCalendarWorkspace role={role} />;
  }

  if (resolvedRegistryEntry.handlerKey === "admin-events") {
    return (
      <AdminOrganizationsFeature
        domain="events"
        access="admin"
      />
    );
  }

  if (resolvedRegistryEntry.handlerKey === "organization-personnel") {
    return (
      <PersonnelWorkspace
        canonicalRole={String(role)}
      />
    );
  }

  if (resolvedRegistryEntry.handlerKey === "finance-erp") {
    return <FinanceFeature role={role} />;
  }

  if (resolvedRegistryEntry.handlerKey === "role-live" && isRoleLiveRole(role)) {
    return <RoleLiveFeature role={role} />;
  }

  const workspace = getWorkspaceDefinition(role);
  const label = getWorkspaceSectionLabel(section);

  return (
    <RealModuleDataView
      role={role}
      moduleId={section}
      moduleLabel={`${workspace.label} · ${label}`}
      tab={label}
    />
  );
}
