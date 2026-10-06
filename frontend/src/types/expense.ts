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
  | 'OTHER';

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
  createdAt: string;
}

export interface ExpenseSummaryResponse {
  month: string;
  totalExpense: number;
  transactionCount: number;
  categoryBreakdown: Record<string, number>;
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

export * from './expenseShare';

