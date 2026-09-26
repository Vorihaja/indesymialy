import assert from "node:assert/strict";
import {
  readFileSync,
} from "node:fs";
import test from "node:test";

import {
  MESSAGE_ATTACHMENT_MAX_BYTES,
  sanitizeAttachmentName,
  validateAttachmentFile,
} from "./attachments.ts";

const read = (relativePath) =>
  readFileSync(
    new URL(relativePath, import.meta.url),
    "utf8",
  );

const foundation =
  read(
    "../../supabase/migrations/202608050020_communication.sql",
  );

const authority =
  read(
    "../../supabase/migrations/20260923070318_complete_messaging_authority.sql",
  );

const repository =
  read(
    "./repositories/communication-supabase.repository.ts",
  );

const workspace =
  read(
    "./components/ModernMessagingWorkspace.tsx",
  );

const recipientPicker =
  read(
    "./components/RecipientPicker.tsx",
  );

const contextualMessageAction =
  read(
    "./components/ContextualMessageAction.tsx",
  );

const contextualMessageHook =
  read(
    "./hooks/useContextualMessage.ts",
  );

const communicationService =
  read(
    "./services/communication.service.ts",
  );

const communicationUseCase =
  read(
    "./use-cases/manage-communication.use-case.ts",
  );

test(
  "attachment validation accepts supported files and rejects invalid files",
  () => {
    assert.equal(
      validateAttachmentFile({
        name: "document.pdf",
        size: 1024,
        type: "application/pdf",
      }),
      null,
    );

    assert.match(
      validateAttachmentFile({
        name: "programme.exe",
        size: 1024,
        type: "application/x-msdownload",
      }) ?? "",
      /format non pris en charge/,
    );

    assert.match(
      validateAttachmentFile({
        name: "video.mp4",
        size:
          MESSAGE_ATTACHMENT_MAX_BYTES +
          1,
        type: "video/mp4",
      }) ?? "",
      /limite de 6 Mo/,
    );
  },
);

test(
  "attachment names are safe for deterministic Storage paths",
  () => {
    assert.equal(
      sanitizeAttachmentName(
        "  Résultat final (1).pdf  ",
      ),
      "Resultat-final-1-.pdf",
    );

    assert.doesNotMatch(
      sanitizeAttachmentName(
        "../../secret?.txt",
      ),
      /\.\.|[\\/?\s]/,
    );
  },
);

test(
  "a fresh migration replay owns every core messaging table",
  () => {
    for (const table of [
      "conversations",
      "conversation_participants",
      "conversation_user_preferences",
      "messages",
      "message_attachments",
      "message_reads",
    ]) {
      assert.match(
        foundation,
        new RegExp(
          `create table public\\.${table}\\s*\\(`,
          "i",
        ),
        `Missing table authority: ${table}`,
      );
    }
  },
);

test(
  "runtime messaging RPC and private Storage authority are reproducible",
  () => {
    for (const functionName of [
      "messaging_can_represent_organization",
      "messaging_can_access_conversation",
      "messaging_can_manage_conversation",
      "messaging_can_access_message",
      "messaging_is_message_operator",
      "send_message",
      "edit_message",
      "delete_message",
      "mark_conversation_read",
      "messaging_search_profile_recipients",
      "open_or_create_private_conversation",
    ]) {
      assert.match(
        authority,
        new RegExp(
          `(create|create or replace) function public\\.${functionName}\\s*\\(`,
          "i",
        ),
        `Missing RPC authority: ${functionName}`,
      );
    }

    assert.match(
      authority,
      /'message-attachments',[\s\S]*?false,[\s\S]*?6291456/,
    );
    assert.match(
      authority,
      /message_attachments_storage_select/,
    );
  },
);

test(
  "contextual profile messaging resolves the Korana actor before opening",
  () => {
    assert.match(
      repository,
      /openPrivateConversationForProfile\([\s\S]*?from\("korana_actors"\)[\s\S]*?select\("id"\)[\s\S]*?eq\("profile_id",\s*profileId\)[\s\S]*?eq\("actor_type",\s*"profile"\)[\s\S]*?eq\("status",\s*"active"\)[\s\S]*?this\.openPrivateConversation\(actor\.id\)/,
    );
    assert.doesNotMatch(
      repository,
      /p_recipient_actor_id:\s*profileId/,
    );
    assert.match(
      communicationService,
      /openPrivateConversationForProfile\([\s\S]*?repository\.openPrivateConversationForProfile\(/,
    );
    assert.match(
      communicationUseCase,
      /openPrivateConversationForProfile\([\s\S]*?service\.openPrivateConversationForProfile\(/,
    );
    assert.match(
      contextualMessageHook,
      /openPrivateConversationForProfile\([\s\S]*?router\.push\(\s*`/,
    );
    assert.match(
      contextualMessageHook,
      /\/korana\/messages\/\$\{encodeURIComponent\(conversation\.id\)\}/,
    );
    assert.match(
      contextualMessageAction,
      /useContextualMessage/,
    );
    assert.doesNotMatch(
      contextualMessageAction,
      /\.from\(|\.rpc\(/,
    );
  },
);

test(
  "repository performs real upload, signed download, metadata RPC, and cleanup",
  () => {
    assert.match(
      repository,
      /\.upload\(/,
    );
    assert.match(
      repository,
      /\.createSignedUrl\(/,
    );
    assert.match(
      repository,
      /p_attachments:/,
    );
    assert.match(
      repository,
      /uploadedPaths[\s\S]*?\.remove\(/,
    );
    assert.doesNotMatch(
      repository,
      /storageNotImplemented/,
    );
  },
);

test(
  "workspace exposes real multiple selection and renders persisted attachments",
  () => {
    assert.match(
      workspace,
      /type="file"/,
    );
    assert.match(
      workspace,
      /multiple/,
    );
    assert.match(
      workspace,
      /message\.attachments\.map/,
    );
    assert.doesNotMatch(
      workspace,
      /prochain lot/i,
    );
  },
);

test(
  "organization actors are searchable and no longer explicitly blocked",
  () => {
    assert.match(
      authority,
      /ka\.actor_type/,
    );
    assert.match(
      authority,
      /p_sender_organization_id/,
    );
    assert.doesNotMatch(
      authority,
      /ORGANIZATION_MESSAGING_NOT_AVAILABLE_YET/,
    );
    assert.doesNotMatch(
      recipientPicker,
      /lot dédié/i,
    );
  },
);
