export type DraftStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED';
export type JoinRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export interface CoOwnerInviteDraft {
  userId?: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  sharePercentage: number;
  contributionAmount: number;
  role: 'REPRESENTATIVE' | 'CO_OWNER';
  isVerifiedAccount?: boolean;
}

export interface OnboardingUserSearchResult {
  id: string;
  fullName: string;
  email: string;
  maskedEmail: string;
}

export interface OnboardingStatusResponse {
  hasActiveGroup: boolean;
  vehicleCount: number;
  pendingInvitationsCount: number;
  pendingJoinRequestsCount: number;
  draftsCount: number;
  recommendedAction: 'ROUTE_TO_GARAGE' | 'ROUTE_TO_ONBOARDING';
}

export interface VehicleRegistrationDraftRequest {
  id?: string;
  name?: string;
  plateNumber: string;
  model: string;
  manufacturer?: string;
  model3dUrl?: string;
  vin?: string;
  batteryCapacityKwh: number;
  exteriorColor?: string;
  manufactureYear?: number;
  vehicleValue: number;
  registrationCity?: string;
  groupName: string;
  monthlyFundContribution: number;
  latePaymentFeeRate?: number;
  maintenanceReserveRate?: number;
  maxConsecutiveBookingDays?: number;
  coOwners: CoOwnerInviteDraft[];
  contractTermsSummary?: string;
  contractDraftMarkdown?: string;
  currentStep?: number;
}

export interface VehicleRegistrationDraftResponse {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorEmail?: string;
  plateNumber: string;
  licensePlate?: string;
  model: string;
  vehicleModel?: string;
  manufacturer?: string;
  model3dUrl?: string;
  vin?: string;
  batteryCapacityKwh: number;
  batteryCapacity?: number;
  exteriorColor?: string;
  manufactureYear?: number;
  productionYear?: number;
  vehicleValue: number;
  registrationCity?: string;
  groupName: string;
  monthlyFundContribution: number;
  latePaymentFeeRate: number;
  maintenanceReserveRate: number;
  maxConsecutiveBookingDays: number;
  coOwners: CoOwnerInviteDraft[];
  status: DraftStatus;
  currentStep: number;
  contractTermsSummary?: string;
  contractDraftMarkdown?: string;
  createdVehicleId?: string;
  createdGroupId?: string;
  reviewedBy?: string;
  reviewerName?: string;
  reviewedAt?: string;
  reviewDecision?: string;
  reviewReason?: string;
  adminReviewNotes?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewVehicleRegistrationRequest {
  decision: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES';
  reason?: string;
}

export interface DiscoverableGroupResponse {
  groupId: string;
  groupName: string;
  description?: string;
  city?: string;
  vehicleModel?: string;
  vehiclePlateNumber?: string;
  batteryCapacityKwh?: number;
  representativeName?: string;
  totalMembers: number;
  maxMembers: number;
  isAcceptingMembers: boolean;
  minSharePercentage?: number;
  maxSharePercentage?: number;
  estimatedContributionPerShare?: number;
  publicContactEmail?: string;
}

export interface CreateJoinRequestDto {
  proposedSharePercentage: number;
  proposedContributionAmount: number;
  message?: string;
  phoneNumber?: string;
  drivingLicenseNumber?: string;
}

export interface GroupJoinRequestResponse {
  id: string;
  groupId: string;
  groupName: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  proposedSharePercentage: number;
  proposedContributionAmount: number;
  message?: string;
  phoneNumber?: string;
  drivingLicenseNumber?: string;
  status: JoinRequestStatus;
  reviewerNotes?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface CreateInvitationRequest {
  email: string;
  phoneNumber?: string;
  intendedSharePercentage?: number;
  message?: string;
}

export interface GroupInvitationResponse {
  id: string;
  groupId: string;
  groupName: string;
  inviterId?: string;
  inviterName: string;
  inviteeEmail?: string;
  inviteeUserId?: string;
  email?: string;
  phoneNumber?: string;
  proposedPercentage?: number;
  intendedSharePercentage?: number;
  proposedContributionAmount?: number;
  vehicleModel?: string;
  vehiclePlateNumber?: string;
  contractId?: string;
  contractVersionId?: string;
  contentHash?: string;
  consentedAt?: string;
  signerFullName?: string;
  inviteCode: string;
  status: InvitationStatus;
  message?: string;
  expiresAt: string;
  createdAt: string;
}

export interface InvitationContractReviewResponse {
  invitationId: string;
  groupId: string;
  groupName: string;
  vehicleId: string;
  vehicleName: string;
  vehicleModel: string;
  vehiclePlateNumber: string;
  vehicleValue: number;
  inviterId: string;
  inviterName: string;
  inviteeEmail: string;
  inviteeName: string;
  proposedPercentage: number;
  proposedContributionAmount: number;
  contractId: string;
  contractCode: string;
  versionId: string;
  versionNumber: number;
  versionNumberFormatted: string;
  title: string;
  contentSnapshot: string;
  contentHash: string;
  votingRule: string;
  quorumPercentage: number;
  approvalThresholdPercentage: number;
  alreadyConsented: boolean;
  consentedAt?: string;
  signerFullName?: string;
}

export interface InvitationConsentRequest {
  contractVersionId: string;
  contentHash: string;
  signerFullName: string;
  confirmReadAndAgreed: boolean;
}

export interface RedeemInviteCodeRequest {
  inviteCode: string;
}

export interface ReviewJoinRequestDto {
  status: 'APPROVED' | 'REJECTED';
  reviewerNotes?: string;
}

