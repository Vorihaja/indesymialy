import type { MessageAttachmentsModuleStatus } from "../types";
export class MessageAttachmentsRepository { getStatus(): MessageAttachmentsModuleStatus { return { domain: "message-attachments", storage: "memory", ready: true }; } }
