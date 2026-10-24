import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchContractByVehicle,
  fetchContractById,
  fetchContractVersions,
  fetchContractVersionDetail,
  createDraftContractVersion,
  submitVersionForAcceptance,
  acceptContractVersion,
  activateContractVersion,
} from '../services/contractApi';
import {
  ContractSummaryResponse,
  ContractVersionResponse,
  ContractAcceptanceResponse,
  CreateContractVersionRequest,
  ContractAcceptanceRequest,
} from '../types/contract';

export function useContractSummary(vehicleId: string | null | undefined) {
  return useQuery<ContractSummaryResponse>({
    queryKey: ['co-ownership-contract', vehicleId],
    queryFn: () => {
      if (!vehicleId) return Promise.reject(new Error('Chưa chọn phương tiện'));
      return fetchContractByVehicle(vehicleId);
    },
    enabled: !!vehicleId,
    staleTime: 6000,
  });
}

export function useContractById(contractId: string | null | undefined) {
  return useQuery<ContractSummaryResponse>({
    queryKey: ['co-ownership-contract-id', contractId],
    queryFn: () => {
      if (!contractId) return Promise.reject(new Error('Mã hợp đồng không hợp lệ'));
      return fetchContractById(contractId);
    },
    enabled: !!contractId,
    staleTime: 6000,
  });
}

export function useContractVersions(contractId: string | null | undefined) {
  return useQuery<ContractVersionResponse[]>({
    queryKey: ['co-ownership-contract-versions', contractId],
    queryFn: () => {
      if (!contractId) return Promise.resolve([]);
      return fetchContractVersions(contractId);
    },
    enabled: !!contractId,
    staleTime: 6000,
  });
}

export function useContractVersionDetail(
  contractId: string | null | undefined,
  versionId: string | null | undefined
) {
  return useQuery<ContractVersionResponse>({
    queryKey: ['co-ownership-contract-version', contractId, versionId],
    queryFn: () => {
      if (!contractId || !versionId) return Promise.reject(new Error('Thiếu tham số'));
      return fetchContractVersionDetail(contractId, versionId);
    },
    enabled: !!contractId && !!versionId,
    staleTime: 6000,
  });
}

export function useCreateDraftVersion(contractId: string | null | undefined, vehicleId?: string) {
  const queryClient = useQueryClient();
  return useMutation<ContractVersionResponse, Error, CreateContractVersionRequest>({
    mutationFn: (payload) => {
      if (!contractId) throw new Error('Không tìm thấy thông tin hợp đồng.');
      return createDraftContractVersion(contractId, payload);
    },
    onSuccess: () => {
      if (contractId) {
        queryClient.invalidateQueries({ queryKey: ['co-ownership-contract-versions', contractId] });
      }
      if (vehicleId) {
        queryClient.invalidateQueries({ queryKey: ['co-ownership-contract', vehicleId] });
      }
      queryClient.invalidateQueries({ queryKey: ['co-ownership-contract'] });
    },
  });
}

export function useSubmitVersionForAcceptance(contractId: string | null | undefined, vehicleId?: string) {
  const queryClient = useQueryClient();
  return useMutation<ContractVersionResponse, Error, string>({
    mutationFn: (versionId) => {
      if (!contractId) throw new Error('Không tìm thấy thông tin hợp đồng.');
      return submitVersionForAcceptance(contractId, versionId);
    },
    onSuccess: () => {
      if (contractId) {
        queryClient.invalidateQueries({ queryKey: ['co-ownership-contract-versions', contractId] });
      }
      if (vehicleId) {
        queryClient.invalidateQueries({ queryKey: ['co-ownership-contract', vehicleId] });
      }
      queryClient.invalidateQueries({ queryKey: ['co-ownership-contract'] });
    },
  });
}

export function useAcceptContractVersion(contractId?: string, vehicleId?: string) {
  const queryClient = useQueryClient();
  return useMutation<
    ContractAcceptanceResponse,
    Error,
    { versionId: string; payload?: ContractAcceptanceRequest }
  >({
    mutationFn: ({ versionId, payload }) => acceptContractVersion(versionId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['co-ownership-contract-version', contractId, variables.versionId],
      });
      if (contractId) {
        queryClient.invalidateQueries({ queryKey: ['co-ownership-contract-versions', contractId] });
      }
      if (vehicleId) {
        queryClient.invalidateQueries({ queryKey: ['co-ownership-contract', vehicleId] });
      }
      queryClient.invalidateQueries({ queryKey: ['co-ownership-contract'] });
    },
  });
}

export function useActivateContractVersion(contractId: string | null | undefined, vehicleId?: string) {
  const queryClient = useQueryClient();
  return useMutation<ContractSummaryResponse, Error, string>({
    mutationFn: (versionId) => {
      if (!contractId) throw new Error('Không tìm thấy thông tin hợp đồng.');
      return activateContractVersion(contractId, versionId);
    },
    onSuccess: () => {
      if (contractId) {
        queryClient.invalidateQueries({ queryKey: ['co-ownership-contract-versions', contractId] });
      }
      if (vehicleId) {
        queryClient.invalidateQueries({ queryKey: ['co-ownership-contract', vehicleId] });
      }
      queryClient.invalidateQueries({ queryKey: ['co-ownership-contract'] });
      queryClient.invalidateQueries({ queryKey: ['vote-proposals'] });
    },
  });
}
