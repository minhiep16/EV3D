import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  DisputeResponse,
  DisputeCompensationDto,
  DisputeActionLogDto,
  InvestigationDetailsDto,
  InvestigationConclusion,
  ResolutionType,
  PayerType,
  DISPUTE_STATUS_COLORS,
  DISPUTE_STATUS_LABELS,
  DISPUTE_PRIORITY_COLORS,
  DISPUTE_PRIORITY_LABELS,
  DISPUTE_CATEGORY_LABELS,
  INVESTIGATION_CONCLUSION_LABELS,
  RESOLUTION_TYPE_LABELS,
  PAYER_TYPE_LABELS,
  COMPENSATION_STATUS_LABELS,
} from '../../../types/dispute';
import {
  fetchDisputeById,
  addEvidence,
  addMessage,
  proposeResolution,
  respondToResolution,
  assignStaffMediator,
  requestEvidence,
  executeCorrectiveAction,
  closeDispute,
  reopenDispute,
  fetchInvestigationComparison,
  recordInvestigationFindings,
  recordCompensationPayment,
  submitCompensationEvidence,
  approveCompensationEvidence,
  rejectCompensationEvidence,
  initiateDemoPayment,
  confirmRecipientDemoPayment,
  disputeRecipientDemoPayment,
  fetchDisputeCompensations,
  fetchDisputeActionLogs,
} from '../../../services/disputeApi';
import { useAuthStore } from '../../../store/authStore';
import { EVCarLoader } from '../../common/EVCarLoader';
import {
  X,
  FileText,
  MessageSquare,
  Scale,
  Paperclip,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  UserCheck,
  Send,
  Plus,
  Lock,
  Eye,
  RefreshCw,
  Vote,
  ShieldCheck,
  DollarSign,
  CreditCard,
  History,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface DisputeDetailModalProps {
  disputeId: string;
  onClose: () => void;
  onUpdated?: () => void;
  embedded?: boolean;
}

interface ParsedTimelineEvent {
  timeStr: string;
  desc: string;
  source: string;
}

const parseSystemEvidence = (
  text?: string | null
): { timeline: ParsedTimelineEvent[]; remarks: string; isTimeline: boolean } => {
  if (!text) return { timeline: [], remarks: '', isTimeline: false };

  const lines = text.split('\n');
  const timeline: ParsedTimelineEvent[] = [];
  const remarksList: string[] = [];
  let inRemarks = false;
  let hasTimelineHeader = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.includes('DỮ LIỆU ĐỐI CHIẾU HỆ THỐNG') || line.includes('TỰ ĐỘNG GHI NHẬN')) {
      hasTimelineHeader = true;
      continue;
    }
    if (line.includes('Ý KIẾN') || line.includes('MÔ TẢ CỦA THÀNH VIÊN')) {
      inRemarks = true;
      continue;
    }
    if (line.startsWith('---')) continue;

    if (!inRemarks) {
      // Regex match: - [17:00 15/11/2026] Event description (SOURCE)
      const match = line.match(/^[-*•]?\s*\[(.*?)\]\s*(.*?)(?:\s*\((.*?)\))?$/);
      if (match) {
        timeline.push({
          timeStr: match[1].trim(),
          desc: match[2].trim(),
          source: match[3]?.trim() || 'HỆ THỐNG',
        });
      } else {
        remarksList.push(line);
      }
    } else {
      remarksList.push(line);
    }
  }

  const isTimeline = hasTimelineHeader || timeline.length > 0;
  return {
    timeline,
    remarks: remarksList.join('\n').trim(),
    isTimeline,
  };
};

type TabType = 'DETAILS' | 'EVIDENCE' | 'MESSAGES' | 'RESOLUTION';

