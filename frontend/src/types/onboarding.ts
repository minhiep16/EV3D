export type DraftStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type JoinRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export interface CoOwnerInviteDraft {
  fullName: string;
  email: string;
  phoneNumber?: string;
  sharePercentage: number;
  contributionAmount: number;
  role: 'REPRESENTATIVE' | 'CO_OWNER';
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
  vin?: string;
  batteryCapacityKwh: number;
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
  plateNumber: string;
  model: string;
  vin?: string;
  batteryCapacityKwh: number;
  manufactureYear?: number;
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
  adminReviewNotes?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
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
  vehicleModel?: string;
  inviterName: string;
  email: string;
  phoneNumber?: string;
  intendedSharePercentage?: number;
  inviteCode: string;
  status: InvitationStatus;
  message?: string;
  expiresAt: string;
  createdAt: string;
}

export interface RedeemInviteCodeRequest {
  inviteCode: string;
}

export interface ReviewJoinRequestDto {
  status: 'APPROVED' | 'REJECTED';
  reviewerNotes?: string;
}

