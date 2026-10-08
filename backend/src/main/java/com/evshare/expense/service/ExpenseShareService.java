package com.evshare.expense.service;

import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.expense.dto.CostSharingSummaryResponse;
import com.evshare.expense.dto.ExpenseShareResponse;
import com.evshare.expense.dto.MemberCostShareResponse;
import com.evshare.expense.entity.Expense;
import com.evshare.expense.entity.ExpenseAllocationPolicy;
import com.evshare.expense.entity.ExpenseShare;
import com.evshare.expense.entity.ExpenseShareStatus;
import com.evshare.expense.entity.ExpenseStatus;
import com.evshare.expense.repository.ExpenseRepository;
import com.evshare.expense.repository.ExpenseShareRepository;
import com.evshare.ownership.entity.CoOwnershipGroup;
import com.evshare.ownership.entity.GroupVehicle;
import com.evshare.ownership.entity.GroupVehicleStatus;
import com.evshare.ownership.entity.MemberStatus;
import com.evshare.ownership.entity.OwnershipShare;
import com.evshare.ownership.repository.CoOwnershipGroupRepository;
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

    public ExpenseShareService(
            ExpenseShareRepository expenseShareRepository,
            ExpenseRepository expenseRepository,
            CoOwnershipGroupRepository groupRepository,
            GroupMemberRepository memberRepository,
            GroupVehicleRepository groupVehicleRepository,
            OwnershipShareRepository ownershipShareRepository,
            TripRepository tripRepository
    ) {
        this.expenseShareRepository = expenseShareRepository;
        this.expenseRepository = expenseRepository;
        this.groupRepository = groupRepository;
        this.memberRepository = memberRepository;
        this.groupVehicleRepository = groupVehicleRepository;
        this.ownershipShareRepository = ownershipShareRepository;
        this.tripRepository = tripRepository;
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
                : ExpenseAllocationPolicy.OWNERSHIP_RATIO;

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
                // Section XIII: Zero distance or unresolved formula keeps allocation unresolved
                return List.of();
            }

        } else if (policy == ExpenseAllocationPolicy.OWNERSHIP_RATIO) {
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
            if (remainder.compareTo(BigDecimal.ZERO) != 0) {
                rawAmounts.set(0, rawAmounts.get(0).add(remainder));
            }

            // Invariant Verification: SUM(shares) == expense.amount
            BigDecimal finalAllocatedSum = rawAmounts.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
            if (finalAllocatedSum.compareTo(expenseAmount) != 0) {
                throw new IllegalStateException("Lỗi kiểm toán: Tổng phân bổ " + finalAllocatedSum + " không khớp với số tiền chi phí " + expenseAmount);
            }

            // Persist ExpenseShare records with immutable percentage snapshots
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

        } else if (policy == ExpenseAllocationPolicy.CUSTOM_AGREEMENT) {
            throw new UnsupportedOperationException("Chính sách phân bổ theo thỏa thuận riêng (CUSTOM_AGREEMENT) chưa được cấu hình.");
        }

        return expenseShareRepository.saveAll(sharesToSave);
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

        UUID payerId = expense.getPaidBy() != null ? expense.getPaidBy().getId() : null;
        BigDecimal expenseAmount = expense.getAmount();

        return shares.stream()
                .map(s -> {
                    boolean isPayer = payerId != null && payerId.equals(s.getUser().getId());
                    BigDecimal paidAmount = isPayer ? expenseAmount : BigDecimal.ZERO;
                    return ExpenseShareResponse.fromEntity(s, isPayer, paidAmount);
                })
                .toList();
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

        for (OwnershipShare oShare : activeShares) {
            User memberUser = oShare.getMember().getUser();
            UUID memberUserId = memberUser.getId();

            BigDecimal requiredShare = monthShares.stream()
                    .filter(s -> s.getUser().getId().equals(memberUserId))
                    .map(ExpenseShare::getShareAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);

            BigDecimal paidAmount = monthExpenses.stream()
                    .filter(e -> e.getPaidBy() != null && e.getPaidBy().getId().equals(memberUserId))
                    .map(Expense::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);

            BigDecimal netPosition = paidAmount.subtract(requiredShare);
            boolean isCurrentUser = currentUserId != null && currentUserId.equals(memberUserId);

            if (isCurrentUser) {
                currentUserRequired = requiredShare;
                currentUserPaid = paidAmount;
                currentUserPercentage = oShare.getPercentage();
            }

            breakdown.add(new MemberCostShareResponse(
                    memberUserId,
                    memberUser.getFullName(),
                    oShare.getPercentage(),
                    requiredShare,
                    paidAmount,
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

        BigDecimal currentUserNet = currentUserPaid.subtract(currentUserRequired);

        return new CostSharingSummaryResponse(
                vehicleId,
                yearMonth.toString(),
                totalExpense,
                currentUserId,
                currentUserPercentage,
                currentUserRequired,
                currentUserPaid,
                currentUserNet,
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
     * Validate User Authorization for Vehicle
     * Invariant: CO_OWNER user may only access their authorized active co-owned vehicle.
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
        List<com.evshare.ownership.entity.GroupMember> activeMemberships = memberRepository.findByUserIdAndStatus(userId, MemberStatus.ACTIVE);
        boolean hasAccess = false;

        for (com.evshare.ownership.entity.GroupMember member : activeMemberships) {
            if (member.getRemovedAt() != null) {
                continue;
            }
            CoOwnershipGroup group = member.getGroup();
            if (group != null && group.getStatus() == com.evshare.ownership.entity.GroupStatus.ACTIVE) {
                if (vehicleId.equals(group.getVehicleId())) {
                    hasAccess = true;
                    break;
                }
                List<GroupVehicle> gvs = groupVehicleRepository.findByGroupIdAndStatus(group.getId(), GroupVehicleStatus.ACTIVE);
                for (GroupVehicle gv : gvs) {
                    if (gv.getVehicle() != null && vehicleId.equals(gv.getVehicle().getId())) {
                        hasAccess = true;
                        break;
                    }
                }
                if (hasAccess) break;
            }
        }

        if (!hasAccess) {
            throw new AccessDeniedException("Bạn không có quyền truy cập dữ liệu chi phí của phương tiện này.");
        }
    }

    private static class UsageCapitalItem {
        final OwnershipShare share;
        final BigDecimal memberKm;
        final BigDecimal rawCost;
        BigDecimal positiveWeight;
        BigDecimal unroundedFinalCost;
        BigDecimal integerPart;
        BigDecimal fractionalPart;
        BigDecimal finalCost;

        UsageCapitalItem(OwnershipShare share, BigDecimal memberKm, BigDecimal rawCost) {
            this.share = share;
            this.memberKm = memberKm;
            this.rawCost = rawCost;
        }
    }

    /**
     * Phase 19 Refined USAGE_AND_CAPITAL Allocation Formula & Negative Redistribution:
     * rawCost_i = totalExpense * ( (memberKm_i / totalKm) - ownershipRatio_i + (1 / N) )
     * Positive weight floor: max(rawCost_i, 0)
     * Normalized redistribution for positive weights: totalExpense * weight_i / positiveTotal
     * Largest-remainder VND rounding with deterministic tie-breaking.
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

        // Section XIII: Zero-distance handling: Do NOT divide by zero. Mark allocation unresolved.
        if (totalKm.compareTo(BigDecimal.ZERO) <= 0 || expenseAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return List.of();
        }

        int n = activeShares.size();
        if (n == 0) {
            return List.of();
        }

        BigDecimal oneOverN = BigDecimal.ONE.divide(BigDecimal.valueOf(n), 10, RoundingMode.HALF_UP);

        // Step 1: Raw formula calculation
        List<UsageCapitalItem> items = new ArrayList<>();
        for (OwnershipShare oShare : activeShares) {
            UUID memberUserId = oShare.getMember().getUser().getId();
            BigDecimal memberKm = memberKmMap.getOrDefault(memberUserId, BigDecimal.ZERO);
            BigDecimal kmRatio = memberKm.divide(totalKm, 10, RoundingMode.HALF_UP);
            BigDecimal ownershipRatio = oShare.getPercentage().divide(new BigDecimal("100"), 10, RoundingMode.HALF_UP);

            BigDecimal factor = kmRatio.subtract(ownershipRatio).add(oneOverN);
            BigDecimal rawCost = expenseAmount.multiply(factor);

            items.add(new UsageCapitalItem(oShare, memberKm, rawCost));
        }

        // Step 2 & 3: Negative floor & sum positive weights
        BigDecimal positiveTotal = BigDecimal.ZERO;
        for (UsageCapitalItem item : items) {
            BigDecimal weight = item.rawCost.compareTo(BigDecimal.ZERO) > 0 ? item.rawCost : BigDecimal.ZERO;
            item.positiveWeight = weight;
            positiveTotal = positiveTotal.add(weight);
        }

        // Section XIII: If positiveTotal == 0, mark allocation unresolved
        if (positiveTotal.compareTo(BigDecimal.ZERO) <= 0) {
            return List.of();
        }

        // Step 4: Recalculate unrounded final allocations
        for (UsageCapitalItem item : items) {
            if (item.rawCost.compareTo(BigDecimal.ZERO) <= 0) {
                item.unroundedFinalCost = BigDecimal.ZERO;
            } else {
                item.unroundedFinalCost = expenseAmount.multiply(item.positiveWeight).divide(positiveTotal, 10, RoundingMode.HALF_UP);
            }
        }

        // Step 5: Monetary rounding (whole VND) using deterministic largest-remainder algorithm
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
                .filter(it -> it.positiveWeight.compareTo(BigDecimal.ZERO) > 0)
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
            BigDecimal redistributionAdjustment = item.finalCost.subtract(item.rawCost).setScale(2, RoundingMode.HALF_UP);

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
            share.setRawCalculatedAmount(item.rawCost.setScale(2, RoundingMode.HALF_UP));
            share.setRedistributionAdjustment(redistributionAdjustment);
            share.setAllocationPeriodStart(periodStart);
            share.setAllocationPeriodEnd(periodEnd);
            share.setCalculationVersion("V2");

            sharesToSave.add(share);
        }

        return sharesToSave;
    }
}
