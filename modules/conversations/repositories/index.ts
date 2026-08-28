import type { ConversationsModuleStatus } from "../types";
export class ConversationsRepository { getStatus(): ConversationsModuleStatus { return { domain: "conversations", storage: "memory", ready: true }; } }
