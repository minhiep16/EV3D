import { GarageZone } from '../store/worldStore';

export type UserRole = 'CO_OWNER' | 'STAFF' | 'ADMIN';

export interface FeatureCapabilities {
  // CO_OWNER Feature Capabilities (Section 22)
  canBookVehicle: boolean;
  canViewMyBookings: boolean;
  canViewOwnership: boolean;
  canExploreVehicle: boolean;
  canConfirmReceipt: boolean;
  canStartTrip: boolean;

  // STAFF Operational Capabilities (Section 22)
  canPrepareVehicle: boolean;
  canInspectForHandover: boolean;
  canConfirmHandover: boolean;

  // ADMIN Monitoring & Governance Capabilities (Section 22)
  canMonitorFleet: boolean;
  canMonitorHandover: boolean;
  canAccessAdministration: boolean;
}

export const FEATURE_CAPABILITIES: Record<UserRole, FeatureCapabilities> = {
  CO_OWNER: {
    canBookVehicle: true,
    canViewMyBookings: true,
    canViewOwnership: true,
    canExploreVehicle: true,
    canConfirmReceipt: true,
    canStartTrip: true,

    canPrepareVehicle: false,
    canInspectForHandover: false,
    canConfirmHandover: false,

    canMonitorFleet: false,
    canMonitorHandover: false,
    canAccessAdministration: false,
  },
  STAFF: {
    canBookVehicle: false,
    canViewMyBookings: false,
    canViewOwnership: false,
    canExploreVehicle: false,
    canConfirmReceipt: false,
    canStartTrip: false,

    canPrepareVehicle: true,
    canInspectForHandover: true,
    canConfirmHandover: true,

    canMonitorFleet: false,
    canMonitorHandover: false,
    canAccessAdministration: false,
  },
  ADMIN: {
    canBookVehicle: false,
    canViewMyBookings: false,
    canViewOwnership: false,
    canExploreVehicle: false,
    canConfirmReceipt: false,
    canStartTrip: false,

    canPrepareVehicle: false,
    canInspectForHandover: false,
    canConfirmHandover: false,

    canMonitorFleet: true,
    canMonitorHandover: true,
    canAccessAdministration: true,
  },
};

/**
 * Centralized Role-Zone Capabilities Model (Section 21)
 * Controls 3D zone presence, raycasting, interaction, and spatial cards.
 */
export const ZONE_CAPABILITIES: Record<UserRole, Record<GarageZone, boolean>> = {
  CO_OWNER: {
    VEHICLE: true,
    CHARGING: true,
    FINANCE: true,
    ANALYTICS: true,
    AI: true,
    MAINTENANCE: false,
    GOVERNANCE: false,
  },
  STAFF: {
    VEHICLE: true,
    CHARGING: true,
    MAINTENANCE: true,
    ANALYTICS: true,
    GOVERNANCE: false,
    FINANCE: false,
    AI: false,
  },
  ADMIN: {
    VEHICLE: true,
    CHARGING: true,
    MAINTENANCE: true,
    ANALYTICS: true,
    GOVERNANCE: true,
    FINANCE: false,
    AI: false,
  },
};

export function hasCapability(
  role: string | undefined,
  capability: keyof FeatureCapabilities
): boolean {
  if (!role) return false;
  const userRole = (role in FEATURE_CAPABILITIES ? role : 'CO_OWNER') as UserRole;
  return !!FEATURE_CAPABILITIES[userRole]?.[capability];
}

export function canAccessZone(
  role: string | undefined,
  zone: GarageZone
): boolean {
  if (!role) return false;
  const userRole = (role in ZONE_CAPABILITIES ? role : 'CO_OWNER') as UserRole;
  return !!ZONE_CAPABILITIES[userRole]?.[zone];
}

export function getAccessibleZones(role: string | undefined): GarageZone[] {
  const userRole = (role && role in ZONE_CAPABILITIES ? role : 'CO_OWNER') as UserRole;
  const caps = ZONE_CAPABILITIES[userRole];
  const allZones: GarageZone[] = [
    'VEHICLE',
    'CHARGING',
    'MAINTENANCE',
    'FINANCE',
    'GOVERNANCE',
    'ANALYTICS',
    'AI',
  ];
  return allZones.filter((zone) => !!caps[zone]);
}
