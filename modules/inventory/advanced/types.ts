export type StockMovementType =
  | "in"
  | "out"
  | "reserve"
  | "release"
  | "adjustment";

export type InventoryCountStatus =
  | "draft"
  | "completed"
  | "cancelled";

export interface AdvancedInventoryProduct {
  productId: string;
  title: string;
  available: number;
  reserved: number;
  physical: number;
  lowStockThreshold: number;
  updatedAt: string;
}

export interface AdvancedStockMovement {
  id: string;
  productId: string;
  productTitle: string;
  type: StockMovementType;
  quantity: number;
  reason: string;
  orderId: string | null;
  createdAt: string;
}

export interface InventoryReservation {
  key: string;
  orderId: string;
  productId: string;
  productTitle: string;
  quantity: number;
  orderStatus: string;
  customerName: string;
  orderCreatedAt: string;
}

export interface InventoryCountLine {
  id: string;
  productId: string;
  productTitle: string;
  theoreticalAvailable: number;
  theoreticalReserved: number;
  theoreticalPhysical: number;
  countedPhysical: number | null;
  appliedDelta: number;
  countedAt: string | null;
}

export interface InventoryCount {
  id: string;
  status: InventoryCountStatus;
  note: string | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lines: InventoryCountLine[];
}

export interface AdvancedInventorySnapshot {
  organizationId: string;
  products: AdvancedInventoryProduct[];
  movements: AdvancedStockMovement[];
  reservations: InventoryReservation[];
  counts: InventoryCount[];
  activeCount: InventoryCount | null;
}

export interface InventoryPhysicalCountInput {
  productId: string;
  countedPhysical: number;
}