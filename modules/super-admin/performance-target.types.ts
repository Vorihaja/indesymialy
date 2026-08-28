import type {
  SuperAdminPerformanceDirection,
} from "./performance.types";

export interface SuperAdminKpiTargetConfiguration {
  metricCode: string;

  direction: SuperAdminPerformanceDirection;

  minValue: number;

  maxValue: number;

  stepValue: number;

  criticalValue: number | null;

  targetValue: number | null;

  maturityValue: number | null;

  enabled: boolean;

  notes: string | null;

  updatedAt: string | null;
}

export interface SuperAdminKpiTargetUpdate {
  metricCode: string;

  criticalValue: number | null;

  targetValue: number | null;

  maturityValue: number | null;

  enabled: boolean;

  notes: string | null;
}
