export type InspectionType = 'PRE_HANDOVER' | 'GENERAL' | 'POST_TRIP' | 'OTHER';

export type InspectionStatus = 'IN_PROGRESS' | 'COMPLETED';

export type InspectionOverallResult = 'PASS' | 'PASS_WITH_NOTES' | 'FAIL';

export type InspectionItemCondition = 'GOOD' | 'SCRATCH' | 'DENT' | 'CRACK' | 'OTHER_DAMAGE';

export interface VehicleInspectionItemResponse {
  id: string;
  inspectionId: string;
  vehiclePartCode: string;
  conditionStatus: InspectionItemCondition;
  note?: string;
  createdAt: string;
}

export interface VehicleInspectionResponse {
  id: string;
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  inspectedById?: string;
  inspectedByName?: string;
  inspectionType: InspectionType;
  status: InspectionStatus;
  overallResult?: InspectionOverallResult;
  summaryNote?: string;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
  totalInspectedCount: number;
  abnormalCount: number;
  items: VehicleInspectionItemResponse[];
}

export interface VehicleInspectionItemRequest {
  vehiclePartCode: string;
  conditionStatus: InspectionItemCondition;
  note?: string;
}

export interface CompleteInspectionRequest {
  overallResult?: InspectionOverallResult;
  summaryNote?: string;
}

export const INSPECTION_RESULT_CONFIG: Record<
  InspectionOverallResult,
  { labelVi: string; color: string; bg: string; border: string }
> = {
  PASS: {
    labelVi: 'ĐẠT TIÊU CHUẨN',
    color: '#34d399',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.45)',
  },
  PASS_WITH_NOTES: {
    labelVi: 'ĐẠT (CÓ LƯU Ý)',
    color: '#fbbf24',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.45)',
  },
  FAIL: {
    labelVi: 'KHÔNG ĐẠT',
    color: '#f87171',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.45)',
  },
};

export const INSPECTION_ITEM_CONDITION_CONFIG: Record<
  InspectionItemCondition,
  { labelVi: string; color: string; bg: string; border: string }
> = {
  GOOD: {
    labelVi: 'Tốt',
    color: '#34d399',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.4)',
  },
  SCRATCH: {
    labelVi: 'Trầy xước',
    color: '#fbbf24',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.4)',
  },
  DENT: {
    labelVi: 'Móp méo',
    color: '#fb923c',
    bg: 'rgba(249, 115, 22, 0.12)',
    border: 'rgba(249, 115, 22, 0.4)',
  },
  CRACK: {
    labelVi: 'Nứt vỡ',
    color: '#f87171',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.45)',
  },
  OTHER_DAMAGE: {
    labelVi: 'Hư hỏng khác',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.2)',
    border: 'rgba(239, 68, 68, 0.5)',
  },
};
