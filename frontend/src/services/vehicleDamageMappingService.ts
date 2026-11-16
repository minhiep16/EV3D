import { VehiclePartId } from '../types/vehiclePart';
import { DamageRecordData, DamageSeverity, DAMAGE_TYPE_LABELS, DAMAGE_SEVERITY_CONFIG } from '../types/damage';
import { VehicleResponse } from '../types/vehicle';
import { resolveVehicleCode } from '../components/three/vehicles/vehicleModelConfig';

// ============================================================================
// 1. CANONICAL VEHICLE COMPONENT REGISTRY
// ============================================================================

export interface ComponentMetadata {
  id: VehiclePartId;
  nameVi: string;
  categoryVi: string;
  defaultAnchorSide: 'left' | 'right' | 'top';
  icon: string;
}

export const CANONICAL_VEHICLE_COMPONENTS: Record<VehiclePartId, ComponentMetadata> = {
  WINDSHIELD: {
    id: 'WINDSHIELD',
    nameVi: 'Kính chắn gió',
    categoryVi: 'Hệ thống kính & Tầm nhìn',
    defaultAnchorSide: 'top',
    icon: 'shield',
  },
  DOOR_FL: {
    id: 'DOOR_FL',
    nameVi: 'Cửa trước bên trái',
    categoryVi: 'Cửa & Thân vỏ',
    defaultAnchorSide: 'left',
    icon: 'shield',
  },
  DOOR_FR: {
    id: 'DOOR_FR',
    nameVi: 'Cửa trước bên phải',
    categoryVi: 'Cửa & Thân vỏ',
    defaultAnchorSide: 'right',
    icon: 'shield',
  },
  DOOR_RL: {
    id: 'DOOR_RL',
    nameVi: 'Cửa sau bên trái',
    categoryVi: 'Cửa & Thân vỏ',
    defaultAnchorSide: 'left',
    icon: 'shield',
  },
  DOOR_RR: {
    id: 'DOOR_RR',
    nameVi: 'Cửa sau bên phải',
    categoryVi: 'Cửa & Thân vỏ',
    defaultAnchorSide: 'right',
    icon: 'shield',
  },
  HOOD: {
    id: 'HOOD',
    nameVi: 'Nắp ca-pô',
    categoryVi: 'Khung vỏ & Đầu xe',
    defaultAnchorSide: 'top',
    icon: 'layers',
  },
  ROOF: {
    id: 'ROOF',
    nameVi: 'Nóc xe',
    categoryVi: 'Khung vỏ & Mui xe',
    defaultAnchorSide: 'top',
    icon: 'sun',
  },
  WHEEL_FL: {
    id: 'WHEEL_FL',
    nameVi: 'Bánh trước trái',
    categoryVi: 'Hệ thống treo & Bánh xe',
    defaultAnchorSide: 'left',
    icon: 'disc',
  },
  WHEEL_FR: {
    id: 'WHEEL_FR',
    nameVi: 'Bánh trước phải',
    categoryVi: 'Hệ thống treo & Bánh xe',
    defaultAnchorSide: 'right',
    icon: 'disc',
  },
  WHEEL_RL: {
    id: 'WHEEL_RL',
    nameVi: 'Bánh sau trái',
    categoryVi: 'Hệ thống treo & Bánh xe',
    defaultAnchorSide: 'left',
    icon: 'disc',
  },
  WHEEL_RR: {
    id: 'WHEEL_RR',
    nameVi: 'Bánh sau phải',
    categoryVi: 'Hệ thống treo & Bánh xe',
    defaultAnchorSide: 'right',
    icon: 'disc',
  },
  HEADLIGHTS: {
    id: 'HEADLIGHTS',
    nameVi: 'Đèn pha',
    categoryVi: 'Hệ thống chiếu sáng',
    defaultAnchorSide: 'right',
    icon: 'sun',
  },
  TAILLIGHTS: {
    id: 'TAILLIGHTS',
    nameVi: 'Đèn hậu',
    categoryVi: 'Hệ thống chiếu sáng',
    defaultAnchorSide: 'left',
    icon: 'sparkles',
  },
  BATTERY: {
    id: 'BATTERY',
    nameVi: 'Bộ pin cao áp',
    categoryVi: 'Hệ thống năng lượng',
    defaultAnchorSide: 'left',
    icon: 'battery',
  },
  CHARGING_PORT: {
    id: 'CHARGING_PORT',
    nameVi: 'Cổng sạc',
    categoryVi: 'Hệ thống sạc',
    defaultAnchorSide: 'left',
    icon: 'zap',
  },
  BODY: {
    id: 'BODY',
    nameVi: 'Thân vỏ',
    categoryVi: 'Khung gầm & Ngoại thất',
    defaultAnchorSide: 'right',
    icon: 'layers',
  },
  DIFFUSER: {
    id: 'DIFFUSER',
    nameVi: 'Cản sau & Khuếch tán',
    categoryVi: 'Ngoại thất khí động học',
    defaultAnchorSide: 'left',
    icon: 'sparkles',
  },
  SIDE_MIRROR: {
    id: 'SIDE_MIRROR',
    nameVi: 'Gương chiếu hậu',
    categoryVi: 'Gương & Quan sát',
    defaultAnchorSide: 'left',
    icon: 'eye',
  },
  DOOR_HANDLE: {
    id: 'DOOR_HANDLE',
    nameVi: 'Tay nắm cửa',
    categoryVi: 'Cửa & Khóa',
    defaultAnchorSide: 'left',
    icon: 'key',
  },
  INTERIOR_CABIN: {
    id: 'INTERIOR_CABIN',
    nameVi: 'Khoang lái',
    categoryVi: 'Nội thất & Điều khiển',
    defaultAnchorSide: 'right',
    icon: 'compass',
  },
};

