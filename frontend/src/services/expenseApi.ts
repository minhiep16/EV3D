import { authenticatedFetch, safeParseResponse } from './api';
import {
  ExpenseResponse,
  ExpenseSummaryResponse,
  CreateExpensePayload,
  ExpenseFilterParams,
  ExpenseShareResponse,
  CostSharingSummaryResponse,
  ExpenseApprovalRequest,
  ExpenseApprovalStatusResponse,
} from '../types/expense';

export async function fetchExpenses(params: ExpenseFilterParams): Promise<ExpenseResponse[]> {
  try {
    const searchParams = new URLSearchParams();
    searchParams.set('vehicleId', params.vehicleId);
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    if (params.category) searchParams.set('category', params.category);

    const res = await authenticatedFetch(`/api/expenses?${searchParams.toString()}`);
    return await safeParseResponse<ExpenseResponse[]>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ danh sách chi phí.');
    }
    throw err;
  }
}

export async function fetchExpenseSummary(
  vehicleId: string,
  month?: string
): Promise<ExpenseSummaryResponse> {
  try {
    const searchParams = new URLSearchParams();
    searchParams.set('vehicleId', vehicleId);
    if (month) searchParams.set('month', month);

    const res = await authenticatedFetch(`/api/expenses/summary?${searchParams.toString()}`);
    return await safeParseResponse<ExpenseSummaryResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ tổng hợp chi phí.');
    }
    throw err;
  }
}

export async function fetchExpenseById(id: string): Promise<ExpenseResponse> {
  try {
    const res = await authenticatedFetch(`/api/expenses/${id}`);
    return await safeParseResponse<ExpenseResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến chi tiết chi phí.');
    }
    throw err;
  }
}

export async function createExpense(payload: CreateExpensePayload): Promise<ExpenseResponse> {
  try {
    const res = await authenticatedFetch('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return await safeParseResponse<ExpenseResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể ghi nhận chi phí. Vui lòng kiểm tra kết nối mạng.');
    }
    throw err;
  }
}

export async function fetchExpenseShares(expenseId: string): Promise<ExpenseShareResponse[]> {
  try {
    const res = await authenticatedFetch(`/api/expenses/${expenseId}/shares`);
    return await safeParseResponse<ExpenseShareResponse[]>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ danh sách phân bổ chi phí.');
    }
    throw err;
  }
}

export async function fetchCostSharingSummary(
  vehicleId: string,
  month?: string
): Promise<CostSharingSummaryResponse> {
  try {
    const searchParams = new URLSearchParams();
    searchParams.set('vehicleId', vehicleId);
    if (month) searchParams.set('month', month);

    const res = await authenticatedFetch(`/api/expenses/shares/summary?${searchParams.toString()}`);
    return await safeParseResponse<CostSharingSummaryResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối đến máy chủ tổng hợp phân bổ chi phí.');
    }
    throw err;
  }
}

export async function submitExpenseApproval(
  expenseId: string,
  payload: ExpenseApprovalRequest
): Promise<ExpenseApprovalStatusResponse> {
  try {
    const res = await authenticatedFetch(`/api/expenses/${expenseId}/approvals`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return await safeParseResponse<ExpenseApprovalStatusResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể gửi xác nhận chi phí. Vui lòng thử lại.');
    }
    throw err;
  }
}

export async function fetchExpenseApprovals(
  expenseId: string
): Promise<ExpenseApprovalStatusResponse> {
  try {
    const res = await authenticatedFetch(`/api/expenses/${expenseId}/approvals`);
    return await safeParseResponse<ExpenseApprovalStatusResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể tải tiến trình xác minh của khoản chi.');
    }
    throw err;
  }
}

export async function cancelExpense(expenseId: string): Promise<ExpenseResponse> {
  try {
    const res = await authenticatedFetch(`/api/expenses/${expenseId}/cancel`, {
      method: 'POST',
    });
    return await safeParseResponse<ExpenseResponse>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể hủy khoản chi. Vui lòng kiểm tra quyền hạn.');
    }
    throw err;
  }
}

