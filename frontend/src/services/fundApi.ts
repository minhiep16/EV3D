import { authenticatedFetch, safeParseResponse } from './api';
import {
  SharedFundSummaryResponse,
  FundContributionRequest,
  FundContributionResponse,
  FundContributionVerifyRequest,
  FundTransactionResponse,
  CommonDisbursementRequest,
  PersonalPaymentSubmitRequest,
  PersonalPaymentVerifyRequest,
  PersonalExpensePaymentResponse,
} from '../types/fund';

export async function fetchFundSummary(vehicleId: string): Promise<SharedFundSummaryResponse> {
  const mapFundSummaryError = (err: any): Error => {
    const status = err?.status ?? 0;
    const msg = String(err?.message || '');

    if (status === 404 || msg.includes('No static resource') || msg.includes('404')) {
      if (
        msg.includes('nhóm') ||
        msg.includes('quỹ') ||
        msg.includes('chưa được gán') ||
        msg.includes('không tồn tại') ||
        msg.includes('Chưa tìm thấy')
      ) {
        return new Error('Chưa tìm thấy quỹ chung của nhóm.');
      }
      return new Error('Không tìm thấy API Quỹ chung. Vui lòng kiểm tra kết nối backend.');
    }
    if (err instanceof TypeError || msg.includes('fetch') || status === 0) {
      return new Error('Không thể kết nối đến máy chủ Quỹ chung.');
    }
    return err instanceof Error ? err : new Error('Không thể tải thông tin Quỹ chung của nhóm.');
  };

  try {
    const res = await authenticatedFetch(`/api/funds/vehicle/${encodeURIComponent(vehicleId)}`);
    return await safeParseResponse<SharedFundSummaryResponse>(res);
  } catch (err) {
    try {
      const fallbackRes = await authenticatedFetch(`/api/funds/summary?vehicleId=${encodeURIComponent(vehicleId)}`);
      return await safeParseResponse<SharedFundSummaryResponse>(fallbackRes);
    } catch (fallbackErr) {
      throw mapFundSummaryError(fallbackErr || err);
    }
  }
}

export async function submitContribution(
  fundId: string,
  payload: FundContributionRequest
): Promise<FundContributionResponse> {
  const res = await authenticatedFetch(`/api/funds/${fundId}/contributions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return await safeParseResponse<FundContributionResponse>(res);
}

export async function verifyContribution(
  contributionId: string,
  payload: FundContributionVerifyRequest,
  fundId?: string
): Promise<FundContributionResponse> {
  const url = fundId
    ? `/api/funds/${fundId}/contributions/${contributionId}/verify`
    : `/api/funds/contributions/${contributionId}/verify`;
  const res = await authenticatedFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return await safeParseResponse<FundContributionResponse>(res);
}

export async function disburseCommonExpense(
  fundId: string,
  payload: CommonDisbursementRequest
): Promise<FundTransactionResponse> {
  const res = await authenticatedFetch(`/api/funds/${fundId}/disburse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return await safeParseResponse<FundTransactionResponse>(res);
}

export async function fetchFundContributions(fundId: string): Promise<FundContributionResponse[]> {
  try {
    const res = await authenticatedFetch(`/api/funds/${fundId}/contributions`);
    return await safeParseResponse<FundContributionResponse[]>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối danh sách đóng góp.');
    }
    throw err;
  }
}

export async function fetchFundTransactions(fundId: string): Promise<FundTransactionResponse[]> {
  try {
    const res = await authenticatedFetch(`/api/funds/${fundId}/transactions`);
    return await safeParseResponse<FundTransactionResponse[]>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối lịch sử giao dịch quỹ.');
    }
    throw err;
  }
}

export async function submitPersonalPayment(
  expenseId: string,
  payload: PersonalPaymentSubmitRequest
): Promise<PersonalExpensePaymentResponse> {
  const res = await authenticatedFetch(`/api/expenses/${expenseId}/personal-payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return await safeParseResponse<PersonalExpensePaymentResponse>(res);
}

export async function verifyPersonalPayment(
  paymentId: string,
  payload: PersonalPaymentVerifyRequest
): Promise<PersonalExpensePaymentResponse> {
  const res = await authenticatedFetch(`/api/expenses/personal-payments/${paymentId}/verify`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return await safeParseResponse<PersonalExpensePaymentResponse>(res);
}

export async function fetchPersonalPayments(expenseId: string): Promise<PersonalExpensePaymentResponse[]> {
  try {
    const res = await authenticatedFetch(`/api/expenses/${expenseId}/personal-payments`);
    return await safeParseResponse<PersonalExpensePaymentResponse[]>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối danh sách thanh toán cá nhân.');
    }
    throw err;
  }
}

export async function fetchMyPersonalPayments(): Promise<PersonalExpensePaymentResponse[]> {
  try {
    const res = await authenticatedFetch(`/api/expenses/my-personal-payments`);
    return await safeParseResponse<PersonalExpensePaymentResponse[]>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối thanh toán của tôi.');
    }
    throw err;
  }
}

export async function fetchPendingPersonalPayments(vehicleId?: string): Promise<PersonalExpensePaymentResponse[]> {
  try {
    const query = vehicleId ? `?vehicleId=${encodeURIComponent(vehicleId)}` : '';
    const res = await authenticatedFetch(`/api/expenses/personal-payments/pending${query}`);
    return await safeParseResponse<PersonalExpensePaymentResponse[]>(res);
  } catch (err) {
    if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
      throw new Error('Không thể kết nối danh sách thanh toán cá nhân chờ duyệt.');
    }
    throw err;
  }
}