// ============================================================================
// 2. CENTRALIZED COMPONENT NORMALIZATION
// ============================================================================

/**
 * Normalizes any component code, legacy identifier, or localized string
 * into a canonical VehiclePartId.
 */
export function normalizeComponentId(rawCode?: string | null): VehiclePartId | null {
  if (!rawCode) return null;
  const upper = rawCode
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove Vietnamese diacritics
    .replace(/[-\s]/g, '_');

  // Exact match
  if (upper in CANONICAL_VEHICLE_COMPONENTS) {
    return upper as VehiclePartId;
  }

  // Doors
  if (upper === 'FRONT_LEFT_DOOR' || upper === 'DOOR_FRONT_LEFT' || upper.includes('CUA_TRUOC_TRAI') || upper.includes('CUA_TRUOC_BEN_TRAI')) {
    return 'DOOR_FL';
  }
  if (upper === 'FRONT_RIGHT_DOOR' || upper === 'DOOR_FRONT_RIGHT' || upper.includes('CUA_TRUOC_PHAI') || upper.includes('CUA_TRUOC_BEN_PHAI')) {
    return 'DOOR_FR';
  }
  if (upper === 'REAR_LEFT_DOOR' || upper === 'DOOR_REAR_LEFT' || upper.includes('CUA_SAU_TRAI') || upper.includes('CUA_SAU_BEN_TRAI')) {
    return 'DOOR_RL';
  }
  if (upper === 'REAR_RIGHT_DOOR' || upper === 'DOOR_REAR_RIGHT' || upper.includes('CUA_SAU_PHAI') || upper.includes('CUA_SAU_BEN_PHAI')) {
    return 'DOOR_RR';
  }
  if (upper.includes('TAY_NAM') || upper.includes('HANDLE')) {
    return 'DOOR_HANDLE';
  }

  // Wheels & Tires
  if (upper === 'FRONT_LEFT_WHEEL' || upper === 'WHEEL_FRONT_LEFT' || upper.includes('BANH_TRUOC_TRAI') || upper.includes('BANH_XE_TRUOC_TRAI')) {
    return 'WHEEL_FL';
  }
  if (upper === 'FRONT_RIGHT_WHEEL' || upper === 'WHEEL_FRONT_RIGHT' || upper.includes('BANH_TRUOC_PHAI') || upper.includes('BANH_XE_TRUOC_PHAI')) {
    return 'WHEEL_FR';
  }
  if (upper === 'REAR_LEFT_WHEEL' || upper === 'WHEEL_REAR_LEFT' || upper.includes('BANH_SAU_TRAI') || upper.includes('BANH_XE_SAU_TRAI')) {
    return 'WHEEL_RL';
  }
  if (upper === 'REAR_RIGHT_WHEEL' || upper === 'WHEEL_REAR_RIGHT' || upper.includes('BANH_SAU_PHAI') || upper.includes('BANH_XE_SAU_PHAI')) {
    return 'WHEEL_RR';
  }
  if (upper === 'BANH_XE' || upper === 'WHEEL' || upper === 'TIRE') {
    return 'WHEEL_FL';
  }

  // Glass & Hood & Roof
  if (upper.includes('KINH_CHAN_GIO') || upper.includes('WINDSHIELD') || upper.includes('WINDSCREEN') || upper.includes('KINH_LAI')) {
    return 'WINDSHIELD';
  }
  if (upper.includes('NAP_CA_PO') || upper.includes('CAPO') || upper.includes('BONNET') || upper.includes('FRONT_HOOD') || upper === 'HOOD') {
    return 'HOOD';
  }
  if (upper.includes('NOC_XE') || upper.includes('MUI_XE') || upper.includes('PANORAMA') || upper === 'ROOF') {
    return 'ROOF';
  }
  if (upper.includes('GUONG') || upper.includes('MIRROR')) {
    return 'SIDE_MIRROR';
  }

  // Lights & Bumpers
  if (upper.includes('DEN_PHA') || upper.includes('HEADLIGHT') || upper === 'FRONT_BUMPER' || upper === 'BUMPER_F') {
    return 'HEADLIGHTS';
  }
  if (upper.includes('DEN_HAU') || upper.includes('TAILLIGHT') || upper === 'REAR_LIGHT') {
    return 'TAILLIGHTS';
  }
  if (upper.includes('KHUECH_TAN') || upper.includes('DIFFUSER') || upper.includes('CAN_SAU') || upper === 'REAR_BUMPER' || upper === 'BUMPER_R') {
    return 'DIFFUSER';
  }

  // Power & Cabin
  if (upper.includes('BATTERY') || upper.includes('PIN') || upper.includes('BO_PIN')) {
    return 'BATTERY';
  }
  if (upper.includes('CONG_SAC') || upper.includes('CHARGE_PORT') || upper.includes('CHARGER')) {
    return 'CHARGING_PORT';
  }
  if (upper.includes('KHOANG_LAI') || upper.includes('CABIN') || upper.includes('NOI_THAT')) {
    return 'INTERIOR_CABIN';
  }
  if (upper.includes('THAN_VO') || upper.includes('VO_XE') || upper.includes('CHASSIS') || upper === 'BODY') {
    return 'BODY';
  }

  return null;
}

