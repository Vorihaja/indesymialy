"use client";
import {
  ModernMessagingWorkspace,
} from "../components/ModernMessagingWorkspace";

import { useState, type ReactNode } from "react";

import {
  NotificationCenter,
  PreferencesForm,
  ProposalList,
} from "../components/CommunicationViews";
import {
  useConversations,
  useNotificationPreferences,
  useNotifications,
  useProposals,
} from "../hooks/useCommunication";
import type { CommunicationRole, NotificationCategory } from "../types";

const controlClass =
  "h-10 w-full border border-[#343840] bg-[#0e0f12] px-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-[#2588ff]";
const loadingClass = "border border-[#303238] bg-[#151619] p-6 text-sm text-zinc-500";

const notificationCategories: Array<{ value: NotificationCategory; label: string }> = [
  { value: "message", label: "Messages" },
  { value: "fight_proposal", label: "Propositions de combat" },
  { value: "sponsoring", label: "Sponsoring" },
  { value: "event", label: "Événements" },
  { value: "fight_live", label: "Combat en direct" },
  { value: "role", label: "Rôles" },
  { value: "moderation", label: "Modération" },
  { value: "marketplace", label: "Marketplace" },
  { value: "club", label: "Clubs" },
  { value: "system", label: "Système" },
  { value: "security", label: "Sécurité" },
];

function PublicCommunicationFrame({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#090a0c] text-zinc-100">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-7 sm:px-6">{children}</div>
    </div>
  );
}

