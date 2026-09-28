/**
 * Centralized Garage Zone Visibility & Focus State Architecture
 *
 * Rules:
 * 1. Default overview mode:
 *    - All zone labels are visible.
 *    - All compact summaries are visible.
 *    - Vehicle status label (EV01) is visible.
 *    - All platforms remain visible.
 * 2. Focused mode (one zone or EV01 or business mode active):
 *    - Keep selected zone visible with its label and detail panel.
 *    - Hide floating labels of ALL unrelated zones.
 *    - Hide compact summaries of ALL unrelated zones.
 *    - Hide EV01 status label if unrelated or when vehicle panel is open.
 *    - Keep 3D world geometry intact (do NOT unmount the 3D world).
 * 3. Returning to overview mode:
 *    - Restore all zone labels and compact summaries.
 *    - Ensure hidden labels are not rendered or interactive (pointerEvents: none).
 */

import { GarageZone } from '../store/worldStore';

export interface GarageFocusState {
  selectedZone?: GarageZone | null;
  selectedVehicleId?: string | null;
  isVehicleSelected?: boolean;
  vehicleBookingMode?: boolean;
  vehicleCoOwnershipMode?: boolean;
  vehicleHandoverMode?: boolean;
  vehicleReceiptReviewMode?: boolean;
  vehicleTripStartMode?: boolean;
  vehicleTripVisualizationMode?: boolean;
  vehicleDamageMappingMode?: boolean;
  vehicleInspectionMode?: boolean;
  selectedVehiclePartId?: string | null;
  selectedVehiclePartCode?: string | null;
}

/**
 * Resolves the currently active focused zone ID, or null if in default overview mode.
 * If EV01 or any vehicle business mode is active, the focused zone resolves to 'VEHICLE'.
 */
export function getActiveFocusedZoneId(state: GarageFocusState): GarageZone | null {
  const isVehicleFocused =
    Boolean(state.selectedVehicleId) ||
    Boolean(state.isVehicleSelected) ||
    state.selectedZone === 'VEHICLE' ||
    Boolean(state.vehicleBookingMode) ||
    Boolean(state.vehicleCoOwnershipMode) ||
    Boolean(state.vehicleHandoverMode) ||
    Boolean(state.vehicleReceiptReviewMode) ||
    Boolean(state.vehicleTripStartMode) ||
    Boolean(state.vehicleTripVisualizationMode) ||
    Boolean(state.vehicleDamageMappingMode) ||
    Boolean(state.vehicleInspectionMode) ||
    Boolean(state.selectedVehiclePartId) ||
    Boolean(state.selectedVehiclePartCode);

  if (isVehicleFocused) {
    return 'VEHICLE';
  }

  return state.selectedZone || null;
}

/**
 * Checks whether the virtual garage is currently in any focused mode.
 * isZoneFocused = selectedZoneId != null
 */
export function isGarageZoneFocused(state: GarageFocusState): boolean {
  return getActiveFocusedZoneId(state) !== null;
}

/**
 * Authoritative Rule: Should overview UI (labels, compact summaries, overview indicators) be shown?
 * shouldShowOverviewZoneUI = selectedZoneId == null
 *
 * True ONLY in overview mode when NO zone or vehicle is focused.
 * Once ANY zone is focused, overview labels & compact summaries disappear entirely.
 */
export function shouldShowOverviewZoneUI(state: GarageFocusState): boolean {
  return getActiveFocusedZoneId(state) === null;
}

/**
 * Centralized rule: Should floating zone overview label be displayed for the given zoneId?
 * shouldShowZoneLabel = (zoneId) => selectedZoneId == null
 *
 * - In overview mode (selectedZoneId == null): true for all zones.
 * - In focused mode (selectedZoneId != null): false for ALL zones (both focused zone and unrelated zones).
 * The focused zone presents its identity inside the authoritative detail panel, not as a floating overview label.
 */
export function shouldShowZoneLabel(
  zoneId: GarageZone,
  state: GarageFocusState
): boolean;
export function shouldShowZoneLabel(
  state: GarageFocusState
): boolean;
export function shouldShowZoneLabel(
  zoneIdOrState: GarageZone | GarageFocusState,
  maybeState?: GarageFocusState
): boolean {
  const state = typeof zoneIdOrState === 'string' ? maybeState : zoneIdOrState;
  if (!state) return true;
  return shouldShowOverviewZoneUI(state);
}

/**
 * Centralized rule: Should compact summary be displayed for the given zoneId?
 * In overview mode: true for all zones.
 * In focused mode: false for ALL zones.
 */
export function shouldShowZoneSummary(
  zoneId: GarageZone,
  state: GarageFocusState
): boolean;
export function shouldShowZoneSummary(
  state: GarageFocusState
): boolean;
export function shouldShowZoneSummary(
  zoneIdOrState: GarageZone | GarageFocusState,
  maybeState?: GarageFocusState
): boolean {
  const state = typeof zoneIdOrState === 'string' ? maybeState : zoneIdOrState;
  if (!state) return true;
  return shouldShowOverviewZoneUI(state);
}

/**
 * Centralized rule: Should vehicle floating status pill (VehicleStatusLabel) be displayed?
 * Visible ONLY in overview mode when NO zone, vehicle, or business mode is focused.
 */
export function shouldShowVehicleStatusLabel(state: GarageFocusState): boolean {
  return shouldShowOverviewZoneUI(state);
}
