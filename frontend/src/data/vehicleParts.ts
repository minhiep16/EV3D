import * as THREE from 'three';
import { VehiclePartConfig, VehiclePartId, PartStatus, PartSpecItem } from '../types/vehiclePart';

export const PART_STATUS_CONFIG: Record<
  PartStatus,
  { labelVi: string; color: string; bg: string }
> = {
  NORMAL: {
    labelVi: 'Bình thường',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
  },
  WARNING: {
    labelVi: 'Cảnh báo',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
  },
  DAMAGED: {
    labelVi: 'Hư hỏng',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
  },
};

// ============================================================================
// 1. SEMANTIC HITBOX PROXY DEFINITIONS
// Decouples raycasting and interaction from visual GLB geometry/node names.
// ============================================================================

export interface SemanticHitboxDef {
  id: VehiclePartId;
  nameVi: string;
  shape: 'box' | 'cylinder' | 'sphere';
  position: [number, number, number];
  args: any[];
  rotation?: [number, number, number];
  isCriticalPhase09: boolean;
}

export const SEMANTIC_HITBOX_DEFINITIONS: SemanticHitboxDef[] = [
  // 1. Wheels (Critical Phase 09 Checkpoints)
  {
    id: 'WHEEL_FL',
    nameVi: 'Bánh trước trái',
    shape: 'cylinder',
    position: [-0.80, 0.36, 1.31],
    args: [0.38, 0.38, 0.30, 24],
    rotation: [0, 0, Math.PI / 2],
    isCriticalPhase09: true,
  },
  {
    id: 'WHEEL_FR',
    nameVi: 'Bánh trước phải',
    shape: 'cylinder',
    position: [0.80, 0.36, 1.31],
    args: [0.38, 0.38, 0.30, 24],
    rotation: [0, 0, Math.PI / 2],
    isCriticalPhase09: true,
  },
  {
    id: 'WHEEL_RL',
    nameVi: 'Bánh sau trái',
    shape: 'cylinder',
    position: [-0.80, 0.36, -1.31],
    args: [0.38, 0.38, 0.30, 24],
    rotation: [0, 0, Math.PI / 2],
    isCriticalPhase09: true,
  },
  {
    id: 'WHEEL_RR',
    nameVi: 'Bánh sau phải',
    shape: 'cylinder',
    position: [0.80, 0.36, -1.31],
    args: [0.38, 0.38, 0.30, 24],
    rotation: [0, 0, Math.PI / 2],
    isCriticalPhase09: true,
  },

  // 2. Interactive Doors (Phase 13 Door Semantic Selection & Animation Proxies)
  {
    id: 'DOOR_FL',
    nameVi: 'Cửa trước trái',
    shape: 'box',
    position: [-0.88, 0.80, 0.55],
    args: [0.22, 0.65, 0.85],
    isCriticalPhase09: false,
  },
  {
    id: 'DOOR_FR',
    nameVi: 'Cửa trước phải',
    shape: 'box',
    position: [0.88, 0.80, 0.55],
    args: [0.22, 0.65, 0.85],
    isCriticalPhase09: false,
  },
  {
    id: 'DOOR_RL',
    nameVi: 'Cửa sau trái',
    shape: 'box',
    position: [-0.88, 0.80, -0.50],
    args: [0.22, 0.65, 0.80],
    isCriticalPhase09: false,
  },
  {
    id: 'DOOR_RR',
    nameVi: 'Cửa sau phải',
    shape: 'box',
    position: [0.88, 0.80, -0.50],
    args: [0.22, 0.65, 0.80],
    isCriticalPhase09: false,
  },

  // 3. Cabin, Glass, Hood & High Voltage Systems
  {
    id: 'WINDSHIELD',
    nameVi: 'Kính chắn gió',
    shape: 'box',
    position: [0, 1.15, 0.45],
    args: [1.35, 0.45, 0.85],
    rotation: [-0.45, 0, 0],
    isCriticalPhase09: true,
  },
  {
    id: 'BATTERY',
    nameVi: 'Pin',
    shape: 'box',
    position: [0, 0.20, 0],
    args: [1.40, 0.20, 2.30],
    isCriticalPhase09: true,
  },
  {
    id: 'CHARGING_PORT',
    nameVi: 'Cổng sạc',
    shape: 'box',
    position: [-0.92, 0.82, -1.40],
    args: [0.25, 0.25, 0.25],
    isCriticalPhase09: true,
  },
  {
    id: 'HOOD',
    nameVi: 'Nắp ca-pô',
    shape: 'box',
    position: [0, 0.82, 1.25],
    args: [1.40, 0.28, 0.95],
    isCriticalPhase09: false,
  },
  {
    id: 'ROOF',
    nameVi: 'Nóc xe',
    shape: 'box',
    position: [0, 1.45, -0.30],
    args: [1.25, 0.12, 1.40],
    isCriticalPhase09: false,
  },
  {
    id: 'HEADLIGHTS',
    nameVi: 'Đèn trước',
    shape: 'box',
    position: [0, 0.75, 1.78],
    args: [1.65, 0.20, 0.30],
    isCriticalPhase09: false,
  },
  {
    id: 'TAILLIGHTS',
    nameVi: 'Đèn sau',
    shape: 'box',
    position: [0, 0.95, -1.82],
    args: [1.55, 0.20, 0.28],
    isCriticalPhase09: false,
  },
  {
    id: 'DIFFUSER',
    nameVi: 'Cản sau & Khuếch tán gió',
    shape: 'box',
    position: [0, 0.32, -1.80],
    args: [1.50, 0.28, 0.35],
    isCriticalPhase09: false,
  },

  // 4. Central Body & Chassis Underframe (Calibrated width to avoid shadowing doors)
  {
    id: 'BODY',
    nameVi: 'Thân xe',
    shape: 'box',
    position: [0, 0.65, 0],
    args: [1.50, 0.60, 3.60],
    isCriticalPhase09: true,
  },
];

