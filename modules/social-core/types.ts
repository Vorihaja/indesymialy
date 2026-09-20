export type SocialEntityKind = "publication" | "discussion" | "comment" | "reaction" | "share" | "report" | "media" | "profile";
export type SocialStatus = "draft" | "published" | "locked" | "reported" | "archived";
export type SocialMediaType = "image" | "video" | "album" | "gallery";

export interface SocialRecord {
  id: string;
  kind: SocialEntityKind;
  title: string;
  content: string;
  author: string;
  category: string;
  discipline: string;
  region: string;
  tags: string[];
  mentions: string[];
  mediaType?: SocialMediaType;
  mediaUrl?: string;
  parentId?: string;
  status: SocialStatus;
  likes: number;
  shares: number;
  replies: number;
  createdAt: string;
  updatedAt: string;
}

export type SocialRecordInput = Omit<SocialRecord, "id" | "likes" | "shares" | "replies" | "createdAt" | "updatedAt">;

export interface SocialFilters { search: string; discipline: string; region: string; category: string; date: string; }
export interface SocialStatistics { total: number; published: number; interactions: number; reported: number; }
export interface SocialModuleDefinition { key: string; label: string; entityLabel: string; entityLabelPlural: string; basePath: string; kind: SocialEntityKind; capabilities: readonly string[]; }
export type PublicProfileRole = "combattant" | "club" | "coach" | "organisateur" | "officiel" | "arbitre" | "juge" | "sponsor" | "vendeur" | "fan";
