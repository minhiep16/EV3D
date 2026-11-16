import { authenticatedFetch, safeParseResponse } from './api';

export interface AdminDashboardStatsResponse {
  registeredUsersCount: number;
  activeUsersCount: number;
  suspendedUsersCount: number;
  inactiveUsersCount: number;
  staffUsersCount: number;
  coOwnerUsersCount: number;
  adminUsersCount: number;
  vehiclesCount: number;
  ownershipGroupsCount: number;
  activeBookingsCount: number;
  activeTripsCount: number;
  chargingSessionsCount: number;
  pendingVehicleRegistrationsCount: number;
  pendingMembershipRequestsCount: number;
  pendingPaymentVerificationsCount: number;
  activeMaintenanceCount: number;
  activeDisputesCount: number;
}

export interface AdminUserResponse {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'STAFF' | 'CO_OWNER';
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  activeGroupsCount: number;
  activeVehicleNames: string[];
  hasActiveTrip: boolean;
  hasActiveBooking: boolean;
}

export interface AuditLogResponse {
  id: string;
  actorId: string | null;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  previousState: string | null;
  newState: string | null;
  description: string;
  ipAddress: string;
  createdAt: string;
}

export interface PaginatedResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStatsResponse> {
  const res = await authenticatedFetch('/api/admin/dashboard/stats');
  return safeParseResponse<AdminDashboardStatsResponse>(res);
}

export async function fetchAdminUsers(params?: {
  query?: string;
  role?: string;
  status?: string;
  page?: number;
  size?: number;
}): Promise<PaginatedResult<AdminUserResponse>> {
  const queryParams = new URLSearchParams();
  if (params?.query) queryParams.set('query', params.query);
  if (params?.role) queryParams.set('role', params.role);
  if (params?.status) queryParams.set('status', params.status);
  if (params?.page !== undefined) queryParams.set('page', params.page.toString());
  if (params?.size !== undefined) queryParams.set('size', params.size.toString());

  const url = `/api/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const res = await authenticatedFetch(url);
  return safeParseResponse<PaginatedResult<AdminUserResponse>>(res);
}

export async function updateUserStatus(
  userId: string,
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE',
  reason?: string
): Promise<AdminUserResponse> {
  const res = await authenticatedFetch(`/api/admin/users/${userId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, reason }),
  });
  return safeParseResponse<AdminUserResponse>(res);
}

export async function updateUserRole(
  userId: string,
  role: 'ADMIN' | 'STAFF' | 'CO_OWNER',
  reason?: string
): Promise<AdminUserResponse> {
  const res = await authenticatedFetch(`/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, reason }),
  });
  return safeParseResponse<AdminUserResponse>(res);
}

export async function fetchAdminAuditLogs(params?: {
  action?: string;
  resourceType?: string;
  actorRole?: string;
  fromTime?: string;
  toTime?: string;
  search?: string;
  page?: number;
  size?: number;
}): Promise<PaginatedResult<AuditLogResponse>> {
  const queryParams = new URLSearchParams();
  if (params?.action) queryParams.set('action', params.action);
  if (params?.resourceType) queryParams.set('resourceType', params.resourceType);
  if (params?.actorRole) queryParams.set('actorRole', params.actorRole);
  if (params?.fromTime) queryParams.set('fromTime', params.fromTime);
  if (params?.toTime) queryParams.set('toTime', params.toTime);
  if (params?.search) queryParams.set('search', params.search);
  if (params?.page !== undefined) queryParams.set('page', params.page.toString());
  if (params?.size !== undefined) queryParams.set('size', params.size.toString());

  const url = `/api/admin/audit-logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const res = await authenticatedFetch(url);
  return safeParseResponse<PaginatedResult<AuditLogResponse>>(res);
}

export interface AdminFinancialOverviewResponse {
  totalRecordedExpenses: number;
  verifiedPayments: number;
  outstandingObligations: number;
  paymentsAwaitingVerificationCount: number;
  expensesByCategory: Record<string, number>;
  expensesByVehicle: Record<string, number>;
}

export interface AdminMemberDetailResponse {
  memberId: string;
  userId: string;
  fullName: string;
  email: string;
  memberRole: string;
  memberStatus: string;
  joinedAt: string;
  ownershipPercentage: number;
  totalBookings: number;
  totalTrips: number;
  totalDistanceKm: number;
  totalDrivingHours: number;
  pendingTransfersCount: number;
  contractSigned: boolean;
  requiredFinancialShare: number;
  paidFinancialAmount: number;
  outstandingBalance: number;
}

export async function fetchAdminFinancialOverview(): Promise<AdminFinancialOverviewResponse> {
  const res = await authenticatedFetch('/api/admin/financial/overview');
  return safeParseResponse<AdminFinancialOverviewResponse>(res);
}

export async function fetchAdminMemberInspection(
  groupId: string,
  memberId: string
): Promise<AdminMemberDetailResponse> {
  const res = await authenticatedFetch(`/api/admin/groups/${groupId}/members/${memberId}/inspection`);
  return safeParseResponse<AdminMemberDetailResponse>(res);
}
