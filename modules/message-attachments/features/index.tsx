"use client";
import { MessagingFeature } from "@/modules/communication-core";
import { MessageAttachmentsBoundary } from "../components";
import { useMessageAttachmentsStatus } from "../hooks";
export function MessageAttachmentsFeature() { const status = useMessageAttachmentsStatus(); return <MessageAttachmentsBoundary><span className="sr-only">{status.domain} {status.storage}</span><MessagingFeature /></MessageAttachmentsBoundary>; }
