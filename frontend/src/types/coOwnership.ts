export interface OwnershipShareResponse {
  id: string;
  memberId: string;
  percentage: number;
  updatedAt: string;
}

export interface GroupMemberResponse {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  joinedAt: string;
  share: OwnershipShareResponse | null;
}

export interface CoOwnershipGroupResponse {
  id: string;
  vehicleId: string;
  name: string;
  createdAt: string;
  members: GroupMemberResponse[];
  totalOwnershipPercentage: number;
  availablePercentage: number;
}
