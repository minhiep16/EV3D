export type HandoverStatus =
  | 'PENDING_PREPARATION'
  | 'INSPECTION_IN_PROGRESS'
  | 'READY_FOR_HANDOVER'
  | 'HANDED_OVER'
  | 'OWNER_CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED';

export type InspectionCondition = 'GOOD' | 'WARNING' | 'DAMAGED';

export interface VehicleInspectionItem {
  id: string;
  handoverId: string;
  vehiclePartCode: string;
  conditionStatus: InspectionCondition;
  note?: string;
  inspectedById?: string;
  inspectedByName?: string;
  inspectedAt: string;
}

export interface VehicleHandoverData {
  id: string;
  bookingId: string;
  bookingStartTime: string;
  bookingEndTime: string;
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  staffId?: string;
  staffName?: string;
  coOwnerId: string;
  coOwnerName: string;
  coOwnerEmail?: string;
  bookingPurpose?: string;
  bookingStatus?: string;
  vehicleCode?: string;
  status: HandoverStatus;
  staffPreparedAt?: string;
  staffHandedOverAt?: string;
  ownerReceivedAt?: string;
  ownerConditionAcknowledgedAt?: string;
  conditionAcknowledged?: boolean;
  createdAt: string;
  updatedAt: string;
  totalInspectedCount: number;
  requiredCheckpointsCount: number;
  allCheckpointsInspected: boolean;
  hasWarningsOrDamage: boolean;
  inspections: VehicleInspectionItem[];
}

export interface VehicleInspectionSubmitRequest {
  vehiclePartCode: string;
  conditionStatus: InspectionCondition;
  note?: string;
}

export const HANDOVER_STATUS_CONFIG: Record<
  HandoverStatus,
  { labelVi: string; color: string; badgeBg: string }
> = {
  PENDING_PREPARATION: {
    labelVi: 'CHỜ CHUẨN BỊ',
    color: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
  },
  INSPECTION_IN_PROGRESS: {
    labelVi: 'ĐANG KIỂM TRA',
    color: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
  },
  READY_FOR_HANDOVER: {
    labelVi: 'SẴN SÀNG BÀN GIAO',
    color: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.18)',
  },
  HANDED_OVER: {
    labelVi: 'ĐÃ BÀN GIAO',
    color: '#a855f7',
    badgeBg: 'rgba(168, 85, 247, 0.2)',
  },
  OWNER_CONFIRMED: {
    labelVi: 'ĐÃ XÁC NHẬN NHẬN XE',
    color: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.2)',
  },
  COMPLETED: {
    labelVi: 'HOÀN TẤT',
    color: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.25)',
  },
  CANCELLED: {
    labelVi: 'ĐÃ HỦY',
    color: '#64748b',
    badgeBg: 'rgba(100, 116, 139, 0.2)',
  },
};

export const INSPECTION_CONDITION_CONFIG: Record<
  InspectionCondition,
  { labelVi: string; color: string; bg: string; border: string }
> = {
  GOOD: {
    labelVi: 'Tốt',
    color: '#34d399',
    bg: 'rgba(16, 185, 129, 0.2)',
    border: '#10b981',
  },
  WARNING: {
    labelVi: 'Cảnh báo',
    color: '#fbbf24',
    bg: 'rgba(245, 158, 11, 0.2)',
    border: '#f59e0b',
  },
  DAMAGED: {
    labelVi: 'Hư hỏng',
    color: '#f87171',
    bg: 'rgba(239, 68, 68, 0.2)',
    border: '#ef4444',
  },
};

export interface HandoverCheckpoint {
  code: string;
  nameVi: string;
  categoryVi: string;
  localPosition: [number, number, number];
}

export const HANDOVER_CHECKPOINTS: HandoverCheckpoint[] = [
  { code: 'BODY', nameVi: 'Thân xe', categoryVi: 'Khung vỏ', localPosition: [0, 0.65, 0] },
  { code: 'WHEEL_FL', nameVi: 'Bánh trước trái', categoryVi: 'Bánh xe', localPosition: [-0.95, 0.36, 1.35] },
  { code: 'WHEEL_FR', nameVi: 'Bánh trước phải', categoryVi: 'Bánh xe', localPosition: [0.95, 0.36, 1.35] },
  { code: 'WHEEL_RL', nameVi: 'Bánh sau trái', categoryVi: 'Bánh xe', localPosition: [-0.95, 0.36, -1.35] },
  { code: 'WHEEL_RR', nameVi: 'Bánh sau phải', categoryVi: 'Bánh xe', localPosition: [0.95, 0.36, -1.35] },
  { code: 'WINDSHIELD', nameVi: 'Kính chắn gió', categoryVi: 'Kính & Tầm nhìn', localPosition: [0, 0.95, 0.2] },
  { code: 'BATTERY', nameVi: 'Bộ pin cao áp', categoryVi: 'Năng lượng', localPosition: [0, 0.22, 0] },
  { code: 'CHARGING_PORT', nameVi: 'Cổng sạc', categoryVi: 'Hệ thống sạc', localPosition: [-0.95, 0.65, -1.6] },
];

export function getCheckpointByCode(code: string): HandoverCheckpoint | undefined {
  return HANDOVER_CHECKPOINTS.find((c) => c.code === code);
}

