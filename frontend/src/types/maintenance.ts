export type MaintenanceStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PENDING'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type MaintenanceType =
  | 'PREVENTIVE'
  | 'REPAIR'
  | 'INSPECTION'
  | 'BATTERY'
  | 'TIRE'
  | 'BRAKE'
  | 'ELECTRICAL'
  | 'BODY'
  | 'OTHER';

export type VoteDecision = 'APPROVE' | 'REJECT';

export interface LinkedDamageDto {
  id: string;
  vehiclePartCode: string;
  damageType: string;
  severity: string;
  status?: string;
  note?: string | null;
  localPositionX: number;
  localPositionY: number;
  localPositionZ: number;
}

export interface MaintenanceResponse {
  id: string;
  vehicleId: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  maintenanceType: MaintenanceType;
  title: string;
  description?: string | null;
  scheduledAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  approvedAt?: string | null;
  approvedWeight?: number | null;
  createdById: string;
  createdByName?: string | null;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  completionNote?: string | null;
  damageRecordIds: string[];
  damageRecords: LinkedDamageDto[];
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceVoteSummaryDto {
  id: string;
  memberId?: string;
  userId?: string;
  userName?: string;
  decision: VoteDecision;
  votingWeight: number;
  comment?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MaintenanceApprovalResponse {
  maintenanceRequestId: string;
  vehicleId?: string;
  status: MaintenanceStatus;
  approveWeight: number;
  rejectWeight: number;
  pendingWeight: number;
  requiredThreshold: number;
  currentUserVote?: VoteDecision | null;
  currentUserWeight?: number | null;
  eligibleToVote: boolean;
  approvedAt?: string | null;
  approvedWeight?: number | null;
  votes: MaintenanceVoteSummaryDto[];
}

export interface CastMaintenanceVotePayload {
  decision: VoteDecision;
  comment?: string;
}

export interface CreateMaintenancePayload {
  title: string;
  maintenanceType: MaintenanceType;
  priority: MaintenancePriority;
  description?: string;
  scheduledAt?: string | null;
  assignedStaffId?: string | null;
  damageRecordIds?: string[];
}

export interface ScheduleMaintenancePayload {
  scheduledAt: string;
  assignedStaffId?: string | null;
}

export interface CompleteMaintenancePayload {
  completionNote?: string;
}

export const MAINTENANCE_APPROVAL_THRESHOLD = 50.0;

export const MAINTENANCE_STATUS_CONFIG: Record<
  MaintenanceStatus,
  { labelVi: string; color: string; bg: string; border: string }
> = {
  PENDING_APPROVAL: {
    labelVi: 'Chờ phê duyệt',
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.15)',
    border: 'rgba(251, 191, 36, 0.45)',
  },
  APPROVED: {
    labelVi: 'Đã phê duyệt',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.45)',
  },
  REJECTED: {
    labelVi: 'Đã từ chối',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.45)',
  },
  PENDING: {
    labelVi: 'Chờ xử lý',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.15)',
    border: 'rgba(148, 163, 184, 0.4)',
  },
  SCHEDULED: {
    labelVi: 'Đã lên lịch',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.4)',
  },
  IN_PROGRESS: {
    labelVi: 'Đang bảo dưỡng',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.18)',
    border: 'rgba(245, 158, 11, 0.5)',
  },
  COMPLETED: {
    labelVi: 'Hoàn tất',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.4)',
  },
  CANCELLED: {
    labelVi: 'Đã hủy',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.4)',
  },
};

export const MAINTENANCE_PRIORITY_CONFIG: Record<
  MaintenancePriority,
  { labelVi: string; color: string; badgeBg: string }
> = {
  LOW: {
    labelVi: 'Thấp',
    color: '#94a3b8',
    badgeBg: 'rgba(148, 163, 184, 0.2)',
  },
  MEDIUM: {
    labelVi: 'Trung bình',
    color: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.2)',
  },
  HIGH: {
    labelVi: 'Cao',
    color: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.2)',
  },
  CRITICAL: {
    labelVi: 'Khẩn cấp',
    color: '#ef4444',
    badgeBg: 'rgba(239, 68, 68, 0.25)',
  },
};

export const MAINTENANCE_TYPE_CONFIG: Record<
  MaintenanceType,
  { labelVi: string; descriptionVi: string; color?: string; bg?: string }
> = {
  PREVENTIVE: {
    labelVi: 'Bảo dưỡng định kỳ',
    descriptionVi: 'Kiểm tra và thay thế phụ tùng theo chu kỳ tiêu chuẩn',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
  },
  REPAIR: {
    labelVi: 'Sửa chữa',
    descriptionVi: 'Khắc phục hư hỏng hoặc lỗi kỹ thuật phát sinh',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
  },
  INSPECTION: {
    labelVi: 'Kiểm tra tổng quát',
    descriptionVi: 'Đánh giá an toàn kỹ thuật và hiệu năng xe',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
  },
  BATTERY: {
    labelVi: 'Hệ thống pin',
    descriptionVi: 'Kiểm tra pin cao áp, BMS và cổng sạc',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.15)',
  },
  TIRE: {
    labelVi: 'Lốp & Bánh xe',
    descriptionVi: 'Cân bằng động, đảo lốp, áp suất và độ mòn',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.15)',
  },
  BRAKE: {
    labelVi: 'Hệ thống phanh',
    descriptionVi: 'Má phanh, đĩa phanh và dầu phanh thủy lực',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
  },
  ELECTRICAL: {
    labelVi: 'Hệ thống điện',
    descriptionVi: 'Mạch điều khiển, cảm biến và hệ thống chiếu sáng',
    color: '#eab308',
    bg: 'rgba(234, 179, 8, 0.15)',
  },
  BODY: {
    labelVi: 'Thân vỏ & Cửa',
    descriptionVi: 'Sơn dặm, nắn vết móp và căn chỉnh cửa xe',
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.15)',
  },
  OTHER: {
    labelVi: 'Bảo dưỡng khác',
    descriptionVi: 'Các hạng mục kỹ thuật chuyên biệt khác',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.15)',
  },
};
