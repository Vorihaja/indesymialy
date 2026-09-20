import type { Database } from "@/infrastructure/supabase/database.types";

export type ConversationRow =
  Database["public"]["Tables"]["conversations"]["Row"];

export type MessageRow =
  Database["public"]["Tables"]["messages"]["Row"];

export type AttachmentRow =
  Database["public"]["Tables"]["message_attachments"]["Row"];

export type FightProposalRow =
  Database["public"]["Tables"]["fight_proposals"]["Row"];

export type SponsorOfferRow =
  Database["public"]["Tables"]["sponsor_offers"]["Row"];

export type SystemNotificationRow =
  Database["public"]["Tables"]["system_notifications"]["Row"];

export type CommunicationRole =
  | "fighter"
  | "coach"
  | "club"
  | "organizer"
  | "official"
  | "referee"
  | "judge"
  | "sponsor"
  | "seller"
  | "federation"
  | "league"
  | "fan";

export type ConversationKind =
  | "private"
  | "group";

export type MessageStatus =
  | "sending"
  | "sent"
  | "delivered"
  | "read";

export type AttachmentKind =
  | "image"
  | "video"
  | "document"
  | "file";

export type ProposalStatus =
  | "draft"
  | "pending"
  | "accepted"
  | "refused"
  | "countered"
  | "cancelled";

export type NotificationCategory =
  | "message"
  | "fight_proposal"
  | "sponsoring"
  | "event"
  | "fight_live"
  | "role"
  | "moderation"
  | "marketplace"
  | "club"
  | "system"
  | "security";

export interface CommunicationParticipant {
  id: string;
  profileId: string;
  organizationId?: string;
  actorType?: "profile" | "organization";
  name: string;
  avatarUrl?: string;
  role: CommunicationRole;
  participantRole: "owner" | "member" | "moderator";
  muted: boolean;
  blocked: boolean;
  lastReadAt?: string;
}

export interface CommunicationAttachment {
  id: string;
  messageId?: string;
  name: string;
  kind: AttachmentKind;
  size: number;
  mimeType: string;
  previewUrl?: string;
  downloadPrepared: boolean;
}

export interface CommunicationMessage {
  id: string;
  conversationId: string;

  /**
   * Identité publique de l'auteur.
   * Peut être un profile.id ou organizations.id.
   */
  authorId: string;

  authorType?: "profile" | "organization";

  /**
   * Profil humain ayant réellement exécuté l'action.
   * Important pour les futurs messages émis au nom d'une organisation.
   */
  operatorProfileId?: string;

  /**
   * Calculé à partir de sent_by_profile_id === auth.uid().
   * Le composant ne doit plus dépendre de "profile-current".
   */
  isMine?: boolean;

  authorName: string;
  authorAvatarUrl?: string;
  authorRole: CommunicationRole;
  content: string;
  contentType: "text" | "system";
  replyToId?: string;
  forwardOfId?: string;
  attachments: CommunicationAttachment[];
  status: MessageStatus;
  sentAt: string;
  editedAt?: string;
  deletedAt?: string;
}

export interface CommunicationConversation {
  id: string;
  title: string;
  kind: ConversationKind;
  participants: CommunicationParticipant[];
  messages: CommunicationMessage[];
  lastActivityAt: string;
  unreadCount: number;
  favorite: boolean;
  muted: boolean;
  archived: boolean;
  locallyDeleted: boolean;
}

export interface CommunicationRecipient {
  actorId: string;
  profileId: string;
  handle: string;
  displayName: string;
  avatarUrl?: string;
  verified: boolean;
}

export interface FightProposal {
  id: string;
  fighterId: string;
  fighterName: string;
  recipientId: string;
  recipientName: string;
  eventName: string;
  category: string;
  weightKg: number;
  proposedDate: string;
  purseAmount?: number;
  terms: string;
  status: ProposalStatus;
  history: string[];
}

export interface SponsorOffer {
  id: string;
  sponsorId: string;
  sponsorName: string;
  recipientId: string;
  recipientName: string;
  amount: number;
  currency: string;
  durationMonths: number;
  deliverables: string[];
  targetType: "event" | "fighter";
  targetName: string;
  status: ProposalStatus;
  history: string[];
}

export interface CommunicationNotification {
  id: string;
  recipientId: string;
  category: NotificationCategory;
  title: string;
  content: string;
  priority: "low" | "normal" | "high" | "critical";
  actionUrl?: string;
  source: string;
  createdAt: string;
  readAt?: string;
  groupKey?: string;
}

export interface NotificationPreferences {
  profileId: string;
  inApp: boolean;
  emailPrepared: boolean;
  pushPrepared: boolean;
  enabledCategories: NotificationCategory[];
  frequency: "instant" | "daily" | "weekly";
  mutedUntil?: string;
  quietHours?: {
    start: string;
    end: string;
  };
  byRole: Partial<Record<CommunicationRole, boolean>>;
}

export interface RealtimeCommunicationEvent {
  channel:
    | "message"
    | "read"
    | "conversation"
    | "notification"
    | "fight_proposal"
    | "sponsor_offer";

  entityId: string;
  occurredAt: string;
  payload: Record<string, unknown>;
}
