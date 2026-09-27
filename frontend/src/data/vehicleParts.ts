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
  // Phase 09 Critical Checkpoints (Must strictly match physical coordinates)
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
  {
    id: 'WINDSHIELD',
    nameVi: 'Kính chắn gió & Cabin',
    shape: 'box',
    position: [0, 1.15, 0.45],
    args: [1.35, 0.45, 0.85],
    rotation: [-0.45, 0, 0],
    isCriticalPhase09: true,
  },
  {
    id: 'BATTERY',
    nameVi: 'Khối pin điện cao áp',
    shape: 'box',
    position: [0, 0.20, 0],
    args: [1.40, 0.20, 2.30],
    isCriticalPhase09: true,
  },
  {
    id: 'CHARGING_PORT',
    nameVi: 'Cổng sạc điện thông minh',
    shape: 'box',
    position: [-0.92, 0.82, -1.40],
    args: [0.25, 0.25, 0.25],
    isCriticalPhase09: true,
  },
  {
    id: 'BODY',
    nameVi: 'Thân xe & Khung gầm',
    shape: 'box',
    position: [0, 0.72, 0],
    args: [1.75, 0.75, 3.80],
    isCriticalPhase09: true,
  },

  // Phase 06 Auxiliary Parts (Non-critical inspection parts)
  {
    id: 'HOOD',
    nameVi: 'Nắp capo trước',
    shape: 'box',
    position: [0, 0.82, 1.25],
    args: [1.40, 0.28, 0.95],
    isCriticalPhase09: false,
  },
  {
    id: 'ROOF',
    nameVi: 'Nóc xe panorama',
    shape: 'box',
    position: [0, 1.45, -0.30],
    args: [1.25, 0.12, 1.40],
    isCriticalPhase09: false,
  },
  {
    id: 'HEADLIGHTS',
    nameVi: 'Dải đèn pha LED trước',
    shape: 'box',
    position: [0, 0.75, 1.78],
    args: [1.65, 0.20, 0.30],
    isCriticalPhase09: false,
  },
  {
    id: 'TAILLIGHTS',
    nameVi: 'Dải đèn hậu LED sau',
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
];

/**
 * Resolves the nearest semantic part from a 3D local coordinate on EV01.
 * Ensures domain data is bound to semantic vehicle parts rather than GLB node names.
 */
export function resolveSemanticPartFromLocalPoint(localPoint: [number, number, number]): VehiclePartId {
  const [x, y, z] = localPoint;
  let closestPart: VehiclePartId = 'BODY';
  let minDistance = Infinity;

  // Check specific parts first
  for (const def of SEMANTIC_HITBOX_DEFINITIONS) {
    if (def.id === 'BODY') continue;
    const [dx, dy, dz] = [x - def.position[0], y - def.position[1], z - def.position[2]];
    const distSq = dx * dx + dy * dy + dz * dz;
    if (distSq < minDistance) {
      minDistance = distSq;
      closestPart = def.id;
    }
  }

  // If distance to nearest specific part is greater than ~0.8m (distSq > 0.64), default to BODY
  if (minDistance > 0.64) {
    return 'BODY';
  }

  return closestPart;
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
  HOOD: {
    id: 'HOOD',
    nameVi: 'Nắp capo trước',
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
    nameVi: 'Dải đèn pha LED trước',
    categoryVi: 'Hệ thống chiếu sáng',
    status: 'NORMAL',
    descriptionVi: 'Dải LED ma trận ma trận trải dài toàn chiều rộng, tích hợp tính năng thích ứng chống lóa.',
    specs: [
      { label: 'Công nghệ', value: 'Matrix Cyber LED' },
      { label: 'Tầm chiếu xa', value: '450m' },
      { label: 'Chức năng', value: 'Tự động thích ứng (AHS)' },
      { label: 'Hiệu ứng', value: 'Chào mừng Dynamic Welcome' },
    ],
  },
  WINDSHIELD: {
    id: 'WINDSHIELD',
    nameVi: 'Kính chắn gió & Cabin',
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
    nameVi: 'Nóc xe panorama',
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
    nameVi: 'Dải đèn hậu LED sau',
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
    nameVi: 'Khối pin điện cao áp',
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
    nameVi: 'Cổng sạc điện thông minh',
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
    nameVi: 'Thân xe & Khung gầm',
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
