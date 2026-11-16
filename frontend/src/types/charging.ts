export type ChargingStationStatus = 'AVAILABLE' | 'OCCUPIED' | 'OUT_OF_SERVICE';

export type ChargingConnectorType = 'CCS2' | 'TYPE2' | 'CHADEMO' | 'OTHER';

export interface ChargingStationResponse {
  id: string;
  code: string;
  name: string;
  status: ChargingStationStatus;
  maxPowerKw: number;
  pricePerKwh?: number | null;
  connectorType: ChargingConnectorType;
  locationLabel?: string | null;
  posX?: number | null;
  posY?: number | null;
  posZ?: number | null;
  createdAt: string;
  updatedAt: string;
}

export type ChargingSessionStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

export interface ChargingSessionResponse {
  id: string;
  vehicleId: string;
  vehicleCode: string;
  chargingStationId: string;
  chargingStationCode: string;
  chargingStationName: string;
  status: ChargingSessionStatus;
  startedByUserId: string;
  startedByUserName: string;
  startedByUserRole?: string | null;
  canControl?: boolean | null;
  isStaffCharging?: boolean | null;
  isExemptFromFee?: boolean | null;
  startedAt?: string | null;
  endedAt?: string | null;
  startSocPercent: number;
  currentSocPercent: number;
  targetSocPercent: number;
  energyDeliveredKwh?: number | null;
  storedEnergyKwh?: number | null;
  tariffPerKwh?: number | null;
  chargingCost?: number | null;
  energyLossKwh?: number | null;
  powerKw?: number | null;
  estimatedRemainingMinutes?: number | null;
  completionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleEnergyInventoryResponse {
  id: string;
  vehicleId: string;
  vehicleName: string;
  availableEnergyKwh: number;
  totalInventoryCost: number;
  weightedAverageCostPerKwh: number;
  totalEnergyChargedKwh: number;
  totalEnergyConsumedKwh: number;
  totalCostCharged: number;
  totalCostConsumed: number;
  lastChargingSessionId?: string | null;
  lastTripId?: string | null;
  isReconciliationRequired: boolean;
  reconciliationNote?: string | null;
  usableBatteryCapacityKwh?: number | null;
  currentBatteryLevel?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleEnergyTransactionResponse {
  id: string;
  vehicleId: string;
  transactionType: 'CHARGING_INFLOW' | 'TRIP_CONSUMPTION' | 'RECONCILIATION_ADJUSTMENT';
  deltaEnergyKwh: number;
  deltaCost: number;
  unitCost: number;
  balanceEnergyKwhAfter: number;
  balanceCostAfter: number;
  weightedAvgCostAfter: number;
  operatorOrDriverUserId?: string | null;
  operatorOrDriverName?: string | null;
  sourceReferenceId?: string | null;
  note?: string | null;
  recordedAt: string;
}

export interface CreateChargingSessionPayload {
  chargingStationId: string;
  targetSocPercent: number;
  startImmediately?: boolean;
}

export interface ProgressChargingSessionPayload {
  newSocPercent: number;
  energyDeliveredKwh?: number;
}
