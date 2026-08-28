import type { SocialModuleDefinition } from "@/modules/social-core";
export const SOCIAL_MODULES = {
  news: { key: "social-news", label: "Actualités", entityLabel: "Publication", entityLabelPlural: "Publications", basePath: "/social/actualites", kind: "publication", capabilities: ["Publication", "Édition", "Commentaires", "Likes", "Partages", "Images", "Vidéos", "Catégories", "Tags", "Filtres"] },
  discussions: { key: "social-discussions", label: "Discussions", entityLabel: "Discussion", entityLabelPlural: "Discussions", basePath: "/social/discussions", kind: "discussion", capabilities: ["Création", "Réponses", "Réactions", "Mentions", "Verrouillage", "Signalement", "Recherche"] },
  comments: { key: "social-comments", label: "Commentaires", entityLabel: "Commentaire", entityLabelPlural: "Commentaires", basePath: "/social/commentaires", kind: "comment", capabilities: ["CRUD", "Réponses", "Likes", "Signalement"] },
  reactions: { key: "social-reactions", label: "Réactions", entityLabel: "Réaction", entityLabelPlural: "Réactions", basePath: "/social/reactions", kind: "reaction", capabilities: ["Likes", "Réactions typées", "Statistiques"] },
  shares: { key: "social-shares", label: "Partages", entityLabel: "Partage", entityLabelPlural: "Partages", basePath: "/social/partages", kind: "share", capabilities: ["Partage interne", "Liens publics", "Statistiques"] },
  reports: { key: "social-reports", label: "Signalements", entityLabel: "Signalement", entityLabelPlural: "Signalements", basePath: "/social/signalements", kind: "report", capabilities: ["Création", "Qualification", "Suivi", "Archivage"] },
  media: { key: "social-media", label: "Médias", entityLabel: "Média", entityLabelPlural: "Médias", basePath: "/social/medias", kind: "media", capabilities: ["Photos", "Vidéos", "Albums", "Galeries"] },
  search: { key: "social-search", label: "Recherche sociale", entityLabel: "Résultat", entityLabelPlural: "Résultats", basePath: "/social/recherche", kind: "publication", capabilities: ["Personnes", "Clubs", "Publications", "Discussions", "Hashtags"] },
  profiles: { key: "public-profiles", label: "Profils publics", entityLabel: "Profil", entityLabelPlural: "Profils", basePath: "/social/profils", kind: "profile", capabilities: ["Présentation", "Photos", "Statistiques publiques", "Dernières publications"] },
} as const satisfies Record<string, SocialModuleDefinition>;
