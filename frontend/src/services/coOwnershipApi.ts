import { authenticatedFetch, safeParseResponse } from './api';
import {
  CoOwnershipGroupResponse,
  GroupMemberResponse,
  GroupVehicleResponse,
  OwnershipShareResponse,
  AvailableUserResponse,
  AddMemberPayload,
  InvitationPermissionResponse,
  InvitationPreviewRequest,
  InvitationPreviewResponse,
  CreateInvitationPayload,
  MembershipInvitationResponse,
  ContributorConsentPayload,
  InviteeRespondPayload,
  DigitalSignPayload,
} from '../types/coOwnership';
import { isValidUuid } from '../utils/formatUtils';

export async function fetchVehicleCoOwnership(vehicleId: string): Promise<CoOwnershipGroupResponse> {
  if (!vehicleId || !isValidUuid(vehicleId)) {
    return null as any;
  }
  try {
    const res = await authenticatedFetch(`/api/vehicles/${vehicleId}/co-ownership`);
    return await safeParseResponse<CoOwnershipGroupResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && (err.message.includes('fetch') || err.message.includes('kết nối')))) {
      throw new Error('Không thể kết nối máy chủ. Vui lòng thử lại.');
    }
    throw err;
  }
}

export async function fetchCoOwnershipGroup(groupId: string): Promise<CoOwnershipGroupResponse> {
  try {
    const res = await authenticatedFetch(`/api/co-ownership-groups/${groupId}`);
    return await safeParseResponse<CoOwnershipGroupResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến thông tin nhóm đồng sở hữu.');
    }
    throw err;
  }
}

export async function fetchGroupMembers(groupId: string): Promise<GroupMemberResponse[]> {
  try {
    const res = await authenticatedFetch(`/api/co-ownership-groups/${groupId}/members`);
    return await safeParseResponse<GroupMemberResponse[]>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến danh sách thành viên nhóm.');
    }
    throw err;
  }
}

export async function fetchGroupVehicles(groupId: string): Promise<GroupVehicleResponse[]> {
  try {
    const res = await authenticatedFetch(`/api/co-ownership-groups/${groupId}/vehicles`);
    return await safeParseResponse<GroupVehicleResponse[]>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến danh sách xe trong nhóm.');
    }
    throw err;
  }
}

export async function fetchVehicleShares(groupId: string, vehicleId: string): Promise<OwnershipShareResponse[]> {
  try {
    const res = await authenticatedFetch(`/api/co-ownership-groups/${groupId}/vehicles/${vehicleId}/ownership-shares`);
    return await safeParseResponse<OwnershipShareResponse[]>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến dữ liệu tỷ lệ sở hữu xe.');
    }
    throw err;
  }
}

export async function searchAvailableUsers(
  groupId: string,
  query: string = ''
): Promise<AvailableUserResponse[]> {
  try {
    const url = `/api/co-ownership-groups/${groupId}/available-users?query=${encodeURIComponent(query)}`;
    const res = await authenticatedFetch(url);
    return await safeParseResponse<AvailableUserResponse[]>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể tìm kiếm người dùng khả dụng.');
    }
    throw err;
  }
}

export async function addMemberToGroup(
  groupId: string,
  payload: AddMemberPayload
): Promise<GroupMemberResponse> {
  try {
    const res = await authenticatedFetch(`/api/co-ownership-groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return await safeParseResponse<GroupMemberResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể thêm thành viên vào nhóm.');
    }
    throw err;
  }
}

export async function removeMemberFromGroup(
  groupId: string,
  memberId: string
): Promise<void> {
  try {
    const res = await authenticatedFetch(`/api/co-ownership-groups/${groupId}/members/${memberId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      await safeParseResponse<void>(res);
    }
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể xoá thành viên khỏi nhóm.');
    }
    throw err;
  }
}

// ==========================================
// Membership Invitation & Onboarding API
// ==========================================

export async function fetchInvitationPermission(
  groupId: string,
  vehicleId?: string
): Promise<InvitationPermissionResponse> {
  try {
    const url = `/api/co-ownership-groups/${groupId}/invitation-permission${vehicleId ? `?vehicleId=${vehicleId}` : ''}`;
    const res = await authenticatedFetch(url);
    return await safeParseResponse<InvitationPermissionResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kiểm tra quyền mời thành viên.');
    }
    throw err;
  }
}

