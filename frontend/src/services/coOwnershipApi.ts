import { authenticatedFetch, safeParseResponse } from './api';
import {
  CoOwnershipGroupResponse,
  GroupMemberResponse,
  GroupVehicleResponse,
  OwnershipShareResponse,
} from '../types/coOwnership';

export async function fetchVehicleCoOwnership(vehicleId: string): Promise<CoOwnershipGroupResponse> {
  try {
    const res = await authenticatedFetch(`/api/vehicles/${vehicleId}/co-ownership`);
    return await safeParseResponse<CoOwnershipGroupResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ dữ liệu đồng sở hữu.');
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
