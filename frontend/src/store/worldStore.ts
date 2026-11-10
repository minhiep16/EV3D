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

export type ActiveGarageFeature =
  | 'NONE'
  | 'FINANCE'
  | 'AI_ASSISTANT'
  | 'ANALYTICS'
  | 'CHARGING';

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
  | 'VEHICLE_MAINTENANCE'
  | 'BATTERY_XRAY'
  | 'CHARGING'
  | 'CO_OWNER_VOTING'
  | 'CO_OWNER_CONTRACT';

export type PrimaryGaragePanel =
  | 'NONE'
  | 'VEHICLE_DETAIL'
  | 'NOTIFICATIONS'
  | 'FINANCE'
  | 'VOTING'
  | 'BOOKING'
  | 'MAINTENANCE'
  | 'DAMAGE'
  | 'BATTERY_XRAY'
  | 'CHARGING'
  | 'CO_OWNERSHIP'
  | 'VEHICLE_INFO'
  | 'MY_BOOKINGS'
  | 'CONTRACT'
  | 'ANALYTICS';

export type ActiveRightPanel =
  | null
  | 'staff-inspection'
  | 'coowner-damage-detail'
  | 'component-technical-info'
  | 'proposal-detail';

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
  fov?: number;
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
    target: [0.65, 1.09, 0.5],
    position: [0.45, 2.49, 10.5],
    fov: 40,
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
    target: [0.65, 1.09, 0.5],
    position: [0.45, 2.49, 10.5],
    fov: 40,
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
  activeFeature: ActiveGarageFeature;
  setActiveFeature: (feature: ActiveGarageFeature) => void;
  hoveredZone: GarageZone | null;
  selectedObjectId: string | null;
  hoveredObjectId: string | null;
  selectedPosition: [number, number, number] | null;
  selectedVehicleId: string | null;
  visibleVehicleLabelId: string | null;
  setVisibleVehicleLabelId: (id: string | null) => void;
  dismissVehicleLabel: () => void;
  hoveredVehicleId: string | null;
  currentWorldMode: WorldMode;

  // Phase 06 & 26: Vehicle Inspection Mode, 3D Hotspot Visibility & Part Selection State
  vehicleInspectionMode: boolean;
  setVehicleInspectionMode: (mode: boolean) => void;
  exitStaffInspection: () => void;
  isExplorationMode: boolean;
  enterCoOwnerExplorationMode: (vehicleId?: string | null) => void;
  exitCoOwnerExplorationMode: () => void;
  exploreHotspotsVisible: boolean;
  setExploreHotspotsVisible: (visible: boolean) => void;
  toggleExploreHotspotsVisible: () => void;
  hoveredVehiclePartId: VehiclePartId | null;
  selectedVehiclePartId: VehiclePartId | null;

  // Phase 07: Vehicle Co-Ownership Mode & Owner Selection State
  vehicleCoOwnershipMode: boolean;
  hoveredOwnerId: string | null;
  selectedOwnerId: string | null;

  selectZone: (zone: GarageZone | null) => void;
  hoverZone: (zone: GarageZone | null) => void;
  selectVehicle: (id: string | null, explicitRole?: string, openDetail?: boolean) => void;
  hoverVehicle: (id: string | null) => void;
  selectObject: (id: string, position: [number, number, number]) => void;
  hoverObject: (id: string | null) => void;
  clearSelection: () => void;
  clearActiveSpatialSelection: () => void;
  setWorldMode: (mode: WorldMode) => void;

  // Transient vehicle detail panel state (separated from authoritative vehicle selection)
  isVehicleDetailOpen: boolean;
  openVehicleDetail: () => void;
  closeVehicleDetail: () => void;
  setVehicleDetailOpen: (open: boolean) => void;
  isRegistrationReviewModalOpen: boolean;
  setRegistrationReviewModalOpen: (open: boolean) => void;
  isPaymentVerificationModalOpen: boolean;
  setPaymentVerificationModalOpen: (open: boolean) => void;
  activeStaffOperationModule: 'BATTERY' | 'MAINTENANCE' | 'HANDOVER' | 'RETURN' | 'INSPECTION_3D' | 'HISTORY' | null;
  setActiveStaffOperationModule: (
    module: 'BATTERY' | 'MAINTENANCE' | 'HANDOVER' | 'RETURN' | 'INSPECTION_3D' | 'HISTORY' | null
  ) => void;

  // Authoritative Single Active Primary Panel State (Section 9 & 12)
  activePrimaryPanel: PrimaryGaragePanel;
  previousGaragePanel: PrimaryGaragePanel | null;
  activeRightPanel: ActiveRightPanel;
  setActiveRightPanel: (panel: ActiveRightPanel) => void;
  openGaragePanel: (
    panel: PrimaryGaragePanel,
    options?: {
      vehicleId?: string | null;
      proposalId?: string | null;
      stationId?: string | null;
      maintenanceId?: string | null;
      initialPartCode?: string | null;
    }
  ) => void;
  closeGaragePanel: (panel?: PrimaryGaragePanel) => void;
  toggleNotifications: () => void;
  closeNotifications: () => void;
  openContractPanel: (vehicleId?: string | null) => void;
  closeContractPanel: () => void;

  // Phase 18: Finance detail modal state (Chi tháng này, Lịch sử chi phí, Bảng quỹ chung)
  isFinanceDetailModalOpen: boolean;
  setFinanceDetailModalOpen: (open: boolean) => void;

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
  bookingInspectedBooking: any | null;
  setBookingSelectedDate: (date: Date) => void;
  setBookingSlot: (start: number | null, end: number | null) => void;
  setBookingInspectedBooking: (booking: any | null) => void;
  clearBookingSelection: () => void;
  enterVehicleBookingMode: (vehicleId?: string | null) => void;
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
  selectDamageRecord: (id: string | null, partCode?: string | null) => void;
  isDamageDetailModalOpen: boolean;
  openDamageDetailModal: (damageId: string, partCode?: string | null) => void;
  closeDamageDetailModal: () => void;
  setDraftDamage: (draft: { partCode: string; localPosition: [number, number, number] } | null) => void;
  setInspectionError: (err: string | null) => void;

  // Phase 14: Pure 3D Damage History Mode
  vehicleDamageHistoryMode: boolean;
  damageHistorySeverityFilter: DamageSeverity | 'ALL';
  damageHistoryStatusFilter: DamageStatus | 'ALL';
  damageHistoryPartFilter: string | 'ALL';
  enterVehicleDamageHistoryMode: (vehicleId?: string | null) => void;
  exitVehicleDamageHistoryMode: () => void;
  setDamageHistorySeverityFilter: (filter: DamageSeverity | 'ALL') => void;
  setDamageHistoryStatusFilter: (filter: DamageStatus | 'ALL') => void;
  setDamageHistoryPartFilter: (filter: string | 'ALL') => void;

  // Phase 15: Pure 3D Vehicle Maintenance Management Mode
  vehicleMaintenanceMode: boolean;
  selectedMaintenanceId: string | null;
  maintenanceDraftPreselectedDamageId: string | null;
  maintenanceDraftPreselectedPartCode: string | null;
  enterVehicleMaintenanceMode: (options?: { preselectedDamageId?: string; preselectedPartCode?: string; vehicleId?: string | null }) => void;
  exitVehicleMaintenanceMode: () => void;
  selectMaintenanceRecord: (id: string | null) => void;

  // Phase 16: Pure 3D X-Ray Battery Health & High-Voltage System Mode
  vehicleBatteryXrayMode: boolean;
  enterBatteryXrayMode: (vehicleId?: string | null) => void;
  exitBatteryXrayMode: () => void;

  // Phase 17: 3D EV Charging Management Mode
  vehicleChargingMode: boolean;
  selectedChargingStationId: string | null;
  enterChargingMode: (vehicleId?: string | null, stationId?: string | null) => void;
  exitChargingMode: () => void;
  setSelectedChargingStation: (stationId: string | null) => void;

  // Phase 21: Co-Ownership Voting System Mode
  vehicleVotingMode: boolean;
  selectedProposalId: string | null;
  enterVehicleVotingMode: (options?: { vehicleId?: string | null; proposalId?: string | null }) => void;
  exitVehicleVotingMode: () => void;
  closeVotingPanel: () => void;
  selectProposalRecord: (id: string | null) => void;

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

