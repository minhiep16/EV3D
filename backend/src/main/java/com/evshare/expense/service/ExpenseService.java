package com.evshare.expense.service;

import com.evshare.booking.entity.Booking;
import com.evshare.booking.repository.BookingRepository;
import com.evshare.charging.repository.ChargingSessionRepository;
import com.evshare.common.exception.DuplicateResourceException;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.expense.dto.*;
import com.evshare.expense.entity.*;
import com.evshare.expense.repository.ExpenseApprovalRepository;
import com.evshare.expense.repository.ExpenseRepository;
import com.evshare.maintenance.entity.MaintenanceStatus;
import com.evshare.maintenance.repository.MaintenanceRequestRepository;
import com.evshare.ownership.entity.*;
import com.evshare.ownership.repository.CoOwnershipGroupRepository;
import com.evshare.ownership.repository.GroupMemberRepository;
import com.evshare.ownership.repository.GroupVehicleRepository;
import com.evshare.ownership.repository.OwnershipShareRepository;
import com.evshare.security.UserPrincipal;
import com.evshare.trip.entity.Trip;
import com.evshare.trip.repository.TripRepository;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import com.evshare.user.repository.UserRepository;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.repository.VehicleRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
    private final ExpenseShareService expenseShareService;
    private final ExpenseApprovalRepository approvalRepository;
    private final OwnershipShareRepository ownershipShareRepository;
    private final ChargingSessionRepository chargingSessionRepository;
    private final MaintenanceRequestRepository maintenanceRequestRepository;
    private final TripRepository tripRepository;
    private final BookingRepository bookingRepository;

    public ExpenseService(
            ExpenseRepository expenseRepository,
            VehicleRepository vehicleRepository,
            CoOwnershipGroupRepository groupRepository,
            GroupMemberRepository memberRepository,
            GroupVehicleRepository groupVehicleRepository,
            UserRepository userRepository,
            ExpenseShareService expenseShareService,
            ExpenseApprovalRepository approvalRepository,
            OwnershipShareRepository ownershipShareRepository,
            ChargingSessionRepository chargingSessionRepository,
            MaintenanceRequestRepository maintenanceRequestRepository,
            TripRepository tripRepository,
            BookingRepository bookingRepository
    ) {
        this.expenseRepository = expenseRepository;
        this.vehicleRepository = vehicleRepository;
        this.groupRepository = groupRepository;
        this.memberRepository = memberRepository;
        this.groupVehicleRepository = groupVehicleRepository;
        this.userRepository = userRepository;
        this.expenseShareService = expenseShareService;
        this.approvalRepository = approvalRepository;
        this.ownershipShareRepository = ownershipShareRepository;
        this.chargingSessionRepository = chargingSessionRepository;
        this.maintenanceRequestRepository = maintenanceRequestRepository;
        this.tripRepository = tripRepository;
        this.bookingRepository = bookingRepository;
    }

    public static ExpenseAllocationPolicy defaultPolicyForCategory(ExpenseCategory category) {
        if (category == null) return ExpenseAllocationPolicy.USAGE_AND_CAPITAL;
        return switch (category) {
            case CHARGING, PARKING, TOLL -> ExpenseAllocationPolicy.USER_RESPONSIBILITY;
            case MAINTENANCE, REPAIR -> ExpenseAllocationPolicy.USAGE_AND_CAPITAL;
            case INSURANCE, CLEANING, OTHER -> ExpenseAllocationPolicy.OWNERSHIP_RATIO;
        };
    }

    public static BigDecimal calculateTripEnergyCost(
            BigDecimal energyConsumedKwh,
            BigDecimal startSoc,
            BigDecimal endSoc,
            BigDecimal batteryCapacityKwh,
            BigDecimal unitPrice
    ) {
        BigDecimal effectivePrice = (unitPrice != null && unitPrice.compareTo(BigDecimal.ZERO) > 0)
                ? unitPrice
                : new BigDecimal("3000"); // Standard EV Charging unit price in VND/kWh

        if (energyConsumedKwh != null && energyConsumedKwh.compareTo(BigDecimal.ZERO) > 0) {
            return energyConsumedKwh.multiply(effectivePrice).setScale(0, RoundingMode.HALF_UP);
        }
        if (startSoc != null && endSoc != null && batteryCapacityKwh != null && batteryCapacityKwh.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal deltaSoc = startSoc.subtract(endSoc);
            if (deltaSoc.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal estimatedKwh = deltaSoc.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP).multiply(batteryCapacityKwh);
                return estimatedKwh.multiply(effectivePrice).setScale(0, RoundingMode.HALF_UP);
            }
        }
        return BigDecimal.ZERO;
    }

    /**
     * Authoritative Expense Recording
     * MANUAL expenses start as PENDING_VERIFICATION (no shares generated yet).
     * Trusted system-generated sources (ChargingSession / MaintenanceRequest) become APPROVED automatically
     * only when the authoritative source record is validated.
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

        // Source Type & Initial Verification Status Resolution
        ExpenseSourceType sourceType = request.getSourceType() != null ? request.getSourceType() : ExpenseSourceType.MANUAL;
        String sourceRef = request.getSourceReferenceId();

        // Rule 1: CO_OWNER must NOT manually add charging expenses (Business Decision 1 & Section 6)
        if (request.getCategory() == ExpenseCategory.CHARGING && (sourceType == null || sourceType == ExpenseSourceType.MANUAL)) {
            if (principal.getUser().getRole() == Role.CO_OWNER) {
                throw new IllegalArgumentException("Chi phí sạc được hệ thống ghi nhận sau khi nhân viên xác nhận trả xe.");
            }
            if (request.getEvidenceNote() == null || request.getEvidenceNote().trim().isBlank()) {
                throw new IllegalArgumentException("Nhân viên/Quản trị viên cần ghi rõ lý do và ghi chú đối soát khi điều chỉnh chi phí sạc thủ công.");
            }
        }

        // Check duplicate reference if provided for system sources
        if (sourceRef != null && !sourceRef.isBlank() && sourceType != ExpenseSourceType.MANUAL) {
            if (expenseRepository.existsBySourceTypeAndSourceReferenceId(sourceType, sourceRef.trim())) {
                throw new DuplicateResourceException("Chi phí từ nguồn này đã được ghi nhận trong hệ thống.");
            }
        }

        ExpenseStatus initialStatus = ExpenseStatus.PENDING_VERIFICATION;
        Instant approvedAt = null;

        // Auto-approve trusted system-generated sources ONLY if referenced entity is verified
        if (sourceType == ExpenseSourceType.CHARGING_SESSION && sourceRef != null && !sourceRef.isBlank()) {
            try {
                UUID sessionId = UUID.fromString(sourceRef.trim());
                var sessionOpt = chargingSessionRepository.findById(sessionId);
                if (sessionOpt.isPresent() && sessionOpt.get().getVehicle().getId().equals(vehicleId)) {
                    initialStatus = ExpenseStatus.APPROVED;
                    approvedAt = Instant.now();
                }
            } catch (IllegalArgumentException ignored) {
                // Keep PENDING_VERIFICATION if sourceRef is not a valid UUID
            }
        } else if (sourceType == ExpenseSourceType.MAINTENANCE_REQUEST && sourceRef != null && !sourceRef.isBlank()) {
            try {
                UUID maintId = UUID.fromString(sourceRef.trim());
                var maintOpt = maintenanceRequestRepository.findById(maintId);
                if (maintOpt.isPresent() && maintOpt.get().getVehicle().getId().equals(vehicleId)) {
                    MaintenanceStatus mStatus = maintOpt.get().getStatus();
                    if (mStatus == MaintenanceStatus.COMPLETED) {
                        initialStatus = ExpenseStatus.APPROVED;
                        approvedAt = Instant.now();
                    }
                }
            } catch (IllegalArgumentException ignored) {
                // Keep PENDING_VERIFICATION if sourceRef is not a valid UUID
            }
        }

        // Allocation Policy & Responsible User Resolution
        ExpenseAllocationPolicy policy = request.getAllocationPolicy();
        if (policy == null) {
            policy = defaultPolicyForCategory(request.getCategory());
        }

        if (policy == ExpenseAllocationPolicy.CUSTOM_AGREEMENT) {
            throw new IllegalArgumentException("Chính sách phân bổ theo thỏa thuận riêng (CUSTOM_AGREEMENT) hiện chưa được hỗ trợ tự động.");
        }

        User responsibleUser = null;
        UUID relatedTripId = request.getRelatedTripId();
        UUID relatedBookingId = request.getRelatedBookingId();

        // 1. Resolve from verified Trip relation
        if (relatedTripId != null) {
            final UUID tripIdForLookup = relatedTripId;
            Trip trip = tripRepository.findById(tripIdForLookup)
                    .orElseThrow(() -> new ResourceNotFoundException("Chuyến đi không tồn tại: " + tripIdForLookup));
            if (!trip.getVehicle().getId().equals(vehicleId)) {
                throw new IllegalArgumentException("Chuyến đi không thuộc về phương tiện này.");
            }
            responsibleUser = trip.getUser();
        }

        // 2. Resolve from verified Booking relation
        if (responsibleUser == null && relatedBookingId != null) {
            final UUID bookingIdForLookup = relatedBookingId;
            Booking booking = bookingRepository.findById(bookingIdForLookup)
                    .orElseThrow(() -> new ResourceNotFoundException("Lịch đặt xe không tồn tại: " + bookingIdForLookup));
            if (!booking.getVehicle().getId().equals(vehicleId)) {
                throw new IllegalArgumentException("Lịch đặt xe không thuộc về phương tiện này.");
            }
            responsibleUser = booking.getUser();
        }

        // 3. Resolve from verified ChargingSession
        if (responsibleUser == null && sourceType == ExpenseSourceType.CHARGING_SESSION && sourceRef != null && !sourceRef.isBlank()) {
            try {
                UUID sessionId = UUID.fromString(sourceRef.trim());
                var sessionOpt = chargingSessionRepository.findById(sessionId);
                if (sessionOpt.isPresent() && sessionOpt.get().getVehicle().getId().equals(vehicleId)) {
                    responsibleUser = sessionOpt.get().getStartedBy();
                }
            } catch (IllegalArgumentException ignored) {
            }
        }

        // 4. Resolve from explicit responsibleUserId with group membership verification
        if (responsibleUser == null && request.getResponsibleUserId() != null) {
            User candidate = userRepository.findById(request.getResponsibleUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Người chịu chi phí không tồn tại: " + request.getResponsibleUserId()));
            if (group != null) {
                boolean isInGroup = memberRepository.findByGroupIdAndUserId(group.getId(), candidate.getId())
                        .map(m -> m.getStatus() == MemberStatus.ACTIVE && m.getRemovedAt() == null)
                        .orElse(false);
                if (!isInGroup) {
                    throw new IllegalArgumentException("Người chịu chi phí phải là thành viên đồng sở hữu của phương tiện.");
                }
            }
            responsibleUser = candidate;
        }

        // 5. Automatic contextual lookup for trip-specific expenses based on occurredAt
        if (responsibleUser == null && (policy == ExpenseAllocationPolicy.USER_RESPONSIBILITY || request.getCategory() == ExpenseCategory.PARKING || request.getCategory() == ExpenseCategory.TOLL)) {
            List<Trip> enclosingTrips = tripRepository.findTripsByVehicleAndOccurredTime(vehicleId, occurredAt);
            if (!enclosingTrips.isEmpty()) {
                Trip t = enclosingTrips.get(0);
                responsibleUser = t.getUser();
                relatedTripId = t.getId();
            } else {
                List<Booking> enclosingBookings = bookingRepository.findBookingsByVehicleAndOccurredTime(vehicleId, occurredAt);
                if (!enclosingBookings.isEmpty()) {
                    Booking b = enclosingBookings.get(0);
                    responsibleUser = b.getUser();
                    relatedBookingId = b.getId();
                }
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
                sourceRef != null ? sourceRef.trim() : null,
                initialStatus,
                request.getEvidenceUrl() != null ? request.getEvidenceUrl().trim() : null,
                request.getEvidenceNote() != null ? request.getEvidenceNote().trim() : null
        );
        expense.setApprovedAt(approvedAt);
        expense.setAllocationPolicy(policy);
        expense.setResponsibleUser(responsibleUser);
        expense.setRelatedTripId(relatedTripId);
        expense.setRelatedBookingId(relatedBookingId);

        Expense saved = expenseRepository.save(expense);

        // Cost Sharing: ONLY generate shares for APPROVED expenses!
        // Manual expenses stay PENDING_VERIFICATION and do NOT generate shares yet.
        if (saved.getStatus() == ExpenseStatus.APPROVED) {
            expenseShareService.generateSharesForExpense(saved);
        }

        return toResponse(saved);
    }

    /**
     * Authoritative Trip Energy Expense Creation (Phase 18 & Phase 19).
     * Automatically invoked upon STAFF return verification.
     * Idempotent: Repeated invocations will not duplicate expenses.
     * Enforces USER_RESPONSIBILITY (100% assigned to verified trip user).
     */
    @Transactional
    public Expense createTripEnergyExpense(Trip trip, BigDecimal verifiedEnergyKwh, User staffUser) {
        if (trip == null || trip.getId() == null) {
            throw new IllegalArgumentException("Chuyến đi không hợp lệ.");
        }

        // Idempotency check: Do not create duplicate energy expense
        String sourceRef = trip.getId().toString();
        if (expenseRepository.existsBySourceTypeAndSourceReferenceId(ExpenseSourceType.TRIP, sourceRef)) {
            return expenseRepository.findBySourceTypeAndSourceReferenceId(ExpenseSourceType.TRIP, sourceRef).orElse(null);
        }
        if (expenseRepository.existsByRelatedTripId(trip.getId())) {
            return expenseRepository.findByRelatedTripId(trip.getId()).orElse(null);
        }

        Vehicle vehicle = trip.getVehicle();
        if (vehicle == null) {
            throw new IllegalStateException("Chuyến đi thiếu thông tin phương tiện.");
        }

        CoOwnershipGroup group = resolveGroupByVehicleId(vehicle.getId());
        User tripUser = trip.getUser();
        if (tripUser == null) {
            throw new IllegalStateException("Chuyến đi thiếu thông tin người sử dụng.");
        }

        BigDecimal capacity = vehicle.getUsableBatteryCapacityKwh() != null
                ? vehicle.getUsableBatteryCapacityKwh()
                : (vehicle.getGrossBatteryCapacityKwh() != null ? vehicle.getGrossBatteryCapacityKwh() : new BigDecimal("65.0"));

        BigDecimal effectiveKwh = verifiedEnergyKwh;
        boolean isEstimated = false;

        if (effectiveKwh == null || effectiveKwh.compareTo(BigDecimal.ZERO) <= 0) {
            if (trip.getEnergyConsumedKwh() != null && trip.getEnergyConsumedKwh().compareTo(BigDecimal.ZERO) > 0) {
                effectiveKwh = trip.getEnergyConsumedKwh();
            } else if (trip.getStartBatteryLevel() != null && trip.getEndBatteryLevel() != null) {
                BigDecimal deltaSoc = new BigDecimal(trip.getStartBatteryLevel() - trip.getEndBatteryLevel());
                if (deltaSoc.compareTo(BigDecimal.ZERO) > 0) {
                    effectiveKwh = deltaSoc.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP).multiply(capacity);
                    isEstimated = true;
                }
            }
        }

        // If required data is missing or energy is not positive, keep charging reconciliation pending
        if (effectiveKwh == null || effectiveKwh.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }

        BigDecimal unitPrice = new BigDecimal("3000"); // 3,000 VND / kWh standard tariff
        BigDecimal amount = effectiveKwh.multiply(unitPrice).setScale(0, RoundingMode.HALF_UP);

        String staffName = staffUser != null ? staffUser.getFullName() : "STAFF";
        String calcTypeNote = isEstimated ? "(ước tính từ SOC)" : "(đo thực tế)";
        String description = String.format("Chi phí điện chuyến đi: %s kWh %s (%s)",
                effectiveKwh.setScale(1, RoundingMode.HALF_UP),
                calcTypeNote,
                vehicle.getName());

        Expense expense = new Expense(
                UUID.randomUUID(),
                vehicle,
                group,
                ExpenseCategory.CHARGING,
                amount,
                description,
                trip.getEndedAt() != null ? trip.getEndedAt() : Instant.now(),
                tripUser,
                staffUser != null ? staffUser : tripUser,
                ExpenseSourceType.TRIP,
                sourceRef,
                ExpenseStatus.APPROVED,
                null,
                "Xác nhận bởi: " + staffName + ". Chi phí điện đã được ghi nhận. Chờ thanh toán."
        );

        expense.setApprovedAt(Instant.now());
        expense.setAllocationPolicy(ExpenseAllocationPolicy.USER_RESPONSIBILITY);
        expense.setResponsibleUser(tripUser);
        expense.setRelatedTripId(trip.getId());
        if (trip.getBooking() != null) {
            expense.setRelatedBookingId(trip.getBooking().getId());
        }

        Expense savedExpense = expenseRepository.save(expense);

        // Generate 100% share for tripUser
        expenseShareService.generateSharesForExpense(savedExpense);

        return savedExpense;
    }

    /**
     * Independent Co-Owner Expense Verification / Approval
     * Critical transparency rules:
     * 1. Creator cannot approve own manual expense.
     * 2. Only active co-owners of the vehicle group can approve/reject.
     * 3. Ownership percentage snapshot is saved per decision.
     * 4. Becomes APPROVED when independent co-owner approval reaches >= 50% threshold.
     * 5. Becomes REJECTED when rejection reaches >= 50% threshold.
     */
    @Transactional
    public ExpenseApprovalStatusResponse submitApproval(
            UUID expenseId,
            ExpenseApprovalRequest request,
            UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new AccessDeniedException("Vui lòng đăng nhập để thực hiện phê duyệt chi phí.");
        }

        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi phí: " + expenseId));

        if (expense.getStatus() != ExpenseStatus.PENDING_VERIFICATION) {
            throw new IllegalStateException("Khoản chi này không ở trạng thái chờ xác minh (hiện tại: "
                    + expense.getStatus().getVietnameseLabel() + ")");
        }

        // Rule 3: Creator CANNOT verify own manual expense
        if (expense.getCreatedBy() != null && expense.getCreatedBy().getId().equals(principal.getId())) {
            throw new AccessDeniedException("Người tạo khoản chi không được tự phê duyệt khoản chi của mình.");
        }

        UUID vehicleId = expense.getVehicle().getId();
        validateVehicleAccess(vehicleId, principal);

        CoOwnershipGroup group = expense.getCoOwnershipGroup() != null
                ? expense.getCoOwnershipGroup()
                : resolveGroupByVehicleId(vehicleId);

        if (group == null) {
            throw new IllegalStateException("Không tìm thấy nhóm đồng sở hữu của xe.");
        }

        List<OwnershipShare> activeShares = resolveActiveOwnershipShares(group, vehicleId);
        OwnershipShare voterShare = activeShares.stream()
                .filter(s -> s.getMember().getUser().getId().equals(principal.getId()))
                .findFirst()
                .orElseThrow(() -> new AccessDeniedException("Chỉ đồng sở hữu có cổ phần hoạt động mới có quyền xác minh chi phí."));

        BigDecimal voterPercentage = voterShare.getPercentage().setScale(4, RoundingMode.HALF_UP);

        // Record or update approval decision with ownership percentage snapshot
        ExpenseApproval approval = approvalRepository.findByExpenseIdAndUserId(expenseId, principal.getId())
                .orElseGet(() -> new ExpenseApproval(
                        UUID.randomUUID(),
                        expense,
                        principal.getUser(),
                        request.decision(),
                        voterPercentage,
                        request.comment() != null ? request.comment().trim() : null
                ));

        approval.setDecision(request.decision());
        approval.setOwnershipPercentageSnapshot(voterPercentage);
        approval.setComment(request.comment() != null ? request.comment().trim() : null);
        approvalRepository.save(approval);

        // Tally independent approvals and rejections (creator's share is excluded)
        List<ExpenseApproval> allApprovals = approvalRepository.findByExpenseId(expenseId);

        BigDecimal totalApproved = allApprovals.stream()
                .filter(a -> a.getDecision() == ExpenseApprovalDecision.APPROVE)
                .filter(a -> expense.getCreatedBy() == null || !a.getUser().getId().equals(expense.getCreatedBy().getId()))
                .map(ExpenseApproval::getOwnershipPercentageSnapshot)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalRejected = allApprovals.stream()
                .filter(a -> a.getDecision() == ExpenseApprovalDecision.REJECT)
                .filter(a -> expense.getCreatedBy() == null || !a.getUser().getId().equals(expense.getCreatedBy().getId()))
                .map(ExpenseApproval::getOwnershipPercentageSnapshot)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal threshold = new BigDecimal("50.00");

        // Independent Co-Owner Verification: Approver may also confirm/adjust allocation policy and responsible party
        if (request.allocationPolicy() != null) {
            expense.setAllocationPolicy(request.allocationPolicy());
        }
        if (request.responsibleUserId() != null) {
            User verifiedRespUser = userRepository.findById(request.responsibleUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Người chịu chi phí không tồn tại: " + request.responsibleUserId()));
            if (group != null) {
                boolean isRespInGroup = memberRepository.findByGroupIdAndUserId(group.getId(), verifiedRespUser.getId())
                        .map(m -> m.getStatus() == MemberStatus.ACTIVE && m.getRemovedAt() == null)
                        .orElse(false);
                if (!isRespInGroup) {
                    throw new IllegalArgumentException("Người chịu chi phí phải là thành viên trong nhóm đồng sở hữu.");
                }
            }
            expense.setResponsibleUser(verifiedRespUser);
        }

        if (totalApproved.compareTo(threshold) >= 0) {
            expense.setStatus(ExpenseStatus.APPROVED);
            expense.setApprovedAt(Instant.now());
            Expense approvedExpense = expenseRepository.save(expense);

            // Phase 19/20 Invariant: Generate ExpenseShares ONLY once after approval
            expenseShareService.generateSharesForExpense(approvedExpense);
        } else if (totalRejected.compareTo(threshold) >= 0) {
            expense.setStatus(ExpenseStatus.REJECTED);
            expense.setRejectedAt(Instant.now());
            expenseRepository.save(expense);
        }

        return getApprovalStatus(expenseId, principal);
    }

    /**
     * Retrieve Comprehensive Approval / Verification Status for an Expense
     */
    @Transactional(readOnly = true)
    public ExpenseApprovalStatusResponse getApprovalStatus(UUID expenseId, UserPrincipal principal) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi phí: " + expenseId));

        UUID vehicleId = expense.getVehicle().getId();
        validateVehicleAccess(vehicleId, principal);

        CoOwnershipGroup group = expense.getCoOwnershipGroup() != null
                ? expense.getCoOwnershipGroup()
                : resolveGroupByVehicleId(vehicleId);

        List<OwnershipShare> activeShares = group != null
                ? resolveActiveOwnershipShares(group, vehicleId)
                : List.of();

        List<ExpenseApproval> approvals = approvalRepository.findByExpenseId(expenseId);

        Map<UUID, ExpenseApproval> approvalMap = approvals.stream()
                .collect(Collectors.toMap(a -> a.getUser().getId(), a -> a, (a1, a2) -> a1));

        UUID currentUserId = principal != null ? principal.getId() : null;
        UUID creatorId = expense.getCreatedBy() != null ? expense.getCreatedBy().getId() : null;
        boolean isCreator = currentUserId != null && currentUserId.equals(creatorId);

        boolean isUserInActiveShares = activeShares.stream()
                .anyMatch(s -> s.getMember().getUser().getId().equals(currentUserId));
        boolean canApprove = !isCreator
                && expense.getStatus() == ExpenseStatus.PENDING_VERIFICATION
                && isUserInActiveShares;

        ExpenseApproval currentApproval = currentUserId != null ? approvalMap.get(currentUserId) : null;
        ExpenseApprovalDecision currentDecision = currentApproval != null ? currentApproval.getDecision() : null;

        BigDecimal totalApproved = approvals.stream()
                .filter(a -> a.getDecision() == ExpenseApprovalDecision.APPROVE)
                .filter(a -> creatorId == null || !a.getUser().getId().equals(creatorId))
                .map(ExpenseApproval::getOwnershipPercentageSnapshot)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalRejected = approvals.stream()
                .filter(a -> a.getDecision() == ExpenseApprovalDecision.REJECT)
                .filter(a -> creatorId == null || !a.getUser().getId().equals(creatorId))
                .map(ExpenseApproval::getOwnershipPercentageSnapshot)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<MemberApprovalDecisionResponse> memberDecisions = new ArrayList<>();
        for (OwnershipShare oShare : activeShares) {
            UUID memberUserId = oShare.getMember().getUser().getId();
            String memberName = oShare.getMember().getUser().getFullName();
            boolean isMemberCreator = creatorId != null && creatorId.equals(memberUserId);

            ExpenseApproval a = approvalMap.get(memberUserId);
            memberDecisions.add(new MemberApprovalDecisionResponse(
                    memberUserId,
                    memberName,
                    oShare.getPercentage(),
                    isMemberCreator,
                    a != null ? a.getDecision() : null,
                    a != null ? a.getComment() : null,
                    a != null ? a.getCreatedAt() : null
            ));
        }

        // Sort: Creator first, then by ownership percentage desc
        memberDecisions.sort((d1, d2) -> {
            if (d1.isCreator()) return -1;
            if (d2.isCreator()) return 1;
            return d2.ownershipPercentage().compareTo(d1.ownershipPercentage());
        });

        return new ExpenseApprovalStatusResponse(
                expenseId,
                expense.getStatus(),
                expense.getStatus().getVietnameseLabel(),
                creatorId,
                expense.getCreatedBy() != null ? expense.getCreatedBy().getFullName() : null,
                totalApproved,
                totalRejected,
                new BigDecimal("50.00"),
                isCreator,
                canApprove,
                currentDecision,
                memberDecisions
        );
    }

    /**
     * Cancel a pending expense (allowed only by creator while still PENDING_VERIFICATION)
     */
    @Transactional
    public ExpenseResponse cancelExpense(UUID expenseId, UserPrincipal principal) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi phí: " + expenseId));

        if (expense.getStatus() != ExpenseStatus.PENDING_VERIFICATION) {
            throw new IllegalStateException("Chỉ có thể hủy khoản chi đang chờ xác minh.");
        }

        boolean isCreator = expense.getCreatedBy() != null && expense.getCreatedBy().getId().equals(principal.getId());
        boolean isAdmin = principal.getUser().getRole() == Role.ADMIN;
        if (!isCreator && !isAdmin) {
            throw new AccessDeniedException("Chỉ người tạo mới có quyền hủy khoản chi này.");
        }

        expense.setStatus(ExpenseStatus.CANCELLED);
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
                .map(this::toResponse)
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

        return toResponse(expense);
    }

    private ExpenseResponse toResponse(Expense expense) {
        if (expense == null) return null;
        Trip trip = null;
        if (expense.getRelatedTripId() != null) {
            trip = tripRepository.findById(expense.getRelatedTripId()).orElse(null);
        }
        return ExpenseResponse.fromEntity(expense, trip);
    }

    /**
     * Authoritative Monthly Summary Calculation
     * Invariant: ONLY APPROVED expenses count toward official total and category breakdown.
     * Pending claims are reported separately as pendingCount and pendingAmount.
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

        // Official totals: APPROVED only
        BigDecimal total = expenseRepository.sumApprovedAmountByVehicleIdAndOccurredAtBetween(vehicleId, startOfMonth, endOfMonth);
        long count = expenseRepository.countApprovedByVehicleIdAndOccurredAtBetween(vehicleId, startOfMonth, endOfMonth);

        // Separate transparency counts for pending claims
        BigDecimal pendingAmount = expenseRepository.sumPendingAmountByVehicleIdAndOccurredAtBetween(vehicleId, startOfMonth, endOfMonth);
        long pendingCount = expenseRepository.countPendingByVehicleIdAndOccurredAtBetween(vehicleId, startOfMonth, endOfMonth);

        List<Expense> approvedExpenses = expenseRepository.findByVehicleIdAndStatusAndOccurredAtBetweenOrderByOccurredAtDesc(
                vehicleId, ExpenseStatus.APPROVED, startOfMonth, endOfMonth
        );

        Map<String, BigDecimal> breakdown = approvedExpenses.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getCategory().name(),
                        Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)
                ));

        return new ExpenseSummaryResponse(
                yearMonth.toString(),
                total != null ? total : BigDecimal.ZERO,
                count,
                breakdown,
                pendingCount,
                pendingAmount != null ? pendingAmount : BigDecimal.ZERO
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
