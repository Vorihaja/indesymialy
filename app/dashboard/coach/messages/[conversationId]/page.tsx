import {
  redirect,
} from "next/navigation";

import {
  resolveErpExternalSurface,
} from "@/modules/erp-dispatch-registry";

export default async function ErpCommunicationConversationBridgePage({
  params,
}: {
  params: Promise<{
    conversationId: string;
  }>;
}) {
  const {
    conversationId,
  } = await params;

  const external =
    resolveErpExternalSurface(
      "coach",
      "communication",
    );

  if (!external) {
    throw new Error(
      "Korana communication external surface is not configured.",
    );
  }

  redirect(
    `${external.href}/${encodeURIComponent(
      conversationId,
    )}`,
  );
}