"use client";
import { AuthenticatedCommunicationGuard } from "@/modules/communication-core/components/AuthenticatedCommunicationGuard";
import { MessagingFeature } from "@/modules/communication-core/features/CommunicationFeatures";
export default function MessageWorkspace() { return <AuthenticatedCommunicationGuard embedded><MessagingFeature embedded /></AuthenticatedCommunicationGuard>; }
