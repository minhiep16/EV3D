export type InspectionType = 'PRE_HANDOVER' | 'GENERAL' | 'POST_TRIP' | 'OTHER';

export type InspectionStatus = 'IN_PROGRESS' | 'COMPLETED';

export type InspectionOverallResult = 'PASS' | 'PASS_WITH_NOTES' | 'FAIL';

export type InspectionItemCondition = 'GOOD' | 'SCRATCH' | 'DENT' | 'CRACK' | 'OTHER_DAMAGE';

export interface VehicleInspectionItemResponse {
  id: string;
  inspectionId: string;
  vehicleId?: string;
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
  totalAssessmentRecords?: number;
  uniqueAssessedComponents?: number;
  requiredComponentCount?: number;
  assessedRequiredComponentCount?: number;
  unresolvedCriticalDamageCount?: number;
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
    color: '#00f2fe',
    bg: 'rgba(0, 242, 254, 0.12)',
    border: 'rgba(0, 242, 254, 0.4)',
  },
  SCRATCH: {
    labelVi: 'Trầy xước',
    color: '#facc15',
    bg: 'rgba(250, 204, 21, 0.15)',
    border: 'rgba(250, 204, 21, 0.45)',
  },
  DENT: {
    labelVi: 'Móp méo',
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.15)',
    border: 'rgba(249, 115, 22, 0.45)',
  },
  CRACK: {
    labelVi: 'Nứt vỡ',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.18)',
    border: 'rgba(239, 68, 68, 0.5)',
  },
  OTHER_DAMAGE: {
    labelVi: 'Hư hỏng khác',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.2)',
    border: 'rgba(239, 68, 68, 0.5)',
  },
};

/**
 * Authoritative Centralized Semantic Hotspot Colors across all roles (Staff, Co-Owner, Admin):
 * - UNINSPECTED: Gray (#94a3b8)
 * - GOOD: Cyan (#00f2fe)
 * - SCRATCH: Yellow (#facc15)
 * - DENT: Orange (#f97316)
 * - CRACK: Red (#ef4444)
 */
export function resolveHotspotSemanticColor(
  condition?: string | null,
  isInspected = true
): string {
  if (!isInspected || !condition) return '#94a3b8'; // UNINSPECTED: Gray
  const upper = condition.toUpperCase().trim();
  switch (upper) {
    case 'GOOD':
      return '#00f2fe'; // Cyan
    case 'SCRATCH':
    case 'SCRATCHED':
      return '#facc15'; // Yellow
    case 'DENT':
    case 'DENTED':
      return '#f97316'; // Orange
    case 'CRACK':
    case 'CRACKED':
    case 'BROKEN':
    case 'OTHER_DAMAGE':
    case 'FAIL':
      return '#ef4444'; // Red
    default:
      return '#94a3b8';
  }
}
