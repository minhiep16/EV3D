import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VehicleResponse } from '../../../types/vehicle';
import {
  CoOwnershipGroupResponse,
  GroupMemberResponse,
  AvailableUserResponse,
} from '../../../types/coOwnership';
import {
  OwnershipTransferResponse,
  OwnershipDistributionPreviewResponse,
  MemberSharePreview,
  OwnershipHistoryResponse,
  MembershipWithdrawalResponse,
  AcceptTransferPayload,
} from '../../../types/ownershipTransfer';
import {
  fetchVehicleCoOwnership,
  removeMemberFromGroup,
  searchAvailableUsers,
  addMemberToGroup,
} from '../../../services/coOwnershipApi';
import {
  fetchGroupTransfers,
  fetchIncomingTransfers,
  fetchTransferPreview,
  createTransferRequest,
  acceptTransfer,
  rejectTransfer,
  cancelTransfer,
  completeTransfer,
  fetchOwnershipHistory,
  createWithdrawalRequest,
  confirmTransferorConsent,
} from '../../../services/ownershipTransferApi';
import { useAuthStore } from '../../../store/authStore';
import { useWorldStore } from '../../../store/worldStore';
import { resolveVehicleCode } from '../vehicles/vehicleModelConfig';
import {
  Users,
  Car,
  PieChart,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  UserPlus,
  Trash2,
  Mail,
  Calendar,
  Search,
  Loader2,
  Sparkles,
  Award,
  ArrowLeft,
  ArrowRight,
  User,
  FileText,
  History,
  Send,
  LogOut,
  AlertTriangle,
  Clock,
  Check,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';

interface CoOwnerOwnershipPanelProps {
  vehicle: VehicleResponse;
  onClose: () => void;
}

type PanelSubView = 'MEMBERS' | 'TRANSFER_FORM' | 'INCOMING_TRANSFERS' | 'WITHDRAWAL_FORM' | 'HISTORY';

const OWNER_ORB_COLORS = [
  '#00f2fe', // Cyan
  '#a855f7', // Purple
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#8b5cf6', // Violet
];

const STATUS_LABELS: Record<
  GroupMemberResponse['status'],
  { label: string; color: string }
> = {
  ACTIVE: { label: 'Đang hoạt động', color: '#10b981' },
  PENDING: { label: 'Đang chờ duyệt', color: '#f59e0b' },
  INACTIVE: { label: 'Ngừng hoạt động', color: '#ef4444' },
  REMOVED: { label: 'Đã rời nhóm', color: '#6b7280' },
};

const ROLE_LABELS: Record<string, string> = {
  REPRESENTATIVE: 'Đại diện nhóm',
  ADMIN: 'Quản trị viên',
  MEMBER: 'Đồng sở hữu',
};

const TRANSFER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Bản nháp', color: '#94a3b8' },
  PENDING_ACCEPTANCE: { label: 'CHỜ NGƯỜI NHẬN XÁC NHẬN', color: '#f59e0b' },
  PENDING_APPROVAL: { label: 'CHỜ HOÀN TẤT ĐIỀU KIỆN', color: '#38bdf8' },
  APPROVED: { label: 'ĐỦ ĐIỀU KIỆN HOÀN TẤT', color: '#10b981' },
  PENDING_CONTRACT: { label: 'CHỜ XÁC NHẬN PHỤ LỤC', color: '#f59e0b' },
  COMPLETED: { label: 'CHUYỂN NHƯỢNG THÀNH CÔNG', color: '#22c55e' },
  REJECTED: { label: 'BỊ TỪ CHỐI', color: '#ef4444' },
  CANCELLED: { label: 'ĐÃ HỦY', color: '#6b7280' },
};

const getTransferDisplayStatus = (req: OwnershipTransferResponse): { label: string; color: string } => {
  if (req.status === 'COMPLETED') {
    return { label: 'CHUYỂN NHƯỢNG THÀNH CÔNG', color: '#22c55e' };
  }
  if (req.status === 'REJECTED') {
    return { label: 'BỊ TỪ CHỐI', color: '#ef4444' };
  }
  if (req.status === 'CANCELLED') {
    return { label: 'ĐÃ HỦY', color: '#6b7280' };
  }
  const isTransferorAccepted = Boolean(req.transferorAccepted ?? req.isTransferorAccepted);
  const isRecipientAccepted = Boolean(req.recipientAccepted ?? req.isRecipientAccepted);
  const canComplete = Boolean(req.canFinalize ?? req.canComplete);

  if (canComplete || (isTransferorAccepted && isRecipientAccepted && (!req.finalizationBlockers || req.finalizationBlockers.length === 0))) {
    return { label: 'ĐỦ ĐIỀU KIỆN HOÀN TẤT', color: '#10b981' };
  }
  if (isTransferorAccepted && isRecipientAccepted) {
    return { label: 'CHỜ HOÀN TẤT ĐIỀU KIỆN', color: '#38bdf8' };
  }
  if (isTransferorAccepted && !isRecipientAccepted) {
    return { label: 'CHỜ NGƯỜI NHẬN XÁC NHẬN', color: '#f59e0b' };
  }
  if (!isTransferorAccepted && isRecipientAccepted) {
    return { label: 'CHỜ NGƯỜI CHUYỂN XÁC NHẬN', color: '#f59e0b' };
  }
  if (!isTransferorAccepted && !isRecipientAccepted) {
    return { label: 'CHỜ XÁC NHẬN CỦA HAI BÊN', color: '#f59e0b' };
  }
  return TRANSFER_STATUS_LABELS[req.status] || { label: req.statusVi || req.acceptanceStatus || req.status, color: '#94a3b8' };
};