export const EV02_SEMANTIC_HITBOXES: SemanticHitboxDef[] = [
  // 1. Wheels (Calibrated to real ev02-stylized.glb bounds)
  {
    id: 'WHEEL_FL',
    nameVi: 'Bánh trước trái',
    shape: 'cylinder',
    position: [0.77, 0.30, 1.37],
    args: [0.30, 0.30, 0.24, 24],
    rotation: [0, 0, Math.PI / 2],
    isCriticalPhase09: true,
  },
  {
    id: 'WHEEL_FR',
    nameVi: 'Bánh trước phải',
    shape: 'cylinder',
    position: [-0.77, 0.30, 1.37],
    args: [0.30, 0.30, 0.24, 24],
    rotation: [0, 0, Math.PI / 2],
    isCriticalPhase09: true,
  },
  {
    id: 'WHEEL_RL',
    nameVi: 'Bánh sau trái',
    shape: 'cylinder',
    position: [0.77, 0.30, -1.27],
    args: [0.30, 0.30, 0.24, 24],
    rotation: [0, 0, Math.PI / 2],
    isCriticalPhase09: true,
  },
  {
    id: 'WHEEL_RR',
    nameVi: 'Bánh sau phải',
    shape: 'cylinder',
    position: [-0.77, 0.30, -1.27],
    args: [0.30, 0.30, 0.24, 24],
    rotation: [0, 0, Math.PI / 2],
    isCriticalPhase09: true,
  },

  // 2. Interactive Doors (Phase 13 Door Semantic Selection & Animation Proxies for EV02)
  {
    id: 'DOOR_FL',
    nameVi: 'Cửa trước trái',
    shape: 'box',
    position: [0.87, 0.76, 0.21],
    args: [0.32, 1.05, 0.95],
    isCriticalPhase09: false,
  },
  {
    id: 'DOOR_FR',
    nameVi: 'Cửa trước phải',
    shape: 'box',
    position: [-0.87, 0.76, 0.21],
    args: [0.32, 1.05, 0.95],
    isCriticalPhase09: false,
  },
  {
    id: 'DOOR_RL',
    nameVi: 'Cửa sau trái',
    shape: 'box',
    position: [0.79, 0.76, -0.69],
    args: [0.26, 1.05, 0.92],
    isCriticalPhase09: false,
  },
  {
    id: 'DOOR_RR',
    nameVi: 'Cửa sau phải',
    shape: 'box',
    position: [-0.79, 0.76, -0.69],
    args: [0.26, 1.05, 0.92],
    isCriticalPhase09: false,
  },

  // 3. Cabin, Glass, Hood, Roof, Headlights, Taillights & Battery
  {
    id: 'WINDSHIELD',
    nameVi: 'Kính chắn gió',
    shape: 'box',
    position: [0.0, 1.05, 0.55],
    args: [1.30, 0.40, 0.70],
    rotation: [-0.45, 0, 0],
    isCriticalPhase09: true,
  },
  {
    id: 'BATTERY',
    nameVi: 'Pin',
    shape: 'box',
    position: [0.0, 0.18, 0.0],
    args: [1.30, 0.20, 2.50],
    isCriticalPhase09: true,
  },
  {
    id: 'CHARGING_PORT',
    nameVi: 'Cổng sạc',
    shape: 'box',
    position: [0.86, 0.80, -1.65],
    args: [0.25, 0.25, 0.25],
    isCriticalPhase09: true,
  },
  {
    id: 'HOOD',
    nameVi: 'Nắp ca-pô',
    shape: 'box',
    position: [0.0, 0.80, 1.60],
    args: [1.40, 0.30, 1.20],
    isCriticalPhase09: false,
  },
  {
    id: 'ROOF',
    nameVi: 'Nóc xe',
    shape: 'box',
    position: [0.0, 1.36, -0.50],
    args: [1.30, 0.15, 1.55],
    isCriticalPhase09: false,
  },
  {
    id: 'HEADLIGHTS',
    nameVi: 'Đèn trước',
    shape: 'box',
    position: [0.0, 0.68, 2.38],
    args: [1.50, 0.28, 0.30],
    isCriticalPhase09: false,
  },
  {
    id: 'TAILLIGHTS',
    nameVi: 'Đèn sau',
    shape: 'box',
    position: [0.0, 0.78, -2.42],
    args: [1.50, 0.28, 0.30],
    isCriticalPhase09: false,
  },

  // 4. Central Body & Chassis Underframe
  {
    id: 'BODY',
    nameVi: 'Thân xe',
    shape: 'box',
    position: [0.0, 0.65, 0.0],
    args: [1.40, 0.70, 4.80],
    isCriticalPhase09: true,
  },
];

/**
 * Standardized Vietnamese labels matching Section 12
 */
