export type VoteProposalType =
  | 'MAINTENANCE'
  | 'REPAIR'
  | 'ACCESSORY'
  | 'UPGRADE'
  | 'OTHER_COMMON_EXPENSE';

export type VoteProposalStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED';

export type ProposalVoteChoice = 'APPROVE' | 'REJECT' | 'ABSTAIN';

export type VoteDecisionRule = 'OWNERSHIP_WEIGHTED' | 'ONE_MEMBER_ONE_VOTE';

export type ProposalExecutionStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ProposalEligibilityDto {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  memberId: string;
  votingWeight: number;
  createdAt: string;
}

export interface ProposalVoteResponse {
  id: string;
  proposalId: string;
  voterUserId: string;
  voterName: string;
  voterEmail: string;
  memberId: string;
  choice: ProposalVoteChoice;
  choiceVietnamese: string;
  votingWeightSnapshot: number;
  comment?: string | null;
  castAt: string;
  updatedAt: string;
}

export interface VoteProposalResponse {
  id: string;
  groupId: string;
  groupName: string;
  vehicleId: string;
  vehicleName: string;
  vehicleLicensePlate: string;
  createdByUserId: string;
  creatorName: string;
  proposalType: VoteProposalType;
  proposalTypeVietnamese: string;
  title: string;
  description?: string | null;
  estimatedAmount: number;
  approvedBudget: number;
  currency: string;
  status: VoteProposalStatus;
  statusVietnamese: string;
  decisionRule: VoteDecisionRule;
  decisionRuleVietnamese: string;
  requiredQuorumPercentage: number;
  requiredThresholdPercentage: number;
  agreementVersion: string;
  votingStartsAt: string;
  votingEndsAt: string;
  finalizedAt?: string | null;
  executionStatus: ProposalExecutionStatus;
  executionStatusVietnamese: string;
  executionStartedAt?: string | null;
  executionCompletedAt?: string | null;
  executedByStaffName?: string | null;
  actualCost?: number | null;
  relatedMaintenanceRequestId?: string | null;
  relatedExpenseId?: string | null;
  totalEligibleWeight: number;
  eligibleVoterCount: number;
  participatingWeight: number;
  participatingVoterCount: number;
  approveWeight: number;
  rejectWeight: number;
  abstainWeight: number;
  approveCount: number;
  rejectCount: number;
  abstainCount: number;
  quorumSatisfied: boolean;
  thresholdSatisfied: boolean;
  currentUserVote?: ProposalVoteChoice | null;
  currentUserWeight: number;
  isEligibleToVote: boolean;
  eligibleVoters: ProposalEligibilityDto[];
  votes: ProposalVoteResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface VoteResultResponse {
  proposalId: string;
  title: string;
  proposalType: VoteProposalType;
  proposalTypeVietnamese: string;
  status: VoteProposalStatus;
  statusVietnamese: string;
  isApproved: boolean;
  decisionRule: VoteDecisionRule;
  decisionRuleVietnamese: string;
  requiredQuorumPercentage: number;
  requiredThresholdPercentage: number;
  actualQuorumPercentage: number;
  quorumMet: boolean;
  actualApprovePercentage: number;
  thresholdMet: boolean;
  approvedBudget: number;
  currency: string;
  finalizedAt?: string | null;
  executionStatus: ProposalExecutionStatus;
  executionStatusVietnamese: string;
  relatedMaintenanceRequestId?: string | null;
  relatedExpenseId?: string | null;
  totalEligibleVoters: number;
  totalVotesSubmitted: number;
  approveCount: number;
  rejectCount: number;
  abstainCount: number;
  approveWeight: number;
  rejectWeight: number;
  abstainWeight: number;
  votes: ProposalVoteResponse[];
}

export interface ApprovedWorkResponse {
  proposalId: string;
  authorizationId: string;
  vehicleId: string;
  vehicleName: string;
  vehicleLicensePlate: string;
  groupId: string;
  groupName: string;
  proposalType: VoteProposalType;
  proposalTypeVietnamese: string;
  title: string;
  description?: string | null;
  approvedBudget: number;
  estimatedAmount: number;
  currency: string;
  votingStatus: VoteProposalStatus;
  votingStatusVietnamese: string;
  workStatus: ProposalExecutionStatus;
  workStatusVietnamese: string;
  approvedAt?: string | null;
  executionStartedAt?: string | null;
  executionCompletedAt?: string | null;
  executedByStaffName?: string | null;
  actualCost?: number | null;
  canStartExecution: boolean;
  executionBlockReason?: string | null;
  relatedMaintenanceRequestId?: string | null;
  relatedExpenseId?: string | null;
}

export interface CreateVoteProposalRequest {
  vehicleId: string;
  proposalType: VoteProposalType;
  title: string;
  description?: string;
  estimatedAmount: number;
  votingEndsAt?: string;
  votingDurationDays?: number;
  relatedMaintenanceRequestId?: string;
}

export interface CastProposalVoteRequest {
  choice: ProposalVoteChoice;
  comment?: string;
}

export interface StartProposalWorkRequest {
  note?: string;
}

export interface CompleteProposalWorkRequest {
  actualCost: number;
  completionNote?: string;
  evidenceUrl?: string;
}

export interface UpdateVotingPolicyRequest {
  votingRule: VoteDecisionRule;
  quorumPercentage: number;
  approvalThresholdPercentage: number;
}

export const VOTE_PROPOSAL_TYPE_CONFIG: Record<
  VoteProposalType,
  { labelVi: string; color: string; bg: string; borderColor: string }
> = {
  MAINTENANCE: {
    labelVi: 'Bảo dưỡng',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  REPAIR: {
    labelVi: 'Sửa chữa',
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.12)',
    borderColor: 'rgba(249, 115, 22, 0.35)',
  },
  ACCESSORY: {
    labelVi: 'Mua phụ kiện',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  UPGRADE: {
    labelVi: 'Nâng cấp xe',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.12)',
    borderColor: 'rgba(168, 85, 247, 0.35)',
  },
  OTHER_COMMON_EXPENSE: {
    labelVi: 'Chi phí chung khác',
    color: '#e2e8f0',
    bg: 'rgba(226, 232, 240, 0.10)',
    borderColor: 'rgba(226, 232, 240, 0.25)',
  },
};

export const VOTE_PROPOSAL_STATUS_CONFIG: Record<
  VoteProposalStatus,
  { labelVi: string; color: string; bg: string; borderColor: string }
> = {
  DRAFT: {
    labelVi: 'Bản nháp',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.12)',
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  OPEN: {
    labelVi: 'Đang biểu quyết',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.45)',
  },
  APPROVED: {
    labelVi: 'Đã phê duyệt',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.45)',
  },
  REJECTED: {
    labelVi: 'Đã từ chối',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.45)',
  },
  EXPIRED: {
    labelVi: 'Đã hết hạn',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.45)',
  },
  CANCELLED: {
    labelVi: 'Đã hủy',
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.12)',
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
};

export const PROPOSAL_CHOICE_CONFIG: Record<
  ProposalVoteChoice,
  { labelVi: string; color: string; bg: string; borderColor: string }
> = {
  APPROVE: {
    labelVi: 'ĐỒNG Ý',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  REJECT: {
    labelVi: 'KHÔNG ĐỒNG Ý',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  ABSTAIN: {
    labelVi: 'PHIẾU TRẮNG',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.15)',
    borderColor: 'rgba(148, 163, 184, 0.5)',
  },
};
