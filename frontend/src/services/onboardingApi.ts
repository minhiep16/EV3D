import { authenticatedFetch, safeParseResponse } from './api';
import {
  OnboardingStatusResponse,
  VehicleRegistrationDraftRequest,
  VehicleRegistrationDraftResponse,
  DiscoverableGroupResponse,
  CreateJoinRequestDto,
  GroupJoinRequestResponse,
  CreateInvitationRequest,
  GroupInvitationResponse,
  RedeemInviteCodeRequest,
  ReviewJoinRequestDto,
  OnboardingUserSearchResult,
  InvitationContractReviewResponse,
  InvitationConsentRequest,
  ReviewVehicleRegistrationRequest,
} from '../types/onboarding';

function formatDraftPayload(data: VehicleRegistrationDraftRequest) {
  return {
    ...data,
    vehicleName: data.name || data.model || 'Xe điện EVShare',
    model: data.model,
    manufacturer: data.manufacturer,
    model3dUrl: data.model3dUrl,
    licensePlate: data.plateNumber,
    plateNumber: data.plateNumber,
    vin: data.vin,
    batteryCapacity: data.batteryCapacityKwh,
    batteryCapacityKwh: data.batteryCapacityKwh,
    modelYear: data.manufactureYear || 2025,
    vehicleValue: data.vehicleValue,
    registrationCity: data.registrationCity,
    groupName: data.groupName,
    monthlyFundContribution: data.monthlyFundContribution,
    latePaymentFeeRate: data.latePaymentFeeRate,
    maintenanceReserveRate: data.maintenanceReserveRate,
    maxConsecutiveBookingDays: data.maxConsecutiveBookingDays,
    currentStep: data.currentStep,
    proposedCoOwners: data.coOwners
      ? JSON.stringify(
          data.coOwners.map((o) => ({
            userId: o.userId,
            fullName: o.fullName,
            name: o.fullName,
            email: o.email,
            phoneNumber: o.phoneNumber,
            percentage: o.sharePercentage,
            sharePercentage: o.sharePercentage,
            contributionAmount: o.contributionAmount,
            role: o.role,
          }))
        )
      : undefined,
  };
}

