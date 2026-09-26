import type {
  CommunicationConversationAction,
  CommunicationRepository,
} from "../repositories/communication.repository";

import type {
  CommunicationAttachmentUpload,
  CommunicationRole,
  ConversationKind,
  NotificationCategory,
  NotificationPreferences,
  ProposalStatus,
} from "../types";

export class CommunicationService {
  constructor(
    private readonly repository: CommunicationRepository,
  ) {}

  conversations(query?: string) {
    return this.repository.listConversations(query);
  }

  conversation(id: string) {
    if (!id) {
      throw new Error("Conversation obligatoire");
    }

    return this.repository.getConversation(id);
  }

  searchRecipients(
    query: string,
    limit = 20,
  ) {

    const normalized =
      query.trim();


    if (
      normalized.length <
      2
    ) {

      return Promise.resolve(
        [],
      );
    }


    const safeLimit =
      Number.isFinite(
        limit,
      )
        ? Math.min(
            Math.max(
              Math.trunc(
                limit,
              ),
              1,
            ),
            50,
          )
        : 20;


    return this.repository
      .searchRecipients(
        normalized,
        safeLimit,
      );
  }


  openPrivateConversation(
    actorId: string,
  ) {

    const normalized =
      actorId.trim();


    if (
      !normalized
    ) {

      throw new Error(
        "Destinataire obligatoire",
      );
    }


    return this.repository
      .openPrivateConversation(
        normalized,
      );
  }

  openPrivateConversationForProfile(
    profileId: string,
  ) {
    const normalized = profileId.trim();

    if (!normalized) {
      throw new Error("Profil destinataire obligatoire");
    }

    return this.repository.openPrivateConversationForProfile(
      normalized,
    );
  }

  createConversation(
    title: string,
    kind: ConversationKind,
    role: CommunicationRole,
  ) {
    const normalizedTitle = title.trim();

    if (normalizedTitle.length < 2) {
      throw new Error("Titre de conversation invalide");
    }

    return this.repository.createConversation(
      normalizedTitle,
      kind,
      role,
    );
  }

  updateConversation(
    id: string,
    action: CommunicationConversationAction,
  ) {
    if (!id) {
      throw new Error("Conversation obligatoire");
    }

    return this.repository.updateConversation(id, action);
  }

  send(
    conversationId: string,
    content: string,
    replyToId?: string,
    attachments?: CommunicationAttachmentUpload[],
  ) {
    const normalizedContent = content.trim();

    if (!normalizedContent && !attachments?.length) {
      throw new Error(
        "Le message ou une pièce jointe est obligatoire",
      );
    }

    return this.repository.sendMessage(
      conversationId,
      normalizedContent,
      replyToId,
      attachments,
    );
  }

  edit(
    id: string,
    content: string,
  ) {
    const normalizedContent = content.trim();

    if (!normalizedContent) {
      throw new Error(
        "Le message ne peut pas être vide",
      );
    }

    return this.repository.editMessage(
      id,
      normalizedContent,
    );
  }

  removeMessage(id: string) {
    return this.repository.deleteMessage(id);
  }

  markRead(id: string) {
    return this.repository.markConversationRead(id);
  }

  fightProposals() {
    return this.repository.listFightProposals();
  }

  decideFightProposal(
    id: string,
    status: Extract<
      ProposalStatus,
      "accepted" | "refused" | "countered"
    >,
  ) {
    return this.repository.decideFightProposal(
      id,
      status,
    );
  }

  sponsorOffers() {
    return this.repository.listSponsorOffers();
  }

  decideSponsorOffer(
    id: string,
    status: Extract<
      ProposalStatus,
      "accepted" | "refused" | "countered"
    >,
  ) {
    return this.repository.decideSponsorOffer(
      id,
      status,
    );
  }

  notifications(
    category?: NotificationCategory,
  ) {
    return this.repository.listNotifications(
      category,
    );
  }

  readNotification(id: string) {
    return this.repository.markNotificationRead(id);
  }

  readAllNotifications() {
    return this.repository.markAllNotificationsRead();
  }

  deleteNotification(id: string) {
    return this.repository.deleteNotification(id);
  }

  preferences() {
    return this.repository.getPreferences();
  }

  savePreferences(
    value: NotificationPreferences,
  ) {
    return this.repository.savePreferences(value);
  }
}