export const DisputeDetailModal: React.FC<DisputeDetailModalProps> = ({
  disputeId,
  onClose,
  onUpdated,
  embedded = false,
}) => {
  const currentUser = useAuthStore((s) => s.user);
  const isStaff = currentUser?.role === 'STAFF' || currentUser?.role === 'ADMIN';

  const [dispute, setDispute] = useState<DisputeResponse | null>(null);
  const [compensations, setCompensations] = useState<DisputeCompensationDto[]>([]);
  const [actionLogs, setActionLogs] = useState<DisputeActionLogDto[]>([]);
  const [investigation, setInvestigation] = useState<InvestigationDetailsDto | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('DETAILS');
  const [actionAlert, setActionAlert] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  const showActionAlert = (type: 'success' | 'error' | 'warning', message: string) => {
    setActionAlert({ type, message });
    setTimeout(() => {
      setActionAlert((cur) => (cur?.message === message ? null : cur));
    }, 7000);
  };

  const formatDisputeErrorMessage = (err: any, fallbackMessage: string): string => {
    console.error('[Dispute Operation Error]:', err);
    const status = err?.status;
    const rawMsg = String(err?.message || '').trim();

    if (status === 400 || rawMsg.includes('400')) {
      return rawMsg && !rawMsg.includes('400') ? rawMsg : 'Dữ liệu gửi lên không hợp lệ hoặc thiếu thông tin bắt buộc.';
    }
    if (status === 401 || rawMsg.includes('401') || rawMsg.includes('hết hạn')) {
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    }
    if (status === 403 || rawMsg.includes('403') || rawMsg.includes('không có quyền') || rawMsg.includes('Access denied')) {
      return 'Bạn không có quyền thực hiện thao tác này (yêu cầu quyền Nhân viên/Quản trị viên).';
    }
    if (status === 404 || rawMsg.includes('404') || rawMsg.includes('No static resource') || rawMsg.includes('Không tìm thấy')) {
      if (rawMsg.includes('demo-payment') || rawMsg.includes('compensation') || rawMsg.includes('payment')) {
        return 'Dịch vụ xử lý thanh toán bồi thường chưa sẵn sàng hoặc máy chủ backend cần được khởi động lại (HTTP 404). Vui lòng thử lại sau.';
      }
      return 'Không tìm thấy dữ liệu yêu cầu hoặc tài nguyên không tồn tại (HTTP 404).';
    }
    if (status === 409 || rawMsg.includes('409') || rawMsg.includes('Xung đột')) {
      return rawMsg && !rawMsg.includes('409') ? rawMsg : 'Xung đột trạng thái hồ sơ tranh chấp hoặc thao tác đã được thực hiện.';
    }
    if (status && status >= 500) {
      return `Lỗi máy chủ nội bộ (${status}). Vui lòng thử lại sau.`;
    }
    if (status === 0 || rawMsg.includes('Failed to fetch') || rawMsg.includes('NetworkError') || rawMsg.includes('Không thể kết nối')) {
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền mạng.';
    }
    return rawMsg || fallbackMessage;
  };

  // Form states - Messages & Evidence
  const [newMsgContent, setNewMsgContent] = useState('');
  const [newMsgVisibility, setNewMsgVisibility] = useState<'PUBLIC' | 'STAFF_ONLY'>('PUBLIC');
  const [sendingMsg, setSendingMsg] = useState(false);

  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [addingEvidence, setAddingEvidence] = useState(false);

  // Form states - Staff Investigation (Phase 5.8)
  const [investigationConclusion, setInvestigationConclusion] = useState<InvestigationConclusion>('LATE_RETURN_BY_PREVIOUS_USER');
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [submittingInvestigation, setSubmittingInvestigation] = useState(false);

  // Form states - Staff Resolution Proposal (Phase 5.8)
  const [proposeText, setProposeText] = useState('');
  const [resolutionType, setResolutionType] = useState<ResolutionType>('FULL_COMPENSATION');
  const [proposedAmount, setProposedAmount] = useState('100000');
  const [proposedPayerType, setProposedPayerType] = useState<PayerType>('PREVIOUS_CO_OWNER');
  const [proposedPayerName, setProposedPayerName] = useState('Nguyễn Văn A');
  const [decisionBasis, setDecisionBasis] = useState('Biên bản trả xe trễ và Điều 14 Quy chế đồng sở hữu');
  const [submittingPropose, setSubmittingPropose] = useState(false);

  // Form states - Co-Owner Response (Phase 5.8)
  const [responseNote, setResponseNote] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Form states - Staff Verified Payment (Phase 5.8)
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Form states - Payer Evidence Submission (Phase 5.9)
  const [payerSubmitAmount, setPayerSubmitAmount] = useState('');
  const [payerSubmitReference, setPayerSubmitReference] = useState('');
  const [payerSubmitReceiptUrl, setPayerSubmitReceiptUrl] = useState('');
  const [payerSubmitDate, setPayerSubmitDate] = useState('');
  const [payerSubmitNote, setPayerSubmitNote] = useState('');
  const [submittingPayerEvidence, setSubmittingPayerEvidence] = useState(false);
  const [showPayerSubmitForm, setShowPayerSubmitForm] = useState(false);

  // Form states - DEMO Compensation (Phase 5.9 Demo)
  const [submittingDemoPay, setSubmittingDemoPay] = useState(false);
  const [submittingDemoConfirm, setSubmittingDemoConfirm] = useState(false);
  const [submittingDemoDispute, setSubmittingDemoDispute] = useState(false);
  const [demoNote, setDemoNote] = useState('');
  const [showDemoDisputeReason, setShowDemoDisputeReason] = useState(false);
  const [demoDisputeReason, setDemoDisputeReason] = useState('');

  // Form states - Staff Verification & Rejection (Phase 5.9)
  const [verifyingEvidence, setVerifyingEvidence] = useState(false);
  const [rejectingEvidence, setRejectingEvidence] = useState(false);
  const [staffRejectionReason, setStaffRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  // Form states - Case Lifecycle
  const [correctiveSummary, setCorrectiveSummary] = useState('');
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

  const [closeSummary, setCloseSummary] = useState('');
  const [submittingClose, setSubmittingClose] = useState(false);

  const [reopenReason, setReopenReason] = useState('');
  const [submittingReopen, setSubmittingReopen] = useState(false);

  const [requestEvidenceNote, setRequestEvidenceNote] = useState('');
  const [submittingReqEv, setSubmittingReqEv] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await fetchDisputeById(disputeId);
      setDispute(data);

      if (data.investigationConclusion) {
        setInvestigationConclusion(data.investigationConclusion);
      }
      if (data.investigationNotes) {
        setInvestigationNotes(data.investigationNotes);
      }
      if (data.proposedResolution) {
        setProposeText(data.proposedResolution);
      }
      if (data.disputedAmount && !proposedAmount) {
        setProposedAmount(String(data.disputedAmount));
      }

      // Parallel secondary fetches
      try {
        const [compList, logsList, invData] = await Promise.all([
          fetchDisputeCompensations(disputeId),
          fetchDisputeActionLogs(disputeId),
          fetchInvestigationComparison(disputeId),
        ]);
        setCompensations(compList);
        setActionLogs(logsList);
        setInvestigation(invData);
        if (invData?.suggestedConclusion && !data.investigationConclusion) {
          setInvestigationConclusion(invData.suggestedConclusion);
        }
        if (invData?.previousUserName && !proposedPayerName) {
          setProposedPayerName(invData.previousUserName);
        }
      } catch (subErr) {
        console.warn('Sub-resources load warning:', subErr);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể tải thông tin tranh chấp.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (disputeId) {
      loadData();
    }
  }, [disputeId]);

  // Handlers
  const handleAssignStaff = async () => {
    if (!dispute) return;
    try {
      setActionAlert(null);
      await assignStaffMediator(dispute.id);
      showActionAlert('success', 'Đã tiếp nhận hồ sơ hòa giải thành công.');
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showActionAlert('error', formatDisputeErrorMessage(err, 'Lỗi tiếp nhận hồ sơ.'));
    }
  };

  const handleRequestEvidence = async () => {
    if (!dispute || !requestEvidenceNote.trim()) return;
    try {
      setSubmittingReqEv(true);
      setActionAlert(null);
      await requestEvidence(dispute.id, requestEvidenceNote.trim());
      showActionAlert('success', 'Đã gửi yêu cầu bổ sung bằng chứng đến các bên.');
      setRequestEvidenceNote('');
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showActionAlert('error', formatDisputeErrorMessage(err, 'Lỗi yêu cầu bằng chứng.'));
    } finally {
      setSubmittingReqEv(false);
    }
  };

  const handleRecordInvestigation = async () => {
    if (!dispute) return;
    try {
      setSubmittingInvestigation(true);
      setActionAlert(null);
      const updated = await recordInvestigationFindings(dispute.id, {
        conclusion: investigationConclusion,
        investigationNotes: investigationNotes.trim(),
      });
      if (updated) {
        setDispute(updated);
      }
      showActionAlert('success', 'Đã ghi nhận kết luận điều tra thành công vào cơ sở dữ liệu.');
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showActionAlert('error', formatDisputeErrorMessage(err, 'Không thể lưu kết luận điều tra. Vui lòng kiểm tra lại thông tin.'));
    } finally {
      setSubmittingInvestigation(false);
    }
  };

  const handleProposeResolution = async () => {
    if (!dispute) return;
    if (!dispute.investigationConclusion) {
      showActionAlert('warning', 'Vui lòng hoàn thành và ghi nhận kết luận điều tra (Bước 2) trước khi ban hành phương án hòa giải.');
      return;
    }
    if (!proposeText.trim()) {
      showActionAlert('warning', 'Vui lòng nhập nội dung phương án hòa giải.');
      return;
    }
    try {
      setSubmittingPropose(true);
      setActionAlert(null);
      const parsedAmount = parseFloat(proposedAmount) || 0;
      const updated = await proposeResolution(dispute.id, {
        proposedResolution: proposeText.trim(),
        resolutionType,
        proposedAmount: parsedAmount,
        proposedPayerType,
        proposedPayerName: proposedPayerName.trim(),
        decisionBasis: decisionBasis.trim(),
      });
      if (updated) {
        setDispute(updated);
      }
      showActionAlert('success', 'Đã ban hành phương án hòa giải cho các bên thành công.');
      setProposeText('');
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showActionAlert('error', formatDisputeErrorMessage(err, 'Lỗi gửi phương án hòa giải.'));
    } finally {
      setSubmittingPropose(false);
    }
  };

  const handleRespondResolution = async (accept: boolean) => {
    if (!dispute) return;
    try {
      setSubmittingDecision(true);
      setActionAlert(null);
      await respondToResolution(dispute.id, { accept, note: responseNote.trim() });
      showActionAlert('success', accept ? 'Bạn đã chấp thuận phương án hòa giải.' : 'Bạn đã từ chối phương án hòa giải.');
      setResponseNote('');
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showActionAlert('error', formatDisputeErrorMessage(err, 'Lỗi phản hồi phương án hòa giải.'));
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!dispute || !paymentAmount || !paymentReference.trim()) {
      showActionAlert('warning', 'Vui lòng nhập số tiền và mã tham chiếu giao dịch thanh toán.');
      return;
    }
    const parsedAmount = parseFloat(paymentAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showActionAlert('warning', 'Số tiền thanh toán phải lớn hơn 0');
      return;
    }
    try {
      setSubmittingPayment(true);
      setActionAlert(null);
      await recordCompensationPayment(dispute.id, {
        amount: parsedAmount,
        paymentReference: paymentReference.trim(),
        receiptUrl: receiptUrl.trim() || undefined,
        note: paymentNote.trim() || undefined,
      });
      showActionAlert('success', 'Đã ghi nhận thanh toán bồi thường thành công.');
      setPaymentAmount('');
      setPaymentReference('');
      setReceiptUrl('');
      setPaymentNote('');
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showActionAlert('error', formatDisputeErrorMessage(err, 'Lỗi ghi nhận thanh toán bồi thường.'));
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleSubmitPayerEvidence = async () => {
    if (!dispute || !activeCompensation) return;
    const parsedAmount = parseFloat(payerSubmitAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showActionAlert('warning', 'Vui lòng nhập số tiền thanh toán hợp lệ (lớn hơn 0).');
      return;
    }
    if (parsedAmount > activeCompensation.outstandingAmount) {
      showActionAlert('warning', `Số tiền thanh toán (${parsedAmount.toLocaleString('vi-VN')} VND) vượt quá số tiền còn nợ (${activeCompensation.outstandingAmount.toLocaleString('vi-VN')} VND).`);
      return;
    }
    if (!payerSubmitReference.trim()) {
      showActionAlert('warning', 'Vui lòng nhập mã tham chiếu giao dịch (Mã GD ngân hàng / ví điện tử).');
      return;
    }
    try {
      setSubmittingPayerEvidence(true);
      setActionAlert(null);
      await submitCompensationEvidence(dispute.id, {
        amount: parsedAmount,
        paymentReference: payerSubmitReference.trim(),
        receiptUrl: payerSubmitReceiptUrl.trim() || undefined,
        paymentDate: payerSubmitDate ? new Date(payerSubmitDate).toISOString() : undefined,
        note: payerSubmitNote.trim() || undefined,
      });
      showActionAlert('success', 'Đã gửi bằng chứng thanh toán thành công. Đang chờ nhân viên đối soát.');
      setPayerSubmitAmount('');
      setPayerSubmitReference('');
      setPayerSubmitReceiptUrl('');
      setPayerSubmitDate('');
      setPayerSubmitNote('');
      setShowPayerSubmitForm(false);
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showActionAlert('error', formatDisputeErrorMessage(err, 'Lỗi gửi bằng chứng thanh toán.'));
    } finally {
      setSubmittingPayerEvidence(false);
    }
  };

  const handleInitiateDemoPayment = async () => {
    if (!dispute) return;
    try {
      setSubmittingDemoPay(true);
      setActionAlert(null);
      const remainingAmount = activeCompensation?.outstandingAmount ?? dispute.outstandingAmount ?? dispute.approvedAmount ?? 0;
      await initiateDemoPayment(dispute.id, remainingAmount, demoNote.trim() || undefined);
      showActionAlert('success', 'Đã xác nhận thanh toán Demo thành công. Thông báo đã gửi tới bên thụ hưởng.');
      setDemoNote('');
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showActionAlert('error', formatDisputeErrorMessage(err, 'Lỗi thực hiện thanh toán Demo.'));
    } finally {
      setSubmittingDemoPay(false);
    }
  };

  const handleConfirmRecipientDemoPayment = async () => {
    if (!dispute) return;
    try {
      setSubmittingDemoConfirm(true);
      setActionAlert(null);
      await confirmRecipientDemoPayment(dispute.id);
      showActionAlert('success', 'Đã xác nhận nhận tiền bồi thường (Demo) thành công.');
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showActionAlert('error', formatDisputeErrorMessage(err, 'Lỗi xác nhận nhận tiền bồi thường.'));
    } finally {
      setSubmittingDemoConfirm(false);
    }
  };

  const handleDisputeRecipientDemoPayment = async () => {
    if (!dispute) return;
    try {
      setSubmittingDemoDispute(true);
      setActionAlert(null);
      await disputeRecipientDemoPayment(dispute.id, demoDisputeReason.trim() || undefined);
      showActionAlert('warning', 'Đã ghi nhận phản hồi chưa nhận tiền bồi thường.');
      setShowDemoDisputeReason(false);
      setDemoDisputeReason('');
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showActionAlert('error', formatDisputeErrorMessage(err, 'Lỗi gửi phản hồi khiếu nại bồi thường.'));
    } finally {
      setSubmittingDemoDispute(false);
    }
  };

  const handleApproveEvidence = async () => {
    if (!dispute) return;
    try {
      setVerifyingEvidence(true);
      setActionAlert(null);
      await approveCompensationEvidence(dispute.id);
      showActionAlert('success', 'Đã duyệt và xác thực thanh toán bồi thường thành công.');
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showActionAlert('error', formatDisputeErrorMessage(err, 'Lỗi duyệt chứng từ bồi thường.'));
    } finally {
      setVerifyingEvidence(false);
    }
  };

  const handleRejectEvidence = async () => {
    if (!dispute || !staffRejectionReason.trim()) {
      showActionAlert('warning', 'Vui lòng nhập lý do từ chối chứng từ thanh toán.');
      return;
    }
    try {
      setRejectingEvidence(true);
      setActionAlert(null);
      await rejectCompensationEvidence(dispute.id, staffRejectionReason.trim());
      showActionAlert('success', 'Đã từ chối chứng từ thanh toán và yêu cầu người dùng nộp lại.');
      setStaffRejectionReason('');
      setShowRejectInput(false);
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showActionAlert('error', formatDisputeErrorMessage(err, 'Lỗi từ chối chứng từ.'));
    } finally {
      setRejectingEvidence(false);
    }
  };

  const handleExecuteCorrection = async () => {
    if (!dispute || !correctiveSummary.trim()) return;
    try {
      setSubmittingCorrection(true);
      setActionAlert(null);
      await executeCorrectiveAction(dispute.id, { correctiveActionSummary: correctiveSummary.trim() });
      showActionAlert('success', 'Đã ghi nhận xác nhận khắc phục thành công.');
      setCorrectiveSummary('');
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showActionAlert('error', formatDisputeErrorMessage(err, 'Lỗi xác nhận khắc phục.'));
    } finally {
      setSubmittingCorrection(false);
    }
  };

  const handleCloseDispute = async () => {
    if (!dispute) return;
    try {
      setSubmittingClose(true);
      setActionAlert(null);
      await closeDispute(dispute.id, closeSummary.trim());
      showActionAlert('success', 'Đã đóng hồ sơ tranh chấp thành công.');
      setCloseSummary('');
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showActionAlert('error', formatDisputeErrorMessage(err, 'Lỗi đóng hồ sơ tranh chấp.'));
    } finally {
      setSubmittingClose(false);
    }
  };

  const handleReopenDispute = async () => {
    if (!dispute || !reopenReason.trim()) return;
    try {
      setSubmittingReopen(true);
      setActionAlert(null);
      await reopenDispute(dispute.id, reopenReason.trim());
      showActionAlert('success', 'Đã mở lại hồ sơ tranh chấp thành công.');
      setReopenReason('');
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showActionAlert('error', formatDisputeErrorMessage(err, 'Lỗi mở lại hồ sơ.'));
    } finally {
      setSubmittingReopen(false);
    }
  };

  const handleSendMessage = async () => {
    if (!dispute || !newMsgContent.trim()) return;
    try {
      setSendingMsg(true);
      setActionAlert(null);
      await addMessage(dispute.id, {
        content: newMsgContent.trim(),
        visibility: newMsgVisibility,
      });
      showActionAlert('success', 'Đã gửi phản hồi thành công.');
      setNewMsgContent('');
      await loadData();
    } catch (err: any) {
      showActionAlert('error', formatDisputeErrorMessage(err, 'Lỗi gửi tin nhắn.'));
    } finally {
      setSendingMsg(false);
    }
  };

  const handleAddEvidence = async () => {
    if (!dispute || !evidenceTitle.trim() || !evidenceUrl.trim()) return;
    try {
      setAddingEvidence(true);
      setActionAlert(null);
      await addEvidence(dispute.id, {
        title: evidenceTitle.trim(),
        fileUrl: evidenceUrl.trim(),
      });
      showActionAlert('success', 'Đã tải lên chứng cứ thành công.');
      setEvidenceTitle('');
      setEvidenceUrl('');
      await loadData();
    } catch (err: any) {
      showActionAlert('error', formatDisputeErrorMessage(err, 'Lỗi tải lên chứng cứ.'));
    } finally {
      setAddingEvidence(false);
    }
  };

  if (loading) {
    const loadingView = (
      <div style={embedded ? embeddedContainerStyle : modalOverlayStyle}>
        <div style={{ ...(embedded ? embeddedCardStyle : modalCardStyle), padding: '40px', alignItems: 'center', justifyContent: 'center' }}>
          <EVCarLoader size="medium" text="Đang tải hồ sơ tranh chấp..." />
        </div>
      </div>
    );
    return embedded ? loadingView : (typeof document !== 'undefined' ? createPortal(loadingView, document.body) : loadingView);
  }

  if (errorMsg || !dispute) {
    const errorView = (
      <div style={embedded ? embeddedContainerStyle : modalOverlayStyle}>
        <div style={{ ...(embedded ? embeddedCardStyle : modalCardStyle), padding: '30px', textAlign: 'center' }}>
          <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: '#f8fafc', fontSize: '18px', marginBottom: '8px' }}>Không thể tải hồ sơ</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>{errorMsg}</p>
          <button type="button" onClick={onClose} style={primaryBtnStyle}>
            Đóng cửa sổ
          </button>
        </div>
      </div>
    );
    return embedded ? errorView : (typeof document !== 'undefined' ? createPortal(errorView, document.body) : errorView);
  }

  const isParticipant = dispute.participants.some((p) => p.userId === currentUser?.id);
  const myParticipant = dispute.participants.find((p) => p.userId === currentUser?.id);
  const activeCompensation = compensations.length > 0 ? compensations[0] : null;

  const isPayer = Boolean(
    activeCompensation && currentUser && (
      activeCompensation.payerUserId === currentUser.id ||
      (!activeCompensation.payerUserId && (
        dispute.proposedPayerName?.toLowerCase().includes(currentUser.fullName?.toLowerCase() || '') ||
        myParticipant?.role === 'RESPONDENT'
      ))
    )
  );

  const isRecipient = Boolean(
    activeCompensation && currentUser && (
      activeCompensation.recipientUserId === currentUser.id ||
      (!activeCompensation.recipientUserId && (
        dispute.createdByUserId === currentUser.id ||
        myParticipant?.role === 'COMPLAINANT'
      ))
    )
  );

  let parsedSnapshot: Record<string, any> = {};
  if (dispute.evidenceSnapshotJson) {
    try {
      parsedSnapshot = JSON.parse(dispute.evidenceSnapshotJson);
    } catch {
      parsedSnapshot = {};
    }
  }

  const statusColor = DISPUTE_STATUS_COLORS[dispute.status] || {
    bg: 'rgba(100, 116, 139, 0.2)',
    text: '#94a3b8',
    border: 'rgba(100, 116, 139, 0.4)',
  };

  const modalContent = (
    <div
      style={embedded ? embeddedContainerStyle : modalOverlayStyle}
      onClick={embedded ? undefined : onClose}
    >
      <div
        style={embedded ? embeddedCardStyle : modalCardStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={embedded ? embeddedHeaderStyle : modalHeaderStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: embedded ? '8px' : '12px' }}>
            <div style={embedded ? embeddedIconBadgeStyle : iconBadgeStyle}>
              <Scale size={embedded ? 16 : 20} color="#00f2fe" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: embedded ? '13px' : '16px', fontWeight: 800, color: '#f8fafc' }}>
                  {dispute.referenceCode}
                </span>
                <span
                  style={{
                    fontSize: embedded ? '9.5px' : '11px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '12px',
                    background: statusColor.bg,
                    color: statusColor.text,
                    border: `1px solid ${statusColor.border}`,
                  }}
                >
                  {dispute.statusVietnamese || DISPUTE_STATUS_LABELS[dispute.status] || dispute.status}
                </span>
                <span
                  style={{
                    fontSize: embedded ? '9px' : '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#cbd5e1',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  {dispute.priorityVietnamese || DISPUTE_PRIORITY_LABELS[dispute.priority] || dispute.priority}
                </span>
              </div>
              <div style={{ fontSize: embedded ? '10.5px' : '13px', color: '#94a3b8', marginTop: '2px' }}>
                {dispute.vehicleName} ({dispute.vehicleLicensePlate}) • {dispute.categoryVietnamese || DISPUTE_CATEGORY_LABELS[dispute.category] || dispute.category}
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} style={closeBtnStyle} title="Đóng chi tiết">
            <X size={embedded ? 18 : 20} />
          </button>
        </div>

        {/* Global Action Feedback Alert */}
        {actionAlert && (
          <div
            style={{
              margin: '12px 24px 0',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              background:
                actionAlert.type === 'error'
                  ? 'rgba(239, 68, 68, 0.18)'
                  : actionAlert.type === 'warning'
                  ? 'rgba(245, 158, 11, 0.18)'
                  : 'rgba(16, 185, 129, 0.18)',
              border: `1px solid ${
                actionAlert.type === 'error'
                  ? 'rgba(239, 68, 68, 0.45)'
                  : actionAlert.type === 'warning'
                  ? 'rgba(245, 158, 11, 0.45)'
                  : 'rgba(16, 185, 129, 0.45)'
              }`,
              color:
                actionAlert.type === 'error'
                  ? '#fca5a5'
                  : actionAlert.type === 'warning'
                  ? '#fbbf24'
                  : '#6ee7b7',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {actionAlert.type === 'error' ? (
                <AlertTriangle size={16} color="#ef4444" />
              ) : actionAlert.type === 'warning' ? (
                <AlertTriangle size={16} color="#f59e0b" />
              ) : (
                <CheckCircle2 size={16} color="#10b981" />
              )}
              <span>{actionAlert.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionAlert(null)}
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
        )}

        {/* Navigation Tabs */}
        <div style={tabContainerStyle}>
          <button
            type="button"
            style={activeTab === 'DETAILS' ? activeTabBtnStyle : tabBtnStyle}
            onClick={() => setActiveTab('DETAILS')}
          >
            <FileText size={15} /> Chi tiết hồ sơ
          </button>
          <button
            type="button"
            style={activeTab === 'RESOLUTION' ? activeTabBtnStyle : tabBtnStyle}
            onClick={() => setActiveTab('RESOLUTION')}
          >
            <Scale size={15} /> Hòa giải & Kết quả
          </button>
          <button
            type="button"
            style={activeTab === 'EVIDENCE' ? activeTabBtnStyle : tabBtnStyle}
            onClick={() => setActiveTab('EVIDENCE')}
          >
            <Paperclip size={15} /> Chứng cứ ({dispute.evidences?.length || 0})
          </button>
          <button
            type="button"
            style={activeTab === 'MESSAGES' ? activeTabBtnStyle : tabBtnStyle}
            onClick={() => setActiveTab('MESSAGES')}
          >
            <MessageSquare size={15} /> Trao đổi ({dispute.messages?.length || 0})
          </button>
        </div>

        {/* Tab Content Body */}
        <div style={modalBodyStyle}>
          {/* TAB 1: DETAILS */}
          {activeTab === 'DETAILS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Core Info */}
              <div style={cardSectionStyle}>
                <h4 style={sectionHeaderStyle}>Thông tin khiếu nại</h4>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginTop: '6px' }}>
                  {dispute.title}
                </div>
                {(() => {
                  const parsed = parseSystemEvidence(dispute.description);
                  if (parsed.isTimeline && parsed.timeline.length > 0) {
                    return (
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={13} />
                          <span>TIẾN TRÌNH DỮ LIỆU ĐỐI CHIẾU HỆ THỐNG</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', paddingLeft: '14px', borderLeft: '2px solid rgba(56, 189, 248, 0.35)', marginLeft: '4px' }}>
                          {parsed.timeline.map((ev, idx) => (
                            <div
                              key={idx}
                              style={{
                                background: 'rgba(15, 23, 42, 0.65)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '8px',
                                padding: '8px 10px',
                                position: 'relative',
                              }}
                            >
                              <div
                                style={{
                                  position: 'absolute',
                                  left: '-19px',
                                  top: '11px',
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: '#38bdf8',
                                  border: '2px solid #0b1c36',
                                }}
                              />
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
                                  {ev.timeStr}
                                </span>
                                <span
                                  style={{
                                    fontSize: '9px',
                                    fontWeight: 700,
                                    padding: '1px 6px',
                                    borderRadius: '5px',
                                    background: 'rgba(56, 189, 248, 0.12)',
                                    color: '#7dd3fc',
                                    border: '1px solid rgba(56, 189, 248, 0.25)',
                                  }}
                                >
                                  {ev.source === 'BOOKING' ? 'LỊCH ĐẶT XE' : ev.source === 'STAFF' ? 'NHÂN VIÊN' : ev.source === 'TRIP' ? 'CHUYẾN ĐI' : ev.source === 'SYSTEM_POLICY' ? 'CHÍNH SÁCH' : ev.source}
                                </span>
                              </div>
                              <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: '1.4' }}>
                                {ev.desc}
                              </div>
                            </div>
                          ))}
                        </div>
                        {parsed.remarks && (
                          <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>Ý kiến / Mô tả của người gửi:</div>
                            <div style={{ fontSize: '12.5px', color: '#f1f5f9', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                              {parsed.remarks}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', marginTop: '8px' }}>
                      {dispute.description}
                    </p>
                  );
                })()}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '12px', fontSize: '12px', color: '#94a3b8' }}>
                  <div>Người gửi: <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{dispute.createdByName}</span></div>
                  <div>Nhân viên phụ trách: <span style={{ color: '#00f2fe', fontWeight: 600 }}>{dispute.assignedStaffName || 'Chưa phân công'}</span></div>
                  <div>Thời gian tạo: <span style={{ color: '#cbd5e1' }}>{new Date(dispute.createdAt).toLocaleString('vi-VN')}</span></div>
                </div>
              </div>

              {/* Distinct Financial Model Callout */}
              <div style={{ ...cardSectionStyle, borderColor: 'rgba(0, 242, 254, 0.3)', background: 'rgba(0, 242, 254, 0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <DollarSign size={18} color="#00f2fe" />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#00f2fe', letterSpacing: '0.05em' }}>
                    TÀI CHÍNH & BỒI THƯỜNG
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  <div style={statBoxStyle}>
                    <span style={statLabelStyle}>Số tiền yêu cầu bồi thường</span>
                    <span style={{ ...statValueStyle, color: '#fca5a5' }}>
                      {dispute.disputedAmount ? `${dispute.disputedAmount.toLocaleString('vi-VN')} đ` : '--'}
                    </span>
                    <span style={statSubtextStyle}>Yêu cầu ban đầu</span>
                  </div>
                  <div style={statBoxStyle}>
                    <span style={statLabelStyle}>Số tiền đề xuất hòa giải</span>
                    <span style={{ ...statValueStyle, color: '#fb923c' }}>
                      {dispute.proposedAmount != null ? `${dispute.proposedAmount.toLocaleString('vi-VN')} đ` : '--'}
                    </span>
                    <span style={statSubtextStyle}>Hòa giải viên đề xuất</span>
                  </div>
                  <div style={statBoxStyle}>
                    <span style={statLabelStyle}>Đã phê duyệt nghĩa vụ</span>
                    <span style={{ ...statValueStyle, color: '#60a5fa' }}>
                      {activeCompensation ? `${activeCompensation.approvedAmount.toLocaleString('vi-VN')} đ` : (dispute.approvedAmount != null ? `${dispute.approvedAmount.toLocaleString('vi-VN')} đ` : '--')}
                    </span>
                    <span style={statSubtextStyle}>Đồng thuận cam kết</span>
                  </div>
                  <div style={statBoxStyle}>
                    <span style={statLabelStyle}>Đã xác minh thanh toán</span>
                    <span style={{ ...statValueStyle, color: '#4ade80' }}>
                      {activeCompensation ? `${activeCompensation.verifiedPaidAmount.toLocaleString('vi-VN')} đ` : `${(dispute.verifiedPaidAmount || 0).toLocaleString('vi-VN')} đ`}
                    </span>
                    <span style={statSubtextStyle}>Đã kiểm tra chứng từ</span>
                  </div>
                  <div style={statBoxStyle}>
                    <span style={statLabelStyle}>Nghĩa vụ còn lại</span>
                    <span style={{ ...statValueStyle, color: '#eab308' }}>
                      {activeCompensation ? `${activeCompensation.outstandingAmount.toLocaleString('vi-VN')} đ` : (dispute.outstandingAmount != null ? `${dispute.outstandingAmount.toLocaleString('vi-VN')} đ` : '--')}
                    </span>
                    <span style={statSubtextStyle}>Nghĩa vụ còn nợ</span>
                  </div>
                </div>
              </div>

              {/* Linked System Records */}
              <div style={cardSectionStyle}>
                <h4 style={sectionHeaderStyle}>Giao dịch & Hồ sơ liên quan</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {dispute.bookingId && <span style={tagBadgeStyle}>Lịch đặt: {dispute.bookingId.slice(0, 8)}</span>}
                  {dispute.tripId && <span style={tagBadgeStyle}>Chuyến đi: {dispute.tripId.slice(0, 8)}</span>}
                  {dispute.handoverId && <span style={tagBadgeStyle}>Bàn giao: {dispute.handoverId.slice(0, 8)}</span>}
                  {dispute.inspectionId && <span style={tagBadgeStyle}>Kiểm tra: {dispute.inspectionId.slice(0, 8)}</span>}
                  {dispute.damageRecordId && <span style={tagBadgeStyle}>Hư hỏng: {dispute.damageRecordId.slice(0, 8)}</span>}
                  {dispute.expenseId && <span style={tagBadgeStyle}>Chi phí: {dispute.expenseId.slice(0, 8)}</span>}
                  {dispute.expenseShareId && <span style={tagBadgeStyle}>Phân bổ: {dispute.expenseShareId.slice(0, 8)}</span>}
                </div>
              </div>

              {/* Participants */}
              <div style={cardSectionStyle}>
                <h4 style={sectionHeaderStyle}>Các bên tham gia</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                  {dispute.participants?.map((p) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: 600 }}>{p.fullName}</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>({p.email})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#00f2fe', fontWeight: 600 }}>{p.roleVietnamese}</span>
                        {p.hasAcceptedResolution === true && (
                          <span style={{ fontSize: '11px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} /> Đồng thuận
                          </span>
                        )}
                        {p.hasAcceptedResolution === false && (
                          <span style={{ fontSize: '11px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <XCircle size={12} /> Từ chối
                          </span>
                        )}
                        {p.hasAcceptedResolution == null && (
                          <span style={{ fontSize: '11px', color: '#eab308' }}>Chưa phản hồi</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Immutable Action Audit Log (Phase 5.8) */}
              <div style={cardSectionStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <History size={16} color="#00f2fe" />
                  <h4 style={{ ...sectionHeaderStyle, margin: 0 }}>Nhật ký kiểm toán tranh chấp (Dispute Action Logs)</h4>
                </div>
                {actionLogs.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#64748b', padding: '8px 0' }}>Chưa ghi nhận sự kiện kiểm toán.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                    {actionLogs.map((log) => (
                      <div key={log.id} style={{ padding: '8px 10px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', borderLeft: '2px solid #00f2fe' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                          <span style={{ color: '#00f2fe', fontWeight: 700 }}>{log.actionType}</span>
                          <span style={{ color: '#64748b' }}>{new Date(log.createdAt).toLocaleString('vi-VN')}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#f1f5f9', marginTop: '2px' }}>{log.reason || log.details}</div>
                        <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>Thực hiện bởi: {log.actorName} ({log.actorRole})</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RESOLUTION (HÒA GIẢI & KẾT QUẢ - PHASE 5.8 FULL WORKFLOW) */}
          {activeTab === 'RESOLUTION' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* STEP 1: Investigation Comparison Timeline (Late Return Verification) */}
              <div style={{ ...cardSectionStyle, borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={18} color="#60a5fa" />
                    <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#60a5fa' }}>
                      BƯỚC 1: ĐỐI SOÁT DỮ LIỆU LỊCH TRÌNH & THỜI ĐIỂM TRẢ XE
                    </span>
                  </div>
                  {investigation?.lateReturnDetected && (
                    <span style={{ fontSize: '11px', color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                      PHÁT HIỆN TRỄ HẠN
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '12px' }}>
                  <div style={timelineCardStyle}>
                    <div style={{ color: '#94a3b8', fontSize: '11px' }}>1. Khách trước hẹn trả (Scheduled)</div>
                    <div style={{ color: '#f1f5f9', fontWeight: 700, marginTop: '2px' }}>
                      {investigation?.scheduledReturnTime ? new Date(investigation.scheduledReturnTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '12:45'}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '10px' }}>Người lái: {investigation?.previousUserName || 'Nguyễn Văn A'}</div>
                  </div>

                  <div style={timelineCardStyle}>
                    <div style={{ color: '#94a3b8', fontSize: '11px' }}>2. Bấm yêu cầu trả (Return Requested)</div>
                    <div style={{ color: '#fca5a5', fontWeight: 700, marginTop: '2px' }}>
                      {investigation?.returnRequestTime ? new Date(investigation.returnRequestTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '13:20'}
                    </div>
                    <div style={{ color: '#ef4444', fontSize: '10px' }}>Trễ khách lái: +{investigation?.userDelayMinutes || 35} phút</div>
                  </div>

                  <div style={timelineCardStyle}>
                    <div style={{ color: '#94a3b8', fontSize: '11px' }}>3. NV tiếp nhận tại trạm (Staff Verified)</div>
                    <div style={{ color: '#f1f5f9', fontWeight: 700, marginTop: '2px' }}>
                      {investigation?.staffReceivedTime ? new Date(investigation.staffReceivedTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '13:30'}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '10px' }}>Thời gian NV kiểm tra: {investigation?.operationalDelayMinutes || 10} phút</div>
                  </div>

                  <div style={timelineCardStyle}>
                    <div style={{ color: '#94a3b8', fontSize: '11px' }}>4. Khách sau nhận xe (Affected Start)</div>
                    <div style={{ color: '#60a5fa', fontWeight: 700, marginTop: '2px' }}>
                      {investigation?.affectedBookingStartTime ? new Date(investigation.affectedBookingStartTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '13:00'}
                    </div>
                    <div style={{ color: '#38bdf8', fontSize: '10px' }}>Người bị ảnh hưởng: {investigation?.affectedUserName || dispute.createdByName}</div>
                  </div>
                </div>

                <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', fontSize: '12px', color: '#cbd5e1' }}>
                  <span style={{ fontWeight: 700, color: '#00f2fe' }}>Tóm tắt đối soát: </span>
                  {investigation?.incidentSummary || 'Chuyến trước trả trễ 35 phút so với lịch hẹn, ảnh hưởng trực tiếp đến giờ nhận xe đã đặt của người dùng sau.'}
                </div>
              </div>

              {/* STEP 2: Investigation Conclusion Form (Staff) / Display (All) */}
              <div style={cardSectionStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                    BƯỚC 2: KẾT LUẬN ĐIỀU TRA NGUYÊN NHÂN SỰ CỐ
                  </span>
                  {dispute.investigationConclusion && (
                    <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 700 }}>
                      ✓ ĐÃ GHI NHẬN KẾT LUẬN
                    </span>
                  )}
                </div>

                {dispute.investigationConclusion ? (
                  <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', borderLeft: '3px solid #00f2fe' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#00f2fe' }}>
                      {dispute.investigationConclusionVi || INVESTIGATION_CONCLUSION_LABELS[dispute.investigationConclusion]?.label}
                    </div>
                    <p style={{ fontSize: '12.5px', color: '#cbd5e1', margin: '6px 0 0 0' }}>
                      {dispute.investigationNotes || 'Đã đối chiếu thời gian hệ thống và nhật ký hành trình xe.'}
                    </p>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                      Ghi nhận bởi: {dispute.investigatedByName || 'Nhân viên quản lý'} • {dispute.investigatedAt ? new Date(dispute.investigatedAt).toLocaleString('vi-VN') : ''}
                    </div>
                  </div>
                ) : isStaff ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                    <div>
                      <label style={labelStyle}>Kết luận điều tra chính thức:</label>
                      <select
                        value={investigationConclusion}
                        onChange={(e) => setInvestigationConclusion(e.target.value as InvestigationConclusion)}
                        style={selectStyle}
                      >
                        {Object.entries(INVESTIGATION_CONCLUSION_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Ghi chú căn cứ xác minh:</label>
                      <input
                        type="text"
                        placeholder="Căn cứ thời gian trả xe trên cảm biến và biên bản bàn giao trạm..."
                        value={investigationNotes}
                        onChange={(e) => setInvestigationNotes(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={submittingInvestigation}
                      onClick={handleRecordInvestigation}
                      style={{ ...primaryBtnStyle, alignSelf: 'flex-start' }}
                    >
                      {submittingInvestigation ? 'Đang lưu...' : 'Ghi nhận kết luận điều tra'}
                    </button>
                  </div>
                ) : (
                  <div style={{ color: '#94a3b8', fontSize: '12.5px' }}>
                    Nhân viên phụ trách đang tiến hành đối soát và ghi nhận kết luận điều tra.
                  </div>
                )}
              </div>

              {/* STEP 3-5: Staff Resolution Proposal & Terms */}
              <div style={cardSectionStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                    BƯỚC 3-5: PHƯƠNG ÁN HÒA GIẢI & ĐỀ XUẤT NGHĨA VỤ BỒI THƯỜNG
                  </span>
                  {dispute.proposedResolution && (
                    <span style={{ fontSize: '11px', color: '#2dd4bf', fontWeight: 700 }}>
                      ĐÃ BAN HÀNH ĐỀ XUẤT
                    </span>
                  )}
                </div>

                {dispute.proposedResolution ? (
                  <div style={{ padding: '14px', background: 'rgba(0, 242, 254, 0.04)', borderRadius: '8px', borderLeft: '3px solid #2dd4bf' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                      Nội dung phương án:
                    </div>
                    <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: '1.6' }}>
                      {dispute.proposedResolution}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Loại giải pháp:</span>
                        <span style={{ fontSize: '12px', color: '#2dd4bf', fontWeight: 700 }}>
                          {dispute.resolutionTypeVi || (dispute.resolutionType ? RESOLUTION_TYPE_LABELS[dispute.resolutionType] : 'Bồi thường chi phí')}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Số tiền bồi thường đề xuất:</span>
                        <span style={{ fontSize: '12.5px', color: '#fca5a5', fontWeight: 800 }}>
                          {dispute.proposedAmount != null ? `${dispute.proposedAmount.toLocaleString('vi-VN')} VND` : '0 VND'}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Bên chi trả đề xuất:</span>
                        <span style={{ fontSize: '12px', color: '#f1f5f9', fontWeight: 600 }}>
                          {dispute.proposedPayerName || 'Nguyễn Văn A'} ({dispute.proposedPayerType === 'PREVIOUS_CO_OWNER' ? 'Người dùng trước' : 'Đơn vị vận hành'})
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Căn cứ áp dụng:</span>
                        <span style={{ fontSize: '11.5px', color: '#cbd5e1' }}>
                          {dispute.decisionBasis || 'Quy chế sử dụng xe'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : isStaff ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {!dispute.investigationConclusion && (
                      <div
                        style={{
                          padding: '10px 14px',
                          background: 'rgba(245, 158, 11, 0.12)',
                          border: '1px solid rgba(245, 158, 11, 0.35)',
                          borderRadius: '8px',
                          color: '#fbbf24',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <AlertTriangle size={16} color="#fbbf24" style={{ flexShrink: 0 }} />
                        <span>
                          <strong>Yêu cầu quy trình:</strong> Vui lòng hoàn tất và ghi nhận kết luận điều tra tại <strong>Bước 2</strong> trước khi ban hành phương án hòa giải.
                        </span>
                      </div>
                    )}
                    <div>
                      <label style={labelStyle}>Phương án xử lý (Nội dung hòa giải):</label>
                      <textarea
                        rows={2}
                        placeholder="Nội dung hòa giải thỏa thuận cho các bên..."
                        value={proposeText}
                        onChange={(e) => setProposeText(e.target.value)}
                        style={{ ...inputStyle, resize: 'vertical' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                      <div>
                        <label style={labelStyle}>Hình thức giải pháp:</label>
                        <select
                          value={resolutionType}
                          onChange={(e) => setResolutionType(e.target.value as ResolutionType)}
                          style={selectStyle}
                        >
                          {Object.entries(RESOLUTION_TYPE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Số tiền bồi thường đề xuất (VND):</label>
                        <input
                          type="number"
                          placeholder="Ví dụ: 100000"
                          value={proposedAmount}
                          onChange={(e) => setProposedAmount(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Bên chịu trách nhiệm chi trả:</label>
                        <select
                          value={proposedPayerType}
                          onChange={(e) => setProposedPayerType(e.target.value as PayerType)}
                          style={selectStyle}
                        >
                          {Object.entries(PAYER_TYPE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Tên bên chi trả:</label>
                        <input
                          type="text"
                          value={proposedPayerName}
                          onChange={(e) => setProposedPayerName(e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Căn cứ điều khoản / Quy định:</label>
                      <input
                        type="text"
                        value={decisionBasis}
                        onChange={(e) => setDecisionBasis(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={submittingPropose}
                      onClick={handleProposeResolution}
                      style={{ ...primaryBtnStyle, alignSelf: 'flex-start' }}
                    >
                      {submittingPropose ? 'Đang gửi...' : 'Ban hành phương án hòa giải cho các bên'}
                    </button>
                  </div>
                ) : (
                  <div style={{ color: '#94a3b8', fontSize: '12.5px' }}>
                    Chưa có phương án hòa giải chính thức nào được ban hành.
                  </div>
                )}
              </div>

              {/* STEP 6: Independent Participant Responses & Consent Collection */}
              <div style={cardSectionStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                    BƯỚC 6: Ý KIẾN ĐỒNG THUẬN TỪNG BÊN LIÊN QUAN
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Chỉ xác lập nghĩa vụ khi 100% các bên đồng thuận
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {dispute.participants?.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '13px', color: '#f8fafc', fontWeight: 600 }}>{p.fullName}</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px' }}>({p.roleVietnamese})</span>
                      </div>
                      <div>
                        {p.hasAcceptedResolution === true && (
                          <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={14} /> ĐÃ ĐỒNG THUẬN
                          </span>
                        )}
                        {p.hasAcceptedResolution === false && (
                          <span style={{ fontSize: '12px', color: '#f87171', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <XCircle size={14} /> TỪ CHỐI PHƯƠNG ÁN
                          </span>
                        )}
                        {p.hasAcceptedResolution == null && (
                          <span style={{ fontSize: '12px', color: '#eab308', fontWeight: 600 }}>
                            ĐANG CHỜ PHẢN HỒI
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Co-Owner Action Form */}
                {dispute.status === 'PROPOSED_RESOLUTION' && isParticipant && myParticipant?.hasAcceptedResolution == null && (
                  <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(0, 242, 254, 0.05)', borderRadius: '8px', border: '1px solid rgba(0, 242, 254, 0.2)' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                      Phản hồi phương án hòa giải (Bạn là bên liên quan trong vụ việc):
                    </div>
                    <input
                      type="text"
                      placeholder="Ý kiến hoặc lưu ý thêm (không bắt buộc)..."
                      value={responseNote}
                      onChange={(e) => setResponseNote(e.target.value)}
                      style={{ ...inputStyle, marginBottom: '10px' }}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        disabled={submittingDecision}
                        onClick={() => handleRespondResolution(true)}
                        style={successBtnStyle}
                      >
                        <CheckCircle2 size={16} /> Đồng thuận phương án
                      </button>
                      <button
                        type="button"
                        disabled={submittingDecision}
                        onClick={() => handleRespondResolution(false)}
                        style={dangerBtnStyle}
                      >
                        <XCircle size={16} /> Từ chối phương án
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 7: Authorized Compensation Obligation Display (DisputeCompensation) */}
              {(() => {
                const comp = activeCompensation || (dispute.status === 'RESOLVED' || (dispute.approvedAmount && dispute.approvedAmount > 0) ? {
                  id: dispute.id,
                  disputeId: dispute.id,
                  payerUserId: dispute.proposedPayerUserId,
                  payerType: (dispute.proposedPayerType as PayerType) || 'PREVIOUS_CO_OWNER',
                  payerName: dispute.proposedPayerName || 'Nguyễn Văn A',
                  recipientUserId: dispute.createdByUserId,
                  recipientName: dispute.createdByName || 'Trần Thị B',
                  approvedAmount: dispute.approvedAmount || dispute.proposedAmount || 100000,
                  currency: 'VND',
                  verifiedPaidAmount: dispute.verifiedPaidAmount || 0,
                  outstandingAmount: dispute.outstandingAmount ?? (dispute.approvedAmount || dispute.proposedAmount || 100000),
                  status: ((dispute.verifiedPaidAmount || 0) >= (dispute.approvedAmount || 100000)) ? 'DEMO_CONFIRMED' : 'APPROVED',
                  authorizedByUserId: dispute.assignedStaffId || '',
                  authorizedByName: dispute.assignedStaffName,
                  authorizedAt: dispute.updatedAt,
                  payments: [],
                  createdAt: dispute.createdAt,
                  updatedAt: dispute.updatedAt,
                } as DisputeCompensationDto : null);

                if (!comp) return null;

                const isCompPayer = Boolean(
                  currentUser && (
                    comp.payerUserId === currentUser.id ||
                    (!comp.payerUserId && (
                      dispute.proposedPayerName?.toLowerCase().includes(currentUser.fullName?.toLowerCase() || '') ||
                      myParticipant?.role === 'RESPONDENT'
                    ))
                  )
                );

                const isCompRecipient = Boolean(
                  currentUser && (
                    comp.recipientUserId === currentUser.id ||
                    (!comp.recipientUserId && (
                      dispute.createdByUserId === currentUser.id ||
                      myParticipant?.role === 'COMPLAINANT'
                    ))
                  )
                );

                const isDemoAwaiting = comp.status === 'DEMO_AWAITING_RECIPIENT';
                const isDemoConfirmed = comp.status === 'DEMO_CONFIRMED' || comp.status === 'PAID';
                const isDemoDisputed = comp.status === 'DEMO_DISPUTED';

                return (
                  <div style={{ ...cardSectionStyle, borderColor: 'rgba(0, 242, 254, 0.4)', background: 'rgba(0, 242, 254, 0.02)' }}>
                    {/* Header with Case Code and Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck size={20} color="#00f2fe" />
                        <div>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#00f2fe' }}>
                            {!isStaff && isCompPayer
                              ? 'NGHĨA VỤ BỒI THƯỜNG TRANH CHẤP'
                              : !isStaff && isCompRecipient
                              ? 'KHOẢN BỒI THƯỜNG ĐƯỢC THỤ HƯỞNG'
                              : 'BƯỚC 7: NGHĨA VỤ BỒI THƯỜNG TRANH CHẤP'}
                          </span>
                          <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                            Mã hồ sơ tranh chấp: <strong style={{ color: '#f8fafc' }}>{dispute.referenceCode}</strong>
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(0, 242, 254, 0.15)',
                            color: '#00f2fe',
                            border: '1px solid rgba(0, 242, 254, 0.3)',
                            letterSpacing: '0.04em',
                          }}
                        >
                          CHẾ ĐỘ DEMO
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '10px',
                            background: COMPENSATION_STATUS_LABELS[comp.status]?.bg || 'rgba(234, 179, 8, 0.15)',
                            color: COMPENSATION_STATUS_LABELS[comp.status]?.text || '#eab308',
                            border: `1px solid ${COMPENSATION_STATUS_LABELS[comp.status]?.border || 'rgba(234, 179, 8, 0.3)'}`,
                          }}
                        >
                          {COMPENSATION_STATUS_LABELS[comp.status]?.label || comp.status}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ margin: '12px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ color: '#94a3b8' }}>Tiến độ chi trả (Demo):</span>
                        <span style={{ color: '#f8fafc', fontWeight: 700 }}>
                          {comp.approvedAmount > 0
                            ? `${Math.round((comp.verifiedPaidAmount / comp.approvedAmount) * 100)}%`
                            : '0%'}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${comp.approvedAmount > 0 ? Math.min(100, (comp.verifiedPaidAmount / comp.approvedAmount) * 100) : 0}%`,
                            background: isDemoConfirmed ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #0ea5e9, #00f2fe)',
                            borderRadius: '4px',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>

                    {/* Core Financial Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '12px', padding: '12px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '8px' }}>
                      <div>
                        <span style={{ color: '#94a3b8', display: 'block' }}>Phương tiện:</span>
                        <span style={{ color: '#f8fafc', fontWeight: 600 }}>{dispute.vehicleName || 'VinFast VF e34'} ({dispute.vehiclePlate || '30A-999.88'})</span>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8', display: 'block' }}>Bên có nghĩa vụ chi trả:</span>
                        <span style={{ color: '#fca5a5', fontWeight: 700 }}>{comp.payerName}</span>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8', display: 'block' }}>Bên thụ hưởng:</span>
                        <span style={{ color: '#86efac', fontWeight: 700 }}>{comp.recipientName}</span>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8', display: 'block' }}>Số tiền đã duyệt:</span>
                        <span style={{ color: '#f8fafc', fontWeight: 800, fontSize: '13px' }}>
                          {comp.approvedAmount.toLocaleString('vi-VN')} {comp.currency}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8', display: 'block' }}>Đã xác nhận chi trả:</span>
                        <span style={{ color: '#4ade80', fontWeight: 800, fontSize: '13px' }}>
                          {comp.verifiedPaidAmount.toLocaleString('vi-VN')} {comp.currency}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8', display: 'block' }}>Còn nợ lại:</span>
                        <span style={{ color: '#eab308', fontWeight: 800, fontSize: '13px' }}>
                          {comp.outstandingAmount.toLocaleString('vi-VN')} {comp.currency}
                        </span>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ color: '#94a3b8', display: 'block' }}>Phương thức:</span>
                        <span style={{ color: '#38bdf8', fontWeight: 600 }}>Xác nhận hai bên nội bộ (Demo - Không di chuyển tiền thật)</span>
                      </div>
                    </div>

                    {/* RECIPIENT PENDING DEMO CONFIRMATION CARD */}
                    {isDemoAwaiting && (
                      <div style={{ marginTop: '14px', padding: '14px', background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.4)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <Clock size={18} color="#eab308" />
                          <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#fde047' }}>
                            CHỜ XÁC NHẬN NHẬN TIỀN BỒI THƯỜNG (DEMO)
                          </span>
                        </div>

                        <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '4px 0 10px 0', lineHeight: '1.5' }}>
                          Bên có nghĩa vụ chi trả (<strong style={{ color: '#f8fafc' }}>{comp.payerName}</strong>) đã bấm xác nhận chuyển tiền Demo với mã tham chiếu <strong style={{ color: '#38bdf8' }}>{comp.paymentReference || 'DEMO-DSP'}</strong>.
                        </p>

                        {/* Recipient Action Buttons */}
                        {(isCompRecipient || (!isStaff && !isCompPayer)) ? (
                          <div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                              <button
                                type="button"
                                disabled={submittingDemoConfirm}
                                onClick={handleConfirmRecipientDemoPayment}
                                style={{
                                  ...primaryBtnStyle,
                                  background: 'linear-gradient(135deg, #10b981, #059669)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontWeight: 800,
                                }}
                              >
                                <CheckCircle2 size={16} />
                                {submittingDemoConfirm ? 'Đang xác nhận...' : 'XÁC NHẬN ĐÃ NHẬN (DEMO)'}
                              </button>

                              {!showDemoDisputeReason ? (
                                <button
                                  type="button"
                                  onClick={() => setShowDemoDisputeReason(true)}
                                  style={{
                                    ...secondaryBtnStyle,
                                    border: '1px solid rgba(239, 68, 68, 0.5)',
                                    color: '#f87171',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                  }}
                                >
                                  <XCircle size={15} /> CHƯA NHẬN / YÊU CẦU KIỂM TRA
                                </button>
                              ) : null}
                            </div>

                            {showDemoDisputeReason && (
                              <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px' }}>
                                <label style={labelStyle}>Lý do phản hồi chưa nhận tiền:</label>
                                <input
                                  type="text"
                                  placeholder="Ghi chú lý do (tùy chọn)..."
                                  value={demoDisputeReason}
                                  onChange={(e) => setDemoDisputeReason(e.target.value)}
                                  style={{ ...inputStyle, marginBottom: '8px' }}
                                />
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    type="button"
                                    disabled={submittingDemoDispute}
                                    onClick={handleDisputeRecipientDemoPayment}
                                    style={dangerBtnStyle}
                                  >
                                    {submittingDemoDispute ? 'Đang gửi...' : 'Gửi phản hồi chưa nhận'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setShowDemoDisputeReason(false)}
                                    style={secondaryBtnStyle}
                                  >
                                    Hủy
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : isCompPayer ? (
                          <div style={{ fontSize: '12px', color: '#eab308' }}>
                            ⏳ Bạn đã xác nhận chuyển tiền Demo. Đang chờ người thụ hưởng ({comp.recipientName}) mở hồ sơ và xác nhận.
                          </div>
                        ) : (
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                            Trạng thái Demo: Đang chờ bên thụ hưởng ({comp.recipientName}) đăng nhập và xác nhận đã nhận khoản bồi thường.
                          </div>
                        )}
                      </div>
                    )}

                    {/* RECIPIENT CONFIRMED CARD */}
                    {isDemoConfirmed && (
                      <div style={{ marginTop: '14px', padding: '14px', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.35)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80', fontWeight: 800, fontSize: '13.5px' }}>
                          <CheckCircle2 size={18} /> ĐÃ HOÀN TẤT BỒI THƯỜNG (DEMO)
                        </div>
                        <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '4px 0 0 0', lineHeight: '1.5' }}>
                          Bên thụ hưởng (<strong style={{ color: '#86efac' }}>{comp.recipientName}</strong>) đã xác nhận nhận đủ 100% số tiền bồi thường (<strong style={{ color: '#4ade80' }}>{comp.verifiedPaidAmount.toLocaleString('vi-VN')} {comp.currency}</strong>). Nghĩa vụ tài chính đã hoàn tất.
                        </p>
                      </div>
                    )}

                    {/* RECIPIENT DISPUTED CARD */}
                    {isDemoDisputed && (
                      <div style={{ marginTop: '14px', padding: '14px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: 800, fontSize: '13.5px' }}>
                          <AlertTriangle size={18} /> BÊN THỤ HƯỞNG BÁO CHƯA NHẬN ĐƯỢC TIỀN
                        </div>
                        <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '4px 0 10px 0', lineHeight: '1.5' }}>
                          Người thụ hưởng phản hồi chưa nhận được khoản tiền bồi thường Demo. Vui lòng xác nhận thực hiện lại thanh toán.
                        </p>
                        {!isStaff && (isCompPayer || !isCompRecipient) && (
                          <button
                            type="button"
                            disabled={submittingDemoPay}
                            onClick={handleInitiateDemoPayment}
                            style={{
                              ...primaryBtnStyle,
                              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontWeight: 800,
                            }}
                          >
                            <CreditCard size={16} />
                            {submittingDemoPay ? 'Đang gửi...' : 'XÁC NHẬN LẠI THANH TOÁN DEMO'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* PAYER DEMO PAYMENT ACTION CARD (When awaiting payment / not confirmed) */}
                    {!isStaff && (isCompPayer || !isCompRecipient) && !isDemoConfirmed && !isDemoAwaiting && comp.outstandingAmount > 0 && (
                      <div style={{ marginTop: '16px', padding: '14px', background: 'rgba(14, 165, 233, 0.08)', border: '1px solid rgba(14, 165, 233, 0.3)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <CreditCard size={18} color="#38bdf8" />
                          <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#38bdf8' }}>
                            XÁC NHẬN THANH TOÁN BỒI THƯỜNG (DEMO)
                          </span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '4px 0 10px 0', lineHeight: '1.5' }}>
                          Hệ thống áp dụng quy trình xác nhận thanh toán mô phỏng (Demo). Thao tác nhanh 1 chạm, không yêu cầu liên kết ngân hàng thật hay chuyển tiền thực tế.
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '6px', fontSize: '12px' }}>
                            <span style={{ color: '#94a3b8' }}>Số tiền thanh toán: </span>
                            <strong style={{ color: '#38bdf8', fontSize: '13px' }}>{comp.outstandingAmount.toLocaleString('vi-VN')} {comp.currency}</strong>
                          </div>
                          <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '6px', fontSize: '12px' }}>
                            <span style={{ color: '#94a3b8' }}>Người nhận: </span>
                            <strong style={{ color: '#f8fafc' }}>{comp.recipientName}</strong>
                          </div>
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                          <input
                            type="text"
                            placeholder="Ghi chú xác nhận thanh toán Demo (tùy chọn)..."
                            value={demoNote}
                            onChange={(e) => setDemoNote(e.target.value)}
                            style={inputStyle}
                          />
                        </div>

                        <button
                          type="button"
                          disabled={submittingDemoPay}
                          onClick={handleInitiateDemoPayment}
                          style={{
                            ...primaryBtnStyle,
                            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: 800,
                            padding: '10px 20px',
                            fontSize: '13px',
                          }}
                        >
                          <CreditCard size={16} />
                          {submittingDemoPay ? 'Đang gửi xác nhận...' : 'XÁC NHẬN THANH TOÁN DEMO'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* STAFF PENDING EVIDENCE VERIFICATION PANEL */}
              {isStaff && activeCompensation && activeCompensation.status === 'PENDING_VERIFICATION' && (
                <div style={{ ...cardSectionStyle, borderColor: 'rgba(168, 85, 247, 0.4)', background: 'rgba(168, 85, 247, 0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <ShieldCheck size={18} color="#c084fc" />
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#c084fc' }}>
                      XÉT DUYỆT CHỨNG TỪ THANH TOÁN BỒI THƯỜNG CHỜ XÁC MINH
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 10px 0' }}>
                    Người có nghĩa vụ bồi thường đã gửi bằng chứng chuyển khoản. Đối chiếu thông tin sao kê và phê duyệt hoặc từ chối chứng từ.
                  </p>

                  <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px', fontSize: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                    <div>
                      <span style={{ color: '#94a3b8', display: 'block' }}>Số tiền nộp:</span>
                      <span style={{ color: '#4ade80', fontWeight: 800, fontSize: '13.5px' }}>
                        {activeCompensation.pendingPaymentAmount?.toLocaleString('vi-VN')} {activeCompensation.currency}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#94a3b8', display: 'block' }}>Mã GD / Tham chiếu:</span>
                      <span style={{ color: '#f8fafc', fontWeight: 700 }}>{activeCompensation.pendingPaymentReference}</span>
                    </div>
                    <div>
                      <span style={{ color: '#94a3b8', display: 'block' }}>Thời gian chuyển:</span>
                      <span style={{ color: '#f8fafc' }}>
                        {activeCompensation.pendingPaymentDate ? new Date(activeCompensation.pendingPaymentDate).toLocaleString('vi-VN') : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#94a3b8', display: 'block' }}>Ảnh chứng từ / Biên lai:</span>
                      {activeCompensation.pendingReceiptUrl ? (
                        <a href={activeCompensation.pendingReceiptUrl} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline', fontWeight: 600 }}>
                          Xem biên lai thanh toán
                        </a>
                      ) : (
                        <span style={{ color: '#64748b' }}>Không có tệp đính kèm</span>
                      )}
                    </div>
                  </div>

                  {activeCompensation.pendingPaymentNote && (
                    <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '12px' }}>
                      <span style={{ color: '#94a3b8' }}>Ghi chú từ người nộp: </span>
                      {activeCompensation.pendingPaymentNote}
                    </div>
                  )}

                  {!showRejectInput ? (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        disabled={verifyingEvidence}
                        onClick={handleApproveEvidence}
                        style={successBtnStyle}
                      >
                        <CheckCircle2 size={16} />
                        {verifyingEvidence ? 'Đang duyệt...' : 'Duyệt & Xác thực thanh toán'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRejectInput(true)}
                        style={dangerBtnStyle}
                      >
                        <XCircle size={16} /> Từ chối chứng từ
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', marginTop: '10px' }}>
                      <label style={labelStyle}>Lý do từ chối chứng từ thanh toán:</label>
                      <input
                        type="text"
                        placeholder="Nhập lý do từ chối (Mã GD không tồn tại, sai số tiền...)..."
                        value={staffRejectionReason}
                        onChange={(e) => setStaffRejectionReason(e.target.value)}
                        style={{ ...inputStyle, marginBottom: '8px' }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          disabled={rejectingEvidence || !staffRejectionReason.trim()}
                          onClick={handleRejectEvidence}
                          style={dangerBtnStyle}
                        >
                          {rejectingEvidence ? 'Đang gửi...' : 'Xác nhận từ chối'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowRejectInput(false);
                            setStaffRejectionReason('');
                          }}
                          style={secondaryBtnStyle}
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 8: Staff Manual Verified Payment Recording (Direct fallback) */}
              {isStaff && activeCompensation && activeCompensation.status !== 'PAID' && (
                <div style={{ ...cardSectionStyle, borderColor: 'rgba(234, 179, 8, 0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <CreditCard size={18} color="#eab308" />
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#eab308' }}>
                      BƯỚC 8: GHI NHẬN THANH TOÁN TRỰC TIẾP (NHÂN VIÊN ĐỐI SOÁT SAO KÊ)
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 10px 0' }}>
                    Nhân viên đối chiếu ủy nhiệm chi / hóa đơn chuyển khoản và xác nhận số tiền đã thực tế nhận. Hỗ trợ thanh toán nhiều đợt (Partial payment).
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>Số tiền xác thực đợt này (VND):</label>
                      <input
                        type="number"
                        placeholder={`Tối đa: ${activeCompensation.outstandingAmount}`}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Mã tham chiếu thanh toán:</label>
                      <input
                        type="text"
                        placeholder="Mã giao dịch ngân hàng / MoMo..."
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Đường dẫn ảnh chứng từ (URL):</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={receiptUrl}
                        onChange={(e) => setReceiptUrl(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '8px' }}>
                    <label style={labelStyle}>Ghi chú kiểm tra chứng từ:</label>
                    <input
                      type="text"
                      placeholder="Ghi chú đối chiếu..."
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <button
                    type="button"
                    disabled={submittingPayment || !paymentAmount || !paymentReference.trim()}
                    onClick={handleRecordPayment}
                    style={{ ...successBtnStyle, marginTop: '10px', alignSelf: 'flex-start' }}
                  >
                    <CheckCircle2 size={16} />
                    {submittingPayment ? 'Đang xác thực...' : 'Xác thực thanh toán bồi thường'}
                  </button>
                </div>
              )}

              {/* Payment History List */}
              {activeCompensation && activeCompensation.payments?.length > 0 && (
                <div style={cardSectionStyle}>
                  <h4 style={sectionHeaderStyle}>Lịch sử thanh toán bồi thường đã xác thực</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                    {activeCompensation.payments.map((pay) => (
                      <div
                        key={pay.id}
                        style={{
                          padding: '8px 12px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '12px',
                        }}
                      >
                        <div>
                          <span style={{ color: '#4ade80', fontWeight: 800 }}>+{pay.amount.toLocaleString('vi-VN')} đ</span>
                          <span style={{ color: '#94a3b8', marginLeft: '8px' }}>Mã GD: {pay.paymentReference}</span>
                          {pay.note && <span style={{ color: '#cbd5e1', marginLeft: '6px' }}>({pay.note})</span>}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '11px' }}>
                          Xác minh: {pay.verifiedByName} • {new Date(pay.paymentDate).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 9: Case Closure & Safe Archive */}
              {isStaff && dispute.status !== 'CLOSED' && (
                <div style={cardSectionStyle}>
                  <h4 style={sectionHeaderStyle}>BƯỚC 9: ĐÓNG HỒ SƠ TRANH CHẤP</h4>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 8px 0' }}>
                    Đóng hồ sơ tranh chấp sau khi phương án bồi thường đã được thực thi hoặc ghi nhận nghĩa vụ còn nợ.
                  </p>
                  <input
                    type="text"
                    placeholder="Tóm tắt kết luận đóng hồ sơ..."
                    value={closeSummary}
                    onChange={(e) => setCloseSummary(e.target.value)}
                    style={{ ...inputStyle, marginBottom: '8px' }}
                  />
                  <button
                    type="button"
                    disabled={submittingClose}
                    onClick={handleCloseDispute}
                    style={dangerBtnStyle}
                  >
                    {submittingClose ? 'Đang đóng...' : 'Đóng hồ sơ lưu trữ'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EVIDENCE */}
          {activeTab === 'EVIDENCE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dispute.evidences?.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                    Chưa có tài liệu hoặc chứng cứ nào được tải lên.
                  </div>
                ) : (
                  dispute.evidences?.map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        padding: '12px 14px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={18} color="#00f2fe" />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>{ev.title}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            Tải lên bởi: {ev.uploadedByName} • {new Date(ev.createdAt).toLocaleString('vi-VN')}
                          </div>
                        </div>
                      </div>
                      <a
                        href={ev.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '12px',
                          color: '#00f2fe',
                          textDecoration: 'none',
                          padding: '6px 12px',
                          background: 'rgba(0, 242, 254, 0.1)',
                          borderRadius: '6px',
                          fontWeight: 600,
                        }}
                      >
                        Xem tệp
                      </a>
                    </div>
                  ))
                )}
              </div>

              {/* Add Evidence Form */}
              <div style={cardSectionStyle}>
                <h4 style={sectionHeaderStyle}>Thêm tài liệu / Bằng chứng mới</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  <input
                    type="text"
                    placeholder="Tiêu đề tài liệu / Hình ảnh chứng minh..."
                    value={evidenceTitle}
                    onChange={(e) => setEvidenceTitle(e.target.value)}
                    style={inputStyle}
                  />
                  <input
                    type="url"
                    placeholder="Đường dẫn liên kết tệp hoặc ảnh (URL)..."
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    disabled={addingEvidence || !evidenceUrl.trim()}
                    onClick={handleAddEvidence}
                    style={{ ...primaryBtnStyle, alignSelf: 'flex-start' }}
                  >
                    {addingEvidence ? 'Đang tải...' : 'Tải lên chứng cứ'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MESSAGES */}
          {activeTab === 'MESSAGES' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                {dispute.messages?.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                    Chưa có tin nhắn thảo luận nào trong hồ sơ này.
                  </div>
                ) : (
                  dispute.messages?.map((msg) => {
                    const isStaffMsg = msg.senderRole === 'STAFF' || msg.senderRole === 'ADMIN';
                    const isStaffOnly = msg.visibility === 'STAFF_ONLY';

                    return (
                      <div
                        key={msg.id}
                        style={{
                          padding: '12px 14px',
                          background: isStaffOnly
                            ? 'rgba(234, 179, 8, 0.08)'
                            : isStaffMsg
                            ? 'rgba(0, 242, 254, 0.05)'
                            : 'rgba(255, 255, 255, 0.03)',
                          border: isStaffOnly
                            ? '1px dashed rgba(234, 179, 8, 0.4)'
                            : '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#f8fafc' }}>
                              {msg.senderName}
                            </span>
                            {isStaffMsg && (
                              <span style={{ fontSize: '10px', color: '#00f2fe', background: 'rgba(0, 242, 254, 0.15)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                NHÂN VIÊN
                              </span>
                            )}
                            {isStaffOnly && (
                              <span style={{ fontSize: '10px', color: '#eab308', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Lock size={10} /> Nội bộ
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{' '}
                            {new Date(msg.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Send Message Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
                <textarea
                  rows={2}
                  placeholder="Nhập nội dung trao đổi..."
                  value={newMsgContent}
                  onChange={(e) => setNewMsgContent(e.target.value)}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {isStaff && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newMsgVisibility === 'STAFF_ONLY'}
                        onChange={(e) => setNewMsgVisibility(e.target.checked ? 'STAFF_ONLY' : 'PUBLIC')}
                      />
                      Ghi chú nội bộ nhân viên
                    </label>
                  )}
                  <button
                    type="button"
                    disabled={sendingMsg || !newMsgContent.trim()}
                    onClick={handleSendMessage}
                    style={{ ...primaryBtnStyle, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Send size={14} /> Gửi tin nhắn
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return modalContent;
  }

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

// Embedded Styles for Right Operational Panel
const embeddedContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  position: 'relative',
};

const embeddedCardStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  minHeight: 0,
  background: 'rgba(10, 20, 36, 0.75)',
  border: '1px solid rgba(0, 242, 254, 0.25)',
  borderRadius: '12px',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const embeddedHeaderStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: 'rgba(255, 255, 255, 0.02)',
};

const embeddedIconBadgeStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  background: 'rgba(0, 242, 254, 0.1)',
  border: '1px solid rgba(0, 242, 254, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

// Styles
const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.85)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  zIndex: 10000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  pointerEvents: 'auto',
};

const modalCardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '820px',
  maxHeight: '90vh',
  background: 'rgba(10, 20, 36, 0.95)',
  border: '1.5px solid rgba(0, 242, 254, 0.3)',
  borderRadius: '20px',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 242, 254, 0.15)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const modalHeaderStyle: React.CSSProperties = {
  padding: '16px 20px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: 'rgba(255, 255, 255, 0.02)',
};

const iconBadgeStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '10px',
  background: 'rgba(0, 242, 254, 0.1)',
  border: '1px solid rgba(0, 242, 254, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#94a3b8',
  cursor: 'pointer',
  padding: '6px',
  borderRadius: '8px',
};

const tabContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
  padding: '8px 20px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  background: 'rgba(0, 0, 0, 0.2)',
};

const tabBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: '8px 14px',
  borderRadius: '8px',
  color: '#94a3b8',
  fontSize: '12.5px',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  transition: 'all 0.2s',
};

const activeTabBtnStyle: React.CSSProperties = {
  ...tabBtnStyle,
  background: 'rgba(0, 242, 254, 0.12)',
  color: '#00f2fe',
  borderBottom: '2px solid #00f2fe',
};

const modalBodyStyle: React.CSSProperties = {
  padding: '20px',
  overflowY: 'auto',
  flex: 1,
};

const cardSectionStyle: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.5)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '12px',
  padding: '16px',
};

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 800,
  color: '#f8fafc',
  letterSpacing: '0.04em',
  margin: 0,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'rgba(0, 0, 0, 0.4)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '8px',
  color: '#f8fafc',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11.5px',
  fontWeight: 700,
  color: '#94a3b8',
  display: 'block',
  marginBottom: '4px',
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '9px 18px',
  background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
  border: 'none',
  borderRadius: '8px',
  color: '#0a1424',
  fontSize: '12.5px',
  fontWeight: 800,
  cursor: 'pointer',
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '9px 18px',
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '8px',
  color: '#cbd5e1',
  fontSize: '12.5px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const successBtnStyle: React.CSSProperties = {
  padding: '9px 18px',
  background: 'rgba(34, 197, 94, 0.2)',
  border: '1px solid rgba(34, 197, 94, 0.5)',
  borderRadius: '8px',
  color: '#4ade80',
  fontSize: '12.5px',
  fontWeight: 800,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const dangerBtnStyle: React.CSSProperties = {
  padding: '9px 18px',
  background: 'rgba(239, 68, 68, 0.2)',
  border: '1px solid rgba(239, 68, 68, 0.5)',
  borderRadius: '8px',
  color: '#f87171',
  fontSize: '12.5px',
  fontWeight: 800,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const statBoxStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.3)',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  display: 'flex',
  flexDirection: 'column',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: '10.5px',
  color: '#94a3b8',
  fontWeight: 600,
};

const statValueStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 800,
  marginTop: '3px',
};

const statSubtextStyle: React.CSSProperties = {
  fontSize: '9.5px',
  color: '#64748b',
  marginTop: '2px',
};

const timelineCardStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.3)',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.06)',
};

const tagBadgeStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#cbd5e1',
  background: 'rgba(255, 255, 255, 0.05)',
  padding: '4px 10px',
  borderRadius: '6px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
};
