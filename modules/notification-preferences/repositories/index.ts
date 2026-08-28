import type { NotificationPreferencesModuleStatus } from "../types";
export class NotificationPreferencesRepository { getStatus(): NotificationPreferencesModuleStatus { return { domain: "notification-preferences", storage: "memory", ready: true }; } }