export const onboardingApi = {
  // Search eligible registered users for co-ownership
  async searchUsers(query: string): Promise<OnboardingUserSearchResult[]> {
    if (!query || query.trim().length < 3) return [];
    const res = await authenticatedFetch(`/api/onboarding/search-users?query=${encodeURIComponent(query.trim())}`);
    return safeParseResponse<OnboardingUserSearchResult[]>(res);
  },

  // Status
  async getStatus(): Promise<OnboardingStatusResponse> {
    const res = await authenticatedFetch('/api/onboarding/status');
    return safeParseResponse<OnboardingStatusResponse>(res);
  },

  // Drafts
  async getMyDrafts(): Promise<VehicleRegistrationDraftResponse[]> {
    const res = await authenticatedFetch('/api/onboarding/drafts');
    return safeParseResponse<VehicleRegistrationDraftResponse[]>(res);
  },

  async getDraftById(draftId: string): Promise<VehicleRegistrationDraftResponse> {
    const res = await authenticatedFetch(`/api/onboarding/drafts/${draftId}`);
    return safeParseResponse<VehicleRegistrationDraftResponse>(res);
  },

  async saveDraft(data: VehicleRegistrationDraftRequest): Promise<VehicleRegistrationDraftResponse> {
    const res = await authenticatedFetch('/api/onboarding/drafts', {
      method: 'POST',
      body: JSON.stringify(formatDraftPayload(data)),
    });
    return safeParseResponse<VehicleRegistrationDraftResponse>(res);
  },

  async updateDraft(draftId: string, data: VehicleRegistrationDraftRequest): Promise<VehicleRegistrationDraftResponse> {
    const res = await authenticatedFetch(`/api/onboarding/drafts/${draftId}`, {
      method: 'PUT',
      body: JSON.stringify(formatDraftPayload(data)),
    });
    return safeParseResponse<VehicleRegistrationDraftResponse>(res);
  },

  async deleteDraft(draftId: string): Promise<{ message: string }> {
    const res = await authenticatedFetch(`/api/onboarding/drafts/${draftId}`, {
      method: 'DELETE',
    });
    return safeParseResponse<{ message: string }>(res);
  },

  async submitDraft(draftId: string): Promise<VehicleRegistrationDraftResponse> {
    const res = await authenticatedFetch(`/api/onboarding/drafts/${draftId}/submit`, {
      method: 'POST',
    });
    return safeParseResponse<VehicleRegistrationDraftResponse>(res);
  },

  async validateLicensePlate(
    licensePlate: string,
    draftId?: string,
    signal?: AbortSignal
  ): Promise<{
    available: boolean;
    normalizedPlate: string;
    code: string;
    message: string;
    detailMessage?: string;
    ownPendingApplication?: boolean;
  }> {
    const params = new URLSearchParams({ licensePlate });
    if (draftId) {
      params.set('draftId', draftId);
    }
    const res = await authenticatedFetch(`/api/onboarding/validate-plate?${params.toString()}`, {
      method: 'GET',
      signal,
    });
    return safeParseResponse(res);
  },

  // Staff Registration Review Workflow
  async getStaffApplications(status?: string): Promise<VehicleRegistrationDraftResponse[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await authenticatedFetch(`/api/onboarding/staff/applications${query}`);
    return safeParseResponse<VehicleRegistrationDraftResponse[]>(res);
  },

  async getStaffApplicationById(applicationId: string): Promise<VehicleRegistrationDraftResponse> {
    const res = await authenticatedFetch(`/api/onboarding/staff/applications/${applicationId}`);
    return safeParseResponse<VehicleRegistrationDraftResponse>(res);
  },

  async reviewApplication(
    applicationId: string,
    data: ReviewVehicleRegistrationRequest
  ): Promise<VehicleRegistrationDraftResponse> {
    const res = await authenticatedFetch(`/api/onboarding/staff/applications/${applicationId}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return safeParseResponse<VehicleRegistrationDraftResponse>(res);
  },

  // Groups Discovery
  async getDiscoverableGroups(search?: string): Promise<DiscoverableGroupResponse[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await authenticatedFetch(`/api/onboarding/discoverable-groups${query}`);
    return safeParseResponse<DiscoverableGroupResponse[]>(res);
  },

  async getDiscoverableGroupDetail(groupId: string): Promise<DiscoverableGroupResponse> {
    const res = await authenticatedFetch(`/api/onboarding/discoverable-groups/${groupId}`);
    return safeParseResponse<DiscoverableGroupResponse>(res);
  },

  // Join Requests
  async submitJoinRequest(groupId: string, data: CreateJoinRequestDto): Promise<GroupJoinRequestResponse> {
    const res = await authenticatedFetch(`/api/onboarding/discoverable-groups/${groupId}/join-requests`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return safeParseResponse<GroupJoinRequestResponse>(res);
  },

  async getMyJoinRequests(): Promise<GroupJoinRequestResponse[]> {
    const res = await authenticatedFetch('/api/onboarding/my-join-requests');
    return safeParseResponse<GroupJoinRequestResponse[]>(res);
  },

  async getGroupJoinRequests(groupId: string): Promise<GroupJoinRequestResponse[]> {
    const res = await authenticatedFetch(`/api/onboarding/groups/${groupId}/join-requests`);
    return safeParseResponse<GroupJoinRequestResponse[]>(res);
  },

  async reviewJoinRequest(requestId: string, data: ReviewJoinRequestDto): Promise<GroupJoinRequestResponse> {
    const res = await authenticatedFetch(`/api/onboarding/join-requests/${requestId}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return safeParseResponse<GroupJoinRequestResponse>(res);
  },

  // Invitations
  async createInvitation(groupId: string, data: CreateInvitationRequest): Promise<GroupInvitationResponse> {
    const res = await authenticatedFetch(`/api/onboarding/groups/${groupId}/invitations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return safeParseResponse<GroupInvitationResponse>(res);
  },

  async getMyInvitations(): Promise<GroupInvitationResponse[]> {
    const res = await authenticatedFetch('/api/onboarding/my-invitations');
    return safeParseResponse<GroupInvitationResponse[]>(res);
  },

  async respondToInvitation(invitationId: string, accept: boolean): Promise<GroupInvitationResponse> {
    const res = await authenticatedFetch(`/api/onboarding/invitations/${invitationId}/respond?accept=${accept}`, {
      method: 'POST',
    });
    return safeParseResponse<GroupInvitationResponse>(res);
  },

  async getInvitationContract(invitationId: string): Promise<InvitationContractReviewResponse> {
    const res = await authenticatedFetch(`/api/onboarding/invitations/${invitationId}/contract`);
    return safeParseResponse<InvitationContractReviewResponse>(res);
  },

  async recordInvitationConsent(
    invitationId: string,
    data: InvitationConsentRequest
  ): Promise<GroupInvitationResponse> {
    const res = await authenticatedFetch(`/api/onboarding/invitations/${invitationId}/consent`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return safeParseResponse<GroupInvitationResponse>(res);
  },

  async signAndAcceptInvitation(
    invitationId: string,
    data: InvitationConsentRequest
  ): Promise<GroupInvitationResponse> {
    const res = await authenticatedFetch(`/api/onboarding/invitations/${invitationId}/sign-and-accept`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return safeParseResponse<GroupInvitationResponse>(res);
  },

  async redeemInviteCode(data: RedeemInviteCodeRequest): Promise<GroupInvitationResponse> {
    const res = await authenticatedFetch('/api/onboarding/invitations/redeem-code', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return safeParseResponse<GroupInvitationResponse>(res);
  },
};

