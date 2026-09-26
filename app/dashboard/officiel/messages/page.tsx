import {
  redirect,
} from "next/navigation";

import {
  resolveErpExternalSurface,
} from "@/modules/erp-dispatch-registry";

export default function ErpCommunicationBridgePage() {
  const external =
    resolveErpExternalSurface(
      "official",
      "communication",
    );

  if (!external) {
    throw new Error(
      "Korana communication external surface is not configured.",
    );
  }

  redirect(external.href);
}