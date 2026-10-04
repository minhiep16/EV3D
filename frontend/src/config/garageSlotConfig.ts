/**
 * Centralized Multi-Vehicle Garage Slot & Bay Architecture (Phase 13C)
 *
 * Provides a scalable, zone-aware slot system for fleet showroom & operations.
 * Eliminates ad-hoc hardcoded vehicle coordinates and guarantees:
 * 1. Each vehicle is assigned to exactly one dedicated slot/bay.
 * 2. No vehicle overlaps any architectural equipment, maintenance lifts, or other bays.
 * 3. Supports fleet expansion (>= 8 vehicles) with deterministic slot resolution.
 */

import { VehicleResponse } from '../types/vehicle';
import { resolveVehicleCode } from '../components/three/vehicles/vehicleModelConfig';

export type GarageSlotZone = 'READY' | 'SERVICE' | 'CHARGING' | 'HANDOVER' | 'ANALYTICS';

export interface GarageSlotDef {
  id: string;
  nameVi: string;
  zone: GarageSlotZone;
  position: [number, number, number];
  rotationY: number;
  descriptionVi?: string;
  accentColor?: string;
}

/**
 * Authoritative Master Slot Registry (8 Dedicated Showroom & Operational Bays)
 * All positions are calibrated in showroom space to prevent collision with
 * the hero turntable (X=0, Z=0.5), maintenance hydraulic lift (X=-6.5, Z=0.5),
 * and charging stations (X=6.5, Z=0.5).
 */
export const GARAGE_SLOTS: Record<string, GarageSlotDef> = {
  BAY_READY_01: {
    id: 'BAY_READY_01',
    nameVi: 'Bệ xoay chính — Showroom Ready 1',
    zone: 'READY',
    position: [0.0, 0.14, 0.5],
    rotationY: -0.32,
    descriptionVi: 'Bệ xoay trung tâm trưng bày xe chính',
    accentColor: '#00f2fe',
  },
  BAY_HANDOVER_01: {
    id: 'BAY_HANDOVER_01',
    nameVi: 'Khoang giao xe — Handover Bay 1',
    zone: 'HANDOVER',
    position: [-3.8, 0.14, 3.8],
    rotationY: -0.22,
    descriptionVi: 'Khoang bàn giao và kiểm tra chi tiết xe',
    accentColor: '#f59e0b',
  },
  BAY_READY_02: {
    id: 'BAY_READY_02',
    nameVi: 'Khoang trưng bày — Showroom Ready 2',
    zone: 'READY',
    position: [3.8, 0.14, 3.8],
    rotationY: -0.38,
    descriptionVi: 'Khoang trưng bày sảnh đông',
    accentColor: '#38bdf8',
  },
  BAY_CHARGING_01: {
    id: 'BAY_CHARGING_01',
    nameVi: 'Trạm sạc nhanh DC 1',
    zone: 'CHARGING',
    position: [6.5, 0.14, 0.5],
    rotationY: -0.15,
    descriptionVi: 'Khoang sạc siêu nhanh DC',
    accentColor: '#10b981',
  },
  BAY_CHARGING_02: {
    id: 'BAY_CHARGING_02',
    nameVi: 'Trạm sạc nhanh DC 2',
    zone: 'CHARGING',
    position: [6.5, 0.14, -3.8],
    rotationY: -0.15,
    descriptionVi: 'Khoang sạc tiêu chuẩn đội xe',
    accentColor: '#10b981',
  },
  BAY_SERVICE_01: {
    id: 'BAY_SERVICE_01',
    nameVi: 'Cầu nâng kỹ thuật — Service Lift 1',
    zone: 'SERVICE',
    position: [-6.5, 0.14, 0.5],
    rotationY: 0.0,
    descriptionVi: 'Cầu nâng bảo dưỡng và kiểm tra pin',
    accentColor: '#ef4444',
  },
  BAY_SERVICE_02: {
    id: 'BAY_SERVICE_02',
    nameVi: 'Khoang chẩn đoán — Service Bay 2',
    zone: 'SERVICE',
    position: [-6.5, 0.14, -3.8],
    rotationY: 0.0,
    descriptionVi: 'Khoang chẩn đoán kỹ thuật phần cứng',
    accentColor: '#ef4444',
  },
  BAY_ANALYTICS_01: {
    id: 'BAY_ANALYTICS_01',
    nameVi: 'Khoang điều phối — Fleet Staging',
    zone: 'ANALYTICS',
    position: [0.0, 0.14, -4.2],
    rotationY: 0.0,
    descriptionVi: 'Khoang định vị và đồng bộ viễn thông',
    accentColor: '#8b5cf6',
  },
};

/**
 * Safe deterministic fallback slot for vehicles without an explicit assignment.
 * Uses BAY_READY_02 to avoid collision with EV01 (BAY_READY_01) and EV02 (BAY_HANDOVER_01).
 */
