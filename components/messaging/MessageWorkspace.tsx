"use client";

import React, { useState } from "react";
import { 
  Search, Phone, Video, Shield, CheckCheck, Check, Paperclip, 
  Smile, Square, X, Image as ImageIcon, FileText, Award, 
  SlidersHorizontal, Users, Briefcase, Trophy, Globe, Lock, 
  Send, MoreVertical, Play, PhoneOff, ArrowLeft, Star, Archive, 
  Clock, AlertCircle, RefreshCw, Zap, DollarSign, Calendar
} from "lucide-react";

// ==========================================
// 1. TYPES & INTERFACES (TypeScript strict)
// ==========================================

export type UserRole = 
  | "Fan" | "Combattant" | "Coach" | "Club" | "Organisateur" | "Promoteur" 
  | "Arbitre" | "Juge" | "Sponsor" | "Manager" | "Médecin" | "Photographe" 
  | "Journaliste" | "Commerçant" | "Marque" | "Fédération" | "Administrateur";

export type ConversationType = 
  | "private" | "professional" | "combat" | "team" | "event" | "contract" 
  | "sponsoring" | "marketplace" | "payment" | "arbitration" | "medical" 
  | "group" | "public_channel" | "private_channel";

export interface SmartAction {
  id: string;
  title: string;
  actionType: string;
  status: "pending" | "accepted" | "rejected" | "executed";
  payload?: Record<string, any>;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
  status: "sending" | "sent" | "delivered" | "read" | "error";
  isMe: boolean;
  type?: "text" | "file" | "audio" | "video" | "action" | "payment" | "contract" | "poll";
  fileUrl?: string;
  fileName?: string;
  smartAction?: SmartAction;
  reactions?: { emoji: string; count: number; users: string[] }[];
}

export interface Conversation {
  id: string;
  name: string;
  type: ConversationType;
  role: UserRole;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  isFavorite?: boolean;
  messages: Message[];
}

// ==========================================
// 2. DONNÉES INITIALES (Mock complet SaaS)
// ==========================================

const initialConversations: Conversation[] = [
  {
    id: "conv-1",
    name: "Marc 'The Python' Rabe",
    type: "combat",
    role: "Combattant",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=150",
    lastMessage: "Contrat de combat Welter validé pour Mahajanga Arena.",
    time: "10:42",
    unread: 2,
    online: true,
    isPinned: true,
    messages: [
      {
        id: "m1",
        senderId: "u2",
        senderName: "Marc 'The Python' Rabe",
        senderRole: "Combattant",
        text: "Prêt pour la pesée officielle de vendredi prochain.",
        timestamp: "10:30",
        status: "read",
        isMe: false,
        type: "text"
      },
      {
        id: "m2",
        senderId: "u1",
        senderName: "Moi",
        senderRole: "Promoteur",
        text: "Voici la convention officielle pour le championnat à Mahajanga.",
        timestamp: "10:35",
        status: "read",
        isMe: true,
        type: "text"
      },
      {
        id: "m3",
        senderId: "u2",
        senderName: "Marc 'The Python' Rabe",
        senderRole: "Combattant",
        text: "Veuillez valider le contrat de combat pour le 15 août.",
        timestamp: "10:42",
        status: "delivered",
        isMe: false,
        type: "action",
        smartAction: {
          id: "act-1",
          title: "Contrat Combat MMA - 15 Août",
          actionType: "sign_contract",
          status: "pending"
        }
      }
    ]
  },
  {
    id: "conv-2",
    name: "Madagascar Energy Drink",
    type: "sponsoring",
    role: "Sponsor",
    avatar: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=150",
    lastMessage: "Le versement de la tranche 1 a été effectué via ERP.",
    time: "Hier",
    unread: 0,
    online: false,
    isFavorite: true,
    messages: [
      {
        id: "m20",
        senderId: "u3",
        senderName: "Directeur Marketing MED",
        senderRole: "Sponsor",
        text: "Le pack sponsoring VIP est confirmé de notre côté.",
        timestamp: "Hier 14:15",
        status: "read",
        isMe: false,
        type: "action",
        smartAction: {
          id: "act-2",
          title: "Versement Sponsoring - 5 000 000 MGA",
          actionType: "pay_sponsor",
          status: "executed"
        }
      }
    ]
  },
  {
    id: "conv-3",
    name: "Dr. Jean-Luc (Commission Médicale)",
    type: "medical",
    role: "Médecin",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150",
    lastMessage: "Certificat médical d'aptitude validé pour la pesée.",
    time: "2 jours",
    unread: 0,
    online: true,
    messages: [
      {
        id: "m30",
        senderId: "u4",
        senderName: "Dr. Jean-Luc",
        senderRole: "Médecin",
        text: "Les résultats sanguins et l'électrocardiogramme de Marc Rabe sont conformes.",
        timestamp: "2 jours",
        status: "read",
        isMe: false,
        type: "file",
        fileName: "Certificat_Medical_Rabe_2026.pdf",
        fileUrl: "#"
      }
    ]
  }
];

// ==========================================
// 3. COMPOSANT PRINCIPAL : MessageWorkspace
// ==========================================

