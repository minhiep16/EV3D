import { create } from 'zustand';
import { VehiclePartId } from '../types/vehiclePart';
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
  | 'TRIP_VISUALIZATION';

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
  GarageZone | 'OVERVIEW' | 'VEHICLE_FOCUS' | 'VEHICLE_CO_OWNERSHIP' | 'VEHICLE_BOOKING' | 'VEHICLE_HANDOVER' | 'VEHICLE_TRIP_VISUALIZATION',
  CameraPreset
> = {
  OVERVIEW: {
    target: [0, 0.5, 2],
    position: [0, 16, 24],
  },

  VEHICLE: {
    target: [-5.8, 1.0, 4.0],
    position: [-5.8, 4.4, 13.2],
  },

  VEHICLE_FOCUS: {
    target: [-5.8, 1.0, 4.0],
    position: [-5.8, 4.4, 13.2],
  },

  VEHICLE_CO_OWNERSHIP: {
    target: [-7.8, 1.35, 4.0],
    position: [-7.8, 4.0, 14.8],
  },

  VEHICLE_BOOKING: {
    target: [-4.6, 1.15, 4.0],
    position: [-4.6, 4.6, 14.2],
  },

  VEHICLE_HANDOVER: {
    target: [-5.6, 1.1, 4.0],
    position: [-5.6, 4.4, 13.5],
  },

  VEHICLE_TRIP_VISUALIZATION: {
    target: [-5.6, 1.1, 4.0],
    position: [-4.2, 4.2, 14.5],
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
  selectVehicle: (id: string | null, explicitRole?: string) => void;
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

  vehicleHandoverMode: false,
  vehicleReceiptReviewMode: false,
  hoveredHandoverCheckpoint: null,
  selectedHandoverCheckpoint: null,

  vehicleTripStartMode: false,
  vehicleTripVisualizationMode: false,
  selectedTripRouteNode: null,

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
    }),

  clearActiveSpatialSelection: () =>
    set((state) => {
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
        selectedVehiclePartId: null,
        hoveredVehiclePartId: null,
        selectedOwnerId: null,
        hoveredOwnerId: null,
        selectedHandoverCheckpoint: null,
        hoveredHandoverCheckpoint: null,
        vehicleReceiptReviewMode: false,
        vehicleTripStartMode: false,
      };
    }),

  setWorldMode: (mode) =>
    set({
      currentWorldMode: mode,
    }),

  enterVehicleInspectionMode: () =>
    set((state) => {
      let role: string | undefined;
      try {
        role = useAuthStore.getState().user?.role;
      } catch {
        role = 'CO_OWNER';
      }
      if (!hasCapability(role, 'canExploreVehicle')) return {};
      return {
        vehicleInspectionMode: true,
        vehicleCoOwnershipMode: false,
        vehicleBookingMode: false,
        selectedVehicleId: 'EV01',
        selectedZone: 'VEHICLE',
        selectedVehiclePartId: null,
        hoveredVehiclePartId: null,
        selectedOwnerId: null,
        hoveredOwnerId: null,
      };
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
        selectedVehicleId: 'EV01',
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
      return {
        vehicleBookingMode: true,
        vehicleCoOwnershipMode: false,
        vehicleInspectionMode: false,
        selectedVehicleId: 'EV01',
        selectedZone: 'VEHICLE',
        selectedVehiclePartId: null,
        hoveredVehiclePartId: null,
        selectedOwnerId: null,
        hoveredOwnerId: null,
      };
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
        selectedVehicleId: 'EV01',
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
        selectedVehicleId: 'EV01',
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
        selectedVehicleId: 'EV01',
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
        selectedVehicleId: 'EV01',
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

      const isReceiptMode = mode === 'RECEIPT' || mode === 'CO_OWNER_RECEIPT_REVIEW';
      return {
        vehicleFeatureMode: mode,
        vehicleMode: mode,
        vehicleBookingMode: mode === 'BOOKING',
        vehicleCoOwnershipMode: mode === 'CO_OWNERSHIP',
        vehicleInspectionMode: mode === 'VEHICLE_EXPLORE',
        vehicleReceiptReviewMode: isReceiptMode && role === 'CO_OWNER',
        vehicleHandoverMode: (mode === 'RECEIPT' && role === 'STAFF') || (mode === 'STAFF_VEHICLE_OVERVIEW' && role === 'STAFF'),
        vehicleTripStartMode: mode === 'TRIP_START',
        vehicleTripVisualizationMode: mode === 'TRIP_VISUALIZATION',
        selectedTripRouteNode: mode === 'TRIP_VISUALIZATION' ? (state.selectedTripRouteNode || 'CURRENT_PROGRESS') : null,
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

      const isReceiptMode = mode === 'RECEIPT' || mode === 'CO_OWNER_RECEIPT_REVIEW';
      return {
        vehicleFeatureMode: mode,
        vehicleMode: mode,
        vehicleBookingMode: mode === 'BOOKING',
        vehicleCoOwnershipMode: mode === 'CO_OWNERSHIP',
        vehicleInspectionMode: mode === 'VEHICLE_EXPLORE',
        vehicleReceiptReviewMode: isReceiptMode && role === 'CO_OWNER',
        vehicleHandoverMode: (mode === 'RECEIPT' && role === 'STAFF') || (mode === 'STAFF_VEHICLE_OVERVIEW' && role === 'STAFF'),
        vehicleTripStartMode: mode === 'TRIP_START',
        vehicleTripVisualizationMode: mode === 'TRIP_VISUALIZATION',
        selectedTripRouteNode: mode === 'TRIP_VISUALIZATION' ? (state.selectedTripRouteNode || 'CURRENT_PROGRESS') : null,
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
        vehicleCoOwnershipMode: false,
        vehicleInspectionMode: false,
        vehicleHandoverMode: false,
        vehicleReceiptReviewMode: false,
        vehicleTripStartMode: false,
        vehicleTripVisualizationMode: false,
        selectedTripRouteNode: null,
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
}));