// ============================================================================
// 3. MODEL-SPECIFIC 3D ANCHORS REGISTRY
// ============================================================================

export type AnchorCoordinates = [number, number, number];

export interface ModelAnchorConfig {
  anchors: Partial<Record<VehiclePartId, AnchorCoordinates>>;
  calloutOffsets?: Partial<Record<VehiclePartId, AnchorCoordinates>>;
}

/**
 * Standard calibrated 3D anchor definitions per vehicle model.
 * EV01 serves as the canonical base model for SUV / Crossover geometry.
 */
export const MODEL_ANCHOR_REGISTRY: Record<string, ModelAnchorConfig> = {
  // 1. EV01 / VinFast VF8 Plus / Standard Crossover & SUV
  EV01: {
    anchors: {
      WHEEL_FL: [-0.86, 0.36, 1.34],
      WHEEL_FR: [0.86, 0.36, 1.34],
      WHEEL_RL: [-0.86, 0.36, -1.34],
      WHEEL_RR: [0.86, 0.36, -1.34],
      DOOR_FL: [-0.92, 0.86, 0.52],
      DOOR_FR: [0.92, 0.86, 0.52],
      DOOR_RL: [-0.92, 0.86, -0.42],
      DOOR_RR: [0.92, 0.86, -0.42],
      HEADLIGHTS: [0.66, 0.74, 1.88],
      WINDSHIELD: [0.0, 1.22, 0.62],
      BATTERY: [-0.86, 0.22, -0.28],
      CHARGING_PORT: [-0.88, 0.86, -1.42],
      HOOD: [0.0, 0.82, 1.25],
      ROOF: [0.0, 1.45, -0.30],
      TAILLIGHTS: [0.52, 0.92, -1.92],
      BODY: [0.90, 0.78, -0.52],
      DIFFUSER: [0.0, 0.32, -1.80],
      SIDE_MIRROR: [-0.96, 1.02, 0.68],
      DOOR_HANDLE: [-0.92, 0.86, 0.04],
      INTERIOR_CABIN: [-0.26, 1.28, -0.18],
    },
    calloutOffsets: {
      DOOR_FR: [0.95, 0.55, 0.20],
      DOOR_FL: [-0.95, 0.55, 0.20],
      DOOR_RR: [0.95, 0.55, -0.20],
      DOOR_RL: [-0.95, 0.55, -0.20],
      WHEEL_FL: [-0.95, 0.58, 0.35],
      WHEEL_FR: [0.95, 0.58, 0.35],
      WHEEL_RL: [-0.95, 0.58, -0.35],
      WHEEL_RR: [0.95, 0.58, -0.35],
      HEADLIGHTS: [0.75, 0.62, 0.55],
      WINDSHIELD: [0.85, 0.62, 0.25],
      BATTERY: [-1.05, 0.68, 0.15],
      CHARGING_PORT: [-0.98, 0.56, -0.35],
      HOOD: [0.0, 0.75, 0.40],
      ROOF: [0.0, 0.70, -0.20],
      TAILLIGHTS: [-0.82, 0.58, -0.55],
      BODY: [1.05, 0.52, 0.0],
      DIFFUSER: [-0.85, 0.50, -0.40],
      SIDE_MIRROR: [-0.95, 0.58, 0.20],
      DOOR_HANDLE: [-1.0, 0.50, -0.15],
      INTERIOR_CABIN: [0.88, 0.62, 0.05],
    },
  },

  // 2. EV02 / Stylized Concept (Inverted X axis in GLTF model hierarchy)
  EV02: {
    anchors: {
      WHEEL_FL: [0.77, 0.30, 1.37],
      WHEEL_FR: [-0.77, 0.30, 1.37],
      WHEEL_RL: [0.77, 0.30, -1.27],
      WHEEL_RR: [-0.77, 0.30, -1.27],
      DOOR_FL: [0.87, 0.76, 0.21],
      DOOR_FR: [-0.87, 0.76, 0.21],
      DOOR_RL: [0.79, 0.76, -0.69],
      DOOR_RR: [-0.79, 0.76, -0.69],
      HEADLIGHTS: [0.0, 0.68, 2.38],
      WINDSHIELD: [0.0, 1.05, 0.55],
      BATTERY: [0.0, 0.18, 0.0],
      CHARGING_PORT: [0.86, 0.80, -1.65],
      HOOD: [0.0, 0.82, 1.25],
      ROOF: [0.0, 1.36, -0.50],
      TAILLIGHTS: [0.0, 0.78, -2.42],
      BODY: [0.0, 0.65, 0.0],
      DIFFUSER: [0.0, 0.32, -1.80],
      SIDE_MIRROR: [-0.90, 0.96, 0.62],
      DOOR_HANDLE: [-0.88, 0.78, 0.08],
      INTERIOR_CABIN: [-0.22, 1.15, -0.12],
    },
    calloutOffsets: {
      DOOR_FR: [-0.95, 0.55, 0.20],
      DOOR_FL: [0.95, 0.55, 0.20],
      DOOR_RR: [-0.95, 0.55, -0.20],
      DOOR_RL: [0.95, 0.55, -0.20],
      WHEEL_FL: [0.95, 0.56, 0.30],
      WHEEL_FR: [-0.95, 0.58, 0.35],
      WHEEL_RL: [0.95, 0.58, -0.35],
      WHEEL_RR: [-0.95, 0.58, -0.35],
      HEADLIGHTS: [0.75, 0.58, 0.45],
      WINDSHIELD: [0.85, 0.58, 0.20],
      BATTERY: [-1.02, 0.65, 0.15],
      CHARGING_PORT: [-0.96, 0.55, -0.35],
      HOOD: [0.0, 0.75, 0.40],
      ROOF: [0.0, 0.70, -0.20],
      TAILLIGHTS: [0.82, 0.55, -0.45],
      BODY: [1.02, 0.52, 0.0],
      DIFFUSER: [-0.85, 0.50, -0.40],
      SIDE_MIRROR: [-0.95, 0.55, 0.20],
      DOOR_HANDLE: [-0.98, 0.48, -0.15],
      INTERIOR_CABIN: [-0.88, 0.58, 0.05],
    },
  },

  // 3. Tesla Model Y Long Range
  TESLA_MODEL_Y: {
    anchors: {
      WHEEL_FL: [-0.86, 0.35, 1.32],
      WHEEL_FR: [0.86, 0.35, 1.32],
      WHEEL_RL: [-0.86, 0.35, -1.34],
      WHEEL_RR: [0.86, 0.35, -1.34],
      DOOR_FL: [-0.92, 0.82, 0.48],
      DOOR_FR: [0.92, 0.82, 0.48],
      DOOR_RL: [-0.92, 0.82, -0.45],
      DOOR_RR: [0.92, 0.82, -0.45],
      HEADLIGHTS: [0.65, 0.72, 1.86],
      WINDSHIELD: [0.0, 1.20, 0.60],
      BATTERY: [-0.85, 0.20, -0.25],
      CHARGING_PORT: [-0.88, 0.85, -1.45],
      HOOD: [0.0, 0.80, 1.25],
      ROOF: [0.0, 1.42, -0.30],
      TAILLIGHTS: [0.50, 0.90, -1.90],
      BODY: [0.88, 0.75, -0.50],
      DIFFUSER: [0.0, 0.30, -1.78],
      SIDE_MIRROR: [-0.95, 1.00, 0.65],
      DOOR_HANDLE: [-0.90, 0.82, 0.05],
      INTERIOR_CABIN: [-0.25, 1.25, -0.15],
    },
  },

  // 4. Hyundai Mistra EV 2021
  HYUNDAI_MISTRA: {
    anchors: {
      WHEEL_FL: [-0.82, 0.35, 1.34],
      WHEEL_FR: [0.82, 0.35, 1.34],
      WHEEL_RL: [-0.82, 0.35, -1.34],
      WHEEL_RR: [0.82, 0.35, -1.34],
      DOOR_FL: [-0.90, 0.82, 0.50],
      DOOR_FR: [0.90, 0.82, 0.50],
      DOOR_RL: [-0.90, 0.82, -0.45],
      DOOR_RR: [0.90, 0.82, -0.45],
      HEADLIGHTS: [0.64, 0.70, 1.92],
      WINDSHIELD: [0.0, 1.18, 0.58],
      BATTERY: [-0.84, 0.20, -0.26],
      CHARGING_PORT: [-0.86, 0.84, -1.40],
      HOOD: [0.0, 0.80, 1.20],
      ROOF: [0.0, 1.40, -0.30],
      TAILLIGHTS: [0.50, 0.88, -1.88],
      BODY: [0.88, 0.74, -0.50],
      DIFFUSER: [0.0, 0.30, -1.76],
      SIDE_MIRROR: [-0.94, 0.98, 0.64],
      DOOR_HANDLE: [-0.89, 0.82, 0.04],
      INTERIOR_CABIN: [-0.24, 1.24, -0.16],
    },
  },

  // 5. Hyundai Kona Electric 2024
  HYUNDAI_KONA: {
    anchors: {
      WHEEL_FL: [-0.84, 0.37, 1.28],
      WHEEL_FR: [0.84, 0.37, 1.28],
      WHEEL_RL: [-0.84, 0.37, -1.30],
      WHEEL_RR: [0.84, 0.37, -1.30],
      DOOR_FL: [-0.90, 0.84, 0.48],
      DOOR_FR: [0.90, 0.84, 0.48],
      DOOR_RL: [-0.90, 0.84, -0.44],
      DOOR_RR: [0.90, 0.84, -0.44],
      HEADLIGHTS: [0.64, 0.76, 1.80],
      WINDSHIELD: [0.0, 1.20, 0.60],
      BATTERY: [-0.85, 0.22, -0.26],
      CHARGING_PORT: [-0.86, 0.86, -1.38],
      HOOD: [0.0, 0.82, 1.22],
      ROOF: [0.0, 1.44, -0.28],
      TAILLIGHTS: [0.54, 0.92, -1.78],
      BODY: [0.88, 0.76, -0.48],
      DIFFUSER: [0.0, 0.32, -1.76],
      SIDE_MIRROR: [-0.94, 1.00, 0.66],
      DOOR_HANDLE: [-0.90, 0.84, 0.04],
      INTERIOR_CABIN: [-0.26, 1.30, -0.16],
    },
  },

  // 6. Tesla Cybertruck (Angular Stainless Steel Geometry)
  TESLA_CYBERTRUCK: {
    anchors: {
      WHEEL_FL: [-1.02, 0.45, 1.70],
      WHEEL_FR: [1.02, 0.45, 1.70],
      WHEEL_RL: [-1.02, 0.45, -1.70],
      WHEEL_RR: [1.02, 0.45, -1.70],
      DOOR_FL: [-1.05, 0.95, 0.65],
      DOOR_FR: [1.05, 0.95, 0.65],
      DOOR_RL: [-1.05, 0.95, -0.45],
      DOOR_RR: [1.05, 0.95, -0.45],
      HEADLIGHTS: [0.0, 0.90, 2.35],
      WINDSHIELD: [0.0, 1.35, 0.75],
      BATTERY: [0.0, 0.28, 0.0],
      CHARGING_PORT: [-1.05, 0.95, -1.80],
      HOOD: [0.0, 1.05, 1.55],
      ROOF: [0.0, 1.78, 0.10],
      TAILLIGHTS: [0.0, 1.05, -2.40],
      BODY: [1.05, 0.85, 0.0],
      DIFFUSER: [0.0, 0.45, -2.35],
      SIDE_MIRROR: [-1.12, 1.15, 0.85],
      DOOR_HANDLE: [-1.05, 0.95, 0.10],
      INTERIOR_CABIN: [-0.25, 1.35, 0.10],
    },
    calloutOffsets: {
      DOOR_FR: [1.05, 0.60, 0.25],
      DOOR_FL: [-1.05, 0.60, 0.25],
      DOOR_RR: [1.05, 0.60, -0.25],
      DOOR_RL: [-1.05, 0.60, -0.25],
      WHEEL_FL: [-1.08, 0.55, 0.35],
      WHEEL_FR: [1.08, 0.55, 0.35],
      WHEEL_RL: [-1.08, 0.55, -0.35],
      WHEEL_RR: [1.08, 0.55, -0.35],
      HEADLIGHTS: [0.0, 0.75, 0.55],
      WINDSHIELD: [0.0, 0.70, 0.25],
      BATTERY: [-1.10, 0.65, 0.15],
      CHARGING_PORT: [-1.05, 0.60, -0.35],
      HOOD: [0.0, 0.80, 0.40],
      ROOF: [0.0, 0.75, -0.20],
      TAILLIGHTS: [0.0, 0.70, -0.55],
      BODY: [1.10, 0.55, 0.0],
      DIFFUSER: [0.0, 0.50, -0.40],
      SIDE_MIRROR: [-1.05, 0.60, 0.20],
      DOOR_HANDLE: [-1.05, 0.55, -0.15],
      INTERIOR_CABIN: [0.90, 0.65, 0.05],
    },
  },
};

