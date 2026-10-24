import { authenticatedFetch, safeParseResponse } from './api';
import {
  OwnershipTransferResponse,
  OwnershipDistributionPreviewResponse,
  OwnershipHistoryResponse,
  MembershipWithdrawalResponse,
  CreateTransferPayload,
  AcceptTransferPayload,
  RejectTransferPayload,
  CreateWithdrawalPayload,
  ReviewWithdrawalPayload,
} from '../types/ownershipTransfer';

export async function fetchGroupTransfers(groupId: string): Promise<OwnershipTransferResponse[]> {
  try {
    const res = await authenticatedFetch(`/api/groups/${groupId}/transfers`);
    return await safeParseResponse<OwnershipTransferResponse[]>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ danh sách chuyển nhượng.');
    }
    throw err;
  }
}

export async function fetchIncomingTransfers(): Promise<OwnershipTransferResponse[]> {
  try {
    const res = await authenticatedFetch('/api/ownership-transfers/incoming');
    return await safeParseResponse<OwnershipTransferResponse[]>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể tải danh sách yêu cầu nhận chuyển nhượng.');
    }
    throw err;
  }
}

export async function fetchTransferById(transferId: string): Promise<OwnershipTransferResponse> {
  try {
    const res = await authenticatedFetch(`/api/ownership-transfers/${transferId}`);
    return await safeParseResponse<OwnershipTransferResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể tải thông tin chi tiết phụ lục chuyển nhượng.');
    }
    throw err;
  }
}

export async function fetchTransferPreview(
  groupId: string,
  vehicleId: string,
  fromUserId: string,
  toUserId: string,
  transferPercentage: number
): Promise<OwnershipDistributionPreviewResponse> {
  try {
    const url = `/api/groups/${groupId}/transfers/preview?vehicleId=${vehicleId}&fromUserId=${fromUserId}&toUserId=${toUserId}&transferPercentage=${transferPercentage}`;
    const res = await authenticatedFetch(url);
    return await safeParseResponse<OwnershipDistributionPreviewResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể tính toán dự kiến phân bổ cổ phần.');
    }
    throw err;
  }
}

export async function createTransferRequest(
  groupId: string,
  payload: CreateTransferPayload
): Promise<OwnershipTransferResponse> {
  try {
    const res = await authenticatedFetch(`/api/groups/${groupId}/transfers`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return await safeParseResponse<OwnershipTransferResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể gửi yêu cầu chuyển nhượng sở hữu.');
    }
    throw err;
  }
}

export async function acceptTransfer(
  transferId: string,
  payload?: AcceptTransferPayload
): Promise<OwnershipTransferResponse> {
  try {
    const res = await authenticatedFetch(`/api/ownership-transfers/${transferId}/accept`, {
      method: 'POST',
      body: payload ? JSON.stringify(payload) : undefined,
    });
    return await safeParseResponse<OwnershipTransferResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể chấp nhận yêu cầu chuyển nhượng.');
    }
    throw err;
  }
}

export async function confirmTransferorConsent(
  transferId: string,
  payload?: AcceptTransferPayload
): Promise<OwnershipTransferResponse> {
  try {
    const res = await authenticatedFetch(`/api/ownership-transfers/${transferId}/transferor-consent`, {
      method: 'POST',
      body: payload ? JSON.stringify(payload) : undefined,
    });
    return await safeParseResponse<OwnershipTransferResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể ký xác nhận phụ lục chuyển nhượng.');
    }
    throw err;
  }
}

export async function rejectTransfer(
  transferId: string,
  payload: RejectTransferPayload
): Promise<OwnershipTransferResponse> {
  try {
    const res = await authenticatedFetch(`/api/ownership-transfers/${transferId}/reject`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return await safeParseResponse<OwnershipTransferResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể từ chối yêu cầu chuyển nhượng.');
    }
    throw err;
  }
}

export async function cancelTransfer(transferId: string): Promise<OwnershipTransferResponse> {
  try {
    const res = await authenticatedFetch(`/api/ownership-transfers/${transferId}/cancel`, {
      method: 'POST',
    });
    return await safeParseResponse<OwnershipTransferResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể hủy yêu cầu chuyển nhượng.');
    }
    throw err;
  }
}

export async function completeTransfer(transferId: string): Promise<OwnershipTransferResponse> {
  try {
    const res = await authenticatedFetch(`/api/ownership-transfers/${transferId}/complete`, {
      method: 'POST',
    });
    return await safeParseResponse<OwnershipTransferResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kích hoạt hoàn tất chuyển nhượng.');
    }
    throw err;
  }
}

export async function fetchOwnershipHistory(groupId: string): Promise<OwnershipHistoryResponse[]> {
  try {
    const res = await authenticatedFetch(`/api/groups/${groupId}/ownership-history`);
    return await safeParseResponse<OwnershipHistoryResponse[]>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể tải lịch sử thay đổi quyền sở hữu.');
    }
    throw err;
  }
}

export async function createWithdrawalRequest(
  groupId: string,
  payload: CreateWithdrawalPayload
): Promise<MembershipWithdrawalResponse> {
  try {
    const res = await authenticatedFetch(`/api/groups/${groupId}/withdrawal-requests`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return await safeParseResponse<MembershipWithdrawalResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể gửi yêu cầu rút khỏi nhóm.');
    }
    throw err;
  }
}

export async function fetchGroupWithdrawals(groupId: string): Promise<MembershipWithdrawalResponse[]> {
  try {
    const res = await authenticatedFetch(`/api/groups/${groupId}/withdrawal-requests`);
    return await safeParseResponse<MembershipWithdrawalResponse[]>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể tải danh sách yêu cầu rút khỏi nhóm.');
    }
    throw err;
  }
}

export async function reviewWithdrawal(
  requestId: string,
  payload: ReviewWithdrawalPayload
): Promise<MembershipWithdrawalResponse> {
  try {
    const res = await authenticatedFetch(`/api/withdrawal-requests/${requestId}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return await safeParseResponse<MembershipWithdrawalResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể xử lý yêu cầu rút khỏi nhóm.');
    }
    throw err;
  }
}
