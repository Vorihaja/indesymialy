import {
  ErpManagementFeature,
} from "@/modules/erp-core";
import {
  ERP_MODULES,
} from "@/modules/erp-modules";

export function OfficialManagementFeature(props: {
  mode?: "list" | "create" | "detail";
  recordId?: string;
}) {
  return (
    <ErpManagementFeature
      definition={ERP_MODULES.official}
      {...props}
    />
  );
}
