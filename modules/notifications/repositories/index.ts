import type { NotificationsModuleStatus } from "../types";
export class NotificationsRepository { getStatus(): NotificationsModuleStatus { return { domain: "notifications", storage: "memory", ready: true }; } }
