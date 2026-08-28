"use client"; import { useErpCrud } from "@/modules/erp-core"; import { ERP_MODULES } from "@/modules/erp-modules"; export const useSponsorManagement = () => useErpCrud(ERP_MODULES.sponsor);
