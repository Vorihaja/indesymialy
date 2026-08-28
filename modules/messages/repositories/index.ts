import type { MessagesModuleStatus } from "../types";
export class MessagesRepository { getStatus(): MessagesModuleStatus { return { domain: "messages", storage: "memory", ready: true }; } }
