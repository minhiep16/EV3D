/**
 * Centralized Layout Configuration for ADMIN Garage & Command Center (3D Showroom)
 *
 * Defines authoritative world-space spatial anchors, orientations, and responsive framing
 * for all stations and interactive modules within the ADMIN 3D Command Center:
 * - Approval Workstation (Physical Kiosk in lower-left foreground)
 * - Tri-Hologram Stations (Co-Ownership, User Management, Operations Analytics)
 * - Central Turntable & Vehicle Navigator
 * - Foreground Ownership Member Holograms
 */

export interface AdminApprovalWorkstationConfig {
  /** 3D world position [x, y, z] of the workstation group */
  position: [number, number, number];
  /** Euler rotation angles [x, y, z] in radians */
  rotation: [number, number, number];
  /** Distance factor for Drei Html overlay scaling */
  distanceFactor: number;
  /** Y offset of the floating UI label above workstation base */
  labelOffsetY: number;
  /** Ground glow ring configuration */
  groundRing: {
    innerRadius: number;
    outerRadius: number;
    elevation: number;
  };
}

export const ADMIN_GARAGE_LAYOUT = {
  /**
   * Dedicated Onboarding Application Approval Workstation ("XÉT DUYỆT HỒ SƠ")
   * Placed in the lower-left showroom floor zone:
   * - Left of central vehicle & turntable pad (clearance > 1.0m from platform edge)
   * - Lower in screen space / closer to floor foreground (Z = 2.55 vs old Z = 1.3)
   * - Visually separated from rear left Co-Ownership hologram (distance delta > 5.4m)
   * - Ample lateral breathing room from member avatars (X = -3.45 vs X = -1.9)
   * - Zero collision with central vehicle card (X = 0) or left botanical planter (X = -7.2)
   */
  approvalWorkstation: {
    position: [-3.45, 0.0, 2.55] as [number, number, number],
    rotation: [0, Math.PI / 4.5, 0] as [number, number, number],
    distanceFactor: 7.8,
    labelOffsetY: 1.62,
    groundRing: {
      innerRadius: 0.42,
      outerRadius: 0.54,
      elevation: 0.015,
    },
  },

  /** Left Hologram Station: Co-Ownership Monitoring */
  coOwnershipStation: {
    position: [-4.5, 1.25, -2.85] as [number, number, number],
    color: '#00D9FF',
    glowColor: '#00B4D8',
  },

  /** Center Rear Hologram Station: User Management */
  userManagementStation: {
    position: [0.0, 1.25, -3.6] as [number, number, number],
    color: '#A855F7',
    glowColor: '#9333EA',
  },

  /** Right Hologram Station: Operations Analytics */
  operationsAnalyticsStation: {
    position: [4.5, 1.25, -2.85] as [number, number, number],
    color: '#10B981',
    glowColor: '#059669',
  },

  /** Central Turntable Platform Anchor */
  heroTurntable: {
    position: [0.0, 0.14, 0.5] as [number, number, number],
  },

  /** Central Vehicle Navigator (floor card below vehicle) */
  centralNavigator: {
    normalPosition: [0.0, 0.12, 3.20] as [number, number, number],
    coOwnershipActivePosition: [0.0, 0.16, 2.35] as [number, number, number],
  },

  /** Foreground Ownership Member Holograms Arc */
  foregroundMemberHolograms: {
    position: [0.0, 0.0, 4.05] as [number, number, number],
  },
} as const;
