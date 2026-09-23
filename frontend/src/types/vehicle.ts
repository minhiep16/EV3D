export type VehicleStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'IN_USE'
  | 'CHARGING'
  | 'MAINTENANCE'
  | 'UNAVAILABLE';

export interface VehicleResponse {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  batteryCapacity: number;
  currentBatteryLevel: number;
  odometer: number;
  status: VehicleStatus;
  model3dUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateVehiclePayload {
  name?: string;
  brand?: string;
  model?: string;
  year?: number;
  licensePlate?: string;
  vin?: string;
  batteryCapacity?: number;
  currentBatteryLevel?: number;
  odometer?: number;
  status?: VehicleStatus;
  model3dUrl?: string;
}
