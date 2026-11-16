import { authenticatedFetch, safeParseResponse } from './api';
import {
  DisputeResponse,
  DisputeSummaryResponse,
  DisputeEvidenceDto,
  DisputeMessageDto,
  DisputeCompensationDto,
  DisputeActionLogDto,
  InvestigationDetailsDto,
  RecordInvestigationRequest,
  RecordCompensationPaymentRequest,
  SubmitCompensationEvidenceRequest,
  CreateDisputeRequest,
  CreateDisputeMessageRequest,
  ProposeResolutionRequest,
  RespondToResolutionRequest,
  ExecuteCorrectiveActionRequest,
  AddEvidenceRequest,
  DisputeCategory,
  DisputeStatus,
  BookingConflictIncident,
  PrefilledDisputeData,
} from '../types/dispute';

export async function createDispute(request: CreateDisputeRequest): Promise<DisputeResponse> {
  const res = await authenticatedFetch('/api/disputes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return safeParseResponse<DisputeResponse>(res);
}

export async function fetchDisputeById(disputeId: string): Promise<DisputeResponse> {
  const res = await authenticatedFetch(`/api/disputes/${encodeURIComponent(disputeId)}`);
  return safeParseResponse<DisputeResponse>(res);
}

export async function fetchDisputesForVehicle(vehicleId: string): Promise<DisputeResponse[]> {
  try {
    const res = await authenticatedFetch(`/api/disputes/vehicle/${encodeURIComponent(vehicleId)}`);
    if (res.status === 204 || res.status === 404) return [];
    const data = await safeParseResponse<DisputeResponse[]>(res);
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    if (err?.message && (err.message.includes('404') || err.message.includes('204'))) {
      return [];
    }
    throw err;
  }
}

export async function fetchMyDisputes(): Promise<DisputeResponse[]> {
  try {
    const res = await authenticatedFetch('/api/disputes/my-disputes');
    if (res.status === 204 || res.status === 404) return [];
    const data = await safeParseResponse<DisputeResponse[]>(res);
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    if (err?.message && (err.message.includes('404') || err.message.includes('204'))) {
      return [];
    }
    throw err;
  }
}

export async function fetchStaffDisputeDashboard(params?: {
  vehicleId?: string;
  category?: DisputeCategory;
  status?: DisputeStatus;
}): Promise<DisputeResponse[]> {
  const query = new URLSearchParams();
  if (params?.vehicleId) query.append('vehicleId', params.vehicleId);
  if (params?.category) query.append('category', params.category);
  if (params?.status) query.append('status', params.status);

  const qStr = query.toString();
  const url = `/api/disputes/staff/dashboard${qStr ? `?${qStr}` : ''}`;
  const res = await authenticatedFetch(url);
  if (res.status === 204 || res.status === 404) return [];
  const data = await safeParseResponse<DisputeResponse[]>(res);
  return Array.isArray(data) ? data : [];
}

export async function fetchDisputeSummary(vehicleId?: string): Promise<DisputeSummaryResponse> {
  const url = vehicleId
    ? `/api/disputes/staff/summary?vehicleId=${encodeURIComponent(vehicleId)}`
    : '/api/disputes/staff/summary';
  const res = await authenticatedFetch(url);
  return safeParseResponse<DisputeSummaryResponse>(res);
}

export async function assignStaffMediator(disputeId: string, staffId?: string): Promise<DisputeResponse> {
  const url = staffId
    ? `/api/disputes/${encodeURIComponent(disputeId)}/assign-staff?staffId=${encodeURIComponent(staffId)}`
    : `/api/disputes/${encodeURIComponent(disputeId)}/assign-staff`;
  const res = await authenticatedFetch(url, { method: 'PATCH' });
  return safeParseResponse<DisputeResponse>(res);
}

export async function requestEvidence(disputeId: string, note?: string): Promise<DisputeResponse> {
  const res = await authenticatedFetch(`/api/disputes/${encodeURIComponent(disputeId)}/request-evidence`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note: note || '' }),
  });
  return safeParseResponse<DisputeResponse>(res);
}

