import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchFundSummary,
  fetchFundContributions,
  fetchFundTransactions,
  submitContribution,
  verifyContribution,
  disburseCommonExpense,
  submitPersonalPayment,
  verifyPersonalPayment,
  fetchPersonalPayments,
  fetchMyPersonalPayments,
  fetchPendingPersonalPayments,
} from '../services/fundApi';
import {
  SharedFundSummaryResponse,
  FundContributionResponse,
  FundContributionRequest,
  FundContributionVerifyRequest,
  FundTransactionResponse,
  CommonDisbursementRequest,
  PersonalPaymentSubmitRequest,
  PersonalPaymentVerifyRequest,
  PersonalExpensePaymentResponse,
} from '../types/fund';

export function useFundSummary(vehicleId: string | null | undefined) {
  return useQuery<SharedFundSummaryResponse>({
    queryKey: ['fund-summary', vehicleId],
    queryFn: () => {
      if (!vehicleId) return Promise.reject(new Error('Chưa chọn phương tiện'));
      return fetchFundSummary(vehicleId);
    },
    enabled: !!vehicleId,
    staleTime: 5000,
  });
}

export function useFundContributions(fundId: string | null | undefined) {
  return useQuery<FundContributionResponse[]>({
    queryKey: ['fund-contributions', fundId],
    queryFn: () => {
      if (!fundId) return Promise.resolve([]);
      return fetchFundContributions(fundId);
    },
    enabled: !!fundId,
    staleTime: 5000,
  });
}

export function useFundTransactions(fundId: string | null | undefined) {
  return useQuery<FundTransactionResponse[]>({
    queryKey: ['fund-transactions', fundId],
    queryFn: () => {
      if (!fundId) return Promise.resolve([]);
      return fetchFundTransactions(fundId);
    },
    enabled: !!fundId,
    staleTime: 5000,
  });
}

export function useSubmitContribution(fundId: string | null | undefined, vehicleId?: string) {
  const queryClient = useQueryClient();
  return useMutation<FundContributionResponse, Error, FundContributionRequest>({
    mutationFn: (payload: FundContributionRequest) => {
      const targetFundId = payload.overrideFundId || fundId;
      if (!targetFundId) throw new Error('Đang tải thông tin quỹ, vui lòng thử lại sau giây lát.');
      return submitContribution(targetFundId, payload);
    },
    onSuccess: (data) => {
      const targetFundId = data?.fundId || fundId;
      if (targetFundId) {
        queryClient.invalidateQueries({ queryKey: ['fund-contributions', targetFundId] });
      }
      if (vehicleId) {
        queryClient.invalidateQueries({ queryKey: ['fund-summary', vehicleId] });
      }
      queryClient.invalidateQueries({ queryKey: ['fund-summary'] });
    },
  });
}

