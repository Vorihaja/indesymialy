import type { RealtimeNotificationsModuleStatus } from "../types";
export class RealtimeNotificationsRepository { getStatus(): RealtimeNotificationsModuleStatus { return { domain: "realtime-notifications", storage: "memory", ready: true }; } }