export function MessagingFeature({
  conversationId,
  mode = "workspace",
  role = "fan",
  basePath = "/messages",
  embedded = false,
}: {
  conversationId?: string;

  mode?:
    | "workspace"
    | "new"
    | "search";

  role?:
    CommunicationRole;

  basePath?: string;

  embedded?: boolean;
}) {

  const [
    query,
    setQuery,
  ] =
    useState(
      "",
    );


  /*
   * La recherche visuelle est maintenant disponible
   * directement dans le workspace principal.
   *
   * On charge donc les conversations une seule fois et
   * ModernMessagingWorkspace filtre localement la liste.
   */
  const state =
    useConversations(
      "",
      conversationId,
      role,
    );

  const standalone =
    basePath ===
      "/messages" &&
    !embedded;


  if (
    state.loading
  ) {

    return (
      <div
        className={
          standalone
            ? "min-h-[calc(100dvh-90px)] bg-[#f3f4f6] px-3 py-4 sm:px-5 sm:py-6"
            : "communication-feature-frame w-full"
        }
      >
        <div
          className={`communication-feature-loading mx-auto grid min-h-[620px] w-full max-w-[1480px] overflow-hidden rounded-[28px] border md:grid-cols-[360px_minmax(0,1fr)] ${
            embedded
              ? "border-[#27303a] bg-[#0f141a] shadow-[0_24px_80px_rgba(0,0,0,0.24)]"
              : "border-[#e2e5e9] bg-white shadow-[0_24px_80px_rgba(17,24,39,0.08)]"
          }`}
        >
          <div
            className={`border-r p-5 ${
              embedded
                ? "border-[#252d36] bg-[#0b1015]"
                : "border-[#e8eaed] bg-[#fbfbfc]"
            }`}
          >
            <div
              className={`h-7 w-36 animate-pulse rounded-lg ${embedded ? "bg-[#1b222a]" : "bg-[#eceef1]"}`}
            />

            <div
              className={`mt-5 h-11 animate-pulse rounded-[14px] ${embedded ? "bg-[#171e25]" : "bg-[#f0f1f3]"}`}
            />

            <div
              className="mt-6 space-y-3"
            >
              {[0, 1, 2, 3, 4].map(
                (
                  item,
                ) => (
                  <div
                    key={
                      item
                    }
                    className="flex items-center gap-3"
                  >
                    <div
                      className={`h-12 w-12 animate-pulse rounded-full ${embedded ? "bg-[#1b222a]" : "bg-[#eceef1]"}`}
                    />

                    <div
                      className="flex-1"
                    >
                      <div
                        className={`h-3 w-32 animate-pulse rounded ${embedded ? "bg-[#1b222a]" : "bg-[#eceef1]"}`}
                      />

                      <div
                        className={`mt-2 h-2.5 w-48 animate-pulse rounded ${embedded ? "bg-[#171e25]" : "bg-[#f0f1f3]"}`}
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>

          <div
            className={`hidden place-items-center md:grid ${embedded ? "bg-[#0e1318]" : "bg-[#f5f6f8]"}`}
          >
            <div
              className={`h-16 w-16 animate-pulse rounded-[22px] ${
                embedded
                  ? "bg-[#1c232b] shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
                  : "bg-white shadow-sm"
              }`}
            />
          </div>
        </div>
      </div>
    );
  }


  if (
    state.error
  ) {

    return (
      <div
        className={
          standalone
            ? "min-h-[calc(100dvh-90px)] bg-[#f3f4f6] px-4 py-8"
            : "communication-feature-frame w-full"
        }
      >
        <div
          className="mx-auto max-w-xl rounded-[20px] border border-[#ffd2d8] bg-white p-6 text-center shadow-sm"
        >
          <div
            className="mx-auto h-1 w-14 rounded-full bg-[#e31b36]"
          />

          <h2
            className="mt-5 text-[16px] font-black text-[#24272d]"
          >
            Messagerie indisponible
          </h2>

          <p
            className="mt-2 text-[12px] leading-6 text-[#bc1f34]"
          >
            {state.error}
          </p>
        </div>
      </div>
    );
  }


  return (
    <div
      className={
        standalone
          ? "min-h-[calc(100dvh-90px)] bg-[#f3f4f6] px-2 py-3 sm:px-5 sm:py-5"
          : "communication-feature-frame w-full"
      }
    >
      <div
        className="communication-feature-shell mx-auto w-full max-w-[1480px]"
      >
        <ModernMessagingWorkspace
          items={
            state.conversations
          }
          active={
            state.active
          }
          query={
            query
          }
          onQueryChange={
            setQuery
          }
          onSelect={
            state.select
          }
          onSend={
            state.send
          }
          onAction={
            state.action
          }
          onSearchRecipients={
            state.searchRecipients
          }
          onOpenPrivate={
            state.openPrivate
          }
          basePath={
            basePath
          }
          currentProfileId={
            state.realtimeProfileId
          }
          realtimeConnected={
            state.realtimeConnected
          }
          realtimeStatus={
            state.realtimeStatus
          }
          embedded={
            embedded
          }
          showThreadOnMobile={
            Boolean(
              conversationId,
            )
          }
          initialCreateOpen={
            mode ===
              "new"
          }
          searchAutoFocus={
            mode ===
              "search"
          }
        />
      </div>
    </div>
  );
}

export function ProposalFeature({
  kind,
  actionableOnly = false,
}: {
  kind: "fight" | "sponsor";
  actionableOnly?: boolean;
}) {
  const { items, loading, decide } = useProposals(kind);
  const visibleItems = actionableOnly
    ? items.filter((item) => item.status === "pending")
    : items;

  if (loading) {
    return <p className={loadingClass}>Chargement…</p>;
  }

  return (
    <ProposalList
      kind={kind}
      items={visibleItems}
      onDecision={(id, status) => {
        void decide(id, status);
      }}
    />
  );
}

export function NotificationsFeature() {
  const [category, setCategory] = useState<NotificationCategory | undefined>();
  const { items, loading, read, readAll, remove } = useNotifications(category);

  if (loading) {
    return (
      <PublicCommunicationFrame>
        <p className={loadingClass}>Chargement des notifications…</p>
      </PublicCommunicationFrame>
    );
  }

  return (
    <PublicCommunicationFrame>
      <div className="space-y-4">
        <label className="grid max-w-xs gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
          Catégorie
          <select
            aria-label="Filtrer les notifications"
            value={category ?? ""}
            onChange={(event) =>
              setCategory(event.target.value ? (event.target.value as NotificationCategory) : undefined)
            }
            className={controlClass}
          >
            <option value="">Toutes les catégories</option>
            {notificationCategories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <NotificationCenter
          items={items}
          onRead={(id) => {
            void read(id);
          }}
          onReadAll={() => {
            void readAll();
          }}
          onRemove={(id) => {
            void remove(id);
          }}
        />
      </div>
    </PublicCommunicationFrame>
  );
}

export function NotificationPreferencesFeature() {
  const { preferences, loading, save } = useNotificationPreferences();

  if (loading || !preferences) {
    return (
      <PublicCommunicationFrame>
        <p className={loadingClass}>Chargement des préférences…</p>
      </PublicCommunicationFrame>
    );
  }

  return (
    <PublicCommunicationFrame>
      <PreferencesForm
        value={preferences}
        onSave={(value) => {
          void save(value);
        }}
      />
    </PublicCommunicationFrame>
  );
}

export function NotificationUnreadBadge() {
  const { unread } = useNotifications();

  return unread > 0 ? (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-black text-white">
      {unread}
    </span>
  ) : null;
}
