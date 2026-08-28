"use client"; import { useSocialCrud } from "@/modules/social-core"; import { SOCIAL_MODULES } from "@/modules/social-modules"; export const useShares = () => useSocialCrud(SOCIAL_MODULES.shares);
