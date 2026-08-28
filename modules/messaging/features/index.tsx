"use client";
import { MessagingFeature as CoreMessagingFeature } from "@/modules/communication-core";
import { MessagingBoundary } from "../components";
import { useMessagingStatus } from "../hooks";
export function MessagingFeature() { const status = useMessagingStatus(); return <MessagingBoundary><span className="sr-only">{status.domain} {status.storage}</span><CoreMessagingFeature /></MessagingBoundary>; }
