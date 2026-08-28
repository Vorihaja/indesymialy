import {
  CommunicationService,
} from "../services/communication.service";

import type {
  CommunicationAttachment,
  CommunicationRole,
  NotificationCategory,
  NotificationPreferences,
  ProposalStatus,
} from "../types";


export class ManageCommunicationUseCase {

  constructor(
    private readonly service:
      CommunicationService,
  ) {}


  conversations(
    query?: string,
  ) {

    return this.service
      .conversations(
        query,
      );
  }


  conversation(
    id: string,
  ) {

    return this.service
      .conversation(
        id,
      );
  }


  searchRecipients(
    query: string,
    limit?: number,
  ) {

    return this.service
      .searchRecipients(
        query,
        limit,
      );
  }


  openPrivateConversation(
    actorId: string,
  ) {

    return this.service
      .openPrivateConversation(
        actorId,
      );
  }


  createConversation(
    title: string,
    kind:
      "private" |
      "group",
    role:
      CommunicationRole,
  ) {

    return this.service
      .createConversation(
        title,
        kind,
        role,
      );
  }


  updateConversation(
    id: string,
    action:
      "archive" |
      "delete_local" |
      "favorite" |
      "mute",
  ) {

    return this.service
      .updateConversation(
        id,
        action,
      );
  }


  send(
    conversationId: string,
    content: string,
    replyToId?: string,
    attachments?:
      CommunicationAttachment[],
  ) {

    return this.service
      .send(
        conversationId,
        content,
        replyToId,
        attachments,
      );
  }


  edit(
    id: string,
    content: string,
  ) {

    return this.service
      .edit(
        id,
        content,
      );
  }


  removeMessage(
    id: string,
  ) {

    return this.service
      .removeMessage(
        id,
      );
  }


  markRead(
    id: string,
  ) {

    return this.service
      .markRead(
        id,
      );
  }


  fightProposals() {

    return this.service
      .fightProposals();
  }


  decideFightProposal(
    id: string,
    status:
      Extract<
        ProposalStatus,
        "accepted" |
        "refused" |
        "countered"
      >,
  ) {

    return this.service
      .decideFightProposal(
        id,
        status,
      );
  }


  sponsorOffers() {

    return this.service
      .sponsorOffers();
  }


  decideSponsorOffer(
    id: string,
    status:
      Extract<
        ProposalStatus,
        "accepted" |
        "refused" |
        "countered"
      >,
  ) {

    return this.service
      .decideSponsorOffer(
        id,
        status,
      );
  }


  notifications(
    category?:
      NotificationCategory,
  ) {

    return this.service
      .notifications(
        category,
      );
  }


  readNotification(
    id: string,
  ) {

    return this.service
      .readNotification(
        id,
      );
  }


  readAllNotifications() {

    return this.service
      .readAllNotifications();
  }


  deleteNotification(
    id: string,
  ) {

    return this.service
      .deleteNotification(
        id,
      );
  }


  preferences() {

    return this.service
      .preferences();
  }


  savePreferences(
    value:
      NotificationPreferences,
  ) {

    return this.service
      .savePreferences(
        value,
      );
  }
}