export const SEMANTIC_PART_LABELS_VI: Record<string, string> = {
  BODY: 'Thân xe',
  DOOR_FL: 'Cửa trước trái',
  DOOR_FR: 'Cửa trước phải',
  DOOR_RL: 'Cửa sau trái',
  DOOR_RR: 'Cửa sau phải',
  HOOD: 'Nắp ca-pô',
  ROOF: 'Nóc xe',
  WINDSHIELD: 'Kính chắn gió',
  WHEEL_FL: 'Bánh trước trái',
  WHEEL_FR: 'Bánh trước phải',
  WHEEL_RL: 'Bánh sau trái',
  WHEEL_RR: 'Bánh sau phải',
  BATTERY: 'Pin',
  CHARGING_PORT: 'Cổng sạc',
  HEADLIGHTS: 'Đèn trước',
  TAILLIGHTS: 'Đèn sau',
  DIFFUSER: 'Cản sau & Khuếch tán gió',
};

/**
 * Checks whether a vehicle-local 3D point belongs to the specified semantic part.
 * Supports vehicle-specific calibrations for EV01 and EV02.
 */
export function isPointOnSemanticPart(
  localPoint: [number, number, number],
  partCode: string,
  vehicleCode: 'EV01' | 'EV02' = 'EV01'
): boolean {
  const [x, y, z] = localPoint;

  // EV02 Dedicated Geometric Bound Tests
  if (vehicleCode === 'EV02') {
    if (partCode === 'BODY') {
      return Math.abs(x) <= 1.30 && y >= 0.10 && y <= 1.55 && z >= -2.60 && z <= 2.60;
    }
    if (partCode === 'HEADLIGHTS') {
      return z >= 2.10 && y >= 0.40 && y <= 1.00 && Math.abs(x) <= 1.05;
    }
    if (partCode === 'TAILLIGHTS') {
      return z <= -2.10 && y >= 0.50 && y <= 1.10 && Math.abs(x) <= 1.05;
    }
    if (partCode === 'HOOD') {
      return z >= 1.00 && z <= 2.20 && Math.abs(x) <= 0.95 && y >= 0.60 && y <= 1.15;
    }
    if (partCode === 'WINDSHIELD') {
      return z >= 0.10 && z <= 1.00 && Math.abs(x) <= 0.95 && y >= 0.85 && y <= 1.45;
    }
    if (partCode === 'ROOF') {
      return z >= -1.40 && z <= 0.20 && Math.abs(x) <= 0.95 && y >= 1.25;
    }
    if (partCode === 'DOOR_FL') {
      return x >= 0.60 && y >= 0.20 && y <= 1.35 && z >= -0.30 && z <= 0.75;
    }
    if (partCode === 'DOOR_FR') {
      return x <= -0.60 && y >= 0.20 && y <= 1.35 && z >= -0.30 && z <= 0.75;
    }
    if (partCode === 'DOOR_RL') {
      return x >= 0.60 && y >= 0.20 && y <= 1.35 && z >= -1.25 && z <= -0.15;
    }
    if (partCode === 'DOOR_RR') {
      return x <= -0.60 && y >= 0.20 && y <= 1.35 && z >= -1.25 && z <= -0.15;
    }
    if (partCode === 'WHEEL_FL') {
      return x >= 0.55 && y <= 0.65 && z >= 0.95 && z <= 1.75;
    }
    if (partCode === 'WHEEL_FR') {
      return x <= -0.55 && y <= 0.65 && z >= 0.95 && z <= 1.75;
    }
    if (partCode === 'WHEEL_RL') {
      return x >= 0.55 && y <= 0.65 && z >= -1.65 && z <= -0.85;
    }
    if (partCode === 'WHEEL_RR') {
      return x <= -0.55 && y <= 0.65 && z >= -1.65 && z <= -0.85;
    }
    if (partCode === 'CHARGING_PORT') {
      return x >= 0.65 && z >= -1.85 && z <= -1.45 && y >= 0.60 && y <= 1.00;
    }
    if (partCode === 'BATTERY') {
      return Math.abs(x) <= 0.90 && y <= 0.35 && Math.abs(z) <= 1.50;
    }

    const def = EV02_SEMANTIC_HITBOXES.find((d) => d.id === partCode);
    if (def) {
      const dist = Math.hypot(x - def.position[0], y - def.position[1], z - def.position[2]);
      return dist <= 1.50;
    }
    return false;
  }

  // EV01 Existing Geometric Bound Tests
  // 1. BODY: The body shell encompasses the entire main vehicle exterior
  if (partCode === 'BODY') {
    return Math.abs(x) <= 1.25 && y >= 0.15 && y <= 1.70 && z >= -2.45 && z <= 2.45;
  }

  // 2. HEADLIGHTS: Front lighting bar and left/right clusters
  if (partCode === 'HEADLIGHTS') {
    const inHeadlightZone = z >= 1.35 && y >= 0.45 && y <= 1.10 && Math.abs(x) <= 1.05;
    const distToCenter = Math.hypot(x - 0, y - 0.75, z - 1.78);
    const distToLeftCluster = Math.hypot(x - (-0.65), y - 0.75, z - 1.75);
    const distToRightCluster = Math.hypot(x - 0.65, y - 0.75, z - 1.75);
    return inHeadlightZone || distToCenter <= 1.25 || distToLeftCluster <= 0.85 || distToRightCluster <= 0.85;
  }

  // 3. HOOD: Front bonnet / hood surface
  if (partCode === 'HOOD') {
    const inHoodZone = z >= 0.50 && z <= 1.90 && Math.abs(x) <= 0.95 && y >= 0.60 && y <= 1.25;
    const dist = Math.hypot(x - 0, y - 0.82, z - 1.25);
    return inHoodZone || dist <= 1.25;
  }

  // 4. WINDSHIELD: Front panoramic windshield glass
  if (partCode === 'WINDSHIELD') {
    const inWindshieldZone = z >= -0.30 && z <= 1.25 && Math.abs(x) <= 1.05 && y >= 0.75 && y <= 1.65;
    const dist = Math.hypot(x - 0, y - 1.15, z - 0.45);
    return inWindshieldZone || dist <= 1.50;
  }

  // 5. ROOF: Top roof panel
  if (partCode === 'ROOF') {
    const inRoofZone = z >= -1.35 && z <= 0.75 && Math.abs(x) <= 1.00 && y >= 1.20;
    const dist = Math.hypot(x - 0, y - 1.45, z - (-0.30));
    return inRoofZone || dist <= 1.50;
  }

  // 6. TAILLIGHTS: Rear taillight cluster
  if (partCode === 'TAILLIGHTS') {
    const inTailZone = z <= -1.25 && y >= 0.55 && y <= 1.35 && Math.abs(x) <= 1.15;
    const dist = Math.hypot(x - 0, y - 0.95, z - (-1.82));
    return inTailZone || dist <= 1.40;
  }

  // 7. DIFFUSER: Rear lower aerodynamic diffuser & bumper
  if (partCode === 'DIFFUSER') {
    const inDiffuserZone = z <= -1.25 && y <= 0.75 && Math.abs(x) <= 1.10;
    const dist = Math.hypot(x - 0, y - 0.32, z - (-1.80));
    return inDiffuserZone || dist <= 1.35;
  }

  // 8. DOOR_FL: Left Front Door
  if (partCode === 'DOOR_FL') {
    const inDoorZone = x <= -0.45 && z >= -0.20 && z <= 1.35 && y >= 0.20 && y <= 1.55;
    const dist = Math.hypot(x - (-0.88), y - 0.80, z - 0.55);
    return inDoorZone || dist <= 1.40;
  }

  // 9. DOOR_FR: Right Front Door
  if (partCode === 'DOOR_FR') {
    const inDoorZone = x >= 0.45 && z >= -0.20 && z <= 1.35 && y >= 0.20 && y <= 1.55;
    const dist = Math.hypot(x - 0.88, y - 0.80, z - 0.55);
    return inDoorZone || dist <= 1.40;
  }

  // 10. DOOR_RL: Left Rear Door
  if (partCode === 'DOOR_RL') {
    const inDoorZone = x <= -0.45 && z >= -1.35 && z <= 0.25 && y >= 0.20 && y <= 1.55;
    const dist = Math.hypot(x - (-0.88), y - 0.80, z - (-0.50));
    return inDoorZone || dist <= 1.40;
  }

  // 11. DOOR_RR: Right Rear Door
  if (partCode === 'DOOR_RR') {
    const inDoorZone = x >= 0.45 && z >= -1.35 && z <= 0.25 && y >= 0.20 && y <= 1.55;
    const dist = Math.hypot(x - 0.88, y - 0.80, z - (-0.50));
    return inDoorZone || dist <= 1.40;
  }

  // 12. WHEEL_FL: Left Front Wheel
  if (partCode === 'WHEEL_FL') {
    const inWheelZone = x <= -0.40 && z >= 0.55 && z <= 2.05 && y <= 0.95;
    const dist = Math.hypot(x - (-0.80), y - 0.36, z - 1.31);
    return inWheelZone || dist <= 1.30;
  }

  // 13. WHEEL_FR: Right Front Wheel
  if (partCode === 'WHEEL_FR') {
    const inWheelZone = x >= 0.40 && z >= 0.55 && z <= 2.05 && y <= 0.95;
    const dist = Math.hypot(x - 0.80, y - 0.36, z - 1.31);
    return inWheelZone || dist <= 1.30;
  }

  // 14. WHEEL_RL: Left Rear Wheel
  if (partCode === 'WHEEL_RL') {
    const inWheelZone = x <= -0.40 && z >= -2.05 && z <= -0.55 && y <= 0.95;
    const dist = Math.hypot(x - (-0.80), y - 0.36, z - (-1.31));
    return inWheelZone || dist <= 1.30;
  }

  // 15. WHEEL_RR: Right Rear Wheel
  if (partCode === 'WHEEL_RR') {
    const inWheelZone = x >= 0.40 && z >= -2.05 && z <= -0.55 && y <= 0.95;
    const dist = Math.hypot(x - 0.80, y - 0.36, z - (-1.31));
    return inWheelZone || dist <= 1.30;
  }

  // 16. CHARGING_PORT: Left rear quarter charge port
  if (partCode === 'CHARGING_PORT') {
    const inPortZone = x <= -0.55 && z >= -1.85 && z <= -0.95 && y >= 0.45 && y <= 1.25;
    const dist = Math.hypot(x - (-0.92), y - 0.82, z - (-1.40));
    return inPortZone || dist <= 1.10;
  }

  // 17. BATTERY: Underbody battery pack
  if (partCode === 'BATTERY') {
    const inBatteryZone = y <= 0.55 && Math.abs(x) <= 1.05 && Math.abs(z) <= 1.75;
    const dist = Math.hypot(x - 0, y - 0.20, z - 0);
    return inBatteryZone || dist <= 1.65;
  }

  // Fallback: check distance to part hitbox center with generous tolerance (1.5m)
  const def = SEMANTIC_HITBOX_DEFINITIONS.find((d) => d.id === partCode);
  if (def) {
    const dist = Math.hypot(x - def.position[0], y - def.position[1], z - def.position[2]);
    return dist <= 1.50;
  }

  return false;
}

