export interface OwnershipShareResponse {
  id: string;
  groupId: string;
  vehicleId: string;
  memberId: string;
  percentage: number;
  updatedAt: string;
}

export interface GroupMemberResponse {
  id: string;
  groupId: string;
  userId: string;
  fullName: string;
  email: string;
  role: string;
  memberRole?: 'MEMBER' | 'REPRESENTATIVE' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'REMOVED';
  joinedAt: string;
  removedAt?: string | null;
  share: OwnershipShareResponse | null;
}

export interface GroupVehicleResponse {
  id: string;
  groupId: string;
  vehicleId: string;
  vehicleCode: string;
  model: string;
  status: 'ACTIVE' | 'INACTIVE';
  addedAt: string;
}

export interface AvailableUserResponse {
  id: string;
  displayName: string;
  email: string;
}

export interface AddMemberPayload {
  userId?: string;
  email?: string;
}

/**
 * Authoritative Business Rule:
 * 1 CoOwnershipGroup = exactly 1 Vehicle.
 * A group represents the people jointly owning ONE specific vehicle.
 * `vehicleId` and `vehicleCode` are the direct 1-to-1 vehicle identity.
 * `vehicles` list is maintained for backward compatibility with length <= 1.
 */
export interface CoOwnershipGroupResponse {
  id: string;
  name: string;
  status?: 'ACTIVE' | 'INACTIVE';
  createdBy?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  members: GroupMemberResponse[];
  vehicles?: GroupVehicleResponse[];
  vehicleId?: string | null;
  vehicleCode?: string | null;
  totalOwnershipPercentage: number;
  availablePercentage: number;
  statusLabel?: string;
}
