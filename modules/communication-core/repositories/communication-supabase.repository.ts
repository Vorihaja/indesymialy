import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  Database,
} from "@/infrastructure/supabase/database.types";

import {
  BackendError,
  normalizeBackendError,
} from "@/shared/errors/backend-error";

import {
  MESSAGE_ATTACHMENT_BUCKET,
  sanitizeAttachmentName,
  validateAttachmentFile,
} from "../attachments";

import type {
  CommunicationConversationAction,
  CommunicationRepository,
} from "./communication.repository";

import type {
  AttachmentKind,
  CommunicationAttachment,
  CommunicationAttachmentUpload,
  CommunicationConversation,
  CommunicationMessage,
  CommunicationParticipant,
  CommunicationNotification,
  CommunicationRecipient,
  CommunicationRole,
  ConversationKind,
  FightProposal,
  MessageStatus,
  NotificationCategory,
  NotificationPreferences,
  ProposalStatus,
  SponsorOffer,
} from "../types";

type ConversationRow =
  Database["public"]["Tables"]["conversations"]["Row"];

type ParticipantRow =
  Database["public"]["Tables"]["conversation_participants"]["Row"];

type ConversationPreferenceRow =
  Database["public"]["Tables"]["conversation_user_preferences"]["Row"];

type ConversationPreferenceUpdate =
  Database["public"]["Tables"]["conversation_user_preferences"]["Update"];

type MessageRow =
  Database["public"]["Tables"]["messages"]["Row"];

type AttachmentRow =
  Database["public"]["Tables"]["message_attachments"]["Row"];

type DeliveryReceiptRow =
  Database["public"]["Tables"]["message_delivery_receipts"]["Row"];

type NotificationPreferenceInsert =
  Database["public"]["Tables"]["notification_preferences"]["Insert"];

type ActorDescriptor = {
  name: string;
  role: CommunicationRole;
  avatarUrl?: string;
};

const organizationMessagingRoles =
  new Set<CommunicationRole>([
    "club",
    "organizer",
    "sponsor",
    "seller",
    "federation",
    "league",
  ]);

const roles = new Set<CommunicationRole>([
  "fighter",
  "coach",
  "club",
  "organizer",
  "referee",
  "judge",
  "sponsor",
  "seller",
  "federation",
  "league",
  "fan",
]);

const categories = new Set<NotificationCategory>([
  "message",
  "fight_proposal",
  "sponsoring",
  "event",
  "fight_live",
  "role",
  "moderation",
  "marketplace",
  "club",
  "system",
  "security",
]);

const proposalStatuses = new Set<ProposalStatus>([
  "draft",
  "pending",
  "accepted",
  "refused",
  "countered",
  "cancelled",
]);

const messageStatuses = new Set<MessageStatus>([
  "sent",
  "delivered",
  "read",
]);

function communicationRole(
  value: string | null | undefined,
): CommunicationRole {
  if (
    value &&
    roles.has(value as CommunicationRole)
  ) {
    return value as CommunicationRole;
  }

  return "fighter";
}

function proposalStatus(
  value: string | null,
): ProposalStatus {
  if (
    value &&
    proposalStatuses.has(
      value as ProposalStatus,
    )
  ) {
    return value as ProposalStatus;
  }

  return "pending";
}

function notificationCategory(
  value: string | null,
): NotificationCategory {
  if (
    value &&
    categories.has(
      value as NotificationCategory,
    )
  ) {
    return value as NotificationCategory;
  }

  return "system";
}

function conversationKind(
  value: string | null,
): ConversationKind {
  return value === "group"
    ? "group"
    : "private";
}

function participantRole(
  value: string | null,
): "owner" | "member" | "moderator" {
  if (
    value === "owner" ||
    value === "moderator"
  ) {
    return value;
  }

  return "member";
}

function attachmentKind(
  row: AttachmentRow,
): AttachmentKind {
  const explicit =
    (row.file_type ?? "").toLowerCase();

  if (
    explicit === "image" ||
    explicit === "video" ||
    explicit === "audio" ||
    explicit === "document" ||
    explicit === "file"
  ) {
    return explicit as AttachmentKind;
  }

  const mime =
    (row.mime_type ?? "").toLowerCase();

  if (mime.startsWith("image/")) {
    return "image";
  }

  if (mime.startsWith("video/")) {
    return "video";
  }

  if (mime.startsWith("audio/")) {
    return "audio";
  }

  if (
    mime === "application/pdf" ||
    mime.includes("document") ||
    mime.includes("word") ||
    mime.includes("sheet") ||
    mime.includes("excel") ||
    mime.includes("presentation")
  ) {
    return "document";
  }

  return "file";
}

function mutedNow(
  mutedUntil: string | null | undefined,
): boolean {
  if (!mutedUntil) {
    return false;
  }

  const timestamp =
    new Date(mutedUntil).getTime();

  return (
    Number.isFinite(timestamp) &&
    timestamp > Date.now()
  );
}

function preferenceFrequency(
  value: string,
): NotificationPreferences["frequency"] {
  if (
    value === "daily" ||
    value === "weekly"
  ) {
    return value;
  }

  return "instant";
}

function normalizeTime(
  value: string | null,
): string | undefined {
  if (!value) {
    return undefined;
  }

  return value.length >= 5
    ? value.slice(0, 5)
    : value;
}

function parseRoleOverrides(
  value: unknown,
): Partial<
  Record<CommunicationRole, boolean>
> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  const result:
    Partial<
      Record<CommunicationRole, boolean>
    > = {};

  for (
    const [key, enabled]
    of Object.entries(
      value as Record<string, unknown>,
    )
  ) {
    if (
      roles.has(
        key as CommunicationRole,
      ) &&
      typeof enabled === "boolean"
    ) {
      result[
        key as CommunicationRole
      ] = enabled;
    }
  }

  return result;
}