export async function previewInvitation(
  groupId: string,
  payload: InvitationPreviewRequest
): Promise<InvitationPreviewResponse> {
  try {
    const res = await authenticatedFetch(`/api/co-ownership-groups/${groupId}/invitations/preview`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return await safeParseResponse<InvitationPreviewResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể tải xem trước phân bổ cổ phần.');
    }
    throw err;
  }
}

export async function createMembershipInvitation(
  groupId: string,
  payload: CreateInvitationPayload
): Promise<MembershipInvitationResponse> {
  try {
    const res = await authenticatedFetch(`/api/co-ownership-groups/${groupId}/invitations`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return await safeParseResponse<MembershipInvitationResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể tạo lời mời thành viên mới.');
    }
    throw err;
  }
}

export async function fetchGroupInvitations(
  groupId: string
): Promise<MembershipInvitationResponse[]> {
  try {
    const res = await authenticatedFetch(`/api/co-ownership-groups/${groupId}/invitations`);
    return await safeParseResponse<MembershipInvitationResponse[]>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể tải danh sách lời mời của nhóm.');
    }
    throw err;
  }
}

export async function fetchMyPendingInvitations(): Promise<MembershipInvitationResponse[]> {
  try {
    const res = await authenticatedFetch(`/api/invitations/my-pending`);
    return await safeParseResponse<MembershipInvitationResponse[]>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể tải danh sách lời mời nhận được.');
    }
    throw err;
  }
}

export async function fetchInvitationDetail(
  invitationId: string
): Promise<MembershipInvitationResponse> {
  try {
    const res = await authenticatedFetch(`/api/invitations/${invitationId}`);
    return await safeParseResponse<MembershipInvitationResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể tải chi tiết lời mời.');
    }
    throw err;
  }
}

export async function submitContributorConsent(
  invitationId: string,
  payload: ContributorConsentPayload
): Promise<MembershipInvitationResponse> {
  try {
    const res = await authenticatedFetch(`/api/invitations/${invitationId}/contributor-consent`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return await safeParseResponse<MembershipInvitationResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể gửi phản hồi đóng góp cổ phần.');
    }
    throw err;
  }
}

export async function respondToInvitation(
  invitationId: string,
  payload: InviteeRespondPayload
): Promise<MembershipInvitationResponse> {
  try {
    const res = await authenticatedFetch(`/api/invitations/${invitationId}/respond`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return await safeParseResponse<MembershipInvitationResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể phản hồi lời mời.');
    }
    throw err;
  }
}

export async function signInvitationContract(
  invitationId: string,
  payload?: DigitalSignPayload
): Promise<MembershipInvitationResponse> {
  try {
    const res = await authenticatedFetch(`/api/invitations/${invitationId}/sign`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
    return await safeParseResponse<MembershipInvitationResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể ký điện tử xác nhận hợp đồng.');
    }
    throw err;
  }
}

export async function finalizeInvitation(
  invitationId: string
): Promise<MembershipInvitationResponse> {
  try {
    const res = await authenticatedFetch(`/api/invitations/${invitationId}/finalize`, {
      method: 'POST',
    });
    return await safeParseResponse<MembershipInvitationResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể hoàn tất kết nạp thành viên.');
    }
    throw err;
  }
}

export async function cancelInvitation(
  invitationId: string
): Promise<MembershipInvitationResponse> {
  try {
    const res = await authenticatedFetch(`/api/invitations/${invitationId}/cancel`, {
      method: 'POST',
    });
    return await safeParseResponse<MembershipInvitationResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể hủy lời mời.');
    }
    throw err;
  }
}

export async function recoverPendingInvitations(): Promise<MembershipInvitationResponse[]> {
  try {
    const res = await authenticatedFetch(`/api/invitations/recover-pending`, {
      method: 'POST',
    });
    return await safeParseResponse<MembershipInvitationResponse[]>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể khôi phục thông báo lời mời đang chờ.');
    }
    throw err;
  }
}

export async function resendInvitationNotification(
  invitationId: string
): Promise<MembershipInvitationResponse> {
  try {
    const res = await authenticatedFetch(`/api/invitations/${invitationId}/resend-notification`, {
      method: 'POST',
    });
    return await safeParseResponse<MembershipInvitationResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể gửi lại thông báo lời mời.');
    }
    throw err;
  }
}
