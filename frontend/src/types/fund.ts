export type FundContributionStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';

export type FundTransactionType = 'CONTRIBUTION' | 'EXPENSE_DISBURSEMENT' | 'REFUND' | 'ADJUSTMENT';

export type FundTransactionDirection = 'INFLOW' | 'OUTFLOW';

export type FundTransactionStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED';

export type PersonalPaymentStatus = 'PAYMENT_PENDING' | 'PAYMENT_SUBMITTED' | 'PAYMENT_VERIFIED' | 'PAYMENT_REJECTED';

export type FinancialMode = 'DEMO' | 'REAL';

export interface SharedFundSummaryResponse {
  fundId: string;
  id?: string;
  groupId: string;
  vehicleId?: string;
  groupName: string;
  currency: string;
  availableBalance: number;
  pendingContributionTotal: number;
  totalContributionsConfirmed: number;
  totalContributions?: number;
  totalDisbursementsConfirmed: number;
  contributionCount: number;
  transactionCount: number;
  lastUpdated: string;
  financialMode?: FinancialMode;
  financialModeLabel?: string;
}

export interface FundContributionRequest {
  amount: number;
  paymentMethod?: string;
  paymentReference?: string;
  evidenceUrl?: string;
  note?: string;
  overrideFundId?: string;
}

export interface FundContributionVerifyRequest {
  confirmed: boolean;
  note?: string;
}

export interface FundContributionResponse {
  id: string;
  fundId: string;
  contributorUserId: string;
  contributorName: string;
  amount: number;
  status: FundContributionStatus;
  statusLabel: string;
  paymentMethod: string;
  paymentReference?: string;
  evidenceUrl?: string;
  note?: string;
  createdAt: string;
  verifiedAt?: string;
  verifiedByName?: string;
  financialMode?: FinancialMode;
  financialModeLabel?: string;
  groupId?: string;
  groupName?: string;
}

export interface FundTransactionResponse {
  id: string;
  fundId: string;
  transactionType: FundTransactionType;
  transactionTypeLabel: string;
  amount: number;
  direction: FundTransactionDirection;
  status: FundTransactionStatus;
  referenceType: string;
  referenceId?: string;
  balanceAfter?: number;
  description: string;
  createdAt: string;
  confirmedAt?: string;
  confirmedByName?: string;
  financialMode?: FinancialMode;
  financialModeLabel?: string;
}

export interface CommonDisbursementRequest {
  expenseId: string;
  amount?: number;
  note?: string;
}

export interface PersonalPaymentSubmitRequest {
  expenseShareId?: string;
  amount: number;
  paymentMethod?: string;
  paymentReference?: string;
  evidenceUrl?: string;
  note?: string;
}

export interface PersonalPaymentVerifyRequest {
  confirmed: boolean;
  note?: string;
}

export interface PersonalExpensePaymentResponse {
  id: string;
  expenseId: string;
  expenseDescription?: string;
  expenseShareId?: string;
  payerUserId: string;
  payerName: string;
  amount: number;
  status: PersonalPaymentStatus;
  statusLabel: string;
  paymentMethod: string;
  paymentReference?: string;
  evidenceUrl?: string;
  note?: string;
  createdAt: string;
  verifiedAt?: string;
  verifiedByName?: string;
  financialMode?: FinancialMode;
  financialModeLabel?: string;
  vehicleId?: string;
  vehicleName?: string;
}