function addToArrayMap<T>(
  map: Map<string, T[]>,
  key: string,
  value: T,
): void {
  const existing = map.get(key);

  if (existing) {
    existing.push(value);
    return;
  }

  map.set(key, [value]);
}

export class CommunicationSupabaseRepository
  implements CommunicationRepository
{
  constructor(
    private readonly supabase:
      SupabaseClient<Database>,
    private readonly role?:
      CommunicationRole,
  ) {}

  private async senderOrganizationId(): Promise<
    string | undefined
  > {
    if (
      !this.role ||
      !organizationMessagingRoles.has(
        this.role,
      )
    ) {
      return undefined;
    }

    const userId =
      await this.userId();

    const {
      data,
      error,
    } =
      await this.supabase
        .from("active_organizations")
        .select("organization_id")
        .eq("profile_id", userId)
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data?.organization_id) {
      throw new BackendError(
        "VALIDATION_ERROR",
        "Activez une organisation avant d’utiliser sa messagerie.",
      );
    }

    return data.organization_id;
  }

  private async userId(): Promise<string> {
    const {
      data,
      error,
    } =
      await this.supabase.auth.getUser();

    if (error) {
      throw normalizeBackendError(error);
    }

    if (!data.user) {
      throw new BackendError(
        "UNAUTHENTICATED",
      );
    }

    return data.user.id;
  }

  private async profileDirectory(
    ids: string[],
  ): Promise<
    Map<string, ActorDescriptor>
  > {
    const uniqueIds =
      Array.from(new Set(ids));

    if (!uniqueIds.length) {
      return new Map();
    }

    const {
      data: profiles,
      error: profilesError,
    } =
      await this.supabase
        .from("profiles")
        .select(
          "id,full_name,primary_role_id,photo_url",
        )
        .in("id", uniqueIds);

    if (profilesError) {
      throw profilesError;
    }

    const roleIds =
      Array.from(
        new Set(
          (profiles ?? [])
            .map(
              (profile) =>
                profile.primary_role_id,
            )
            .filter(
              (id): id is string =>
                Boolean(id),
            ),
        ),
      );

    const roleSlugById =
      new Map<string, string>();

    if (roleIds.length) {
      const {
        data: roleRows,
        error: roleError,
      } =
        await this.supabase
          .from("roles")
          .select("id,slug")
          .in("id", roleIds);

      if (roleError) {
        throw roleError;
      }

      for (const item of roleRows ?? []) {
        roleSlugById.set(
          item.id,
          item.slug,
        );
      }
    }

    const result =
      new Map<
        string,
        ActorDescriptor
      >();

    for (const profile of profiles ?? []) {
      const roleSlug =
        profile.primary_role_id
          ? roleSlugById.get(
              profile.primary_role_id,
            )
          : undefined;

      result.set(
        profile.id,
        {
          name:
            profile.full_name ||
            "Membre Indesy",
          role:
            communicationRole(
              roleSlug,
            ),

          avatarUrl:
            profile.photo_url ??
            undefined,
        },
      );
    }

    return result;
  }

  private async organizationDirectory(
    ids: string[],
  ): Promise<
    Map<string, ActorDescriptor>
  > {
    const uniqueIds =
      Array.from(new Set(ids));

    if (!uniqueIds.length) {
      return new Map();
    }

    const {
      data,
      error,
    } =
      await this.supabase
        .from("organizations")
        .select("id,name,type,logo_url")
        .in("id", uniqueIds);

    if (error) {
      throw error;
    }

    return new Map(
      (data ?? []).map(
        (organization) => [
          organization.id,
          {
            name:
              organization.name ||
              "Organisation",
            role:
              communicationRole(
                organization.type,
              ),

            avatarUrl:
              organization.logo_url ??
              undefined,
          },
        ],
      ),
    );
  }

  private async representedOrganizationIds(
    ids: string[],
    userId: string,
  ): Promise<Set<string>> {
    const uniqueIds =
      Array.from(new Set(ids));

    if (!uniqueIds.length) {
      return new Set();
    }

    const [
      ownerResult,
      memberResult,
    ] =
      await Promise.all([
        this.supabase
          .from("organizations")
          .select("id")
          .in("id", uniqueIds)
          .eq("owner_id", userId),
        this.supabase
          .from("organization_members")
          .select("organization_id")
          .in(
            "organization_id",
            uniqueIds,
          )
          .eq("profile_id", userId)
          .eq("status", "active")
          .eq("role", "owner"),
      ]);

    const error =
      ownerResult.error ??
      memberResult.error;

    if (error) {
      throw error;
    }

    return new Set([
      ...(ownerResult.data ?? [])
        .map((item) => item.id),
      ...(memberResult.data ?? [])
        .map(
          (item) =>
            item.organization_id,
        )
        .filter(
          (id): id is string =>
            Boolean(id),
        ),
    ]);
  }

  private async attachmentDirectory(
    messageIds: string[],
  ): Promise<
    Map<string, CommunicationAttachment[]>
  > {
    const result =
      new Map<
        string,
        CommunicationAttachment[]
      >();

    if (!messageIds.length) {
      return result;
    }

    const {
      data,
      error,
    } =
      await this.supabase
        .from("message_attachments")
        .select("*")
        .in(
          "message_id",
          messageIds,
        );

    if (error) {
      throw error;
    }

    const rows =
      data ?? [];

    const signedUrlEntries =
      await Promise.all(
        rows.map(
          async (row) => {
            const {
              data: signed,
              error: signedError,
            } =
              await this.supabase.storage
                .from(
                  MESSAGE_ATTACHMENT_BUCKET,
                )
                .createSignedUrl(
                  row.file_url,
                  3600,
                );

            return [
              row.id,
              signedError
                ? undefined
                : signed.signedUrl,
            ] as const;
          },
        ),
      );

    const signedUrls =
      new Map(
        signedUrlEntries,
      );

    for (const row of rows) {
      if (!row.message_id) {
        continue;
      }

      const attachment:
        CommunicationAttachment = {
          id: row.id,
          messageId:
            row.message_id,
          name:
            row.file_name,
          kind:
            attachmentKind(row),
          size:
            row.file_size ?? 0,
          mimeType:
            row.mime_type ??
            "application/octet-stream",
          previewUrl:
            signedUrls.get(
              row.id,
            ),
          downloadPrepared:
            Boolean(
              signedUrls.get(
                row.id,
              ),
            ),
        };

      addToArrayMap(
        result,
        row.message_id,
        attachment,
      );
    }

    return result;
  }

  private async receiptStatusDirectory(
    messageIds: string[],
  ): Promise<
    Map<string, MessageStatus>
  > {
    const result =
      new Map<
        string,
        MessageStatus
      >();

    if (!messageIds.length) {
      return result;
    }

    const {
      data,
      error,
    } =
      await this.supabase
        .from(
          "message_delivery_receipts",
        )
        .select(
          "message_id,status,profile_id,occurred_at",
        )
        .in(
          "message_id",
          messageIds,
        );

    if (error) {
      throw error;
    }

    const rank:
      Record<MessageStatus, number> = {
        sending: 0,
        sent: 1,
        delivered: 2,
        read: 3,
      };

    for (
      const receipt
      of (data ?? []) as DeliveryReceiptRow[]
    ) {
      if (
        !messageStatuses.has(
          receipt.status as MessageStatus,
        )
      ) {
        continue;
      }

      const next =
        receipt.status as MessageStatus;

      const current =
        result.get(
          receipt.message_id,
        ) ?? "sent";

      if (
        rank[next] > rank[current]
      ) {
        result.set(
          receipt.message_id,
          next,
        );
      }
    }

    return result;
  }

  private mapMessage(
    row: MessageRow,
    userId: string,
    profiles:
      Map<string, ActorDescriptor>,
    organizations:
      Map<string, ActorDescriptor>,
    attachments:
      CommunicationAttachment[],
    status:
      MessageStatus = "sent",
  ): CommunicationMessage {
    const profileActor =
      row.sender_profile_id
        ? profiles.get(
            row.sender_profile_id,
          )
        : undefined;

    const organizationActor =
      row.sender_organization_id
        ? organizations.get(
            row.sender_organization_id,
          )
        : undefined;

    const actor =
      profileActor ??
      organizationActor;

    const authorId =
      row.sender_profile_id ??
      row.sender_organization_id ??
      row.sent_by_profile_id;

    return {
      id: row.id,
      conversationId:
        row.conversation_id,
      authorId,
      authorType:
        row.sender_organization_id
          ? "organization"
          : "profile",
      operatorProfileId:
        row.sent_by_profile_id,
      isMine:
        row.sent_by_profile_id ===
        userId,
      authorName:
        actor?.name ??
        "Membre Indesy",

      authorAvatarUrl:
        actor?.avatarUrl,
      authorRole:
        actor?.role ??
        "fighter",
      content:
        row.is_deleted
          ? "Message supprimé"
          : row.content ?? "",
      contentType:
        row.message_type ===
        "system"
          ? "system"
          : "text",
      replyToId:
        row.reply_to_id ??
        undefined,
      attachments:
        row.is_deleted
          ? []
          : attachments,
      status,
      sentAt:
        row.sent_at ??
        new Date(0).toISOString(),
      editedAt:
        row.edited_at ??
        undefined,
      deletedAt:
        row.deleted_at ??
        undefined,
    };
  }

  private async hydrateMany(
    conversationRows:
      ConversationRow[],
    userId: string,
  ): Promise<
    CommunicationConversation[]
  > {
    if (!conversationRows.length) {
      return [];
    }

    const conversationIds =
      conversationRows.map(
        (item) => item.id,
      );

    const [
      participantResult,
      messageResult,
      preferenceResult,
    ] =
      await Promise.all([
        this.supabase
          .from(
            "conversation_participants",
          )
          .select("*")
          .in(
            "conversation_id",
            conversationIds,
          )
          .is("left_at", null),

        this.supabase
          .from("messages")
          .select("*")
          .in(
            "conversation_id",
            conversationIds,
          )
          .order(
            "sent_at",
            {
              ascending: true,
            },
          ),

        this.supabase
          .from(
            "conversation_user_preferences",
          )
          .select("*")
          .eq(
            "profile_id",
            userId,
          )
          .in(
            "conversation_id",
            conversationIds,
          ),
      ]);

    const firstError =
      participantResult.error ??
      messageResult.error ??
      preferenceResult.error;

    if (firstError) {
      throw firstError;
    }

    const participants =
      participantResult.data ?? [];

    const messages =
      messageResult.data ?? [];

    const preferences =
      preferenceResult.data ?? [];

    const profileIdSet =
      new Set<string>([userId]);

    const organizationIdSet =
      new Set<string>();

    for (
      const participant
      of participants
    ) {
      if (participant.profile_id) {
        profileIdSet.add(
          participant.profile_id,
        );
      }

      if (
        participant.organization_id
      ) {
        organizationIdSet.add(
          participant.organization_id,
        );
      }
    }

    for (const message of messages) {
      if (
        message.sender_profile_id
      ) {
        profileIdSet.add(
          message.sender_profile_id,
        );
      }

      if (
        message.sent_by_profile_id
      ) {
        profileIdSet.add(
          message.sent_by_profile_id,
        );
      }

      if (
        message.sender_organization_id
      ) {
        organizationIdSet.add(
          message.sender_organization_id,
        );
      }
    }

    const messageIds =
      messages.map(
        (message) => message.id,
      );

    const [
      profiles,
      organizations,
      representedOrganizationIds,
      attachmentsByMessage,
      statusByMessage,
    ] =
      await Promise.all([
        this.profileDirectory(
          Array.from(profileIdSet),
        ),

        this.organizationDirectory(
          Array.from(
            organizationIdSet,
          ),
        ),

        this.representedOrganizationIds(
          Array.from(
            organizationIdSet,
          ),
          userId,
        ),

        this.attachmentDirectory(
          messageIds,
        ),

        this.receiptStatusDirectory(
          messageIds,
        ),
      ]);

    const participantsByConversation =
      new Map<
        string,
        ParticipantRow[]
      >();

    for (
      const participant
      of participants
    ) {
      addToArrayMap(
        participantsByConversation,
        participant.conversation_id,
        participant,
      );
    }

    const messagesByConversation =
      new Map<
        string,
        MessageRow[]
      >();

    for (const message of messages) {
      addToArrayMap(
        messagesByConversation,
        message.conversation_id,
        message,
      );
    }

    const preferenceByConversation =
      new Map<
        string,
        ConversationPreferenceRow
      >();

    for (
      const preference
      of preferences
    ) {
      preferenceByConversation.set(
        preference.conversation_id,
        preference,
      );
    }

    return conversationRows.map(
      (conversation) => {
        const preference =
          preferenceByConversation.get(
            conversation.id,
          );

        const mappedParticipants =
          (
            participantsByConversation.get(
              conversation.id,
            ) ?? []
          ).map(
            (
              participant,
            ): CommunicationParticipant => {
              const profileActor =
                participant.profile_id
                  ? profiles.get(
                      participant.profile_id,
                    )
                  : undefined;

              const organizationActor =
                participant.organization_id
                  ? organizations.get(
                      participant.organization_id,
                    )
                  : undefined;

              const actor =
                profileActor ??
                organizationActor;

              const isCurrentProfile =
                participant.profile_id ===
                userId;

              const isCurrentActor =
                isCurrentProfile ||
                Boolean(
                  participant.organization_id &&
                  representedOrganizationIds.has(
                    participant.organization_id,
                  ),
                );

              return {
                id:
                  participant.id,

                /*
                 * Conservé pour compatibilité du domaine existant.
                 * Pour une organisation, l'identifiant acteur est
                 * également exposé dans organizationId.
                 */
                profileId:
                  participant.profile_id ??
                  participant.organization_id ??
                  "",

                organizationId:
                  participant.organization_id ??
                  undefined,

                actorType:
                  participant.organization_id
                    ? "organization"
                    : "profile",

                isMine:
                  isCurrentActor,

                name:
                  actor?.name ??
                  "Participant",

                avatarUrl:
                  actor?.avatarUrl,

                role:
                  actor?.role ??
                  "fighter",

                participantRole:
                  participantRole(
                    participant.role,
                  ),

                muted:
                  isCurrentProfile &&
                  mutedNow(
                    preference?.muted_until,
                  ),

                blocked: false,

                lastReadAt:
                  isCurrentProfile
                    ? (
                        preference
                          ?.last_read_at ??
                        undefined
                      )
                    : undefined,
              };
            },
          );

        const mappedMessages =
          (
            messagesByConversation.get(
              conversation.id,
            ) ?? []
          ).map(
            (message) =>
              this.mapMessage(
                message,
                userId,
                profiles,
                organizations,
                attachmentsByMessage.get(
                  message.id,
                ) ?? [],
                statusByMessage.get(
                  message.id,
                ) ?? "sent",
              ),
          );

        const fallbackTitle =
          mappedParticipants.find(
            (participant) =>
              !participant.isMine,
          )?.name ??
          (
            conversationKind(
              conversation.conversation_type,
            ) === "group"
              ? "Conversation de groupe"
              : "Conversation"
          );

        return {
          id:
            conversation.id,

          title:
            conversation.title?.trim() ||
            fallbackTitle,

          kind:
            conversationKind(
              conversation.conversation_type,
            ),

          participants:
            mappedParticipants,

          messages:
            mappedMessages,

          lastActivityAt:
            conversation.last_message_at ??
            mappedMessages.at(-1)
              ?.sentAt ??
            conversation.created_at ??
            new Date(0).toISOString(),

          unreadCount:
            preference?.unread_count ??
            0,

          favorite:
            preference?.is_favorite ??
            false,

          muted:
            mutedNow(
              preference?.muted_until,
            ),

          archived:
            preference?.is_archived ??
            false,

          locallyDeleted:
            Boolean(
              preference
                ?.locally_deleted_at,
            ),
        };
      },
    );
  }

  private async ensureConversationPreference(
    conversationId: string,
    profileId: string,
  ): Promise<ConversationPreferenceRow> {
    const {
      error: upsertError,
    } =
      await this.supabase
        .from(
          "conversation_user_preferences",
        )
        .upsert(
          {
            conversation_id:
              conversationId,
            profile_id:
              profileId,
          },
          {
            onConflict:
              "conversation_id,profile_id",
            ignoreDuplicates: true,
          },
        );

    if (upsertError) {
      throw upsertError;
    }

    const {
      data,
      error,
    } =
      await this.supabase
        .from(
          "conversation_user_preferences",
        )
        .select("*")
        .eq(
          "conversation_id",
          conversationId,
        )
        .eq(
          "profile_id",
          profileId,
        )
        .single();

    if (error) {
      throw error;
    }

    return data;
  }

  private async loadMessage(
    messageId: string,
    userId: string,
  ): Promise<CommunicationMessage | null> {
    const {
      data: row,
      error,
    } =
      await this.supabase
        .from("messages")
        .select("*")
        .eq(
          "id",
          messageId,
        )
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!row) {
      return null;
    }

    const profileIds =
      new Set<string>([
        row.sent_by_profile_id,
      ]);

    if (row.sender_profile_id) {
      profileIds.add(
        row.sender_profile_id,
      );
    }

    const organizationIds =
      row.sender_organization_id
        ? [
            row.sender_organization_id,
          ]
        : [];

    const [
      profiles,
      organizations,
      attachments,
      statuses,
    ] =
      await Promise.all([
        this.profileDirectory(
          Array.from(profileIds),
        ),
        this.organizationDirectory(
          organizationIds,
        ),
        this.attachmentDirectory(
          [messageId],
        ),
        this.receiptStatusDirectory(
          [messageId],
        ),
      ]);

    return this.mapMessage(
      row,
      userId,
      profiles,
      organizations,
      attachments.get(
        messageId,
      ) ?? [],
      statuses.get(
        messageId,
      ) ?? "sent",
    );
  }

  async listConversations(
    query = "",
  ): Promise<
    CommunicationConversation[]
  > {
    const userId =
      await this.userId();

    try {
      /*
       * La policy RLS conversations SELECT utilise
       * messaging_can_access_conversation().
       *
       * Il n'est donc pas nécessaire de reproduire
       * la logique d'autorisation côté client.
       * Cela inclut aussi les conversations accessibles
       * par une organisation.
       */
      const {
        data,
        error,
      } =
        await this.supabase
          .from("conversations")
          .select("*")
          .order(
            "last_message_at",
            {
              ascending: false,
              nullsFirst: false,
            },
          );

      if (error) {
        throw error;
      }

      const hydrated =
        await this.hydrateMany(
          data ?? [],
          userId,
        );

      const visible =
        hydrated.filter(
          (conversation) =>
            !conversation.locallyDeleted,
        );

      const normalized =
        query
          .trim()
          .toLocaleLowerCase(
            "fr-FR",
          );

      if (!normalized) {
        return visible;
      }

      return visible.filter(
        (conversation) =>
          conversation.title
            .toLocaleLowerCase(
              "fr-FR",
            )
            .includes(normalized) ||
          conversation.participants.some(
            (participant) =>
              participant.name
                .toLocaleLowerCase(
                  "fr-FR",
                )
                .includes(
                  normalized,
                ),
          ) ||
          conversation.messages.some(
            (message) =>
              message.content
                .toLocaleLowerCase(
                  "fr-FR",
                )
                .includes(
                  normalized,
                ),
          ),
      );
    } catch (reason) {
      throw normalizeBackendError(
        reason,
      );
    }
  }

  async getConversation(
    id: string,
  ): Promise<
    CommunicationConversation | null
  > {
    const userId =
      await this.userId();

    try {
      const {
        data,
        error,
      } =
        await this.supabase
          .from("conversations")
          .select("*")
          .eq("id", id)
          .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      const hydrated =
        await this.hydrateMany(
          [data],
          userId,
        );

      return hydrated[0] ?? null;
    } catch (reason) {
      throw normalizeBackendError(
        reason,
      );
    }
  }

  async searchRecipients(
    query = "",
    limit = 20,
  ): Promise<
    CommunicationRecipient[]
  > {

    try {

      const {
        data,
        error,
      } =
        await this.supabase.rpc(
          "messaging_search_profile_recipients",
          {
            p_query:
              query,
            p_limit:
              limit,
          },
        );


      if (
        error
      ) {

        throw error;
      }


      return (
        data ??
        []
      ).map(
        (
          recipient,
        ) => ({
          actorId:
            recipient.actor_id,

          actorType:
            recipient.actor_type ===
              "organization"
              ? "organization"
              : "profile",

          profileId:
            recipient.profile_id ??
            undefined,

          organizationId:
            recipient.organization_id ??
            undefined,

          handle:
            recipient.handle,

          displayName:
            recipient.display_name,

          avatarUrl:
            recipient.avatar_url ??
            undefined,

          verified:
            recipient.is_verified,
        }),
      );

    } catch (
      reason
    ) {

      throw normalizeBackendError(
        reason,
      );
    }
  }


  async openPrivateConversation(
    actorId: string,
  ): Promise<
    CommunicationConversation
  > {

    try {

      const senderOrganizationId =
        await this.senderOrganizationId();

      const {
        data:
          conversationId,
        error,
      } =
        await this.supabase.rpc(
          "open_or_create_private_conversation",
          {
            p_recipient_actor_id:
              actorId,

            p_sender_organization_id:
              senderOrganizationId,
          },
        );


      if (
        error
      ) {

        throw error;
      }


      if (
        !conversationId
      ) {

        throw new BackendError(
          "NOT_FOUND",
          "La conversation privée est introuvable.",
        );
      }


      const conversation =
        await this.getConversation(
          conversationId,
        );


      if (
        !conversation
      ) {

        throw new BackendError(
          "NOT_FOUND",
          "La conversation privée créée est inaccessible.",
        );
      }


      return conversation;

    } catch (
      reason
    ) {

      throw normalizeBackendError(
        reason,
      );
    }
  }

  async openPrivateConversationForProfile(
    profileId: string,
  ): Promise<CommunicationConversation> {
    try {
      const { data: actor, error } = await this.supabase
        .from("korana_actors")
        .select("id")
        .eq("profile_id", profileId)
        .eq("actor_type", "profile")
        .eq("status", "active")
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!actor) {
        throw new BackendError(
          "NOT_FOUND",
          "Ce profil n’est pas disponible dans Korana.",
        );
      }

      return this.openPrivateConversation(actor.id);
    } catch (reason) {
      throw normalizeBackendError(reason);
    }
  }

  async createConversation(
    title: string,
    kind: ConversationKind,
    _role: CommunicationRole,
  ): Promise<CommunicationConversation> {
    const userId =
      await this.userId();

    try {
      /*
       * Le rôle métier n'est plus stocké dans
       * conversation_participants.role.
       *
       * role décrit désormais strictement la fonction
       * dans la conversation : owner/member/moderator.
       * Le rôle métier public vient de profiles/roles.
       */
      void _role;

      const now =
        new Date().toISOString();

      const {
        data: conversation,
        error: conversationError,
      } =
        await this.supabase
          .from("conversations")
          .insert({
            title,
            conversation_type:
              kind,
            created_by:
              userId,
            last_message_at:
              now,
          })
          .select("*")
          .single();

      if (conversationError) {
        throw conversationError;
      }

      const {
        error: participantError,
      } =
        await this.supabase
          .from(
            "conversation_participants",
          )
          .insert({
            conversation_id:
              conversation.id,
            profile_id:
              userId,
            organization_id:
              null,
            role:
              "owner",
          });

      if (participantError) {
        throw participantError;
      }

      const {
        error: preferenceError,
      } =
        await this.supabase
          .from(
            "conversation_user_preferences",
          )
          .upsert(
            {
              conversation_id:
                conversation.id,
              profile_id:
                userId,
              unread_count:
                0,
              last_read_at:
                now,
            },
            {
              onConflict:
                "conversation_id,profile_id",
            },
          );

      if (preferenceError) {
        throw preferenceError;
      }

      const result =
        await this.getConversation(
          conversation.id,
        );

      if (!result) {
        throw new BackendError(
          "NOT_FOUND",
          "La conversation créée est introuvable.",
        );
      }

      return result;
    } catch (reason) {
      throw normalizeBackendError(
        reason,
      );
    }
  }

  async updateConversation(
    id: string,
    action:
      CommunicationConversationAction,
  ): Promise<
    CommunicationConversation | null
  > {
    const userId =
      await this.userId();

    try {
      const current =
        await this.ensureConversationPreference(
          id,
          userId,
        );

      const now =
        new Date().toISOString();

      const patch:
        ConversationPreferenceUpdate = {
          updated_at:
            now,
        };

      switch (action) {
        case "archive":
          patch.is_archived =
            !current.is_archived;
          break;

        case "favorite":
          patch.is_favorite =
            !current.is_favorite;
          break;

        case "mute":
          patch.muted_until =
            mutedNow(
              current.muted_until,
            )
              ? null
              : "9999-12-31T23:59:59.999Z";
          break;

        case "delete_local":
          patch.locally_deleted_at =
            now;
          break;
      }

      const {
        error,
      } =
        await this.supabase
          .from(
            "conversation_user_preferences",
          )
          .update(patch)
          .eq(
            "conversation_id",
            id,
          )
          .eq(
            "profile_id",
            userId,
          );

      if (error) {
        throw error;
      }

      return this.getConversation(
        id,
      );
    } catch (reason) {
      throw normalizeBackendError(
        reason,
      );
    }
  }

  async sendMessage(
    conversationId: string,
    content: string,
    replyToId?: string,
    attachments:
      CommunicationAttachmentUpload[] = [],
  ): Promise<CommunicationMessage> {
    const userId =
      await this.userId();

    const uploadedPaths:
      string[] = [];

    try {
      const senderOrganizationId =
        await this.senderOrganizationId();

      const attachmentPayload:
        Array<{
          path: string;
          name: string;
          mimeType: string;
          size: number;
        }> = [];

      for (const attachment of attachments) {
        const validationError =
          validateAttachmentFile(
            attachment.file,
          );

        if (validationError) {
          throw new BackendError(
            "VALIDATION_ERROR",
            validationError,
          );
        }

        const safeName =
          sanitizeAttachmentName(
            attachment.name,
          );

        const path =
          `${conversationId}/${userId}/${crypto.randomUUID()}-${safeName}`;

        const {
          error: uploadError,
        } =
          await this.supabase.storage
            .from(
              MESSAGE_ATTACHMENT_BUCKET,
            )
            .upload(
              path,
              attachment.file,
              {
                cacheControl:
                  "3600",
                contentType:
                  attachment.mimeType,
                upsert:
                  false,
              },
            );

        if (uploadError) {
          throw uploadError;
        }

        uploadedPaths.push(
          path,
        );

        attachmentPayload.push({
          path,
          name:
            attachment.name,
          mimeType:
            attachment.mimeType,
          size:
            attachment.size,
        });
      }

      const rpcResult =
        await this.supabase.rpc(
          "send_message",
          {
            p_conversation_id:
              conversationId,
            p_content:
              content,
            p_message_type:
              "text",
            p_reply_to_id:
              replyToId,
            p_attachments:
              attachmentPayload,
            p_sender_organization_id:
              senderOrganizationId,
          },
        );

      if (rpcResult.error) {
        throw rpcResult.error;
      }

      if (!rpcResult.data) {
        throw new BackendError(
          "NOT_FOUND",
          "Le message n'a pas été créé.",
        );
      }

      const message =
        await this.loadMessage(
          rpcResult.data,
          userId,
        );

      if (!message) {
        throw new BackendError(
          "NOT_FOUND",
          "Le message créé est introuvable.",
        );
      }

      return message;
    } catch (reason) {
      if (uploadedPaths.length) {
        await this.supabase.storage
          .from(
            MESSAGE_ATTACHMENT_BUCKET,
          )
          .remove(
            uploadedPaths,
          );
      }

      throw normalizeBackendError(
        reason,
      );
    }
  }

  async editMessage(
    messageId: string,
    content: string,
  ): Promise<
    CommunicationMessage | null
  > {
    const userId =
      await this.userId();

    try {
      const {
        data,
        error,
      } =
        await this.supabase.rpc(
          "edit_message",
          {
            p_message_id:
              messageId,
            p_content:
              content,
          },
        );

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      return this.loadMessage(
        data,
        userId,
      );
    } catch (reason) {
      throw normalizeBackendError(
        reason,
      );
    }
  }

  async deleteMessage(
    messageId: string,
  ): Promise<
    CommunicationMessage | null
  > {
    const userId =
      await this.userId();

    try {
      const {
        data: attachmentRows,
        error: attachmentError,
      } =
        await this.supabase
          .from("message_attachments")
          .select("file_url")
          .eq("message_id", messageId);

      if (attachmentError) {
        throw attachmentError;
      }

      const {
        data,
        error,
      } =
        await this.supabase.rpc(
          "delete_message",
          {
            p_message_id:
              messageId,
          },
        );

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      const storagePaths =
        (attachmentRows ?? [])
          .map(
            (attachment) =>
              attachment.file_url,
          );

      if (storagePaths.length) {
        const {
          error: removeError,
        } =
          await this.supabase.storage
            .from(
              MESSAGE_ATTACHMENT_BUCKET,
            )
            .remove(
              storagePaths,
            );

        if (removeError) {
          throw removeError;
        }
      }

      return this.loadMessage(
        data,
        userId,
      );
    } catch (reason) {
      throw normalizeBackendError(
        reason,
      );
    }
  }

  async markConversationRead(
    conversationId: string,
  ): Promise<void> {
    try {
      const {
        error,
      } =
        await this.supabase.rpc(
          "mark_conversation_read",
          {
            p_conversation_id:
              conversationId,
          },
        );

      if (error) {
        throw error;
      }
    } catch (reason) {
      throw normalizeBackendError(
        reason,
      );
    }
  }

  async listFightProposals(): Promise<
    FightProposal[]
  > {
    try {
      const {
        data,
        error,
      } =
        await this.supabase
          .from("fight_proposals")
          .select("*")
          .order(
            "created_at",
            {
              ascending: false,
            },
          );

      if (error) {
        throw error;
      }

      return (data ?? []).map(
        (item) => ({
          id:
            item.id,

          fighterId:
            item.fighter_id ?? "",

          fighterName:
            "Combattant",

          recipientId:
            "",

          recipientName:
            "Destinataire",

          eventName:
            item.event_name ?? "",

          category:
            item.weight_category ??
            "",

          weightKg:
            Number.parseFloat(
              item.opponent_weight ??
              "0",
            ) || 0,

          proposedDate:
            item.event_date ?? "",

          purseAmount:
            item.purse_amount ??
            undefined,

          terms:
            item.rules ?? "",

          status:
            proposalStatus(
              item.status,
            ),

          history:
            item.created_at
              ? [
                  "Créée — " +
                    item.created_at,
                ]
              : [],
        }),
      );
    } catch (reason) {
      throw normalizeBackendError(
        reason,
      );
    }
  }

  async decideFightProposal(
    id: string,
    status: Extract<
      ProposalStatus,
      "accepted" | "refused" | "countered"
    >,
  ): Promise<FightProposal | null> {
    try {
      const {
        error,
      } =
        await this.supabase
          .from("fight_proposals")
          .update({
            status,
            responded_at:
              new Date().toISOString(),
          })
          .eq("id", id);

      if (error) {
        throw error;
      }

      return (
        (
          await this.listFightProposals()
        ).find(
          (item) =>
            item.id === id,
        ) ?? null
      );
    } catch (reason) {
      throw normalizeBackendError(
        reason,
      );
    }
  }

  async listSponsorOffers(): Promise<
    SponsorOffer[]
  > {
    try {
      const {
        data,
        error,
      } =
        await this.supabase
          .from("sponsor_offers")
          .select("*")
          .order(
            "created_at",
            {
              ascending: false,
            },
          );

      if (error) {
        throw error;
      }

      return (data ?? []).map(
        (item) => ({
          id:
            item.id,

          sponsorId:
            item.sponsor_id ?? "",

          sponsorName:
            "Sponsor",

          recipientId:
            "",

          recipientName:
            "Destinataire",

          amount:
            item.amount,

          currency:
            item.currency ??
            "MGA",

          durationMonths:
            item.duration_months ??
            0,

          deliverables:
            Array.isArray(
              item.deliverables,
            )
              ? item.deliverables.filter(
                  (
                    value,
                  ): value is string =>
                    typeof value ===
                    "string",
                )
              : [],

          targetType:
            "fighter",

          targetName:
            "Bénéficiaire",

          status:
            proposalStatus(
              item.status,
            ),

          history:
            item.created_at
              ? [
                  "Créée — " +
                    item.created_at,
                ]
              : [],
        }),
      );
    } catch (reason) {
      throw normalizeBackendError(
        reason,
      );
    }
  }

  async decideSponsorOffer(
    id: string,
    status: Extract<
      ProposalStatus,
      "accepted" | "refused" | "countered"
    >,
  ): Promise<SponsorOffer | null> {
    try {
      const {
        error,
      } =
        await this.supabase
          .from("sponsor_offers")
          .update({
            status,
            responded_at:
              new Date().toISOString(),
          })
          .eq("id", id);

      if (error) {
        throw error;
      }

      return (
        (
          await this.listSponsorOffers()
        ).find(
          (item) =>
            item.id === id,
        ) ?? null
      );
    } catch (reason) {
      throw normalizeBackendError(
        reason,
      );
    }
  }

  async listNotifications(
    category?: NotificationCategory,
  ): Promise<
    CommunicationNotification[]
  > {
    const userId =
      await this.userId();

    try {
      let query =
        this.supabase
          .from(
            "system_notifications",
          )
          .select("*")
          .eq(
            "user_id",
            userId,
          );

      if (category) {
        query =
          query.eq(
            "notification_type",
            category,
          );
      }

      const {
        data,
        error,
      } =
        await query.order(
          "created_at",
          {
            ascending: false,
          },
        );

      if (error) {
        throw error;
      }

      return (data ?? []).map(
        (item) => ({
          id:
            item.id,

          recipientId:
            item.user_id,

          category:
            notificationCategory(
              item.notification_type,
            ),

          title:
            item.title,

          content:
            item.content ?? "",

          priority:
            "normal",

          actionUrl:
            item.action_url ??
            undefined,

          source:
            item.user_type ??
            "system",

          createdAt:
            item.created_at ??
            new Date(0).toISOString(),

          readAt:
            item.is_read
              ? (
                  item.created_at ??
                  new Date()
                    .toISOString()
                )
              : undefined,
        }),
      );
    } catch (reason) {
      throw normalizeBackendError(
        reason,
      );
    }
  }

  async markNotificationRead(
    id: string,
  ): Promise<void> {
    const userId =
      await this.userId();

    try {
      const {
        error,
      } =
        await this.supabase
          .from(
            "system_notifications",
          )
          .update({
            is_read: true,
          })
          .eq("id", id)
          .eq(
            "user_id",
            userId,
          );

      if (error) {
        throw error;
      }
    } catch (reason) {
      throw normalizeBackendError(
        reason,
      );
    }
  }

  async markAllNotificationsRead():
    Promise<void> {
    const userId =
      await this.userId();

    try {
      const {
        error,
      } =
        await this.supabase
          .from(
            "system_notifications",
          )
          .update({
            is_read: true,
          })
          .eq(
            "user_id",
            userId,
          );

      if (error) {
        throw error;
      }
    } catch (reason) {
      throw normalizeBackendError(
        reason,
      );
    }
  }

  async deleteNotification(
    id: string,
  ): Promise<void> {
    const userId =
      await this.userId();

    try {
      const {
        error,
      } =
        await this.supabase
          .from(
            "system_notifications",
          )
          .delete()
          .eq("id", id)
          .eq(
            "user_id",
            userId,
          );

      if (error) {
        throw error;
      }
    } catch (reason) {
      throw normalizeBackendError(
        reason,
      );
    }
  }

  async getPreferences(): Promise<
    NotificationPreferences
  > {
    const userId =
      await this.userId();

    try {
      const {
        data,
        error,
      } =
        await this.supabase
          .from(
            "notification_preferences",
          )
          .select("*")
          .eq(
            "profile_id",
            userId,
          )
          .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return {
          profileId:
            userId,

          inApp:
            true,

          emailPrepared:
            true,

          pushPrepared:
            false,

          enabledCategories:
            Array.from(
              categories,
            ),

          frequency:
            "instant",

          byRole:
            {},
        };
      }

      const quietStart =
        normalizeTime(
          data.quiet_hours_start,
        );

      const quietEnd =
        normalizeTime(
          data.quiet_hours_end,
        );

      return {
        profileId:
          data.profile_id,

        inApp:
          data.in_app_enabled,

        emailPrepared:
          data.email_enabled,

        pushPrepared:
          data.push_enabled,

        enabledCategories:
          data.enabled_categories.filter(
            (
              item,
            ): item is NotificationCategory =>
              categories.has(
                item as NotificationCategory,
              ),
          ),

        frequency:
          preferenceFrequency(
            data.frequency,
          ),

        mutedUntil:
          data.muted_until ??
          undefined,

        quietHours:
          quietStart &&
          quietEnd
            ? {
                start:
                  quietStart,
                end:
                  quietEnd,
              }
            : undefined,

        byRole:
          parseRoleOverrides(
            data.role_overrides,
          ),
      };
    } catch (reason) {
      throw normalizeBackendError(
        reason,
      );
    }
  }

  async savePreferences(
    value: NotificationPreferences,
  ): Promise<
    NotificationPreferences
  > {
    const userId =
      await this.userId();

    try {
      const roleOverrides =
        value.byRole as unknown as
          NotificationPreferenceInsert["role_overrides"];

      const payload:
        NotificationPreferenceInsert = {
          profile_id:
            userId,

          in_app_enabled:
            value.inApp,

          email_enabled:
            value.emailPrepared,

          push_enabled:
            value.pushPrepared,

          enabled_categories:
            value.enabledCategories,

          frequency:
            value.frequency,

          muted_until:
            value.mutedUntil ??
            null,

          quiet_hours_start:
            value.quietHours?.start ??
            null,

          quiet_hours_end:
            value.quietHours?.end ??
            null,

          role_overrides:
            roleOverrides,

          updated_at:
            new Date().toISOString(),
        };

      const {
        error,
      } =
        await this.supabase
          .from(
            "notification_preferences",
          )
          .upsert(
            payload,
            {
              onConflict:
                "profile_id",
            },
          );

      if (error) {
        throw error;
      }

      return this.getPreferences();
    } catch (reason) {
      throw normalizeBackendError(
        reason,
      );
    }
  }
}