/**
 * Resolves the vehicle model key from a vehicle response, object, or code string.
 */
export function resolveModelKey(vehicleOrCode?: any): string {
  if (!vehicleOrCode) return 'EV01';
  if (typeof vehicleOrCode === 'string') {
    const s = vehicleOrCode.toUpperCase().trim();
    if (s === 'EV02' || s.includes('STYLIZED') || s.includes('0002')) return 'EV02';
    if (s.includes('CYBERTRUCK')) return 'TESLA_CYBERTRUCK';
    if (s.includes('TESLA') || s.includes('MODEL Y')) return 'TESLA_MODEL_Y';
    if (s.includes('MISTRA')) return 'HYUNDAI_MISTRA';
    if (s.includes('KONA')) return 'HYUNDAI_KONA';
    return 'EV01';
  }

  const code = resolveVehicleCode(vehicleOrCode);
  if (code === 'EV02') return 'EV02';

  const modelStr = `${vehicleOrCode.model || ''} ${vehicleOrCode.name || ''}`.toUpperCase();
  if (modelStr.includes('EV02') || modelStr.includes('STYLIZED')) return 'EV02';
  if (modelStr.includes('CYBERTRUCK')) return 'TESLA_CYBERTRUCK';
  if (modelStr.includes('TESLA') || modelStr.includes('MODEL Y')) return 'TESLA_MODEL_Y';
  if (modelStr.includes('MISTRA')) return 'HYUNDAI_MISTRA';
  if (modelStr.includes('KONA')) return 'HYUNDAI_KONA';

  return 'EV01';
}

