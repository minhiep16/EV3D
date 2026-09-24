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
