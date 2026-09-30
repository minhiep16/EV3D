export type BatteryStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'SERVICE_REQUIRED';

export interface BatteryHealthResponse {
  vehicleId: string;
  vehicleCode: string;
  stateOfChargePercent: number;
  stateOfHealthPercent: number;
  estimatedRangeKm: number;
  capacityKwh?: number | null;
  usableCapacityKwh?: number | null;
  voltage?: number | null;
  temperatureCelsius?: number | null;
  cycleCount?: number | null;
  batteryStatus: BatteryStatus;
  lastInspectedAt?: string | null;
  updatedAt?: string | null;
}
