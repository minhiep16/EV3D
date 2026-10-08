import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchExpenses,
  fetchExpenseSummary,
  fetchExpenseById,
  createExpense,
  fetchExpenseShares,
  fetchCostSharingSummary,
  submitExpenseApproval,
  fetchExpenseApprovals,
  cancelExpense,
} from '../services/expenseApi';
import {
  ExpenseResponse,
  ExpenseSummaryResponse,
  CreateExpensePayload,
  ExpenseCategory,
  ExpenseShareResponse,
  CostSharingSummaryResponse,
  ExpenseApprovalRequest,
  ExpenseApprovalStatusResponse,
} from '../types/expense';
import { useAuthStore } from '../store/authStore';

export function useExpenses(
  vehicleId: string | null | undefined,
  options?: {
    from?: string;
    to?: string;
    category?: ExpenseCategory;
  }
) {
  return useQuery<ExpenseResponse[]>({
    queryKey: ['expenses', vehicleId, options?.from, options?.to, options?.category],
    queryFn: () => {
      if (!vehicleId) return Promise.resolve([]);
      return fetchExpenses({
        vehicleId,
        from: options?.from,
        to: options?.to,
        category: options?.category,
      });
    },
    enabled: !!vehicleId,
    staleTime: 5000,
  });
}

export function useExpenseSummary(
  vehicleId: string | null | undefined,
  month?: string
) {
  return useQuery<ExpenseSummaryResponse>({
    queryKey: ['expense-summary', vehicleId, month],
    queryFn: () => {
      if (!vehicleId) {
        return Promise.resolve({
          month: month || '',
          totalExpense: 0,
          transactionCount: 0,
          categoryBreakdown: {},
        });
      }
      return fetchExpenseSummary(vehicleId, month);
    },
    enabled: !!vehicleId,
    staleTime: 5000,
  });
}

export function useExpenseById(expenseId: string | null | undefined) {
  return useQuery<ExpenseResponse>({
    queryKey: ['expense-detail', expenseId],
    queryFn: () => {
      if (!expenseId) throw new Error('Missing expense ID');
      return fetchExpenseById(expenseId);
    },
    enabled: !!expenseId,
  });
}

export function useExpenseShares(
  expenseId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery<ExpenseShareResponse[]>({
    queryKey: ['expense-shares', expenseId],
    queryFn: () => {
      if (!expenseId) return Promise.resolve([]);
      return fetchExpenseShares(expenseId);
    },
    enabled: Boolean(expenseId && (options?.enabled ?? true)),
    staleTime: 5000,
  });
}

export function useCostSharingSummary(
  vehicleId: string | null | undefined,
  month?: string,
  options?: { enabled?: boolean }
) {
  const user = useAuthStore((state) => state.user);
  return useQuery<CostSharingSummaryResponse>({
    queryKey: ['cost-sharing-summary', vehicleId, month, user?.id],
    queryFn: () => {
      if (!vehicleId) throw new Error('vehicleId is required');
      return fetchCostSharingSummary(vehicleId, month);
    },
    enabled: Boolean(vehicleId && (options?.enabled ?? true)),
    staleTime: 5000,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateExpensePayload) => createExpense(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
      queryClient.invalidateQueries({ queryKey: ['expense-shares'] });
      queryClient.invalidateQueries({ queryKey: ['cost-sharing-summary'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}

export function useExpenseApprovals(expenseId: string | null | undefined) {
  return useQuery<ExpenseApprovalStatusResponse>({
    queryKey: ['expense-approvals', expenseId],
    queryFn: () => {
      if (!expenseId) throw new Error('Missing expense ID');
      return fetchExpenseApprovals(expenseId);
    },
    enabled: !!expenseId,
    staleTime: 5000,
  });
}

export function useSubmitExpenseApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      expenseId,
      payload,
    }: {
      expenseId: string;
      payload: ExpenseApprovalRequest;
    }) => submitExpenseApproval(expenseId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expense-approvals', variables.expenseId] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
      queryClient.invalidateQueries({ queryKey: ['expense-shares'] });
      queryClient.invalidateQueries({ queryKey: ['cost-sharing-summary'] });
    },
  });
}

export function useCancelExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseId: string) => cancelExpense(expenseId),
    onSuccess: (_, expenseId) => {
      queryClient.invalidateQueries({ queryKey: ['expense-approvals', expenseId] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
      queryClient.invalidateQueries({ queryKey: ['expense-shares'] });
      queryClient.invalidateQueries({ queryKey: ['cost-sharing-summary'] });
    },
  });
}