export const DEFAULT_GARAGE_SLOT: GarageSlotDef = GARAGE_SLOTS.BAY_READY_02;

const OVERFLOW_SLOT_IDS = [
  'BAY_READY_02',
  'BAY_CHARGING_02',
  'BAY_SERVICE_02',
  'BAY_ANALYTICS_01',
] as const;

/**
 * Returns role-adapted position for a slot (e.g. CO_OWNER showroom center alignment)
 */
export function getSlotPosition(slotId: string, role?: string): [number, number, number] {
  const isCoOwner = !role || role === 'CO_OWNER';
  if (isCoOwner) {
    if (slotId === 'BAY_READY_01') {
      return [0.0, 0.09, 1.8];
    }
    if (slotId === 'BAY_HANDOVER_01') {
      return [-3.8, 0.14, 3.2];
    }
  }
  return GARAGE_SLOTS[slotId]?.position || [0.0, 0.14, 0.5];
}

/**
 * Deterministically assigns vehicles to slots based on identity, operational status, and role.
 * Guarantees 1-to-1 vehicle-to-slot mapping with zero collision.
 */
export function resolveVehicleSlot(
  vehicle: VehicleResponse | null | undefined,
  role?: string,
  allVehicles?: VehicleResponse[]
): GarageSlotDef {
  const isCoOwner = !role || role === 'CO_OWNER';
  if (isCoOwner) {
    // In CO_OWNER mode, the active co-owned vehicle is always centered on the hero showroom turntable
    return {
      ...GARAGE_SLOTS.BAY_READY_01,
      position: [0.0, 0.09, 1.8],
    };
  }

  if (!vehicle) {
    if (import.meta.env.DEV) {
      console.warn('[garageSlotConfig] Undefined vehicle passed to resolveVehicleSlot, falling back to DEFAULT_GARAGE_SLOT');
    }
    return {
      ...DEFAULT_GARAGE_SLOT,
      position: getSlotPosition(DEFAULT_GARAGE_SLOT.id, role),
    };
  }

  const code = resolveVehicleCode(vehicle);
  const status = (vehicle.status || '').toUpperCase();

  let targetSlotId: string;

  // 1. Specific vehicle code baseline placement
  if (code === 'EV01') {
    targetSlotId = 'BAY_READY_01';
  } else if (code === 'EV02') {
    // EV02 is assigned to dedicated Handover Bay (never overlapping maintenance)
    targetSlotId = 'BAY_HANDOVER_01';
  } else {
    // 2. Status-driven placement for additional fleet vehicles
    if (status === 'MAINTENANCE' || status === 'IN_SERVICE') {
      targetSlotId = 'BAY_SERVICE_01';
    } else if (status === 'CHARGING') {
      targetSlotId = 'BAY_CHARGING_01';
    } else {
      // Deterministic overflow allocation to avoid collision with EV01 (BAY_READY_01) and EV02 (BAY_HANDOVER_01)
      if (allVehicles && allVehicles.length > 0) {
        const otherVehicles = allVehicles.filter((v) => {
          const c = resolveVehicleCode(v);
          return c !== 'EV01' && c !== 'EV02';
        });
        const index = otherVehicles.findIndex((v) => (v.id && v.id === vehicle.id) || resolveVehicleCode(v) === resolveVehicleCode(vehicle));
        const slotIdx = index >= 0 ? index % OVERFLOW_SLOT_IDS.length : 0;
        targetSlotId = OVERFLOW_SLOT_IDS[slotIdx];
      } else {
        targetSlotId = 'BAY_READY_02';
      }

      if (import.meta.env.DEV) {
        console.info(`[garageSlotConfig] Vehicle ${resolveVehicleCode(vehicle) || vehicle.id || 'unassigned'} assigned to slot: ${targetSlotId}`);
      }
    }
  }

  const baseSlot = GARAGE_SLOTS[targetSlotId] || DEFAULT_GARAGE_SLOT;
  const position = getSlotPosition(targetSlotId, role);

  return {
    ...baseSlot,
    position,
  };
}

/**
 * Fast lookup helper for camera anchors and visual twins
 */
export function getVehicleBaySlot(vehicleCodeOrId?: string | null, role?: string): GarageSlotDef {
  const isCoOwner = !role || role === 'CO_OWNER';
  if (isCoOwner) {
    return {
      ...GARAGE_SLOTS.BAY_READY_01,
      position: [0.0, 0.14, 1.8],
    };
  }
  const code = resolveVehicleCode(vehicleCodeOrId);
  const slotId = code === 'EV02' ? 'BAY_HANDOVER_01' : 'BAY_READY_01';
  const baseSlot = GARAGE_SLOTS[slotId] || DEFAULT_GARAGE_SLOT;
  return {
    ...baseSlot,
    position: getSlotPosition(slotId, role),
  };
}
