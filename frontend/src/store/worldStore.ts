import { create } from 'zustand';
import { VehiclePartId } from '../types/vehiclePart';

export type GarageZone =
  | 'VEHICLE'
  | 'CHARGING'
  | 'MAINTENANCE'
  | 'FINANCE'
  | 'GOVERNANCE'
  | 'ANALYTICS'
  | 'AI';

export type WorldMode = 'GARAGE' | 'LOGIN' | 'REGISTER';

export type VehicleStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'IN_USE'
  | 'CHARGING'
  | 'MAINTENANCE'
  | 'UNAVAILABLE';

export const VEHICLE_STATUS_LABELS: Record<
  VehicleStatus,
  { label: string; color: string; bg: string }
> = {
  AVAILABLE: { label: 'Sẵn sàng', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  RESERVED: { label: 'Đã đặt', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  IN_USE: { label: 'Đang sử dụng', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  CHARGING: { label: 'Đang sạc', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' },
  MAINTENANCE: { label: 'Đang bảo dưỡng', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
  UNAVAILABLE: { label: 'Không khả dụng', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
};

export interface CameraPreset {
  target: [number, number, number];
  position: [number, number, number];
}

export const ZONE_CAMERA_PRESETS: Record<
  GarageZone | 'OVERVIEW' | 'VEHICLE_FOCUS' | 'VEHICLE_CO_OWNERSHIP' | 'VEHICLE_BOOKING' | 'VEHICLE_HANDOVER',
  CameraPreset
> = {
  OVERVIEW: {
    target: [0, 0.5, 2],
    position: [0, 16, 24],
  },

  VEHICLE: {
    target: [-7.1, 0.8, 4],
    position: [-7.1, 4.2, 10.6],
  },

  VEHICLE_FOCUS: {
    target: [-7.1, 0.8, 4],
    position: [-7.1, 3.6, 10.6],
  },

  VEHICLE_CO_OWNERSHIP: {
    target: [-5.6, 1.1, 4],
    position: [-5.6, 4.8, 13.6],
  },

  VEHICLE_BOOKING: {
    target: [-4.6, 1.15, 4.0],
    position: [-4.6, 4.6, 14.2],
  },

  VEHICLE_HANDOVER: {
    target: [-5.6, 1.1, 4.0],
    position: [-5.6, 4.4, 13.5],
  },

  CHARGING: {
    target: [8.9, 1.0, 4],
    position: [8.9, 4.4, 10.5],
  },

  MAINTENANCE: {
    target: [0.9, 1.0, 6],
    position: [0.9, 4.5, 12.5],
  },

  FINANCE: {
    target: [-7.1, 1.2, -5],
    position: [-7.1, 4.4, 0.8],
  },

  GOVERNANCE: {
    target: [8.9, 1.2, -5],
    position: [8.9, 4.4, 0.8],
  },

  ANALYTICS: {
    target: [0.9, 1.4, -8],
    position: [0.9, 4.5, -2.0],
  },

  AI: {
    target: [0.85, 1.6, 13],
    position: [0.85, 4.5, 18.8],
  },
};

interface WorldState {
  selectedZone: GarageZone | null;
  hoveredZone: GarageZone | null;
  selectedObjectId: string | null;
  hoveredObjectId: string | null;
  selectedPosition: [number, number, number] | null;
  selectedVehicleId: string | null;
  hoveredVehicleId: string | null;
  currentWorldMode: WorldMode;

  // Phase 06: Vehicle Inspection Mode & Part Selection State
  vehicleInspectionMode: boolean;
  hoveredVehiclePartId: VehiclePartId | null;
  selectedVehiclePartId: VehiclePartId | null;

  // Phase 07: Vehicle Co-Ownership Mode & Owner Selection State
  vehicleCoOwnershipMode: boolean;
  hoveredOwnerId: string | null;
  selectedOwnerId: string | null;

  selectZone: (zone: GarageZone | null) => void;
  hoverZone: (zone: GarageZone | null) => void;
  selectVehicle: (id: string | null) => void;
  hoverVehicle: (id: string | null) => void;
  selectObject: (id: string, position: [number, number, number]) => void;
  hoverObject: (id: string | null) => void;
  clearSelection: () => void;
  clearActiveSpatialSelection: () => void;
  setWorldMode: (mode: WorldMode) => void;

  enterVehicleInspectionMode: () => void;
  exitVehicleInspectionMode: () => void;
  hoverVehiclePart: (id: VehiclePartId | null) => void;
  selectVehiclePart: (id: VehiclePartId | null) => void;
  clearVehiclePartSelection: () => void;

  enterVehicleCoOwnershipMode: () => void;
  exitVehicleCoOwnershipMode: () => void;
  hoverOwner: (id: string | null) => void;
  selectOwner: (id: string | null) => void;
  clearOwnerSelection: () => void;

  vehicleBookingMode: boolean;
  enterVehicleBookingMode: () => void;
  exitVehicleBookingMode: () => void;

  // Phase 09: Vehicle Handover & Check-in Mode
  vehicleHandoverMode: boolean;
  hoveredHandoverCheckpoint: string | null;
  selectedHandoverCheckpoint: string | null;
  enterVehicleHandoverMode: () => void;
  exitVehicleHandoverMode: () => void;
  hoverHandoverCheckpoint: (code: string | null) => void;
  selectHandoverCheckpoint: (code: string | null) => void;
  clearHandoverCheckpointSelection: () => void;
}

export const useWorldStore = create<WorldState>((set) => ({
  selectedZone: null,
  hoveredZone: null,
  selectedObjectId: null,
  hoveredObjectId: null,
  selectedPosition: null,
  selectedVehicleId: null,
  hoveredVehicleId: null,
  currentWorldMode: 'GARAGE',

  vehicleInspectionMode: false,
  hoveredVehiclePartId: null,
  selectedVehiclePartId: null,

  vehicleCoOwnershipMode: false,
  hoveredOwnerId: null,
  selectedOwnerId: null,

  vehicleBookingMode: false,

  vehicleHandoverMode: false,
  hoveredHandoverCheckpoint: null,
  selectedHandoverCheckpoint: null,

  selectZone: (zone) =>
    set({
      selectedZone: zone,
      selectedObjectId: zone,
      selectedVehicleId: zone === 'VEHICLE' ? 'EV01' : null,
      vehicleInspectionMode: false,
      selectedVehiclePartId: null,
      hoveredVehiclePartId: null,
      vehicleCoOwnershipMode: false,
      selectedOwnerId: null,
      hoveredOwnerId: null,
      vehicleBookingMode: false,
      vehicleHandoverMode: false,
      selectedHandoverCheckpoint: null,
      hoveredHandoverCheckpoint: null,
    }),

  hoverZone: (zone) =>
    set({
      hoveredZone: zone,
      hoveredObjectId: zone,
    }),

  selectVehicle: (id) =>
    set({
      selectedVehicleId: id,
      selectedZone: 'VEHICLE',
      selectedObjectId: id,
    }),

  hoverVehicle: (id) =>
    set({
      hoveredVehicleId: id,
      hoveredObjectId: id,
    }),

  selectObject: (id, position) =>
    set({
      selectedObjectId: id,
      selectedPosition: position,
    }),

  hoverObject: (id) =>
    set({
      hoveredObjectId: id,
    }),

  clearSelection: () =>
    set({
      selectedZone: null,
      selectedObjectId: null,
      selectedPosition: null,
      selectedVehicleId: null,
      hoveredVehicleId: null,
      vehicleInspectionMode: false,
      selectedVehiclePartId: null,
      hoveredVehiclePartId: null,
      vehicleCoOwnershipMode: false,
      selectedOwnerId: null,
      hoveredOwnerId: null,
      vehicleBookingMode: false,
      vehicleHandoverMode: false,
      selectedHandoverCheckpoint: null,
      hoveredHandoverCheckpoint: null,
    }),

  clearActiveSpatialSelection: () =>
    set((state) => {
      // 0a. In Handover mode: if a checkpoint is selected, deselect checkpoint while remaining in handover view
      // Camera orbit or right drag does not exit handover mode
      if (state.vehicleHandoverMode) {
        if (state.selectedHandoverCheckpoint) {
          return {
            selectedHandoverCheckpoint: null,
            hoveredHandoverCheckpoint: null,
          };
        }
        return {};
      }

      // 0b. In Booking mode: preserve booking view and selected time range
      if (state.vehicleBookingMode) {
        return {};
      }
      // 1. In Co-ownership mode: if an owner is selected, deselect owner while remaining in co-ownership view
      if (state.vehicleCoOwnershipMode) {
        if (state.selectedOwnerId) {
          return {
            selectedOwnerId: null,
            hoveredOwnerId: null,
          };
        }
        return {};
      }

      // 2. In Inspection mode: if a vehicle part is selected, deselect part while remaining in inspection view
      if (state.vehicleInspectionMode) {
        if (state.selectedVehiclePartId) {
          return {
            selectedVehiclePartId: null,
            hoveredVehiclePartId: null,
          };
        }
        return {};
      }

      // 3. In normal garage view: deselect active vehicle or zone
      return {
        selectedZone: null,
        selectedObjectId: null,
        selectedPosition: null,
        selectedVehicleId: null,
        hoveredVehicleId: null,
        selectedVehiclePartId: null,
        hoveredVehiclePartId: null,
        selectedOwnerId: null,
        hoveredOwnerId: null,
        selectedHandoverCheckpoint: null,
        hoveredHandoverCheckpoint: null,
      };
    }),

  setWorldMode: (mode) =>
    set({
      currentWorldMode: mode,
    }),

  enterVehicleInspectionMode: () =>
    set({
      vehicleInspectionMode: true,
      vehicleCoOwnershipMode: false,
      vehicleBookingMode: false,
      selectedVehicleId: 'EV01',
      selectedZone: 'VEHICLE',
      selectedVehiclePartId: null,
      hoveredVehiclePartId: null,
      selectedOwnerId: null,
      hoveredOwnerId: null,
    }),

  exitVehicleInspectionMode: () =>
    set({
      vehicleInspectionMode: false,
      selectedVehiclePartId: null,
      hoveredVehiclePartId: null,
    }),

  hoverVehiclePart: (id) =>
    set({
      hoveredVehiclePartId: id,
    }),

  selectVehiclePart: (id) =>
    set({
      selectedVehiclePartId: id,
    }),

  clearVehiclePartSelection: () =>
    set({
      selectedVehiclePartId: null,
      hoveredVehiclePartId: null,
    }),

  enterVehicleCoOwnershipMode: () =>
    set({
      vehicleCoOwnershipMode: true,
      vehicleInspectionMode: false,
      vehicleBookingMode: false,
      selectedVehicleId: 'EV01',
      selectedZone: 'VEHICLE',
      selectedVehiclePartId: null,
      hoveredVehiclePartId: null,
      selectedOwnerId: null,
      hoveredOwnerId: null,
    }),

  exitVehicleCoOwnershipMode: () =>
    set({
      vehicleCoOwnershipMode: false,
      selectedOwnerId: null,
      hoveredOwnerId: null,
    }),

  enterVehicleBookingMode: () =>
    set({
      vehicleBookingMode: true,
      vehicleCoOwnershipMode: false,
      vehicleInspectionMode: false,
      selectedVehicleId: 'EV01',
      selectedZone: 'VEHICLE',
      selectedVehiclePartId: null,
      hoveredVehiclePartId: null,
      selectedOwnerId: null,
      hoveredOwnerId: null,
    }),

  exitVehicleBookingMode: () =>
    set({
      vehicleBookingMode: false,
    }),

  hoverOwner: (id) =>
    set({
      hoveredOwnerId: id,
    }),

  selectOwner: (id) =>
    set({
      selectedOwnerId: id,
    }),

  clearOwnerSelection: () =>
    set({
      selectedOwnerId: null,
      hoveredOwnerId: null,
    }),

  enterVehicleHandoverMode: () =>
    set({
      vehicleHandoverMode: true,
      vehicleBookingMode: false,
      vehicleCoOwnershipMode: false,
      vehicleInspectionMode: false,
      selectedVehicleId: 'EV01',
      selectedZone: 'VEHICLE',
      selectedVehiclePartId: null,
      hoveredVehiclePartId: null,
      selectedOwnerId: null,
      hoveredOwnerId: null,
      selectedHandoverCheckpoint: null,
      hoveredHandoverCheckpoint: null,
    }),

  exitVehicleHandoverMode: () =>
    set({
      vehicleHandoverMode: false,
      selectedHandoverCheckpoint: null,
      hoveredHandoverCheckpoint: null,
    }),

  hoverHandoverCheckpoint: (code) =>
    set({
      hoveredHandoverCheckpoint: code,
    }),

  selectHandoverCheckpoint: (code) =>
    set({
      selectedHandoverCheckpoint: code,
    }),

  clearHandoverCheckpointSelection: () =>
    set({
      selectedHandoverCheckpoint: null,
      hoveredHandoverCheckpoint: null,
    }),
}));

