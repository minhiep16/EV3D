export interface OwnershipShareResponse {
  id: string;
  groupId: string;
  vehicleId: string;
  memberId: string;
  percentage: number;
  updatedAt: string;
}

export interface GroupMemberResponse {
  id: string;
  groupId: string;
  userId: string;
  fullName: string;
  email: string;
  role: string;
  memberRole?: 'MEMBER' | 'REPRESENTATIVE' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'REMOVED';
  avatarUrl?: string | null;
  joinedAt: string;
  removedAt?: string | null;
  share: OwnershipShareResponse | null;
}

export interface GroupVehicleResponse {
  id: string;
  groupId: string;
  vehicleId: string;
  vehicleCode: string;
  model: string;
  status: 'ACTIVE' | 'INACTIVE';
  addedAt: string;
}

export interface AvailableUserResponse {
  id: string;
  displayName: string;
  email: string;
}

export interface AddMemberPayload {
  userId?: string;
  email?: string;
}

/**
 * Authoritative Business Rule:
 * 1 CoOwnershipGroup = exactly 1 Vehicle.
 * A group represents the people jointly owning ONE specific vehicle.
 * `vehicleId` and `vehicleCode` are the direct 1-to-1 vehicle identity.
 * `vehicles` list is maintained for backward compatibility with length <= 1.
 */
export interface CoOwnershipGroupResponse {
  id: string;
  name: string;
  status?: 'ACTIVE' | 'INACTIVE';
  createdBy?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  members: GroupMemberResponse[];
  vehicles?: GroupVehicleResponse[];
  vehicleId?: string | null;
  vehicleCode?: string | null;
  totalOwnershipPercentage: number;
  availablePercentage: number;
  statusLabel?: string;
}

export type MembershipInvitationStatus =
  | 'PENDING_CONTRIBUTOR_CONSENT'
  | 'PENDING_INVITEE_RESPONSE'
  | 'ACCEPTED'
  | 'PENDING_CONTRACT_SIGNATURE'
  | 'READY_FOR_COMPLETION'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'INVITED'
  | 'ACTIVE';

export interface ContributorShareContribution {
  userId: string;
  fullName: string;
  email: string;
  percentage: number;
  consented?: boolean;
  declined?: boolean;
  consentedAt?: string | null;
  note?: string | null;
}

export interface MemberSharePreviewItem {
  userId: string | null;
  fullName: string;
  email: string;
  currentPercentage: number;
  deductionPercentage: number;
  projectedPercentage: number;
  isCurrentLeader: boolean;
  isProjectedLeader: boolean;
  roleLabel: string;
}

export interface InvitationPreviewRequest {
  inviteeUserId?: string;
  inviteeEmail?: string;
  leaderTransferPercentage: number;
  additionalContributions?: ContributorShareContribution[];
}

export interface InvitationPreviewResponse {
  groupId: string;
  groupName: string;
  vehicleId: string;
  vehicleName: string;
  inviteeUserId?: string | null;
  inviteeName: string;
  inviteeEmail: string;
  leaderTransferPercentage: number;
  totalOfferedPercentage: number;
  currentDistribution: MemberSharePreviewItem[];
  projectedDistribution: MemberSharePreviewItem[];
  currentLeaderId?: string | null;
  currentLeaderName: string;
  projectedLeaderId?: string | null;
  projectedLeaderName: string;
  leaderChanges: boolean;
  initialStatus: MembershipInvitationStatus;
  note?: string;
}

export interface InvitationPermissionResponse {
  canInvite: boolean;
  currentLeaderUserId?: string | null;
  currentLeaderName?: string | null;
  leaderSharePercentage: number;
  maxTransferablePercentage: number;
  minTransferPercentage: number;
  message: string;
}

export interface DigitalSignatureRecord {
  userId: string;
  signerName: string;
  role: string;
  signedAt: string;
  ipAddress: string;
  method: string;
}

export interface InvitationSignatoryResponse {
  userId: string | null;
  fullName: string;
  email: string;
  role: string;
  roleLabel: string;
  contributionPercentage?: number | null;
  signed: boolean;
  signedAt?: string | null;
  signatureMethod?: string | null;
  ipAddress?: string | null;
}

export interface MembershipInvitationResponse {
  id: string;
  groupId: string;
  groupName?: string;
  vehicleId: string;
  vehicleName?: string;
  vehicleCode?: string;
  licensePlate?: string;
  invitedByUserId: string;
  invitedByUserName: string;
  inviteeEmail: string;
  inviteeUserId?: string | null;
  inviteeUserName?: string | null;
  proposedPercentage: number;
  leaderTransferPercentage: number;
  totalOfferedPercentage: number;
  additionalContributions: ContributorShareContribution[];
  signatures: DigitalSignatureRecord[];
  contractVersionId?: string | null;
  contractId?: string | null;
  contractTitle?: string | null;
  contractContent?: string | null;
  documentHash?: string | null;
  contractVersionNumber?: number | null;
  status: MembershipInvitationStatus;
  statusVi: string;
  invitationNote?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  acceptedAt?: string | null;
  completedAt?: string | null;
  rejectedAt?: string | null;
  cancelledAt?: string | null;
  expiresAt: string;
  canConsent?: boolean;
  canAccept?: boolean;
  canReject?: boolean;
  canCancel?: boolean;
  canSign?: boolean;
  canFinalize?: boolean;
  currentSocPercent?: number;
  odometerKm?: number;
  damageCount?: number;
  batteryCapacityKwh?: number;
  manufactureYear?: number;
  vehicleModel?: string;
  exteriorColor?: string;
  currentLeaderName?: string;
  projectedLeaderName?: string;
  currentDistribution?: MemberSharePreviewItem[];
  projectedDistribution?: MemberSharePreviewItem[];
  requiredSignatories?: InvitationSignatoryResponse[];
  signedCount?: number;
  requiredSignaturesCount?: number;
  pendingSignerNames?: string[];
  isCurrentUserRequiredSigner?: boolean;
  hasCurrentUserSigned?: boolean;
}

export interface CreateInvitationPayload {
  inviteeUserId?: string;
  inviteeEmail?: string;
  leaderTransferPercentage: number;
  additionalContributions?: ContributorShareContribution[];
  invitationNote?: string;
}

export interface ContributorConsentPayload {
  approved: boolean;
  note?: string;
}

export interface InviteeRespondPayload {
  accept: boolean;
  reason?: string;
}

export interface DigitalSignPayload {
  pinOrPassword?: string;
  signatureMethod?: string;
  fullName?: string;
  contentHash?: string;
}
