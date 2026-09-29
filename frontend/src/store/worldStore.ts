import { create } from 'zustand';
import { VehiclePartId } from '../types/vehiclePart';
import { DamageSeverity, DamageStatus } from '../types/damage';
import { useAuthStore } from './authStore';
import { canAccessZone, hasCapability } from '../utils/roleCapabilities';

export type GarageZone =
  | 'VEHICLE'
  | 'CHARGING'
  | 'MAINTENANCE'
  | 'FINANCE'
  | 'GOVERNANCE'
  | 'ANALYTICS'
  | 'AI';

export type WorldMode = 'GARAGE' | 'LOGIN' | 'REGISTER';

export type VehicleFeatureMode =
  | 'NONE'
  | 'CO_OWNER_VEHICLE_OVERVIEW'
  | 'STAFF_VEHICLE_OVERVIEW'
  | 'ADMIN_VEHICLE_OVERVIEW'
  | 'CO_OWNER_VEHICLE_INFO'
  | 'CO_OWNER_MY_BOOKINGS'
  | 'BOOKING'
  | 'CO_OWNERSHIP'
  | 'VEHICLE_EXPLORE'
  | 'RECEIPT'
  | 'CO_OWNER_RECEIPT_REVIEW'
  | 'TRIP_START'
  | 'TRIP_VISUALIZATION'
  | 'DAMAGE_MAPPING'
  | 'DAMAGE_HISTORY'
  | 'VEHICLE_MAINTENANCE';

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

export type PresetKey =
  | GarageZone
  | 'OVERVIEW'
  | 'VEHICLE_FOCUS'
  | 'VEHICLE_CO_OWNERSHIP'
  | 'VEHICLE_BOOKING'
  | 'VEHICLE_HANDOVER'
  | 'VEHICLE_TRIP_VISUALIZATION';

import {
  getGarageZoneCameraPreset,
  overviewCamera,
  vehicleZoneCamera,
  chargingZoneCamera,
  financeZoneCamera,
  aiZoneCamera,
  analyticsZoneCamera,
  maintenanceZoneCamera,
  governanceZoneCamera,
} from '../config/garageCameraConfig';

export const OPERATIONS_CAMERA_PRESETS: Record<PresetKey, CameraPreset> = {
  OVERVIEW: overviewCamera('OPERATIONS'),
  VEHICLE: vehicleZoneCamera('OPERATIONS'),
  VEHICLE_FOCUS: vehicleZoneCamera('OPERATIONS'),
  VEHICLE_CO_OWNERSHIP: {
    target: [0.6, 1.45, 0.5],
    position: [0.6, 3.4, 10.9],
  },
  VEHICLE_BOOKING: {
    target: [0.95, 1.15, 0.5],
    position: [0.95, 3.2, 12.0],
  },
  VEHICLE_HANDOVER: {
    target: [0.95, 1.09, 0.5],
    position: [0.95, 3.2, 10.7],
  },
  VEHICLE_TRIP_VISUALIZATION: {
    target: [0.95, 1.09, 0.5],
    position: [1.3, 3.3, 10.9],
  },
  CHARGING: chargingZoneCamera('OPERATIONS'),
  MAINTENANCE: maintenanceZoneCamera('OPERATIONS'),
  FINANCE: financeZoneCamera('OPERATIONS'),
  GOVERNANCE: governanceZoneCamera('OPERATIONS'),
  ANALYTICS: analyticsZoneCamera('OPERATIONS'),
  AI: aiZoneCamera('OPERATIONS'),
};

/**
 * Dedicated Camera Presets for CO_OWNER Presentation Mode
 * Reference layout:
 *                 [ TRỢ LÝ AI (-2.2, -4.2) ]
 * [ TÀI CHÍNH (-5.4, -0.6) ]         [ PHÂN TÍCH (3.0, -4.0) ]
 *                   [ EV01 (0.0, 1.8) ]    [ SẠC (5.0, 0.8) ]
 */
export const CO_OWNER_CAMERA_PRESETS: Record<PresetKey, CameraPreset> = {
  OVERVIEW: overviewCamera('CO_OWNER'),
  VEHICLE: vehicleZoneCamera('CO_OWNER'),
  VEHICLE_FOCUS: vehicleZoneCamera('CO_OWNER'),
  VEHICLE_CO_OWNERSHIP: {
    target: [0.6, 1.45, 1.8],
    position: [0.6, 3.4, 12.2],
  },
  VEHICLE_BOOKING: {
    target: [0.95, 1.15, 1.8],
    position: [0.95, 3.2, 13.3],
  },
  VEHICLE_HANDOVER: {
    target: [0.95, 1.09, 1.8],
    position: [0.95, 3.2, 12.0],
  },
  VEHICLE_TRIP_VISUALIZATION: {
    target: [0.95, 1.09, 1.8],
    position: [1.3, 3.3, 12.2],
  },
  CHARGING: chargingZoneCamera('CO_OWNER'),
  MAINTENANCE: maintenanceZoneCamera('CO_OWNER'),
  FINANCE: financeZoneCamera('CO_OWNER'),
  GOVERNANCE: governanceZoneCamera('CO_OWNER'),
  ANALYTICS: analyticsZoneCamera('CO_OWNER'),
  AI: aiZoneCamera('CO_OWNER'),
};

export const ZONE_CAMERA_PRESETS: Record<PresetKey, CameraPreset> = OPERATIONS_CAMERA_PRESETS;