/**
 * Resolves the nearest semantic part from a 3D local coordinate on EV01 or EV02.
 * Ensures domain data is bound to semantic vehicle parts rather than GLB node names.
 */
export function resolveSemanticPartFromLocalPoint(
  localPoint: [number, number, number],
  vehicleCode: 'EV01' | 'EV02' = 'EV01'
): VehiclePartId {
  // Check specific semantic parts in priority order
  const priorityParts: VehiclePartId[] = [
    'HEADLIGHTS',
    'TAILLIGHTS',
    'CHARGING_PORT',
    'DIFFUSER',
    'HOOD',
    'WINDSHIELD',
    'ROOF',
    'DOOR_FL',
    'DOOR_FR',
    'DOOR_RL',
    'DOOR_RR',
    'WHEEL_FL',
    'WHEEL_FR',
    'WHEEL_RL',
    'WHEEL_RR',
    'BATTERY',
  ];

  for (const partId of priorityParts) {
    if (isPointOnSemanticPart(localPoint, partId, vehicleCode)) {
      return partId;
    }
  }

  return 'BODY';
}

// ============================================================================
// 2. SEMANTIC BUSINESS METADATA
// Authoritative domain data for vehicle parts without geometric coupling.
// ============================================================================

export interface SemanticPartMetadata {
  id: VehiclePartId;
  nameVi: string;
  categoryVi: string;
  status: PartStatus;
  descriptionVi: string;
  specs: PartSpecItem[];
}

