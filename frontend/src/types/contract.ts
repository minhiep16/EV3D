export type ContractStatus =
  | 'DRAFT'
  | 'PENDING_ACCEPTANCE'
  | 'ACTIVE'
  | 'SUPERSEDED'
  | 'CANCELLED'
  | 'EXPIRED';

export type ContractVersionStatus =
  | 'DRAFT'
  | 'PENDING_ACCEPTANCE'
  | 'ACTIVE'
  | 'SUPERSEDED'
  | 'CANCELLED'
  | 'EXPIRED';

export type AcceptanceStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export type ConsentPolicy =
  | 'INITIAL_CONTRACT'
  | 'GENERAL_AMENDMENT'
  | 'INTERNAL_OWNERSHIP_TRANSFER'
  | 'EXTERNAL_OWNERSHIP_TRANSFER';

export interface ContractSignatoryResponse {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  roleVi: string;
  ownershipPercentage: number;
  isConsented: boolean;
  consentedAt?: string | null;
  statusVi: string;
}

export interface ContractSummaryResponse {
  id: string;
  groupId: string;
  groupName: string;
  vehicleId: string;
  vehicleName: string;
  contractCode: string;
  currentVersionId: string | null;
  currentVersionNumber: number | null;
  currentVersionFormatted: string;
  status: ContractStatus;
  statusLabel: string;
  effectiveFrom: string | null;
  totalMembers: number;
  acceptedMembers: number;
  isCurrentUserAccepted: boolean;
  canAccept: boolean;
  canActivate: boolean;
  createdAt: string;
  updatedAt: string | null;
  consentPolicy?: ConsentPolicy;
  consentPolicyLabel?: string;
  requiredAcceptanceCount?: number;
  currentAcceptanceCount?: number;
  additionalApprovalStatus?: string;
  signatories?: ContractSignatoryResponse[];
}

export interface ContractAcceptanceResponse {
  id: string;
  contractVersionId: string;
  userId: string;
  fullName: string;
  email: string;
  ownershipPercentage: number;
  status: AcceptanceStatus;
  statusLabel: string;
  acceptedAt: string;
  contentHashAtAcceptance: string;
  acceptanceMethod: string;
}

export interface ContractVersionResponse {
  id: string;
  contractId: string;
  contractCode: string;
  versionNumber: number;
  versionNumberFormatted: string;
  title: string;
  contentSnapshot: string;
  contentHash: string;
  ownershipSnapshot: string;
  votingRuleSnapshot: string;
  financialRuleSnapshot: string;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  status: ContractVersionStatus;
  statusLabel: string;
  createdByName: string;
  createdAt: string;
  activatedAt: string | null;
  acceptances: ContractAcceptanceResponse[];
  allMembersAccepted: boolean;
  consentPolicy?: ConsentPolicy;
  consentPolicyLabel?: string;
  requiredAcceptanceCount?: number;
  currentAcceptanceCount?: number;
  additionalApprovalStatus?: string;
  signatories?: ContractSignatoryResponse[];
}

export interface CreateContractVersionRequest {
  title: string;
  contentSnapshot: string;
  votingRule?: string;
  quorumPercentage?: number;
  approvalThresholdPercentage?: number;
}

export interface ContractAcceptanceRequest {
  contentHash?: string;
  confirmationNote?: string;
}
