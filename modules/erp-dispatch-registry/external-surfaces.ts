export type ErpExternalSurfaceRole =
  | "federation"
  | "club"
  | "coach"
  | "official";

export type ErpExternalSurfaceModule =
  | "communication";

export type ErpExternalSurface = {
  role: ErpExternalSurfaceRole;
  moduleId: ErpExternalSurfaceModule;
  surface: "korana";
  href: "/korana/messages";
  authority: "communication-core";
};

export const ERP_EXTERNAL_SURFACES:
  readonly ErpExternalSurface[] = [
    {
      role: "federation",
      moduleId: "communication",
      surface: "korana",
      href: "/korana/messages",
      authority: "communication-core",
    },
    {
      role: "club",
      moduleId: "communication",
      surface: "korana",
      href: "/korana/messages",
      authority: "communication-core",
    },
    {
      role: "coach",
      moduleId: "communication",
      surface: "korana",
      href: "/korana/messages",
      authority: "communication-core",
    },
    {
      role: "official",
      moduleId: "communication",
      surface: "korana",
      href: "/korana/messages",
      authority: "communication-core",
    },
  ];

export function resolveErpExternalSurface(
  role: string,
  moduleId: string,
): ErpExternalSurface | null {
  return (
    ERP_EXTERNAL_SURFACES.find(
      (entry) =>
        entry.role === role &&
        entry.moduleId === moduleId,
    ) ?? null
  );
}