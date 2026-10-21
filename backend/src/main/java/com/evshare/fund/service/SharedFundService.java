package com.evshare.fund.service;

import com.evshare.common.exception.DuplicateResourceException;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.expense.entity.*;
import com.evshare.expense.repository.ExpenseRepository;
import com.evshare.fund.dto.*;
import com.evshare.fund.entity.*;
import com.evshare.fund.repository.FundContributionRepository;
import com.evshare.fund.repository.FundTransactionRepository;
import com.evshare.fund.repository.SharedFundRepository;
import com.evshare.ownership.entity.CoOwnershipGroup;
import com.evshare.ownership.entity.GroupMember;
import com.evshare.ownership.entity.GroupVehicle;
import com.evshare.ownership.entity.GroupVehicleStatus;
import com.evshare.ownership.entity.MemberStatus;
import com.evshare.voting.entity.VoteProposal;
import com.evshare.voting.entity.VoteProposalStatus;
import com.evshare.voting.repository.VoteProposalRepository;
import java.util.Optional;
import com.evshare.ownership.repository.CoOwnershipGroupRepository;
import com.evshare.ownership.repository.GroupMemberRepository;
import com.evshare.ownership.repository.GroupVehicleRepository;
import com.evshare.security.UserPrincipal;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import com.evshare.user.repository.UserRepository;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.repository.VehicleRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.evshare.fund.config.FinancialModeConfig;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SharedFundService {

    private final SharedFundRepository sharedFundRepository;
    private final FundContributionRepository fundContributionRepository;
    private final FundTransactionRepository fundTransactionRepository;
    private final ExpenseRepository expenseRepository;
    private final VehicleRepository vehicleRepository;
    private final CoOwnershipGroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupVehicleRepository groupVehicleRepository;
    private final UserRepository userRepository;
    private final FinancialModeConfig financialModeConfig;
    private final VoteProposalRepository voteProposalRepository;

    public SharedFundService(
            SharedFundRepository sharedFundRepository,
            FundContributionRepository fundContributionRepository,
            FundTransactionRepository fundTransactionRepository,
            ExpenseRepository expenseRepository,
            VehicleRepository vehicleRepository,
            CoOwnershipGroupRepository groupRepository,
            GroupMemberRepository groupMemberRepository,
            GroupVehicleRepository groupVehicleRepository,
            UserRepository userRepository,
            FinancialModeConfig financialModeConfig,
            VoteProposalRepository voteProposalRepository
    ) {
        this.sharedFundRepository = sharedFundRepository;
        this.fundContributionRepository = fundContributionRepository;
        this.fundTransactionRepository = fundTransactionRepository;
        this.expenseRepository = expenseRepository;
        this.vehicleRepository = vehicleRepository;
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.groupVehicleRepository = groupVehicleRepository;
        this.userRepository = userRepository;
        this.financialModeConfig = financialModeConfig;
        this.voteProposalRepository = voteProposalRepository;
    }

    /**
     * Get authoritative fund summary for a vehicle's co-ownership group (by String identifier or UUID)
     */
    @Transactional
    public SharedFundSummaryResponse getFundSummaryByVehicle(String vehicleIdOrIdentifier, UserPrincipal principal) {
        Vehicle resolvedVehicle = null;
        UUID vehicleId = null;
        try {
            vehicleId = UUID.fromString(vehicleIdOrIdentifier);
            resolvedVehicle = vehicleRepository.findById(vehicleId).orElse(null);
        } catch (IllegalArgumentException ignored) {
        }

        if (resolvedVehicle == null) {
            resolvedVehicle = vehicleRepository.findAll().stream()
                    .filter(v -> v.getName().equalsIgnoreCase(vehicleIdOrIdentifier)
                            || v.getVin().equalsIgnoreCase(vehicleIdOrIdentifier)
                            || v.getLicensePlate().equalsIgnoreCase(vehicleIdOrIdentifier))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Xe không tồn tại: " + vehicleIdOrIdentifier));
        }

        final Vehicle vehicle = resolvedVehicle;

        // 1. Try group_vehicles association first, fallback to group.vehicle_id
        List<GroupVehicle> gvs = groupVehicleRepository.findByVehicleIdAndStatus(vehicle.getId(), GroupVehicleStatus.ACTIVE);
        final CoOwnershipGroup group = !gvs.isEmpty()
                ? gvs.get(0).getGroup()
                : groupRepository.findByVehicleId(vehicle.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Xe chưa được gán vào nhóm đồng sở hữu nào: " + vehicle.getName()));

        validateGroupAccess(group.getId(), principal);

        SharedFund fund = sharedFundRepository.findByGroupId(group.getId())
                .orElseGet(() -> {
                    SharedFund newFund = new SharedFund(UUID.randomUUID(), group, "VND", BigDecimal.ZERO);
                    return sharedFundRepository.save(newFund);
                });

        BigDecimal pendingTotal = fundContributionRepository.sumAmountByFundIdAndStatus(fund.getId(), FundContributionStatus.PENDING);
        BigDecimal confirmedInflow = fundTransactionRepository.sumAmountByFundIdAndDirectionAndStatus(
                fund.getId(), FundTransactionDirection.INFLOW, FundTransactionStatus.CONFIRMED);
        BigDecimal confirmedOutflow = fundTransactionRepository.sumAmountByFundIdAndDirectionAndStatus(
                fund.getId(), FundTransactionDirection.OUTFLOW, FundTransactionStatus.CONFIRMED);

        // Ensure reconciled balance consistency from ledger transactions
        BigDecimal calculatedLedgerBalance = confirmedInflow.subtract(confirmedOutflow);
        if (calculatedLedgerBalance.compareTo(BigDecimal.ZERO) >= 0 && !calculatedLedgerBalance.equals(fund.getAvailableBalance())) {
            fund.setAvailableBalance(calculatedLedgerBalance);
            fund = sharedFundRepository.save(fund);
        }

        long contribCount = fundContributionRepository.findByFundIdOrderByCreatedAtDesc(fund.getId()).size();
        long txCount = fundTransactionRepository.findByFundIdOrderByCreatedAtDesc(fund.getId()).size();

        return new SharedFundSummaryResponse(
                fund.getId(),
                group.getId(),
                vehicle.getId(),
                group.getName(),
                fund.getCurrency(),
                fund.getAvailableBalance(),
                pendingTotal,
                confirmedInflow,
                confirmedOutflow,
                contribCount,
                txCount,
                fund.getUpdatedAt() != null ? fund.getUpdatedAt() : fund.getCreatedAt(),
                financialModeConfig.getMode(),
                financialModeConfig.getVietnameseLabel()
        );
    }

    @Transactional
    public SharedFundSummaryResponse getFundSummaryByVehicle(UUID vehicleId, UserPrincipal principal) {
        return getFundSummaryByVehicle(vehicleId != null ? vehicleId.toString() : "", principal);
    }

    /**
     * Member requests to contribute to the shared fund (creates PENDING record, does NOT change balance)
     */
    @Transactional
    public FundContributionResponse submitContribution(UUID fundId, FundContributionRequest request, UserPrincipal principal) {
        SharedFund fund = sharedFundRepository.findById(fundId)
                .orElseGet(() -> sharedFundRepository.findByGroupId(fundId)
                        .orElseThrow(() -> new ResourceNotFoundException("Quỹ chung không tồn tại: " + fundId)));

        validateGroupAccess(fund.getGroup().getId(), principal);

        User contributor = principal.getUser();
        String paymentRef = request.paymentReference() != null && !request.paymentReference().isBlank()
                ? request.paymentReference().trim()
                : "DEMO-CONTRIB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        FundContribution contribution = new FundContribution(
                UUID.randomUUID(),
                fund,
                contributor,
                request.amount(),
                FundContributionStatus.PENDING,
                request.paymentMethod() != null ? request.paymentMethod() : "DEMO_TRANSFER",
                paymentRef,
                request.evidenceUrl(),
                request.note() != null ? request.note() : "Đóng góp mô phỏng từ thành viên"
        );
        contribution.setFinancialMode(financialModeConfig.getMode());

        FundContribution saved = fundContributionRepository.save(contribution);
        return mapToContributionResponse(saved);
    }

    /**
     * Authorized STAFF or ADMIN verifies receipt of contribution funds
     * Transitions contribution to CONFIRMED, records audited ledger credit transaction, updates fund balance
     */
    @Transactional
    public FundContributionResponse verifyContribution(UUID contributionId, FundContributionVerifyRequest request, UserPrincipal principal) {
        if (principal.getUser().getRole() != Role.STAFF && principal.getUser().getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Chỉ Nhân viên (STAFF) hoặc Quản trị viên (ADMIN) mới có quyền xác minh đóng góp tài chính.");
        }

        FundContribution contribution = fundContributionRepository.findById(contributionId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu đóng góp không tồn tại: " + contributionId));

        if (contribution.getStatus() != FundContributionStatus.PENDING) {
            throw new DuplicateResourceException("Yêu cầu đóng góp này đã được xử lý trước đó với trạng thái: " + contribution.getStatus().getVietnameseLabel());
        }

        SharedFund fund = contribution.getFund();
        User verifier = principal.getUser();
        Instant now = Instant.now();

        if (Boolean.TRUE.equals(request.confirmed())) {
            contribution.setStatus(FundContributionStatus.CONFIRMED);
            contribution.setVerifiedAt(now);
            contribution.setVerifiedByUser(verifier);
            if (request.note() != null && !request.note().isBlank()) {
                contribution.setNote(contribution.getNote() + " | Ghi chú đối soát demo: " + request.note());
            }

            // Exactly one ledger credit transaction
            BigDecimal balanceAfter = fund.getAvailableBalance().add(contribution.getAmount());
            fund.setAvailableBalance(balanceAfter);
            sharedFundRepository.save(fund);

            FundTransaction tx = new FundTransaction(
                    UUID.randomUUID(),
                    fund,
                    FundTransactionType.CONTRIBUTION,
                    contribution.getAmount(),
                    FundTransactionDirection.INFLOW,
                    FundTransactionStatus.CONFIRMED,
                    "CONTRIBUTION",
                    contribution.getId().toString(),
                    balanceAfter,
                    "Xác nhận đóng góp demo từ thành viên: " + contribution.getContributorUser().getFullName(),
                    now,
                    verifier
            );
            tx.setFinancialMode(financialModeConfig.getMode());
            fundTransactionRepository.save(tx);
        } else {
            contribution.setStatus(FundContributionStatus.REJECTED);
            contribution.setVerifiedAt(now);
            contribution.setVerifiedByUser(verifier);
            if (request.note() != null && !request.note().isBlank()) {
                contribution.setNote(contribution.getNote() + " | Lý do từ chối: " + request.note());
            }
        }

        FundContribution updated = fundContributionRepository.save(contribution);
        return mapToContributionResponse(updated);
    }

    /**
     * Disburse an approved common group expense from the Shared Fund
     */
    @Transactional
    public FundTransactionResponse disburseCommonExpense(UUID fundId, CommonDisbursementRequest request, UserPrincipal principal) {
        if (principal.getUser().getRole() != Role.STAFF && principal.getUser().getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Chỉ Nhân viên hoặc Quản trị viên được ủy quyền mới có thể thực hiện giải ngân quỹ chung.");
        }

        SharedFund fund = sharedFundRepository.findById(fundId)
                .orElseThrow(() -> new ResourceNotFoundException("Quỹ chung không tồn tại: " + fundId));

        Expense expense = expenseRepository.findById(request.expenseId())
                .orElseThrow(() -> new ResourceNotFoundException("Khoản chi không tồn tại: " + request.expenseId()));

        // Invariant 1: Expense must belong to the same group
        if (expense.getCoOwnershipGroup() == null || !expense.getCoOwnershipGroup().getId().equals(fund.getGroup().getId())) {
            throw new IllegalArgumentException("Khoản chi không thuộc nhóm đồng sở hữu của Quỹ chung này.");
        }

        // Invariant 2: Personal electricity (CHARGING) must NOT be deducted from Shared Fund
        if (expense.getCategory() == ExpenseCategory.CHARGING) {
            throw new IllegalArgumentException("Chi phí sạc điện thuộc trách nhiệm cá nhân của người sử dụng xe, nghiêm cấm trích từ Quỹ chung.");
        }

        // Invariant 3: Expense must have approved status (voting/approval dependency)
        if (expense.getStatus() != ExpenseStatus.APPROVED) {
            throw new IllegalStateException("Khoản chi đang chờ biểu quyết hoặc chưa được phê duyệt hợp lệ. Không thể giải ngân.");
        }

        // Invariant 3b: Harden voting proposal authorization (Section XXIII)
        if (expense.getRelatedProposalId() != null) {
            VoteProposal proposal = voteProposalRepository.findById(expense.getRelatedProposalId())
                    .orElseThrow(() -> new IllegalStateException("Đề xuất biểu quyết liên kết với khoản chi không tồn tại."));
            if (proposal.getStatus() != VoteProposalStatus.APPROVED) {
                throw new IllegalStateException("Đề xuất biểu quyết liên kết chưa được phê duyệt (Trạng thái: "
                        + proposal.getStatus().getVietnameseLabel() + "). Không thể giải ngân.");
            }
            BigDecimal budgetCap = proposal.getApprovedBudget() != null ? proposal.getApprovedBudget() : proposal.getEstimatedAmount();
            if (expense.getAmount().compareTo(budgetCap) > 0) {
                throw new IllegalStateException("Khoản chi (" + expense.getAmount() + " VND) vượt quá ngân sách đã được biểu quyết thông qua ("
                        + budgetCap + " VND). Yêu cầu bổ sung biểu quyết điều chỉnh ngân sách.");
            }
        } else if (expense.getCategory() == ExpenseCategory.MAINTENANCE || expense.getCategory() == ExpenseCategory.REPAIR) {
            if (expense.getSourceReferenceId() != null) {
                try {
                    UUID refId = UUID.fromString(expense.getSourceReferenceId());
                    Optional<VoteProposal> propOpt = voteProposalRepository.findById(refId);
                    if (propOpt.isPresent()) {
                        VoteProposal proposal = propOpt.get();
                        if (proposal.getStatus() != VoteProposalStatus.APPROVED) {
                            throw new IllegalStateException("Đề xuất biểu quyết liên kết chưa được phê duyệt hợp lệ.");
                        }
                        BigDecimal budgetCap = proposal.getApprovedBudget() != null ? proposal.getApprovedBudget() : proposal.getEstimatedAmount();
                        if (expense.getAmount().compareTo(budgetCap) > 0) {
                            throw new IllegalStateException("Khoản chi vượt quá ngân sách đã được biểu quyết.");
                        }
                    }
                } catch (IllegalArgumentException ignored) {
                }
            }
        }

        // Invariant 4: Prevent double payment / duplicate disbursements
        boolean alreadyDisbursed = fundTransactionRepository.existsByReferenceTypeAndReferenceIdAndStatus(
                "EXPENSE", expense.getId().toString(), FundTransactionStatus.CONFIRMED);
        if (alreadyDisbursed) {
            throw new DuplicateResourceException("Khoản chi này đã được giải ngân từ Quỹ chung trước đó. Nghiêm cấm chi trùng lặp.");
        }

        // Invariant 5: Sufficient available balance (no overdraft)
        BigDecimal disburseAmount = request.amount() != null ? request.amount() : expense.getAmount();
        if (disburseAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số tiền giải ngân phải lớn hơn 0.");
        }
        if (disburseAmount.compareTo(expense.getAmount()) > 0) {
            throw new IllegalArgumentException("Số tiền giải ngân không được vượt quá giá trị khoản chi (" + expense.getAmount() + " VND).");
        }
        if (fund.getAvailableBalance().compareTo(disburseAmount) < 0) {
            throw new IllegalStateException("Số dư khả dụng của Quỹ chung không đủ để thực hiện giải ngân (Hiện có: "
                    + fund.getAvailableBalance() + " VND, Yêu cầu: " + disburseAmount + " VND).");
        }

        // Execute ledger debit
        BigDecimal balanceAfter = fund.getAvailableBalance().subtract(disburseAmount);
        fund.setAvailableBalance(balanceAfter);
        sharedFundRepository.save(fund);

        Instant now = Instant.now();
        User staff = principal.getUser();
        String desc = "Giải ngân chi phí chung: " + expense.getDescription() + " (" + expense.getCategory().getVietnameseLabel() + ")";
        if (request.note() != null && !request.note().isBlank()) {
            desc += " - " + request.note();
        }

        FundTransaction tx = new FundTransaction(
                UUID.randomUUID(),
                fund,
                FundTransactionType.EXPENSE_DISBURSEMENT,
                disburseAmount,
                FundTransactionDirection.OUTFLOW,
                FundTransactionStatus.CONFIRMED,
                "EXPENSE",
                expense.getId().toString(),
                balanceAfter,
                desc,
                now,
                staff
        );
        tx.setFinancialMode(financialModeConfig.getMode());

        FundTransaction savedTx = fundTransactionRepository.save(tx);
        return mapToTransactionResponse(savedTx);
    }

    /**
     * Get contribution history for a fund
     */
    @Transactional(readOnly = true)
    public List<FundContributionResponse> getContributions(UUID fundId, UserPrincipal principal) {
        SharedFund fund = sharedFundRepository.findById(fundId)
                .orElseThrow(() -> new ResourceNotFoundException("Quỹ chung không tồn tại: " + fundId));
        validateGroupAccess(fund.getGroup().getId(), principal);

        return fundContributionRepository.findByFundIdOrderByCreatedAtDesc(fundId).stream()
                .map(this::mapToContributionResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get audited ledger transactions for a fund
     */
    @Transactional(readOnly = true)
    public List<FundTransactionResponse> getTransactions(UUID fundId, UserPrincipal principal) {
        SharedFund fund = sharedFundRepository.findById(fundId)
                .orElseThrow(() -> new ResourceNotFoundException("Quỹ chung không tồn tại: " + fundId));
        validateGroupAccess(fund.getGroup().getId(), principal);

        return fundTransactionRepository.findByFundIdOrderByCreatedAtDesc(fundId).stream()
                .map(this::mapToTransactionResponse)
                .collect(Collectors.toList());
    }

    private void validateGroupAccess(UUID groupId, UserPrincipal principal) {
        if (principal.getUser().getRole() == Role.ADMIN || principal.getUser().getRole() == Role.STAFF) {
            return;
        }

        boolean isMember = groupMemberRepository.findByGroupIdAndUserId(groupId, principal.getId())
                .map(m -> m.getStatus() == MemberStatus.ACTIVE && m.getRemovedAt() == null)
                .orElse(false);

        if (!isMember) {
            throw new AccessDeniedException("Bạn không phải là thành viên hoạt động của nhóm đồng sở hữu này.");
        }
    }

    private FundContributionResponse mapToContributionResponse(FundContribution c) {
        FinancialMode mode = c.getFinancialMode() != null ? c.getFinancialMode() : financialModeConfig.getMode();
        UUID groupId = (c.getFund() != null && c.getFund().getGroup() != null) ? c.getFund().getGroup().getId() : null;
        String groupName = (c.getFund() != null && c.getFund().getGroup() != null) ? c.getFund().getGroup().getName() : null;
        return new FundContributionResponse(
                c.getId(),
                c.getFund().getId(),
                c.getContributorUser().getId(),
                c.getContributorUser().getFullName(),
                c.getAmount(),
                c.getStatus(),
                c.getStatus().getVietnameseLabel(),
                c.getPaymentMethod(),
                c.getPaymentReference(),
                c.getEvidenceUrl(),
                c.getNote(),
                c.getCreatedAt(),
                c.getVerifiedAt(),
                c.getVerifiedByUser() != null ? c.getVerifiedByUser().getFullName() : null,
                mode,
                mode.getVietnameseLabel(),
                groupId,
                groupName
        );
    }

    private FundTransactionResponse mapToTransactionResponse(FundTransaction t) {
        FinancialMode mode = t.getFinancialMode() != null ? t.getFinancialMode() : financialModeConfig.getMode();
        return new FundTransactionResponse(
                t.getId(),
                t.getFund().getId(),
                t.getTransactionType(),
                t.getTransactionType().getVietnameseLabel(),
                t.getAmount(),
                t.getDirection(),
                t.getStatus(),
                t.getReferenceType(),
                t.getReferenceId(),
                t.getBalanceAfter(),
                t.getDescription(),
                t.getCreatedAt(),
                t.getConfirmedAt(),
                t.getConfirmedByUser() != null ? t.getConfirmedByUser().getFullName() : null,
                mode,
                mode.getVietnameseLabel()
        );
    }
}
