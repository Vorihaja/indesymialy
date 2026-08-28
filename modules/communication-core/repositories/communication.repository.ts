import type {
  CommunicationAttachment,
  CommunicationConversation,
  CommunicationMessage,
  CommunicationNotification,
  CommunicationRecipient,
  CommunicationRole,
  ConversationKind,
  FightProposal,
  NotificationCategory,
  NotificationPreferences,
  ProposalStatus,
  SponsorOffer,
} from "../types";

export type CommunicationConversationAction =
  | "archive"
  | "delete_local"
  | "favorite"
  | "mute";

export interface CommunicationRepository {
  listConversations(
    query?: string,
  ): Promise<CommunicationConversation[]>;

  getConversation(
    id: string,
  ): Promise<CommunicationConversation | null>;

  searchRecipients(
    query: string,
    limit?: number,
  ): Promise<CommunicationRecipient[]>;

  openPrivateConversation(
    actorId: string,
  ): Promise<CommunicationConversation>;
  createConversation(
    title: string,
    kind: ConversationKind,
    role: CommunicationRole,
  ): Promise<CommunicationConversation>;

  updateConversation(
    id: string,
    action: CommunicationConversationAction,
  ): Promise<CommunicationConversation | null>;

  sendMessage(
    conversationId: string,
    content: string,
    replyToId?: string,
    attachments?: CommunicationAttachment[],
  ): Promise<CommunicationMessage>;

  editMessage(
    messageId: string,
    content: string,
  ): Promise<CommunicationMessage | null>;

  deleteMessage(
    messageId: string,
  ): Promise<CommunicationMessage | null>;

  markConversationRead(
    conversationId: string,
  ): Promise<void>;

  listFightProposals(): Promise<FightProposal[]>;

  decideFightProposal(
    id: string,
    status: Extract<
      ProposalStatus,
      "accepted" | "refused" | "countered"
    >,
  ): Promise<FightProposal | null>;

  listSponsorOffers(): Promise<SponsorOffer[]>;

  decideSponsorOffer(
    id: string,
    status: Extract<
      ProposalStatus,
      "accepted" | "refused" | "countered"
    >,
  ): Promise<SponsorOffer | null>;

  listNotifications(
    category?: NotificationCategory,
  ): Promise<CommunicationNotification[]>;

  markNotificationRead(
    id: string,
  ): Promise<void>;

  markAllNotificationsRead(): Promise<void>;

  deleteNotification(
    id: string,
  ): Promise<void>;

  getPreferences(): Promise<NotificationPreferences>;

  savePreferences(
    value: NotificationPreferences,
  ): Promise<NotificationPreferences>;
}