export function useVerifyContribution(fundId: string | null | undefined, vehicleId?: string) {
  const queryClient = useQueryClient();
  return useMutation<
    FundContributionResponse,
    Error,
    { contributionId: string; payload: FundContributionVerifyRequest; fundId?: string }
  >({
    mutationFn: ({ contributionId, payload, fundId: reqFundId }) => {
      const targetFundId = reqFundId || fundId || undefined;
      return verifyContribution(contributionId, payload, targetFundId);
    },
    onSuccess: (data) => {
      const targetFundId = data?.fundId || fundId;
      if (targetFundId) {
        queryClient.invalidateQueries({ queryKey: ['fund-contributions', targetFundId] });
        queryClient.invalidateQueries({ queryKey: ['fund-transactions', targetFundId] });
        queryClient.invalidateQueries({ queryKey: ['shared-fund-contributions', targetFundId] });
        queryClient.invalidateQueries({ queryKey: ['shared-fund-transactions', targetFundId] });
      }
      if (vehicleId) {
        queryClient.invalidateQueries({ queryKey: ['fund-summary', vehicleId] });
        queryClient.invalidateQueries({ queryKey: ['shared-fund-summary', vehicleId] });
      }
      queryClient.invalidateQueries({ queryKey: ['shared-fund-summary'] });
      queryClient.invalidateQueries({ queryKey: ['shared-fund-contributions'] });
      queryClient.invalidateQueries({ queryKey: ['shared-fund-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['fund-summary'] });
      queryClient.invalidateQueries({ queryKey: ['fund-contributions'] });
      queryClient.invalidateQueries({ queryKey: ['fund-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['personal-payments'] });
      queryClient.invalidateQueries({ queryKey: ['expense-shares'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['cost-sharing-summary'] });
      queryClient.invalidateQueries({ queryKey: ['cost-sharing'] });
    },
  });
}

export function useDisburseCommonExpense(fundId: string | null | undefined, vehicleId?: string) {
  const queryClient = useQueryClient();
  return useMutation<FundTransactionResponse, Error, CommonDisbursementRequest>({
    mutationFn: (payload: CommonDisbursementRequest) => {
      if (!fundId) throw new Error('Mã quỹ không hợp lệ');
      return disburseCommonExpense(fundId, payload);
    },
    onSuccess: () => {
      if (fundId) {
        queryClient.invalidateQueries({ queryKey: ['fund-transactions', fundId] });
      }
      if (vehicleId) {
        queryClient.invalidateQueries({ queryKey: ['fund-summary', vehicleId] });
        queryClient.invalidateQueries({ queryKey: ['expenses', vehicleId] });
        queryClient.invalidateQueries({ queryKey: ['expense-summary', vehicleId] });
      }
      queryClient.invalidateQueries({ queryKey: ['fund-summary'] });
    },
  });
}

export function usePersonalPayments(expenseId: string | null | undefined) {
  return useQuery<PersonalExpensePaymentResponse[]>({
    queryKey: ['personal-payments', expenseId],
    queryFn: () => {
      if (!expenseId) return Promise.resolve([]);
      return fetchPersonalPayments(expenseId);
    },
    enabled: !!expenseId,
    staleTime: 5000,
  });
}

export function useSubmitPersonalPayment(expenseId: string | null | undefined, vehicleId?: string) {
  const queryClient = useQueryClient();
  return useMutation<PersonalExpensePaymentResponse, Error, PersonalPaymentSubmitRequest>({
    mutationFn: (payload: PersonalPaymentSubmitRequest) => {
      if (!expenseId) throw new Error('Mã chi phí không hợp lệ');
      return submitPersonalPayment(expenseId, payload);
    },
    onSuccess: () => {
      if (expenseId) {
        queryClient.invalidateQueries({ queryKey: ['personal-payments', expenseId] });
        queryClient.invalidateQueries({ queryKey: ['expense-shares', expenseId] });
      }
      if (vehicleId) {
        queryClient.invalidateQueries({ queryKey: ['expenses', vehicleId] });
        queryClient.invalidateQueries({ queryKey: ['cost-sharing', vehicleId] });
      }
    },
  });
}

export function useVerifyPersonalPayment(expenseId: string | null | undefined, vehicleId?: string) {
  const queryClient = useQueryClient();
  return useMutation<PersonalExpensePaymentResponse, Error, { paymentId: string; payload: PersonalPaymentVerifyRequest }>({
    mutationFn: ({ paymentId, payload }) => {
      return verifyPersonalPayment(paymentId, payload);
    },
    onSuccess: () => {
      if (expenseId) {
        queryClient.invalidateQueries({ queryKey: ['personal-payments', expenseId] });
        queryClient.invalidateQueries({ queryKey: ['expense-shares', expenseId] });
      }
      if (vehicleId) {
        queryClient.invalidateQueries({ queryKey: ['expenses', vehicleId] });
        queryClient.invalidateQueries({ queryKey: ['cost-sharing', vehicleId] });
      }
      queryClient.invalidateQueries({ queryKey: ['shared-fund-summary'] });
      queryClient.invalidateQueries({ queryKey: ['shared-fund-contributions'] });
      queryClient.invalidateQueries({ queryKey: ['shared-fund-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['personal-payments'] });
      queryClient.invalidateQueries({ queryKey: ['expense-shares'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['cost-sharing-summary'] });
      queryClient.invalidateQueries({ queryKey: ['fund-summary'] });
    },
  });
}

export function useMyPersonalPayments() {
  return useQuery<PersonalExpensePaymentResponse[]>({
    queryKey: ['my-personal-payments'],
    queryFn: fetchMyPersonalPayments,
    staleTime: 5000,
  });
}

export function usePendingPersonalPayments(vehicleId?: string | null) {
  return useQuery<PersonalExpensePaymentResponse[]>({
    queryKey: ['personal-payments', 'pending', vehicleId],
    queryFn: () => fetchPendingPersonalPayments(vehicleId || undefined),
    staleTime: 5000,
  });
}
