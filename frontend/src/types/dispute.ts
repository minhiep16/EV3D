export type DisputeCategory =
  | 'BOOKING'
  | 'VEHICLE_USAGE'
  | 'HANDOVER'
  | 'RETURN'
  | 'VEHICLE_DAMAGE'
  | 'INSPECTION_RESULT'
  | 'MAINTENANCE'
  | 'EXPENSE_ALLOCATION'
  | 'PAYMENT'
  | 'OWNERSHIP'
  | 'OWNERSHIP_TRANSFER'
  | 'VOTING'
  | 'CONTRACT'
  | 'OTHER';

export type DisputeStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'AWAITING_EVIDENCE'
  | 'MEDIATION'
  | 'PROPOSED_RESOLUTION'
  | 'VOTING_IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED'
  | 'REJECTED';

export type DisputePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type DisputeParticipantRole =
  | 'COMPLAINANT'
  | 'RESPONDENT'
  | 'AFFECTED_CO_OWNER'
  | 'STAFF_MEDIATOR';

export type DisputeMessageVisibility = 'PUBLIC' | 'STAFF_ONLY';

export interface DisputeParticipantDto {
  id: string;
  disputeId: string;
  userId: string;
  fullName: string;
  email: string;
  role: DisputeParticipantRole;
  roleVietnamese: string;
  hasAcceptedResolution?: boolean | null;
  respondedAt?: string | null;
  createdAt: string;
}

export interface DisputeEvidenceDto {
  id: string;
  disputeId: string;
  uploadedByUserId: string;
  uploadedByName: string;
  title: string;
  fileUrl: string;
  fileType?: string | null;
  fileSizeBytes?: number | null;
  integrityHash?: string | null;
  createdAt: string;
}

export interface DisputeMessageDto {
  id: string;
  disputeId: string;
  senderId: string;
  senderName: string;
  senderRole?: string | null;
  visibility: DisputeMessageVisibility;
  content: string;
  createdAt: string;
}

// ==========================================
// PHASE 5.8 ENUMS & INTERFACES
// ==========================================

export type InvestigationConclusion =
  | 'LATE_RETURN_BY_PREVIOUS_USER'
  | 'LATE_STAFF_PROCESSING'
  | 'SYSTEM_SYNC_DELAY'
  | 'OPERATIONAL_PROBLEM'
  | 'INSUFFICIENT_EVIDENCE'
  | 'UNVERIFIED';

export type ResolutionType =
  | 'NO_COMPENSATION'
  | 'FULL_COMPENSATION'
  | 'PARTIAL_COMPENSATION'
  | 'OPERATIONAL_REMEDY'
  | 'ADDITIONAL_INVESTIGATION'
  | 'ESCALATION';

export type PayerType = 'PREVIOUS_CO_OWNER' | 'OPERATIONAL_ENTITY' | 'OTHER';

export type CompensationStatus =
  | 'APPROVED'
  | 'AWAITING_PAYMENT'
  | 'PENDING_VERIFICATION'
  | 'PENDING_RECIPIENT_CONFIRMATION'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'CANCELLED'
  | 'DEMO_AWAITING_RECIPIENT'
  | 'DEMO_CONFIRMED'
  | 'DEMO_DISPUTED';

