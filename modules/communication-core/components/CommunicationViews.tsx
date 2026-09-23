"use client";

import Link from "next/link";
import { useState } from "react";

import {
  useIndesyDialog,
} from "@/components/ui/indesy-dialog";

import type {
  CommunicationConversation,
  CommunicationNotification,
  CommunicationRole,
  FightProposal,
  MessageStatus,
  NotificationCategory,
  NotificationPreferences,
  ProposalStatus,
  SponsorOffer,
} from "../types";

const roleLabels: Record<CommunicationRole, string> = {
  fighter: "Combattant",
  coach: "Coach",
  club: "Club",
  organizer: "Organisateur",
  official: "Officiel",
  referee: "Arbitre",
  judge: "Juge",
  sponsor: "Sponsor",
  seller: "Vendeur",
  federation: "Fédération",
  league: "Ligue",
  fan: "Fan",
};

const messageStatusLabels: Record<MessageStatus, string> = {
  sending: "Envoi…",
  sent: "Envoyé",
  delivered: "Distribué",
  read: "Lu",
};

const categoryLabels: Record<NotificationCategory, string> = {
  message: "Message",
  fight_proposal: "Proposition de combat",
  sponsoring: "Sponsoring",
  event: "Événement",
  fight_live: "Combat en direct",
  role: "Rôle",
  moderation: "Modération",
  marketplace: "Marketplace",
  club: "Club",
  system: "Système",
  security: "Sécurité",
};

const controlClass =
  "h-10 w-full border border-[#343840] bg-[#0e0f12] px-3 text-sm text-zinc-100 outline-none transition-colors focus:border-[#2588ff]";

