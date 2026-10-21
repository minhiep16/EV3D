import { authenticatedFetch, safeParseResponse } from './api';
import {
  VoteProposalResponse,
  VoteResultResponse,
  ApprovedWorkResponse,
  CreateVoteProposalRequest,
  CastProposalVoteRequest,
  StartProposalWorkRequest,
  CompleteProposalWorkRequest,
  UpdateVotingPolicyRequest,
  VoteProposalStatus,
} from '../types/voting';

/**
 * Fetch vote proposals for a vehicle (with optional status filter).
 */
export async function fetchProposals(
  vehicleId: string,
  status?: VoteProposalStatus
): Promise<VoteProposalResponse[]> {
  try {
    let url = `/api/vote-proposals?vehicleId=${encodeURIComponent(vehicleId)}`;
    if (status) {
      url += `&status=${encodeURIComponent(status)}`;
    }
    const res = await authenticatedFetch(url);
    if (res.status === 204 || res.status === 404) {
      return [];
    }
    const data = await safeParseResponse<VoteProposalResponse[]>(res);
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    if (err?.message && (err.message.includes('404') || err.message.includes('204'))) {
      return [];
    }
    if (err instanceof TypeError || (err instanceof Error && err.message?.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ biểu quyết.');
    }
    throw err;
  }
}

/**
 * Fetch single vote proposal by ID.
 */
export async function fetchProposalById(proposalId: string): Promise<VoteProposalResponse> {
  const res = await authenticatedFetch(`/api/vote-proposals/${proposalId}`);
  return safeParseResponse<VoteProposalResponse>(res);
}

/**
 * Create a new vote proposal (CO_OWNER / ADMIN).
 */
export async function createVoteProposal(
  payload: CreateVoteProposalRequest
): Promise<VoteProposalResponse> {
  const res = await authenticatedFetch('/api/vote-proposals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return safeParseResponse<VoteProposalResponse>(res);
}

/**
 * Cast or update a vote on a proposal.
 */
export async function castVote(
  proposalId: string,
  payload: CastProposalVoteRequest
): Promise<VoteProposalResponse> {
  const res = await authenticatedFetch(`/api/vote-proposals/${proposalId}/votes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return safeParseResponse<VoteProposalResponse>(res);
}

/**
 * Manually evaluate and finalize proposal voting.
 */
export async function finalizeVoteProposal(proposalId: string): Promise<VoteProposalResponse> {
  const res = await authenticatedFetch(`/api/vote-proposals/${proposalId}/finalize`, {
    method: 'POST',
  });
  return safeParseResponse<VoteProposalResponse>(res);
}

/**
 * Fetch detailed auditable vote results for a proposal.
 */
export async function fetchVoteResults(proposalId: string): Promise<VoteResultResponse> {
  const res = await authenticatedFetch(`/api/vote-proposals/${proposalId}/results`);
  return safeParseResponse<VoteResultResponse>(res);
}

/**
 * Configure group voting policy.
 */
export async function updateGroupVotingPolicy(
  groupId: string,
  payload: UpdateVotingPolicyRequest
): Promise<void> {
  await authenticatedFetch(`/api/co-ownership-groups/${groupId}/voting-policy`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/**
 * Section XIX: Fetch approved work proposals for STAFF.
 */
export async function fetchStaffApprovedWork(vehicleId?: string): Promise<ApprovedWorkResponse[]> {
  try {
    let url = '/api/staff/approved-work';
    if (vehicleId) {
      url += `?vehicleId=${encodeURIComponent(vehicleId)}`;
    }
    const res = await authenticatedFetch(url);
    if (res.status === 204 || res.status === 404) {
      return [];
    }
    const data = await safeParseResponse<ApprovedWorkResponse[]>(res);
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    if (err?.message && (err.message.includes('404') || err.message.includes('204'))) {
      return [];
    }
    throw err;
  }
}

/**
 * Section XIX: STAFF begins authorized work.
 */
export async function startApprovedWork(
  proposalId: string,
  payload?: StartProposalWorkRequest
): Promise<ApprovedWorkResponse> {
  const res = await authenticatedFetch(`/api/staff/approved-work/${proposalId}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  return safeParseResponse<ApprovedWorkResponse>(res);
}

/**
 * Section XIX, XX, XXI: STAFF completes authorized work and records actual expense.
 */
export async function completeApprovedWork(
  proposalId: string,
  payload: CompleteProposalWorkRequest
): Promise<ApprovedWorkResponse> {
  const res = await authenticatedFetch(`/api/staff/approved-work/${proposalId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return safeParseResponse<ApprovedWorkResponse>(res);
}
