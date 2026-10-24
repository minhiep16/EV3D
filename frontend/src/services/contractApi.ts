import { authenticatedFetch, safeParseResponse } from './api';
import {
  ContractSummaryResponse,
  ContractVersionResponse,
  ContractAcceptanceResponse,
  CreateContractVersionRequest,
  ContractAcceptanceRequest,
} from '../types/contract';

/**
 * Fetch contract summary for a vehicle.
 */
export async function fetchContractByVehicle(vehicleId: string): Promise<ContractSummaryResponse> {
  const res = await authenticatedFetch(`/api/contracts/vehicle/${encodeURIComponent(vehicleId)}`);
  return safeParseResponse<ContractSummaryResponse>(res);
}

/**
 * Fetch contract summary by contract ID.
 */
export async function fetchContractById(contractId: string): Promise<ContractSummaryResponse> {
  const res = await authenticatedFetch(`/api/contracts/${encodeURIComponent(contractId)}`);
  return safeParseResponse<ContractSummaryResponse>(res);
}

/**
 * Fetch all versions of a contract (History).
 */
export async function fetchContractVersions(contractId: string): Promise<ContractVersionResponse[]> {
  const res = await authenticatedFetch(`/api/contracts/${encodeURIComponent(contractId)}/versions`);
  const data = await safeParseResponse<ContractVersionResponse[]>(res);
  return Array.isArray(data) ? data : [];
}

/**
 * Fetch specific contract version detail.
 */
export async function fetchContractVersionDetail(
  contractId: string,
  versionId: string
): Promise<ContractVersionResponse> {
  const res = await authenticatedFetch(
    `/api/contracts/${encodeURIComponent(contractId)}/versions/${encodeURIComponent(versionId)}`
  );
  return safeParseResponse<ContractVersionResponse>(res);
}

/**
 * Create a new draft contract version (Amendment proposal).
 */
export async function createDraftContractVersion(
  contractId: string,
  payload: CreateContractVersionRequest
): Promise<ContractVersionResponse> {
  const res = await authenticatedFetch(`/api/contracts/${encodeURIComponent(contractId)}/versions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return safeParseResponse<ContractVersionResponse>(res);
}

/**
 * Submit draft version for member acceptance (DRAFT -> PENDING_ACCEPTANCE).
 */
export async function submitVersionForAcceptance(
  contractId: string,
  versionId: string
): Promise<ContractVersionResponse> {
  const res = await authenticatedFetch(
    `/api/contracts/${encodeURIComponent(contractId)}/versions/${encodeURIComponent(versionId)}/submit`,
    {
      method: 'POST',
    }
  );
  return safeParseResponse<ContractVersionResponse>(res);
}

/**
 * Electronic Acceptance of contract version (DEMO).
 */
export async function acceptContractVersion(
  versionId: string,
  payload?: ContractAcceptanceRequest
): Promise<ContractAcceptanceResponse> {
  const res = await authenticatedFetch(
    `/api/contracts/versions/${encodeURIComponent(versionId)}/accept`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    }
  );
  return safeParseResponse<ContractAcceptanceResponse>(res);
}

/**
 * Explicit activation of contract version when all members accepted.
 */
export async function activateContractVersion(
  contractId: string,
  versionId: string
): Promise<ContractSummaryResponse> {
  const res = await authenticatedFetch(
    `/api/contracts/${encodeURIComponent(contractId)}/versions/${encodeURIComponent(versionId)}/activate`,
    {
      method: 'POST',
    }
  );
  return safeParseResponse<ContractSummaryResponse>(res);
}