export const CoOwnerOwnershipPanel: React.FC<CoOwnerOwnershipPanelProps> = ({
  vehicle,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  const selectedOwnerId = useWorldStore((state) => state.selectedOwnerId);
  const clearOwnerSelection = useWorldStore((state) => state.clearOwnerSelection);
  const openGaragePanel = useWorldStore((state) => state.openGaragePanel);

  // Sub-view navigation state
  const [currentView, setCurrentView] = useState<PanelSubView>('MEMBERS');

  // Add member modal state
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<AvailableUserResponse | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  // Transfer Form State
  const [recipientUserId, setRecipientUserId] = useState<string>('');
  const [transferPercentageInput, setTransferPercentageInput] = useState<string>('10.00');
  const [transferReason, setTransferReason] = useState<string>('Thỏa thuận chuyển nhượng tự nguyện giữa các thành viên');
  const [transferFormError, setTransferFormError] = useState<string | null>(null);
  const [transferSuccessMsg, setTransferSuccessMsg] = useState<string | null>(null);

  // Rejection modal state
  const [rejectingTransferId, setRejectingTransferId] = useState<string | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState<string>('Chưa có nhu cầu gia tăng tỷ lệ sở hữu tại thời điểm này');

  // Streamlined Appendix Viewer & Consent State (Phase 22-23 Hotfix)
  const [openedAppendixIds, setOpenedAppendixIds] = useState<Record<string, boolean>>({});
  const [reviewedHashes, setReviewedHashes] = useState<Record<string, string>>({});
  const [recipientConsentChecked, setRecipientConsentChecked] = useState<Record<string, boolean>>({});
  const [expandedAmendmentPreview, setExpandedAmendmentPreview] = useState<Record<string, boolean>>({});
  const [acceptError, setAcceptError] = useState<Record<string, string | null>>({});
  const [transferorConsentChecked, setTransferorConsentChecked] = useState(false);
  const [showAmendmentSnapshotInForm, setShowAmendmentSnapshotInForm] = useState(false);
  const [completeError, setCompleteError] = useState<Record<string, string | null>>({});

  // Withdrawal Form State
  const [withdrawalReason, setWithdrawalReason] = useState<string>('Rút lui khỏi quyền sở hữu phương tiện theo kế hoạch cá nhân');
  const [withdrawalFormError, setWithdrawalFormError] = useState<string | null>(null);
  const [withdrawalSuccessMsg, setWithdrawalSuccessMsg] = useState<string | null>(null);

  const vehicleCode = resolveVehicleCode(vehicle) || vehicle.name || 'EV01';

  // 1. TanStack Query: Co-ownership Group for Vehicle
  const {
    data: coOwnership,
    isLoading,
    isError,
    error,
  } = useQuery<CoOwnershipGroupResponse>({
    queryKey: ['coOwnership', vehicle.id],
    queryFn: () => fetchVehicleCoOwnership(vehicle.id),
    staleTime: 6000,
  });

  const groupId = coOwnership?.id;

  // 2. Incoming transfer requests for current user
  const {
    data: rawIncomingTransfers,
    isLoading: isLoadingIncoming,
    isError: isErrorIncoming,
    refetch: refetchIncoming,
  } = useQuery<OwnershipTransferResponse[]>({
    queryKey: ['incomingTransfers', currentUser?.id],
    queryFn: () => fetchIncomingTransfers(),
    enabled: Boolean(currentUser),
    staleTime: 5000,
  });

  const safeIncomingTransfers = useMemo<OwnershipTransferResponse[]>(() => {
    let list: OwnershipTransferResponse[] = [];
    if (rawIncomingTransfers) {
      if (Array.isArray(rawIncomingTransfers)) list = rawIncomingTransfers;
      else if (Array.isArray((rawIncomingTransfers as any)?.content)) list = (rawIncomingTransfers as any).content;
      else if (Array.isArray((rawIncomingTransfers as any)?.items)) list = (rawIncomingTransfers as any).items;
      else if (Array.isArray((rawIncomingTransfers as any)?.data)) list = (rawIncomingTransfers as any).data;
    }
    const seen = new Set<string>();
    return list.filter((t) => {
      if (!t || !t.id) return false;
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }, [rawIncomingTransfers]);

  // 3. Group transfers
  const {
    data: rawGroupTransfers,
    isLoading: isLoadingGroupTransfers,
    isError: isErrorGroupTransfers,
    refetch: refetchGroupTransfers,
  } = useQuery<OwnershipTransferResponse[]>({
    queryKey: ['groupTransfers', groupId],
    queryFn: () => (groupId ? fetchGroupTransfers(groupId) : Promise.resolve([])),
    enabled: Boolean(groupId),
    staleTime: 5000,
  });

  const safeGroupTransfers = useMemo<OwnershipTransferResponse[]>(() => {
    if (!rawGroupTransfers) return [];
    if (Array.isArray(rawGroupTransfers)) return rawGroupTransfers;
    if (Array.isArray((rawGroupTransfers as any)?.content)) return (rawGroupTransfers as any).content;
    if (Array.isArray((rawGroupTransfers as any)?.items)) return (rawGroupTransfers as any).items;
    if (Array.isArray((rawGroupTransfers as any)?.data)) return (rawGroupTransfers as any).data;
    return [];
  }, [rawGroupTransfers]);

  // Outgoing transfer requests initiated by current user (e.g. Nguyen Van A)
  const outgoingTransfers = useMemo<OwnershipTransferResponse[]>(() => {
    if (!currentUser?.id || !Array.isArray(safeGroupTransfers)) return [];
    const currentId = String(currentUser.id).toLowerCase();
    const seen = new Set<string>();
    return safeGroupTransfers
      .filter(
        (t) =>
          String(t.fromUserId ?? t.transferorUserId).toLowerCase() === currentId &&
          (t.status === 'PENDING_ACCEPTANCE' ||
            t.status === 'PENDING_CONTRACT' ||
            t.status === 'APPROVED' ||
            t.status === 'COMPLETED')
      )
      .filter((t) => {
        if (!t || !t.id) return false;
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });
  }, [safeGroupTransfers, currentUser?.id]);

  const notifiedGroupTransfers = useMemo<OwnershipTransferResponse[]>(() => {
    if (!currentUser?.id || !Array.isArray(safeGroupTransfers)) return [];
    const currentId = String(currentUser.id).toLowerCase();
    return safeGroupTransfers.filter(
      (t) =>
        String(t.fromUserId ?? t.transferorUserId).toLowerCase() !== currentId &&
        String(t.toUserId ?? t.recipientUserId).toLowerCase() !== currentId &&
        (t.status === 'PENDING_ACCEPTANCE' || t.status === 'PENDING_CONTRACT' || t.status === 'APPROVED')
    );
  }, [safeGroupTransfers, currentUser?.id]);

  // 4. Ownership change history
  const {
    data: rawOwnershipHistory,
    isLoading: isLoadingHistory,
    isError: isErrorHistory,
    refetch: refetchHistory,
  } = useQuery<OwnershipHistoryResponse[]>({
    queryKey: ['ownershipHistory', groupId],
    queryFn: () => (groupId ? fetchOwnershipHistory(groupId) : Promise.resolve([])),
    enabled: Boolean(groupId && currentView === 'HISTORY'),
  });

  const safeOwnershipHistory = useMemo<OwnershipHistoryResponse[]>(() => {
    if (!rawOwnershipHistory) return [];
    if (Array.isArray(rawOwnershipHistory)) return rawOwnershipHistory;
    if (Array.isArray((rawOwnershipHistory as any)?.content)) return (rawOwnershipHistory as any).content;
    if (Array.isArray((rawOwnershipHistory as any)?.items)) return (rawOwnershipHistory as any).items;
    if (Array.isArray((rawOwnershipHistory as any)?.data)) return (rawOwnershipHistory as any).data;
    return [];
  }, [rawOwnershipHistory]);

  const safeMembers = useMemo<GroupMemberResponse[]>(() => {
    if (!coOwnership) return [];
    if (Array.isArray(coOwnership.members)) return coOwnership.members;
    if (Array.isArray((coOwnership as any)?.members?.content)) return (coOwnership as any).members.content;
    if (Array.isArray((coOwnership as any)?.members?.items)) return (coOwnership as any).members.items;
    if (Array.isArray((coOwnership as any)?.members?.data)) return (coOwnership as any).members.data;
    if (Array.isArray((coOwnership as any)?.data?.members)) return (coOwnership as any).data.members;
    if (Array.isArray((coOwnership as any)?.data)) return (coOwnership as any).data;
    if (Array.isArray((coOwnership as any)?.content)) return (coOwnership as any).content;
    if (Array.isArray((coOwnership as any)?.items)) return (coOwnership as any).items;
    if (Array.isArray(coOwnership)) return coOwnership;
    return [];
  }, [coOwnership]);

  // Active members sorted by ownership percentage descending
  const activeMembers = useMemo<GroupMemberResponse[]>(() => {
    const list = Array.isArray(safeMembers) ? safeMembers : [];
    const active = list.filter((m) => m && m.status === 'ACTIVE');
    return [...active].sort((a, b) => {
      const shareA = a.share?.percentage ?? 0;
      const shareB = b.share?.percentage ?? 0;
      return shareB - shareA;
    });
  }, [safeMembers]);

  // Current user's membership and current percentage
  const currentMember = useMemo(() => {
    if (!currentUser || !safeMembers.length) return null;
    return safeMembers.find((m) => m && m.userId === currentUser.id) || null;
  }, [currentUser, safeMembers]);

  const currentUserShare = currentMember?.share?.percentage ?? 0;

  // Selected member based on 3D representative interaction in showroom
  const selectedMember = useMemo(() => {
    if (!selectedOwnerId || activeMembers.length === 0) return null;
    return activeMembers.find((m) => m.id === selectedOwnerId) || null;
  }, [selectedOwnerId, activeMembers]);

  const selectedMemberIndex = useMemo(() => {
    if (!selectedMember) return 0;
    const idx = activeMembers.findIndex((m) => m.id === selectedMember.id);
    return idx >= 0 ? idx : 0;
  }, [selectedMember, activeMembers]);

  const selectedMemberColor = OWNER_ORB_COLORS[selectedMemberIndex % OWNER_ORB_COLORS.length];

  // Candidates for recipient in transfer form (other active members)
  const recipientCandidates = useMemo<GroupMemberResponse[]>(() => {
    if (!currentUser || !Array.isArray(activeMembers) || activeMembers.length === 0) return [];
    return activeMembers.filter((m) => m && m.userId !== currentUser.id);
  }, [currentUser, activeMembers]);

  // Default recipient selection when candidates load
  useEffect(() => {
    if (Array.isArray(recipientCandidates) && recipientCandidates.length > 0 && !recipientUserId) {
      setRecipientUserId(recipientCandidates[0].userId);
    }
  }, [recipientCandidates, recipientUserId]);

  // Real-time Preview query for transfer distribution
  const transferPercentNumber = parseFloat(transferPercentageInput) || 0;
  const isPreviewEligible = Boolean(
    groupId &&
    vehicle.id &&
    currentUser?.id &&
    recipientUserId &&
    transferPercentNumber > 0 &&
    transferPercentNumber <= currentUserShare &&
    currentView === 'TRANSFER_FORM'
  );

  const {
    data: previewData,
    isLoading: isPreviewLoading,
    isError: isPreviewError,
    error: previewError,
    refetch: refetchPreview,
  } = useQuery<OwnershipDistributionPreviewResponse>({
    queryKey: ['transferPreview', groupId, vehicle.id, currentUser?.id, recipientUserId, transferPercentNumber],
    queryFn: () =>
      fetchTransferPreview(
        groupId!,
        vehicle.id,
        currentUser!.id,
        recipientUserId,
        transferPercentNumber
      ),
    enabled: isPreviewEligible,
    staleTime: 3000,
  });

  // Authoritative preview members list from backend distribution
  const previewMembers = useMemo<MemberSharePreview[]>(() => {
    if (!previewData) return [];
    if (Array.isArray(previewData.members)) return previewData.members;
    if (Array.isArray((previewData as any).proposedDistribution)) return (previewData as any).proposedDistribution;
    if (Array.isArray((previewData as any).currentDistribution)) return (previewData as any).currentDistribution;
    if (Array.isArray((previewData as any).data?.members)) return (previewData as any).data.members;
    if (Array.isArray((previewData as any).data?.proposedDistribution)) return (previewData as any).data.proposedDistribution;
    if (Array.isArray((previewData as any).data)) return (previewData as any).data;
    if (Array.isArray((previewData as any).content)) return (previewData as any).content;
    if (Array.isArray((previewData as any).items)) return (previewData as any).items;
    if (Array.isArray(previewData)) return previewData as any;
    return [];
  }, [previewData]);

  // Check if current user is active REPRESENTATIVE
  const canManage = useMemo(() => {
    if (!currentUser || !coOwnership) return false;
    if (currentUser.role !== 'CO_OWNER') return false;
    const currentMembership = (Array.isArray(safeMembers) ? safeMembers : []).find((m) => m && m.userId === currentUser.id);
    return (
      currentMembership !== undefined &&
      currentMembership.status === 'ACTIVE' &&
      currentMembership.memberRole === 'REPRESENTATIVE'
    );
  }, [currentUser, coOwnership, safeMembers]);

  // Search available users for adding
  const { data: rawAvailableUsers, isLoading: isSearchingUsers, isError: isErrorSearchingUsers } = useQuery<AvailableUserResponse[]>({
    queryKey: ['availableUsers', coOwnership?.id, searchTerm],
    queryFn: () => (coOwnership?.id ? searchAvailableUsers(coOwnership.id, searchTerm) : Promise.resolve([])),
    enabled: Boolean(isAddMemberOpen && coOwnership?.id),
  });

  const availableUsers = useMemo<AvailableUserResponse[]>(() => {
    if (!rawAvailableUsers) return [];
    if (Array.isArray(rawAvailableUsers)) return rawAvailableUsers;
    if (Array.isArray((rawAvailableUsers as any)?.content)) return (rawAvailableUsers as any).content;
    if (Array.isArray((rawAvailableUsers as any)?.items)) return (rawAvailableUsers as any).items;
    if (Array.isArray((rawAvailableUsers as any)?.data)) return (rawAvailableUsers as any).data;
    return [];
  }, [rawAvailableUsers]);

  // Invalidate all related caches helper
  const invalidateAllOwnershipData = () => {
    queryClient.invalidateQueries({ queryKey: ['coOwnership', vehicle.id] });
    queryClient.invalidateQueries({ queryKey: ['coOwnership'] });
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    queryClient.invalidateQueries({ queryKey: ['vehicle', vehicle.id] });
    queryClient.invalidateQueries({ queryKey: ['vehicle'] });
    queryClient.invalidateQueries({ queryKey: ['garage'] });
    queryClient.invalidateQueries({ queryKey: ['ownershipShares'] });
    queryClient.invalidateQueries({ queryKey: ['groupMembers'] });
    if (groupId) {
      queryClient.invalidateQueries({ queryKey: ['groupTransfers', groupId] });
      queryClient.invalidateQueries({ queryKey: ['ownershipHistory', groupId] });
    }
    queryClient.invalidateQueries({ queryKey: ['groupTransfers'] });
    queryClient.invalidateQueries({ queryKey: ['ownershipHistory'] });
    queryClient.invalidateQueries({ queryKey: ['incomingTransfers'] });
    queryClient.invalidateQueries({ queryKey: ['contractSummary', vehicle.id] });
    queryClient.invalidateQueries({ queryKey: ['contractSummary'] });
    queryClient.invalidateQueries({ queryKey: ['co-ownership-contract', vehicle.id] });
    queryClient.invalidateQueries({ queryKey: ['co-ownership-contract'] });
    queryClient.invalidateQueries({ queryKey: ['co-ownership-contract-versions'] });
    queryClient.invalidateQueries({ queryKey: ['co-ownership-contract-version'] });
    queryClient.invalidateQueries({ queryKey: ['co-ownership-contract-acceptances'] });
    queryClient.invalidateQueries({ queryKey: ['coOwnershipContract'] });
    queryClient.invalidateQueries({ queryKey: ['transferPreview'] });
  };

  // Add Member Mutation
  const addMutation = useMutation({
    mutationFn: (userId: string) => {
      if (!coOwnership?.id) throw new Error('Không tìm thấy thông tin nhóm.');
      return addMemberToGroup(coOwnership.id, { userId });
    },
    onSuccess: () => {
      invalidateAllOwnershipData();
      setIsAddMemberOpen(false);
      setSelectedUserToAdd(null);
      setSearchTerm('');
      setAddError(null);
    },
    onError: (err: any) => {
      setAddError(err?.message || 'Không thể thêm thành viên vào nhóm.');
    },
  });

  // Remove Member Mutation
  const removeMutation = useMutation({
    mutationFn: (memberId: string) => {
      if (!coOwnership?.id) throw new Error('Không tìm thấy thông tin nhóm.');
      return removeMemberFromGroup(coOwnership.id, memberId);
    },
    onSuccess: () => {
      invalidateAllOwnershipData();
      setConfirmRemoveId(null);
      setRemoveError(null);
      clearOwnerSelection();
    },
    onError: (err: any) => {
      setRemoveError(err?.message || 'Không thể xoá thành viên khỏi nhóm.');
    },
  });

  // Create Transfer Mutation
  const createTransferMutation = useMutation({
    mutationFn: (payload: { toUserId: string; transferPercentage: number; reason: string }) => {
      if (!groupId) throw new Error('Không tìm thấy nhóm đồng sở hữu.');
      return createTransferRequest(groupId, payload);
    },
    onSuccess: () => {
      invalidateAllOwnershipData();
      setTransferSuccessMsg('Yêu cầu chuyển nhượng sở hữu đã được gửi thành công đến người nhận.');
      setTransferFormError(null);
      setTimeout(() => {
        setTransferSuccessMsg(null);
        setCurrentView('MEMBERS');
      }, 2500);
    },
    onError: (err: any) => {
      setTransferFormError(err?.message || 'Không thể gửi yêu cầu chuyển nhượng.');
    },
  });

  // Accept Transfer Mutation
  const acceptTransferMutation = useMutation({
    mutationFn: ({ transferId, payload }: { transferId: string; payload?: AcceptTransferPayload }) =>
      acceptTransfer(transferId, payload),
    onSuccess: () => {
      invalidateAllOwnershipData();
      refetchIncoming();
      refetchGroupTransfers();
      queryClient.invalidateQueries({ queryKey: ['co-owner-contract'] });
      queryClient.invalidateQueries({ queryKey: ['co-owner-contract-versions'] });
    },
    onError: (err: any, variables) => {
      setAcceptError((prev) => ({
        ...prev,
        [variables.transferId]: err?.message || 'Không thể chấp thuận yêu cầu chuyển nhượng.',
      }));
    },
  });

  // Confirm Transferor Consent Mutation (Phase 22-23 Hotfix)
  const confirmTransferorConsentMutation = useMutation({
    mutationFn: ({ transferId, payload }: { transferId: string; payload?: { contentHash?: string; acknowledgedTerms?: boolean; confirmationNote?: string } }) =>
      confirmTransferorConsent(transferId, payload),
    onSuccess: () => {
      invalidateAllOwnershipData();
      refetchIncoming();
      refetchGroupTransfers();
      queryClient.invalidateQueries({ queryKey: ['co-owner-contract'] });
      queryClient.invalidateQueries({ queryKey: ['co-owner-contract-versions'] });
    },
    onError: (err: any, variables) => {
      setAcceptError((prev) => ({
        ...prev,
        [variables.transferId]: err?.message || 'Không thể xác nhận chấp thuận từ bên chuyển nhượng.',
      }));
    },
  });

  // Reject Transfer Mutation
  const rejectTransferMutation = useMutation({
    mutationFn: ({ transferId, reason }: { transferId: string; reason: string }) =>
      rejectTransfer(transferId, { reason }),
    onSuccess: () => {
      invalidateAllOwnershipData();
      setRejectingTransferId(null);
      refetchIncoming();
      refetchGroupTransfers();
    },
  });

  // Cancel Transfer Mutation
  const cancelTransferMutation = useMutation({
    mutationFn: (transferId: string) => cancelTransfer(transferId),
    onSuccess: () => {
      invalidateAllOwnershipData();
      refetchIncoming();
      refetchGroupTransfers();
    },
  });

  // Complete Transfer Mutation (Atomic activation)
  const completeTransferMutation = useMutation({
    mutationFn: (transferId: string) => completeTransfer(transferId),
    onSuccess: () => {
      invalidateAllOwnershipData();
      refetchIncoming();
      refetchGroupTransfers();
      queryClient.invalidateQueries({ queryKey: ['co-owner-contract'] });
      queryClient.invalidateQueries({ queryKey: ['co-owner-contract-versions'] });
    },
    onError: (err: any, transferId) => {
      setCompleteError((prev) => ({
        ...prev,
        [transferId]: err?.message || 'Không thể kích hoạt hoàn tất chuyển nhượng.',
      }));
    },
  });

  // Withdrawal Mutation
  const withdrawalMutation = useMutation({
    mutationFn: (payload: { reason: string }) => {
      if (!groupId) throw new Error('Không tìm thấy nhóm.');
      return createWithdrawalRequest(groupId, payload);
    },
    onSuccess: () => {
      invalidateAllOwnershipData();
      setWithdrawalSuccessMsg('Yêu cầu rút khỏi nhóm đã được gửi thành công đến đại diện quản lý.');
      setWithdrawalFormError(null);
      setTimeout(() => {
        setWithdrawalSuccessMsg(null);
        setCurrentView('MEMBERS');
      }, 2500);
    },
    onError: (err: any) => {
      setWithdrawalFormError(err?.message || 'Không thể gửi yêu cầu rút khỏi nhóm.');
    },
  });

  const memberCount = activeMembers.length || 3;
  const vehicleCount = coOwnership?.vehicles && coOwnership.vehicles.length > 0 ? coOwnership.vehicles.length : 1;
  const totalPercentage = coOwnership?.totalOwnershipPercentage ?? 100;
  const isComplete = totalPercentage === 100;
  const statusLabel = coOwnership?.statusLabel || (isComplete ? 'Hoàn chỉnh' : 'Chưa phân bổ đủ');

  const pendingIncomingCount = safeIncomingTransfers.filter(
    (t) => (t.status === 'PENDING_ACCEPTANCE' || t.status === 'PENDING_CONTRACT') &&
           !(t.recipientAccepted ?? t.isRecipientAccepted)
  ).length;

  // Shared container styles
  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: '90px',
    right: '24px',
    bottom: '20px',
    width: 'min(500px, calc(100vw - 32px))',
    height: 'calc(100vh - 110px)',
    maxHeight: 'calc(100vh - 110px)',
    zIndex: 1000,
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(180deg, rgba(8, 16, 30, 0.95) 0%, rgba(6, 12, 24, 0.97) 100%)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1.5px solid rgba(34, 230, 255, 0.35)',
    borderRadius: '20px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75), 0 0 30px rgba(34, 230, 255, 0.14)',
    color: '#ffffff',
    overflow: 'hidden',
    userSelect: 'none',
    fontFamily: 'var(--font-family, system-ui, -apple-system, sans-serif)',
    animation: 'contractPanelFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  };

  const renderPortal = (content: React.ReactNode) => {
    if (typeof document === 'undefined') return null;
    return createPortal(content, document.body);
  };

  // Header Component Helper
  const renderHeader = (title: string, subtitle?: string, showBackToMembers = false) => (
    <div
      style={{
        padding: '14px 18px',
        borderBottom: '1px solid rgba(34, 230, 255, 0.18)',
        background: 'linear-gradient(90deg, rgba(34, 230, 255, 0.08) 0%, transparent 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {showBackToMembers && (
          <button
            type="button"
            onClick={() => {
              setCurrentView('MEMBERS');
              clearOwnerSelection();
              setTransferFormError(null);
              setWithdrawalFormError(null);
            }}
            title="Quay lại danh sách thành viên"
            style={{
              background: 'rgba(34, 230, 255, 0.12)',
              border: '1px solid rgba(34, 230, 255, 0.30)',
              borderRadius: '8px',
              padding: '5px 8px',
              display: 'inline-flex',
              alignItems: 'center',
              color: '#22e6ff',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <ArrowLeft size={14} />
          </button>
        )}
        <div>
          <div
            style={{
              fontSize: '13.5px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.02em',
              lineHeight: 1.2,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '1px' }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        title="Đóng bảng đồng sở hữu"
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <X size={15} />
      </button>
    </div>
  );

  // =========================================================================
  // VIEW MODE A: 3D MEMBER DETAIL POPUP (Showroom orb clicked)
  // =========================================================================
  if (selectedMember && currentView === 'MEMBERS') {
    const isRep = selectedMember.memberRole === 'REPRESENTATIVE';
    const memberPercentage = selectedMember.share?.percentage ?? 0;
    const memberStatus = STATUS_LABELS[selectedMember.status] || {
      label: 'Đang hoạt động',
      color: '#10b981',
    };

    return renderPortal(
      <aside
        className="evshare-ownership-panel"
        role="region"
        aria-label={`Chi tiết thành viên ${selectedMember.fullName}`}
        data-ui-interactive="true"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={panelStyle}
      >
        {renderHeader('HỒ SƠ THÀNH VIÊN', `${vehicleCode} • Cổ phần ${memberPercentage}%`, true)}

        <div
          style={{
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            flex: 1,
          }}
        >
          {/* Member Identity Card */}
          <div
            style={{
              background: 'rgba(7, 20, 38, 0.75)',
              border: `1.5px solid ${selectedMemberColor}40`,
              borderRadius: '14px',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: `0 0 20px ${selectedMemberColor}20`,
            }}
          >
            {selectedMember.avatarUrl ? (
              <img
                src={selectedMember.avatarUrl}
                alt={selectedMember.fullName}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `2px solid ${selectedMemberColor}`,
                  boxShadow: `0 0 12px ${selectedMemberColor}`,
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${selectedMemberColor}35, rgba(7, 20, 38, 0.9))`,
                  border: `2px solid ${selectedMemberColor}`,
                  boxShadow: `0 0 14px ${selectedMemberColor}50`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: selectedMemberColor,
                  fontWeight: 800,
                  fontSize: '16px',
                  flexShrink: 0,
                }}
              >
                <User size={22} color={selectedMemberColor} />
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {selectedMember.fullName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: isRep ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.08)',
                    border: isRep ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(255, 255, 255, 0.15)',
                    color: isRep ? '#10b981' : '#cbd5e1',
                  }}
                >
                  {ROLE_LABELS[selectedMember.memberRole || 'MEMBER'] || 'Đồng sở hữu'}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: memberStatus.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: memberStatus.color,
                      boxShadow: `0 0 6px ${memberStatus.color}`,
                    }}
                  />
                  {memberStatus.label}
                </span>
              </div>
            </div>
          </div>

          {/* Member Information Data Fields */}
          <div
            style={{
              background: 'rgba(7, 20, 38, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11.5px' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>Họ tên:</span>
                <div style={{ fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                  {selectedMember.fullName}
                </div>
              </div>

              <div>
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>Vai trò:</span>
                <div style={{ fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                  {ROLE_LABELS[selectedMember.memberRole || 'MEMBER'] || 'Đồng sở hữu'}
                </div>
              </div>

              <div>
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>Tỷ lệ sở hữu:</span>
                <div style={{ fontWeight: 800, color: selectedMemberColor, marginTop: '2px', fontFamily: 'monospace', fontSize: '14px' }}>
                  {memberPercentage}%
                </div>
              </div>

              <div>
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>Trạng thái:</span>
                <div style={{ fontWeight: 700, color: memberStatus.color, marginTop: '2px' }}>
                  {memberStatus.label}
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>Email:</span>
                <div style={{ fontWeight: 600, color: '#cbd5e1', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Mail size={12} color="#94a3b8" />
                  {selectedMember.email || 'Chưa cung cấp'}
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#94a3b8', fontSize: '10px' }}>Ngày gia nhập:</span>
                <div style={{ fontWeight: 600, color: '#cbd5e1', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Calendar size={12} color="#94a3b8" />
                  {selectedMember.joinedAt
                    ? new Date(selectedMember.joinedAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : 'Chưa cập nhật'}
                </div>
              </div>
            </div>

            {/* Quick Action: If this is another member and current user has share, offer to transfer */}
            {currentUser?.id && selectedMember.userId !== currentUser.id && currentUserShare > 0 && (
              <button
                type="button"
                onClick={() => {
                  setRecipientUserId(selectedMember.userId);
                  setCurrentView('TRANSFER_FORM');
                  clearOwnerSelection();
                }}
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  background: 'linear-gradient(135deg, rgba(34, 230, 255, 0.2), rgba(14, 165, 233, 0.3))',
                  border: '1px solid #22e6ff',
                  borderRadius: '8px',
                  color: '#22e6ff',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Send size={13} />
                <span>Chuyển nhượng cổ phần cho {selectedMember.fullName}</span>
              </button>
            )}

            {/* Remove Member Action (Representative only) */}
            {canManage && selectedMember.userId !== currentUser?.id && (
              <div style={{ marginTop: '6px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                {confirmRemoveId === selectedMember.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#fca5a5' }}>
                      Xác nhận xóa thành viên {selectedMember.fullName} khỏi nhóm?
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => removeMutation.mutate(selectedMember.id)}
                        disabled={removeMutation.isPending}
                        style={{
                          flex: 1,
                          padding: '7px 10px',
                          background: 'rgba(239, 68, 68, 0.85)',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {removeMutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmRemoveId(null)}
                        style={{
                          padding: '7px 12px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmRemoveId(selectedMember.id)}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      color: '#f87171',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Xóa thành viên khỏi nhóm</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    );
  }

  // =========================================================================
  // VIEW MODE B: TRANSFER FORM
  // =========================================================================
  if (currentView === 'TRANSFER_FORM') {
    const isExceedingShare = transferPercentNumber > currentUserShare;
    const canSubmitTransfer =
      Boolean(recipientUserId) &&
      transferPercentNumber > 0 &&
      !isExceedingShare &&
      transferorConsentChecked === true &&
      Boolean(previewData?.contentHash) &&
      !createTransferMutation.isPending;

    return renderPortal(
      <aside
        className="evshare-ownership-panel"
        role="region"
        aria-label="Yêu cầu chuyển nhượng sở hữu"
        data-ui-interactive="true"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={panelStyle}
      >
        {renderHeader('YÊU CẦU CHUYỂN NHƯỢNG SỞ HỮU', `${vehicleCode} • Cổ phần của bạn: ${currentUserShare}%`, true)}

        <div
          style={{
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            flex: 1,
          }}
        >
          {/* Current Ownership Callout */}
          <div
            style={{
              background: 'rgba(34, 230, 255, 0.08)',
              border: '1px solid rgba(34, 230, 255, 0.3)',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Cổ phần hiện tại</span>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#22e6ff', marginTop: '1px' }}>
                {currentUser?.fullName || 'Bạn'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>Khả dụng chuyển nhượng</span>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#22e6ff', fontFamily: 'monospace' }}>
                {currentUserShare}%
              </div>
            </div>
          </div>

          {/* Form Field: Recipient Member */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
              Người nhận chuyển nhượng
            </label>
            <select
              value={recipientUserId}
              onChange={(e) => setRecipientUserId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                background: 'rgba(7, 20, 38, 0.95)',
                border: '1px solid rgba(34, 230, 255, 0.3)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '11.5px',
                outline: 'none',
              }}
            >
              {!Array.isArray(recipientCandidates) || recipientCandidates.length === 0 ? (
                <option value="">Không có thành viên khác trong nhóm</option>
              ) : (
                (Array.isArray(recipientCandidates) ? recipientCandidates : []).map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.fullName} ({m.share?.percentage ?? 0}%)
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Form Field: Transfer Percentage */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1' }}>
                Tỷ lệ chuyển nhượng (%)
              </label>
              {isExceedingShare && (
                <span style={{ fontSize: '10px', color: '#f87171', fontWeight: 600 }}>
                  Vượt quá cổ phần sở hữu ({currentUserShare}%)
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={currentUserShare}
                value={transferPercentageInput}
                onChange={(e) => setTransferPercentageInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  background: 'rgba(7, 20, 38, 0.95)',
                  border: isExceedingShare ? '1px solid #ef4444' : '1px solid rgba(34, 230, 255, 0.3)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  outline: 'none',
                  fontFamily: 'monospace',
                }}
              />
              {/* Quick shortcut chips */}
              {[5, 10, 20].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setTransferPercentageInput(pct.toFixed(2))}
                  style={{
                    padding: '6px 8px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    color: '#94a3b8',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {pct}%
                </button>
              ))}
              {currentUserShare > 0 && (
                <button
                  type="button"
                  onClick={() => setTransferPercentageInput(currentUserShare.toFixed(2))}
                  style={{
                    padding: '6px 8px',
                    background: 'rgba(34, 230, 255, 0.15)',
                    border: '1px solid #22e6ff',
                    borderRadius: '6px',
                    color: '#22e6ff',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Tối đa
                </button>
              )}
            </div>
          </div>

          {/* Form Field: Reason */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
              Lý do chuyển nhượng
            </label>
            <textarea
              rows={2}
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="Nhập lý do chuyển nhượng..."
              style={{
                width: '100%',
                padding: '8px 10px',
                background: 'rgba(7, 20, 38, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '11px',
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          {/* RELATED CONTRACT INFO BADGE */}
          <div
            style={{
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '8px',
              padding: '8px 10px',
              fontSize: '10.5px',
              color: '#d8b4fe',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
            }}
          >
            <FileText size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <span style={{ fontWeight: 700 }}>Tích hợp Hợp đồng điện tử:</span> Sau khi bên nhận chấp thuận, hệ thống tự động soạn thảo phụ lục điều chỉnh tỷ lệ cổ phần bảo toàn 100.00%.
            </div>
          </div>

          {/* REAL-TIME PREVIEW: BEFORE vs AFTER */}
          <div
            style={{
              background: 'rgba(7, 20, 38, 0.85)',
              border: '1.5px solid rgba(34, 230, 255, 0.35)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#22e6ff', textTransform: 'uppercase' }}>
                DỰ KIẾN PHÂN BỔ CỔ PHẦN
              </span>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid rgba(245, 158, 11, 0.5)',
                  color: '#fbbf24',
                }}
              >
                ĐÂY LÀ TỶ LỆ DỰ KIẾN
              </span>
            </div>

            {/* Live Distribution Table */}
            {isPreviewLoading ? (
              <div style={{ textAlign: 'center', padding: '12px 10px', fontSize: '11px', color: '#94a3b8' }}>
                <Loader2 size={16} className="animate-spin" style={{ display: 'inline', marginRight: '6px', color: '#22e6ff' }} />
                <span>ĐANG TẢI DỮ LIỆU CHUYỂN NHƯỢNG...</span>
              </div>
            ) : isPreviewError ? (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  padding: '10px',
                  textAlign: 'center',
                  color: '#fca5a5',
                  fontSize: '11px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '6px' }}>
                  <AlertCircle size={14} color="#ef4444" />
                  <span style={{ fontWeight: 700 }}>KHÔNG THỂ TẢI DỮ LIỆU CHUYỂN NHƯỢNG</span>
                </div>
                <div style={{ fontSize: '10px', color: '#cbd5e1', marginBottom: '8px' }}>
                  {previewError instanceof Error ? previewError.message : 'Vui lòng kiểm tra lại tỷ lệ hoặc người nhận'}
                </div>
                <button
                  type="button"
                  onClick={() => refetchPreview()}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '5px',
                    background: 'rgba(239, 68, 68, 0.25)',
                    border: '1px solid rgba(239, 68, 68, 0.6)',
                    color: '#ffffff',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <RefreshCw size={11} />
                  THỬ LẠI
                </button>
              </div>
            ) : previewData && Array.isArray(previewMembers) && previewMembers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                {(Array.isArray(previewMembers) ? previewMembers : []).map((m: any) => {
                  const currentPct = Number(m.currentPercentage ?? m.percentage ?? 0);
                  const proposedPct = Number(m.proposedPercentage ?? m.percentage ?? 0);
                  const delta = Number(m.deltaPercentage ?? (proposedPct - currentPct));
                  return (
                    <div
                      key={m.userId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '5px 8px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.03)',
                      }}
                    >
                      <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{m.fullName}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace' }}>
                        <span style={{ color: '#94a3b8' }}>{currentPct.toFixed(2)}%</span>
                        <ArrowRight size={11} color="#64748b" />
                        <span style={{ color: '#22e6ff', fontWeight: 800 }}>{proposedPct.toFixed(2)}%</span>
                        {delta !== 0 && (
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 700,
                              color: delta > 0 ? '#10b981' : '#f87171',
                            }}
                          >
                            ({delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)}%)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '6px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '10.5px',
                    fontWeight: 700,
                  }}
                >
                  <span style={{ color: '#94a3b8' }}>Tổng phân bổ nhóm:</span>
                  <span style={{ color: '#10b981', fontFamily: 'monospace' }}>
                    {(Array.isArray(previewMembers) ? previewMembers : []).reduce((sum, m) => sum + Number(m.proposedPercentage ?? m.percentage ?? 0), 0).toFixed(2)}% (Bảo toàn)
                  </span>
                </div>

                {!previewData.valid && previewData.validationMessage && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      color: '#fca5a5',
                      fontSize: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <AlertTriangle size={12} color="#ef4444" style={{ flexShrink: 0 }} />
                    <span>{previewData.validationMessage}</span>
                  </div>
                )}

                {previewData.hasOutstandingFinancialObligations && (
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      color: '#fde68a',
                      fontSize: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <AlertTriangle size={12} color="#f59e0b" style={{ flexShrink: 0 }} />
                    <span>{previewData.financialObligationMessage || previewData.financialObligationWarning || 'NGHĨA VỤ TÀI CHÍNH CHƯA HOÀN TẤT'}</span>
                  </div>
                )}
                {/* Proposed Contract Amendment Preview (Section 3 & Section 5) */}
                {previewData.contractVersionFormatted && (
                  <div
                    style={{
                      background: 'rgba(168, 85, 247, 0.08)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      borderRadius: '8px',
                      padding: '10px',
                      marginTop: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={13} color="#c084fc" />
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#e9d5ff' }}>
                          PHỤ LỤC HỢP ĐỒNG DỰ KIẾN ({previewData.contractVersionFormatted})
                        </span>
                      </div>
                      {previewData.contentSnapshot && (
                        <button
                          type="button"
                          id="btn-view-appendix-form"
                          onClick={() => setShowAmendmentSnapshotInForm(!showAmendmentSnapshotInForm)}
                          style={{
                            padding: '4px 8px',
                            background: showAmendmentSnapshotInForm ? 'rgba(34, 230, 255, 0.2)' : 'rgba(34, 230, 255, 0.1)',
                            border: '1px solid rgba(34, 230, 255, 0.4)',
                            borderRadius: '4px',
                            color: '#22e6ff',
                            fontSize: '10px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {showAmendmentSnapshotInForm ? 'ẨN PHỤ LỤC' : 'XEM PHỤ LỤC CHUYỂN NHƯỢNG'}
                        </button>
                      )}
                    </div>

                    {showAmendmentSnapshotInForm && previewData.contentSnapshot && (
                      <div
                        style={{
                          background: 'rgba(0, 0, 0, 0.4)',
                          borderRadius: '6px',
                          padding: '8px',
                          color: '#cbd5e1',
                          fontFamily: 'monospace',
                          fontSize: '9.5px',
                          lineHeight: 1.4,
                          whiteSpace: 'pre-line',
                          maxHeight: '180px',
                          overflowY: 'auto',
                          marginBottom: '8px',
                        }}
                      >
                        {previewData.contentSnapshot}
                      </div>
                    )}

                    {previewData.contentHash && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9.5px', color: '#94a3b8', marginBottom: '8px' }}>
                        <span>Mã băm nội dung (SHA-256):</span>
                        <span style={{ color: '#22e6ff', fontFamily: 'monospace' }}>
                          {previewData.contentHash.substring(0, 16)}...
                        </span>
                      </div>
                    )}

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '10.5px', color: '#f1f5f9' }}>
                      <input
                        type="checkbox"
                        id="chk-transferor-consent-form"
                        checked={transferorConsentChecked}
                        onChange={(e) => setTransferorConsentChecked(e.target.checked)}
                        style={{ marginTop: '2px', accentColor: '#22e6ff' }}
                      />
                      <span style={{ fontWeight: 600 }}>
                        Tôi đã đọc, hiểu và đồng ý chuyển nhượng theo đúng nội dung phụ lục này.
                      </span>
                    </label>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '10.5px', color: '#64748b', textAlign: 'center', padding: '6px' }}>
                Vui lòng chọn người nhận và tỷ lệ hợp lệ để xem trước
              </div>
            )}
          </div>

          {/* Feedback messages */}
          {transferFormError && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '8px 10px',
                color: '#fca5a5',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <AlertCircle size={13} />
              <span>{transferFormError}</span>
            </div>
          )}

          {transferSuccessMsg && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '8px',
                padding: '8px 10px',
                color: '#6ee7b7',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle2 size={13} />
              <span>{transferSuccessMsg}</span>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="button"
            disabled={!canSubmitTransfer}
            onClick={() => {
              if (canSubmitTransfer) {
                createTransferMutation.mutate({
                  toUserId: recipientUserId,
                  transferPercentage: transferPercentNumber,
                  reason: transferReason,
                  contentHash: previewData?.contentHash,
                  acknowledgedTerms: true,
                });
              }
            }}
            style={{
              marginTop: '4px',
              padding: '10px 14px',
              background: canSubmitTransfer
                ? 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)'
                : 'rgba(255, 255, 255, 0.08)',
              border: canSubmitTransfer ? '1.5px solid #22e6ff' : 'none',
              borderRadius: '10px',
              color: canSubmitTransfer ? '#ffffff' : '#64748b',
              fontSize: '12px',
              fontWeight: 800,
              cursor: canSubmitTransfer ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: canSubmitTransfer ? '0 4px 16px rgba(34, 230, 255, 0.25)' : 'none',
            }}
          >
            {createTransferMutation.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Đang xử lý yêu cầu...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>GỬI YÊU CẦU CHUYỂN NHƯỢNG</span>
              </>
            )}
          </button>
        </div>
      </aside>
    );
  }

  // =========================================================================
  // VIEW MODE C: INCOMING TRANSFER REQUESTS (Recipient Acceptance UI)
  // =========================================================================
  if (currentView === 'INCOMING_TRANSFERS') {
    return renderPortal(
      <aside
        className="evshare-ownership-panel"
        role="region"
        aria-label="Yêu cầu nhận chuyển nhượng"
        data-ui-interactive="true"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={panelStyle}
      >
        {renderHeader(
          'QUẢN LÝ CHUYỂN NHƯỢNG CỔ PHẦN',
          outgoingTransfers.length > 0
            ? 'Theo dõi & xác nhận giao dịch chuyển nhượng'
            : 'Phụ lục hợp đồng & xác nhận đồng sở hữu',
          true
        )}

        <div
          style={{
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            flex: 1,
          }}
        >
          {isLoadingIncoming ? (
            <div
              style={{
                background: 'rgba(7, 20, 38, 0.65)',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '24px 16px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '11.5px',
              }}
            >
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: '#22e6ff' }} />
              <div style={{ fontWeight: 700, color: '#e2e8f0' }}>ĐANG TẢI PHỤ LỤC CHUYỂN NHƯỢNG...</div>
            </div>
          ) : isErrorIncoming ? (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '12px',
                padding: '20px 16px',
                textAlign: 'center',
                color: '#fca5a5',
                fontSize: '11.5px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={24} color="#ef4444" />
              <div style={{ fontWeight: 700 }}>KHÔNG THỂ TẢI NỘI DUNG PHỤ LỤC</div>
              <button
                type="button"
                onClick={() => refetchIncoming()}
                style={{
                  marginTop: '4px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.25)',
                  border: '1px solid rgba(239, 68, 68, 0.6)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <RefreshCw size={12} />
                THỬ LẠI
              </button>
            </div>
          ) : (!Array.isArray(safeIncomingTransfers) || safeIncomingTransfers.length === 0) &&
              (!Array.isArray(notifiedGroupTransfers) || notifiedGroupTransfers.length === 0) &&
              (!Array.isArray(outgoingTransfers) || outgoingTransfers.length === 0) ? (
            <div
              style={{
                background: 'rgba(7, 20, 38, 0.65)',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '24px 16px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '11.5px',
              }}
            >
              <Clock size={24} color="#64748b" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '4px' }}>CHƯA CÓ YÊU CẦU CHUYỂN NHƯỢNG</div>
              <div>Không có yêu cầu chuyển nhượng nào đang chờ bạn xử lý.</div>
            </div>
          ) : (
            <>
            {(Array.isArray(safeIncomingTransfers) ? safeIncomingTransfers : []).map((req) => {
              const statusCfg = getTransferDisplayStatus(req);
              const displayStatusLabel = statusCfg.label;
              const isRejecting = rejectingTransferId === req.id;

              const isTransferorAccepted = Boolean(req.transferorAccepted ?? req.isTransferorAccepted);
              const isRecipientAccepted = Boolean(req.recipientAccepted ?? req.isRecipientAccepted);
              const currentId = String(currentUser?.id || '').toLowerCase();
              const isRecipient = currentId === String(req.toUserId ?? req.recipientUserId ?? '').toLowerCase();
              const isTransferor = currentId === String(req.fromUserId ?? req.transferorUserId ?? '').toLowerCase();
              const isPending = req.status === 'PENDING_ACCEPTANCE' || req.status === 'PENDING_CONTRACT';
              const showRecipientAction = (isRecipient || Boolean(req.currentUserCanAccept)) && !isRecipientAccepted && isPending;

              const isAppendixOpen = Boolean(openedAppendixIds[req.id]);
              const hasSnapshot = Boolean(req.contentSnapshot && req.contentSnapshot.trim().length > 0);
              const hasReviewed = Boolean(isAppendixOpen || reviewedHashes[req.id]);
              const isHashMatching = Boolean(!req.contentHash || !reviewedHashes[req.id] || reviewedHashes[req.id] === 'REVIEWED' || reviewedHashes[req.id] === req.contentHash);
              const isConsentChecked = Boolean(recipientConsentChecked[req.id]);

              const canSubmitAcceptance = Boolean(
                showRecipientAction &&
                hasSnapshot &&
                hasReviewed &&
                isConsentChecked &&
                !acceptTransferMutation.isPending
              );

              return (
                <div
                  key={req.id}
                  style={{
                    background: 'rgba(7, 20, 38, 0.85)',
                    border: '1.5px solid rgba(34, 230, 255, 0.3)',
                    borderRadius: '14px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>Người chuyển nhượng</span>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                        {req.fromUserName}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>{req.fromUserEmail}</div>
                    </div>
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        background: `${statusCfg.color}20`,
                        border: `1px solid ${statusCfg.color}60`,
                        color: statusCfg.color,
                      }}
                    >
                      {displayStatusLabel}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '11px',
                    }}
                  >
                    <div>
                      <span style={{ color: '#94a3b8', fontSize: '9.5px' }}>Phương tiện:</span>
                      <div style={{ fontWeight: 700, color: '#e2e8f0' }}>{req.vehicleName || vehicleCode}</div>
                    </div>
                    <div>
                      <span style={{ color: '#94a3b8', fontSize: '9.5px' }}>Tỷ lệ nhận:</span>
                      <div style={{ fontWeight: 800, color: '#10b981', fontFamily: 'monospace' }}>
                        +{req.transferPercentage}%
                      </div>
                    </div>
                  </div>

                  {/* Projected ownership distribution preview (Section 2 & 10) */}
                  <div
                    style={{
                      background: 'rgba(0, 242, 254, 0.04)',
                      border: '1px solid rgba(0, 242, 254, 0.2)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '11px',
                    }}
                  >
                    <div style={{ color: '#00f2fe', fontWeight: 700, fontSize: '10px', marginBottom: '5px', textTransform: 'uppercase' }}>
                      Điều chỉnh tỷ lệ cổ phần dự kiến:
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ color: '#94a3b8' }}>Người chuyển ({req.fromUserName}):</span>
                      <span style={{ color: '#ffffff', fontFamily: 'monospace' }}>
                        {Number(req.fromUserCurrentPercentage ?? 0).toFixed(2)}% ➔ {Math.max(0, Number(req.fromUserCurrentPercentage ?? 0) - Number(req.transferPercentage)).toFixed(2)}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Bạn ({req.toUserName}):</span>
                      <span style={{ color: '#10b981', fontWeight: 700, fontFamily: 'monospace' }}>
                        {Number(req.toUserCurrentPercentage ?? 0).toFixed(2)}% ➔ {(Number(req.toUserCurrentPercentage ?? 0) + Number(req.transferPercentage)).toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {req.reason && (
                    <div style={{ fontSize: '10.5px', color: '#cbd5e1', fontStyle: 'italic' }}>
                      "{req.reason}"
                    </div>
                  )}

                  {/* Section 2: View Appendix Action (Position: Below projected ownership distribution, Above acceptance checkbox) */}
                  {!hasSnapshot ? (
                    <div
                      style={{
                        background: 'rgba(245, 158, 11, 0.12)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#fbbf24',
                        fontSize: '11px',
                      }}
                    >
                      <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 800 }}>CHƯA CÓ PHỤ LỤC ĐỂ XEM</div>
                        <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '2px' }}>
                          Phụ lục chuyển nhượng chưa sẵn sàng để phê duyệt. Không thể tiếp nhận chuyển nhượng khi chưa có văn bản chính thức.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        type="button"
                        id={`btn-view-appendix-${req.id}`}
                        onClick={() => {
                          const nextState = !isAppendixOpen;
                          setOpenedAppendixIds((prev) => ({ ...prev, [req.id]: nextState }));
                          if (nextState) {
                            setReviewedHashes((prev) => ({ ...prev, [req.id]: req.contentHash || 'REVIEWED' }));
                          }
                        }}
                        style={{
                          padding: '10px 14px',
                          background: isAppendixOpen
                            ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)'
                            : 'rgba(0, 242, 254, 0.08)',
                          border: isAppendixOpen
                            ? '1.5px solid rgba(0, 242, 254, 0.6)'
                            : '1px solid rgba(0, 242, 254, 0.35)',
                          borderRadius: '8px',
                          color: '#00f2fe',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxShadow: isAppendixOpen ? '0 0 14px rgba(0, 242, 254, 0.2)' : 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={15} color="#00f2fe" />
                          <span>{isAppendixOpen ? 'ẨN PHỤ LỤC CHUYỂN NHƯỢNG' : 'XEM PHỤ LỤC CHUYỂN NHƯỢNG'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isRecipientAccepted ? (
                            <span
                              style={{
                                fontSize: '9.5px',
                                fontWeight: 800,
                                color: '#10b981',
                                background: 'rgba(16, 185, 129, 0.2)',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                border: '1px solid rgba(16, 185, 129, 0.5)',
                              }}
                            >
                              ĐÃ XÁC NHẬN CHẤP THUẬN
                            </span>
                          ) : hasReviewed ? (
                            <span
                              style={{
                                fontSize: '9.5px',
                                fontWeight: 800,
                                color: '#00f2fe',
                                background: 'rgba(0, 242, 254, 0.15)',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                border: '1px solid rgba(0, 242, 254, 0.45)',
                              }}
                            >
                              ĐÃ XEM PHỤ LỤC
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '9.5px',
                                fontWeight: 800,
                                color: '#fbbf24',
                                background: 'rgba(245, 158, 11, 0.15)',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                border: '1px solid rgba(245, 158, 11, 0.45)',
                              }}
                            >
                              CHƯA XEM PHỤ LỤC
                            </span>
                          )}
                          {isAppendixOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </div>
                      </button>

                      {/* Expandable Appendix Viewer within existing panel (Section 2, 3, 10) */}
                      {isAppendixOpen && (
                        <div
                          style={{
                            background: 'rgba(4, 10, 20, 0.95)',
                            border: '1.5px solid rgba(0, 242, 254, 0.35)',
                            borderRadius: '10px',
                            padding: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                          }}
                        >
                          {/* Document Header & Metadata (Section 3) */}
                          <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ShieldCheck size={15} color="#00f2fe" />
                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc' }}>
                                  {req.contractVersionTitle || `PHỤ LỤC HỢP ĐỒNG ${req.contractVersionFormatted || 'V2.0'}`}
                                </span>
                              </div>
                              <span
                                style={{
                                  fontSize: '9.5px',
                                  fontWeight: 800,
                                  padding: '2px 7px',
                                  borderRadius: '4px',
                                  background: 'rgba(34, 230, 255, 0.15)',
                                  color: '#22e6ff',
                                  border: '1px solid rgba(34, 230, 255, 0.4)',
                                }}
                              >
                                {req.contractVersionFormatted || 'V2.0'}
                              </span>
                            </div>

                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '6px',
                                fontSize: '9.5px',
                                color: '#94a3b8',
                                background: 'rgba(255, 255, 255, 0.02)',
                                borderRadius: '6px',
                                padding: '6px 8px',
                              }}
                            >
                              <div>
                                Hợp đồng gốc: <span style={{ color: '#ffffff', fontFamily: 'monospace', fontWeight: 700 }}>{req.contractCode || 'HĐ-EV01'}</span>
                              </div>
                              <div>
                                Mã phụ lục: <span style={{ color: '#ffffff', fontFamily: 'monospace' }}>{req.contractVersionId ? req.contractVersionId.substring(0, 8) + '...' : 'V2.0'}</span>
                              </div>
                              <div>
                                Mã yêu cầu: <span style={{ color: '#ffffff', fontFamily: 'monospace' }}>{req.id ? req.id.substring(0, 8) + '...' : 'N/A'}</span>
                              </div>
                              <div>
                                Phương tiện: <span style={{ color: '#e2e8f0' }}>{req.vehicleName || 'VinFast VF8'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Scrollable Document Content (Section 3 & 10) */}
                          <div
                            style={{
                              background: 'rgba(0, 0, 0, 0.6)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '6px',
                              padding: '10px',
                              color: '#cbd5e1',
                              fontFamily: 'monospace',
                              fontSize: '9.5px',
                              lineHeight: 1.5,
                              whiteSpace: 'pre-line',
                              maxHeight: '260px',
                              overflowY: 'auto',
                            }}
                          >
                            {req.contentSnapshot}
                          </div>

                          {/* Document Integrity Seal (Content Hash) */}
                          {req.contentHash && (
                            <div
                              style={{
                                background: 'rgba(0, 242, 254, 0.05)',
                                border: '1px dashed rgba(0, 242, 254, 0.3)',
                                borderRadius: '6px',
                                padding: '6px 8px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                                fontSize: '9px',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#94a3b8' }}>Mã băm toàn vẹn tài liệu (SHA-256):</span>
                                <span style={{ color: '#10b981', fontWeight: 700 }}>Niêm phong bất biến</span>
                              </div>
                              <div style={{ color: '#00f2fe', fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '8.5px' }}>
                                {req.contentHash}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions for recipient awaiting acceptance */}
                  {showRecipientAction && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        marginTop: '8px',
                        background: 'rgba(15, 23, 42, 0.95)',
                        border: '1.2px solid rgba(0, 242, 254, 0.4)',
                        borderRadius: '10px',
                        padding: '10px',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                      }}
                    >
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                          cursor: (!hasSnapshot || !hasReviewed) ? 'not-allowed' : 'pointer',
                          fontSize: '10.5px',
                          color: (!hasSnapshot || !hasReviewed) ? '#64748b' : '#f1f5f9',
                          background: isConsentChecked
                            ? 'rgba(16, 185, 129, 0.08)'
                            : 'rgba(255, 255, 255, 0.02)',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: isConsentChecked
                            ? '1px solid rgba(16, 185, 129, 0.3)'
                            : '1px dashed rgba(255, 255, 255, 0.12)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <input
                          type="checkbox"
                          id={`chk-consent-${req.id}`}
                          disabled={!hasSnapshot || !hasReviewed}
                          checked={isConsentChecked}
                          onChange={(e) => {
                            if (!hasSnapshot || !hasReviewed) return;
                            setRecipientConsentChecked((prev) => ({ ...prev, [req.id]: e.target.checked }));
                            setAcceptError((prev) => ({ ...prev, [req.id]: null }));
                          }}
                          style={{
                            marginTop: '2px',
                            accentColor: '#10b981',
                            cursor: (!hasSnapshot || !hasReviewed) ? 'not-allowed' : 'pointer',
                          }}
                        />
                        <div>
                          <span style={{ fontWeight: 600 }}>
                            Tôi đã đọc, hiểu và đồng ý nhận chuyển nhượng theo phụ lục này.
                          </span>
                          {!hasSnapshot ? (
                            <div style={{ color: '#f59e0b', fontSize: '9.5px', marginTop: '3px' }}>
                              * Chưa có phụ lục chuyển nhượng để xem xét. Tiếp nhận bị khóa.
                            </div>
                          ) : !hasReviewed ? (
                            <div style={{ color: '#f59e0b', fontSize: '9.5px', marginTop: '3px' }}>
                              * Vui lòng bấm <strong>"XEM PHỤ LỤC CHUYỂN NHƯỢNG"</strong> để đọc toàn văn điều khoản trước khi xác nhận đồng ý.
                            </div>
                          ) : !isHashMatching ? (
                            <div style={{ color: '#ef4444', fontSize: '9.5px', marginTop: '3px' }}>
                              * Nội dung phụ lục đã có sự thay đổi. Vui lòng mở xem lại bản mới nhất trước khi xác nhận.
                            </div>
                          ) : null}
                        </div>
                      </label>

                      {acceptError[req.id] && (
                        <div
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            color: '#fca5a5',
                            fontSize: '10px',
                          }}
                        >
                          {acceptError[req.id]}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          id={`btn-accept-${req.id}`}
                          onClick={() => {
                            if (!hasSnapshot) {
                              setAcceptError((prev) => ({
                                ...prev,
                                [req.id]: 'Chưa có phụ lục chuyển nhượng để tiếp nhận.',
                              }));
                              return;
                            }
                            if (!hasReviewed) {
                              setAcceptError((prev) => ({
                                ...prev,
                                [req.id]: 'Vui lòng nhấn "XEM PHỤ LỤC CHUYỂN NHƯỢNG" để kiểm tra nội dung trước khi tiếp nhận.',
                              }));
                              return;
                            }
                            if (!isConsentChecked) {
                              setAcceptError((prev) => ({
                                ...prev,
                                [req.id]: 'Vui lòng xác nhận bạn đã đọc, hiểu và đồng ý nhận chuyển nhượng theo nội dung phụ lục này.',
                              }));
                              return;
                            }
                            if (req.contentHash && reviewedHashes[req.id] && req.contentHash !== reviewedHashes[req.id]) {
                              setAcceptError((prev) => ({
                                ...prev,
                                [req.id]: 'Nội dung phụ lục đã có sự thay đổi. Vui lòng mở xem lại bản mới nhất trước khi xác nhận.',
                              }));
                              return;
                            }
                            acceptTransferMutation.mutate({
                              transferId: req.id,
                              payload: {
                                contentHash: req.contentHash,
                                acknowledgedTerms: true,
                                confirmationNote: 'Đồng ý nhận chuyển nhượng cổ phần và chấp thuận phụ lục hợp đồng',
                              },
                            });
                          }}
                          disabled={!canSubmitAcceptance}
                          style={{
                            flex: 2,
                            padding: '9px 12px',
                            background: !canSubmitAcceptance
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            color: !canSubmitAcceptance ? '#94a3b8' : '#ffffff',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: !canSubmitAcceptance ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            boxShadow: canSubmitAcceptance ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none',
                          }}
                        >
                          {acceptTransferMutation.isPending ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              <span>Đang ghi nhận...</span>
                            </>
                          ) : (
                            <>
                              <Check size={13} />
                              <span>ĐỒNG Ý NHẬN CHUYỂN NHƯỢNG</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setRejectingTransferId(req.id)}
                          style={{
                            flex: 1,
                            padding: '9px 12px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            borderRadius: '8px',
                            color: '#f87171',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          TỪ CHỐI
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Notice if recipient already signed */}
                  {isRecipientAccepted && (
                    <div
                      style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        fontSize: '10.5px',
                        color: '#6ee7b7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={14} color="#10b981" />
                        <span>Bạn đã hoàn tất ký xác nhận Phụ lục hợp đồng.</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
                        <span style={{ color: '#38bdf8', fontSize: '10px', fontWeight: 700 }}>
                          Xác nhận hai bên: {req.acceptedConsentCount ?? req.acceptedMembersCount ?? ((isTransferorAccepted ? 1 : 0) + (isRecipientAccepted ? 1 : 0))}/{req.requiredConsentCount ?? req.requiredAcceptanceCount ?? 2}
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: '9px' }}>
                          Phê duyệt bổ sung: {req.additionalApprovalStatus || 'Không yêu cầu'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Section 3: Exact Transfer-Specific Acceptance Progress Breakdown */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      fontSize: '10.5px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase' }}>
                        XÁC NHẬN CHUYỂN NHƯỢNG: {req.acceptedConsentCount ?? req.acceptedMembersCount ?? ((isTransferorAccepted ? 1 : 0) + (isRecipientAccepted ? 1 : 0))}/{req.requiredConsentCount ?? req.requiredAcceptanceCount ?? 2}
                      </span>
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          color: (req.status === 'COMPLETED' || (isTransferorAccepted && isRecipientAccepted)) ? '#10b981' : '#f59e0b',
                        }}
                      >
                        {req.status === 'COMPLETED'
                          ? 'CHUYỂN NHƯỢNG THÀNH CÔNG'
                          : (isTransferorAccepted && isRecipientAccepted)
                          ? (req.canFinalize ?? req.canComplete ? 'ĐỦ ĐIỀU KIỆN HOÀN TẤT' : 'CHỜ HOÀN TẤT ĐIỀU KIỆN')
                          : isTransferorAccepted
                          ? 'CHỜ NGƯỜI NHẬN XÁC NHẬN'
                          : isRecipientAccepted
                          ? 'CHỜ NGƯỜI CHUYỂN XÁC NHẬN'
                          : 'CHỜ XÁC NHẬN CỦA HAI BÊN'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#cbd5e1' }}>{req.fromUserName} (Bên chuyển nhượng):</span>
                        <span style={{ color: isTransferorAccepted ? '#10b981' : '#f59e0b', fontWeight: 700, fontFamily: 'monospace', fontSize: '10px' }}>
                          {isTransferorAccepted ? 'Đã xác nhận' : 'Chờ xác nhận'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#cbd5e1' }}>{req.toUserName} (Bên nhận chuyển nhượng):</span>
                        <span style={{ color: isRecipientAccepted ? '#10b981' : '#f59e0b', fontWeight: 700, fontFamily: 'monospace', fontSize: '10px' }}>
                          {isRecipientAccepted ? 'Đã xác nhận' : 'Chờ xác nhận'}
                        </span>
                      </div>
                      {activeMembers
                        .filter((m) => m && m.userId !== req.fromUserId && m.userId !== req.toUserId)
                        .map((m) => (
                          <div key={`co-owner-status-${m.userId}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#94a3b8' }}>{m.fullName || m.email || 'Thành viên khác'} (Đồng sở hữu):</span>
                            <span style={{ color: '#38bdf8', fontSize: '9.5px', fontWeight: 600 }}>Được thông báo</span>
                          </div>
                        ))}
                    </div>

                    {req.nextRequiredActions && req.nextRequiredActions.length > 0 && req.status !== 'COMPLETED' && (
                      <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px dashed rgba(56, 189, 248, 0.3)', borderRadius: '6px', padding: '6px 8px', fontSize: '9.5px', color: '#bae6fd', marginTop: '2px' }}>
                        <span style={{ fontWeight: 700, color: '#38bdf8' }}>Tiếp theo: </span>
                        {req.nextRequiredActions.join(' ')}
                      </div>
                    )}

                    {/* Finalization Blockers if any */}
                    {req.finalizationBlockers && req.finalizationBlockers.length > 0 && isTransferorAccepted && isRecipientAccepted && req.status !== 'COMPLETED' && (
                      <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '6px', padding: '6px 8px', fontSize: '10px', color: '#fde68a' }}>
                        <div style={{ fontWeight: 700, marginBottom: '2px' }}>Điều kiện chờ hoàn tất:</div>
                        {req.finalizationBlockers.map((b, idx) => (
                          <div key={idx}>• {b}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reject reason input prompt */}
                  {isRejecting && (
                    <div
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <label style={{ fontSize: '10.5px', color: '#fca5a5', fontWeight: 600 }}>
                        Lý do từ chối:
                      </label>
                      <input
                        type="text"
                        value={rejectReasonInput}
                        onChange={(e) => setRejectReasonInput(e.target.value)}
                        style={{
                          padding: '6px 8px',
                          background: 'rgba(0,0,0,0.4)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '11px',
                          outline: 'none',
                        }}
                      />
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '2px' }}>
                        <button
                          type="button"
                          onClick={() => setRejectingTransferId(null)}
                          style={{
                            padding: '4px 8px',
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            fontSize: '10px',
                            cursor: 'pointer',
                          }}
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            rejectTransferMutation.mutate({
                              transferId: req.id,
                              reason: rejectReasonInput,
                            })
                          }
                          style={{
                            padding: '4px 10px',
                            background: '#ef4444',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#ffffff',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Xác nhận từ chối
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Ready to Complete Activation */}
                  {((req.canFinalize ?? req.canComplete) || (isTransferorAccepted && isRecipientAccepted && req.status !== 'COMPLETED' && (!req.finalizationBlockers || req.finalizationBlockers.length === 0))) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <button
                        type="button"
                        id={`btn-complete-${req.id}`}
                        onClick={() => {
                          setCompleteError((prev) => ({ ...prev, [req.id]: null }));
                          completeTransferMutation.mutate(req.id);
                        }}
                        disabled={completeTransferMutation.isPending}
                        style={{
                          padding: '9px 12px',
                          background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                          border: '1.5px solid #22e6ff',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: '0 0 15px rgba(34, 230, 255, 0.3)',
                        }}
                      >
                        {completeTransferMutation.isPending ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Đang hoàn tất...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} color="#22e6ff" />
                            <span>HOÀN TẤT CHUYỂN NHƯỢNG</span>
                          </>
                        )}
                      </button>
                      {completeError[req.id] && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', padding: '6px 8px', color: '#fca5a5', fontSize: '10px' }}>
                          {completeError[req.id]}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Completed Success Notice */}
                  {req.status === 'COMPLETED' && (
                    <div
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid #10b981',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#6ee7b7',
                        fontSize: '11px',
                      }}
                    >
                      <CheckCircle2 size={16} color="#10b981" />
                      <div>
                        <div style={{ fontWeight: 800 }}>CHUYỂN NHƯỢNG THÀNH CÔNG</div>
                        <div style={{ fontSize: '10px', color: '#a7f3d0' }}>
                          Giao dịch chuyển nhượng cổ phần đã hoàn tất và được ghi nhận vào lịch sử sở hữu.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Render Outgoing Transfers Initiated by Current User (e.g. Tran Thi B) */}
            {outgoingTransfers.map((req) => {
              const statusCfg = getTransferDisplayStatus(req);
              const isTransferorAccepted = Boolean(req.transferorAccepted ?? req.isTransferorAccepted);
              const isRecipientAccepted = Boolean(req.recipientAccepted ?? req.isRecipientAccepted);

              const isAppendixOpen = Boolean(openedAppendixIds[req.id]);
              const hasSnapshot = Boolean(req.contentSnapshot && req.contentSnapshot.trim().length > 0);
              const isHashMatching = Boolean(req.contentHash && (reviewedHashes[req.id] === req.contentHash || !reviewedHashes[req.id]));
              const hasReviewed = Boolean(isAppendixOpen || reviewedHashes[req.id]);
              const isConsentChecked = Boolean(recipientConsentChecked[req.id]);

              const canSubmitTransferorConsent = Boolean(
                !isTransferorAccepted &&
                (req.status === 'PENDING_ACCEPTANCE' || req.status === 'PENDING_CONTRACT') &&
                hasSnapshot &&
                hasReviewed &&
                isConsentChecked &&
                !confirmTransferorConsentMutation.isPending
              );

              return (
                <div
                  key={`outgoing-${req.id}`}
                  style={{
                    background: 'rgba(7, 20, 38, 0.85)',
                    border: '1.5px solid rgba(168, 85, 247, 0.35)',
                    borderRadius: '14px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: '#c084fc' }}>Yêu cầu chuyển nhượng bạn đã gửi</span>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                        Người nhận: {req.toUserName}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>{req.toUserEmail}</div>
                    </div>
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        background: `${statusCfg.color}20`,
                        border: `1px solid ${statusCfg.color}60`,
                        color: statusCfg.color,
                      }}
                    >
                      {statusCfg.label}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '11px',
                    }}
                  >
                    <div>
                      <span style={{ color: '#94a3b8', fontSize: '9.5px' }}>Phương tiện:</span>
                      <div style={{ fontWeight: 700, color: '#e2e8f0' }}>{req.vehicleName || vehicleCode}</div>
                    </div>
                    <div>
                      <span style={{ color: '#94a3b8', fontSize: '9.5px' }}>Tỷ lệ chuyển giao:</span>
                      <div style={{ fontWeight: 800, color: '#f59e0b', fontFamily: 'monospace' }}>
                        -{req.transferPercentage}%
                      </div>
                    </div>
                  </div>

                  {/* Projected ownership distribution preview */}
                  <div
                    style={{
                      background: 'rgba(168, 85, 247, 0.06)',
                      border: '1px solid rgba(168, 85, 247, 0.25)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '11px',
                    }}
                  >
                    <div style={{ color: '#c084fc', fontWeight: 700, fontSize: '10px', marginBottom: '5px', textTransform: 'uppercase' }}>
                      Điều chỉnh tỷ lệ cổ phần dự kiến:
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ color: '#94a3b8' }}>Bạn ({req.fromUserName}):</span>
                      <span style={{ color: '#ffffff', fontFamily: 'monospace' }}>
                        {Number(req.fromUserCurrentPercentage ?? 0).toFixed(2)}% ➔ {Math.max(0, Number(req.fromUserCurrentPercentage ?? 0) - Number(req.transferPercentage)).toFixed(2)}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Người nhận ({req.toUserName}):</span>
                      <span style={{ color: '#10b981', fontWeight: 700, fontFamily: 'monospace' }}>
                        {Number(req.toUserCurrentPercentage ?? 0).toFixed(2)}% ➔ {(Number(req.toUserCurrentPercentage ?? 0) + Number(req.transferPercentage)).toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Section 3: Exact Transfer-Specific Acceptance Progress Breakdown */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      fontSize: '10.5px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase' }}>
                        XÁC NHẬN CHUYỂN NHƯỢNG: {req.acceptedConsentCount ?? req.acceptedMembersCount ?? ((isTransferorAccepted ? 1 : 0) + (isRecipientAccepted ? 1 : 0))}/{req.requiredConsentCount ?? req.requiredAcceptanceCount ?? 2}
                      </span>
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          color: (req.status === 'COMPLETED' || (isTransferorAccepted && isRecipientAccepted)) ? '#10b981' : '#f59e0b',
                        }}
                      >
                        {req.status === 'COMPLETED'
                          ? 'CHUYỂN NHƯỢNG THÀNH CÔNG'
                          : (isTransferorAccepted && isRecipientAccepted)
                          ? (req.canFinalize ?? req.canComplete ? 'ĐỦ ĐIỀU KIỆN HOÀN TẤT' : 'CHỜ HOÀN TẤT ĐIỀU KIỆN')
                          : isTransferorAccepted
                          ? 'CHỜ NGƯỜI NHẬN XÁC NHẬN'
                          : isRecipientAccepted
                          ? 'CHỜ NGƯỜI CHUYỂN XÁC NHẬN'
                          : 'CHỜ XÁC NHẬN CỦA HAI BÊN'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#cbd5e1' }}>{req.fromUserName} (Bên chuyển nhượng):</span>
                        <span style={{ color: isTransferorAccepted ? '#10b981' : '#f59e0b', fontWeight: 700, fontFamily: 'monospace', fontSize: '10px' }}>
                          {isTransferorAccepted ? 'Đã xác nhận' : 'Chờ xác nhận'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#cbd5e1' }}>{req.toUserName} (Bên nhận chuyển nhượng):</span>
                        <span style={{ color: isRecipientAccepted ? '#10b981' : '#f59e0b', fontWeight: 700, fontFamily: 'monospace', fontSize: '10px' }}>
                          {isRecipientAccepted ? 'Đã xác nhận' : 'Chờ xác nhận'}
                        </span>
                      </div>
                      {activeMembers
                        .filter((m) => m && m.userId !== req.fromUserId && m.userId !== req.toUserId)
                        .map((m) => (
                          <div key={`co-owner-status-${m.userId}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#94a3b8' }}>{m.fullName || m.email || 'Thành viên khác'} (Đồng sở hữu):</span>
                            <span style={{ color: '#38bdf8', fontSize: '9.5px', fontWeight: 600 }}>Đã được thông báo</span>
                          </div>
                        ))}
                    </div>

                    {req.nextRequiredActions && req.nextRequiredActions.length > 0 && req.status !== 'COMPLETED' && (
                      <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px dashed rgba(56, 189, 248, 0.3)', borderRadius: '6px', padding: '6px 8px', fontSize: '9.5px', color: '#bae6fd', marginTop: '2px' }}>
                        <span style={{ fontWeight: 700, color: '#38bdf8' }}>Tiếp theo: </span>
                        {req.nextRequiredActions.join(' ')}
                      </div>
                    )}

                    {/* Finalization Blockers if any */}
                    {req.finalizationBlockers && req.finalizationBlockers.length > 0 && isTransferorAccepted && isRecipientAccepted && req.status !== 'COMPLETED' && (
                      <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '6px', padding: '6px 8px', fontSize: '10px', color: '#fde68a' }}>
                        <div style={{ fontWeight: 700, marginBottom: '2px' }}>Điều kiện chờ hoàn tất:</div>
                        {req.finalizationBlockers.map((b, idx) => (
                          <div key={idx}>• {b}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Appendix Viewer Action */}
                  {hasSnapshot && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        type="button"
                        id={`btn-view-appendix-outgoing-${req.id}`}
                        onClick={() => {
                          const nextState = !isAppendixOpen;
                          setOpenedAppendixIds((prev) => ({ ...prev, [req.id]: nextState }));
                          if (nextState && req.contentHash) {
                            setReviewedHashes((prev) => ({ ...prev, [req.id]: req.contentHash! }));
                          }
                        }}
                        style={{
                          padding: '10px 14px',
                          background: isAppendixOpen
                            ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(34, 230, 255, 0.2) 100%)'
                            : 'rgba(168, 85, 247, 0.08)',
                          border: isAppendixOpen
                            ? '1.5px solid rgba(168, 85, 247, 0.6)'
                            : '1px solid rgba(168, 85, 247, 0.35)',
                          borderRadius: '8px',
                          color: '#c084fc',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxShadow: isAppendixOpen ? '0 0 14px rgba(168, 85, 247, 0.2)' : 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={15} color="#c084fc" />
                          <span>{isAppendixOpen ? 'ẨN PHỤ LỤC CHUYỂN NHƯỢNG' : 'XEM PHỤ LỤC CHUYỂN NHƯỢNG'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 800,
                              color: isTransferorAccepted ? '#10b981' : hasReviewed ? '#38bdf8' : '#94a3b8',
                              background: isTransferorAccepted ? 'rgba(16, 185, 129, 0.2)' : hasReviewed ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              border: `1px solid ${isTransferorAccepted ? 'rgba(16, 185, 129, 0.5)' : hasReviewed ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                            }}
                          >
                            {isTransferorAccepted ? 'ĐÃ XÁC NHẬN CHẤP THUẬN' : hasReviewed ? 'ĐÃ XEM PHỤ LỤC' : 'CHƯA XEM PHỤ LỤC'}
                          </span>
                          {isAppendixOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </div>
                      </button>

                      {isAppendixOpen && (
                        <div
                          style={{
                            background: 'rgba(4, 10, 20, 0.95)',
                            border: '1.5px solid rgba(168, 85, 247, 0.35)',
                            borderRadius: '10px',
                            padding: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                          }}
                        >
                          <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ShieldCheck size={15} color="#c084fc" />
                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc' }}>
                                  {req.contractVersionTitle || `PHỤ LỤC HỢP ĐỒNG ${req.contractVersionFormatted || 'V2.0'}`}
                                </span>
                              </div>
                              <span
                                style={{
                                  fontSize: '9.5px',
                                  fontWeight: 800,
                                  padding: '2px 7px',
                                  borderRadius: '4px',
                                  background: 'rgba(168, 85, 247, 0.15)',
                                  color: '#c084fc',
                                  border: '1px solid rgba(168, 85, 247, 0.4)',
                                }}
                              >
                                {req.contractVersionFormatted || 'V2.0'}
                              </span>
                            </div>
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '6px',
                                fontSize: '9.5px',
                                color: '#94a3b8',
                                background: 'rgba(255, 255, 255, 0.02)',
                                borderRadius: '6px',
                                padding: '6px 8px',
                              }}
                            >
                              <div>Hợp đồng gốc: <span style={{ color: '#ffffff', fontFamily: 'monospace', fontWeight: 700 }}>{req.contractCode || 'HĐ-EV01'}</span></div>
                              <div>Mã phụ lục: <span style={{ color: '#ffffff', fontFamily: 'monospace' }}>{req.contractVersionId ? req.contractVersionId.substring(0, 8) + '...' : 'V2.0'}</span></div>
                              <div>Mã giao dịch: <span style={{ color: '#ffffff', fontFamily: 'monospace' }}>{req.id ? req.id.substring(0, 8) + '...' : 'N/A'}</span></div>
                              <div>Phương tiện: <span style={{ color: '#e2e8f0' }}>{req.vehicleName || 'VinFast VF8'}</span></div>
                            </div>
                          </div>
                          <div
                            style={{
                              background: 'rgba(0, 0, 0, 0.6)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '6px',
                              padding: '10px',
                              color: '#cbd5e1',
                              fontFamily: 'monospace',
                              fontSize: '9.5px',
                              lineHeight: 1.5,
                              whiteSpace: 'pre-line',
                              maxHeight: '260px',
                              overflowY: 'auto',
                            }}
                          >
                            {req.contentSnapshot}
                          </div>
                          {req.contentHash && (
                            <div
                              style={{
                                background: 'rgba(168, 85, 247, 0.05)',
                                border: '1px dashed rgba(168, 85, 247, 0.3)',
                                borderRadius: '6px',
                                padding: '6px 8px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                                fontSize: '9px',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#94a3b8' }}>Mã băm toàn vẹn tài liệu (SHA-256):</span>
                                <span style={{ color: '#10b981', fontWeight: 700 }}>Niêm phong bất biến</span>
                              </div>
                              <div style={{ color: '#c084fc', fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '8.5px' }}>
                                {req.contentHash}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Transferor Consent Action (if transferor has not yet accepted on legacy request) */}
                  {!isTransferorAccepted && (req.status === 'PENDING_ACCEPTANCE' || req.status === 'PENDING_CONTRACT') && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        marginTop: '6px',
                        background: 'rgba(168, 85, 247, 0.05)',
                        border: '1.5px solid rgba(168, 85, 247, 0.3)',
                        borderRadius: '10px',
                        padding: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      }}
                    >
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                          cursor: (!hasSnapshot || !hasReviewed) ? 'not-allowed' : 'pointer',
                          fontSize: '10.5px',
                          color: (!hasSnapshot || !hasReviewed) ? '#64748b' : '#f1f5f9',
                          background: isConsentChecked
                            ? 'rgba(16, 185, 129, 0.08)'
                            : 'rgba(255, 255, 255, 0.02)',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: isConsentChecked
                            ? '1px solid rgba(16, 185, 129, 0.3)'
                            : '1px dashed rgba(255, 255, 255, 0.12)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <input
                          type="checkbox"
                          id={`chk-transferor-consent-${req.id}`}
                          disabled={!hasSnapshot || !hasReviewed}
                          checked={isConsentChecked}
                          onChange={(e) => {
                            if (!hasSnapshot || !hasReviewed) return;
                            setRecipientConsentChecked((prev) => ({ ...prev, [req.id]: e.target.checked }));
                            setAcceptError((prev) => ({ ...prev, [req.id]: null }));
                          }}
                          style={{
                            marginTop: '2px',
                            accentColor: '#10b981',
                            cursor: (!hasSnapshot || !hasReviewed) ? 'not-allowed' : 'pointer',
                          }}
                        />
                        <div>
                          <span style={{ fontWeight: 600 }}>
                            Tôi đã đọc, hiểu và đồng ý chuyển nhượng theo đúng nội dung phụ lục này.
                          </span>
                          {!hasSnapshot ? (
                            <div style={{ color: '#f59e0b', fontSize: '9.5px', marginTop: '3px' }}>
                              * Chưa có phụ lục chuyển nhượng để xem xét.
                            </div>
                          ) : !hasReviewed ? (
                            <div style={{ color: '#f59e0b', fontSize: '9.5px', marginTop: '3px' }}>
                              * Vui lòng bấm <strong>"XEM PHỤ LỤC CHUYỂN NHƯỢNG"</strong> để đọc toàn văn điều khoản trước khi xác nhận đồng ý.
                            </div>
                          ) : null}
                        </div>
                      </label>

                      {acceptError[req.id] && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', padding: '6px 8px', color: '#fca5a5', fontSize: '10px' }}>
                          {acceptError[req.id]}
                        </div>
                      )}

                      <button
                        type="button"
                        id={`btn-transferor-confirm-${req.id}`}
                        onClick={() => {
                          if (!hasSnapshot || !hasReviewed || !isConsentChecked) return;
                          confirmTransferorConsentMutation.mutate({
                            transferId: req.id,
                            payload: {
                              contentHash: req.contentHash,
                              acknowledgedTerms: true,
                              confirmationNote: 'Bên chuyển nhượng xác nhận đồng ý với phụ lục hợp đồng chuyển nhượng cổ phần',
                            },
                          });
                        }}
                        disabled={!canSubmitTransferorConsent}
                        style={{
                          padding: '9px 12px',
                          background: !canSubmitTransferorConsent
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                          border: 'none',
                          borderRadius: '8px',
                          color: !canSubmitTransferorConsent ? '#94a3b8' : '#ffffff',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: !canSubmitTransferorConsent ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: canSubmitTransferorConsent ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none',
                        }}
                      >
                        {confirmTransferorConsentMutation.isPending ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Đang ghi nhận...</span>
                          </>
                        ) : (
                          <>
                            <Check size={13} />
                            <span>XÁC NHẬN PHỤ LỤC CHUYỂN NHƯỢNG</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Transferor already signed notice */}
                  {isTransferorAccepted && (
                    <div
                      style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        fontSize: '10.5px',
                        color: '#6ee7b7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={14} color="#10b981" />
                        <span style={{ fontWeight: 700 }}>ĐÃ XÁC NHẬN KHI GỬI YÊU CẦU</span>
                      </div>
                      <span style={{ fontSize: '10px', color: '#a7f3d0' }}>
                        Phụ lục chuyển nhượng đã được xác nhận điện tử khi gửi yêu cầu
                      </span>
                    </div>
                  )}

                  {/* Complete Button if eligible */}
                  {((req.canFinalize ?? req.canComplete) || (isTransferorAccepted && isRecipientAccepted && req.status !== 'COMPLETED' && (!req.finalizationBlockers || req.finalizationBlockers.length === 0))) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <button
                        type="button"
                        id={`btn-complete-outgoing-${req.id}`}
                        onClick={() => {
                          setCompleteError((prev) => ({ ...prev, [req.id]: null }));
                          completeTransferMutation.mutate(req.id);
                        }}
                        disabled={completeTransferMutation.isPending}
                        style={{
                          padding: '9px 12px',
                          background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                          border: '1.5px solid #22e6ff',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: '0 0 15px rgba(34, 230, 255, 0.3)',
                        }}
                      >
                        {completeTransferMutation.isPending ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Đang hoàn tất...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} color="#22e6ff" />
                            <span>HOÀN TẤT CHUYỂN NHƯỢNG</span>
                          </>
                        )}
                      </button>
                      {completeError[req.id] && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', padding: '6px 8px', color: '#fca5a5', fontSize: '10px' }}>
                          {completeError[req.id]}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Completed Success Banner */}
                  {req.status === 'COMPLETED' && (
                    <div
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid #10b981',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#6ee7b7',
                        fontSize: '11px',
                      }}
                    >
                      <CheckCircle2 size={16} color="#10b981" />
                      <div>
                        <div style={{ fontWeight: 800 }}>CHUYỂN NHƯỢNG THÀNH CÔNG</div>
                        <div style={{ fontSize: '10px', color: '#a7f3d0' }}>
                          Cổ phần đã được phân bổ lại: {req.fromUserName} {Number(req.fromUserCurrentPercentage ?? 0).toFixed(2)}%, {req.toUserName} {Number(req.toUserCurrentPercentage ?? 0).toFixed(2)}%.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Render Notified Group Transfers for Non-Signatory Co-Owners (e.g. Le Van C) */}
            {notifiedGroupTransfers.map((req) => {
              const isAppendixOpen = Boolean(openedAppendixIds[req.id]);
              const isTransferorAccepted = Boolean(req.transferorAccepted ?? req.isTransferorAccepted);
              const isRecipientAccepted = Boolean(req.recipientAccepted ?? req.isRecipientAccepted);
              const acceptedCount = req.acceptedConsentCount ?? req.acceptedMembersCount ?? ((isTransferorAccepted ? 1 : 0) + (isRecipientAccepted ? 1 : 0));
              const requiredCount = req.requiredConsentCount ?? req.requiredAcceptanceCount ?? 2;

              return (
                <div
                  key={`notified-${req.id}`}
                  style={{
                    background: 'rgba(7, 20, 38, 0.85)',
                    border: '1.5px solid rgba(56, 189, 248, 0.35)',
                    borderRadius: '14px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Info size={15} color="#38bdf8" />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>
                          THÔNG BÁO CHUYỂN NHƯỢNG NỘI BỘ
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>{req.notificationMessage}</div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        color: '#38bdf8',
                      }}
                    >
                      Được thông báo
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '11px',
                    }}
                  >
                    <div>
                      <span style={{ color: '#94a3b8', fontSize: '9.5px' }}>Người chuyển:</span>
                      <div style={{ fontWeight: 700, color: '#e2e8f0' }}>{req.fromUserName}</div>
                    </div>
                    <div>
                      <span style={{ color: '#94a3b8', fontSize: '9.5px' }}>Người nhận:</span>
                      <div style={{ fontWeight: 700, color: '#e2e8f0' }}>{req.toUserName}</div>
                    </div>
                    <div>
                      <span style={{ color: '#94a3b8', fontSize: '9.5px' }}>Tỷ lệ chuyển nhượng:</span>
                      <div style={{ fontWeight: 800, color: '#00f2fe', fontFamily: 'monospace' }}>
                        {req.transferPercentage}%
                      </div>
                    </div>
                    <div>
                      <span style={{ color: '#94a3b8', fontSize: '9.5px' }}>Tiến độ xác nhận:</span>
                      <div style={{ fontWeight: 800, color: '#34d399', fontFamily: 'monospace' }}>
                        {acceptedCount}/{requiredCount}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      fontSize: '10.5px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase' }}>
                        TIẾN TRÌNH XÁC NHẬN HAI BÊN ({acceptedCount}/{requiredCount})
                      </span>
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          color: (req.status === 'COMPLETED' || (isTransferorAccepted && isRecipientAccepted)) ? '#10b981' : '#f59e0b',
                        }}
                      >
                        {req.status === 'COMPLETED'
                          ? 'CHUYỂN NHƯỢNG THÀNH CÔNG'
                          : (isTransferorAccepted && isRecipientAccepted)
                          ? (req.canFinalize ?? req.canComplete ? 'ĐỦ ĐIỀU KIỆN HOÀN TẤT' : 'CHỜ HOÀN TẤT ĐIỀU KIỆN')
                          : isTransferorAccepted
                          ? 'CHỜ NGƯỜI NHẬN XÁC NHẬN'
                          : isRecipientAccepted
                          ? 'CHỜ NGƯỜI CHUYỂN XÁC NHẬN'
                          : 'CHỜ XÁC NHẬN CỦA HAI BÊN'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#cbd5e1' }}>{req.fromUserName} (Bên chuyển nhượng):</span>
                      <span style={{ color: isTransferorAccepted ? '#10b981' : '#f59e0b', fontWeight: 700, fontFamily: 'monospace', fontSize: '10px' }}>
                        {isTransferorAccepted ? 'Đã xác nhận' : 'Chờ xác nhận'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#cbd5e1' }}>{req.toUserName} (Bên nhận chuyển nhượng):</span>
                      <span style={{ color: isRecipientAccepted ? '#10b981' : '#f59e0b', fontWeight: 700, fontFamily: 'monospace', fontSize: '10px' }}>
                        {isRecipientAccepted ? 'Đã xác nhận' : 'Chờ xác nhận'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8' }}>Bạn ({currentUser?.fullName || 'Đồng sở hữu'}):</span>
                      <span style={{ color: '#38bdf8', fontSize: '9.5px', fontWeight: 600 }}>Đã được thông báo</span>
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'rgba(56, 189, 248, 0.06)',
                      border: '1px dashed rgba(56, 189, 248, 0.25)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '10px',
                      color: '#cbd5e1',
                      lineHeight: 1.4,
                    }}
                  >
                    Bạn nhận được thông báo này với tư cách thành viên đồng sở hữu phương tiện. Giao dịch nội bộ này áp dụng cơ chế xác nhận hai bên (2/2). Quyền lợi, tỷ lệ sở hữu của bạn và các quyền ưu tiên/phản đối theo Thỏa thuận đồng sở hữu được bảo toàn đầy đủ.
                  </div>

                  {/* View Appendix Button for Notified Co-owner */}
                  {req.contentSnapshot && (
                    <button
                      type="button"
                      onClick={() => setOpenedAppendixIds((prev) => ({ ...prev, [req.id]: !isAppendixOpen }))}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(0, 242, 254, 0.08)',
                        border: '1px solid rgba(0, 242, 254, 0.35)',
                        borderRadius: '8px',
                        color: '#00f2fe',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={14} color="#00f2fe" />
                        <span>{isAppendixOpen ? 'ẨN PHỤ LỤC CHUYỂN NHƯỢNG' : 'XEM PHỤ LỤC CHUYỂN NHƯỢNG'}</span>
                      </div>
                      {isAppendixOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}

                  {isAppendixOpen && req.contentSnapshot && (
                    <div
                      style={{
                        background: 'rgba(4, 10, 20, 0.95)',
                        border: '1.5px solid rgba(0, 242, 254, 0.35)',
                        borderRadius: '10px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#f8fafc' }}>
                        {req.contractVersionTitle || `PHỤ LỤC HỢP ĐỒNG ${req.contractVersionFormatted || 'V2.0'}`}
                      </div>
                      <div
                        style={{
                          background: 'rgba(0, 0, 0, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '6px',
                          padding: '10px',
                          color: '#cbd5e1',
                          fontFamily: 'monospace',
                          fontSize: '9.5px',
                          lineHeight: 1.5,
                          whiteSpace: 'pre-line',
                          maxHeight: '200px',
                          overflowY: 'auto',
                        }}
                      >
                        {req.contentSnapshot}
                      </div>
                      {req.contentHash && (
                        <div style={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'monospace' }}>
                          Mã băm niêm phong (SHA-256): {req.contentHash}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            </>
          )}
        </div>
      </aside>
    );
  }

  // =========================================================================
  // VIEW MODE D: MEMBER WITHDRAWAL FORM
  // =========================================================================
  if (currentView === 'WITHDRAWAL_FORM') {
    const hasRemainingShare = currentUserShare > 0;

    return renderPortal(
      <aside
        className="evshare-ownership-panel"
        role="region"
        aria-label="Yêu cầu rút khỏi nhóm"
        data-ui-interactive="true"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={panelStyle}
      >
        {renderHeader('YÊU CẦU RÚT KHỎI NHÓM', `${vehicleCode} • Thành viên ${currentUser?.fullName}`, true)}

        <div
          style={{
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            flex: 1,
          }}
        >
          {/* Rules / Restrictions Notice */}
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '11px',
              color: '#fef3c7',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#fbbf24' }}>
              <AlertTriangle size={14} />
              <span>ĐIỀU KIỆN RÚT KHỎI NHÓM ĐỒNG SỞ HỮU</span>
            </div>
            <ul style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px', color: '#fde68a' }}>
              <li>Tỷ lệ sở hữu còn lại phải bằng 0% (đã hoàn tất chuyển nhượng).</li>
              <li>Không có chuyến đi đang thực hiện hoặc lịch đặt xe sắp tới.</li>
              <li>Hoàn tất toàn bộ nghĩa vụ tài chính và các khoản phân bổ chi phí.</li>
            </ul>
          </div>

          {/* Remaining Share Check */}
          {hasRemainingShare && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '10px',
                padding: '10px 12px',
                color: '#fca5a5',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <span style={{ fontWeight: 800 }}>Bạn còn giữ {currentUserShare}% cổ phần:</span> Vui lòng chuyển nhượng toàn bộ tỷ lệ sở hữu cho thành viên khác trước khi gửi yêu cầu rút.
              </div>
            </div>
          )}

          {/* Withdrawal Reason Field */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
              Lý do rút khỏi nhóm
            </label>
            <textarea
              rows={3}
              value={withdrawalReason}
              onChange={(e) => setWithdrawalReason(e.target.value)}
              placeholder="Nhập lý do nguyện vọng rút khỏi nhóm..."
              style={{
                width: '100%',
                padding: '8px 10px',
                background: 'rgba(7, 20, 38, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '11px',
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          {/* Messages */}
          {withdrawalFormError && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '8px 10px',
                color: '#fca5a5',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <AlertCircle size={13} />
              <span>{withdrawalFormError}</span>
            </div>
          )}

          {withdrawalSuccessMsg && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '8px',
                padding: '8px 10px',
                color: '#6ee7b7',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle2 size={13} />
              <span>{withdrawalSuccessMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            disabled={hasRemainingShare || !withdrawalReason.trim() || withdrawalMutation.isPending}
            onClick={() => {
              if (!hasRemainingShare && withdrawalReason.trim()) {
                withdrawalMutation.mutate({ reason: withdrawalReason });
              }
            }}
            style={{
              marginTop: 'auto',
              padding: '10px 14px',
              background:
                !hasRemainingShare && withdrawalReason.trim()
                  ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                  : 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '10px',
              color: !hasRemainingShare ? '#ffffff' : '#64748b',
              fontSize: '12px',
              fontWeight: 800,
              cursor: !hasRemainingShare ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {withdrawalMutation.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Đang gửi yêu cầu...</span>
              </>
            ) : (
              <>
                <LogOut size={14} />
                <span>GỬI YÊU CẦU RÚT KHỎI NHÓM</span>
              </>
            )}
          </button>
        </div>
      </aside>
    );
  }

  // =========================================================================
  // VIEW MODE E: OWNERSHIP CHANGE HISTORY
  // =========================================================================
  if (currentView === 'HISTORY') {
    return renderPortal(
      <aside
        className="evshare-ownership-panel"
        role="region"
        aria-label="Lịch sử sở hữu"
        data-ui-interactive="true"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={panelStyle}
      >
        {renderHeader('LỊCH SỬ THAY ĐỔI SỞ HỮU', `${vehicleCode} • Nhật ký giao dịch bất biến`, true)}

        <div
          style={{
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            flex: 1,
          }}
        >
          {isLoadingHistory ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#22e6ff', fontSize: '11.5px' }}>
              <Loader2 size={16} className="animate-spin" style={{ display: 'inline', marginRight: '6px' }} />
              Đang tải lịch sử giao dịch...
            </div>
          ) : isErrorHistory ? (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '12px',
                padding: '20px 16px',
                textAlign: 'center',
                color: '#fca5a5',
                fontSize: '11.5px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={24} color="#ef4444" />
              <div style={{ fontWeight: 700 }}>Không thể tải lịch sử giao dịch</div>
              <button
                type="button"
                onClick={() => refetchHistory()}
                style={{
                  marginTop: '4px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.25)',
                  border: '1px solid rgba(239, 68, 68, 0.6)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <RefreshCw size={12} />
                THỬ LẠI
              </button>
            </div>
          ) : !Array.isArray(safeOwnershipHistory) || safeOwnershipHistory.length === 0 ? (
            <div
              style={{
                background: 'rgba(7, 20, 38, 0.65)',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '24px 16px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '11.5px',
              }}
            >
              <History size={24} color="#64748b" style={{ margin: '0 auto 8px' }} />
              <div>Chưa có giao dịch chuyển nhượng nào được hoàn tất trong nhóm.</div>
            </div>
          ) : (
            (Array.isArray(safeOwnershipHistory) ? safeOwnershipHistory : []).map((hist) => (
              <div
                key={hist.id}
                style={{
                  background: 'rgba(7, 20, 38, 0.75)',
                  border: '1px solid rgba(34, 230, 255, 0.25)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '12px' }}>
                      {hist.fromUserName || 'Thành viên'}
                    </span>
                    <ArrowRight size={12} color="#22e6ff" />
                    <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '12px' }}>
                      {hist.toUserName || 'Người nhận'}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#10b981',
                      fontFamily: 'monospace',
                    }}
                  >
                    {hist.transferredPercentage}%
                  </span>
                </div>

                <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{new Date(hist.effectiveAt).toLocaleString('vi-VN')}</span>
                  {hist.recordedByUserName && <span>Ghi nhận: {hist.recordedByUserName}</span>}
                </div>

                {hist.reason && (
                  <div style={{ fontSize: '10.5px', color: '#cbd5e1', fontStyle: 'italic', marginTop: '2px' }}>
                    "{hist.reason}"
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </aside>
    );
  }

  // =========================================================================
  // VIEW MODE F: MAIN MEMBERSHIP DASHBOARD (Default view)
  // =========================================================================
  return renderPortal(
    <aside
      className="evshare-ownership-panel"
      role="region"
      aria-label="Thông tin đồng sở hữu xe"
      data-ui-interactive="true"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      style={panelStyle}
    >
      {/* 1. HEADER BAR */}
      <div
        style={{
          padding: '16px 18px',
          borderBottom: '1px solid rgba(34, 230, 255, 0.18)',
          background: 'linear-gradient(90deg, rgba(34, 230, 255, 0.08) 0%, transparent 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(34, 230, 255, 0.25), rgba(8, 16, 30, 0.9))',
              border: '1px solid #22e6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#22e6ff',
              boxShadow: '0 0 12px rgba(34, 230, 255, 0.3)',
            }}
          >
            <Users size={16} />
          </div>
          <div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '0.02em',
                lineHeight: 1.2,
              }}
            >
              QUẢN LÝ ĐỒNG SỞ HỮU
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
              {vehicleCode} • {vehicle.licensePlate || 'Xe số hóa'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '9999px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.45)',
              color: '#10b981',
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '0.04em',
            }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 6px #10b981',
              }}
            />
            {statusLabel}
          </span>

          <button
            type="button"
            onClick={onClose}
            title="Đóng bảng đồng sở hữu"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* 2. CONTENT BODY */}
      <div
        style={{
          padding: '16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          flex: 1,
        }}
      >
        {/* Loading / Error States */}
        {isLoading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              color: '#22e6ff',
              gap: '8px',
              fontSize: '12px',
            }}
          >
            <Loader2 size={16} className="animate-spin" />
            <span>Đang tải dữ liệu đồng sở hữu...</span>
          </div>
        )}

        {isError && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '10px',
              padding: '10px 12px',
              color: '#fca5a5',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertCircle size={14} />
            <span>{error instanceof Error ? error.message : 'Lỗi tải dữ liệu'}</span>
          </div>
        )}

        {/* NOTIFICATION: Pending incoming transfer requests for current user */}
        {pendingIncomingCount > 0 && (
          <div
            onClick={() => setCurrentView('INCOMING_TRANSFERS')}
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(180, 83, 9, 0.3))',
              border: '1.5px solid #f59e0b',
              borderRadius: '12px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(245, 158, 11, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color="#fbbf24" />
              <div>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#fef3c7' }}>
                  Có {pendingIncomingCount} yêu cầu nhận chuyển nhượng
                </div>
                <div style={{ fontSize: '10px', color: '#fde68a' }}>Nhấp để xem xét và phản hồi</div>
              </div>
            </div>
            <ArrowRight size={14} color="#fbbf24" />
          </div>
        )}

        {/* NOTIFICATION: In-app notifications for third-party co-owners (e.g. Le Van C) */}
        {notifiedGroupTransfers.map((nt) => (
          <div
            key={`banner-notified-${nt.id}`}
            onClick={() => setCurrentView('INCOMING_TRANSFERS')}
            style={{
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.2), rgba(6, 182, 212, 0.2))',
              border: '1.5px solid #22e6ff',
              borderRadius: '12px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(34, 230, 255, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={16} color="#22e6ff" />
              <div>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#e0f2fe' }}>
                  {nt.notificationMessage || `${nt.fromUserName} đề xuất chuyển nhượng ${nt.transferPercentage}% cho ${nt.toUserName}.`}
                </div>
                <div style={{ fontSize: '10px', color: '#93c5fd', marginTop: '2px' }}>
                  Xác nhận hai bên: {nt.acceptedMembersCount ?? 0}/2 • Phê duyệt bổ sung: {nt.additionalApprovalStatus || 'Không yêu cầu'}
                </div>
              </div>
            </div>
            <ArrowRight size={14} color="#22e6ff" />
          </div>
        ))}

        {/* NOTIFICATION: Outgoing transfer requests initiated by current user (e.g. Tran Thi B) */}
        {outgoingTransfers.map((ot) => {
          const isCompleted = ot.status === 'COMPLETED';
          const statusCfg = getTransferDisplayStatus(ot);
          return (
            <div
              key={`banner-outgoing-${ot.id}`}
              onClick={() => setCurrentView('INCOMING_TRANSFERS')}
              style={{
                background: isCompleted
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.25))'
                  : 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(126, 34, 206, 0.25))',
                border: `1.5px solid ${isCompleted ? '#10b981' : '#a855f7'}`,
                borderRadius: '12px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                boxShadow: `0 0 16px ${isCompleted ? 'rgba(16, 185, 129, 0.25)' : 'rgba(168, 85, 247, 0.25)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isCompleted ? <CheckCircle2 size={16} color="#10b981" /> : <Clock size={16} color="#c084fc" />}
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#f8fafc' }}>
                    Chuyển nhượng cho {ot.toUserName}: {ot.transferPercentage}% ({statusCfg.label})
                  </div>
                  <div style={{ fontSize: '10px', color: '#e2e8f0', marginTop: '2px' }}>
                    Xác nhận hai bên: {ot.acceptedMembersCount ?? (ot.isTransferorAccepted ? 1 : 0) + (ot.isRecipientAccepted ? 1 : 0)}/2
                    {!ot.isTransferorAccepted ? ' • Bạn chưa xác nhận phụ lục' : !ot.isRecipientAccepted ? ' • Chờ người nhận xác nhận' : ' • Đã xác nhận đầy đủ'}
                  </div>
                </div>
              </div>
              <ArrowRight size={14} color={isCompleted ? '#10b981' : '#c084fc'} />
            </div>
          );
        })}

        {/* 4 CORE METRICS */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(34, 230, 255, 0.18)',
            borderRadius: '14px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              TỔNG QUAN NHÓM
            </span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
              {coOwnership?.name || `${vehicleCode} Co-ownership`}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div
              style={{
                background: 'rgba(7, 20, 38, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '10.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={12} color="#94a3b8" />
                Thành viên:
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                {memberCount}
              </span>
            </div>

            <div
              style={{
                background: 'rgba(7, 20, 38, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '10.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Car size={12} color="#94a3b8" />
                Xe nhóm:
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                {vehicleCount}
              </span>
            </div>

            <div
              style={{
                background: 'rgba(7, 20, 38, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '10.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <PieChart size={12} color="#22e6ff" />
                Tổng tỷ lệ:
              </span>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#22e6ff' }}>
                {totalPercentage}%
              </span>
            </div>

            <div
              style={{
                background: 'rgba(7, 20, 38, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '10.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} color="#10b981" />
                Trạng thái:
              </span>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#10b981' }}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS BAR: 4 Core Phase 23 Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setCurrentView('TRANSFER_FORM')}
            disabled={currentUserShare <= 0}
            style={{
              padding: '8px 10px',
              background:
                currentUserShare > 0
                  ? 'linear-gradient(135deg, rgba(34, 230, 255, 0.18), rgba(14, 165, 233, 0.25))'
                  : 'rgba(255, 255, 255, 0.04)',
              border: currentUserShare > 0 ? '1px solid #22e6ff' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: currentUserShare > 0 ? '#22e6ff' : '#64748b',
              fontSize: '11px',
              fontWeight: 750,
              cursor: currentUserShare > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Send size={12} />
            <span>CHUYỂN NHƯỢNG SỞ HỮU</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('INCOMING_TRANSFERS')}
            style={{
              padding: '8px 10px',
              background:
                (pendingIncomingCount > 0 || outgoingTransfers.some((t) => t.status !== 'COMPLETED'))
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(217, 119, 6, 0.25))'
                  : 'rgba(255, 255, 255, 0.05)',
              border:
                (pendingIncomingCount > 0 || outgoingTransfers.some((t) => t.status !== 'COMPLETED'))
                  ? '1px solid #f59e0b'
                  : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color:
                (pendingIncomingCount > 0 || outgoingTransfers.some((t) => t.status !== 'COMPLETED'))
                  ? '#fbbf24'
                  : '#cbd5e1',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Clock size={12} />
            <span>
              YÊU CẦU CHUYỂN NHƯỢNG{' '}
              {pendingIncomingCount > 0 || outgoingTransfers.some((t) => t.status !== 'COMPLETED')
                ? `(${pendingIncomingCount + outgoingTransfers.filter((t) => t.status !== 'COMPLETED').length})`
                : ''}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('WITHDRAWAL_FORM')}
            style={{
              padding: '8px 10px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <LogOut size={12} />
            <span>YÊU CẦU RÚT KHỎI NHÓM</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('HISTORY')}
            style={{
              padding: '8px 10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              color: '#94a3b8',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <History size={12} />
            <span>LỊCH SỬ SỞ HỮU</span>
          </button>
        </div>

        {/* SECTION: THÀNH VIÊN ĐỒNG SỞ HỮU (Main list) */}
        <div
          style={{
            background: 'rgba(7, 20, 38, 0.75)',
            border: '1px solid rgba(34, 230, 255, 0.25)',
            borderRadius: '14px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#22e6ff', letterSpacing: '0.04em' }}>
              THÀNH VIÊN ĐỒNG SỞ HỮU
            </span>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>
              {(Array.isArray(activeMembers) ? activeMembers : []).length} thành viên
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(Array.isArray(activeMembers) ? activeMembers : []).map((m, index) => {
              const orbColor = OWNER_ORB_COLORS[index % OWNER_ORB_COLORS.length];
              const isCurrentUser = m.userId === currentUser?.id;
              const isRep = m.memberRole === 'REPRESENTATIVE';
              const sharePct = m.share?.percentage ?? 0;

              return (
                <div
                  key={m.id}
                  style={{
                    background: isCurrentUser ? 'rgba(34, 230, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    border: isCurrentUser ? '1px solid rgba(34, 230, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '10px',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: orbColor,
                        boxShadow: `0 0 8px ${orbColor}`,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.fullName}
                        </span>
                        {isCurrentUser && (
                          <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', background: '#22e6ff20', color: '#22e6ff', fontWeight: 800 }}>
                            Bạn
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '9.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
                        <span>{isRep ? 'Đại diện nhóm' : 'Đồng sở hữu'}</span>
                        <span>•</span>
                        <span style={{ color: '#10b981' }}>Hiệu lực hợp đồng</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: orbColor,
                        fontFamily: 'monospace',
                      }}
                    >
                      {sharePct}%
                    </div>
                    <div style={{ fontSize: '9px', color: '#64748b' }}>Cổ phần</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CONTRACT VIEW LINK */}
        <button
          type="button"
          onClick={() => openGaragePanel('CONTRACT', { vehicleId: vehicle.id })}
          style={{
            width: '100%',
            height: '32px',
            background: 'rgba(0, 242, 254, 0.10)',
            border: '1px solid rgba(0, 242, 254, 0.35)',
            borderRadius: '8px',
            color: '#00f2fe',
            fontSize: '11px',
            fontWeight: 750,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <FileText size={13} color="#00f2fe" />
          <span>XEM HỢP ĐỒNG ĐỒNG SỞ HỮU & QUY CHẾ</span>
        </button>

        {/* REPRESENTATIVE: ADD MEMBER SECTION */}
        {canManage && (
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {!isAddMemberOpen ? (
              <button
                type="button"
                onClick={() => setIsAddMemberOpen(true)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'linear-gradient(135deg, rgba(34, 230, 255, 0.18), rgba(8, 16, 30, 0.95))',
                  border: '1px solid #22e6ff',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <UserPlus size={14} color="#22e6ff" />
                <span>+ THÊM THÀNH VIÊN VÀO NHÓM</span>
              </button>
            ) : (
              <div
                style={{
                  background: 'rgba(7, 20, 38, 0.92)',
                  border: '1.5px solid rgba(34, 230, 255, 0.4)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#22e6ff' }}>
                    TÌM KIẾM & THÊM THÀNH VIÊN
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddMemberOpen(false);
                      setSelectedUserToAdd(null);
                      setAddError(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '2px',
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                  }}
                >
                  <Search size={13} color="#94a3b8" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên hoặc email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '11px',
                      outline: 'none',
                      width: '100%',
                    }}
                  />
                </div>

                <div style={{ maxHeight: '110px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {isSearchingUsers ? (
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', textAlign: 'center', padding: '6px' }}>
                      Đang tìm kiếm...
                    </div>
                  ) : !Array.isArray(availableUsers) || availableUsers.length === 0 ? (
                    <div style={{ fontSize: '10.5px', color: '#64748b', textAlign: 'center', padding: '6px' }}>
                      Không có người dùng khả dụng.
                    </div>
                  ) : (
                    (Array.isArray(availableUsers) ? availableUsers : []).map((u) => {
                      const isChosen = selectedUserToAdd?.id === u.id;
                      return (
                        <div
                          key={u.id}
                          onClick={() => setSelectedUserToAdd(u)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            background: isChosen ? 'rgba(34, 230, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                            border: isChosen ? '1px solid #22e6ff' : '1px solid transparent',
                            cursor: 'pointer',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc' }}>
                              {u.displayName}
                            </div>
                            <div style={{ fontSize: '9px', color: '#94a3b8' }}>
                              {u.email}
                            </div>
                          </div>
                          {isChosen && <CheckCircle2 size={13} color="#22e6ff" />}
                        </div>
                      );
                    })
                  )}
                </div>

                {addError && (
                  <div style={{ color: '#f87171', fontSize: '10px' }}>
                    {addError}
                  </div>
                )}

                <button
                  type="button"
                  disabled={!selectedUserToAdd || addMutation.isPending}
                  onClick={() => {
                    if (selectedUserToAdd) addMutation.mutate(selectedUserToAdd.id);
                  }}
                  style={{
                    padding: '7px 12px',
                    background: selectedUserToAdd
                      ? 'linear-gradient(135deg, #0284c7, #06b6d4)'
                      : 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    borderRadius: '8px',
                    color: selectedUserToAdd ? '#ffffff' : '#64748b',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: selectedUserToAdd ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {addMutation.isPending ? 'Đang thêm...' : 'Xác nhận thêm thành viên'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. FOOTER BAR */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(0, 0, 0, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '9.5px',
          color: '#64748b',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Sparkles size={11} color="#22e6ff" />
          <span>Bảo toàn tỷ lệ 100.00% theo hợp đồng số</span>
        </div>
        <span style={{ fontFamily: 'monospace', color: '#475569' }}>
          EVSHARE PRO
        </span>
      </div>
    </aside>
  );
};