export function ConversationList({
  items,
  activeId,
  onSelect,
  basePath = "/messages",
}: {
  items: CommunicationConversation[];
  activeId?: string;
  onSelect?: (item: CommunicationConversation) => void;
  basePath?: string;
}) {
  return (
    <aside className="border-b border-[#303238] md:border-r md:border-b-0">
      <div className="border-b border-[#303238] bg-[#101114] p-3">
        <h2 className="text-xs font-black uppercase tracking-[0.08em]">Conversations</h2>
        <p className="mt-1 text-[10px] text-zinc-500">
          {items.reduce((sum, item) => sum + item.unreadCount, 0)} message(s) non lu(s)
        </p>
      </div>
      {items.length === 0 ? (
        <p className="p-5 text-xs text-zinc-500">Aucune conversation.</p>
      ) : (
        items.map((item) => (
          <Link
            href={basePath + "/" + item.id}
            onClick={() => onSelect?.(item)}
            key={item.id}
            className={"block border-b border-[#303238] border-l-2 p-3 transition-colors " + (activeId === item.id ? "border-l-[#2588ff] bg-[#087cff]/5" : "border-l-transparent hover:bg-white/[0.025]")}
          >
            <div className="flex justify-between gap-2">
              <strong className="truncate text-xs">{item.title}</strong>
              {item.unreadCount > 0 && (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#087cff] px-1.5 text-[9px] font-bold text-white">
                  {item.unreadCount}
                </span>
              )}
            </div>
            <p className="mt-1 truncate text-[10px] text-zinc-500">
              {item.messages.at(-1)?.content ?? "Nouvelle conversation"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-[8px] uppercase tracking-[0.08em] text-zinc-600">
              <span>{item.kind === "group" ? "Groupe" : "Privée"}</span>
              {item.favorite && <span>Favorite</span>}
              {item.muted && <span>En sourdine</span>}
              {item.archived && <span>Archivée</span>}
            </div>
          </Link>
        ))
      )}
    </aside>
  );
}

export function ConversationPanel({
  conversation,
  onSend,
  onAction,
}: {
  conversation: CommunicationConversation | null;
  onSend: (content: string, replyToId?: string) => Promise<void>;
  onAction: (id: string, action: "archive" | "delete_local" | "favorite" | "mute") => Promise<void>;
}) {
  const dialog = useIndesyDialog();
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | undefined>();

  if (!conversation) {
    return (
      <section className="grid min-h-[420px] place-items-center bg-[#121316] p-8 text-xs text-zinc-500">
        Sélectionnez une conversation.
      </section>
    );
  }

  const actions = [
    ["favorite", "Favorite"],
    ["mute", "Sourdine"],
    ["archive", "Archiver"],
    ["delete_local", "Retirer"],
  ] as const;

  return (
    <section className="flex min-h-[600px] min-w-0 flex-col bg-[#121316]">
      <header className="flex flex-wrap justify-between gap-3 border-b border-[#303238] bg-[#151619] p-3">
        <div>
          <h1 className="text-sm font-black">{conversation.title}</h1>
          <p className="mt-1 text-[10px] text-zinc-500">
            {conversation.participants
              .map((item) => item.name + " · " + roleLabels[item.role])
              .join(", ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {actions.map(([action, label]) => (
            <button
              type="button"
              key={action}
              onClick={() => {
                void onAction(conversation.id, action);
              }}
              className="h-7 border border-[#343840] px-2 text-[9px] font-semibold text-zinc-400 hover:border-[#2588ff] hover:text-zinc-100"
            >
              {label}
            </button>
          ))}
        </div>
      </header>
      <div className="flex-1 space-y-2 overflow-y-auto p-3 sm:p-4">
        {conversation.messages.map((message) => {
          const mine = message.isMine ?? message.authorId === "profile-current";
          return (
            <article
              key={message.id}
              className={"max-w-xl border p-3 " + (mine ? "ml-auto border-[#2588ff]/50 bg-[#087cff]/10" : "border-[#303238] bg-[#181a1e]")}
            >
              <div className="flex justify-between gap-3 text-[9px]">
                <strong>{message.authorName}</strong>
                <span className={mine ? "text-blue-300" : "text-zinc-500"}>
                  {messageStatusLabels[message.status]}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-zinc-200">{message.content}</p>
              {message.replyToId && (
                <p className="mt-2 text-[9px] text-zinc-500">Réponse au message {message.replyToId}</p>
              )}
              {message.attachments.map((attachment) => (
                <div key={attachment.id} className="mt-2 border border-current/20 bg-black/10 p-2 text-[9px]">
                  {attachment.kind === "image"
                    ? "Image"
                    : attachment.kind === "video"
                      ? "Vidéo"
                      : attachment.kind === "document"
                        ? "Document"
                        : "Fichier"}{" "}
                  · {attachment.name} · {Math.ceil(attachment.size / 1024)} Ko
                </div>
              ))}
              <button
                type="button"
                className="mt-2 text-[9px] font-semibold text-[#3d92ff] hover:text-blue-300"
                onClick={() => setReplyTo(message.id)}
              >
                Répondre
              </button>
            </article>
          );
        })}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!content.trim()) return;
          void onSend(content, replyTo).then(() => {
            setContent("");
            setReplyTo(undefined);
          });
        }}
        className="border-t border-[#303238] bg-[#151619] p-3"
      >
        {replyTo && (
          <p className="mb-2 text-[9px] text-zinc-500">
            Réponse au message {replyTo}{" "}
            <button
              type="button"
              className="font-semibold text-[#3d92ff]"
              onClick={() => setReplyTo(undefined)}
            >
              Annuler
            </button>
          </p>
        )}
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <label className="inline-flex h-10 cursor-pointer items-center border border-[#343840] px-3 text-[10px] font-semibold text-zinc-300 hover:border-[#2588ff]">
            Joindre
            <input
              type="file"
              className="hidden"
              accept="image/*,video/*,.pdf,.doc,.docx"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file && file.size > 20 * 1024 * 1024) {
                  event.target.value = "";
                  void dialog.alert({
                    title: "Fichier trop volumineux",
                    description:
                      "La taille maximale autorisée est de 20 Mo.",
                    tone: "warning",
                  });
                }
              }}
            />
          </label>
          <input
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Écrire un message…"
            className={"min-w-0 flex-1 " + controlClass}
          />
          <button className="inline-flex h-10 items-center justify-center border border-[#d8273f] bg-[#c82335] px-4 text-[10px] font-bold text-white hover:bg-[#df2a43]">
            Envoyer
          </button>
        </div>
      </form>
    </section>
  );
}