export function getZoneCameraPreset(presetKey: PresetKey, role?: string): CameraPreset {
  const isCoOwner = !role || role === 'CO_OWNER';
  if (presetKey in CO_OWNER_CAMERA_PRESETS || presetKey in OPERATIONS_CAMERA_PRESETS) {
    return isCoOwner
      ? CO_OWNER_CAMERA_PRESETS[presetKey] || OPERATIONS_CAMERA_PRESETS[presetKey]
      : OPERATIONS_CAMERA_PRESETS[presetKey] || CO_OWNER_CAMERA_PRESETS[presetKey];
  }
  return getGarageZoneCameraPreset(presetKey, role);
}

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
  selectVehicle: (id: string | null, explicitRole?: string) => void;
  hoverVehicle: (id: string | null) => void;
  selectObject: (id: string, position: [number, number, number]) => void;
  hoverObject: (id: string | null) => void;
  clearSelection: () => void;
  clearActiveSpatialSelection: () => void;
  setWorldMode: (mode: WorldMode) => void;

  // 360-degree vehicle rotation turntable state
  vehicleYaw: number;
  setVehicleYaw: (yaw: number) => void;
  resetVehicleYaw: () => void;

  enterVehicleInspectionMode: (vehicleId?: string | null) => void;
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
  bookingSelectedDate: Date;
  bookingStartHour: number | null;
  bookingEndHour: number | null;
  setBookingSelectedDate: (date: Date) => void;
  setBookingSlot: (start: number | null, end: number | null) => void;
  clearBookingSelection: () => void;
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

  // Phase 09: Dedicated CO_OWNER Receipt Review Mode
  vehicleReceiptReviewMode: boolean;
  enterVehicleReceiptReviewMode: () => void;
  exitVehicleReceiptReviewMode: () => void;

  // Phase 10: Pure 3D Trip Start Mode
  vehicleTripStartMode: boolean;
  enterVehicleTripStartMode: () => void;
  exitVehicleTripStartMode: () => void;

  // Phase 11: Pure 3D Trip Visualization Mode
  vehicleTripVisualizationMode: boolean;
  selectedTripRouteNode: string | null;
  enterVehicleTripVisualizationMode: () => void;
  exitVehicleTripVisualizationMode: () => void;
  selectTripRouteNode: (nodeId: string | null) => void;

  // Phase 13: Pure 3D Damage Mapping Mode
  vehicleDamageMappingMode: boolean;
  selectedVehiclePartCode: string | null;
  selectedDamageId: string | null;
  draftDamage: { partCode: string; localPosition: [number, number, number] } | null;
  inspectionError: string | null;
  enterVehicleDamageMappingMode: (initialPartCode?: string | null) => void;
  exitVehicleDamageMappingMode: () => void;
  selectVehiclePartCode: (code: string | null) => void;
  selectVehiclePartWithPoint: (partCode: string, localPosition: [number, number, number]) => void;
  clearVehiclePartCode: () => void;
  exitPartInspection: () => void;
  selectDamageRecord: (id: string | null) => void;
  setDraftDamage: (draft: { partCode: string; localPosition: [number, number, number] } | null) => void;
  setInspectionError: (err: string | null) => void;

  // Phase 14: Pure 3D Damage History Mode
  vehicleDamageHistoryMode: boolean;
  damageHistorySeverityFilter: DamageSeverity | 'ALL';
  damageHistoryStatusFilter: DamageStatus | 'ALL';
  damageHistoryPartFilter: string | 'ALL';
  enterVehicleDamageHistoryMode: () => void;
  exitVehicleDamageHistoryMode: () => void;
  setDamageHistorySeverityFilter: (filter: DamageSeverity | 'ALL') => void;
  setDamageHistoryStatusFilter: (filter: DamageStatus | 'ALL') => void;
  setDamageHistoryPartFilter: (filter: string | 'ALL') => void;

  // Phase 15: Pure 3D Vehicle Maintenance Management Mode
  vehicleMaintenanceMode: boolean;
  selectedMaintenanceId: string | null;
  maintenanceDraftPreselectedDamageId: string | null;
  maintenanceDraftPreselectedPartCode: string | null;
  enterVehicleMaintenanceMode: (options?: { preselectedDamageId?: string; preselectedPartCode?: string }) => void;
  exitVehicleMaintenanceMode: () => void;
  selectMaintenanceRecord: (id: string | null) => void;

  resetExperienceState: () => void;

  // Explicit Vehicle Feature Mode (Single source of truth)
  vehicleFeatureMode: VehicleFeatureMode;
  vehicleMode: VehicleFeatureMode;
  activeExperience: 'CO_OWNER' | 'STAFF' | 'ADMIN' | null;
  isVehicleSelected: boolean;
  setVehicleFeatureMode: (mode: VehicleFeatureMode) => void;
  setVehicleMode: (mode: VehicleFeatureMode) => void;
  setActiveExperience: (exp: 'CO_OWNER' | 'STAFF' | 'ADMIN' | null) => void;
  returnToVehicleOverview: () => void;
  returnToGarageOverview: () => void;
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

  vehicleFeatureMode: 'NONE',
  vehicleMode: 'NONE',
  activeExperience: null,
  isVehicleSelected: false,

  vehicleInspectionMode: false,
  hoveredVehiclePartId: null,
  selectedVehiclePartId: null,

  vehicleCoOwnershipMode: false,
  hoveredOwnerId: null,
  selectedOwnerId: null,

  vehicleBookingMode: false,
  bookingSelectedDate: new Date(),
  bookingStartHour: null,
  bookingEndHour: null,
  setBookingSelectedDate: (date) => set({ bookingSelectedDate: date }),
  setBookingSlot: (start, end) => set({ bookingStartHour: start, bookingEndHour: end }),
  clearBookingSelection: () => set({ bookingStartHour: null, bookingEndHour: null }),

  vehicleHandoverMode: false,
  vehicleReceiptReviewMode: false,
  hoveredHandoverCheckpoint: null,
  selectedHandoverCheckpoint: null,

  vehicleTripStartMode: false,
  vehicleTripVisualizationMode: false,
  selectedTripRouteNode: null,

  vehicleDamageMappingMode: false,
  selectedVehiclePartCode: null,
  selectedDamageId: null,
  draftDamage: null,
  inspectionError: null,

  vehicleDamageHistoryMode: false,
  damageHistorySeverityFilter: 'ALL',
  damageHistoryStatusFilter: 'ALL',
  damageHistoryPartFilter: 'ALL',

  vehicleMaintenanceMode: false,
  selectedMaintenanceId: null,
  maintenanceDraftPreselectedDamageId: null,
  maintenanceDraftPreselectedPartCode: null,

  vehicleYaw: -0.32,
  setVehicleYaw: (yaw) => set({ vehicleYaw: yaw }),
  resetVehicleYaw: () => set({ vehicleYaw: -0.32 }),

  selectZone: (zone) =>
    set((state) => {
      let role: string | undefined;
      try {
        role = useAuthStore.getState().user?.role;
      } catch {
        role = 'CO_OWNER';
      }

      if (zone && !canAccessZone(role, zone)) {
        return {};
      }

      const vehicleTargetMode: VehicleFeatureMode =
        role === 'STAFF'
          ? 'STAFF_VEHICLE_OVERVIEW'
          : role === 'ADMIN'
          ? 'ADMIN_VEHICLE_OVERVIEW'
          : 'CO_OWNER_VEHICLE_OVERVIEW';

      const activeExp: 'CO_OWNER' | 'STAFF' | 'ADMIN' =
        role === 'STAFF' ? 'STAFF' : role === 'ADMIN' ? 'ADMIN' : 'CO_OWNER';

      const isVeh = zone === 'VEHICLE';

      return {
        selectedZone: zone,
        selectedObjectId: zone,
        selectedVehicleId: isVeh ? (state.selectedVehicleId || 'EV01') : null,
        isVehicleSelected: isVeh,
        activeExperience: isVeh ? activeExp : state.activeExperience,
        vehicleFeatureMode: isVeh ? vehicleTargetMode : 'NONE',
        vehicleMode: isVeh ? vehicleTargetMode : 'NONE',
        vehicleInspectionMode: false,
        selectedVehiclePartId: null,
        selectedVehiclePartCode: null,
        hoveredVehiclePartId: null,
        draftDamage: null,
        vehicleCoOwnershipMode: false,
        selectedOwnerId: null,
        hoveredOwnerId: null,
        vehicleBookingMode: false,
        vehicleHandoverMode: false,
        vehicleReceiptReviewMode: false,
        selectedHandoverCheckpoint: null,
        hoveredHandoverCheckpoint: null,
        vehicleTripStartMode: false,
        vehicleTripVisualizationMode: false,
        selectedTripRouteNode: null,
      };
    }),

  hoverZone: (zone) =>
    set({
      hoveredZone: zone,
      hoveredObjectId: zone,
    }),

  selectVehicle: (id, explicitRole) =>
    set((state) => {
      if (!id) {
        return {
          selectedVehicleId: null,
          selectedZone: null,
          selectedObjectId: null,
          vehicleFeatureMode: 'NONE',
          vehicleMode: 'NONE',
          isVehicleSelected: false,
        };
      }

      let role = explicitRole;
      if (!role) {
        try {
          role = useAuthStore.getState().user?.role;
        } catch {
          role = 'CO_OWNER';
        }
      }

      let targetMode: VehicleFeatureMode = 'CO_OWNER_VEHICLE_OVERVIEW';
      let activeExp: 'CO_OWNER' | 'STAFF' | 'ADMIN' = 'CO_OWNER';

      if (role === 'STAFF') {
        targetMode = 'STAFF_VEHICLE_OVERVIEW';
        activeExp = 'STAFF';
      } else if (role === 'ADMIN') {
        targetMode = 'ADMIN_VEHICLE_OVERVIEW';
        activeExp = 'ADMIN';
      } else {
        targetMode = 'CO_OWNER_VEHICLE_OVERVIEW';
        activeExp = 'CO_OWNER';
      }

      return {
        selectedVehicleId: id,
        selectedZone: 'VEHICLE',
        selectedObjectId: id,
        vehicleFeatureMode: targetMode,
        vehicleMode: targetMode,
        activeExperience: activeExp,
        isVehicleSelected: true,
        vehicleInspectionMode: false,
        selectedVehiclePartId: null,
        selectedVehiclePartCode: null,
        hoveredVehiclePartId: null,
        draftDamage: null,
        vehicleCoOwnershipMode: false,
        selectedOwnerId: null,
        hoveredOwnerId: null,
        vehicleBookingMode: false,
        vehicleHandoverMode: false,
        vehicleReceiptReviewMode: false,
        selectedHandoverCheckpoint: null,
        hoveredHandoverCheckpoint: null,
        vehicleTripStartMode: false,
        vehicleDamageHistoryMode: false,
        vehicleMaintenanceMode: false,
        selectedMaintenanceId: null,
        maintenanceDraftPreselectedDamageId: null,
        maintenanceDraftPreselectedPartCode: null,
      };
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
      vehicleFeatureMode: 'NONE',
      vehicleMode: 'NONE',
      isVehicleSelected: false,
      vehicleInspectionMode: false,
      selectedVehiclePartId: null,
      hoveredVehiclePartId: null,
      vehicleCoOwnershipMode: false,
      selectedOwnerId: null,
      hoveredOwnerId: null,
      vehicleBookingMode: false,
      vehicleHandoverMode: false,
      vehicleReceiptReviewMode: false,
      selectedHandoverCheckpoint: null,
      hoveredHandoverCheckpoint: null,
      vehicleTripStartMode: false,
      vehicleTripVisualizationMode: false,
      selectedTripRouteNode: null,
      vehicleDamageMappingMode: false,
      vehicleDamageHistoryMode: false,
      damageHistorySeverityFilter: 'ALL',
      damageHistoryPartFilter: 'ALL',
      vehicleMaintenanceMode: false,
      selectedMaintenanceId: null,
      maintenanceDraftPreselectedDamageId: null,
      maintenanceDraftPreselectedPartCode: null,
      selectedVehiclePartCode: null,
      selectedDamageId: null,
      draftDamage: null,
      inspectionError: null,
      vehicleYaw: -0.32,
    }),

  clearActiveSpatialSelection: () =>
    set((state) => {
      // 0a-0000. In Vehicle Maintenance mode: neutral click deselects selected damage record or maintenance record while keeping maintenance view open
      if (state.vehicleMaintenanceMode) {
        if (state.selectedDamageId || state.selectedMaintenanceId) {
          return {
            selectedDamageId: null,
            selectedVehiclePartCode: null,
            selectedVehiclePartId: null,
            selectedMaintenanceId: null,
          };
        }
        return {};
      }

      // 0a-000. In Damage History mode: neutral click deselects selected damage record while remaining in history view
      if (state.vehicleDamageHistoryMode) {
        if (state.selectedDamageId) {
          return {
            selectedDamageId: null,
            selectedVehiclePartCode: null,
            selectedVehiclePartId: null,
          };
        }
        return {};
      }

      // 0a-00. In Damage Mapping mode: preserve view and selection (camera movement or neutral click must not deselect)
      if (state.vehicleDamageMappingMode) {
        return {};
      }

      // 0a-0. In Trip Visualization / Checkout mode: preserve view
      if (state.vehicleTripVisualizationMode) {
        return {};
      }

      // 0a-1. In Trip Start mode: preserve view
      if (state.vehicleTripStartMode) {
        return {};
      }

      // 0a-2. In CO_OWNER Receipt Review mode: preserve view and deselect checkpoint if any
      // Camera orbit or right drag does not exit receipt review mode
      if (state.vehicleReceiptReviewMode) {
        if (state.selectedHandoverCheckpoint) {
          return {
            selectedHandoverCheckpoint: null,
            hoveredHandoverCheckpoint: null,
          };
        }
        return {};
      }

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
        vehicleFeatureMode: 'NONE',
        vehicleMode: 'NONE',
        isVehicleSelected: false,
        vehicleInspectionMode: false,
        selectedVehiclePartId: null,
        selectedVehiclePartCode: null,
        hoveredVehiclePartId: null,
        draftDamage: null,
        selectedOwnerId: null,
        hoveredOwnerId: null,
        selectedHandoverCheckpoint: null,
        hoveredHandoverCheckpoint: null,
        vehicleReceiptReviewMode: false,
        vehicleTripStartMode: false,
        vehicleDamageHistoryMode: false,
        damageHistorySeverityFilter: 'ALL',
        damageHistoryPartFilter: 'ALL',
        vehicleMaintenanceMode: false,
        selectedMaintenanceId: null,
        maintenanceDraftPreselectedDamageId: null,
        maintenanceDraftPreselectedPartCode: null,
        selectedDamageId: null,
      };
    }),

  setWorldMode: (mode) =>
    set({
      currentWorldMode: mode,
    }),

  enterVehicleInspectionMode: (vehicleId?: string | null) =>
    set((state) => {
      let role: string | undefined;
      try {
        role = useAuthStore.getState().user?.role;
      } catch {
        role = 'CO_OWNER';
      }
      if (!hasCapability(role, 'canExploreVehicle') && !hasCapability(role, 'canInspectForHandover')) return {};
      const targetVehicleId = vehicleId || state.selectedVehicleId || 'EV01';
      return {
        vehicleInspectionMode: true,
        vehicleFeatureMode: 'VEHICLE_EXPLORE',
        vehicleMode: 'VEHICLE_EXPLORE',
        isVehicleSelected: true,
        selectedZone: 'VEHICLE',
        selectedVehicleId: targetVehicleId,
        vehicleCoOwnershipMode: false,
        vehicleBookingMode: false,
        vehicleMaintenanceMode: false,
        vehicleDamageHistoryMode: false,
        vehicleDamageMappingMode: false,
        vehicleHandoverMode: false,
        vehicleReceiptReviewMode: false,
        vehicleTripStartMode: false,
        vehicleTripVisualizationMode: false,
        selectedTripRouteNode: null,
        selectedVehiclePartId: null,
        selectedVehiclePartCode: null,
        hoveredVehiclePartId: null,
        draftDamage: null,
        selectedOwnerId: null,
        hoveredOwnerId: null,
      };
    }),

  exitVehicleInspectionMode: () =>
    set((state) => {
      let role: string | undefined;
      try {
        role = useAuthStore.getState().user?.role;
      } catch {
        role = 'CO_OWNER';
      }
      const targetMode: VehicleFeatureMode =
        role === 'STAFF'
          ? 'STAFF_VEHICLE_OVERVIEW'
          : role === 'ADMIN'
          ? 'ADMIN_VEHICLE_OVERVIEW'
          : 'CO_OWNER_VEHICLE_OVERVIEW';

      return {
        vehicleInspectionMode: false,
        vehicleFeatureMode: targetMode,
        vehicleMode: targetMode,
        selectedVehiclePartId: null,
        selectedVehiclePartCode: null,
        hoveredVehiclePartId: null,
        draftDamage: null,
      };
    }),

  hoverVehiclePart: (id) =>
    set({
      hoveredVehiclePartId: id,
    }),

  selectVehiclePart: (id) =>
    set((state) => {
      // Semantic part selection only permitted during explore/inspection or damage mapping mode
      if (!state.vehicleInspectionMode && !state.vehicleDamageMappingMode) {
        return {};
      }
      return {
        selectedVehiclePartId: id,
        selectedVehiclePartCode: id || null,
        selectedZone: 'VEHICLE',
        isVehicleSelected: true,
        selectedVehicleId: state.selectedVehicleId || 'EV01',
        draftDamage: state.draftDamage?.partCode === id ? state.draftDamage : null,
      };
    }),

  clearVehiclePartSelection: () =>
    set({
      selectedVehiclePartId: null,
      selectedVehiclePartCode: null,
      hoveredVehiclePartId: null,
      draftDamage: null,
    }),

  enterVehicleCoOwnershipMode: () =>
    set((state) => {
      let role: string | undefined;
      try {
        role = useAuthStore.getState().user?.role;
      } catch {
        role = 'CO_OWNER';
      }
      if (!hasCapability(role, 'canViewOwnership')) return {};
      return {
        vehicleCoOwnershipMode: true,
        vehicleInspectionMode: false,
        vehicleBookingMode: false,
        selectedVehicleId: state.selectedVehicleId || 'EV01',
        selectedZone: 'VEHICLE',
        selectedVehiclePartId: null,
        hoveredVehiclePartId: null,
        selectedOwnerId: null,
        hoveredOwnerId: null,
      };
    }),

  exitVehicleCoOwnershipMode: () =>
    set({
      vehicleCoOwnershipMode: false,
      selectedOwnerId: null,
      hoveredOwnerId: null,
    }),

  enterVehicleBookingMode: () =>
    set((state) => {
      let role: string | undefined;
      try {
        role = useAuthStore.getState().user?.role;
      } catch {
        role = 'CO_OWNER';
      }
      if (!hasCapability(role, 'canBookVehicle')) return {};
      const today = new Date();
      if (today.getHours() >= 20) {
        today.setDate(today.getDate() + 1);
      }
      return {
        vehicleBookingMode: true,
        vehicleFeatureMode: 'BOOKING',
        vehicleMode: 'BOOKING',
        vehicleCoOwnershipMode: false,
        vehicleInspectionMode: false,
        isVehicleSelected: true,
        selectedVehicleId: state.selectedVehicleId || 'EV01',
        selectedZone: 'VEHICLE',
        selectedVehiclePartId: null,
        hoveredVehiclePartId: null,
        selectedOwnerId: null,
        hoveredOwnerId: null,
        bookingSelectedDate: state.bookingSelectedDate || today,
        bookingStartHour: null,
        bookingEndHour: null,
      };
    }),

  exitVehicleBookingMode: () =>
    set({
      vehicleBookingMode: false,
      bookingStartHour: null,
      bookingEndHour: null,
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
    set((state) => {
      let role: string | undefined;
      try {
        role = useAuthStore.getState().user?.role;
      } catch {
        role = 'CO_OWNER';
      }
      if (
        !hasCapability(role, 'canInspectForHandover') &&
        !hasCapability(role, 'canMonitorHandover') &&
        !hasCapability(role, 'canConfirmReceipt')
      ) {
        return {};
      }
      return {
        vehicleHandoverMode: true,
        vehicleReceiptReviewMode: false,
        vehicleBookingMode: false,
        vehicleCoOwnershipMode: false,
        vehicleInspectionMode: false,
        selectedVehicleId: state.selectedVehicleId || 'EV01',
        selectedZone: 'VEHICLE',
        selectedVehiclePartId: null,
        hoveredVehiclePartId: null,
        selectedOwnerId: null,
        hoveredOwnerId: null,
        selectedHandoverCheckpoint: null,
        hoveredHandoverCheckpoint: null,
      };
    }),

  exitVehicleHandoverMode: () =>
    set({
      vehicleHandoverMode: false,
      selectedHandoverCheckpoint: null,
      hoveredHandoverCheckpoint: null,
    }),

  enterVehicleReceiptReviewMode: () =>
    set((state) => {
      let role: string | undefined;
      try {
        role = useAuthStore.getState().user?.role;
      } catch {
        role = 'CO_OWNER';
      }
      if (!hasCapability(role, 'canConfirmReceipt')) return {};
      return {
        vehicleReceiptReviewMode: true,
        vehicleHandoverMode: false,
        vehicleBookingMode: false,
        vehicleCoOwnershipMode: false,
        vehicleInspectionMode: false,
        vehicleTripStartMode: false,
        vehicleTripVisualizationMode: false,
        vehicleFeatureMode: 'CO_OWNER_RECEIPT_REVIEW',
        vehicleMode: 'CO_OWNER_RECEIPT_REVIEW',
        selectedVehicleId: state.selectedVehicleId || 'EV01',
        selectedZone: 'VEHICLE',
        selectedHandoverCheckpoint: null,
        hoveredHandoverCheckpoint: null,
      };
    }),

  exitVehicleReceiptReviewMode: () =>
    set({
      vehicleReceiptReviewMode: false,
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

  enterVehicleTripStartMode: () =>
    set((state) => {
      let role: string | undefined;
      try {
        role = useAuthStore.getState().user?.role;
      } catch {
        role = 'CO_OWNER';
      }
      if (!hasCapability(role, 'canStartTrip')) return {};
      return {
        vehicleTripStartMode: true,
        vehicleTripVisualizationMode: false,
        selectedTripRouteNode: null,
        vehicleFeatureMode: 'TRIP_START',
        vehicleMode: 'TRIP_START',
        vehicleBookingMode: false,
        vehicleCoOwnershipMode: false,
        vehicleInspectionMode: false,
        vehicleHandoverMode: false,
        vehicleReceiptReviewMode: false,
        selectedVehicleId: state.selectedVehicleId || 'EV01',
        selectedZone: 'VEHICLE',
        selectedVehiclePartId: null,
        hoveredVehiclePartId: null,
        selectedOwnerId: null,
        hoveredOwnerId: null,
        selectedHandoverCheckpoint: null,
        hoveredHandoverCheckpoint: null,
      };
    }),

  exitVehicleTripStartMode: () =>
    set({
      vehicleTripStartMode: false,
    }),

  enterVehicleTripVisualizationMode: () =>
    set((state) => {
      return {
        vehicleTripVisualizationMode: true,
        vehicleTripStartMode: false,
        vehicleFeatureMode: 'TRIP_VISUALIZATION',
        vehicleMode: 'TRIP_VISUALIZATION',
        vehicleBookingMode: false,
        vehicleCoOwnershipMode: false,
        vehicleInspectionMode: false,
        vehicleHandoverMode: false,
        vehicleReceiptReviewMode: false,
        selectedVehicleId: state.selectedVehicleId || 'EV01',
        selectedZone: 'VEHICLE',
        selectedVehiclePartId: null,
        hoveredVehiclePartId: null,
        selectedOwnerId: null,
        hoveredOwnerId: null,
        selectedHandoverCheckpoint: null,
        hoveredHandoverCheckpoint: null,
        selectedTripRouteNode: 'CURRENT_PROGRESS',
      };
    }),

  exitVehicleTripVisualizationMode: () =>
    set({
      vehicleTripVisualizationMode: false,
      selectedTripRouteNode: null,
    }),

  selectTripRouteNode: (nodeId) =>
    set({
      selectedTripRouteNode: nodeId,
    }),

  enterVehicleDamageMappingMode: (initialPartCode?: string | null) =>
    set((state) => {
      let role: string | undefined;
      try {
        role = useAuthStore.getState().user?.role;
      } catch {
        role = 'STAFF';
      }
      if (!hasCapability(role, 'canViewDamage') && !hasCapability(role, 'canRecordDamage')) return {};
      const targetPartCode = initialPartCode !== undefined ? initialPartCode : state.selectedVehiclePartCode;
      return {
        vehicleDamageMappingMode: true,
        selectedVehiclePartCode: targetPartCode,
        selectedDamageId: null,
        draftDamage: null,
        vehicleFeatureMode: 'DAMAGE_MAPPING',
        vehicleMode: 'DAMAGE_MAPPING',
        vehicleBookingMode: false,
        vehicleCoOwnershipMode: false,
        vehicleInspectionMode: false,
        vehicleHandoverMode: false,
        vehicleReceiptReviewMode: false,
        vehicleTripStartMode: false,
        vehicleTripVisualizationMode: false,
        vehicleMaintenanceMode: false,
        selectedTripRouteNode: null,
        selectedVehicleId: state.selectedVehicleId || 'EV01',
        selectedZone: 'VEHICLE',
        selectedVehiclePartId: (targetPartCode as VehiclePartId) || null,
        hoveredVehiclePartId: null,
        selectedOwnerId: null,
        hoveredOwnerId: null,
        selectedHandoverCheckpoint: null,
        hoveredHandoverCheckpoint: null,
      };
    }),

  exitVehicleDamageMappingMode: () =>
    set({
      vehicleDamageMappingMode: false,
      selectedVehiclePartCode: null,
      selectedDamageId: null,
      draftDamage: null,
    }),

  enterVehicleDamageHistoryMode: () =>
    set((state) => {
      let role: string | undefined;
      try {
        role = useAuthStore.getState().user?.role;
      } catch {
        role = 'CO_OWNER';
      }
      if (!hasCapability(role, 'canViewDamage')) return {};
      return {
        vehicleDamageHistoryMode: true,
        vehicleMaintenanceMode: false,
        selectedMaintenanceId: null,
        maintenanceDraftPreselectedDamageId: null,
        maintenanceDraftPreselectedPartCode: null,
        vehicleDamageMappingMode: false,
        selectedVehiclePartCode: null,
        selectedDamageId: null,
        draftDamage: null,
        damageHistorySeverityFilter: 'ALL',
        damageHistoryStatusFilter: 'ALL',
        damageHistoryPartFilter: 'ALL',
        vehicleFeatureMode: 'DAMAGE_HISTORY',
        vehicleMode: 'DAMAGE_HISTORY',
        vehicleBookingMode: false,
        vehicleCoOwnershipMode: false,
        vehicleInspectionMode: false,
        vehicleHandoverMode: false,
        vehicleReceiptReviewMode: false,
        vehicleTripStartMode: false,
        vehicleTripVisualizationMode: false,
        selectedTripRouteNode: null,
        selectedVehicleId: state.selectedVehicleId || 'EV01',
        selectedZone: 'VEHICLE',
        selectedVehiclePartId: null,
        hoveredVehiclePartId: null,
        selectedOwnerId: null,
        hoveredOwnerId: null,
        selectedHandoverCheckpoint: null,
        hoveredHandoverCheckpoint: null,
      };
    }),

  exitVehicleDamageHistoryMode: () =>
    set((state) => {
      let role: string | undefined;
      try {
        role = useAuthStore.getState().user?.role;
      } catch {
        role = 'CO_OWNER';
      }
      const targetMode: VehicleFeatureMode =
        role === 'STAFF'
          ? 'STAFF_VEHICLE_OVERVIEW'
          : role === 'ADMIN'
          ? 'ADMIN_VEHICLE_OVERVIEW'
          : 'CO_OWNER_VEHICLE_OVERVIEW';
      return {
        vehicleDamageHistoryMode: false,
        vehicleFeatureMode: targetMode,
        vehicleMode: targetMode,
        selectedVehiclePartCode: null,
        selectedVehiclePartId: null,
        selectedDamageId: null,
        damageHistorySeverityFilter: 'ALL',
        damageHistoryStatusFilter: 'ALL',
        damageHistoryPartFilter: 'ALL',
      };
    }),

  setDamageHistorySeverityFilter: (filter) =>
    set({
      damageHistorySeverityFilter: filter,
    }),

  setDamageHistoryStatusFilter: (filter) =>
    set({
      damageHistoryStatusFilter: filter,
    }),

  setDamageHistoryPartFilter: (filter) =>
    set({
      damageHistoryPartFilter: filter,
    }),

  enterVehicleMaintenanceMode: (options) =>
    set((state) => {
      let role: string | undefined;
      try {
        role = useAuthStore.getState().user?.role;
      } catch {
        role = 'CO_OWNER';
      }
      if (!hasCapability(role, 'canViewMaintenance')) return {};
      return {
        vehicleMaintenanceMode: true,
        vehicleDamageHistoryMode: false,
        vehicleDamageMappingMode: false,
        selectedVehiclePartCode: options?.preselectedPartCode || null,
        selectedDamageId: options?.preselectedDamageId || null,
        draftDamage: null,
        selectedMaintenanceId: null,
        maintenanceDraftPreselectedDamageId: options?.preselectedDamageId || null,
        maintenanceDraftPreselectedPartCode: options?.preselectedPartCode || null,
        vehicleFeatureMode: 'VEHICLE_MAINTENANCE',
        vehicleMode: 'VEHICLE_MAINTENANCE',
        vehicleBookingMode: false,
        vehicleCoOwnershipMode: false,
        vehicleInspectionMode: false,
        vehicleHandoverMode: false,
        vehicleReceiptReviewMode: false,
        vehicleTripStartMode: false,
        vehicleTripVisualizationMode: false,
        selectedTripRouteNode: null,
        selectedVehicleId: state.selectedVehicleId || 'EV01',
        selectedZone: 'VEHICLE',
        selectedVehiclePartId: (options?.preselectedPartCode as VehiclePartId) || null,
        hoveredVehiclePartId: null,
        selectedOwnerId: null,
        hoveredOwnerId: null,
        selectedHandoverCheckpoint: null,
        hoveredHandoverCheckpoint: null,
      };
    }),

  exitVehicleMaintenanceMode: () =>
    set((state) => {
      let role: string | undefined;
      try {
        role = useAuthStore.getState().user?.role;
      } catch {
        role = 'CO_OWNER';
      }
      const targetMode: VehicleFeatureMode =
        role === 'STAFF'
          ? 'STAFF_VEHICLE_OVERVIEW'
          : role === 'ADMIN'
          ? 'ADMIN_VEHICLE_OVERVIEW'
          : 'CO_OWNER_VEHICLE_OVERVIEW';
      return {
        vehicleMaintenanceMode: false,
        vehicleFeatureMode: targetMode,
        vehicleMode: targetMode,
        selectedMaintenanceId: null,
        maintenanceDraftPreselectedDamageId: null,
        maintenanceDraftPreselectedPartCode: null,
        selectedDamageId: null,
        selectedVehiclePartCode: null,
        selectedVehiclePartId: null,
      };
    }),

  selectMaintenanceRecord: (id) =>
    set({
      selectedMaintenanceId: id,
    }),

  selectVehiclePartCode: (code) =>
    set({
      selectedVehiclePartCode: code,
      selectedVehiclePartId: (code as VehiclePartId) || null,
      selectedDamageId: null,
      inspectionError: null,
    }),

  selectVehiclePartWithPoint: (partCode, localPosition) =>
    set((state) => ({
      selectedVehiclePartCode: partCode,
      selectedVehiclePartId: (partCode as VehiclePartId) || null,
      selectedZone: 'VEHICLE',
      isVehicleSelected: true,
      selectedVehicleId: state.selectedVehicleId || 'EV01',
      draftDamage: {
        partCode,
        localPosition,
      },
      selectedDamageId: null,
      inspectionError: null,
    })),

  clearVehiclePartCode: () =>
    set({
      selectedVehiclePartCode: null,
      selectedVehiclePartId: null,
      draftDamage: null,
      inspectionError: null,
    }),

  exitPartInspection: () =>
    set({
      selectedVehiclePartCode: null,
      selectedVehiclePartId: null,
      draftDamage: null,
      selectedDamageId: null,
      inspectionError: null,
    }),

  selectDamageRecord: (id) =>
    set((state) => ({
      selectedDamageId: id,
      draftDamage: id ? null : state.draftDamage,
      inspectionError: null,
    })),

  setDraftDamage: (draft) =>
    set({
      draftDamage: draft,
      selectedDamageId: null,
      inspectionError: null,
    }),

  setInspectionError: (err) =>
    set({
      inspectionError: err,
    }),

  resetExperienceState: () =>
    set({
      selectedZone: null,
      hoveredZone: null,
      selectedObjectId: null,
      hoveredObjectId: null,
      selectedPosition: null,
      selectedVehicleId: null,
      hoveredVehicleId: null,
      currentWorldMode: 'GARAGE',
      vehicleFeatureMode: 'NONE',
      vehicleMode: 'NONE',
      activeExperience: null,
      isVehicleSelected: false,
      vehicleInspectionMode: false,
      hoveredVehiclePartId: null,
      selectedVehiclePartId: null,
      vehicleCoOwnershipMode: false,
      hoveredOwnerId: null,
      selectedOwnerId: null,
      vehicleBookingMode: false,
      vehicleHandoverMode: false,
      vehicleReceiptReviewMode: false,
      hoveredHandoverCheckpoint: null,
      selectedHandoverCheckpoint: null,
      vehicleTripStartMode: false,
      vehicleTripVisualizationMode: false,
      selectedTripRouteNode: null,
      vehicleDamageMappingMode: false,
      vehicleDamageHistoryMode: false,
      damageHistorySeverityFilter: 'ALL',
      damageHistoryPartFilter: 'ALL',
      vehicleMaintenanceMode: false,
      selectedMaintenanceId: null,
      maintenanceDraftPreselectedDamageId: null,
      maintenanceDraftPreselectedPartCode: null,
      selectedVehiclePartCode: null,
      selectedDamageId: null,
      draftDamage: null,
      inspectionError: null,
    }),

  setVehicleFeatureMode: (mode) =>
    set((state) => {
      let role: string | undefined;
      try {
        role = useAuthStore.getState().user?.role;
      } catch {
        role = 'CO_OWNER';
      }

      if (mode === 'BOOKING' && !hasCapability(role, 'canBookVehicle')) return {};
      if (mode === 'CO_OWNERSHIP' && !hasCapability(role, 'canViewOwnership')) return {};
      if (mode === 'VEHICLE_EXPLORE' && !hasCapability(role, 'canExploreVehicle')) return {};
      if ((mode === 'RECEIPT' || mode === 'CO_OWNER_RECEIPT_REVIEW') && !hasCapability(role, 'canConfirmReceipt')) return {};
      if (mode === 'CO_OWNER_MY_BOOKINGS' && !hasCapability(role, 'canViewMyBookings')) return {};
      if (mode === 'TRIP_START' && !hasCapability(role, 'canStartTrip')) return {};
      if (mode === 'DAMAGE_MAPPING' && !hasCapability(role, 'canViewDamage') && !hasCapability(role, 'canRecordDamage')) return {};
      if (mode === 'DAMAGE_HISTORY' && !hasCapability(role, 'canViewDamage')) return {};
      if (mode === 'VEHICLE_MAINTENANCE' && !hasCapability(role, 'canViewMaintenance')) return {};

      const isReceiptMode = mode === 'RECEIPT' || mode === 'CO_OWNER_RECEIPT_REVIEW';
      const isBooking = mode === 'BOOKING';
      const today = new Date();
      if (today.getHours() >= 20) {
        today.setDate(today.getDate() + 1);
      }
      return {
        vehicleFeatureMode: mode,
        vehicleMode: mode,
        vehicleBookingMode: isBooking,
        isVehicleSelected: isBooking ? true : state.isVehicleSelected,
        selectedZone: isBooking ? 'VEHICLE' : state.selectedZone,
        selectedVehicleId: isBooking ? (state.selectedVehicleId || 'EV01') : state.selectedVehicleId,
        bookingSelectedDate: isBooking ? (state.bookingSelectedDate || today) : state.bookingSelectedDate,
        bookingStartHour: isBooking ? null : state.bookingStartHour,
        bookingEndHour: isBooking ? null : state.bookingEndHour,
        vehicleCoOwnershipMode: mode === 'CO_OWNERSHIP',
        vehicleInspectionMode: mode === 'VEHICLE_EXPLORE',
        vehicleReceiptReviewMode: isReceiptMode && role === 'CO_OWNER',
        vehicleHandoverMode: (mode === 'RECEIPT' && role === 'STAFF') || (mode === 'STAFF_VEHICLE_OVERVIEW' && role === 'STAFF'),
        vehicleTripStartMode: mode === 'TRIP_START',
        vehicleTripVisualizationMode: mode === 'TRIP_VISUALIZATION',
        selectedTripRouteNode: mode === 'TRIP_VISUALIZATION' ? (state.selectedTripRouteNode || 'CURRENT_PROGRESS') : null,
        vehicleDamageMappingMode: mode === 'DAMAGE_MAPPING',
        vehicleDamageHistoryMode: mode === 'DAMAGE_HISTORY',
        vehicleMaintenanceMode: mode === 'VEHICLE_MAINTENANCE',
        selectedMaintenanceId: mode === 'VEHICLE_MAINTENANCE' ? state.selectedMaintenanceId : null,
        maintenanceDraftPreselectedDamageId: mode === 'VEHICLE_MAINTENANCE' ? state.maintenanceDraftPreselectedDamageId : null,
        maintenanceDraftPreselectedPartCode: mode === 'VEHICLE_MAINTENANCE' ? state.maintenanceDraftPreselectedPartCode : null,
        damageHistorySeverityFilter: mode === 'DAMAGE_HISTORY' ? state.damageHistorySeverityFilter : 'ALL',
        damageHistoryPartFilter: mode === 'DAMAGE_HISTORY' ? state.damageHistoryPartFilter : 'ALL',
        selectedDamageId: (mode === 'DAMAGE_MAPPING' || mode === 'DAMAGE_HISTORY' || mode === 'VEHICLE_MAINTENANCE') ? state.selectedDamageId : null,
        selectedVehiclePartId: (mode === 'DAMAGE_MAPPING' || mode === 'DAMAGE_HISTORY' || mode === 'VEHICLE_MAINTENANCE') ? state.selectedVehiclePartId : null,
        selectedVehiclePartCode: (mode === 'DAMAGE_MAPPING' || mode === 'DAMAGE_HISTORY' || mode === 'VEHICLE_MAINTENANCE') ? state.selectedVehiclePartCode : null,
        hoveredVehiclePartId: null,
        draftDamage: mode === 'DAMAGE_MAPPING' ? state.draftDamage : null,
      };
    }),

  setVehicleMode: (mode) =>
    set((state) => {
      let role: string | undefined;
      try {
        role = useAuthStore.getState().user?.role;
      } catch {
        role = 'CO_OWNER';
      }

      if (mode === 'BOOKING' && !hasCapability(role, 'canBookVehicle')) return {};
      if (mode === 'CO_OWNERSHIP' && !hasCapability(role, 'canViewOwnership')) return {};
      if (mode === 'VEHICLE_EXPLORE' && !hasCapability(role, 'canExploreVehicle')) return {};
      if ((mode === 'RECEIPT' || mode === 'CO_OWNER_RECEIPT_REVIEW') && !hasCapability(role, 'canConfirmReceipt')) return {};
      if (mode === 'CO_OWNER_MY_BOOKINGS' && !hasCapability(role, 'canViewMyBookings')) return {};
      if (mode === 'TRIP_START' && !hasCapability(role, 'canStartTrip')) return {};
      if (mode === 'DAMAGE_MAPPING' && !hasCapability(role, 'canViewDamage') && !hasCapability(role, 'canRecordDamage')) return {};
      if (mode === 'DAMAGE_HISTORY' && !hasCapability(role, 'canViewDamage')) return {};
      if (mode === 'VEHICLE_MAINTENANCE' && !hasCapability(role, 'canViewMaintenance')) return {};

      const isReceiptMode = mode === 'RECEIPT' || mode === 'CO_OWNER_RECEIPT_REVIEW';
      const isBooking = mode === 'BOOKING';
      const today = new Date();
      if (today.getHours() >= 20) {
        today.setDate(today.getDate() + 1);
      }
      return {
        vehicleFeatureMode: mode,
        vehicleMode: mode,
        vehicleBookingMode: isBooking,
        isVehicleSelected: isBooking ? true : state.isVehicleSelected,
        selectedZone: isBooking ? 'VEHICLE' : state.selectedZone,
        selectedVehicleId: isBooking ? (state.selectedVehicleId || 'EV01') : state.selectedVehicleId,
        bookingSelectedDate: isBooking ? (state.bookingSelectedDate || today) : state.bookingSelectedDate,
        bookingStartHour: isBooking ? null : state.bookingStartHour,
        bookingEndHour: isBooking ? null : state.bookingEndHour,
        vehicleCoOwnershipMode: mode === 'CO_OWNERSHIP',
        vehicleInspectionMode: mode === 'VEHICLE_EXPLORE',
        vehicleReceiptReviewMode: isReceiptMode && role === 'CO_OWNER',
        vehicleHandoverMode: (mode === 'RECEIPT' && role === 'STAFF') || (mode === 'STAFF_VEHICLE_OVERVIEW' && role === 'STAFF'),
        vehicleTripStartMode: mode === 'TRIP_START',
        vehicleTripVisualizationMode: mode === 'TRIP_VISUALIZATION',
        selectedTripRouteNode: mode === 'TRIP_VISUALIZATION' ? (state.selectedTripRouteNode || 'CURRENT_PROGRESS') : null,
        vehicleDamageMappingMode: mode === 'DAMAGE_MAPPING',
        vehicleDamageHistoryMode: mode === 'DAMAGE_HISTORY',
        vehicleMaintenanceMode: mode === 'VEHICLE_MAINTENANCE',
        selectedMaintenanceId: mode === 'VEHICLE_MAINTENANCE' ? state.selectedMaintenanceId : null,
        maintenanceDraftPreselectedDamageId: mode === 'VEHICLE_MAINTENANCE' ? state.maintenanceDraftPreselectedDamageId : null,
        maintenanceDraftPreselectedPartCode: mode === 'VEHICLE_MAINTENANCE' ? state.maintenanceDraftPreselectedPartCode : null,
        damageHistorySeverityFilter: mode === 'DAMAGE_HISTORY' ? state.damageHistorySeverityFilter : 'ALL',
        damageHistoryPartFilter: mode === 'DAMAGE_HISTORY' ? state.damageHistoryPartFilter : 'ALL',
        selectedDamageId: (mode === 'DAMAGE_MAPPING' || mode === 'DAMAGE_HISTORY' || mode === 'VEHICLE_MAINTENANCE') ? state.selectedDamageId : null,
        selectedVehiclePartId: (mode === 'DAMAGE_MAPPING' || mode === 'DAMAGE_HISTORY' || mode === 'VEHICLE_MAINTENANCE') ? state.selectedVehiclePartId : null,
        selectedVehiclePartCode: (mode === 'DAMAGE_MAPPING' || mode === 'DAMAGE_HISTORY' || mode === 'VEHICLE_MAINTENANCE') ? state.selectedVehiclePartCode : null,
        hoveredVehiclePartId: null,
        draftDamage: mode === 'DAMAGE_MAPPING' ? state.draftDamage : null,
      };
    }),

  setActiveExperience: (exp) =>
    set({
      activeExperience: exp,
    }),

  returnToVehicleOverview: () =>
    set((state) => {
      let role: string | undefined;
      try {
        role = useAuthStore.getState().user?.role;
      } catch {
        role = 'CO_OWNER';
      }

      const targetMode: VehicleFeatureMode =
        role === 'STAFF'
          ? 'STAFF_VEHICLE_OVERVIEW'
          : role === 'ADMIN'
          ? 'ADMIN_VEHICLE_OVERVIEW'
          : 'CO_OWNER_VEHICLE_OVERVIEW';

      const activeExp: 'CO_OWNER' | 'STAFF' | 'ADMIN' =
        role === 'STAFF' ? 'STAFF' : role === 'ADMIN' ? 'ADMIN' : 'CO_OWNER';

      return {
        vehicleFeatureMode: targetMode,
        vehicleMode: targetMode,
        activeExperience: activeExp,
        isVehicleSelected: true,
        vehicleBookingMode: false,
        bookingStartHour: null,
        bookingEndHour: null,
        vehicleCoOwnershipMode: false,
        vehicleInspectionMode: false,
        vehicleHandoverMode: false,
        vehicleReceiptReviewMode: false,
        vehicleTripStartMode: false,
        vehicleTripVisualizationMode: false,
        selectedTripRouteNode: null,
        vehicleDamageMappingMode: false,
        vehicleDamageHistoryMode: false,
        vehicleMaintenanceMode: false,
        selectedMaintenanceId: null,
        maintenanceDraftPreselectedDamageId: null,
        maintenanceDraftPreselectedPartCode: null,
        damageHistorySeverityFilter: 'ALL',
        damageHistoryPartFilter: 'ALL',
        selectedVehiclePartCode: null,
        selectedDamageId: null,
        draftDamage: null,
        selectedVehiclePartId: null,
        hoveredVehiclePartId: null,
        selectedOwnerId: null,
        hoveredOwnerId: null,
        selectedHandoverCheckpoint: null,
        hoveredHandoverCheckpoint: null,
        selectedZone: 'VEHICLE',
        selectedVehicleId: state.selectedVehicleId || 'EV01',
      };
    }),

  returnToGarageOverview: () =>
    set({
      selectedZone: null,
      selectedObjectId: null,
      selectedPosition: null,
      selectedVehicleId: null,
      hoveredVehicleId: null,
      vehicleFeatureMode: 'NONE',
      vehicleMode: 'NONE',
      activeExperience: null,
      isVehicleSelected: false,
      vehicleInspectionMode: false,
      selectedVehiclePartId: null,
      hoveredVehiclePartId: null,
      vehicleCoOwnershipMode: false,
      selectedOwnerId: null,
      hoveredOwnerId: null,
      vehicleBookingMode: false,
      vehicleHandoverMode: false,
      vehicleReceiptReviewMode: false,
      selectedHandoverCheckpoint: null,
      hoveredHandoverCheckpoint: null,
      vehicleTripStartMode: false,
      vehicleTripVisualizationMode: false,
      selectedTripRouteNode: null,
      vehicleDamageMappingMode: false,
      vehicleDamageHistoryMode: false,
      damageHistorySeverityFilter: 'ALL',
      damageHistoryPartFilter: 'ALL',
      vehicleMaintenanceMode: false,
      selectedMaintenanceId: null,
      maintenanceDraftPreselectedDamageId: null,
      maintenanceDraftPreselectedPartCode: null,
      selectedVehiclePartCode: null,
      selectedDamageId: null,
      draftDamage: null,
    }),
}));

let inspectionErrorTimer: any = null;
export const setTransientInspectionError = (msg: string) => {
  useWorldStore.getState().setInspectionError(msg);
  if (inspectionErrorTimer) clearTimeout(inspectionErrorTimer);
  inspectionErrorTimer = setTimeout(() => {
    useWorldStore.getState().setInspectionError(null);
  }, 3500);
};