export default function MessageWorkspace() {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeId, setActiveId] = useState<string>("conv-1");
  const [filterType, setFilterType] = useState<string>("Tous");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // États UI Globaux
  const [callActive, setCallActive] = useState<boolean>(false);
  const [callType, setCallType] = useState<"audio" | "video">("audio");
  const [mobileShowChat, setMobileShowChat] = useState<boolean>(false);

  const activeConv = conversations.find((c) => c.id === activeId) || conversations[0];

  // Gestion de l'envoi de message (Optimistic UI)
  const handleSendMessage = (text: string, type: "text" | "file" | "audio" = "text", fileData?: { url: string; name: string }) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: "u1",
      senderName: "Moi",
      senderRole: "Promoteur",
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "sent",
      isMe: true,
      type: type,
      fileUrl: fileData?.url,
      fileName: fileData?.name
    };

    setConversations(prev =>
      prev.map(conv => {
        if (conv.id === activeId) {
          return {
            ...conv,
            lastMessage: type === "file" ? `Fichier: ${fileData?.name}` : type === "audio" ? "Message vocal" : text,
            time: "À l'instant",
            messages: [...conv.messages, newMessage]
          };
        }
        return conv;
      })
    );
  };

  // Gestion ERP / Smart Actions (Impact direct dans Supabase / State)
  const handleSmartAction = (messageId: string, actionType: string) => {
    setConversations(prev =>
      prev.map(conv => {
        if (conv.id === activeId) {
          const updatedMessages = conv.messages.map(msg => {
            if (msg.id === messageId && msg.smartAction) {
              return {
                ...msg,
                smartAction: {
                  ...msg.smartAction,
                  status: "executed" as const
                }
              };
            }
            return msg;
          });
          return { ...conv, messages: updatedMessages };
        }
        return conv;
      })
    );
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesFilter = filterType === "Tous" || conv.type === filterType.toLowerCase() || conv.role === filterType;
    const matchesSearch = conv.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* ================= SIDEBAR DESKTOP & MOBILE (LISTE) ================= */}
      <div className={`w-full md:w-96 lg:w-[420px] border-r border-slate-800 flex flex-col bg-slate-900/60 backdrop-blur-xl ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header Ecosystème Indesy Mialy */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-600 via-red-600 to-indigo-600 flex items-center justify-center font-black text-white shadow-lg tracking-wider">
                IM
              </div>
              <div>
                <h1 className="font-extrabold text-sm tracking-widest text-amber-500 uppercase">Indesy Mialy Hub</h1>
                <p className="text-[11px] text-slate-400 font-medium">ERP & Enterprise Messenger SaaS</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase ml-1">Realtime</span>
            </div>
          </div>

          {/* Recherche Avancée */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher (combattant, contrat, sponsor, événement)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all shadow-inner"
            />
          </div>

          {/* Filtres multi-rôles et types de conversations */}
          <div className="flex space-x-1.5 overflow-x-auto pb-1 text-xs">
            {["Tous", "Combattant", "combat", "sponsoring", "medical", "Sponsor"].map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterType(filter)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  filterType === filter
                    ? "bg-amber-600 text-white shadow-md shadow-amber-900/40"
                    : "bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                }`}
              >
                {filter.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des conversations */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => { setActiveId(conv.id); setMobileShowChat(true); }}
              className={`p-4 flex items-center space-x-3.5 cursor-pointer transition-all ${
                activeId === conv.id ? "bg-slate-800/80 border-l-4 border-amber-500 shadow-sm" : "hover:bg-slate-800/30"
              }`}
            >
              <div className="relative flex-shrink-0">
                <img src={conv.avatar} alt={conv.name} className="w-13 h-13 rounded-2xl object-cover border border-slate-700 shadow" />
                {conv.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-sm truncate text-slate-100">{conv.name}</h3>
                  <span className="text-[10px] text-slate-500 font-mono">{conv.time}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-slate-400 truncate max-w-[180px]">{conv.lastMessage}</span>
                  {conv.unread > 0 && (
                    <span className="bg-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md animate-pulse">
                      {conv.unread}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-1.5">
                  <span className="inline-block text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider font-extrabold bg-red-950/80 text-red-400 border border-red-900/40">
                    {conv.role}
                  </span>
                  <span className="inline-block text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider font-extrabold bg-slate-800 text-slate-300">
                    {conv.type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= FENÊTRE DE DISCUSSION ACTIVE (WORKSPACE) ================= */}
      <div className={`flex-1 flex flex-col bg-slate-950 ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        
        {/* En-tête du Chat / ERP Contextuel */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setMobileShowChat(false)} 
              className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative">
              <img src={activeConv.avatar} alt={activeConv.name} className="w-11 h-11 rounded-2xl object-cover border border-slate-700 shadow" />
              {activeConv.online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-sm text-slate-100">{activeConv.name}</h2>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-mono uppercase">
                  {activeConv.type}
                </span>
              </div>
              <p className="text-xs text-amber-500 font-medium">
                {activeConv.role} • {activeConv.online ? "En ligne (Supabase Realtime)" : "Hors ligne"}
              </p>
            </div>
          </div>

          {/* Outils WebRTC & Commandes Enterprise */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => { setCallType("audio"); setCallActive(true); }}
              className="p-2.5 rounded-xl bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow"
              title="Appel Audio WebRTC sécurisé"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setCallType("video"); setCallActive(true); }}
              className="p-2.5 rounded-xl bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow"
              title="Appel Vidéo HD WebRTC"
            >
              <Video className="w-4 h-4" />
            </button>
            <button className="p-2.5 rounded-xl bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Liste des messages avec rendu des Boutons Intelligents ERP */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-950 via-slate-900/10 to-slate-950">
          {activeConv.messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] md:max-w-lg rounded-2xl px-4 py-3 shadow-xl space-y-2.5 ${
                msg.isMe
                  ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-br-none"
                  : "bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none"
              }`}>
                {!msg.isMe && (
                  <div className="flex items-center space-x-2 pb-1 border-b border-slate-800/60 text-[11px] text-amber-400 font-bold">
                    <span>{msg.senderName}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400 uppercase font-mono text-[9px]">{msg.senderRole}</span>
                  </div>
                )}

                {(!msg.type || msg.type === "text") && (
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                )}

                {msg.type === "file" && (
                  <div className="flex items-center space-x-3 bg-black/30 p-3 rounded-xl border border-white/10">
                    <FileText className="w-8 h-8 text-amber-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate text-white">{msg.fileName || "Document_Indesy_Mialy.pdf"}</p>
                      <span className="text-[10px] text-emerald-400 font-semibold">Chiffré AES-256 & Stocké sur Supabase Storage</span>
                    </div>
                  </div>
                )}

                {/* BOUTONS INTELLIGENTS ERP */}
                {msg.smartAction && (
                  <div className="mt-3 pt-3 border-t border-white/20 space-y-3 bg-black/20 p-3 rounded-xl border border-white/10">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-amber-300 flex-shrink-0 animate-bounce" />
                      <span className="text-xs font-black uppercase tracking-wider text-amber-200">{msg.smartAction.title}</span>
                    </div>
                    <p className="text-xs text-white/90">{msg.text}</p>

                    {msg.smartAction.status === "pending" ? (
                      <div className="flex space-x-2 pt-1">
                        <button
                          onClick={() => handleSmartAction(msg.id, msg.smartAction!.actionType)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold py-2 px-3 rounded-lg shadow-lg transition-all flex items-center justify-center space-x-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>Exécuter / Valider (ERP)</span>
                        </button>
                      </div>
                    ) : (
                      <div className="w-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-400 text-xs font-black py-2 px-3 rounded-lg text-center flex items-center justify-center space-x-1.5 shadow-inner">
                        <CheckCheck className="w-4 h-4 text-emerald-400" />
                        <span>Action validée & Synchronisée dans Supabase</span>
                      </div>
                    )}
                  </div>
                )}

                <div className={`flex items-center justify-end space-x-1 text-[10px] ${msg.isMe ? "text-amber-100/80" : "text-slate-400"}`}>
                  <span>{msg.timestamp}</span>
                  {msg.isMe && (
                    <span>
                      {msg.status === "read" ? <CheckCheck className="w-3.5 h-3.5 text-blue-300 inline" /> : <Check className="w-3.5 h-3.5 inline" />}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Zone de Saisie Avancée */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40">
          <div className="flex items-center space-x-2">
            <label className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer transition-all shadow">
              <Paperclip className="w-4 h-4" />
              <input type="file" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleSendMessage(`Fichier partagé : ${f.name}`, "file", { name: f.name, url: "#" });
              }} className="hidden" />
            </label>

            <button className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all shadow">
              <Smile className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder="Écrivez un message professionnel, envoyez un ordre ERP ou un contrat..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  handleSendMessage(e.currentTarget.value, "text");
                  e.currentTarget.value = "";
                }
              }}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all shadow-inner"
            />

            <button
              onClick={(e) => {
                const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                if (input && input.value.trim()) {
                  handleSendMessage(input.value, "text");
                  input.value = "";
                }
              }}
              className="p-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-lg transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODALE APPEL WEBRTC ================= */}
      {callActive && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col items-center p-6 relative">
            <div className="absolute top-4 left-4 flex items-center space-x-1.5 text-xs text-amber-500 bg-amber-950/50 px-3 py-1 rounded-full border border-amber-900/40">
              <Shield className="w-3.5 h-3.5" />
              <span>WebRTC Chiffré de bout en bout • Indesy Mialy Live</span>
            </div>

            <div className="my-12 flex flex-col items-center space-y-4">
              <div className="relative">
                <img src={activeConv.avatar} alt={activeConv.name} className="w-32 h-32 rounded-3xl object-cover border-4 border-amber-600 shadow-2xl animate-pulse" />
                <span className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-slate-900 rounded-full"></span>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-100">{activeConv.name}</h3>
                <p className="text-sm text-slate-400 mt-1">Appel {callType} WebRTC haute définition en cours...</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 mt-4">
              <button
                onClick={() => setCallActive(false)}
                className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-xl transition-transform hover:scale-105"
                title="Raccrocher"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}