export const SEMANTIC_PARTS_METADATA: Record<VehiclePartId, SemanticPartMetadata> = {
  WHEEL_FL: {
    id: 'WHEEL_FL',
    nameVi: 'Bánh trước trái',
    categoryVi: 'Hệ thống treo & Bánh xe',
    status: 'NORMAL',
    descriptionVi: 'Bánh xe hợp kim khí động học 20 inch, tích hợp cảm biến áp suất lốp TPMS và phanh tái sinh.',
    specs: [
      { label: 'Kích thước', value: '245/45 R20' },
      { label: 'Áp suất lốp', value: '2.4 bar' },
      { label: 'Độ mòn gai', value: '8.2 mm (Rất tốt)' },
      { label: 'Vành mâm', value: 'Hợp kim Aero-Disc' },
    ],
  },
  WHEEL_FR: {
    id: 'WHEEL_FR',
    nameVi: 'Bánh trước phải',
    categoryVi: 'Hệ thống treo & Bánh xe',
    status: 'NORMAL',
    descriptionVi: 'Bánh xe hợp kim khí động học 20 inch phía trước bên phải, cân bằng động tối ưu.',
    specs: [
      { label: 'Kích thước', value: '245/45 R20' },
      { label: 'Áp suất lốp', value: '2.4 bar' },
      { label: 'Độ mòn gai', value: '8.1 mm (Rất tốt)' },
      { label: 'Hệ thống phanh', value: 'Đĩa thông gió 355mm' },
    ],
  },
  WHEEL_RL: {
    id: 'WHEEL_RL',
    nameVi: 'Bánh sau trái',
    categoryVi: 'Hệ thống treo & Bánh xe',
    status: 'NORMAL',
    descriptionVi: 'Bánh xe dẫn động cầu sau bản rộng 275mm, tăng cường lực bám đường khi tăng tốc.',
    specs: [
      { label: 'Kích thước', value: '275/40 R20' },
      { label: 'Áp suất lốp', value: '2.5 bar' },
      { label: 'Độ mòn gai', value: '7.9 mm (Tốt)' },
      { label: 'Dẫn động', value: 'Mô-tơ điện cầu sau' },
    ],
  },
  WHEEL_RR: {
    id: 'WHEEL_RR',
    nameVi: 'Bánh sau phải',
    categoryVi: 'Hệ thống treo & Bánh xe',
    status: 'NORMAL',
    descriptionVi: 'Bánh xe dẫn động cầu sau bên phải, hỗ trợ kiểm soát lực kéo điện tử TCS.',
    specs: [
      { label: 'Kích thước', value: '275/40 R20' },
      { label: 'Áp suất lốp', value: '2.5 bar' },
      { label: 'Độ mòn gai', value: '8.0 mm (Tốt)' },
      { label: 'Cảm biến', value: 'Tốc độ quay ABS/ESP' },
    ],
  },
  DOOR_FL: {
    id: 'DOOR_FL',
    nameVi: 'Cửa trước trái',
    categoryVi: 'Cửa & Thân vỏ',
    status: 'NORMAL',
    descriptionVi: 'Cửa xe phía trước bên lái, tích hợp kính chỉnh điện, gương chiếu hậu và tay nắm ẩn khí động học.',
    specs: [
      { label: 'Vị trí', value: 'Bên lái (Trước trái)' },
      { label: 'Góc mở tối đa', value: '62 độ' },
      { label: 'Kính xe', value: 'Cách âm 2 lớp Acoustic' },
      { label: 'Khóa cửa', value: 'Khóa điện tử thông minh' },
    ],
  },
  DOOR_FR: {
    id: 'DOOR_FR',
    nameVi: 'Cửa trước phải',
    categoryVi: 'Cửa & Thân vỏ',
    status: 'NORMAL',
    descriptionVi: 'Cửa xe phía trước bên phụ, tích hợp cảm biến mở cửa an toàn Safe Exit Assist.',
    specs: [
      { label: 'Vị trí', value: 'Bên phụ (Trước phải)' },
      { label: 'Góc mở tối đa', value: '62 độ' },
      { label: 'Kính xe', value: 'Cách âm 2 lớp Acoustic' },
      { label: 'Cảm biến', value: 'Safe Exit Cảnh báo mở cửa' },
    ],
  },
  DOOR_RL: {
    id: 'DOOR_RL',
    nameVi: 'Cửa sau trái',
    categoryVi: 'Cửa & Thân vỏ',
    status: 'NORMAL',
    descriptionVi: 'Cửa hành khách phía sau bên trái, trang bị khóa trẻ em điện tử và kính tối màu chống nắng riêng tư.',
    specs: [
      { label: 'Vị trí', value: 'Hành khách (Sau trái)' },
      { label: 'Góc mở tối đa', value: '58 độ' },
      { label: 'Khóa trẻ em', value: 'Điều khiển điện tử trung tâm' },
      { label: 'Kính xe', value: 'Kính tối màu Privacy Glass' },
    ],
  },
  DOOR_RR: {
    id: 'DOOR_RR',
    nameVi: 'Cửa sau phải',
    categoryVi: 'Cửa & Thân vỏ',
    status: 'NORMAL',
    descriptionVi: 'Cửa hành khách phía sau bên phải, hỗ trợ hít cửa êm ái và bảo vệ hành khách.',
    specs: [
      { label: 'Vị trí', value: 'Hành khách (Sau phải)' },
      { label: 'Góc mở tối đa', value: '58 độ' },
      { label: 'Khóa trẻ em', value: 'Điều khiển điện tử trung tâm' },
      { label: 'Kính xe', value: 'Kính tối màu Privacy Glass' },
    ],
  },
  HOOD: {
    id: 'HOOD',
    nameVi: 'Nắp ca-pô',
    categoryVi: 'Ngoại thất khí động học',
    status: 'NORMAL',
    descriptionVi: 'Mũi xe khí động học vuốt dốc tích hợp khoang hành lý phía trước (Frunk) mở điện tử.',
    specs: [
      { label: 'Dung tích Frunk', value: '68 Lít' },
      { label: 'Đóng/Mở', value: 'Trợ lực điện tử' },
      { label: 'Vật liệu', value: 'Nhôm dập nguyên khối' },
      { label: 'Khóa an toàn', value: 'Khóa kép cảm biến' },
    ],
  },
  HEADLIGHTS: {
    id: 'HEADLIGHTS',
    nameVi: 'Đèn trước',
    categoryVi: 'Hệ thống chiếu sáng',
    status: 'NORMAL',
    descriptionVi: 'Dải LED ma trận ma trận trải dài toàn chiều rộng, tích hợp tính năng thích ứng chống lóa.',
    specs: [
      { label: 'Công nghệ', value: 'Matrix Cyber LED' },
      { label: 'Tầm chiếu xa', value: '450m' },
      { label: 'Chức năng', value: 'Tự động thích ứng (AHS)' },
      { label: 'Hiệu ứng', value: 'Dynamic Welcome' },
    ],
  },
  WINDSHIELD: {
    id: 'WINDSHIELD',
    nameVi: 'Kính chắn gió',
    categoryVi: 'Hệ thống kính & Tầm nhìn',
    status: 'NORMAL',
    descriptionVi: 'Kính nhiều lớp cao cấp cách âm, cách nhiệt hai lớp chống 99.8% tia cực tím UV.',
    specs: [
      { label: 'Loại kính', value: 'Kính nhiều lớp Acoustic' },
      { label: 'Chống tia UV', value: '99.8%' },
      { label: 'Cảm biến', value: 'Gạt mưa & Camera ADAS' },
      { label: 'Sưởi kính', value: 'Sấy kính điện vi sợi' },
    ],
  },
  ROOF: {
    id: 'ROOF',
    nameVi: 'Nóc xe',
    categoryVi: 'Khung vỏ & Mui xe',
    status: 'NORMAL',
    descriptionVi: 'Mui kính toàn cảnh panorama cường lực nguyên khối, tạo không gian thoáng đãng cho khoang lái.',
    specs: [
      { label: 'Cấu trúc', value: 'Kính cách nhiệt Low-E' },
      { label: 'Chịu lực ép', value: 'Đạt chuẩn 5 sao rollover' },
      { label: 'Lớp mạ', value: 'Bạc phản xạ nhiệt' },
    ],
  },
  TAILLIGHTS: {
    id: 'TAILLIGHTS',
    nameVi: 'Đèn sau',
    categoryVi: 'Hệ thống chiếu sáng',
    status: 'NORMAL',
    descriptionVi: 'Dải đèn hậu xuyên suốt ngang đuôi xe, phát tín hiệu phanh khẩn cấp thích ứng nhấp nháy nhanh.',
    specs: [
      { label: 'Công nghệ', value: '3D Full-Width LED' },
      { label: 'Tín hiệu rẽ', value: 'Đèn chạy tia Sequential' },
      { label: 'Phanh khẩn cấp', value: 'Tự động nhấp nháy ESS' },
    ],
  },
  DIFFUSER: {
    id: 'DIFFUSER',
    nameVi: 'Cản sau & Khuếch tán gió',
    categoryVi: 'Ngoại thất khí động học',
    status: 'NORMAL',
    descriptionVi: 'Khuếch tán gầm sau điều hướng luồng khí thoát đáy xe, giảm nhiễu động khí động học ở tốc độ cao.',
    specs: [
      { label: 'Hệ số cản', value: 'Cd 0.23' },
      { label: 'Cảm biến lùi', value: '4 Cảm biến siêu âm' },
      { label: 'Radar sau', value: 'Radar cảnh báo cắt ngang' },
    ],
  },
  BATTERY: {
    id: 'BATTERY',
    nameVi: 'Pin',
    categoryVi: 'Hệ thống năng lượng',
    status: 'NORMAL',
    descriptionVi: 'Khối pin Lithium-ion NMC lắp đặt dưới sàn gầm, gia cố khung hợp kim chống va đập tiêu chuẩn IP68.',
    specs: [
      { label: 'Dung lượng', value: '75.0 kWh' },
      { label: 'Điện áp định mức', value: '400 V' },
      { label: 'Tình trạng SoH', value: '98.5% (Tốt)' },
      { label: 'Làm mát', value: 'Chất lỏng chủ động' },
    ],
  },
  CHARGING_PORT: {
    id: 'CHARGING_PORT',
    nameVi: 'Cổng sạc',
    categoryVi: 'Hệ thống sạc',
    status: 'NORMAL',
    descriptionVi: 'Cổng sạc đa chuẩn kết hợp CCS2 và Type 2, hỗ trợ sạc siêu nhanh DC và sạc chậm AC tại nhà.',
    specs: [
      { label: 'Chuẩn sạc DC', value: 'CCS Combo 2 (150 kW)' },
      { label: 'Chuẩn sạc AC', value: 'Type 2 Mennekes (11 kW)' },
      { label: 'Nắp che cổng', value: 'Mở điện tử một chạm' },
      { label: 'Đèn báo trạng thái', value: 'Vòng LED RGB đa sắc' },
    ],
  },
  BODY: {
    id: 'BODY',
    nameVi: 'Thân xe',
    categoryVi: 'Khung vỏ xe',
    status: 'NORMAL',
    descriptionVi: 'Khung gầm liền khối kết hợp thép siêu cường boron và hợp kim nhôm hấp thụ xung lực đa hướng.',
    specs: [
      { label: 'Cấu trúc', value: 'Khung nhôm - thép tổ hợp' },
      { label: 'Độ cứng xoắn', value: '40.000 Nm/độ' },
      { label: 'Lớp sơn', value: 'Sơn tĩnh điện 4 lớp cao cấp' },
      { label: 'Bảo vệ ăn mòn', value: 'Mạ kẽm nhúng nóng' },
    ],
  },
};

