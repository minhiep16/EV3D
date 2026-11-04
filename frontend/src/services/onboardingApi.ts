import { authenticatedFetch, safeParseResponse } from './api';
import { VehicleResponse } from '../types/vehicle';
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
} from '../types/onboarding';

export const onboardingApi = {
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
      body: JSON.stringify(data),
    });
    return safeParseResponse<VehicleRegistrationDraftResponse>(res);
  },

  async updateDraft(draftId: string, data: VehicleRegistrationDraftRequest): Promise<VehicleRegistrationDraftResponse> {
    const res = await authenticatedFetch(`/api/onboarding/drafts/${draftId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return safeParseResponse<VehicleRegistrationDraftResponse>(res);
  },

  async deleteDraft(draftId: string): Promise<{ message: string }> {
    const res = await authenticatedFetch(`/api/onboarding/drafts/${draftId}`, {
      method: 'DELETE',
    });
    return safeParseResponse<{ message: string }>(res);
  },

  async submitDraft(draftId: string): Promise<VehicleResponse | VehicleRegistrationDraftResponse> {
    const res = await authenticatedFetch(`/api/onboarding/drafts/${draftId}/submit`, {
      method: 'POST',
    });
    return safeParseResponse<VehicleResponse | VehicleRegistrationDraftResponse>(res);
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

  async redeemInviteCode(data: RedeemInviteCodeRequest): Promise<GroupInvitationResponse> {
    const res = await authenticatedFetch('/api/onboarding/invitations/redeem-code', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return safeParseResponse<GroupInvitationResponse>(res);
  },
};

