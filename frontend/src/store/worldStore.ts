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

export const ZONE_CAMERA_PRESETS: Record<GarageZone | 'OVERVIEW' | 'VEHICLE_FOCUS', CameraPreset> = {
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

  selectZone: (zone: GarageZone | null) => void;
  hoverZone: (zone: GarageZone | null) => void;
  selectVehicle: (id: string | null) => void;
  hoverVehicle: (id: string | null) => void;
  selectObject: (id: string, position: [number, number, number]) => void;
  hoverObject: (id: string | null) => void;
  clearSelection: () => void;
  setWorldMode: (mode: WorldMode) => void;

  enterVehicleInspectionMode: () => void;
  exitVehicleInspectionMode: () => void;
  hoverVehiclePart: (id: VehiclePartId | null) => void;
  selectVehiclePart: (id: VehiclePartId | null) => void;
  clearVehiclePartSelection: () => void;
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

  selectZone: (zone) =>
    set({
      selectedZone: zone,
      selectedObjectId: zone,
      selectedVehicleId: zone === 'VEHICLE' ? 'EV01' : null,
      vehicleInspectionMode: false,
      selectedVehiclePartId: null,
      hoveredVehiclePartId: null,
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
    }),

  setWorldMode: (mode) =>
    set({
      currentWorldMode: mode,
    }),

  enterVehicleInspectionMode: () =>
    set({
      vehicleInspectionMode: true,
      selectedVehicleId: 'EV01',
      selectedZone: 'VEHICLE',
      selectedVehiclePartId: null,
      hoveredVehiclePartId: null,
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
}));