export async function addEvidence(disputeId: string, request: AddEvidenceRequest): Promise<DisputeEvidenceDto> {
  const res = await authenticatedFetch(`/api/disputes/${encodeURIComponent(disputeId)}/evidence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return safeParseResponse<DisputeEvidenceDto>(res);
}

export async function addMessage(
  disputeId: string,
  request: CreateDisputeMessageRequest
): Promise<DisputeMessageDto> {
  const res = await authenticatedFetch(`/api/disputes/${encodeURIComponent(disputeId)}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return safeParseResponse<DisputeMessageDto>(res);
}

export async function proposeResolution(
  disputeId: string,
  request: ProposeResolutionRequest
): Promise<DisputeResponse> {
  const res = await authenticatedFetch(`/api/disputes/${encodeURIComponent(disputeId)}/propose-resolution`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return safeParseResponse<DisputeResponse>(res);
}

export async function respondToResolution(
  disputeId: string,
  request: RespondToResolutionRequest
): Promise<DisputeResponse> {
  const res = await authenticatedFetch(`/api/disputes/${encodeURIComponent(disputeId)}/respond-resolution`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return safeParseResponse<DisputeResponse>(res);
}

export async function linkVotingProposal(disputeId: string, proposalId: string): Promise<DisputeResponse> {
  const res = await authenticatedFetch(`/api/disputes/${encodeURIComponent(disputeId)}/link-voting`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ proposalId }),
  });
  return safeParseResponse<DisputeResponse>(res);
}

export async function executeCorrectiveAction(
  disputeId: string,
  request: ExecuteCorrectiveActionRequest
): Promise<DisputeResponse> {
  const res = await authenticatedFetch(`/api/disputes/${encodeURIComponent(disputeId)}/execute-corrective-action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return safeParseResponse<DisputeResponse>(res);
}

export async function closeDispute(disputeId: string, resolutionSummary?: string): Promise<DisputeResponse> {
  const res = await authenticatedFetch(`/api/disputes/${encodeURIComponent(disputeId)}/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resolutionSummary: resolutionSummary || '' }),
  });
  return safeParseResponse<DisputeResponse>(res);
}

export async function reopenDispute(disputeId: string, reason?: string): Promise<DisputeResponse> {
  const res = await authenticatedFetch(`/api/disputes/${encodeURIComponent(disputeId)}/reopen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: reason || '' }),
  });
  return safeParseResponse<DisputeResponse>(res);
}

// ==========================================
// PHASE 5.6 EVENT-DRIVEN INCIDENT API
// ==========================================

export async function fetchIncidentForBooking(bookingId: string): Promise<BookingConflictIncident | null> {
  try {
    const res = await authenticatedFetch(`/api/disputes/incidents/booking/${encodeURIComponent(bookingId)}`);
    if (res.status === 204 || res.status === 404) return null;
    return await safeParseResponse<BookingConflictIncident>(res);
  } catch (err: any) {
    if (err?.message && (err.message.includes('404') || err.message.includes('204'))) {
      return null;
    }
    console.warn('Lỗi kiểm tra sự cố lịch đặt xe:', err);
    return null;
  }
}

export async function fetchPrefilledDispute(bookingId: string): Promise<PrefilledDisputeData> {
  const res = await authenticatedFetch(`/api/disputes/prefill/booking/${encodeURIComponent(bookingId)}`);
  return safeParseResponse<PrefilledDisputeData>(res);
}

export async function fetchIncidentsForVehicle(vehicleId: string): Promise<BookingConflictIncident[]> {
  try {
    const res = await authenticatedFetch(`/api/disputes/incidents/vehicle/${encodeURIComponent(vehicleId)}`);
    if (res.status === 204 || res.status === 404) return [];
    const data = await safeParseResponse<BookingConflictIncident[]>(res);
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    if (err?.message && (err.message.includes('404') || err.message.includes('204'))) {
      return [];
    }
    return [];
  }
}

export async function fetchActiveIncidentsForStaff(): Promise<BookingConflictIncident[]> {
  try {
    const res = await authenticatedFetch('/api/disputes/incidents/staff/active');
    if (res.status === 204 || res.status === 404) return [];
    const data = await safeParseResponse<BookingConflictIncident[]>(res);
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    if (err?.message && (err.message.includes('404') || err.message.includes('204'))) {
      return [];
    }
    return [];
  }
}

// ==========================================
// PHASE 5.8 INVESTIGATION & COMPENSATION API
// ==========================================

export async function fetchInvestigationComparison(disputeId: string): Promise<InvestigationDetailsDto> {
  try {
    const res = await authenticatedFetch(`/api/disputes/${encodeURIComponent(disputeId)}/investigation-comparison`);
    return await safeParseResponse<InvestigationDetailsDto>(res);
  } catch (err: any) {
    const res = await authenticatedFetch(`/api/disputes/${encodeURIComponent(disputeId)}/investigation`);
    return await safeParseResponse<InvestigationDetailsDto>(res);
  }
}

export async function recordInvestigationFindings(
  disputeId: string,
  request: RecordInvestigationRequest
): Promise<DisputeResponse> {
  const res = await authenticatedFetch(`/api/disputes/${encodeURIComponent(disputeId)}/investigation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...request,
      conclusion: request.conclusion,
      investigationConclusion: request.conclusion,
      investigationNotes: request.investigationNotes || '',
    }),
  });
  return safeParseResponse<DisputeResponse>(res);
}

