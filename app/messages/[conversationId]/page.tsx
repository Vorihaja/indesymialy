import {
  redirect,
} from "next/navigation";

export default async function LegacyConversationPage({
  params,
}: {
  params: Promise<{
    conversationId: string;
  }>;
}) {
  const {
    conversationId,
  } = await params;

  redirect(
    `/korana/messages/${encodeURIComponent(
      conversationId,
    )}`,
  );
}