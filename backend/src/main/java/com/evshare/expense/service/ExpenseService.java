package com.evshare.expense.service;

import com.evshare.common.exception.DuplicateResourceException;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.expense.dto.CreateExpenseRequest;
import com.evshare.expense.dto.ExpenseResponse;
import com.evshare.expense.dto.ExpenseSummaryResponse;
import com.evshare.expense.entity.Expense;
import com.evshare.expense.entity.ExpenseCategory;
import com.evshare.expense.entity.ExpenseSourceType;
import com.evshare.expense.repository.ExpenseRepository;
import com.evshare.ownership.entity.*;
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

import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final VehicleRepository vehicleRepository;
    private final CoOwnershipGroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final GroupVehicleRepository groupVehicleRepository;
    private final UserRepository userRepository;

    public ExpenseService(
            ExpenseRepository expenseRepository,
            VehicleRepository vehicleRepository,
            CoOwnershipGroupRepository groupRepository,
            GroupMemberRepository memberRepository,
            GroupVehicleRepository groupVehicleRepository,
            UserRepository userRepository
    ) {
        this.expenseRepository = expenseRepository;
        this.vehicleRepository = vehicleRepository;
        this.groupRepository = groupRepository;
        this.memberRepository = memberRepository;
        this.groupVehicleRepository = groupVehicleRepository;
        this.userRepository = userRepository;
    }

    /**
     * Authoritative Expense Recording
     */
    @Transactional
    public ExpenseResponse recordExpense(CreateExpenseRequest request, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new AccessDeniedException("Vui lòng đăng nhập để thực hiện ghi nhận chi phí.");
        }

        UUID vehicleId = request.getVehicleId();
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Xe không tồn tại: " + vehicleId));

        // Enforce vehicle access authorization
        validateVehicleAccess(vehicleId, principal);

        // Resolve co-ownership group for this vehicle
        CoOwnershipGroup group = resolveGroupByVehicleId(vehicleId);

        // Validate monetary amount
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số tiền chi phí phải lớn hơn 0");
        }

        // Validate occurredAt timestamp (cannot be far future)
        Instant occurredAt = request.getOccurredAt() != null ? request.getOccurredAt() : Instant.now();
        if (occurredAt.isAfter(Instant.now().plus(Duration.ofHours(24)))) {
            throw new IllegalArgumentException("Thời gian phát sinh chi phí không được vượt quá hiện tại");
        }

        // Resolve Payer
        User payer;
        if (request.getPaidByUserId() != null) {
            payer = userRepository.findById(request.getPaidByUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Người thanh toán không tồn tại: " + request.getPaidByUserId()));

            // Payer must belong to the active co-ownership group of this vehicle
            if (group != null) {
                boolean isPayerInGroup = memberRepository.findByGroupIdAndUserId(group.getId(), payer.getId())
                        .map(m -> m.getStatus() == MemberStatus.ACTIVE && m.getRemovedAt() == null)
                        .orElse(false);

                if (!isPayerInGroup && principal.getUser().getRole() == Role.CO_OWNER) {
                    throw new AccessDeniedException("Người thanh toán phải là thành viên trong nhóm đồng sở hữu của xe.");
                }
            }
        } else {
            payer = principal.getUser();
        }

        // Check duplicate reference if provided
        ExpenseSourceType sourceType = request.getSourceType() != null ? request.getSourceType() : ExpenseSourceType.MANUAL;
        String sourceRef = request.getSourceReferenceId();
        if (sourceRef != null && !sourceRef.isBlank() && sourceType != ExpenseSourceType.MANUAL) {
            if (expenseRepository.existsBySourceTypeAndSourceReferenceId(sourceType, sourceRef.trim())) {
                throw new DuplicateResourceException("Chi phí từ nguồn này đã được ghi nhận trong hệ thống.");
            }
        }

        Expense expense = new Expense(
                UUID.randomUUID(),
                vehicle,
                group,
                request.getCategory(),
                request.getAmount(),
                request.getDescription() != null ? request.getDescription().trim() : "",
                occurredAt,
                payer,
                principal.getUser(),
                sourceType,
                sourceRef != null ? sourceRef.trim() : null
        );

        Expense saved = expenseRepository.save(expense);
        return ExpenseResponse.fromEntity(saved);
    }

    /**
     * Expense History List
     */
    @Transactional(readOnly = true)
    public List<ExpenseResponse> getExpenses(
            UUID vehicleId,
            Instant from,
            Instant to,
            ExpenseCategory category,
            UserPrincipal principal
    ) {
        validateVehicleAccess(vehicleId, principal);

        List<Expense> expenses;
        if (from != null && to != null) {
            if (category != null) {
                expenses = expenseRepository.findByVehicleIdAndCategoryAndOccurredAtBetweenOrderByOccurredAtDesc(
                        vehicleId, category, from, to
                );
            } else {
                expenses = expenseRepository.findByVehicleIdAndOccurredAtBetweenOrderByOccurredAtDesc(
                        vehicleId, from, to
                );
            }
        } else if (category != null) {
            expenses = expenseRepository.findByVehicleIdAndCategoryOrderByOccurredAtDesc(vehicleId, category);
        } else {
            expenses = expenseRepository.findByVehicleIdOrderByOccurredAtDesc(vehicleId);
        }

        return expenses.stream()
                .map(ExpenseResponse::fromEntity)
                .toList();
    }

    /**
     * Expense Details by ID
     */
    @Transactional(readOnly = true)
    public ExpenseResponse getExpenseById(UUID expenseId, UserPrincipal principal) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi phí: " + expenseId));

        validateVehicleAccess(expense.getVehicle().getId(), principal);

        return ExpenseResponse.fromEntity(expense);
    }

    /**
     * Authoritative Monthly Summary Calculation
     */
    @Transactional(readOnly = true)
    public ExpenseSummaryResponse getMonthlySummary(
            UUID vehicleId,
            String monthStr,
            UserPrincipal principal
    ) {
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

        BigDecimal total = expenseRepository.sumAmountByVehicleIdAndOccurredAtBetween(vehicleId, startOfMonth, endOfMonth);
        long count = expenseRepository.countByVehicleIdAndOccurredAtBetween(vehicleId, startOfMonth, endOfMonth);

        List<Expense> monthExpenses = expenseRepository.findByVehicleIdAndOccurredAtBetweenOrderByOccurredAtDesc(
                vehicleId, startOfMonth, endOfMonth
        );

        Map<String, BigDecimal> breakdown = monthExpenses.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getCategory().name(),
                        Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)
                ));

        return new ExpenseSummaryResponse(
                yearMonth.toString(),
                total != null ? total : BigDecimal.ZERO,
                count,
                breakdown
        );
    }

    /**
     * Resolve CoOwnershipGroup for vehicle
     */
    private CoOwnershipGroup resolveGroupByVehicleId(UUID vehicleId) {
        List<GroupVehicle> gvs = groupVehicleRepository.findByVehicleIdAndStatus(vehicleId, GroupVehicleStatus.ACTIVE);
        if (!gvs.isEmpty() && gvs.get(0).getGroup() != null) {
            return gvs.get(0).getGroup();
        }
        return groupRepository.findByVehicleId(vehicleId).orElse(null);
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
        List<GroupMember> activeMemberships = memberRepository.findByUserIdAndStatus(userId, MemberStatus.ACTIVE);
        boolean hasAccess = false;

        for (GroupMember member : activeMemberships) {
            if (member.getRemovedAt() != null) {
                continue;
            }
            CoOwnershipGroup group = member.getGroup();
            if (group != null && group.getStatus() == GroupStatus.ACTIVE) {
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
}
