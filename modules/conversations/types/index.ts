export interface ConversationsModuleStatus { domain: "conversations"; storage: "memory" | "supabase"; ready: boolean; }
export type * from "@/modules/communication-core/types";