/**
 * Resolves the 3D local position [x, y, z] for a component on a specific vehicle model.
 * Returns null if the component is genuinely unsupported on the model.
 */
export function resolveVehicleComponentAnchor(
  vehicleOrModel: any,
  componentId: string | null | undefined
): AnchorCoordinates | null {
  const canonicalId = normalizeComponentId(componentId);
  if (!canonicalId) return null;

  const modelKey = resolveModelKey(vehicleOrModel);
  const modelConfig = MODEL_ANCHOR_REGISTRY[modelKey] || MODEL_ANCHOR_REGISTRY.EV01;

  if (modelConfig.anchors[canonicalId]) {
    return modelConfig.anchors[canonicalId]!;
  }

  // Fallback to EV01 default anchors if model definition is partial
  if (MODEL_ANCHOR_REGISTRY.EV01.anchors[canonicalId]) {
    return MODEL_ANCHOR_REGISTRY.EV01.anchors[canonicalId]!;
  }

  return null;
}

/**
 * Resolves the callout offset [dx, dy, dz] for a component on a specific vehicle model.
 */
export function resolveVehicleCalloutOffset(
  vehicleOrModel: any,
  componentId: string | null | undefined
): AnchorCoordinates {
  const canonicalId = normalizeComponentId(componentId);
  if (!canonicalId) return [0.85, 0.55, 0.20];

  const modelKey = resolveModelKey(vehicleOrModel);
  const modelConfig = MODEL_ANCHOR_REGISTRY[modelKey] || MODEL_ANCHOR_REGISTRY.EV01;

  if (modelConfig.calloutOffsets?.[canonicalId]) {
    return modelConfig.calloutOffsets[canonicalId]!;
  }

  if (MODEL_ANCHOR_REGISTRY.EV01.calloutOffsets?.[canonicalId]) {
    return MODEL_ANCHOR_REGISTRY.EV01.calloutOffsets[canonicalId]!;
  }

  return [0.85, 0.55, 0.20];
}

