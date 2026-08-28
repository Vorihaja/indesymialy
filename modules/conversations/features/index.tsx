"use client";
import { MessagingFeature } from "@/modules/communication-core";
import { ConversationsBoundary } from "../components";
import { useConversationsStatus } from "../hooks";
export function ConversationsFeature() { const status = useConversationsStatus(); return <ConversationsBoundary><span className="sr-only">{status.domain} {status.storage}</span><MessagingFeature /></ConversationsBoundary>; }