// ============================================================================
// 3. SPATIAL INTERACTION & CAMERA PRESET CONFIGURATION
// Separates 3D spatial anchor points from business data.
// ============================================================================

export interface PartSpatialConfig {
  localCenter: [number, number, number];
  cameraPreset: {
    target: [number, number, number];
    position: [number, number, number];
  };
  panelPosition: [number, number, number];
}

export const PARTS_SPATIAL_CONFIG: Record<VehiclePartId, PartSpatialConfig> = {
  WHEEL_FL: {
    localCenter: [-0.80, 0.36, 1.31],
    cameraPreset: {
      target: [-1.9, 0.55, 2.81],
      position: [-7.0, 3.1, 8.4],
    },
    panelPosition: [1.3, 1.3, 2.6],
  },
  WHEEL_FR: {
    localCenter: [0.80, 0.36, 1.31],
    cameraPreset: {
      target: [-0.4, 0.55, 2.81],
      position: [3.5, 3.1, 8.3],
    },
    panelPosition: [2.6, 1.3, 0.6],
  },
  WHEEL_RL: {
    localCenter: [-0.80, 0.36, -1.31],
    cameraPreset: {
      target: [-1.9, 0.55, 0.19],
      position: [-7.1, 3.1, -5.0],
    },
    panelPosition: [-1.9, 1.3, 0.2],
  },
  WHEEL_RR: {
    localCenter: [0.80, 0.36, -1.31],
    cameraPreset: {
      target: [-0.4, 0.55, 0.19],
      position: [3.44, 3.1, -5.0],
    },
    panelPosition: [1.3, 1.3, -2.8],
  },
  DOOR_FL: {
    localCenter: [-0.88, 0.80, 0.55],
    cameraPreset: {
      target: [-1.2, 0.85, 1.5],
      position: [-5.5, 2.6, 6.5],
    },
    panelPosition: [1.8, 1.4, 1.5],
  },
  DOOR_FR: {
    localCenter: [0.88, 0.80, 0.55],
    cameraPreset: {
      target: [0.2, 0.85, 1.5],
      position: [4.8, 2.6, 6.5],
    },
    panelPosition: [2.8, 1.4, 0.5],
  },
  DOOR_RL: {
    localCenter: [-0.88, 0.80, -0.50],
    cameraPreset: {
      target: [-1.2, 0.85, -0.2],
      position: [-5.5, 2.6, -3.8],
    },
    panelPosition: [1.8, 1.4, -0.5],
  },
  DOOR_RR: {
    localCenter: [0.88, 0.80, -0.50],
    cameraPreset: {
      target: [0.2, 0.85, -0.2],
      position: [4.8, 2.6, -3.8],
    },
    panelPosition: [2.8, 1.4, -1.5],
  },
  HOOD: {
    localCenter: [0, 0.82, 1.25],
    cameraPreset: {
      target: [-0.7, 0.95, 2.75],
      position: [-0.7, 4.3, 10.5],
    },
    panelPosition: [2.6, 1.35, 2.0],
  },
  HEADLIGHTS: {
    localCenter: [0, 0.75, 1.78],
    cameraPreset: {
      target: [-0.7, 0.85, 3.28],
      position: [-0.7, 3.2, 10.3],
    },
    panelPosition: [2.6, 1.3, 2.1],
  },
  WINDSHIELD: {
    localCenter: [0, 1.15, 0.45],
    cameraPreset: {
      target: [-0.5, 1.25, 1.95],
      position: [-0.5, 4.5, 9.0],
    },
    panelPosition: [2.6, 1.45, 0.0],
  },
  ROOF: {
    localCenter: [0, 1.45, -0.3],
    cameraPreset: {
      target: [-0.5, 1.55, 1.2],
      position: [-0.5, 6.5, 8.0],
    },
    panelPosition: [2.6, 1.65, -0.2],
  },
  TAILLIGHTS: {
    localCenter: [0, 0.95, -1.82],
    cameraPreset: {
      target: [-2.3, 1.05, -0.32],
      position: [-2.3, 3.3, -7.0],
    },
    panelPosition: [-1.9, 1.3, -2.0],
  },
  DIFFUSER: {
    localCenter: [0, 0.32, -1.80],
    cameraPreset: {
      target: [-2.3, 0.50, -0.30],
      position: [-2.3, 2.8, -7.0],
    },
    panelPosition: [-1.9, 1.25, -2.0],
  },
  BATTERY: {
    localCenter: [0, 0.20, 0],
    cameraPreset: {
      target: [-2.0, 0.35, 1.5],
      position: [-7.65, 2.5, 4.95],
    },
    panelPosition: [1.3, 1.3, 2.2],
  },
  CHARGING_PORT: {
    localCenter: [-0.92, 0.82, -1.40],
    cameraPreset: {
      target: [-2.6, 0.95, 0.10],
      position: [-7.65, 2.8, 1.8],
    },
    panelPosition: [0.9, 1.3, 0.8],
  },
  BODY: {
    localCenter: [0, 0.72, 0],
    cameraPreset: {
      target: [-0.6, 0.85, 1.5],
      position: [-0.6, 4.4, 10.7],
    },
    panelPosition: [2.6, 1.4, 0.0],
  },
};