// ============================================================================
// 4. SEVERITY RANKING & VISUAL RESOLUTION
// ============================================================================

export function getSeverityRank(severity?: string | null): number {
  const s = String(severity || '').trim().toUpperCase();
  if (s === 'CRITICAL' || s === 'SEVERE') return 3;
  if (s === 'MODERATE') return 2;
  if (s === 'MINOR') return 1;
  return 1; // default to MINOR if unspecified
}

export function resolveSeverityColor(highestRank: number): string {
  if (highestRank >= 3) return '#ef4444'; // Red
  if (highestRank === 2) return '#f97316'; // Orange
  if (highestRank === 1) return '#facc15'; // Yellow
  return '#00f2fe'; // Cyan (Normal)
}

/**
 * Authoritative semantic color by damage type across all roles:
 * - SCRATCH: Yellow (#facc15)
 * - DENT: Orange (#f97316)
 * - CRACK / BROKEN: Red (#ef4444)
 * - GOOD: Cyan (#00f2fe)
 * - UNINSPECTED: Gray (#94a3b8)
 */
export function resolveDamageTypeSemanticColor(damageTypeOrCondition?: string | null): string {
  if (!damageTypeOrCondition) return '#94a3b8';
  const upper = String(damageTypeOrCondition).trim().toUpperCase();
  if (upper === 'GOOD') return '#00f2fe';
  if (upper === 'SCRATCH' || upper === 'SCRATCHED' || upper.includes('TRAY')) return '#facc15';
  if (upper === 'DENT' || upper === 'DENTED' || upper.includes('MOP')) return '#f97316';
  if (
    upper === 'CRACK' ||
    upper === 'CRACKED' ||
    upper === 'BROKEN' ||
    upper === 'SEVERE' ||
    upper === 'CRITICAL' ||
    upper.includes('NUT') ||
    upper.includes('VO')
  ) {
    return '#ef4444';
  }
  if (upper.includes('PAINT') || upper.includes('GLASS') || upper.includes('TIRE')) return '#f97316';
  return '#ef4444';
}

