export type TransferStatus =
  | 'DRAFT'
  | 'PENDING_ACCEPTANCE'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PENDING_CONTRACT'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export type WithdrawalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type InvitationStatus =
  | 'INVITED'
  | 'ACCEPTED'
  | 'PENDING_GROUP_APPROVAL'
  | 'CONTRACT_ACCEPTANCE'
  | 'ACTIVE'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface MemberSharePreview {
  userId: string;
  fullName: string;
  email?: string;
  role?: string;
  currentPercentage: number;
  proposedPercentage: number;
  deltaPercentage: number;
}

export interface OwnershipDistributionPreviewResponse {
  members?: MemberSharePreview[];
  proposedDistribution?: MemberSharePreview[];
  currentDistribution?: MemberSharePreview[];
  transferPercentage: number;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  valid: boolean;
  validationMessage?: string;
  hasOutstandingFinancialObligations: boolean;
  financialObligationMessage?: string;
  financialObligationWarning?: string;
  contractVersionFormatted?: string;
  contentSnapshot?: string;
  contentHash?: string;
}

export interface TransferParty {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  roleVi: string;
  currentPercentage?: number;
  proposedPercentage?: number;
  isConsented: boolean;
  consentedAt?: string | null;
  statusVi: string;
}

export interface OwnershipTransferResponse {
  id: string;
  transferRequestId?: string;
  groupId: string;
  groupName?: string;
  vehicleId: string;
  vehicleName?: string;
  fromUserId: string;
  fromUserName: string;
  fromUserEmail: string;
  fromUserCurrentPercentage?: number;
  toUserId: string;
  toUserName: string;
  toUserEmail: string;
  toUserCurrentPercentage?: number;
  transferPercentage: number;
  status: TransferStatus;
  statusVi?: string;
  reason?: string;
  rejectReason?: string;
  createdAt: string;
  acceptedAt?: string | null;
  approvedAt?: string | null;
  completedAt?: string | null;
  rejectedAt?: string | null;
  effectiveAt?: string | null;
  relatedProposalId?: string | null;
  relatedContractVersionId?: string | null;
  contractCode?: string;
  contractVersionId?: string;
  contractVersionFormatted?: string;
  contractVersionTitle?: string;
  contentSnapshot?: string;
  contentHash?: string;
  proposedOwnershipSnapshot?: string;
  isRecipientAccepted?: boolean;
  recipientAccepted?: boolean;
  isTransferorAccepted?: boolean;
  transferorAccepted?: boolean;
  acceptedMembersCount?: number;
  acceptedConsentCount?: number;
  totalMembersCount?: number;
  consentPolicy?: string;
  consentPolicyLabel?: string;
  requiredAcceptanceCount?: number;
  requiredConsentCount?: number;
  currentAcceptanceCount?: number;
  additionalApprovalStatus?: string;
  notificationMessage?: string;
  isInternalTransfer?: boolean;
  parties?: TransferParty[];
  requiredParties?: TransferParty[];
  canAccept?: boolean;
  canReject?: boolean;
  canCancel?: boolean;
  canComplete?: boolean;
  canFinalize?: boolean;
  acceptanceStatus?: string;
  finalizationBlockers?: string[];
  transferorUserId?: string;
  recipientUserId?: string;
  currentUserAccepted?: boolean;
  currentUserCanAccept?: boolean;
  appendixAvailable?: boolean;
  appendixHash?: string;
  nextRequiredActions?: string[];
}

export interface OwnershipHistoryResponse {
  id: string;
  groupId: string;
  groupName?: string;
  vehicleId: string;
  vehicleName?: string;
  transferRequestId?: string | null;
  fromUserId?: string | null;
  fromUserName?: string | null;
  toUserId?: string | null;
  toUserName?: string | null;
  transferredPercentage: number;
  previousOwnershipSnapshot?: string | null;
  newOwnershipSnapshot?: string | null;
  reason?: string | null;
  effectiveAt: string;
  recordedAt: string;
  recordedByUserName?: string | null;
}

export interface MembershipWithdrawalResponse {
  id: string;
  groupId: string;
  groupName?: string;
  userId: string;
  userName: string;
  userEmail: string;
  reason: string;
  status: WithdrawalStatus;
  rejectionReason?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  reviewedByUserName?: string | null;
}

export interface CreateTransferPayload {
  toUserId: string;
  transferPercentage: number;
  reason?: string;
  contentHash?: string;
  acknowledgedTerms?: boolean;
}

export interface AcceptTransferPayload {
  contentHash?: string;
  confirmationNote?: string;
  acknowledgedTerms?: boolean;
}

export interface RejectTransferPayload {
  reason?: string;
}

export interface CreateWithdrawalPayload {
  reason: string;
}

export interface ReviewWithdrawalPayload {
  approved: boolean;
  rejectionReason?: string;
}
