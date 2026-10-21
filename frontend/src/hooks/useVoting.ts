import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProposals,
  fetchProposalById,
  createVoteProposal,
  castVote,
  finalizeVoteProposal,
  fetchVoteResults,
  fetchStaffApprovedWork,
  startApprovedWork,
  completeApprovedWork,
  updateGroupVotingPolicy,
} from '../services/votingApi';
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

export function useVoteProposals(vehicleId?: string | null, status?: VoteProposalStatus) {
  return useQuery<VoteProposalResponse[]>({
    queryKey: ['vote-proposals', vehicleId, status],
    queryFn: () => {
      if (!vehicleId) return Promise.resolve([]);
      return fetchProposals(vehicleId, status);
    },
    enabled: !!vehicleId,
    refetchInterval: 6000,
    staleTime: 3000,
  });
}

export function useVoteProposalDetail(proposalId?: string | null) {
  return useQuery<VoteProposalResponse>({
    queryKey: ['vote-proposal', proposalId],
    queryFn: () => {
      if (!proposalId) return Promise.reject(new Error('ID đề xuất không tồn tại'));
      return fetchProposalById(proposalId);
    },
    enabled: !!proposalId,
    refetchInterval: 4000,
    staleTime: 2000,
  });
}

export function useVoteResults(proposalId?: string | null) {
  return useQuery<VoteResultResponse>({
    queryKey: ['vote-results', proposalId],
    queryFn: () => {
      if (!proposalId) return Promise.reject(new Error('ID đề xuất không tồn tại'));
      return fetchVoteResults(proposalId);
    },
    enabled: !!proposalId,
    staleTime: 4000,
  });
}

export function useCreateVoteProposal() {
  const queryClient = useQueryClient();
  return useMutation<VoteProposalResponse, Error, CreateVoteProposalRequest>({
    mutationFn: (payload) => createVoteProposal(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vote-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['vehicleMaintenance'] });
      queryClient.invalidateQueries({ queryKey: ['staffApprovedWork'] });
      queryClient.invalidateQueries({ queryKey: ['vote-proposal', data.id] });
    },
  });
}

export function useCastVote() {
  const queryClient = useQueryClient();
  return useMutation<
    VoteProposalResponse,
    Error,
    { proposalId: string; payload: CastProposalVoteRequest }
  >({
    mutationFn: ({ proposalId, payload }) => castVote(proposalId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vote-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['vote-proposal', data.id] });
      queryClient.invalidateQueries({ queryKey: ['vote-results', data.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicleMaintenance'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceApproval'] });
      queryClient.invalidateQueries({ queryKey: ['staffApprovedWork'] });
    },
  });
}

export function useFinalizeVoteProposal() {
  const queryClient = useQueryClient();
  return useMutation<VoteProposalResponse, Error, string>({
    mutationFn: (proposalId) => finalizeVoteProposal(proposalId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vote-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['vote-proposal', data.id] });
      queryClient.invalidateQueries({ queryKey: ['vote-results', data.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicleMaintenance'] });
      queryClient.invalidateQueries({ queryKey: ['staffApprovedWork'] });
    },
  });
}

export function useStaffApprovedWork(vehicleId?: string | null) {
  return useQuery<ApprovedWorkResponse[]>({
    queryKey: ['staffApprovedWork', vehicleId],
    queryFn: () => fetchStaffApprovedWork(vehicleId || undefined),
    refetchInterval: 6000,
    staleTime: 3000,
  });
}

export function useStartApprovedWork() {
  const queryClient = useQueryClient();
  return useMutation<
    ApprovedWorkResponse,
    Error,
    { proposalId: string; payload?: StartProposalWorkRequest }
  >({
    mutationFn: ({ proposalId, payload }) => startApprovedWork(proposalId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffApprovedWork'] });
      queryClient.invalidateQueries({ queryKey: ['vote-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['vehicleMaintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}

export function useCompleteApprovedWork() {
  const queryClient = useQueryClient();
  return useMutation<
    ApprovedWorkResponse,
    Error,
    { proposalId: string; payload: CompleteProposalWorkRequest }
  >({
    mutationFn: ({ proposalId, payload }) => completeApprovedWork(proposalId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffApprovedWork'] });
      queryClient.invalidateQueries({ queryKey: ['vote-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenseSummary'] });
      queryClient.invalidateQueries({ queryKey: ['cost-sharing'] });
      queryClient.invalidateQueries({ queryKey: ['fund-summary'] });
      queryClient.invalidateQueries({ queryKey: ['vehicleMaintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}

export function useUpdateVotingPolicy() {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    Error,
    { groupId: string; payload: UpdateVotingPolicyRequest }
  >({
    mutationFn: ({ groupId, payload }) => updateGroupVotingPolicy(groupId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vote-proposals'] });
    },
  });
}