export async function recordCompensationPayment(
  disputeId: string,
  request: RecordCompensationPaymentRequest
): Promise<DisputeCompensationDto> {
  const res = await authenticatedFetch(`/api/disputes/${encodeURIComponent(disputeId)}/compensation-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return safeParseResponse<DisputeCompensationDto>(res);
}

export async function submitCompensationEvidence(
  disputeId: string,
  request: SubmitCompensationEvidenceRequest
): Promise<DisputeCompensationDto> {
  const res = await authenticatedFetch(`/api/disputes/${encodeURIComponent(disputeId)}/compensation-evidence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return safeParseResponse<DisputeCompensationDto>(res);
}

export async function initiateDemoPayment(
  disputeId: string,
  amount?: number,
  note?: string
): Promise<DisputeCompensationDto> {
  const res = await authenticatedFetch(`/api/disputes/${encodeURIComponent(disputeId)}/demo-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, note }),
  });
  return safeParseResponse<DisputeCompensationDto>(res);
}

export async function confirmRecipientDemoPayment(
  disputeId: string
): Promise<DisputeCompensationDto> {
  const res = await authenticatedFetch(`/api/disputes/${encodeURIComponent(disputeId)}/demo-payment/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return safeParseResponse<DisputeCompensationDto>(res);
}

export async function disputeRecipientDemoPayment(
  disputeId: string,
  note?: string
): Promise<DisputeCompensationDto> {
  const res = await authenticatedFetch(`/api/disputes/${encodeURIComponent(disputeId)}/demo-payment/dispute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmed: false, note }),
  });
  return safeParseResponse<DisputeCompensationDto>(res);
}

export async function approveCompensationEvidence(
  disputeId: string
): Promise<DisputeCompensationDto> {
  const res = await authenticatedFetch(`/api/disputes/${encodeURIComponent(disputeId)}/compensation-evidence/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return safeParseResponse<DisputeCompensationDto>(res);
}

export async function rejectCompensationEvidence(
  disputeId: string,
  reason: string
): Promise<DisputeCompensationDto> {
  const res = await authenticatedFetch(`/api/disputes/${encodeURIComponent(disputeId)}/compensation-evidence/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  return safeParseResponse<DisputeCompensationDto>(res);
}

export async function fetchDisputeCompensations(disputeId: string): Promise<DisputeCompensationDto[]> {
  try {
    const res = await authenticatedFetch(`/api/disputes/${encodeURIComponent(disputeId)}/compensation`);
    if (res.status === 204 || res.status === 404) return [];
    const data = await safeParseResponse<DisputeCompensationDto[]>(res);
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    return [];
  }
}

export async function fetchDisputeActionLogs(disputeId: string): Promise<DisputeActionLogDto[]> {
  try {
    const res = await authenticatedFetch(`/api/disputes/${encodeURIComponent(disputeId)}/action-logs`);
    if (res.status === 204 || res.status === 404) return [];
    const data = await safeParseResponse<DisputeActionLogDto[]>(res);
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    return [];
  }
}


