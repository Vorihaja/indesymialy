"use client";
import { NotificationPreferencesFeature as CoreNotificationPreferencesFeature } from "@/modules/communication-core";
import { NotificationPreferencesBoundary } from "../components";
import { useNotificationPreferencesStatus } from "../hooks";
export function NotificationPreferencesFeature() { const status = useNotificationPreferencesStatus(); return <NotificationPreferencesBoundary><span className="sr-only">{status.domain} {status.storage}</span><CoreNotificationPreferencesFeature /></NotificationPreferencesBoundary>; }
