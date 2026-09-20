export type ErpCanonicalRole =
  | "super-admin"
  | "admin"
  | "federation"
  | "league"
  | "club"
  | "coach"
  | "fighter"
  | "organizer"
  | "official"
  | "sponsor"
  | "seller"
  | "fan";

export type ErpImplementationStatus = "implemented" | "unavailable";

export type ErpScope =
  | "personal"
  | "organization"
  | "event"
  | "fighter"
  | "public"
  | "platform"
  | "none";

export type ErpCapability = "read" | "create" | "update" | "delete";

export type ErpCapabilityMode =
  | "fixed"
  | "source-aware"
  | "permission-aware";

export type ErpCapabilityMap = Partial<Record<ErpCapability, boolean>>;

export interface ErpDispatchRegistryEntry {
  canonicalRole: ErpCanonicalRole;
  moduleId: string;
  implementationStatus: ErpImplementationStatus;
  handlerKey: string;
  authority: string;
  scope: ErpScope;
  readScope?: ErpScope;
  mutationScope?: ErpScope;
  capabilityMode?: ErpCapabilityMode;
  capabilityPolicy?: string;
  capabilities: ErpCapabilityMap;
}

export type ErpDispatchResolution =
  | { kind: "implemented"; entry: ErpDispatchRegistryEntry }
  | { kind: "unavailable"; entry: ErpDispatchRegistryEntry }
  | { kind: "unknown"; role: string; moduleId: string };
