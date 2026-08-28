import type { OrganizerModuleMock } from "@/modules/organizer-erp/types";

export type RealErpRole =
  | "super-admin" | "admin" | "organizer" | "fighter" | "federation"
  | "league" | "club" | "coach" | "referee" | "judge" | "sponsor"
  | "seller" | "fan";

export type RealErpEntity =
  | "events" | "organization_transactions" | "fighter_transactions"
  | "training_sessions" | "products" | "contracts" | "readonly"
  | "event_schedule_items" | "event_checklists" | "ticket_types"
  | "staff_assignments" | "event_transactions" | "workspace_records"
  | "competitions" | "competition_categories" | "event_registrations"
  | "event_participants" | "event_fight_cards" | "fights"
  | "weigh_ins" | "fight_replacements" | "ticket_sales"
  | "event_invitations" | "event_access_logs" | "ticket_refunds"
  | "event_official_assignments" | "fight_official_assignments"
  | "event_accreditations" | "event_operations"
  | "sponsors" | "sponsor_pipeline" | "sponsor_packages"
  | "sponsor_contracts" | "sponsor_visibility" | "sponsor_activations"
  | "sponsor_deliverables" | "event_budget_lines"
  | "event_invoices" | "event_invoice_payments";

export type RealErpField = {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "time" | "datetime-local" | "select" | "textarea";
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
};

export type RealErpQuery = {
  role: RealErpRole;
  moduleId: string;
  moduleLabel: string;
  tab: string;
};

export type RealErpRecord = {
  id: string;
  values: Record<string, string | number | null>;
};

export type RealErpMutation = {
  entity: RealErpEntity;
  values: Record<string, string | number | null>;
  scope?: Pick<RealErpQuery, "role" | "moduleId" | "tab">;
};

export type RealErpData = OrganizerModuleMock & {
  source: "supabase";
  entity: RealErpEntity;
  rowIds: string[];
  records: RealErpRecord[];
  fields: RealErpField[];
  emptyMessage: string;
  capabilities: {
    create: boolean;
    update: boolean;
    delete: boolean;
  };
};
