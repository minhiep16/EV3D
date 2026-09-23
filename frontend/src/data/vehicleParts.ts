import * as THREE from 'three';
import { VehiclePartConfig, VehiclePartId, PartStatus } from '../types/vehiclePart';

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

// Node names from ev-car.glb mapped to logical VehiclePartId
export const MESH_TO_PART_MAP: Record<string, VehiclePartId> = {
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

// All 13 interactive vehicle parts with specifications, camera presets, and spatial panel positions
export const VEHICLE_PARTS: Record<VehiclePartId, VehiclePartConfig> = {
  WHEEL_FL: {
    id: 'WHEEL_FL',
    nodeNames: ['Wheel_Front_Left'],
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
    localCenter: [-0.92, 0.36, 1.35],
    cameraPreset: {
      target: [-8.4, 0.5, 5.2],
      position: [-11.2, 1.8, 8.2],
    },
    panelPosition: [1.0, 1.15, 3.0],
  },

  WHEEL_FR: {
    id: 'WHEEL_FR',
    nodeNames: ['Wheel_Front_Right'],
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
    localCenter: [0.92, 0.36, 1.35],
    cameraPreset: {
      target: [-6.8, 0.5, 5.2],
      position: [-4.8, 1.8, 8.2],
    },
    panelPosition: [2.5, 1.15, 0.8],
  },

  WHEEL_RL: {
    id: 'WHEEL_RL',
    nodeNames: ['Wheel_Rear_Left'],
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
    localCenter: [-0.92, 0.36, -1.35],
    cameraPreset: {
      target: [-8.4, 0.5, 2.8],
      position: [-11.2, 1.8, 0.0],
    },
    panelPosition: [1.0, 1.15, -0.6],
  },

  WHEEL_RR: {
    id: 'WHEEL_RR',
    nodeNames: ['Wheel_Rear_Right'],
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
    localCenter: [0.92, 0.36, -1.35],
    cameraPreset: {
      target: [-6.8, 0.5, 2.8],
      position: [-4.8, 1.8, 0.0],
    },
    panelPosition: [2.5, 1.15, -2.4],
  },

  HOOD: {
    id: 'HOOD',
    nodeNames: ['Chassis_Nose'],
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
    localCenter: [0, 0.55, 2.05],
    cameraPreset: {
      target: [-7.2, 0.7, 5.8],
      position: [-7.2, 2.6, 9.6],
    },
    panelPosition: [2.5, 1.25, 2.0],
  },

  HEADLIGHTS: {
    id: 'HEADLIGHTS',
    nodeNames: ['Headlight_Bar'],
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
    localCenter: [0, 0.55, 2.12],
    cameraPreset: {
      target: [-7.2, 0.7, 6.0],
      position: [-7.2, 1.8, 9.6],
    },
    panelPosition: [2.5, 1.2, 2.1],
  },

  WINDSHIELD: {
    id: 'WINDSHIELD',
    nodeNames: ['Cabin_Glass'],
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
    localCenter: [0, 0.9, -0.2],
    cameraPreset: {
      target: [-7.0, 1.1, 4.0],
      position: [-7.0, 2.8, 7.8],
    },
    panelPosition: [2.5, 1.35, 0.0],
  },

  ROOF: {
    id: 'ROOF',
    nodeNames: ['Roof_Panel'],
    nameVi: 'Nóc xe panorama',
    categoryVi: 'Khung vỏ & Mui xe',
    status: 'NORMAL',
    descriptionVi: 'Mui kính toàn cảnh panorama cường lực nguyên khối, tạo không gian thoáng đãng cho khoang lái.',
    specs: [
      { label: 'Cấu trúc', value: 'Kính cách nhiệt Low-E' },
      { label: 'Chịu lực ép', value: 'Đạt chuẩn 5 sao rollover' },
      { label: 'Lớp mạ', value: 'Bạc phản xạ nhiệt' },
    ],
    localCenter: [0, 1.15, -0.2],
    cameraPreset: {
      target: [-7.0, 1.2, 3.8],
      position: [-7.0, 3.8, 7.2],
    },
    panelPosition: [2.5, 1.45, -0.2],
  },

  TAILLIGHTS: {
    id: 'TAILLIGHTS',
    nodeNames: ['Taillight_Bar'],
    nameVi: 'Dải đèn hậu LED sau',
    categoryVi: 'Hệ thống chiếu sáng',
    status: 'NORMAL',
    descriptionVi: 'Dải đèn hậu xuyên suốt ngang đuôi xe, phát tín hiệu phanh khẩn cấp thích ứng nhấp nháy nhanh.',
    specs: [
      { label: 'Công nghệ', value: '3D Full-Width LED' },
      { label: 'Tín hiệu rẽ', value: 'Đèn chạy tia Sequential' },
      { label: 'Phanh khẩn cấp', value: 'Tự động nhấp nháy ESS' },
    ],
    localCenter: [0, 0.62, -2.12],
    cameraPreset: {
      target: [-8.8, 0.76, 1.9],
      position: [-8.8, 2.0, -1.8],
    },
    panelPosition: [1.2, 1.2, -2.0],
  },

  DIFFUSER: {
    id: 'DIFFUSER',
    nodeNames: ['Aerodynamic_Diffuser'],
    nameVi: 'Cản sau & Khuếch tán gió',
    categoryVi: 'Ngoại thất khí động học',
    status: 'NORMAL',
    descriptionVi: 'Khuếch tán gầm sau điều hướng luồng khí thoát đáy xe, giảm nhiễu động khí động học ở tốc độ cao.',
    specs: [
      { label: 'Hệ số cản', value: 'Cd 0.23' },
      { label: 'Cảm biến lùi', value: '4 Cảm biến siêu âm' },
      { label: 'Radar sau', value: 'Radar cảnh báo cắt ngang' },
    ],
    localCenter: [0, 0.25, -2.05],
    cameraPreset: {
      target: [-8.8, 0.45, 2.0],
      position: [-8.8, 1.6, -1.8],
    },
    panelPosition: [1.2, 1.1, -2.0],
  },

  BATTERY: {
    id: 'BATTERY',
    nodeNames: ['Battery_Pack'],
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
    localCenter: [0, 0.22, 0],
    cameraPreset: {
      target: [-8.5, 0.32, 4.0],
      position: [-11.5, 1.4, 5.8],
    },
    panelPosition: [1.0, 1.15, 1.0],
  },

  CHARGING_PORT: {
    id: 'CHARGING_PORT',
    nodeNames: ['Charging_Port'],
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
    localCenter: [-0.93, 0.65, -1.6],
    cameraPreset: {
      target: [-9.2, 0.8, 2.5],
      position: [-11.8, 1.8, 3.4],
    },
    panelPosition: [0.2, 1.25, -1.2],
  },

  BODY: {
    id: 'BODY',
    nodeNames: ['Chassis_Body'],
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
    localCenter: [0, 0.6, 0],
    cameraPreset: {
      target: [-7.1, 0.8, 4.0],
      position: [-7.1, 2.8, 9.2],
    },
    panelPosition: [2.5, 1.25, 0.0],
  },
};

/**
 * Traverses upwards from an intersected Three.js Object3D to find
 * the corresponding VehiclePartId if it belongs to any registered node.
 */
export function getPartIdFromMesh(obj: THREE.Object3D): VehiclePartId | null {
  let curr: THREE.Object3D | null = obj;
  while (curr && curr.name !== 'EV01_DigitalTwin') {
    if (curr.name && MESH_TO_PART_MAP[curr.name]) {
      return MESH_TO_PART_MAP[curr.name];
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
