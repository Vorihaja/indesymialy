"use client";
import { useCommunicationRealtime } from "@/modules/communication-core"; function RealtimeStatus() { const { connected, events } = useCommunicationRealtime(false); return <section className="rounded-xl border border-neutral-200 p-6 dark:border-neutral-800"><h1 className="text-2xl font-black">Notifications temps réel</h1><p className="mt-3 text-sm text-neutral-500">Infrastructure prête · {connected ? "connectée" : "connexion différée"} · {events.length} événement(s)</p></section>; }
import { RealtimeNotificationsBoundary } from "../components";
import { useRealtimeNotificationsStatus } from "../hooks";
export function RealtimeNotificationsFeature() { const status = useRealtimeNotificationsStatus(); return <RealtimeNotificationsBoundary><span className="sr-only">{status.domain} {status.storage}</span><RealtimeStatus /></RealtimeNotificationsBoundary>; }
