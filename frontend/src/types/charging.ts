export type ChargingStationStatus = 'AVAILABLE' | 'OCCUPIED' | 'OUT_OF_SERVICE';

export type ChargingConnectorType = 'CCS2' | 'TYPE2' | 'CHADEMO' | 'OTHER';

export interface ChargingStationResponse {
  id: string;
  code: string;
  name: string;
  status: ChargingStationStatus;
  maxPowerKw: number;
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
  startedAt?: string | null;
  endedAt?: string | null;
  startSocPercent: number;
  currentSocPercent: number;
  targetSocPercent: number;
  energyDeliveredKwh?: number | null;
  powerKw?: number | null;
  estimatedRemainingMinutes?: number | null;
  completionReason?: string | null;
  createdAt: string;
  updatedAt: string;
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
