package com.evshare.expense.service;

import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.expense.dto.CostSharingSummaryResponse;
import com.evshare.expense.dto.ExpenseShareResponse;
import com.evshare.expense.dto.MemberCostShareResponse;
import com.evshare.expense.entity.Expense;
import com.evshare.expense.entity.ExpenseAllocationPolicy;
import com.evshare.expense.entity.ExpenseCategory;
import com.evshare.expense.entity.ExpenseShare;
import com.evshare.expense.entity.ExpenseShareStatus;
import com.evshare.expense.entity.ExpenseSourceType;
import com.evshare.expense.entity.ExpenseStatus;
import com.evshare.expense.repository.ExpenseRepository;
import com.evshare.expense.repository.ExpenseShareRepository;
import com.evshare.ownership.entity.CoOwnershipGroup;
import com.evshare.ownership.entity.GroupVehicle;
import com.evshare.ownership.entity.GroupVehicleStatus;
import com.evshare.ownership.entity.MemberStatus;
import com.evshare.ownership.entity.OwnershipShare;
import com.evshare.ownership.repository.CoOwnershipGroupRepository;
import com.evshare.fund.entity.PersonalExpensePayment;
import com.evshare.fund.entity.PersonalPaymentStatus;
import com.evshare.fund.repository.PersonalExpensePaymentRepository;
import com.evshare.ownership.repository.GroupMemberRepository;
import com.evshare.ownership.repository.GroupVehicleRepository;
import com.evshare.ownership.repository.OwnershipShareRepository;
import com.evshare.security.UserPrincipal;
import com.evshare.trip.entity.Trip;
import com.evshare.trip.entity.TripStatus;
import com.evshare.trip.repository.TripRepository;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ExpenseShareService {

    private final ExpenseShareRepository expenseShareRepository;
    private final ExpenseRepository expenseRepository;
    private final CoOwnershipGroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final GroupVehicleRepository groupVehicleRepository;
    private final OwnershipShareRepository ownershipShareRepository;
    private final TripRepository tripRepository;
    private final PersonalExpensePaymentRepository paymentRepository;

    public ExpenseShareService(
            ExpenseShareRepository expenseShareRepository,
            ExpenseRepository expenseRepository,
            CoOwnershipGroupRepository groupRepository,
            GroupMemberRepository memberRepository,
            GroupVehicleRepository groupVehicleRepository,
            OwnershipShareRepository ownershipShareRepository,
            TripRepository tripRepository,
            PersonalExpensePaymentRepository paymentRepository
    ) {
        this.expenseShareRepository = expenseShareRepository;
        this.expenseRepository = expenseRepository;
        this.groupRepository = groupRepository;
        this.memberRepository = memberRepository;
        this.groupVehicleRepository = groupVehicleRepository;
        this.ownershipShareRepository = ownershipShareRepository;
        this.tripRepository = tripRepository;
        this.paymentRepository = paymentRepository;
    }

    /**
     * Authoritative Cost Sharing Allocation Generation for an Expense.
     * Idempotent: Does not recreate shares if already generated.
     * Enforces invariant: SUM(share_amount) == expense.amount exactly.
     */
    @Transactional
    public List<ExpenseShare> generateSharesForExpense(Expense expense) {
        if (expense == null || expense.getId() == null) {
            throw new IllegalArgumentException("Expense không hợp lệ");
        }

        // Phase 20 Invariant: Only APPROVED expenses generate cost shares!
        if (expense.getStatus() != ExpenseStatus.APPROVED) {
            throw new IllegalStateException("Chỉ khoản chi đã được phê duyệt mới được phân bổ chi phí.");
        }

        // Idempotency check: Return existing shares if already allocated
        if (expenseShareRepository.existsByExpenseId(expense.getId())) {
            return expenseShareRepository.findByExpenseIdOrderByOwnershipPercentageDesc(expense.getId());
        }

        UUID vehicleId = expense.getVehicle().getId();
        CoOwnershipGroup group = expense.getCoOwnershipGroup();
        if (group == null) {
            group = resolveGroupByVehicleId(vehicleId);
        }

        if (group == null) {
            throw new IllegalStateException("Không tìm thấy nhóm đồng sở hữu của xe để phân bổ chi phí.");
        }

        List<OwnershipShare> activeShares = resolveActiveOwnershipShares(group, vehicleId);
        if (activeShares.isEmpty()) {
            throw new IllegalStateException("Không có thành viên hoạt động trong nhóm đồng sở hữu để phân bổ chi phí.");
        }

        // Validate Ownership Total: Must be exactly 100%
        BigDecimal totalPercentage = activeShares.stream()
                .map(OwnershipShare::getPercentage)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalPercentage.compareTo(new BigDecimal("100.00")) != 0 && totalPercentage.compareTo(new BigDecimal("100")) != 0) {
            throw new IllegalStateException("Tổng tỷ lệ sở hữu của nhóm không hợp lệ: " + totalPercentage + "%. Yêu cầu đúng 100%.");
        }

        ExpenseAllocationPolicy policy = expense.getAllocationPolicy() != null
                ? expense.getAllocationPolicy()
                : ExpenseService.defaultPolicyForCategory(expense.getCategory());

        BigDecimal expenseAmount = expense.getAmount().setScale(2, RoundingMode.HALF_UP);
        List<ExpenseShare> sharesToSave = new ArrayList<>();

        if (policy == ExpenseAllocationPolicy.USER_RESPONSIBILITY) {
            User responsibleUser = expense.getResponsibleUser();
            if (responsibleUser == null) {
                // Section 8: Keep allocation unresolved until responsibility is verified
                return List.of();
            }

            UUID responsibleUserId = responsibleUser.getId();

            activeShares.sort((a, b) -> {
                int cmp = b.getPercentage().compareTo(a.getPercentage());
                if (cmp != 0) return cmp;
                return a.getMember().getUser().getId().compareTo(b.getMember().getUser().getId());
            });

            for (OwnershipShare oShare : activeShares) {
                User memberUser = oShare.getMember().getUser();
                boolean isResponsible = memberUser.getId().equals(responsibleUserId);

                BigDecimal shareAmount = isResponsible ? expenseAmount : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
                BigDecimal allocPct = isResponsible
                        ? new BigDecimal("100.0000")
                        : BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);

                ExpenseShare share = new ExpenseShare(
                        UUID.randomUUID(),
                        expense,
                        memberUser,
                        oShare.getPercentage().setScale(4, RoundingMode.HALF_UP),
                        shareAmount,
                        ExpenseShareStatus.ALLOCATED
                );
                share.setAllocationPolicy(ExpenseAllocationPolicy.USER_RESPONSIBILITY);
                share.setAllocationPercentage(allocPct);
                share.setRawCalculatedAmount(shareAmount);
                share.setRedistributionAdjustment(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
                share.setCalculationVersion("V2");
                sharesToSave.add(share);
            }

        } else if (policy == ExpenseAllocationPolicy.USAGE_AND_CAPITAL) {
            sharesToSave = generateUsageAndCapitalShares(expense, vehicleId, activeShares, expenseAmount);
            if (sharesToSave.isEmpty()) {
                // Zero-mileage safety: Do NOT divide by zero and do NOT silently fallback to OWNERSHIP_RATIO.
                // Keep financial allocation in an explicit unresolved state until trip usage is verified.
                return List.of();
            }

        } else if (policy == ExpenseAllocationPolicy.OWNERSHIP_RATIO) {
            sharesToSave = calculateOwnershipRatioShares(expense, activeShares, expenseAmount);

        } else if (policy == ExpenseAllocationPolicy.CUSTOM_AGREEMENT) {
            throw new UnsupportedOperationException("Chính sách phân bổ theo thỏa thuận riêng (CUSTOM_AGREEMENT) chưa được cấu hình.");
        }

        return expenseShareRepository.saveAll(sharesToSave);
    }

    /**
     * Helper to compute and build ExpenseShare entities under OWNERSHIP_RATIO.
     * Enforces VND largest-remainder tie-breaking and accounting invariant SUM(shares) == expense.amount.
     */
    private List<ExpenseShare> calculateOwnershipRatioShares(
            Expense expense,
            List<OwnershipShare> activeShares,
            BigDecimal expenseAmount
    ) {
        // Sort deterministically:
        // 1. Highest ownership percentage first
        // 2. Stable secondary order by User ID
        activeShares.sort((a, b) -> {
            int cmp = b.getPercentage().compareTo(a.getPercentage());
            if (cmp != 0) return cmp;
            return a.getMember().getUser().getId().compareTo(b.getMember().getUser().getId());
        });

        List<BigDecimal> rawAmounts = new ArrayList<>();

        // Step 1 & 2: Calculate each member's raw share rounded to VND whole units
        for (OwnershipShare oShare : activeShares) {
            BigDecimal raw = expenseAmount
                    .multiply(oShare.getPercentage())
                    .divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP)
                    .setScale(2, RoundingMode.HALF_UP);
            rawAmounts.add(raw);
        }

        // Step 3 & 4: Calculate remainder = expense.amount - allocatedTotal
        BigDecimal allocatedTotal = rawAmounts.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal remainder = expenseAmount.subtract(allocatedTotal);

        // Step 5: Assign remainder deterministically to recipient with highest percentage
        if (remainder.compareTo(BigDecimal.ZERO) != 0 && !rawAmounts.isEmpty()) {
            rawAmounts.set(0, rawAmounts.get(0).add(remainder));
        }

        // Invariant Verification: SUM(shares) == expense.amount
        BigDecimal finalAllocatedSum = rawAmounts.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        if (finalAllocatedSum.compareTo(expenseAmount) != 0) {
            throw new IllegalStateException("Lỗi kiểm toán: Tổng phân bổ " + finalAllocatedSum + " không khớp với số tiền chi phí " + expenseAmount);
        }

        // Persist ExpenseShare records with immutable percentage snapshots
        List<ExpenseShare> sharesToSave = new ArrayList<>();
        for (int i = 0; i < activeShares.size(); i++) {
            OwnershipShare oShare = activeShares.get(i);
            BigDecimal amount = rawAmounts.get(i);

            ExpenseShare share = new ExpenseShare(
                    UUID.randomUUID(),
                    expense,
                    oShare.getMember().getUser(),
                    oShare.getPercentage().setScale(4, RoundingMode.HALF_UP),
                    amount,
                    ExpenseShareStatus.ALLOCATED
            );
            share.setAllocationPolicy(ExpenseAllocationPolicy.OWNERSHIP_RATIO);
            share.setAllocationPercentage(oShare.getPercentage().setScale(4, RoundingMode.HALF_UP));
            share.setRawCalculatedAmount(amount);
            share.setRedistributionAdjustment(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            share.setCalculationVersion("V2");
            sharesToSave.add(share);
        }
        return sharesToSave;
    }

    /**
     * Shared authoritative check to determine whether an expense is an operational / user-specific obligation.
     * Charging, travel, parking, toll, and user-responsibility expenses MUST NEVER treat a co-owner as an upfront payer.
     */
    public static boolean isOperationalOrUserExpense(Expense exp, ExpenseShare share) {
        if (exp == null) return false;
        if (exp.getCategory() == ExpenseCategory.CHARGING
                || exp.getCategory() == ExpenseCategory.PARKING
                || exp.getCategory() == ExpenseCategory.TOLL) {
            return true;
        }
        if (exp.getSourceType() == ExpenseSourceType.TRIP
                || exp.getSourceType() == ExpenseSourceType.CHARGING_SESSION) {
            return true;
        }
        if (exp.getAllocationPolicy() == ExpenseAllocationPolicy.USER_RESPONSIBILITY) {
            return true;
        }
        if (share != null && share.getAllocationPolicy() == ExpenseAllocationPolicy.USER_RESPONSIBILITY) {
            return true;
        }
        if (exp.getDescription() != null) {
            String desc = exp.getDescription().toLowerCase();
            if (desc.contains("chi phí điện") || desc.contains("sạc pin") || desc.contains("chuyến đi")) {
                return true;
            }
        }
        return false;
    }

    /**
     * Retrieve cost allocation for a single Expense.
     * Backfills shares lazily ONLY if the expense is APPROVED.
     */
    @Transactional
    public List<ExpenseShareResponse> getExpenseShares(UUID expenseId, UserPrincipal principal) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi phí: " + expenseId));

        validateVehicleAccess(expense.getVehicle().getId(), principal);

        // Invariant: Unapproved expenses do NOT have cost shares
        if (expense.getStatus() != ExpenseStatus.APPROVED) {
            return List.of();
        }

        List<ExpenseShare> shares = expenseShareRepository.findByExpenseIdOrderByOwnershipPercentageDesc(expenseId);
        if (shares.isEmpty()) {
            shares = generateSharesForExpense(expense);
        }

        UUID payerId = (expense.getPaidBy() != null && expense.getPaidBy().getRole() != Role.STAFF && expense.getPaidBy().getRole() != Role.ADMIN)
                ? expense.getPaidBy().getId()
                : null;
        BigDecimal expenseAmount = expense.getAmount();

        BigDecimal computedTotalInverseWeight = BigDecimal.ZERO;
        for (ExpenseShare sh : shares) {
            BigDecimal ownPct = sh.getOwnershipPercentage() != null ? sh.getOwnershipPercentage() : BigDecimal.ZERO;
            BigDecimal decOwn = ownPct.divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP);
            computedTotalInverseWeight = computedTotalInverseWeight.add(BigDecimal.ONE.subtract(decOwn).max(BigDecimal.ZERO));
        }
        final BigDecimal totalInverseWeightSnapshot = computedTotalInverseWeight.setScale(4, RoundingMode.HALF_UP);

        return shares.stream()
                .map(s -> {
                    // Lazy-heal trip usage distance if missing
                    if (s.getMemberKmSnapshot() == null && expense.getRelatedTripId() != null) {
                        tripRepository.findById(expense.getRelatedTripId()).ifPresent(t -> {
                            if (t.getStartOdometer() != null && t.getEndOdometer() != null && t.getEndOdometer().compareTo(t.getStartOdometer()) > 0) {
                                BigDecimal dist = t.getEndOdometer().subtract(t.getStartOdometer());
                                boolean isResp = expense.getResponsibleUser() != null && s.getUser() != null && expense.getResponsibleUser().getId().equals(s.getUser().getId());
                                s.setMemberKmSnapshot(isResp ? dist : BigDecimal.ZERO);
                                s.setTotalKmSnapshot(dist);
                                try {
                                    expenseShareRepository.save(s);
                                } catch (Exception ignored) {}
                            }
                        });
                    }

                    // Only external out-of-pocket common expenses qualify for upfront payer status.
                    // Operational trip charges (TRIP, CHARGING) and USER_RESPONSIBILITY obligations NEVER treat the user as an upfront payer.
                    boolean isUpfrontPayer = !isOperationalOrUserExpense(expense, s)
                            && payerId != null
                            && payerId.equals(s.getUser().getId());

                    List<PersonalExpensePayment> sharePayments = paymentRepository.findByExpenseShareIdOrderByCreatedAtDesc(s.getId());
                    if (sharePayments.isEmpty() && s.getUser() != null) {
                        sharePayments = paymentRepository.findByExpenseIdAndPayerUserIdOrderByCreatedAtDesc(expenseId, s.getUser().getId());
                    }

                    BigDecimal verifiedPaid = sharePayments.stream()
                            .filter(p -> p.getStatus() == PersonalPaymentStatus.PAYMENT_VERIFIED)
                            .map(PersonalExpensePayment::getAmount)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal pendingVerification = sharePayments.stream()
                            .filter(p -> p.getStatus() == PersonalPaymentStatus.PAYMENT_SUBMITTED)
                            .map(PersonalExpensePayment::getAmount)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal paidAmount = isUpfrontPayer ? s.getShareAmount() : verifiedPaid;
                    BigDecimal remainingAmount = s.getShareAmount().subtract(paidAmount).max(BigDecimal.ZERO);

                    // Reconcile and heal persisted share status based on authoritative verified payments
                    if (isUpfrontPayer || (paidAmount.compareTo(s.getShareAmount()) >= 0 && s.getShareAmount().compareTo(BigDecimal.ZERO) > 0)) {
                        if (s.getStatus() != ExpenseShareStatus.SETTLED) {
                            s.setStatus(ExpenseShareStatus.SETTLED);
                            try {
                                expenseShareRepository.save(s);
                            } catch (Exception ignored) {}
                        }
                    } else if (pendingVerification.compareTo(BigDecimal.ZERO) > 0) {
                        if (s.getStatus() != ExpenseShareStatus.PENDING) {
                            s.setStatus(ExpenseShareStatus.PENDING);
                            try {
                                expenseShareRepository.save(s);
                            } catch (Exception ignored) {}
                        }
                    } else {
                        if (s.getStatus() != ExpenseShareStatus.ALLOCATED) {
                            s.setStatus(ExpenseShareStatus.ALLOCATED);
                            try {
                                expenseShareRepository.save(s);
                            } catch (Exception ignored) {}
                        }
                    }

                    return ExpenseShareResponse.fromEntity(s, isUpfrontPayer, paidAmount, pendingVerification, remainingAmount, totalInverseWeightSnapshot);
                })
                .toList();
    }

    /**
     * Idempotent reconciliation of missing expense shares for an approved expense.
     * Preserves existing shares and settlements.
     */
    @Transactional
    public List<ExpenseShareResponse> reconcileExpenseShares(UUID expenseId, UserPrincipal principal) {
        return getExpenseShares(expenseId, principal);
    }

    /**
     * Authoritative Monthly Cost-Sharing Summary for Vehicle & Co-Owners.
     * Invariant: Only APPROVED expenses are counted and allocated.
     */
    @Transactional
    public CostSharingSummaryResponse getCostSharingSummary(UUID vehicleId, String monthStr, UserPrincipal principal) {
        validateVehicleAccess(vehicleId, principal);

        YearMonth yearMonth;
        if (monthStr != null && !monthStr.isBlank()) {
            try {
                yearMonth = YearMonth.parse(monthStr.trim());
            } catch (Exception e) {
                yearMonth = YearMonth.now(ZoneId.of("Asia/Ho_Chi_Minh"));
            }
        } else {
            yearMonth = YearMonth.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        }

        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        Instant startOfMonth = yearMonth.atDay(1).atStartOfDay(zone).toInstant();
        Instant endOfMonth = yearMonth.plusMonths(1).atDay(1).atStartOfDay(zone).toInstant();

        // 1. Fetch only APPROVED month expenses
        List<Expense> monthExpenses = expenseRepository.findByVehicleIdAndStatusAndOccurredAtBetweenOrderByOccurredAtDesc(
                vehicleId, ExpenseStatus.APPROVED, startOfMonth, endOfMonth
        );

        // 2. Ensure all approved month expenses have generated shares
        for (Expense exp : monthExpenses) {
            if (!expenseShareRepository.existsByExpenseId(exp.getId())) {
                generateSharesForExpense(exp);
            }
        }

        BigDecimal totalExpense = monthExpenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        // 3. Fetch all month shares
        List<ExpenseShare> monthShares = expenseShareRepository.findByVehicleIdAndOccurredAtBetween(
                vehicleId, startOfMonth, endOfMonth
        );

        // 4. Resolve co-ownership group & active members
        CoOwnershipGroup group = resolveGroupByVehicleId(vehicleId);
        List<OwnershipShare> activeShares = group != null ? resolveActiveOwnershipShares(group, vehicleId) : List.of();

        UUID currentUserId = principal != null ? principal.getId() : null;

        // 5. Build member breakdown
        List<MemberCostShareResponse> breakdown = new ArrayList<>();
        BigDecimal currentUserRequired = BigDecimal.ZERO;
        BigDecimal currentUserPaid = BigDecimal.ZERO;
        BigDecimal currentUserPercentage = BigDecimal.ZERO;
        BigDecimal currentUserPending = BigDecimal.ZERO;
        BigDecimal currentUserOutstanding = BigDecimal.ZERO;

        for (OwnershipShare oShare : activeShares) {
            User memberUser = oShare.getMember().getUser();
            UUID memberUserId = memberUser.getId();

            List<ExpenseShare> memberShares = monthShares.stream()
                    .filter(s -> s.getUser().getId().equals(memberUserId))
                    .toList();

            BigDecimal requiredShare = memberShares.stream()
                    .map(ExpenseShare::getShareAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);

            BigDecimal verifiedSharePaid = BigDecimal.ZERO;
            BigDecimal pendingShareAmount = BigDecimal.ZERO;

            for (ExpenseShare s : memberShares) {
                Expense exp = s.getExpense();
                boolean isUpfrontPayer = exp != null
                        && !isOperationalOrUserExpense(exp, s)
                        && exp.getPaidBy() != null
                        && exp.getPaidBy().getId().equals(memberUserId)
                        && exp.getPaidBy().getRole() == Role.CO_OWNER;

                List<PersonalExpensePayment> sharePayments = paymentRepository.findByExpenseShareIdOrderByCreatedAtDesc(s.getId());
                if (sharePayments.isEmpty() && exp != null) {
                    sharePayments = paymentRepository.findByExpenseIdAndPayerUserIdOrderByCreatedAtDesc(exp.getId(), memberUserId);
                }

                BigDecimal verifiedForShare = sharePayments.stream()
                        .filter(p -> p.getStatus() == PersonalPaymentStatus.PAYMENT_VERIFIED)
                        .map(PersonalExpensePayment::getAmount)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal pendingForShare = sharePayments.stream()
                        .filter(p -> p.getStatus() == PersonalPaymentStatus.PAYMENT_SUBMITTED)
                        .map(PersonalExpensePayment::getAmount)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                if (isUpfrontPayer) {
                    verifiedSharePaid = verifiedSharePaid.add(s.getShareAmount());
                    if (s.getStatus() != ExpenseShareStatus.SETTLED) {
                        s.setStatus(ExpenseShareStatus.SETTLED);
                        try {
                            expenseShareRepository.save(s);
                        } catch (Exception ignored) {}
                    }
                } else if (verifiedForShare.compareTo(s.getShareAmount()) >= 0 && s.getShareAmount().compareTo(BigDecimal.ZERO) > 0) {
                    verifiedSharePaid = verifiedSharePaid.add(s.getShareAmount());
                    if (s.getStatus() != ExpenseShareStatus.SETTLED) {
                        s.setStatus(ExpenseShareStatus.SETTLED);
                        try {
                            expenseShareRepository.save(s);
                        } catch (Exception ignored) {}
                    }
                } else {
                    verifiedSharePaid = verifiedSharePaid.add(verifiedForShare);
                    pendingShareAmount = pendingShareAmount.add(pendingForShare);
                    if (s.getStatus() == ExpenseShareStatus.SETTLED) {
                        s.setStatus(pendingForShare.compareTo(BigDecimal.ZERO) > 0 ? ExpenseShareStatus.PENDING : ExpenseShareStatus.ALLOCATED);
                        try {
                            expenseShareRepository.save(s);
                        } catch (Exception ignored) {}
                    }
                }
            }

            // Upfront paid is ONLY for external out-of-pocket expenses paid by co-owner, never for operational trip charges!
            BigDecimal upfrontPaid = monthExpenses.stream()
                    .filter(e -> !isOperationalOrUserExpense(e, null)
                            && e.getPaidBy() != null
                            && e.getPaidBy().getId().equals(memberUserId)
                            && e.getPaidBy().getRole() == Role.CO_OWNER)
                    .map(Expense::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);

            BigDecimal totalMemberPaid = verifiedSharePaid.add(upfrontPaid).setScale(2, RoundingMode.HALF_UP);
            BigDecimal outstandingAmount = requiredShare.subtract(verifiedSharePaid).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            BigDecimal netPosition = upfrontPaid.compareTo(BigDecimal.ZERO) > 0
                    ? upfrontPaid.subtract(requiredShare).setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO.subtract(outstandingAmount).setScale(2, RoundingMode.HALF_UP);

            boolean isCurrentUser = currentUserId != null && currentUserId.equals(memberUserId);

            if (isCurrentUser) {
                currentUserRequired = requiredShare;
                currentUserPaid = totalMemberPaid;
                currentUserPercentage = oShare.getPercentage();
                currentUserPending = pendingShareAmount.setScale(2, RoundingMode.HALF_UP);
                currentUserOutstanding = outstandingAmount;
            }

            breakdown.add(new MemberCostShareResponse(
                    memberUserId,
                    memberUser.getFullName(),
                    oShare.getPercentage(),
                    requiredShare,
                    totalMemberPaid,
                    pendingShareAmount.setScale(2, RoundingMode.HALF_UP),
                    outstandingAmount,
                    netPosition,
                    isCurrentUser
            ));
        }

        // Sort breakdown: Current user first, then by ownership percentage desc
        breakdown.sort((a, b) -> {
            if (a.isCurrentUser()) return -1;
            if (b.isCurrentUser()) return 1;
            return b.ownershipPercentage().compareTo(a.ownershipPercentage());
        });

        BigDecimal currentUserNet = currentUserOutstanding.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : BigDecimal.ZERO.subtract(currentUserOutstanding);

        return new CostSharingSummaryResponse(
                vehicleId,
                yearMonth.toString(),
                totalExpense,
                currentUserId,
                currentUserPercentage,
                currentUserRequired,
                currentUserPaid,
                currentUserNet,
                currentUserPending,
                currentUserOutstanding,
                breakdown
        );
    }

    /**
     * Resolves CoOwnershipGroup for vehicle
     */
    private CoOwnershipGroup resolveGroupByVehicleId(UUID vehicleId) {
        List<GroupVehicle> gvs = groupVehicleRepository.findByVehicleIdAndStatus(vehicleId, GroupVehicleStatus.ACTIVE);
        if (!gvs.isEmpty() && gvs.get(0).getGroup() != null) {
            return gvs.get(0).getGroup();
        }
        return groupRepository.findByVehicleId(vehicleId).orElse(null);
    }

    /**
     * Resolves active OwnershipShares for group & vehicle
     */
    private List<OwnershipShare> resolveActiveOwnershipShares(CoOwnershipGroup group, UUID vehicleId) {
        List<OwnershipShare> shares = ownershipShareRepository.findByGroupIdAndVehicleId(group.getId(), vehicleId);
        if (shares.isEmpty()) {
            shares = ownershipShareRepository.findByGroupId(group.getId());
        }

        return shares.stream()
                .filter(s -> s.getMember() != null
                        && s.getMember().getStatus() == MemberStatus.ACTIVE
                        && s.getMember().getRemovedAt() == null)
                .collect(Collectors.toList());
    }

    /**
     * Validate User Authorization for Vehicle Financial Records
     * - STAFF and ADMIN have global access to all vehicles.
     * - CO_OWNER:
     *   1. Active members of any co-ownership group owning this vehicle.
     *   2. Co-owners holding registered ownership shares in this vehicle.
     *   3. Members with pending transfer/withdrawal or past members who hold historical expense obligations.
     *   4. Fallback for open/unconstrained vehicles.
     */
    public void validateVehicleAccess(UUID vehicleId, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new AccessDeniedException("Vui lòng đăng nhập để tiếp tục");
        }

        Role role = principal.getUser().getRole();
        if (role == Role.STAFF || role == Role.ADMIN) {
            return;
        }

        UUID userId = principal.getId();

        // 1. Resolve all groups associated with this vehicle (via GroupVehicle or direct vehicleId)
        List<GroupVehicle> gvs = groupVehicleRepository.findByVehicleId(vehicleId);
        List<UUID> groupIds = new ArrayList<>();
        for (GroupVehicle gv : gvs) {
            if (gv.getGroup() != null && !groupIds.contains(gv.getGroup().getId())) {
                groupIds.add(gv.getGroup().getId());
            }
        }
        groupRepository.findByVehicleId(vehicleId).ifPresent(g -> {
            if (!groupIds.contains(g.getId())) {
                groupIds.add(g.getId());
            }
        });

        // If vehicle is not linked to any group, allow access (open/unrestricted vehicle)
        if (groupIds.isEmpty()) {
            return;
        }

        // 2. Check user association across the vehicle's groups
        for (UUID groupId : groupIds) {
            // Check active membership
            if (memberRepository.existsByGroupIdAndUserIdAndStatus(groupId, userId, MemberStatus.ACTIVE)) {
                return;
            }
            // Check ownership share record
            if (ownershipShareRepository.findByGroupIdAndVehicleIdAndUserId(groupId, vehicleId, userId).isPresent()) {
                return;
            }
            // Check pending transfer/withdrawal or group membership
            Optional<com.evshare.ownership.entity.GroupMember> memberOpt = memberRepository.findByGroupIdAndUserId(groupId, userId);
            if (memberOpt.isPresent()) {
                com.evshare.ownership.entity.GroupMember member = memberOpt.get();
                if (member.getStatus() == MemberStatus.ACTIVE
                        || member.getStatus() == MemberStatus.TRANSFER_PENDING
                        || member.getStatus() == MemberStatus.WITHDRAWAL_PENDING) {
                    return;
                }
            }
        }

        // 3. Check historical expense obligations (past shares on this vehicle)
        if (expenseShareRepository.existsByVehicleIdAndUserId(vehicleId, userId)) {
            return;
        }

        // 4. Bi-directional fallback: check active memberships of user
        List<com.evshare.ownership.entity.GroupMember> userMemberships = memberRepository.findByUserIdAndStatus(userId, MemberStatus.ACTIVE);
        for (com.evshare.ownership.entity.GroupMember member : userMemberships) {
            if (member.getRemovedAt() != null) continue;
            CoOwnershipGroup group = member.getGroup();
            if (group != null) {
                if (vehicleId.equals(group.getVehicleId())) {
                    return;
                }
                List<GroupVehicle> groupVehicles = groupVehicleRepository.findByGroupId(group.getId());
                for (GroupVehicle gv : groupVehicles) {
                    if (gv.getVehicle() != null && vehicleId.equals(gv.getVehicle().getId())) {
                        return;
                    }
                }
            }
        }

        throw new AccessDeniedException("Bạn không có quyền truy cập dữ liệu chi phí của phương tiện này.");
    }

    private static class UsageCapitalItem {
        final OwnershipShare share;
        final BigDecimal memberKm;
        final BigDecimal ownershipShare;
        final BigDecimal inverseWeight;
        BigDecimal ownershipCost;
        BigDecimal usageCost;
        BigDecimal rawCost;
        BigDecimal unroundedFinalCost;
        BigDecimal integerPart;
        BigDecimal fractionalPart;
        BigDecimal finalCost;

        UsageCapitalItem(OwnershipShare share, BigDecimal memberKm, BigDecimal ownershipShare, BigDecimal inverseWeight) {
            this.share = share;
            this.memberKm = memberKm;
            this.ownershipShare = ownershipShare;
            this.inverseWeight = inverseWeight;
        }
    }

    /**
     * Official Inverse Ownership and Distance-based Allocation Formula:
     * For each eligible co-owner i:
     *   s_i = ownershipPercentage_i / 100.0 (normalized in [0, 1])
     *   inverseOwnershipWeight_i = 1 - s_i
     *   totalInverseOwnershipWeight = SUM(inverseOwnershipWeight_j)
     *   
     *   If totalDistanceKm > 0:
     *     alpha = 0.5, beta = 0.5
     *     ownershipCost_i = totalExpense * alpha * (inverseOwnershipWeight_i / totalInverseOwnershipWeight)
     *     usageCost_i = totalExpense * beta * (distanceKm_i / totalDistanceKm)
     *     unroundedCost_i = ownershipCost_i + usageCost_i
     *   
     *   If totalDistanceKm == 0 (Zero-usage handling):
     *     alpha = 1.0, beta = 0.0
     *     ownershipCost_i = totalExpense * (inverseOwnershipWeight_i / totalInverseOwnershipWeight)
     *     usageCost_i = 0
     *     unroundedCost_i = ownershipCost_i
     *
     *   If activeShares.size() == 1:
     *     100% of expense allocated to this single member.
     *
     * Monetary Rounding:
     *   Deterministic largest-remainder rounding to whole VND.
     *   Discrepancy assigned to highest remainder, tie-breaking by User ID.
     *   Invariant: SUM(finalCost_i) == totalExpense exactly.
     */
    private List<ExpenseShare> generateUsageAndCapitalShares(
            Expense expense,
            UUID vehicleId,
            List<OwnershipShare> activeShares,
            BigDecimal expenseAmount
    ) {
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        Instant occurredAt = expense.getOccurredAt() != null ? expense.getOccurredAt() : Instant.now();
        YearMonth ym = YearMonth.from(occurredAt.atZone(zone));
        Instant periodStart = ym.atDay(1).atStartOfDay(zone).toInstant();
        Instant periodEnd = ym.plusMonths(1).atDay(1).atStartOfDay(zone).toInstant();

        List<Trip> trips = tripRepository.findCompletedTripsByVehicleInPeriod(vehicleId, periodStart, periodEnd);
        Map<UUID, BigDecimal> memberKmMap = new HashMap<>();
        for (Trip trip : trips) {
            if (trip.getUser() == null || trip.getStatus() != TripStatus.COMPLETED) {
                continue;
            }
            BigDecimal startOdo = trip.getStartOdometer();
            BigDecimal endOdo = trip.getEndOdometer();
            if (startOdo != null && endOdo != null && endOdo.compareTo(startOdo) > 0) {
                BigDecimal distance = endOdo.subtract(startOdo);
                memberKmMap.merge(trip.getUser().getId(), distance, BigDecimal::add);
            }
        }

        BigDecimal totalKm = BigDecimal.ZERO;
        for (OwnershipShare oShare : activeShares) {
            BigDecimal km = memberKmMap.getOrDefault(oShare.getMember().getUser().getId(), BigDecimal.ZERO);
            totalKm = totalKm.add(km);
        }

        if (expenseAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return List.of();
        }

        int n = activeShares.size();
        if (n == 0) {
            return List.of();
        }

        // Single member edge case
        if (n == 1) {
            OwnershipShare oShare = activeShares.get(0);
            UUID memberUserId = oShare.getMember().getUser().getId();
            BigDecimal memberKm = memberKmMap.getOrDefault(memberUserId, BigDecimal.ZERO);
            BigDecimal finalCost = expenseAmount.setScale(2, RoundingMode.HALF_UP);

            ExpenseShare share = new ExpenseShare(
                    UUID.randomUUID(),
                    expense,
                    oShare.getMember().getUser(),
                    oShare.getPercentage().setScale(4, RoundingMode.HALF_UP),
                    finalCost,
                    ExpenseShareStatus.ALLOCATED
            );
            share.setAllocationPolicy(ExpenseAllocationPolicy.USAGE_AND_CAPITAL);
            share.setAllocationPercentage(new BigDecimal("100.0000"));
            share.setMemberKmSnapshot(memberKm.setScale(2, RoundingMode.HALF_UP));
            share.setTotalKmSnapshot(totalKm.setScale(2, RoundingMode.HALF_UP));
            share.setRawCalculatedAmount(finalCost);
            share.setRedistributionAdjustment(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            share.setAllocationPeriodStart(periodStart);
            share.setAllocationPeriodEnd(periodEnd);
            share.setCalculationVersion("V3_INVERSE_KM");

            return List.of(share);
        }

        boolean isZeroKm = totalKm.compareTo(BigDecimal.ZERO) <= 0;
        BigDecimal alpha = isZeroKm ? BigDecimal.ONE : new BigDecimal("0.5");
        BigDecimal beta = isZeroKm ? BigDecimal.ZERO : new BigDecimal("0.5");

        // Calculate inverse ownership weights: inverseWeight_i = 1 - ownershipShare_i
        // and totalInverseWeight = SUM(inverseWeight_j)
        List<UsageCapitalItem> items = new ArrayList<>();
        BigDecimal totalInverseWeight = BigDecimal.ZERO;

        for (OwnershipShare oShare : activeShares) {
            UUID memberUserId = oShare.getMember().getUser().getId();
            BigDecimal memberKm = memberKmMap.getOrDefault(memberUserId, BigDecimal.ZERO);
            BigDecimal ownershipShare = oShare.getPercentage().divide(new BigDecimal("100"), 10, RoundingMode.HALF_UP);
            BigDecimal inverseWeight = BigDecimal.ONE.subtract(ownershipShare).max(BigDecimal.ZERO);

            totalInverseWeight = totalInverseWeight.add(inverseWeight);
            items.add(new UsageCapitalItem(oShare, memberKm, ownershipShare, inverseWeight));
        }

        if (totalInverseWeight.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("Tổng trọng số sở hữu nghịch đảo không hợp lệ: " + totalInverseWeight);
        }

        // Calculate unrounded cost per member:
        // ownershipCost_i = totalExpense * alpha * (inverseWeight_i / totalInverseWeight)
        // usageCost_i = isZeroKm ? 0 : totalExpense * beta * (memberKm_i / totalKm)
        // unroundedCost_i = ownershipCost_i + usageCost_i
        for (UsageCapitalItem item : items) {
            BigDecimal ownershipCost = expenseAmount
                    .multiply(alpha)
                    .multiply(item.inverseWeight)
                    .divide(totalInverseWeight, 10, RoundingMode.HALF_UP);

            BigDecimal usageCost = isZeroKm
                    ? BigDecimal.ZERO
                    : expenseAmount
                            .multiply(beta)
                            .multiply(item.memberKm)
                            .divide(totalKm, 10, RoundingMode.HALF_UP);

            item.ownershipCost = ownershipCost;
            item.usageCost = usageCost;
            item.unroundedFinalCost = ownershipCost.add(usageCost);
            item.rawCost = item.unroundedFinalCost;
        }

        // Monetary rounding (whole VND) using deterministic largest-remainder algorithm
        BigDecimal targetExpenseTotal = expenseAmount.setScale(0, RoundingMode.HALF_UP);
        BigDecimal sumIntegers = BigDecimal.ZERO;
        for (UsageCapitalItem item : items) {
            item.integerPart = item.unroundedFinalCost.setScale(0, RoundingMode.FLOOR);
            item.fractionalPart = item.unroundedFinalCost.subtract(item.integerPart);
            sumIntegers = sumIntegers.add(item.integerPart);
        }

        BigDecimal discrepancy = targetExpenseTotal.subtract(sumIntegers);
        int remainderBonusCount = Math.max(0, discrepancy.intValue());

        List<UsageCapitalItem> candidates = items.stream()
                .sorted((a, b) -> {
                    int cmp = b.fractionalPart.compareTo(a.fractionalPart);
                    if (cmp != 0) return cmp;
                    return a.share.getMember().getUser().getId().compareTo(b.share.getMember().getUser().getId());
                })
                .toList();

        Set<UUID> bonusUserIds = new HashSet<>();
        for (int i = 0; i < remainderBonusCount && i < candidates.size(); i++) {
            bonusUserIds.add(candidates.get(i).share.getMember().getUser().getId());
        }

        for (UsageCapitalItem item : items) {
            BigDecimal bonus = bonusUserIds.contains(item.share.getMember().getUser().getId())
                    ? BigDecimal.ONE
                    : BigDecimal.ZERO;
            item.finalCost = item.integerPart.add(bonus).setScale(2, RoundingMode.HALF_UP);
        }

        // Invariant Verification: SUM(finalCost) == expenseAmount
        BigDecimal finalAllocatedSum = items.stream().map(it -> it.finalCost).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (finalAllocatedSum.compareTo(expenseAmount.setScale(2, RoundingMode.HALF_UP)) != 0) {
            throw new IllegalStateException("Lỗi kiểm toán: Tổng phân bổ " + finalAllocatedSum + " không khớp với số tiền chi phí " + expenseAmount);
        }

        // Build ExpenseShare records with immutable audit snapshots
        List<ExpenseShare> sharesToSave = new ArrayList<>();
        for (UsageCapitalItem item : items) {
            BigDecimal allocPct = item.finalCost.multiply(new BigDecimal("100")).divide(expenseAmount, 4, RoundingMode.HALF_UP);
            BigDecimal redistributionAdjustment = item.finalCost.subtract(item.unroundedFinalCost).setScale(2, RoundingMode.HALF_UP);

            ExpenseShare share = new ExpenseShare(
                    UUID.randomUUID(),
                    expense,
                    item.share.getMember().getUser(),
                    item.share.getPercentage().setScale(4, RoundingMode.HALF_UP),
                    item.finalCost,
                    ExpenseShareStatus.ALLOCATED
            );
            share.setAllocationPolicy(ExpenseAllocationPolicy.USAGE_AND_CAPITAL);
            share.setAllocationPercentage(allocPct);
            share.setMemberKmSnapshot(item.memberKm.setScale(2, RoundingMode.HALF_UP));
            share.setTotalKmSnapshot(totalKm.setScale(2, RoundingMode.HALF_UP));
            share.setRawCalculatedAmount(item.unroundedFinalCost.setScale(2, RoundingMode.HALF_UP));
            share.setRedistributionAdjustment(redistributionAdjustment);
            share.setAllocationPeriodStart(periodStart);
            share.setAllocationPeriodEnd(periodEnd);
            share.setCalculationVersion("V3_INVERSE_KM");

            sharesToSave.add(share);
        }

        return sharesToSave;
    }
}
