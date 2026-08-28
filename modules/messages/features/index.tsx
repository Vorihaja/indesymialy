"use client";
import { MessagingFeature } from "@/modules/communication-core";
import { MessagesBoundary } from "../components";
import { useMessagesStatus } from "../hooks";
export function MessagesFeature() { const status = useMessagesStatus(); return <MessagesBoundary><span className="sr-only">{status.domain} {status.storage}</span><MessagingFeature /></MessagesBoundary>; }
