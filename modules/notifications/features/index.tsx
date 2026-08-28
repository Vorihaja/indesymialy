"use client";
import { NotificationsFeature as CoreNotificationsFeature } from "@/modules/communication-core";
import { NotificationsBoundary } from "../components";
import { useNotificationsStatus } from "../hooks";
export function NotificationsFeature() { const status = useNotificationsStatus(); return <NotificationsBoundary><span className="sr-only">{status.domain} {status.storage}</span><CoreNotificationsFeature /></NotificationsBoundary>; }
