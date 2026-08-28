"use client"; import { useErpCrud } from "@/modules/erp-core"; import { ERP_MODULES } from "@/modules/erp-modules"; export const useFanManagement = () => useErpCrud(ERP_MODULES.fan);