export const useWorldStore = create<WorldState>((set, get) => ({
  selectedZone: null,
  activeFeature: 'NONE',
  setActiveFeature: (feature) => set({ activeFeature: feature }),
  hoveredZone: null,
  selectedObjectId: null,
  hoveredObjectId: null,
  selectedPosition: null,
  selectedVehicleId: null,
  visibleVehicleLabelId: null,
  setVisibleVehicleLabelId: (id) => set({ visibleVehicleLabelId: id }),
  dismissVehicleLabel: () => set({ visibleVehicleLabelId: null }),
  hoveredVehicleId: null,
  currentWorldMode: 'GARAGE',

  vehicleFeatureMode: 'NONE',
  vehicleMode: 'NONE',
  activeExperience: null,
  isVehicleSelected: false,
  activePrimaryPanel: 'NONE',
  previousGaragePanel: null,
  activeRightPanel: null,
  setActiveRightPanel: (panel) => set({ activeRightPanel: panel }),
  isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
  setRegistrationReviewModalOpen: (open) => set({ isRegistrationReviewModalOpen: open }),
  isPaymentVerificationModalOpen: false,
  setPaymentVerificationModalOpen: (open) => set({ isPaymentVerificationModalOpen: open }),
  activeStaffOperationModule: null,
  setActiveStaffOperationModule: (module) => set({ activeStaffOperationModule: module }),

  vehicleBatteryXrayMode: false,
  vehicleChargingMode: false,
  selectedChargingStationId: null,

  vehicleInspectionMode: false,
  setVehicleInspectionMode: (mode) => set({ vehicleInspectionMode: mode, exploreHotspotsVisible: mode }),
  exitStaffInspection: () =>
    set({
      vehicleInspectionMode: false,
      exploreHotspotsVisible: false,
      selectedVehiclePartId: null,
      selectedVehiclePartCode: null,
      hoveredVehiclePartId: null,
      activeStaffOperationModule: null,
      isVehicleDetailOpen: false,
      activePrimaryPanel: 'NONE',
    }),
  isExplorationMode: false,
  enterCoOwnerExplorationMode: (vehicleId?: string | null) =>
    set((state) => {
      const targetVehicleId = vehicleId || state.selectedVehicleId || 'EV01';
      return {
        isExplorationMode: true,
        exploreHotspotsVisible: true,
        selectedVehicleId: targetVehicleId,
        isVehicleSelected: true,
        selectedZone: 'VEHICLE',
        selectedVehiclePartId: null,
        selectedVehiclePartCode: null,
        hoveredVehiclePartId: null,
        vehicleFeatureMode: 'VEHICLE_EXPLORE',
        vehicleMode: 'VEHICLE_EXPLORE',
        isVehicleDetailOpen: false,
        activePrimaryPanel: 'NONE',
      };
    }),
  exitCoOwnerExplorationMode: () =>
    set(() => ({
      isExplorationMode: false,
      exploreHotspotsVisible: false,
      selectedVehiclePartId: null,
      selectedVehiclePartCode: null,
      hoveredVehiclePartId: null,
      vehicleFeatureMode: 'CO_OWNER_VEHICLE_OVERVIEW',
      vehicleMode: 'CO_OWNER_VEHICLE_OVERVIEW',
      isVehicleDetailOpen: true,
      activePrimaryPanel: 'VEHICLE_DETAIL',
    })),
  exploreHotspotsVisible: false,
  setExploreHotspotsVisible: (visible) => set({ exploreHotspotsVisible: visible }),
  toggleExploreHotspotsVisible: () =>
    set((state) => ({ exploreHotspotsVisible: !state.exploreHotspotsVisible })),
  hoveredVehiclePartId: null,
  selectedVehiclePartId: null,

  vehicleCoOwnershipMode: false,
  hoveredOwnerId: null,
  selectedOwnerId: null,

  vehicleBookingMode: false,
  bookingSelectedDate: new Date(),
  bookingStartHour: null,
  bookingEndHour: null,
  bookingInspectedBooking: null,
  setBookingSelectedDate: (date) =>
    set({ bookingSelectedDate: date, bookingInspectedBooking: null, bookingStartHour: null, bookingEndHour: null }),
  setBookingSlot: (start, end) =>
    set({ bookingStartHour: start, bookingEndHour: end, bookingInspectedBooking: null }),
  setBookingInspectedBooking: (booking) =>
    set({ bookingInspectedBooking: booking, bookingStartHour: null, bookingEndHour: null }),
  clearBookingSelection: () =>
    set({ bookingStartHour: null, bookingEndHour: null, bookingInspectedBooking: null }),

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
  isDamageDetailModalOpen: false,
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

  vehicleVotingMode: false,
  selectedProposalId: null,

  vehicleYaw: -0.32,
  setVehicleYaw: (yaw) => set({ vehicleYaw: yaw }),
  resetVehicleYaw: () => set({ vehicleYaw: -0.32 }),

  openVehicleDetail: () =>
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
        activePrimaryPanel: 'VEHICLE_DETAIL',
        previousGaragePanel: null,
        isVehicleDetailOpen: true,
        vehicleVotingMode: false,
        selectedProposalId: null,
        vehicleBookingMode: false,
        vehicleMaintenanceMode: false,
        selectedMaintenanceId: null,
        vehicleBatteryXrayMode: false,
        vehicleChargingMode: false,
        selectedChargingStationId: null,
        vehicleDamageHistoryMode: false,
        selectedDamageId: null,
  isDamageDetailModalOpen: false,
        vehicleCoOwnershipMode: false,
        vehicleInspectionMode: false,
        isExplorationMode: false,
        exploreHotspotsVisible: false,
        vehicleFeatureMode: targetMode,
        vehicleMode: targetMode,
      };
    }),
  closeVehicleDetail: () =>
    set((state) => ({
      activePrimaryPanel: state.activePrimaryPanel === 'VEHICLE_DETAIL' ? 'NONE' : state.activePrimaryPanel,
      isVehicleDetailOpen: false,
      isRegistrationReviewModalOpen: false,
      vehicleInspectionMode: false,
      exploreHotspotsVisible: false,
      selectedVehiclePartId: null,
      selectedVehiclePartCode: null,
      hoveredVehiclePartId: null,
      activeStaffOperationModule: null,
      vehicleDamageMappingMode: false,
      vehicleHandoverMode: false,
    })),
  setVehicleDetailOpen: (open) =>
    set((state) => {
      if (open) {
        return {
          activePrimaryPanel: 'VEHICLE_DETAIL',
          isVehicleDetailOpen: true,
          vehicleVotingMode: false,
          selectedProposalId: null,
        };
      }
      return {
        activePrimaryPanel: state.activePrimaryPanel === 'VEHICLE_DETAIL' ? 'NONE' : state.activePrimaryPanel,
        isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
      };
    }),

  isFinanceDetailModalOpen: false,
  setFinanceDetailModalOpen: (open) => set({ isFinanceDetailModalOpen: open }),

  selectZone: (zone) =>
    set((state) => {
      let role: string | undefined;
      try {
        role = useAuthStore.getState().user?.role;
      } catch {
        role = 'CO_OWNER';
      }
      role = role || 'CO_OWNER';

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

      const resolvedActiveFeature: ActiveGarageFeature =
        zone === 'FINANCE'
          ? 'FINANCE'
          : zone === 'AI'
          ? 'AI_ASSISTANT'
          : zone === 'ANALYTICS'
          ? 'ANALYTICS'
          : zone === 'CHARGING'
          ? 'CHARGING'
          : 'NONE';

      return {
        selectedZone: zone,
        activeFeature: resolvedActiveFeature,
        selectedObjectId: zone,
        selectedVehicleId: isVeh ? (state.selectedVehicleId || 'EV01') : null,
        isVehicleSelected: isVeh,
        isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
        activePrimaryPanel:
          zone === 'FINANCE'
            ? 'FINANCE'
            : zone === 'CHARGING'
            ? 'CHARGING'
            : zone === 'ANALYTICS'
            ? 'ANALYTICS'
            : (state.activePrimaryPanel === 'FINANCE' || state.activePrimaryPanel === 'CHARGING' || state.activePrimaryPanel === 'ANALYTICS')
            ? 'NONE'
            : state.activePrimaryPanel,
        previousGaragePanel: (zone === 'FINANCE' || zone === 'CHARGING' || zone === 'ANALYTICS') ? null : state.previousGaragePanel,
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
        isFinanceDetailModalOpen: false,
        // Purge cross-zone stale flags so no previous feature information remains
        selectedChargingStationId: zone === 'CHARGING' ? state.selectedChargingStationId : null,
        vehicleChargingMode: false,
        vehicleMaintenanceMode: false,
        vehicleBatteryXrayMode: false,
        vehicleDamageHistoryMode: false,
      };
    }),

  hoverZone: (zone) =>
    set({
      hoveredZone: zone,
      hoveredObjectId: zone,
    }),

  selectVehicle: (id, explicitRole, openDetail) =>
    set((state) => {
      if (!id) {
        return {
          selectedVehicleId: null,
          selectedZone: null,
          activeFeature: 'NONE',
          selectedObjectId: null,
          vehicleFeatureMode: 'NONE',
          vehicleMode: 'NONE',
          isVehicleSelected: false,
          activePrimaryPanel: 'NONE',
          isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
          vehicleVotingMode: false,
          selectedProposalId: null,
          bookingInspectedBooking: null,
          bookingStartHour: null,
          bookingEndHour: null,
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

      const shouldOpenDetail = openDetail ?? false;

      return {
        selectedVehicleId: id,
        selectedZone: 'VEHICLE',
        activeFeature: 'NONE',
        selectedObjectId: id,
        vehicleFeatureMode: targetMode,
        vehicleMode: targetMode,
        activeExperience: activeExp,
        isVehicleSelected: true,
        activePrimaryPanel: shouldOpenDetail ? 'VEHICLE_DETAIL' : (state.activePrimaryPanel === 'VEHICLE_DETAIL' ? 'NONE' : state.activePrimaryPanel),
        isVehicleDetailOpen: shouldOpenDetail,
        vehicleVotingMode: false,
        selectedProposalId: null,
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
        vehicleDamageHistoryMode: false,
        vehicleMaintenanceMode: false,
        selectedMaintenanceId: null,
        maintenanceDraftPreselectedDamageId: null,
        maintenanceDraftPreselectedPartCode: null,
        vehicleBatteryXrayMode: false,
        vehicleChargingMode: false,
        selectedChargingStationId: null,
      };
    }),

  hoverVehicle: (id) =>
    set((state) => {
      if (state.hoveredVehicleId === id) return state;
      return {
        hoveredVehicleId: id,
        hoveredObjectId: id,
      };
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
      activeFeature: 'NONE',
      selectedObjectId: null,
      selectedPosition: null,
      selectedVehicleId: null,
      visibleVehicleLabelId: null,
      hoveredVehicleId: null,
      vehicleFeatureMode: 'NONE',
      vehicleMode: 'NONE',
      isVehicleSelected: false,
      activePrimaryPanel: 'NONE',
      previousGaragePanel: null,
      isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
      isFinanceDetailModalOpen: false,
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
  isDamageDetailModalOpen: false,
      draftDamage: null,
      vehicleBatteryXrayMode: false,
      vehicleChargingMode: false,
      selectedChargingStationId: null,
      vehicleVotingMode: false,
      selectedProposalId: null,
      inspectionError: null,
      vehicleYaw: -0.32,
    }),

  clearActiveSpatialSelection: () =>
    set((state) => {
      // If a vehicle label is currently visible, dismiss it without deselecting the active vehicle
      if (state.visibleVehicleLabelId) {
        return {
          visibleVehicleLabelId: null,
        };
      }

      // In operations role (STAFF / ADMIN), clicking empty stage preserves the active vehicle on turntable
      let currentRole: string | undefined;
      try {
        currentRole = useAuthStore.getState().user?.role;
      } catch {
        currentRole = undefined;
      }
      if (
        currentRole === 'STAFF' ||
        currentRole === 'ADMIN' ||
        state.activeExperience === 'STAFF' ||
        state.activeExperience === 'ADMIN'
      ) {
        return {
          visibleVehicleLabelId: null,
        };
      }

      // In Vehicle Voting mode: preserve voting view
      if (state.vehicleVotingMode) {
        return {};
      }

      // 0a-00000. In Charging mode: preserve charging view
      if (state.vehicleChargingMode) {
        return {};
      }

      // 0a-0000. In Vehicle Maintenance mode: neutral click deselects selected damage record or maintenance record while keeping maintenance view open
      if (state.vehicleMaintenanceMode) {
        if (state.selectedDamageId || state.selectedMaintenanceId) {
          return {
            selectedDamageId: null,
  isDamageDetailModalOpen: false,
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
  isDamageDetailModalOpen: false,
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

      // 0a-00000. In Charging mode: preserve charging view
      if (state.vehicleChargingMode) {
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

      // 2. If a vehicle part / hotspot is selected: neutral click dismisses the hotspot card while keeping the vehicle view active
      if (state.selectedVehiclePartId || state.vehicleInspectionMode) {
        if (state.selectedVehiclePartId) {
          return {
            selectedVehiclePartId: null,
            selectedVehiclePartCode: null,
            hoveredVehiclePartId: null,
          };
        }
        if (state.vehicleInspectionMode) {
          return {};
        }
      }

      // 3. In normal garage view: deselect active vehicle or zone
      return {
        selectedZone: null,
        activeFeature: 'NONE',
        selectedObjectId: null,
        selectedPosition: null,
        selectedVehicleId: null,
        visibleVehicleLabelId: null,
        hoveredVehicleId: null,
        vehicleFeatureMode: 'NONE',
        vehicleMode: 'NONE',
        isVehicleSelected: false,
        isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
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
        vehicleTripVisualizationMode: false,
        vehicleDamageHistoryMode: false,
        damageHistorySeverityFilter: 'ALL',
        damageHistoryPartFilter: 'ALL',
        vehicleMaintenanceMode: false,
        selectedMaintenanceId: null,
        maintenanceDraftPreselectedDamageId: null,
        maintenanceDraftPreselectedPartCode: null,
        selectedDamageId: null,
  isDamageDetailModalOpen: false,
        vehicleBatteryXrayMode: false,
        vehicleChargingMode: false,
        selectedChargingStationId: null,
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
      const isOps = role === 'STAFF' || role === 'ADMIN';

      if (!isOps) {
        return {
          isExplorationMode: true,
          vehicleInspectionMode: false,
          exploreHotspotsVisible: true,
          activePrimaryPanel: 'NONE',
          isVehicleDetailOpen: false,
          vehicleFeatureMode: 'VEHICLE_EXPLORE',
          vehicleMode: 'VEHICLE_EXPLORE',
          isVehicleSelected: true,
          selectedZone: 'VEHICLE',
          selectedVehicleId: targetVehicleId,
          selectedVehiclePartId: null,
          selectedVehiclePartCode: null,
        };
      }

      return {
        vehicleInspectionMode: true,
        exploreHotspotsVisible: true,
        vehicleFeatureMode: 'VEHICLE_EXPLORE',
        vehicleMode: 'VEHICLE_EXPLORE',
        isVehicleSelected: true,
        selectedZone: 'VEHICLE',
        selectedVehicleId: targetVehicleId,
        isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
        vehicleBatteryXrayMode: false,
        vehicleChargingMode: false,
        selectedChargingStationId: null,
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
        activeRightPanel: null,
      };
    }),

  hoverVehiclePart: (id) =>
    set((state) => {
      if (state.hoveredVehiclePartId === id) return state;
      return {
        hoveredVehiclePartId: id,
      };
    }),

  selectVehiclePart: (id) =>
    set((state) => {
      let role: string | undefined;
      try {
        role = useAuthStore.getState().user?.role;
      } catch {
        role = 'CO_OWNER';
      }
      const isOps = role === 'STAFF' || role === 'ADMIN';
      // For operations roles, part selection only applies during inspection or damage mapping mode
      if (isOps && !state.vehicleInspectionMode && !state.vehicleDamageMappingMode) {
        return {};
      }
      const rightPanel: ActiveRightPanel = id
        ? isOps
          ? 'staff-inspection'
          : 'component-technical-info'
        : null;

      return {
        selectedVehiclePartId: id,
        selectedVehiclePartCode: id || null,
        selectedZone: 'VEHICLE',
        isVehicleSelected: true,
        selectedVehicleId: state.selectedVehicleId || 'EV01',
        draftDamage: state.draftDamage?.partCode === id ? state.draftDamage : null,
        isDamageDetailModalOpen: false,
        activeRightPanel: rightPanel,
      };
    }),

  clearVehiclePartSelection: () =>
    set((state) => ({
      selectedVehiclePartId: null,
      selectedVehiclePartCode: null,
      hoveredVehiclePartId: null,
      draftDamage: null,
      activeRightPanel:
        state.activeRightPanel === 'staff-inspection' || state.activeRightPanel === 'component-technical-info'
          ? null
          : state.activeRightPanel,
    })),

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

  enterVehicleBookingMode: (vehicleId?: string | null) =>
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
      const targetVehicleId = vehicleId || state.selectedVehicleId || 'EV01';
      return {
        activePrimaryPanel: 'BOOKING',
        vehicleBookingMode: true,
        vehicleFeatureMode: 'BOOKING',
        vehicleMode: 'BOOKING',
        isVehicleSelected: true,
        selectedVehicleId: targetVehicleId,
        selectedZone: 'VEHICLE',
        isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
        vehicleCoOwnershipMode: false,
        vehicleInspectionMode: false,
        isExplorationMode: false,
        exploreHotspotsVisible: false,
        vehicleHandoverMode: false,
        vehicleReceiptReviewMode: false,
        vehicleChargingMode: false,
        selectedChargingStationId: null,
        vehicleBatteryXrayMode: false,
        vehicleDamageMappingMode: false,
        vehicleDamageHistoryMode: false,
        vehicleMaintenanceMode: false,
        vehicleTripStartMode: false,
        vehicleTripVisualizationMode: false,
        selectedTripRouteNode: null,
        selectedDamageId: null,
  isDamageDetailModalOpen: false,
        draftDamage: null,
        selectedMaintenanceId: null,
        selectedVehiclePartId: null,
        selectedVehiclePartCode: null,
        hoveredVehiclePartId: null,
        selectedOwnerId: null,
        hoveredOwnerId: null,
        selectedHandoverCheckpoint: null,
        hoveredHandoverCheckpoint: null,
        bookingSelectedDate: state.bookingSelectedDate instanceof Date ? state.bookingSelectedDate : today,
        bookingStartHour: null,
        bookingEndHour: null,
        bookingInspectedBooking: null,
      };
    }),

  exitVehicleBookingMode: () =>
    set((state) => ({
      activePrimaryPanel: state.activePrimaryPanel === 'BOOKING' ? 'NONE' : state.activePrimaryPanel,
      vehicleBookingMode: false,
      bookingStartHour: null,
      bookingEndHour: null,
      bookingInspectedBooking: null,
    })),

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
        isExplorationMode: false,
        exploreHotspotsVisible: false,
        vehicleChargingMode: false,
        selectedChargingStationId: null,
        vehicleBatteryXrayMode: false,
        vehicleDamageMappingMode: false,
        vehicleDamageHistoryMode: false,
        vehicleMaintenanceMode: false,
        vehicleTripStartMode: false,
        vehicleTripVisualizationMode: false,
        selectedTripRouteNode: null,
        selectedDamageId: null,
  isDamageDetailModalOpen: false,
        draftDamage: null,
        selectedMaintenanceId: null,
        inspectionError: null,
        isVehicleSelected: true,
        selectedVehicleId: state.selectedVehicleId || 'EV01',
        selectedZone: 'VEHICLE',
        selectedVehiclePartId: null,
        selectedVehiclePartCode: null,
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
        activePrimaryPanel: 'NONE',
        previousGaragePanel: null,
        isVehicleDetailOpen: false,
        vehicleReceiptReviewMode: true,
        vehicleHandoverMode: false,
        vehicleBookingMode: false,
        vehicleCoOwnershipMode: false,
        vehicleInspectionMode: false,
        isExplorationMode: false,
        exploreHotspotsVisible: false,
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
        activePrimaryPanel: 'NONE',
        previousGaragePanel: null,
        isVehicleDetailOpen: false,
        vehicleTripStartMode: true,
        vehicleTripVisualizationMode: false,
        selectedTripRouteNode: null,
        vehicleFeatureMode: 'TRIP_START',
        vehicleMode: 'TRIP_START',
        vehicleBookingMode: false,
        vehicleCoOwnershipMode: false,
        vehicleInspectionMode: false,
        isExplorationMode: false,
        exploreHotspotsVisible: false,
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
        activePrimaryPanel: 'NONE',
        previousGaragePanel: null,
        isVehicleDetailOpen: false,
        vehicleTripVisualizationMode: true,
        vehicleTripStartMode: false,
        vehicleFeatureMode: 'TRIP_VISUALIZATION',
        vehicleMode: 'TRIP_VISUALIZATION',
        vehicleBookingMode: false,
        vehicleCoOwnershipMode: false,
        vehicleInspectionMode: false,
        isExplorationMode: false,
        exploreHotspotsVisible: false,
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
  isDamageDetailModalOpen: false,
        draftDamage: null,
        vehicleFeatureMode: 'DAMAGE_MAPPING',
        vehicleMode: 'DAMAGE_MAPPING',
        vehicleBookingMode: false,
        vehicleCoOwnershipMode: false,
        vehicleInspectionMode: false,
        isExplorationMode: false,
        exploreHotspotsVisible: false,
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
  isDamageDetailModalOpen: false,
      draftDamage: null,
    }),

  enterVehicleDamageHistoryMode: (vehicleId?: string | null) =>
    set((state) => {
      let role: string | undefined;
      try {
        role = useAuthStore.getState().user?.role;
      } catch {
        role = 'CO_OWNER';
      }
      if (!hasCapability(role, 'canViewDamage')) return {};
      const targetVehicleId = vehicleId || state.selectedVehicleId || 'EV01';
      return {
        activePrimaryPanel: 'DAMAGE',
        vehicleDamageHistoryMode: true,
        vehicleMaintenanceMode: false,
        selectedMaintenanceId: null,
        maintenanceDraftPreselectedDamageId: null,
        maintenanceDraftPreselectedPartCode: null,
        vehicleDamageMappingMode: false,
        selectedVehiclePartCode: null,
        selectedDamageId: null,
  isDamageDetailModalOpen: false,
        draftDamage: null,
        damageHistorySeverityFilter: 'ALL',
        damageHistoryStatusFilter: 'ALL',
        damageHistoryPartFilter: 'ALL',
        vehicleFeatureMode: 'DAMAGE_HISTORY',
        vehicleMode: 'DAMAGE_HISTORY',
        isVehicleSelected: true,
        selectedVehicleId: targetVehicleId,
        selectedZone: 'VEHICLE',
        isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
        vehicleBatteryXrayMode: false,
        vehicleChargingMode: false,
        selectedChargingStationId: null,
        vehicleBookingMode: false,
        vehicleCoOwnershipMode: false,
        vehicleInspectionMode: false,
        isExplorationMode: false,
        exploreHotspotsVisible: false,
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
  isDamageDetailModalOpen: false,
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
      const targetVehicleId = options?.vehicleId || state.selectedVehicleId || 'EV01';
      return {
        activePrimaryPanel: 'MAINTENANCE',
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
        isVehicleSelected: true,
        selectedVehicleId: targetVehicleId,
        selectedZone: 'VEHICLE',
        isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
        vehicleBatteryXrayMode: false,
        vehicleChargingMode: false,
        selectedChargingStationId: null,
        vehicleBookingMode: false,
        vehicleCoOwnershipMode: false,
        vehicleInspectionMode: false,
        isExplorationMode: false,
        exploreHotspotsVisible: false,
        vehicleHandoverMode: false,
        vehicleReceiptReviewMode: false,
        vehicleTripStartMode: false,
        vehicleTripVisualizationMode: false,
        selectedTripRouteNode: null,
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
        activePrimaryPanel: state.activePrimaryPanel === 'MAINTENANCE' ? 'NONE' : state.activePrimaryPanel,
        vehicleMaintenanceMode: false,
        vehicleFeatureMode: targetMode,
        vehicleMode: targetMode,
        selectedMaintenanceId: null,
        maintenanceDraftPreselectedDamageId: null,
        maintenanceDraftPreselectedPartCode: null,
        selectedDamageId: null,
  isDamageDetailModalOpen: false,
        selectedVehiclePartCode: null,
        selectedVehiclePartId: null,
      };
    }),

  selectMaintenanceRecord: (id) =>
    set({
      selectedMaintenanceId: id,
    }),

  enterBatteryXrayMode: (vehicleId) =>
    set((state) => {
      let role: string | undefined;
      try {
        role = useAuthStore.getState().user?.role;
      } catch {
        role = 'CO_OWNER';
      }
      if (!hasCapability(role, 'canViewBatteryHealth')) return {};

      const targetVehicleId = vehicleId || state.selectedVehicleId || 'EV01';
      return {
        vehicleBatteryXrayMode: true,
        vehicleFeatureMode: 'BATTERY_XRAY',
        vehicleMode: 'BATTERY_XRAY',
        isVehicleSelected: true,
        selectedVehicleId: targetVehicleId,
        selectedZone: 'VEHICLE',
        selectedVehiclePartId: 'BATTERY',
        selectedVehiclePartCode: 'BATTERY',
        hoveredVehiclePartId: null,
        vehicleBookingMode: false,
        bookingStartHour: null,
        bookingEndHour: null,
        vehicleCoOwnershipMode: false,
        vehicleInspectionMode: false,
        isExplorationMode: false,
        exploreHotspotsVisible: false,
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
        selectedDamageId: null,
  isDamageDetailModalOpen: false,
        draftDamage: null,
        inspectionError: null,
        selectedOwnerId: null,
        hoveredOwnerId: null,
        selectedHandoverCheckpoint: null,
        hoveredHandoverCheckpoint: null,
      };
    }),

  exitBatteryXrayMode: () =>
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
        vehicleBatteryXrayMode: false,
        vehicleFeatureMode: targetMode,
        vehicleMode: targetMode,
        selectedVehiclePartId: null,
        selectedVehiclePartCode: null,
        hoveredVehiclePartId: null,
      };
    }),

  enterChargingMode: (vehicleId, stationId) =>
    set((state) => {
      let role: string | undefined;
      try {
        role = useAuthStore.getState().user?.role;
      } catch {
        role = 'CO_OWNER';
      }
      if (!hasCapability(role, 'canManageCharging')) return {};

      const targetVehicleId = vehicleId || state.selectedVehicleId || 'EV01';
      return {
        vehicleChargingMode: true,
        selectedChargingStationId: stationId || state.selectedChargingStationId || 'CS01',
        vehicleFeatureMode: 'CHARGING',
        vehicleMode: 'CHARGING',
        activePrimaryPanel: 'CHARGING',
        isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
        isVehicleSelected: true,
        selectedVehicleId: targetVehicleId,
        selectedZone: 'VEHICLE',
        selectedVehiclePartId: 'CHARGING_PORT',
        selectedVehiclePartCode: 'CHARGING_PORT',
        hoveredVehiclePartId: null,
        vehicleBatteryXrayMode: false,
        vehicleBookingMode: false,
        bookingStartHour: null,
        bookingEndHour: null,
        vehicleCoOwnershipMode: false,
        vehicleInspectionMode: false,
        isExplorationMode: false,
        exploreHotspotsVisible: false,
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
        selectedDamageId: null,
  isDamageDetailModalOpen: false,
        draftDamage: null,
        inspectionError: null,
        selectedOwnerId: null,
        hoveredOwnerId: null,
        selectedHandoverCheckpoint: null,
        hoveredHandoverCheckpoint: null,
      };
    }),

  exitChargingMode: () =>
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
        vehicleChargingMode: false,
        selectedChargingStationId: null,
        activePrimaryPanel: state.activePrimaryPanel === 'CHARGING' ? 'NONE' : state.activePrimaryPanel,
        vehicleFeatureMode: targetMode,
        vehicleMode: targetMode,
        selectedVehiclePartId: null,
        selectedVehiclePartCode: null,
        hoveredVehiclePartId: null,
      };
    }),

  setSelectedChargingStation: (stationId) =>
    set((state) => ({
      selectedChargingStationId: stationId,
      selectedZone: stationId ? 'CHARGING' : (state.selectedZone === 'CHARGING' ? null : state.selectedZone),
      activeFeature: stationId ? 'CHARGING' : (state.activeFeature === 'CHARGING' ? 'NONE' : state.activeFeature),
      isFinanceDetailModalOpen: false,
    })),

  enterVehicleVotingMode: (options) =>
    set((state) => {
      const targetVehicleId = options?.vehicleId || state.selectedVehicleId || 'EV01';
      return {
        activePrimaryPanel: 'VOTING',
        vehicleVotingMode: true,
        selectedProposalId: options?.proposalId || null,
        vehicleFeatureMode: 'CO_OWNER_VOTING',
        vehicleMode: 'CO_OWNER_VOTING',
        isVehicleSelected: true,
        selectedVehicleId: targetVehicleId,
        selectedZone: 'VEHICLE',
        isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
        vehicleMaintenanceMode: false,
        selectedMaintenanceId: null,
        vehicleBatteryXrayMode: false,
        vehicleChargingMode: false,
        selectedChargingStationId: null,
        vehicleBookingMode: false,
        vehicleCoOwnershipMode: false,
        vehicleInspectionMode: false,
        isExplorationMode: false,
        exploreHotspotsVisible: false,
        vehicleHandoverMode: false,
        vehicleReceiptReviewMode: false,
        vehicleTripStartMode: false,
        vehicleTripVisualizationMode: false,
        vehicleDamageMappingMode: false,
        vehicleDamageHistoryMode: false,
      };
    }),

  exitVehicleVotingMode: () =>
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
        activePrimaryPanel: 'NONE',
        vehicleVotingMode: false,
        selectedProposalId: null,
        vehicleFeatureMode: targetMode,
        vehicleMode: targetMode,
        isVehicleSelected: true,
        isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
      };
    }),

  closeVotingPanel: () =>
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
        activePrimaryPanel: 'NONE',
        vehicleVotingMode: false,
        selectedProposalId: null,
        vehicleFeatureMode: targetMode,
        vehicleMode: targetMode,
        isVehicleSelected: true,
        isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
      };
    }),

  openContractPanel: (vehicleId) =>
    get().openGaragePanel('CONTRACT', { vehicleId }),

  closeContractPanel: () =>
    get().closeGaragePanel('CONTRACT'),

  openGaragePanel: (targetPanel, options) =>
    set((state) => {
      let role: string | undefined;
      try {
        role = useAuthStore.getState().user?.role;
      } catch {
        role = 'CO_OWNER';
      }
      const targetVehicleId = options?.vehicleId || state.selectedVehicleId || 'EV01';
      const defaultOverviewMode: VehicleFeatureMode =
        role === 'STAFF'
          ? 'STAFF_VEHICLE_OVERVIEW'
          : role === 'ADMIN'
          ? 'ADMIN_VEHICLE_OVERVIEW'
          : 'CO_OWNER_VEHICLE_OVERVIEW';

      if (targetPanel === 'NONE') {
        return {
          activePrimaryPanel: 'NONE',
          previousGaragePanel: null,
          isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
          vehicleVotingMode: false,
          selectedProposalId: null,
          bookingInspectedBooking: null,
          bookingStartHour: null,
          bookingEndHour: null,
          vehicleBookingMode: false,
          vehicleMaintenanceMode: false,
          selectedMaintenanceId: null,
          vehicleBatteryXrayMode: false,
          vehicleChargingMode: false,
          selectedChargingStationId: null,
          vehicleDamageHistoryMode: false,
          selectedDamageId: null,
          isDamageDetailModalOpen: false,
          vehicleCoOwnershipMode: false,
          vehicleInspectionMode: false,
          vehicleFeatureMode: 'NONE',
          vehicleMode: 'NONE',
        };
      }

      if (targetPanel === 'NOTIFICATIONS') {
        const prev =
          state.activePrimaryPanel !== 'NOTIFICATIONS' && state.activePrimaryPanel !== 'NONE'
            ? state.activePrimaryPanel
            : (state.isVehicleDetailOpen ? 'VEHICLE_DETAIL' : state.previousGaragePanel);
        return {
          previousGaragePanel: prev,
          activePrimaryPanel: 'NOTIFICATIONS',
          isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
          vehicleVotingMode: false,
          selectedProposalId: null,
          bookingInspectedBooking: null,
          bookingStartHour: null,
          bookingEndHour: null,
          vehicleBookingMode: false,
          vehicleMaintenanceMode: false,
          selectedMaintenanceId: null,
          vehicleBatteryXrayMode: false,
          vehicleChargingMode: false,
          selectedChargingStationId: null,
          vehicleDamageHistoryMode: false,
          selectedDamageId: null,
          isDamageDetailModalOpen: false,
          vehicleCoOwnershipMode: false,
          vehicleInspectionMode: false,
        };
      }

      if (targetPanel === 'FINANCE') {
        return {
          activePrimaryPanel: 'FINANCE',
          selectedZone: 'FINANCE',
          activeFeature: 'FINANCE',
          previousGaragePanel: null,
          isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
          vehicleVotingMode: false,
          selectedProposalId: null,
          bookingInspectedBooking: null,
          bookingStartHour: null,
          bookingEndHour: null,
          vehicleBookingMode: false,
          vehicleMaintenanceMode: false,
          selectedMaintenanceId: null,
          vehicleBatteryXrayMode: false,
          vehicleChargingMode: false,
          selectedChargingStationId: null,
          vehicleDamageHistoryMode: false,
          selectedDamageId: null,
          isDamageDetailModalOpen: false,
          vehicleCoOwnershipMode: false,
          vehicleInspectionMode: false,
        };
      }

      if (targetPanel === 'ANALYTICS') {
        return {
          activePrimaryPanel: 'ANALYTICS',
          selectedZone: 'ANALYTICS',
          activeFeature: 'ANALYTICS',
          previousGaragePanel: null,
          isVehicleDetailOpen: false,
          isRegistrationReviewModalOpen: false,
          vehicleVotingMode: false,
          selectedProposalId: null,
          bookingInspectedBooking: null,
          bookingStartHour: null,
          bookingEndHour: null,
          vehicleBookingMode: false,
          vehicleMaintenanceMode: false,
          selectedMaintenanceId: null,
          vehicleBatteryXrayMode: false,
          vehicleChargingMode: false,
          selectedChargingStationId: null,
          vehicleDamageHistoryMode: false,
          selectedDamageId: null,
          isDamageDetailModalOpen: false,
          vehicleCoOwnershipMode: false,
          vehicleInspectionMode: false,
        };
      }

      if (targetPanel === 'VEHICLE_DETAIL') {
        return {
          activePrimaryPanel: 'VEHICLE_DETAIL',
          isVehicleDetailOpen: true,
          isVehicleSelected: true,
          selectedZone: 'VEHICLE',
          selectedVehicleId: targetVehicleId,
          vehicleFeatureMode: defaultOverviewMode,
          vehicleMode: defaultOverviewMode,
          vehicleVotingMode: false,
          selectedProposalId: null,
          vehicleBookingMode: false,
          vehicleMaintenanceMode: false,
          selectedMaintenanceId: null,
          vehicleBatteryXrayMode: false,
          vehicleChargingMode: false,
          selectedChargingStationId: null,
          vehicleDamageHistoryMode: false,
          selectedDamageId: null,
  isDamageDetailModalOpen: false,
          vehicleCoOwnershipMode: false,
          vehicleInspectionMode: false,
          selectedVehiclePartId: null,
          selectedVehiclePartCode: null,
        };
      }

      if (targetPanel === 'VOTING') {
        return {
          activePrimaryPanel: 'VOTING',
          isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
          isVehicleSelected: true,
          selectedZone: 'VEHICLE',
          selectedVehicleId: targetVehicleId,
          vehicleVotingMode: true,
          selectedProposalId: options?.proposalId || null,
          vehicleFeatureMode: 'CO_OWNER_VOTING',
          vehicleMode: 'CO_OWNER_VOTING',
          vehicleBookingMode: false,
          vehicleMaintenanceMode: false,
          selectedMaintenanceId: null,
          vehicleBatteryXrayMode: false,
          vehicleChargingMode: false,
          selectedChargingStationId: null,
          vehicleDamageHistoryMode: false,
          selectedDamageId: null,
  isDamageDetailModalOpen: false,
          vehicleCoOwnershipMode: false,
          vehicleInspectionMode: false,
          selectedVehiclePartId: null,
          selectedVehiclePartCode: null,
        };
      }

      if (targetPanel === 'BOOKING') {
        return {
          activePrimaryPanel: 'BOOKING',
          isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
          isVehicleSelected: true,
          selectedZone: 'VEHICLE',
          selectedVehicleId: targetVehicleId,
          vehicleBookingMode: true,
          vehicleFeatureMode: 'BOOKING',
          vehicleMode: 'BOOKING',
          vehicleVotingMode: false,
          selectedProposalId: null,
          vehicleMaintenanceMode: false,
          selectedMaintenanceId: null,
          vehicleBatteryXrayMode: false,
          vehicleChargingMode: false,
          selectedChargingStationId: null,
          vehicleDamageHistoryMode: false,
          selectedDamageId: null,
  isDamageDetailModalOpen: false,
          vehicleCoOwnershipMode: false,
          vehicleInspectionMode: false,
        };
      }

      if (targetPanel === 'MAINTENANCE') {
        return {
          activePrimaryPanel: 'MAINTENANCE',
          isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
          isVehicleSelected: true,
          selectedZone: 'VEHICLE',
          selectedVehicleId: targetVehicleId,
          vehicleMaintenanceMode: true,
          selectedMaintenanceId: options?.maintenanceId || null,
          vehicleFeatureMode: 'VEHICLE_MAINTENANCE',
          vehicleMode: 'VEHICLE_MAINTENANCE',
          vehicleVotingMode: false,
          selectedProposalId: null,
          vehicleBookingMode: false,
          vehicleBatteryXrayMode: false,
          vehicleChargingMode: false,
          selectedChargingStationId: null,
          vehicleDamageHistoryMode: false,
          selectedDamageId: null,
  isDamageDetailModalOpen: false,
          vehicleCoOwnershipMode: false,
          vehicleInspectionMode: false,
        };
      }

      if (targetPanel === 'DAMAGE') {
        return {
          activePrimaryPanel: 'DAMAGE',
          isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
          isVehicleSelected: true,
          selectedZone: 'VEHICLE',
          selectedVehicleId: targetVehicleId,
          vehicleDamageHistoryMode: true,
          vehicleFeatureMode: 'DAMAGE_HISTORY',
          vehicleMode: 'DAMAGE_HISTORY',
          vehicleVotingMode: false,
          selectedProposalId: null,
          vehicleBookingMode: false,
          vehicleMaintenanceMode: false,
          selectedMaintenanceId: null,
          vehicleBatteryXrayMode: false,
          vehicleChargingMode: false,
          selectedChargingStationId: null,
          vehicleCoOwnershipMode: false,
          vehicleInspectionMode: false,
        };
      }

      if (targetPanel === 'BATTERY_XRAY') {
        return {
          activePrimaryPanel: 'BATTERY_XRAY',
          isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
          isVehicleSelected: true,
          selectedZone: 'VEHICLE',
          selectedVehicleId: targetVehicleId,
          vehicleBatteryXrayMode: true,
          vehicleFeatureMode: 'BATTERY_XRAY',
          vehicleMode: 'BATTERY_XRAY',
          vehicleVotingMode: false,
          selectedProposalId: null,
          vehicleBookingMode: false,
          vehicleMaintenanceMode: false,
          selectedMaintenanceId: null,
          vehicleChargingMode: false,
          selectedChargingStationId: null,
          vehicleDamageHistoryMode: false,
          selectedDamageId: null,
  isDamageDetailModalOpen: false,
          vehicleCoOwnershipMode: false,
          vehicleInspectionMode: false,
        };
      }

      if (targetPanel === 'CHARGING') {
        return {
          activePrimaryPanel: 'CHARGING',
          selectedZone: 'CHARGING',
          activeFeature: 'CHARGING',
          isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
          isVehicleSelected: true,
          selectedVehicleId: targetVehicleId,
          vehicleChargingMode: true,
          selectedChargingStationId: options?.stationId || 'CS01',
          vehicleFeatureMode: 'CHARGING',
          vehicleMode: 'CHARGING',
          vehicleVotingMode: false,
          selectedProposalId: null,
          vehicleBookingMode: false,
          vehicleMaintenanceMode: false,
          selectedMaintenanceId: null,
          vehicleBatteryXrayMode: false,
          vehicleDamageHistoryMode: false,
          selectedDamageId: null,
  isDamageDetailModalOpen: false,
          vehicleCoOwnershipMode: false,
          vehicleInspectionMode: false,
        };
      }

      if (targetPanel === 'CO_OWNERSHIP') {
        return {
          activePrimaryPanel: 'CO_OWNERSHIP',
          isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
          isVehicleSelected: true,
          selectedZone: 'VEHICLE',
          activeFeature: 'NONE',
          selectedVehicleId: targetVehicleId,
          vehicleCoOwnershipMode: true,
          vehicleFeatureMode: 'CO_OWNERSHIP',
          vehicleMode: 'CO_OWNERSHIP',
          vehicleVotingMode: false,
          selectedProposalId: null,
          vehicleBookingMode: false,
          vehicleMaintenanceMode: false,
          selectedMaintenanceId: null,
          vehicleBatteryXrayMode: false,
          vehicleChargingMode: false,
          selectedChargingStationId: null,
          vehicleDamageHistoryMode: false,
          selectedDamageId: null,
          isDamageDetailModalOpen: false,
          isFinanceDetailModalOpen: false,
          vehicleInspectionMode: false,
        };
      }

      if (targetPanel === 'VEHICLE_INFO') {
        return {
          activePrimaryPanel: 'VEHICLE_INFO',
          isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
          isVehicleSelected: true,
          selectedZone: 'VEHICLE',
          selectedVehicleId: targetVehicleId,
          vehicleFeatureMode: 'CO_OWNER_VEHICLE_INFO',
          vehicleMode: 'CO_OWNER_VEHICLE_INFO',
          vehicleVotingMode: false,
          selectedProposalId: null,
          vehicleBookingMode: false,
          vehicleMaintenanceMode: false,
          selectedMaintenanceId: null,
          vehicleBatteryXrayMode: false,
          vehicleChargingMode: false,
          selectedChargingStationId: null,
          vehicleDamageHistoryMode: false,
          selectedDamageId: null,
  isDamageDetailModalOpen: false,
          vehicleCoOwnershipMode: false,
          vehicleInspectionMode: false,
        };
      }

      if (targetPanel === 'MY_BOOKINGS') {
        return {
          activePrimaryPanel: 'MY_BOOKINGS',
          isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
          isVehicleSelected: true,
          selectedZone: 'VEHICLE',
          selectedVehicleId: targetVehicleId,
          vehicleFeatureMode: 'CO_OWNER_MY_BOOKINGS',
          vehicleMode: 'CO_OWNER_MY_BOOKINGS',
          vehicleVotingMode: false,
          selectedProposalId: null,
          vehicleBookingMode: false,
          vehicleMaintenanceMode: false,
          selectedMaintenanceId: null,
          vehicleBatteryXrayMode: false,
          vehicleChargingMode: false,
          selectedChargingStationId: null,
          vehicleDamageHistoryMode: false,
          selectedDamageId: null,
  isDamageDetailModalOpen: false,
          vehicleCoOwnershipMode: false,
          vehicleInspectionMode: false,
        };
      }

      if (targetPanel === 'CONTRACT') {
        return {
          activePrimaryPanel: 'CONTRACT',
          isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
          isVehicleSelected: true,
          selectedZone: 'VEHICLE',
          selectedVehicleId: targetVehicleId,
          vehicleFeatureMode: 'CO_OWNER_CONTRACT',
          vehicleMode: 'CO_OWNER_CONTRACT',
          vehicleVotingMode: false,
          selectedProposalId: null,
          vehicleBookingMode: false,
          vehicleMaintenanceMode: false,
          selectedMaintenanceId: null,
          vehicleBatteryXrayMode: false,
          vehicleChargingMode: false,
          selectedChargingStationId: null,
          vehicleDamageHistoryMode: false,
          selectedDamageId: null,
  isDamageDetailModalOpen: false,
          vehicleCoOwnershipMode: false,
          vehicleInspectionMode: false,
        };
      }

      return {};
    }),

  closeGaragePanel: (panel) =>
    set((state) => {
      if (panel && state.activePrimaryPanel !== panel) {
        return {};
      }
      if (panel === 'NOTIFICATIONS' || state.activePrimaryPanel === 'NOTIFICATIONS') {
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

        const restorePanel = state.previousGaragePanel;
        if (restorePanel === 'VEHICLE_DETAIL') {
          return {
            activePrimaryPanel: 'VEHICLE_DETAIL',
            isVehicleDetailOpen: true,
            previousGaragePanel: null,
            vehicleFeatureMode: targetMode,
            vehicleMode: targetMode,
          };
        }
        if (restorePanel && restorePanel !== 'NONE' && restorePanel !== 'NOTIFICATIONS') {
          return {
            activePrimaryPanel: restorePanel,
            previousGaragePanel: null,
            vehicleMaintenanceMode: restorePanel === 'MAINTENANCE',
            vehicleVotingMode: restorePanel === 'VOTING',
            vehicleBookingMode: restorePanel === 'BOOKING',
            vehicleDamageHistoryMode: restorePanel === 'DAMAGE',
            vehicleBatteryXrayMode: restorePanel === 'BATTERY_XRAY',
            vehicleChargingMode: restorePanel === 'CHARGING',
            vehicleCoOwnershipMode: restorePanel === 'CO_OWNERSHIP',
          };
        }
        return {
          activePrimaryPanel: 'NONE',
          activeRightPanel: null,
          isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
          previousGaragePanel: null,
        };
      }
      if (panel === 'FINANCE' || state.activePrimaryPanel === 'FINANCE') {
        return {
          activePrimaryPanel: 'NONE',
          selectedZone: state.selectedZone === 'FINANCE' ? null : state.selectedZone,
          activeFeature: state.activeFeature === 'FINANCE' ? 'NONE' : state.activeFeature,
          isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
          previousGaragePanel: null,
        };
      }
      if (panel === 'CHARGING' || state.activePrimaryPanel === 'CHARGING') {
        return {
          activePrimaryPanel: 'NONE',
          selectedZone: state.selectedZone === 'CHARGING' ? null : state.selectedZone,
          activeFeature: state.activeFeature === 'CHARGING' ? 'NONE' : state.activeFeature,
          vehicleChargingMode: false,
          selectedChargingStationId: null,
          isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
          previousGaragePanel: null,
        };
      }
      if (panel === 'ANALYTICS' || state.activePrimaryPanel === 'ANALYTICS') {
        return {
          activePrimaryPanel: 'NONE',
          selectedZone: state.selectedZone === 'ANALYTICS' ? null : state.selectedZone,
          activeFeature: state.activeFeature === 'ANALYTICS' ? 'NONE' : state.activeFeature,
          isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
          previousGaragePanel: null,
        };
      }
      if (panel === 'BOOKING' || state.activePrimaryPanel === 'BOOKING') {
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
          activePrimaryPanel: 'VEHICLE_DETAIL',
          isVehicleDetailOpen: true,
          previousGaragePanel: null,
          vehicleFeatureMode: targetMode,
          vehicleMode: targetMode,
          vehicleBookingMode: false,
          bookingStartHour: null,
          bookingEndHour: null,
        };
      }
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
        activePrimaryPanel: 'NONE',
        activeRightPanel: null,
        isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
        previousGaragePanel: null,
        vehicleFeatureMode: targetMode,
        vehicleMode: targetMode,
        vehicleVotingMode: false,
        selectedProposalId: null,
        vehicleBookingMode: false,
        vehicleMaintenanceMode: false,
        selectedMaintenanceId: null,
        vehicleBatteryXrayMode: false,
        vehicleChargingMode: false,
        selectedChargingStationId: null,
        vehicleDamageHistoryMode: false,
        selectedDamageId: null,
        isDamageDetailModalOpen: false,
        vehicleCoOwnershipMode: false,
        vehicleInspectionMode: false,
        isExplorationMode: false,
        exploreHotspotsVisible: false,
        selectedVehiclePartId: null,
        selectedVehiclePartCode: null,
      };
    }),

  toggleNotifications: () =>
    set((state) => {
      if (state.activePrimaryPanel === 'NOTIFICATIONS') {
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

        const restorePanel = state.previousGaragePanel;
        if (restorePanel === 'VEHICLE_DETAIL') {
          return {
            activePrimaryPanel: 'VEHICLE_DETAIL',
            isVehicleDetailOpen: true,
            previousGaragePanel: null,
            vehicleFeatureMode: targetMode,
            vehicleMode: targetMode,
          };
        }
        if (restorePanel && restorePanel !== 'NONE' && restorePanel !== 'NOTIFICATIONS') {
          return {
            activePrimaryPanel: restorePanel,
            previousGaragePanel: null,
            vehicleMaintenanceMode: restorePanel === 'MAINTENANCE',
            vehicleVotingMode: restorePanel === 'VOTING',
            vehicleBookingMode: restorePanel === 'BOOKING',
            vehicleDamageHistoryMode: restorePanel === 'DAMAGE',
            vehicleBatteryXrayMode: restorePanel === 'BATTERY_XRAY',
            vehicleChargingMode: restorePanel === 'CHARGING',
            vehicleCoOwnershipMode: restorePanel === 'CO_OWNERSHIP',
          };
        }
        return {
          activePrimaryPanel: 'NONE',
          activeRightPanel: null,
          isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
          previousGaragePanel: null,
        };
      } else {
        const prev =
          state.activePrimaryPanel !== 'NOTIFICATIONS' && state.activePrimaryPanel !== 'NONE'
            ? state.activePrimaryPanel
            : (state.isVehicleDetailOpen ? 'VEHICLE_DETAIL' : null);
        return {
          previousGaragePanel: prev,
          activePrimaryPanel: 'NOTIFICATIONS',
          isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
          vehicleVotingMode: false,
          selectedProposalId: null,
          bookingInspectedBooking: null,
          bookingStartHour: null,
          bookingEndHour: null,
          vehicleBookingMode: false,
          vehicleMaintenanceMode: false,
          selectedMaintenanceId: null,
          vehicleBatteryXrayMode: false,
          vehicleChargingMode: false,
          selectedChargingStationId: null,
          vehicleDamageHistoryMode: false,
          selectedDamageId: null,
          isDamageDetailModalOpen: false,
          vehicleCoOwnershipMode: false,
          vehicleInspectionMode: false,
        };
      }
    }),

  closeNotifications: () =>
    get().closeGaragePanel('NOTIFICATIONS'),

  selectProposalRecord: (id) =>
    set({
      selectedProposalId: id,
    }),

  selectVehiclePartCode: (code) =>
    set((state) => ({
      selectedVehiclePartCode: code,
      selectedVehiclePartId: (code as VehiclePartId) || null,
      selectedDamageId: code ? state.selectedDamageId : null,
      isDamageDetailModalOpen: code ? state.isDamageDetailModalOpen : false,
      inspectionError: null,
    })),

  selectVehiclePartWithPoint: (partCode, localPosition) =>
    set((state) => {
      let role: string | undefined;
      try {
        role = useAuthStore.getState().user?.role;
      } catch {
        role = 'STAFF';
      }
      const isOps = role === 'STAFF' || role === 'ADMIN';
      return {
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
        isDamageDetailModalOpen: false,
        activeRightPanel: isOps ? 'staff-inspection' : 'component-technical-info',
        inspectionError: null,
      };
    }),

  clearVehiclePartCode: () =>
    set((state) => ({
      selectedVehiclePartCode: null,
      selectedVehiclePartId: null,
      draftDamage: null,
      inspectionError: null,
      activeRightPanel:
        state.activeRightPanel === 'staff-inspection' || state.activeRightPanel === 'component-technical-info'
          ? null
          : state.activeRightPanel,
    })),

  exitPartInspection: () =>
    set({
      selectedVehiclePartCode: null,
      selectedVehiclePartId: null,
      draftDamage: null,
      selectedDamageId: null,
      isDamageDetailModalOpen: false,
      activeRightPanel: null,
      inspectionError: null,
    }),

  selectDamageRecord: (id, partCode) =>
    set((state) => ({
      selectedDamageId: id,
      selectedVehiclePartCode: partCode !== undefined ? partCode : (id ? state.selectedVehiclePartCode : null),
      selectedVehiclePartId: partCode !== undefined ? ((partCode as VehiclePartId) || null) : (id ? state.selectedVehiclePartId : null),
      draftDamage: id ? null : state.draftDamage,
      inspectionError: null,
    })),

  openDamageDetailModal: (damageId, partCode) =>
    set((state) => ({
      selectedDamageId: damageId,
      selectedVehiclePartCode: partCode !== undefined ? partCode : state.selectedVehiclePartCode,
      selectedVehiclePartId: null,
      vehicleInspectionMode: false,
      isDamageDetailModalOpen: true,
      activeRightPanel: 'coowner-damage-detail',
      draftDamage: null,
      inspectionError: null,
    })),

  closeDamageDetailModal: () =>
    set((state) => ({
      isDamageDetailModalOpen: false,
      selectedDamageId: null,
      activeRightPanel: state.activeRightPanel === 'coowner-damage-detail' ? null : state.activeRightPanel,
    })),

  setDraftDamage: (draft) =>
    set({
      draftDamage: draft,
      selectedDamageId: null,
  isDamageDetailModalOpen: false,
      inspectionError: null,
    }),

  setInspectionError: (err) =>
    set({
      inspectionError: err,
    }),

  resetExperienceState: () =>
    set({
      selectedZone: null,
      activeFeature: 'NONE',
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
      activePrimaryPanel: 'NONE',
      previousGaragePanel: null,
      isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
      vehicleVotingMode: false,
      selectedProposalId: null,
      vehicleBatteryXrayMode: false,
      vehicleChargingMode: false,
      selectedChargingStationId: null,
      vehicleInspectionMode: false,
      isExplorationMode: false,
      exploreHotspotsVisible: false,
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
  isDamageDetailModalOpen: false,
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
      if (mode === 'BATTERY_XRAY' && !hasCapability(role, 'canViewBatteryHealth')) return {};
      if (mode === 'CHARGING' && !hasCapability(role, 'canManageCharging')) return {};

      const isReceiptMode = mode === 'RECEIPT' || mode === 'CO_OWNER_RECEIPT_REVIEW';
      const isBooking = mode === 'BOOKING';
      const isBatteryXray = mode === 'BATTERY_XRAY';
      const isCharging = mode === 'CHARGING';
      const today = new Date();
      if (today.getHours() >= 20) {
        today.setDate(today.getDate() + 1);
      }
      let resolvedPanel: PrimaryGaragePanel = 'NONE';
      if (mode === 'BOOKING') resolvedPanel = 'BOOKING';
      else if (mode === 'CO_OWNER_MY_BOOKINGS') resolvedPanel = 'MY_BOOKINGS';
      else if (mode === 'CO_OWNER_VEHICLE_INFO') resolvedPanel = 'VEHICLE_INFO';
      else if (mode === 'CO_OWNERSHIP') resolvedPanel = 'CO_OWNERSHIP';
      else if (mode === 'CO_OWNER_CONTRACT') resolvedPanel = 'CONTRACT';
      else if (mode === 'CO_OWNER_VOTING') resolvedPanel = 'VOTING';
      else if (mode === 'DAMAGE_HISTORY') resolvedPanel = 'DAMAGE';
      else if (mode === 'VEHICLE_MAINTENANCE') resolvedPanel = 'MAINTENANCE';
      else if (mode === 'BATTERY_XRAY') resolvedPanel = 'BATTERY_XRAY';
      else if (mode === 'CHARGING') resolvedPanel = 'CHARGING';
      else if (mode === 'CO_OWNER_VEHICLE_OVERVIEW' || mode === 'STAFF_VEHICLE_OVERVIEW' || mode === 'ADMIN_VEHICLE_OVERVIEW') resolvedPanel = 'VEHICLE_DETAIL';

      return {
        vehicleFeatureMode: mode,
        vehicleMode: mode,
        activePrimaryPanel: resolvedPanel,
        isVehicleDetailOpen: resolvedPanel === 'VEHICLE_DETAIL',
        vehicleVotingMode: resolvedPanel === 'VOTING',
        selectedProposalId: resolvedPanel === 'VOTING' ? state.selectedProposalId : null,
        vehicleBatteryXrayMode: isBatteryXray,
        vehicleChargingMode: isCharging,
        selectedChargingStationId: isCharging ? (state.selectedChargingStationId || 'CS01') : null,
        vehicleBookingMode: isBooking,
        isVehicleSelected: mode !== 'NONE' ? true : state.isVehicleSelected,
        selectedZone: mode !== 'NONE' ? 'VEHICLE' : state.selectedZone,
        selectedVehicleId: mode !== 'NONE' ? (state.selectedVehicleId || 'EV01') : state.selectedVehicleId,
        bookingSelectedDate: isBooking ? (state.bookingSelectedDate instanceof Date ? state.bookingSelectedDate : today) : state.bookingSelectedDate,
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
        selectedVehiclePartId: isCharging ? 'CHARGING_PORT' : (isBatteryXray ? 'BATTERY' : ((mode === 'DAMAGE_MAPPING' || mode === 'DAMAGE_HISTORY' || mode === 'VEHICLE_MAINTENANCE') ? state.selectedVehiclePartId : null)),
        selectedVehiclePartCode: isCharging ? 'CHARGING_PORT' : (isBatteryXray ? 'BATTERY' : ((mode === 'DAMAGE_MAPPING' || mode === 'DAMAGE_HISTORY' || mode === 'VEHICLE_MAINTENANCE') ? state.selectedVehiclePartCode : null)),
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
      if (mode === 'BATTERY_XRAY' && !hasCapability(role, 'canViewBatteryHealth')) return {};
      if (mode === 'CHARGING' && !hasCapability(role, 'canManageCharging')) return {};

      const isReceiptMode = mode === 'RECEIPT' || mode === 'CO_OWNER_RECEIPT_REVIEW';
      const isBooking = mode === 'BOOKING';
      const isBatteryXray = mode === 'BATTERY_XRAY';
      const isCharging = mode === 'CHARGING';
      const today = new Date();
      if (today.getHours() >= 20) {
        today.setDate(today.getDate() + 1);
      }

      let resolvedPanel: PrimaryGaragePanel = 'NONE';
      if (mode === 'BOOKING') resolvedPanel = 'BOOKING';
      else if (mode === 'CO_OWNER_MY_BOOKINGS') resolvedPanel = 'MY_BOOKINGS';
      else if (mode === 'CO_OWNER_VEHICLE_INFO') resolvedPanel = 'VEHICLE_INFO';
      else if (mode === 'CO_OWNERSHIP') resolvedPanel = 'CO_OWNERSHIP';
      else if (mode === 'CO_OWNER_CONTRACT') resolvedPanel = 'CONTRACT';
      else if (mode === 'CO_OWNER_VOTING') resolvedPanel = 'VOTING';
      else if (mode === 'DAMAGE_HISTORY') resolvedPanel = 'DAMAGE';
      else if (mode === 'VEHICLE_MAINTENANCE') resolvedPanel = 'MAINTENANCE';
      else if (mode === 'BATTERY_XRAY') resolvedPanel = 'BATTERY_XRAY';
      else if (mode === 'CHARGING') resolvedPanel = 'CHARGING';
      else if (mode === 'CO_OWNER_VEHICLE_OVERVIEW' || mode === 'STAFF_VEHICLE_OVERVIEW' || mode === 'ADMIN_VEHICLE_OVERVIEW') resolvedPanel = 'VEHICLE_DETAIL';

      return {
        vehicleFeatureMode: mode,
        vehicleMode: mode,
        activePrimaryPanel: resolvedPanel,
        isVehicleDetailOpen: resolvedPanel === 'VEHICLE_DETAIL',
        vehicleVotingMode: resolvedPanel === 'VOTING',
        selectedProposalId: resolvedPanel === 'VOTING' ? state.selectedProposalId : null,
        vehicleBatteryXrayMode: isBatteryXray,
        vehicleChargingMode: isCharging,
        selectedChargingStationId: isCharging ? (state.selectedChargingStationId || 'CS01') : null,
        vehicleBookingMode: isBooking,
        isVehicleSelected: (isBooking || isBatteryXray || isCharging) ? true : state.isVehicleSelected,
        selectedZone: (isBooking || isBatteryXray || isCharging) ? 'VEHICLE' : state.selectedZone,
        selectedVehicleId: (isBooking || isBatteryXray || isCharging) ? (state.selectedVehicleId || 'EV01') : state.selectedVehicleId,
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
        selectedVehiclePartId: isCharging ? 'CHARGING_PORT' : (isBatteryXray ? 'BATTERY' : ((mode === 'DAMAGE_MAPPING' || mode === 'DAMAGE_HISTORY' || mode === 'VEHICLE_MAINTENANCE') ? state.selectedVehiclePartId : null)),
        selectedVehiclePartCode: isCharging ? 'CHARGING_PORT' : (isBatteryXray ? 'BATTERY' : ((mode === 'DAMAGE_MAPPING' || mode === 'DAMAGE_HISTORY' || mode === 'VEHICLE_MAINTENANCE') ? state.selectedVehiclePartCode : null)),
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
        activePrimaryPanel: 'VEHICLE_DETAIL',
        previousGaragePanel: null,
        isVehicleDetailOpen: true,
        vehicleBatteryXrayMode: false,
        vehicleChargingMode: false,
        selectedChargingStationId: null,
        vehicleBookingMode: false,
        bookingStartHour: null,
        bookingEndHour: null,
        vehicleCoOwnershipMode: false,
        vehicleInspectionMode: false,
        isExplorationMode: false,
        exploreHotspotsVisible: false,
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
  isDamageDetailModalOpen: false,
        draftDamage: null,
        selectedVehiclePartId: null,
        hoveredVehiclePartId: null,
        selectedOwnerId: null,
        hoveredOwnerId: null,
        selectedHandoverCheckpoint: null,
        hoveredHandoverCheckpoint: null,
        selectedZone: 'VEHICLE',
        selectedVehicleId: state.selectedVehicleId || 'EV01',
        vehicleVotingMode: false,
        selectedProposalId: null,
      };
    }),

  returnToGarageOverview: () =>
    set({
      selectedZone: null,
      activeFeature: 'NONE',
      selectedObjectId: null,
      selectedPosition: null,
      selectedVehicleId: null,
      hoveredVehicleId: null,
      vehicleFeatureMode: 'NONE',
      vehicleMode: 'NONE',
      activeExperience: null,
      isVehicleSelected: false,
      activePrimaryPanel: 'NONE',
      previousGaragePanel: null,
      isVehicleDetailOpen: false,
  isRegistrationReviewModalOpen: false,
      isFinanceDetailModalOpen: false,
      vehicleBatteryXrayMode: false,
      vehicleChargingMode: false,
      selectedChargingStationId: null,
      vehicleVotingMode: false,
      selectedProposalId: null,
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
  isDamageDetailModalOpen: false,
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

