export type ExpenseCategory =
  | 'CHARGING'
  | 'MAINTENANCE'
  | 'CLEANING'
  | 'PARKING'
  | 'TOLL'
  | 'REPAIR'
  | 'INSURANCE'
  | 'OTHER';

export type ExpenseSourceType =
  | 'MANUAL'
  | 'CHARGING_SESSION'
  | 'MAINTENANCE_REQUEST'
  | 'TRIP'
  | 'OTHER';

export type ExpenseStatus =
  | 'PENDING_VERIFICATION'
  | 'PENDING_VOTE'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'DISPUTED';

export type ExpenseAllocationPolicy =
  | 'USER_RESPONSIBILITY'
  | 'USAGE_AND_CAPITAL'
  | 'OWNERSHIP_RATIO'
  | 'CUSTOM_AGREEMENT';

export const EXPENSE_ALLOCATION_POLICY_LABELS: Record<ExpenseAllocationPolicy, string> = {
  USER_RESPONSIBILITY: 'Theo người sử dụng',
  USAGE_AND_CAPITAL: 'Theo km sử dụng và tỷ lệ vốn',
  OWNERSHIP_RATIO: 'Theo tỷ lệ sở hữu',
  CUSTOM_AGREEMENT: 'Theo thỏa thuận riêng',
};

export type ExpenseApprovalDecision = 'APPROVE' | 'REJECT';

export interface ExpenseApprovalRequest {
  decision: ExpenseApprovalDecision;
  comment?: string;
}

export interface MemberApprovalDecisionResponse {
  userId: string;
  fullName: string;
  ownershipPercentage: number;
  isCreator: boolean;
  decision: ExpenseApprovalDecision | null;
  comment: string | null;
  decidedAt: string | null;
}

export interface ExpenseApprovalStatusResponse {
  expenseId: string;
  status: ExpenseStatus;
  statusLabel: string;
  creatorUserId: string | null;
  creatorName: string | null;
  approvalOwnershipPercentage: number;
  rejectionOwnershipPercentage: number;
  requiredThreshold: number;
  isCurrentUserCreator: boolean;
  canCurrentUserApprove: boolean;
  currentUserDecision: ExpenseApprovalDecision | null;
  memberDecisions: MemberApprovalDecisionResponse[];
}

export interface ExpenseResponse {
  id: string;
  vehicleId: string;
  vehicleName?: string;
  coOwnershipGroupId?: string;
  category: ExpenseCategory;
  categoryLabel: string;
  amount: number;
  description: string;
  occurredAt: string;
  paidByUserId: string;
  paidByUserName: string;
  createdByUserId: string;
  createdByUserName: string;
  sourceType: ExpenseSourceType;
  sourceReferenceId?: string | null;
  status: ExpenseStatus;
  statusLabel: string;
  evidenceUrl?: string | null;
  evidenceNote?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  createdAt: string;
  allocationPolicy?: ExpenseAllocationPolicy;
  allocationPolicyLabel?: string;
  responsibleUserId?: string | null;
  responsibleUserName?: string | null;
  relatedTripId?: string | null;
  relatedBookingId?: string | null;
  startBatteryLevel?: number | null;
  endBatteryLevel?: number | null;
  energyConsumedKwh?: number | null;
  isEstimatedEnergy?: boolean | null;
  verifiedByStaffName?: string | null;
}

export interface ExpenseSummaryResponse {
  month: string;
  totalExpense: number;
  transactionCount: number;
  categoryBreakdown: Record<string, number>;
  pendingCount: number;
  pendingAmount: number;
}

export interface CreateExpensePayload {
  vehicleId: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  occurredAt: string;
  paidByUserId?: string;
  sourceType?: ExpenseSourceType;
  sourceReferenceId?: string;
  evidenceUrl?: string;
  evidenceNote?: string;
  allocationPolicy?: ExpenseAllocationPolicy;
  responsibleUserId?: string;
  relatedTripId?: string;
  relatedBookingId?: string;
}

export interface ExpenseFilterParams {
  vehicleId: string;
  from?: string;
  to?: string;
  category?: ExpenseCategory;
}

export const EXPENSE_CATEGORY_METADATA: Record<
  ExpenseCategory,
  {
    label: string;
    iconName: string;
    accentColor: string;
    chipBg: string;
    chipBorder: string;
  }
> = {
  CHARGING: {
    label: 'Sạc xe',
    iconName: 'Zap',
    accentColor: '#00f2fe',
    chipBg: 'rgba(0, 242, 254, 0.12)',
    chipBorder: 'rgba(0, 242, 254, 0.30)',
  },
  MAINTENANCE: {
    label: 'Bảo dưỡng',
    iconName: 'Wrench',
    accentColor: '#fb923c',
    chipBg: 'rgba(249, 115, 22, 0.12)',
    chipBorder: 'rgba(249, 115, 22, 0.30)',
  },
  CLEANING: {
    label: 'Vệ sinh xe',
    iconName: 'Sparkles',
    accentColor: '#c084fc',
    chipBg: 'rgba(168, 85, 247, 0.12)',
    chipBorder: 'rgba(168, 85, 247, 0.30)',
  },
  PARKING: {
    label: 'Đỗ xe',
    iconName: 'Car',
    accentColor: '#38bdf8',
    chipBg: 'rgba(56, 189, 248, 0.12)',
    chipBorder: 'rgba(56, 189, 248, 0.30)',
  },
  TOLL: {
    label: 'Phí đường bộ',
    iconName: 'Receipt',
    accentColor: '#f59e0b',
    chipBg: 'rgba(245, 158, 11, 0.12)',
    chipBorder: 'rgba(245, 158, 11, 0.30)',
  },
  REPAIR: {
    label: 'Sửa chữa',
    iconName: 'AlertTriangle',
    accentColor: '#f87171',
    chipBg: 'rgba(239, 68, 68, 0.12)',
    chipBorder: 'rgba(239, 68, 68, 0.30)',
  },
  INSURANCE: {
    label: 'Bảo hiểm',
    iconName: 'ShieldCheck',
    accentColor: '#34d399',
    chipBg: 'rgba(16, 185, 129, 0.12)',
    chipBorder: 'rgba(16, 185, 129, 0.30)',
  },
  OTHER: {
    label: 'Khác',
    iconName: 'FileText',
    accentColor: '#94a3b8',
    chipBg: 'rgba(148, 163, 184, 0.12)',
    chipBorder: 'rgba(148, 163, 184, 0.30)',
  },
};

export const EXPENSE_STATUS_METADATA: Record<
  ExpenseStatus,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
  }
> = {
  PENDING_VERIFICATION: {
    label: 'CHỜ XÁC MINH',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.35)',
  },
  PENDING_VOTE: {
    label: 'CHỜ BIỂU QUYẾT',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.15)',
    border: 'rgba(139, 92, 246, 0.35)',
  },
  PENDING_APPROVAL: {
    label: 'CHỜ BIỂU QUYẾT',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.15)',
    border: 'rgba(139, 92, 246, 0.35)',
  },
  APPROVED: {
    label: 'ĐÃ DUYỆT',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.35)',
  },
  REJECTED: {
    label: 'ĐÃ TỪ CHỐI',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.35)',
  },
  CANCELLED: {
    label: 'ĐÃ HỦY',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.15)',
    border: 'rgba(148, 163, 184, 0.35)',
  },
  DISPUTED: {
    label: 'TRANH CHẤP',
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.15)',
    border: 'rgba(236, 72, 153, 0.35)',
  },
};

export * from './expenseShare';