const proposalStatusLabels: Record<ProposalStatus, string> = {
  draft: "Brouillon",
  pending: "En attente",
  accepted: "Acceptée",
  refused: "Refusée",
  countered: "Contre-proposition",
  cancelled: "Annulée",
};

export function ProposalList({
  kind,
  items,
  onDecision,
}: {
  kind: "fight" | "sponsor";
  items: Array<FightProposal | SponsorOffer>;
  onDecision: (id: string, status: "accepted" | "refused" | "countered") => void;
}) {
  const decisions = [
    ["accepted", "Accepter", "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"],
    ["refused", "Refuser", "border-red-500/40 bg-red-500/5 text-red-300"],
    ["countered", "Contre-proposer", "border-[#2588ff]/50 bg-[#087cff]/10 text-blue-300"],
  ] as const;

  return (
    <section className="space-y-3">
      <header className="border-b border-[#303238] pb-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#3d92ff]">Négociations</p>
        <h1 className="mt-1 text-xl font-black">
          {kind === "fight" ? "Propositions de combat" : "Offres de sponsoring"}
        </h1>
      </header>
      {items.length === 0 ? (
        <p className="border border-dashed border-[#343840] bg-[#121316] p-6 text-xs text-zinc-500">
          Aucune proposition pour le moment.
        </p>
      ) : (
        items.map((item) => (
          <article key={item.id} className="border border-[#303238] bg-[#151619] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold">
                  {"fighterName" in item
                    ? item.fighterName + " · " + item.eventName
                    : item.sponsorName + " · " + item.targetName}
                </h2>
                <p className="mt-1 text-[10px] text-zinc-500">
                  {"weightKg" in item
                    ? item.category + " · " + item.weightKg + " kg · " + item.proposedDate
                    : item.amount.toLocaleString("fr-FR") +
                      " " +
                      item.currency +
                      " · " +
                      item.durationMonths +
                      " mois"}
                </p>
              </div>
              <span className="border border-[#343840] bg-[#101114] px-2 py-1 text-[9px] font-semibold text-zinc-300">
                {proposalStatusLabels[item.status]}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {decisions.map(([status, label, tone]) => (
                <button
                  type="button"
                  key={status}
                  onClick={() => onDecision(item.id, status)}
                  className={"h-8 border px-3 text-[9px] font-semibold " + tone}
                >
                  {label}
                </button>
              ))}
            </div>
            {item.history.length > 0 && (
              <ul className="mt-3 border-t border-[#303238] pt-3 text-[9px] leading-5 text-zinc-500">
                {item.history.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            )}
          </article>
        ))
      )}
    </section>
  );
}

export function NotificationCenter({
  items,
  onRead,
  onReadAll,
  onRemove,
}: {
  items: CommunicationNotification[];
  onRead: (id: string) => void;
  onReadAll: () => void;
  onRemove: (id: string) => void;
}) {
  const priorityLabels = {
    low: "Faible",
    normal: "Normale",
    high: "Haute",
    critical: "Critique",
  } as const;

  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[#303238] pb-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#3d92ff]">Centre personnel</p>
          <h1 className="mt-1 text-xl font-black">Notifications</h1>
          <p className="mt-1 text-xs text-zinc-500">Suivez les informations utiles à votre activité.</p>
        </div>
        <button
          type="button"
          onClick={onReadAll}
          className="inline-flex h-9 items-center border border-[#d8273f] bg-[#c82335] px-4 text-[10px] font-bold text-white hover:bg-[#df2a43]"
        >
          Tout marquer comme lu
        </button>
      </header>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="border border-dashed border-[#343840] bg-[#121316] p-6 text-xs text-zinc-500">
            Aucune notification.
          </p>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className={
                "border p-3 " +
                (item.readAt
                  ? "border-[#303238] bg-[#151619] opacity-70"
                  : "border-amber-500/35 bg-amber-500/5")
              }
            >
              <div className="flex flex-wrap justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                    {categoryLabels[item.category]} · Priorité {priorityLabels[item.priority]}
                  </p>
                  <h2 className="mt-1 text-xs font-bold">{item.title}</h2>
                  <p className="mt-1 text-[10px] leading-5 text-zinc-500">{item.content}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => onRead(item.id)}
                    className="text-[9px] font-semibold text-[#3d92ff] hover:text-blue-300"
                  >
                    Marquer comme lue
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="text-[9px] font-semibold text-red-400 hover:text-red-300"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
              {item.actionUrl && (
                <Link
                  href={item.actionUrl}
                  className="mt-3 inline-flex text-[9px] font-bold text-[#3d92ff] hover:text-blue-300"
                >
                  Ouvrir
                </Link>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export function PreferencesForm({
  value,
  onSave,
}: {
  value: NotificationPreferences;
  onSave: (value: NotificationPreferences) => void;
}) {
  const [draft, setDraft] = useState(value);
  const channels = [
    ["inApp", "Dans la plateforme"],
    ["emailPrepared", "Par e-mail"],
    ["pushPrepared", "Notification push"],
  ] as const;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(draft);
      }}
      className="max-w-4xl border border-[#303238] bg-[#151619]"
    >
      <header className="border-b border-[#303238] p-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#3d92ff]">Communication</p>
        <h1 className="mt-1 text-xl font-black">Préférences de notification</h1>
        <p className="mt-1 text-xs text-zinc-500">
          Choisissez vos canaux, votre fréquence et vos heures de tranquillité.
        </p>
      </header>
      <div className="space-y-5 p-4">
        <fieldset>
          <legend className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
            Canaux
          </legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {channels.map(([key, label]) => (
              <label
                key={key}
                className="flex min-h-12 items-center border border-[#303238] bg-[#101114] p-3 text-xs text-zinc-300"
              >
                <input
                  type="checkbox"
                  checked={draft[key]}
                  onChange={(event) => setDraft({ ...draft, [key]: event.target.checked })}
                  className="accent-[#087cff]"
                />
                <span className="ml-2">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="grid gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
          Fréquence
          <select
            value={draft.frequency}
            onChange={(event) =>
              setDraft({
                ...draft,
                frequency: event.target.value as NotificationPreferences["frequency"],
              })
            }
            className={controlClass}
          >
            <option value="instant">Instantanée</option>
            <option value="daily">Quotidienne</option>
            <option value="weekly">Hebdomadaire</option>
          </select>
        </label>
        <fieldset>
          <legend className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
            Heures de tranquillité
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs text-zinc-400">
              Silence à partir de
              <input
                type="time"
                value={draft.quietHours?.start ?? "22:00"}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    quietHours: {
                      start: event.target.value,
                      end: draft.quietHours?.end ?? "07:00",
                    },
                  })
                }
                className={controlClass}
              />
            </label>
            <label className="grid gap-1.5 text-xs text-zinc-400">
              Jusqu’à
              <input
                type="time"
                value={draft.quietHours?.end ?? "07:00"}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    quietHours: {
                      start: draft.quietHours?.start ?? "22:00",
                      end: event.target.value,
                    },
                  })
                }
                className={controlClass}
              />
            </label>
          </div>
        </fieldset>
      </div>
      <footer className="border-t border-[#303238] bg-[#101114] p-4">
        <button className="inline-flex h-9 items-center border border-[#d8273f] bg-[#c82335] px-4 text-[10px] font-bold text-white hover:bg-[#df2a43]">
          Enregistrer les préférences
        </button>
      </footer>
    </form>
  );
}