export function resolveSeverityLabelVi(highestRank: number): string {
  if (highestRank >= 3) return 'NGHIÊM TRỌNG';
  if (highestRank === 2) return 'TRUNG BÌNH';
  if (highestRank === 1) return 'NHẸ';
  return 'BÌNH THƯỜNG';
}

// ============================================================================
// 5. AGGREGATED DAMAGE HOTSPOT RESOLVER (MULTIPLE DAMAGE RECORDS)
// ============================================================================

export interface AggregatedDamageHotspot {
  componentId: VehiclePartId;
  componentNameVi: string;
  categoryVi: string;
  position: AnchorCoordinates;
  calloutOffset: AnchorCoordinates;
  anchorSide: 'left' | 'right' | 'top';
  records: DamageRecordData[];
  recordCount: number;
  highestSeverityRank: number;
  highestSeverity: DamageSeverity;
  color: string;
  statusColor: string;
  primaryConditionVi: string;
  isUnderMaintenance: boolean;
  isRepaired: boolean;
}

/**
 * Aggregates all active, unresolved damage records for a vehicle into clean,
 * non-overlapping hotspots attached to verified 3D anchors.
 */
export function aggregateDamageHotspots(
  vehicle: VehicleResponse | any,
  damages: DamageRecordData[]
): AggregatedDamageHotspot[] {
  if (!damages || damages.length === 0) return [];

  // Filter unresolved damages (respect repair state)
  const unresolved = damages.filter(
    (d) => d.status !== 'RESOLVED' && (d.status as string) !== 'REPAIRED'
  );

  const grouped = new Map<VehiclePartId, DamageRecordData[]>();

  for (const record of unresolved) {
    const canonical = normalizeComponentId(record.vehiclePartCode);
    if (!canonical) continue;

    if (!grouped.has(canonical)) {
      grouped.set(canonical, []);
    }
    grouped.get(canonical)!.push(record);
  }

  const result: AggregatedDamageHotspot[] = [];

  for (const [componentId, records] of grouped.entries()) {
    // Resolve anchor for this specific vehicle model
    const anchor = resolveVehicleComponentAnchor(vehicle, componentId);
    if (!anchor) {
      // Genuinely unsupported component on this model -> excluded here, surfaces in unmappedDamages
      continue;
    }

    const meta = CANONICAL_VEHICLE_COMPONENTS[componentId];
    const calloutOffset = resolveVehicleCalloutOffset(vehicle, componentId);

    // Compute highest severity rank across all records on this component
    let maxRank = 0;
    let maxSeverity: DamageSeverity = 'MINOR';
    for (const r of records) {
      const rank = getSeverityRank(r.severity);
      if (rank > maxRank) {
        maxRank = rank;
        maxSeverity = (r.severity as any) || (rank >= 3 ? 'CRITICAL' : rank === 2 ? 'MODERATE' : 'MINOR');
      }
    }

    // Semantic color from the primary damage type (SCRATCH -> Yellow, DENT -> Orange, CRACK -> Red)
    const primaryRecord = records.find((r) => getSeverityRank(r.severity) === maxRank) || records[0];
    const color = resolveDamageTypeSemanticColor(primaryRecord.damageType);
    const isUnderMaintenance = records.some((r) => r.status === 'UNDER_MAINTENANCE');

    // Primary condition label from top-ranked defect
    const primaryConditionVi =
      DAMAGE_TYPE_LABELS[primaryRecord.damageType] || String(primaryRecord.damageType || 'HƯ HỎNG');

    result.push({
      componentId,
      componentNameVi: meta?.nameVi || componentId,
      categoryVi: meta?.categoryVi || 'Linh kiện phương tiện',
      position: anchor,
      calloutOffset,
      anchorSide: meta?.defaultAnchorSide || 'left',
      records,
      recordCount: records.length,
      highestSeverityRank: maxRank,
      highestSeverity: maxSeverity,
      color,
      statusColor: color,
      primaryConditionVi,
      isUnderMaintenance,
      isRepaired: false,
    });
  }

  return result;
}

/**
 * Filters and returns damage records that CANNOT be mapped to a valid 3D anchor
 * for this specific vehicle model, preventing fake coordinate fabrication.
 */
export function resolveUnmappedDamages(
  vehicle: VehicleResponse | any,
  damages: DamageRecordData[]
): DamageRecordData[] {
  if (!damages || damages.length === 0) return [];

  const unresolved = damages.filter(
    (d) => d.status !== 'RESOLVED' && (d.status as string) !== 'REPAIRED'
  );

  return unresolved.filter((d) => {
    const canonical = normalizeComponentId(d.vehiclePartCode);
    if (!canonical) return true;
    const anchor = resolveVehicleComponentAnchor(vehicle, canonical);
    return anchor === null;
  });
}