export interface DisputeCompensationPaymentDto {
  id: string;
  compensationId: string;
  amount: number;
  paymentReference: string;
  receiptUrl?: string | null;
  paymentDate: string;
  verifiedByUserId: string;
  verifiedByName?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface DisputeCompensationDto {
  id: string;
  disputeId: string;
  payerUserId?: string | null;
  payerType: PayerType;
  payerName: string;
  recipientUserId: string;
  recipientName: string;
  approvedAmount: number;
  currency: string;
  verifiedPaidAmount: number;
  outstandingAmount: number;
  status: CompensationStatus;
  authorizedByUserId: string;
  authorizedByName?: string | null;
  authorizedAt: string;
  paymentReference?: string | null;
  decisionBasis?: string | null;
  payments: DisputeCompensationPaymentDto[];
  pendingPaymentAmount?: number | null;
  pendingPaymentReference?: string | null;
  pendingReceiptUrl?: string | null;
  pendingPaymentDate?: string | null;
  pendingPaymentNote?: string | null;
  pendingSubmittedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DisputeActionLogDto {
  id: string;
  disputeId: string;
  actorId: string;
  actorName?: string | null;
  actorRole?: string | null;
  actionType: string;
  previousStatus?: DisputeStatus | null;
  newStatus?: DisputeStatus | null;
  reason?: string | null;
  details?: string | null;
  createdAt: string;
}

export interface InvestigationDetailsDto {
  disputeId: string;
  bookingId?: string | null;
  tripId?: string | null;
  vehicleName: string;
  licensePlate: string;
  previousUserId?: string | null;
  previousUserName?: string | null;
  scheduledReturnTime?: string | null;
  returnRequestTime?: string | null;
  actualTripEndTime?: string | null;
  staffReceivedTime?: string | null;
  affectedUserId?: string | null;
  affectedUserName?: string | null;
  affectedBookingStartTime?: string | null;
  affectedBookingEndTime?: string | null;
  affectedHandoverTime?: string | null;
  userDelayMinutes: number;
  operationalDelayMinutes: number;
  totalDelayMinutes: number;
  lateReturnDetected: boolean;
  incidentSummary: string;
  suggestedConclusion: InvestigationConclusion;
  recordedConclusion?: InvestigationConclusion | null;
  recordedInvestigationNotes?: string | null;
  investigatedAt?: string | null;
  investigatedByName?: string | null;
}

export interface RecordInvestigationRequest {
  conclusion: InvestigationConclusion;
  investigationNotes?: string;
}

export interface RecordCompensationPaymentRequest {
  amount: number;
  paymentReference: string;
  receiptUrl?: string;
  paymentDate?: string;
  note?: string;
}

export interface SubmitCompensationEvidenceRequest {
  amount: number;
  paymentReference: string;
  receiptUrl?: string;
  paymentDate?: string;
  note?: string;
}

export const INVESTIGATION_CONCLUSION_LABELS: Record<InvestigationConclusion, { label: string; color: string; desc: string }> = {
  LATE_RETURN_BY_PREVIOUS_USER: {
    label: 'Chậm trễ trả xe do người dùng trước',
    color: '#ef4444',
    desc: 'Người dùng trước hoàn tất trả xe trễ so với giờ hẹn đã đăng ký.',
  },
  LATE_STAFF_PROCESSING: {
    label: 'Chậm trễ quy trình bàn giao của nhân viên',
    color: '#f97316',
    desc: 'Khách đã trả xe đúng hạn nhưng nhân viên kiểm tra / bàn giao chậm.',
  },
  SYSTEM_SYNC_DELAY: {
    label: 'Độ trễ đồng bộ hệ thống / cảm biến',
    color: '#3b82f6',
    desc: 'Dữ liệu IoT / hệ thống cập nhật chậm dẫn đến hiển thị chưa sẵn sàng.',
  },
  OPERATIONAL_PROBLEM: {
    label: 'Sự cố vận hành trạm / phương tiện',
    color: '#eab308',
    desc: 'Xe phát sinh vấn đề kỹ thuật tại trạm cần thời gian xử lý.',
  },
  INSUFFICIENT_EVIDENCE: {
    label: 'Không đủ căn cứ xác định lỗi',
    color: '#a855f7',
    desc: 'Dữ liệu thời gian chưa đủ xác định bên chịu trách nhiệm chính.',
  },
  UNVERIFIED: {
    label: 'Chưa đối soát điều tra',
    color: '#94a3b8',
    desc: 'Hồ sơ đang chờ nhân viên kiểm tra lịch trình thực tế.',
  },
};

export const RESOLUTION_TYPE_LABELS: Record<ResolutionType, string> = {
  NO_COMPENSATION: 'Không bồi thường tiền mặt (Nhắc nhở / Rút kinh nghiệm)',
  FULL_COMPENSATION: 'Bồi thường toàn bộ thiệt hại đã xác minh',
  PARTIAL_COMPENSATION: 'Bồi thường một phần thỏa thuận',
  OPERATIONAL_REMEDY: 'Khắc phục vận hành (Ưu tiên đổi xe / Voucher giờ chạy)',
  ADDITIONAL_INVESTIGATION: 'Tiếp tục điều tra bổ sung',
  ESCALATION: 'Chuyển lên cấp quản lý cao hơn giải quyết',
};

export const PAYER_TYPE_LABELS: Record<PayerType, string> = {
  PREVIOUS_CO_OWNER: 'Đồng sở hữu đi chuyến trước (Bên vi phạm giờ trả)',
  OPERATIONAL_ENTITY: 'Đơn vị vận hành hệ thống (EVShare)',
  OTHER: 'Bên thứ ba khác',
};

export const COMPENSATION_STATUS_LABELS: Record<CompensationStatus, { label: string; bg: string; text: string; border: string }> = {
  APPROVED: {
    label: 'Đã phê duyệt nghĩa vụ',
    bg: 'rgba(59, 130, 246, 0.15)',
    text: '#60a5fa',
    border: 'rgba(59, 130, 246, 0.3)',
  },
  AWAITING_PAYMENT: {
    label: 'Chờ chi trả bồi thường',
    bg: 'rgba(234, 179, 8, 0.15)',
    text: '#eab308',
    border: 'rgba(234, 179, 8, 0.3)',
  },
  PENDING_VERIFICATION: {
    label: 'Chờ xác minh chứng từ',
    bg: 'rgba(168, 85, 247, 0.15)',
    text: '#c084fc',
    border: 'rgba(168, 85, 247, 0.3)',
  },
  PARTIALLY_PAID: {
    label: 'Đã thanh toán một phần',
    bg: 'rgba(249, 115, 22, 0.15)',
    text: '#fb923c',
    border: 'rgba(249, 115, 22, 0.3)',
  },
  PAID: {
    label: 'Đã hoàn tất bồi thường',
    bg: 'rgba(34, 197, 94, 0.15)',
    text: '#4ade80',
    border: 'rgba(34, 197, 94, 0.3)',
  },
  CANCELLED: {
    label: 'Đã hủy',
    bg: 'rgba(239, 68, 68, 0.15)',
    text: '#f87171',
    border: 'rgba(239, 68, 68, 0.3)',
  },
  PENDING_RECIPIENT_CONFIRMATION: {
    label: 'Chờ bên nhận xác nhận (Demo)',
    bg: 'rgba(234, 179, 8, 0.15)',
    text: '#eab308',
    border: 'rgba(234, 179, 8, 0.3)',
  },
  DEMO_AWAITING_RECIPIENT: {
    label: 'Chờ bên nhận xác nhận (Demo)',
    bg: 'rgba(234, 179, 8, 0.15)',
    text: '#eab308',
    border: 'rgba(234, 179, 8, 0.3)',
  },
  DEMO_CONFIRMED: {
    label: 'Đã hoàn tất thanh toán (Demo)',
    bg: 'rgba(34, 197, 94, 0.15)',
    text: '#4ade80',
    border: 'rgba(34, 197, 94, 0.3)',
  },
  DEMO_DISPUTED: {
    label: 'Chưa nhận tiền / Khiếu nại (Demo)',
    bg: 'rgba(239, 68, 68, 0.15)',
    text: '#f87171',
    border: 'rgba(239, 68, 68, 0.3)',
  },
};

export interface DisputeResponse {
  id: string;
  referenceCode: string;
  vehicleId: string;
  vehicleName: string;
  vehicleLicensePlate: string;
  groupId?: string | null;
  groupName?: string | null;
  createdByUserId: string;
  createdByName: string;
  createdByEmail: string;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  category: DisputeCategory;
  categoryVietnamese: string;
  priority: DisputePriority;
  priorityVietnamese: string;
  status: DisputeStatus;
  statusVietnamese: string;
  title: string;
  description: string;
  bookingId?: string | null;
  tripId?: string | null;
  handoverId?: string | null;
  inspectionId?: string | null;
  damageRecordId?: string | null;
  expenseId?: string | null;
  expenseShareId?: string | null;
  personalPaymentId?: string | null;
  proposalId?: string | null;
  ownershipTransferId?: string | null;
  disputedAmount?: number | null;
  evidenceSnapshotJson?: string | null;

  // Incident Investigation (Phase 5.8)
  investigationConclusion?: InvestigationConclusion | null;
  investigationConclusionVi?: string | null;
  investigationNotes?: string | null;
  investigatedByUserId?: string | null;
  investigatedByName?: string | null;
  investigatedAt?: string | null;

  // Structured Mediation & Compensation (Phase 5.8)
  resolutionType?: ResolutionType | null;
  resolutionTypeVi?: string | null;
  proposedAmount?: number | null;
  approvedAmount?: number | null;
  verifiedPaidAmount?: number | null;
  outstandingAmount?: number | null;
  proposedPayerType?: PayerType | null;
  proposedPayerUserId?: string | null;
  proposedPayerName?: string | null;
  proposedRecipientUserId?: string | null;
  proposedRecipientName?: string | null;
  decisionBasis?: string | null;
  resolutionDeadline?: string | null;

  proposedResolution?: string | null;
  proposedResolutionByUserId?: string | null;
  proposedResolutionByName?: string | null;
  proposedResolutionAt?: string | null;
  resolutionAcceptedByParties?: boolean | null;
  resolutionSummary?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  correctiveActionExecuted: boolean;
  correctiveActionSummary?: string | null;
  correctiveActionExecutedAt?: string | null;
  reopenCount: number;
  reopenReason?: string | null;
  participants: DisputeParticipantDto[];
  evidences: DisputeEvidenceDto[];
  messages: DisputeMessageDto[];
  compensations?: DisputeCompensationDto[];
  actionLogs?: DisputeActionLogDto[];
  canEdit: boolean;
  canMediate: boolean;
  canRespondToResolution: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DisputeSummaryResponse {
  totalDisputes?: number;
  submittedCount?: number;
  underReviewCount?: number;
  awaitingEvidenceCount?: number;
  mediationCount?: number;
  proposedResolutionCount?: number;
  votingInProgressCount?: number;
  resolvedCount?: number;
  closedCount?: number;
  rejectedCount?: number;
  countByCategory?: Record<string, number>;

  // Fallback aliases for legacy frontend usage
  total?: number;
  submitted?: number;
  underReview?: number;
  awaitingEvidence?: number;
  mediation?: number;
  proposedResolution?: number;
  votingInProgress?: number;
  resolved?: number;
  closed?: number;
  rejected?: number;
  byCategory?: Record<string, number>;
}

export interface InitialEvidenceItem {
  title: string;
  fileUrl: string;
  fileType?: string;
  fileSizeBytes?: number;
  integrityHash?: string;
}

export interface CreateDisputeRequest {
  vehicleId: string;
  category: DisputeCategory;
  priority?: DisputePriority;
  title: string;
  description: string;
  respondentUserIds?: string[];
  bookingId?: string;
  tripId?: string;
  handoverId?: string;
  inspectionId?: string;
  damageRecordId?: string;
  expenseId?: string;
  expenseShareId?: string;
  personalPaymentId?: string;
  proposalId?: string;
  ownershipTransferId?: string;
  disputedAmount?: number;
  initialEvidences?: InitialEvidenceItem[];
}

export interface CreateDisputeMessageRequest {
  content: string;
  visibility?: DisputeMessageVisibility;
}

export interface ProposeResolutionRequest {
  proposedResolution: string;
  resolutionType?: ResolutionType;
  proposedAmount?: number;
  proposedPayerType?: PayerType;
  proposedPayerUserId?: string;
  proposedPayerName?: string;
  proposedRecipientUserId?: string;
  proposedRecipientName?: string;
  decisionBasis?: string;
  resolutionDeadline?: string;
}

export interface RespondToResolutionRequest {
  accept: boolean;
  note?: string;
}

export interface ExecuteCorrectiveActionRequest {
  correctiveActionSummary: string;
  note?: string;
}

export interface AddEvidenceRequest {
  title: string;
  fileUrl: string;
  fileType?: string;
  fileSizeBytes?: number;
  integrityHash?: string;
}

export interface LinkVotingRequest {
  proposalId: string;
}

export interface CloseDisputeRequest {
  resolutionSummary?: string;
}

export interface ReopenDisputeRequest {
  reason?: string;
}

export const DISPUTE_CATEGORY_LABELS: Record<DisputeCategory, string> = {
  BOOKING: 'Lịch đặt xe',
  VEHICLE_USAGE: 'Sử dụng phương tiện',
  HANDOVER: 'Bàn giao xe',
  RETURN: 'Trả xe',
  VEHICLE_DAMAGE: 'Hư hỏng phương tiện',
  INSPECTION_RESULT: 'Kết quả kiểm tra xe',
  MAINTENANCE: 'Bảo dưỡng / Sửa chữa',
  EXPENSE_ALLOCATION: 'Phân bổ chi phí',
  PAYMENT: 'Thanh toán tài chính',
  OWNERSHIP: 'Tỷ lệ sở hữu',
  OWNERSHIP_TRANSFER: 'Chuyển nhượng cổ phần',
  VOTING: 'Biểu quyết nhóm',
  CONTRACT: 'Hợp đồng điện tử',
  OTHER: 'Khác',
};

export const DISPUTE_STATUS_LABELS: Record<DisputeStatus, string> = {
  SUBMITTED: 'Mới gửi',
  UNDER_REVIEW: 'Đang rà soát',
  AWAITING_EVIDENCE: 'Chờ bằng chứng',
  MEDIATION: 'Đang hòa giải',
  PROPOSED_RESOLUTION: 'Chờ duyệt phương án',
  VOTING_IN_PROGRESS: 'Đang biểu quyết',
  RESOLVED: 'Đã hòa giải',
  CLOSED: 'Đã đóng',
  REOPENED: 'Mở lại',
  REJECTED: 'Đã từ chối',
};

export const DISPUTE_PRIORITY_LABELS: Record<DisputePriority, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Mức độ cao',
  CRITICAL: 'Khẩn cấp',
};

export const DISPUTE_STATUS_COLORS: Record<DisputeStatus, { bg: string; text: string; border: string }> = {
  SUBMITTED: { bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308', border: 'rgba(234, 179, 8, 0.3)' },
  UNDER_REVIEW: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' },
  AWAITING_EVIDENCE: { bg: 'rgba(249, 115, 22, 0.15)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.3)' },
  MEDIATION: { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' },
  PROPOSED_RESOLUTION: { bg: 'rgba(20, 184, 166, 0.15)', text: '#2dd4bf', border: 'rgba(20, 184, 166, 0.3)' },
  VOTING_IN_PROGRESS: { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8', border: 'rgba(99, 102, 241, 0.3)' },
  RESOLVED: { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.3)' },
  CLOSED: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' },
  REOPENED: { bg: 'rgba(236, 72, 153, 0.15)', text: '#f472b6', border: 'rgba(236, 72, 153, 0.3)' },
  REJECTED: { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' },
};

export const DISPUTE_PRIORITY_COLORS: Record<DisputePriority, { bg: string; text: string }> = {
  LOW: { bg: 'rgba(100, 116, 139, 0.2)', text: '#94a3b8' },
  MEDIUM: { bg: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa' },
  HIGH: { bg: 'rgba(249, 115, 22, 0.2)', text: '#fb923c' },
  CRITICAL: { bg: 'rgba(239, 68, 68, 0.25)', text: '#f87171' },
};

// ==========================================
// PHASE 5.6 EVENT-DRIVEN INCIDENT TYPES
// ==========================================

export type BookingIncidentState =
  | 'POTENTIAL_CONFLICT'
  | 'AWAITING_CONFIRMATION'
  | 'CONFIRMED_IMPACT'
  | 'CLEARED';

export const INCIDENT_STATE_LABELS: Record<BookingIncidentState, { label: string; bg: string; text: string; border: string }> = {
  POTENTIAL_CONFLICT: {
    label: 'Nguy cơ chậm trễ',
    bg: 'rgba(249, 115, 22, 0.15)',
    text: '#fb923c',
    border: 'rgba(249, 115, 22, 0.3)',
  },
  AWAITING_CONFIRMATION: {
    label: 'Chờ NV nghiệm thu',
    bg: 'rgba(59, 130, 246, 0.15)',
    text: '#60a5fa',
    border: 'rgba(59, 130, 246, 0.3)',
  },
  CONFIRMED_IMPACT: {
    label: 'Bị ảnh hưởng lịch đặt',
    bg: 'rgba(239, 68, 68, 0.15)',
    text: '#f87171',
    border: 'rgba(239, 68, 68, 0.3)',
  },
  CLEARED: {
    label: 'Đã hoàn tất hợp lệ',
    bg: 'rgba(34, 197, 94, 0.15)',
    text: '#4ade80',
    border: 'rgba(34, 197, 94, 0.3)',
  },
};

export interface IncidentTimelineEvent {
  timestamp: string;
  eventType: string;
  description: string;
  source: string;
  isSystemEvidence: boolean;
}

export interface PrefilledDisputeData {
  vehicleId: string;
  vehicleName: string;
  vehiclePlate: string;
  category: DisputeCategory;
  priority: DisputePriority;
  suggestedTitle: string;
  suggestedDescription: string;
  systemEvidenceSummary: string;
  bookingId: string;
  tripId?: string | null;
  handoverId?: string | null;
  respondentUserIds: string[];
  incidentReference: string;
  detectedAt: string;
  objectiveTimelineText: string;
}

export interface BookingConflictIncident {
  incidentId: string;
  state: BookingIncidentState;
  vehicleId: string;
  vehicleName: string;
  vehiclePlate: string;
  previousBookingId: string;
  previousBookingUserId?: string | null;
  previousBookingUserDisplay: string;
  previousBookingStartTime: string;
  previousBookingEndTime: string;
  impactedBookingId: string;
  impactedBookingUserId?: string | null;
  impactedBookingUserDisplay: string;
  impactedBookingStartTime: string;
  impactedBookingEndTime: string;
  previousTripId?: string | null;
  previousTripStatus: string;
  returnRequestedAt?: string | null;
  returnVerifiedAt?: string | null;
  handoverStaffHandedOverAt?: string | null;
  delayMinutes: number;
  detectedAt: string;
  timelineEvents: IncidentTimelineEvent[];
  prefilledDispute: PrefilledDisputeData;
  hasFormalDispute: boolean;
  formalDisputeId?: string | null;
  formalDisputeReference?: string | null;
}


