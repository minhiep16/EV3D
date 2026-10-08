import { ExpenseAllocationPolicy } from './expense';

export type ExpenseShareStatus = 'ALLOCATED' | 'PENDING' | 'SETTLED';

export interface ExpenseShareResponse {
  id: string;
  expenseId: string;
  userId: string;
  userName: string;
  ownershipPercentage: number;
  allocationPercentage?: number;
  shareAmount: number;
  status: ExpenseShareStatus;
  isPayer: boolean;
  paidAmount: number;
  allocationPolicy?: ExpenseAllocationPolicy;
  allocationPolicyLabel?: string;
  isResponsibleUser?: boolean;
  memberKmSnapshot?: number | null;
  totalKmSnapshot?: number | null;
  rawCalculatedAmount?: number | null;
  redistributionAdjustment?: number | null;
  allocationPeriodStart?: string | null;
  allocationPeriodEnd?: string | null;
  calculationVersion?: string | null;
}

export interface MemberCostShareResponse {
  userId: string;
  userName: string;
  ownershipPercentage: number;
  requiredShare: number;
  paidAmount: number;
  netPosition: number;
  isCurrentUser: boolean;
}

export interface CostSharingSummaryResponse {
  vehicleId: string;
  month: string;
  totalExpense: number;
  userId: string;
  userOwnershipPercentage: number;
  userRequiredShare: number;
  userPaidAmount: number;
  userNetPosition: number;
  memberBreakdown: MemberCostShareResponse[];
}