// ============================================================================
// 4. COMBINED VEHICLE_PARTS REGISTRY (Preserves existing contract)
// ============================================================================

export const VEHICLE_PARTS: Record<VehiclePartId, VehiclePartConfig> = Object.keys(
  SEMANTIC_PARTS_METADATA
).reduce((acc, key) => {
  const partId = key as VehiclePartId;
  const meta = SEMANTIC_PARTS_METADATA[partId];
  const spatial = PARTS_SPATIAL_CONFIG[partId];
  acc[partId] = {
    ...meta,
    ...spatial,
    nodeNames: [partId],
  };
  return acc;
}, {} as Record<VehiclePartId, VehiclePartConfig>);

// ============================================================================
// 5. LEGACY MESH-NAME FALLBACK MAPPING (Retained for backwards compatibility)
// ============================================================================

export const LEGACY_MESH_TO_PART_MAP: Record<string, VehiclePartId> = {
  Chassis_Body: 'BODY',
  Chassis_Nose: 'HOOD',
  Cabin_Glass: 'WINDSHIELD',
  Roof_Panel: 'ROOF',
  Wheel_Front_Left: 'WHEEL_FL',
  Wheel_Front_Right: 'WHEEL_FR',
  Wheel_Rear_Left: 'WHEEL_RL',
  Wheel_Rear_Right: 'WHEEL_RR',
  Headlight_Bar: 'HEADLIGHTS',
  Taillight_Bar: 'TAILLIGHTS',
  Battery_Pack: 'BATTERY',
  Charging_Port: 'CHARGING_PORT',
  Aerodynamic_Diffuser: 'DIFFUSER',
};

// Maintain alias for any legacy imports
export const MESH_TO_PART_MAP = LEGACY_MESH_TO_PART_MAP;

/**
 * Traverses upwards from an intersected Three.js Object3D to find
 * the corresponding VehiclePartId if it belongs to any legacy registered node.
 */
export function getPartIdFromMesh(obj: THREE.Object3D): VehiclePartId | null {
  let curr: THREE.Object3D | null = obj;
  while (curr && curr.name !== 'EV01_DigitalTwin') {
    if (curr.name && LEGACY_MESH_TO_PART_MAP[curr.name]) {
      return LEGACY_MESH_TO_PART_MAP[curr.name];
    }
    curr = curr.parent;
  }
  return null;
}

/**
 * Returns part configuration by ID
 */
export function getPartById(id: VehiclePartId | string | null): VehiclePartConfig | null {
  if (!id) return null;
  return VEHICLE_PARTS[id as VehiclePartId] || null;
}
