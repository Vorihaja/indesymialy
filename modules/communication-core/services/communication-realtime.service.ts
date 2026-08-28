import type {
  RealtimeChannel,
} from "@supabase/supabase-js";

import {
  CommunicationRealtimeRepository,
} from "../repositories/communication-realtime.repository";

import type {
  CommunicationRealtimeChangeCallback,
  CommunicationRealtimeStatusCallback,
} from "../repositories/communication-realtime.repository";


export class CommunicationRealtimeService {

  constructor(
    private readonly repository:
      CommunicationRealtimeRepository,
  ) {}


  currentProfileId() {
    return this.repository
      .currentProfileId();
  }


  subscribeConversation(
    conversationId: string,
    callback:
      CommunicationRealtimeChangeCallback,
    statusCallback?:
      CommunicationRealtimeStatusCallback,
  ) {

    return this.repository
      .subscribeConversation(
        conversationId,
        callback,
        statusCallback,
      );
  }


  subscribeProfile(
    profileId: string,
    callback:
      CommunicationRealtimeChangeCallback,
    statusCallback?:
      CommunicationRealtimeStatusCallback,
  ) {

    return this.repository
      .subscribeProfile(
        profileId,
        callback,
        statusCallback,
      );
  }


  unsubscribe(
    channel:
      RealtimeChannel,
  ) {

    return this.repository
      .unsubscribe(
        channel,
      );
  }
}