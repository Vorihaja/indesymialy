"use client";

import { useMemo, useState } from "react";

type MessageType = "sent" | "recv" | "note";

type Message = {
  id: string;
  type: MessageType;
  text: string;
  time: string;
};

type Thread = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: string;
  preview: string;
  details: string;
  organization: string;
  category: string;
  lastSeen: string;
};

const THREADS: Thread[] = [
  {
    id: "miora",
    name: "Miora Ratsimba",
    role: "Combattante",
    avatar: "MR",
    status: "En ligne",
    preview: "Oui, on peut faire le sparring vendredi.",
    details: "Combattante MMA, -70kg, club Tana Fight Club. Disponible pour match pro et entraînements privés.",
    organization: "Tana Fight Club",
    category: "MMA -70kg",
    lastSeen: "À l’instant",
  },
  {
    id: "rakoto",
    name: "Rakoto MMA Club",
    role: "Club",
    avatar: "RM",
    status: "Hors ligne",
    preview: "Ta proposition est intéressante, on confirme la date la semaine prochaine.",
    details: "Club historique de Mahajanga. Spécialisé en détection et préparation de talents de combat.",
    organization: "Rakoto MMA Club",
    category: "Partenariat & programmation",
    lastSeen: "Hier",
  },
  {
    id: "orange",
    name: "Orange Madagascar",
    role: "Sponsor",
    avatar: "OM",
    status: "Hors ligne",
    preview: "Nous souhaitons prolonger le contrat pour 2026.",
    details: "Equipe sponsoring avec expertise marketing sportif et activation événementielle.",
    organization: "Orange Madagascar",
    category: "Sponsoring",
    lastSeen: "Hier",
  },
];

const INITIAL_CONVERSATIONS: Record<string, Message[]> = {
  miora: [
    { id: "1", type: "recv", text: "Salut ! Merci pour le sparring d'hier, c'était intense 🔥", time: "10:23" },
    { id: "2", type: "sent", text: "Oui grave ! Ta gauche s'améliore beaucoup. On remet ça vendredi ?", time: "10:25" },
    { id: "3", type: "recv", text: "Carrément. D'ailleurs j'ai vu que tu cherches un combat en -70kg ?", time: "10:26" },
  ],
  rakoto: [
    { id: "1", type: "recv", text: "Yo champion, on a une proposition sérieuse pour toi 💥", time: "14:30" },
    { id: "2", type: "sent", text: "Je veux voir le plateau et le cachet avant de confirmer.", time: "14:32" },
    { id: "3", type: "recv", text: "C'est pour la carte principale du 15 décembre.", time: "14:35" },
  ],
  orange: [
    { id: "1", type: "recv", text: "Bonjour, suite à ta performance, nous souhaitons prolonger.", time: "Lun" },
    { id: "2", type: "sent", text: "Merci pour la confiance ! Les termes me conviennent.", time: "Lun" },
  ],
};

export default function MessageWorkspace() {
  const [activeThreadId, setActiveThreadId] = useState(THREADS[0].id);
  const [showDetails, setShowDetails] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);

  const activeThread = useMemo(
    () => THREADS.find((thread) => thread.id === activeThreadId) ?? THREADS[0],
    [activeThreadId]
  );

  const activeMessages = conversations[activeThreadId] ?? [];

  const handleSelectThread = (threadId: string) => {
    setActiveThreadId(threadId);
    setShowDetails(false);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    const newMessage: Message = {
      id: `${Date.now()}`,
      type: "sent",
      text: inputValue.trim(),
      time: "À l'instant",
    };
    setConversations((current) => ({
      ...current,
      [activeThreadId]: [...(current[activeThreadId] ?? []), newMessage],
    }));
    setInputValue("");
  };

  return (
    <section className="mt-10 rounded-3xl border border-white/10 bg-slate-950/90 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-amber-300">Mes Messages</p>
          <h2 className="mt-2 text-2xl font-black text-white">Discussion rapide</h2>
        </div>
        <div className="rounded-3xl bg-white/5 px-4 py-3 text-sm text-slate-300">
          Le module de messagerie est disponible dans tous les espaces de travail.
        </div>
      </div>

      <div className={`grid gap-4 ${showDetails ? 'lg:grid-cols-[260px_minmax(0,1fr)_320px]' : 'lg:grid-cols-[260px_minmax(0,1fr)]'}`}>
        <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Fils de discussion</h3>
            <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] text-slate-300">{THREADS.length}</span>
          </div>
          <div className="space-y-2">
            {THREADS.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => handleSelectThread(thread.id)}
                className={`w-full rounded-3xl px-3 py-3 text-left transition ${thread.id === activeThreadId ? 'bg-amber-500/10 border border-amber-400/20 text-white' : 'bg-slate-950/80 hover:bg-slate-900'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 grid place-items-center font-black text-slate-950">{thread.avatar}</div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{thread.name}</p>
                    <p className="truncate text-[12px] text-slate-400">{thread.preview}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{thread.role}</span>
                  <span>{thread.lastSeen}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col rounded-3xl border border-white/10 bg-slate-900/80 p-4">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                className="text-left text-lg font-semibold text-white hover:text-amber-300 transition"
              >
                {activeThread.name}
              </button>
              <p className="text-xs text-slate-500">{activeThread.role} • {activeThread.organization}</p>
            </div>
            <span className={`rounded-full px-2 py-1 text-[11px] ${activeThread.status === 'En ligne' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-700/80 text-slate-300'}`}>{activeThread.status}</span>
          </div>

          <div className="flex-1 overflow-y-auto py-4 pr-2 space-y-3">
            {activeMessages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6 ${message.type === 'sent' ? 'bg-amber-500 text-slate-950' : message.type === 'note' ? 'bg-white/5 text-slate-300 italic' : 'bg-slate-800 text-slate-200'}`}>
                  <p>{message.text}</p>
                  <div className="mt-2 text-[11px] text-slate-400 text-right">{message.time}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Écris un message..."
              className="flex-1 rounded-3xl border border-white/10 bg-[#0C0E13] px-4 py-3 text-sm text-slate-100 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10"
            />
            <button
              type="button"
              onClick={handleSendMessage}
              className="inline-flex h-11 items-center justify-center rounded-3xl bg-amber-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
            >
              Envoyer
            </button>
          </div>
        </div>

        {showDetails && (
          <aside className="rounded-3xl border border-white/10 bg-slate-900/90 p-4">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Détails du contact</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{activeThread.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="text-slate-400 transition hover:text-white"
                aria-label="Fermer les détails"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 py-4 text-sm text-slate-300">
              <div className="rounded-3xl bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Organisation</p>
                <p className="mt-2 font-semibold text-white">{activeThread.organization}</p>
              </div>
              <div className="rounded-3xl bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Catégorie</p>
                <p className="mt-2 font-semibold text-white">{activeThread.category}</p>
              </div>
              <div className="rounded-3xl bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">À propos</p>
                <p className="mt-2 text-slate-300">{activeThread.details}</p>
              </div>
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}
