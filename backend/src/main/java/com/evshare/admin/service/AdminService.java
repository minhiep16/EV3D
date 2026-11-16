package com.evshare.admin.service;

import com.evshare.admin.dto.*;
import com.evshare.audit.service.AuditLogService;
import com.evshare.auth.repository.RefreshTokenRepository;
import com.evshare.booking.entity.BookingStatus;
import com.evshare.booking.repository.BookingRepository;
import com.evshare.charging.entity.ChargingSessionStatus;
import com.evshare.charging.repository.ChargingSessionRepository;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.common.exception.UnauthorizedException;
import com.evshare.dispute.entity.DisputeStatus;
import com.evshare.dispute.repository.DisputeRepository;
import com.evshare.expense.entity.Expense;
import com.evshare.expense.entity.ExpenseShare;
import com.evshare.expense.repository.ExpenseRepository;
import com.evshare.expense.repository.ExpenseShareRepository;
import com.evshare.fund.entity.PersonalExpensePayment;
import com.evshare.fund.entity.PersonalPaymentStatus;
import com.evshare.fund.repository.PersonalExpensePaymentRepository;
import com.evshare.maintenance.entity.MaintenanceStatus;
import com.evshare.maintenance.repository.MaintenanceRequestRepository;
import com.evshare.onboarding.entity.DraftStatus;
import com.evshare.onboarding.repository.VehicleRegistrationDraftRepository;
import com.evshare.ownership.entity.CoOwnershipGroup;
import com.evshare.ownership.entity.GroupMember;
import com.evshare.ownership.entity.GroupVehicle;
import com.evshare.ownership.entity.GroupVehicleStatus;
import com.evshare.ownership.entity.InvitationStatus;
import com.evshare.ownership.entity.MemberStatus;
import com.evshare.ownership.entity.OwnershipShare;
import com.evshare.ownership.entity.TransferStatus;
import com.evshare.ownership.repository.CoOwnershipGroupRepository;
import com.evshare.ownership.repository.GroupMemberRepository;
import com.evshare.ownership.repository.MembershipInvitationRepository;
import com.evshare.ownership.repository.OwnershipShareRepository;
import com.evshare.ownership.repository.OwnershipTransferRequestRepository;
import com.evshare.security.UserPrincipal;
import com.evshare.trip.entity.Trip;
import com.evshare.trip.entity.TripStatus;
import com.evshare.trip.repository.TripRepository;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import com.evshare.user.entity.UserStatus;
import com.evshare.user.repository.UserRepository;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.repository.VehicleRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);

    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final CoOwnershipGroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final BookingRepository bookingRepository;
    private final TripRepository tripRepository;
    private final ChargingSessionRepository chargingSessionRepository;
    private final VehicleRegistrationDraftRepository draftRepository;
    private final MembershipInvitationRepository invitationRepository;
    private final PersonalExpensePaymentRepository paymentRepository;
    private final MaintenanceRequestRepository maintenanceRequestRepository;
    private final DisputeRepository disputeRepository;
    private final OwnershipTransferRequestRepository transferRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuditLogService auditLogService;
    private final ExpenseRepository expenseRepository;
    private final ExpenseShareRepository expenseShareRepository;
    private final OwnershipShareRepository ownershipShareRepository;

    public AdminService(
            UserRepository userRepository,
            VehicleRepository vehicleRepository,
            CoOwnershipGroupRepository groupRepository,
            GroupMemberRepository memberRepository,
            BookingRepository bookingRepository,
            TripRepository tripRepository,
            ChargingSessionRepository chargingSessionRepository,
            VehicleRegistrationDraftRepository draftRepository,
            MembershipInvitationRepository invitationRepository,
            PersonalExpensePaymentRepository paymentRepository,
            MaintenanceRequestRepository maintenanceRequestRepository,
            DisputeRepository disputeRepository,
            OwnershipTransferRequestRepository transferRepository,
            RefreshTokenRepository refreshTokenRepository,
            AuditLogService auditLogService,
            ExpenseRepository expenseRepository,
            ExpenseShareRepository expenseShareRepository,
            OwnershipShareRepository ownershipShareRepository) {
        this.userRepository = userRepository;
        this.vehicleRepository = vehicleRepository;
        this.groupRepository = groupRepository;
        this.memberRepository = memberRepository;
        this.bookingRepository = bookingRepository;
        this.tripRepository = tripRepository;
        this.chargingSessionRepository = chargingSessionRepository;
        this.draftRepository = draftRepository;
        this.invitationRepository = invitationRepository;
        this.paymentRepository = paymentRepository;
        this.maintenanceRequestRepository = maintenanceRequestRepository;
        this.disputeRepository = disputeRepository;
        this.transferRepository = transferRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.auditLogService = auditLogService;
        this.expenseRepository = expenseRepository;
        this.expenseShareRepository = expenseShareRepository;
        this.ownershipShareRepository = ownershipShareRepository;
    }

    @Transactional(readOnly = true)
    public AdminDashboardStatsResponse getDashboardStats(UserPrincipal principal) {
        validateAdminAccess(principal);

        long regUsers = userRepository.count();
        long activeUsers = userRepository.countByStatus(UserStatus.ACTIVE);
        long suspendedUsers = userRepository.countByStatus(UserStatus.SUSPENDED);
        long inactiveUsers = userRepository.countByStatus(UserStatus.INACTIVE);

        long staffUsers = userRepository.countByRole(Role.STAFF);
        long coOwners = userRepository.countByRole(Role.CO_OWNER);
        long admins = userRepository.countByRole(Role.ADMIN);

        long vehicles = vehicleRepository.count();
        long groups = groupRepository.count();

        long activeBookings = bookingRepository.countByStatusIn(List.of(BookingStatus.CONFIRMED));
        long activeTrips = tripRepository.countByStatus(TripStatus.ACTIVE);
        long activeCharging = chargingSessionRepository.countByStatus(ChargingSessionStatus.ACTIVE);

        long pendingDrafts = draftRepository
                .findByStatusInOrderByUpdatedAtDesc(List.of(DraftStatus.SUBMITTED, DraftStatus.UNDER_REVIEW)).size();
        long pendingInvites = invitationRepository.countByStatusIn(List.of(
                InvitationStatus.PENDING_INVITEE_RESPONSE,
                InvitationStatus.PENDING_CONTRIBUTOR_CONSENT,
                InvitationStatus.PENDING_CONTRACT_SIGNATURE,
                InvitationStatus.ACCEPTED));
        long pendingPayments = paymentRepository.countByStatus(PersonalPaymentStatus.PAYMENT_SUBMITTED);
        long activeMaintenance = maintenanceRequestRepository.countByStatusIn(List.of(
                MaintenanceStatus.PENDING_APPROVAL,
                MaintenanceStatus.APPROVED,
                MaintenanceStatus.SCHEDULED,
                MaintenanceStatus.IN_PROGRESS));
        long activeDisputes = disputeRepository.countByStatusNotIn(List.of(
                DisputeStatus.RESOLVED,
                DisputeStatus.CLOSED,
                DisputeStatus.REJECTED));

        return new AdminDashboardStatsResponse(
                regUsers,
                activeUsers,
                suspendedUsers,
                inactiveUsers,
                staffUsers,
                coOwners,
                admins,
                vehicles,
                groups,
                activeBookings,
                activeTrips,
                activeCharging,
                pendingDrafts,
                pendingInvites,
                pendingPayments,
                activeMaintenance,
                activeDisputes);
    }

    @Transactional(readOnly = true)
    public Page<AdminUserResponse> getUsers(String query, Role role, UserStatus status, Pageable pageable,
            UserPrincipal principal) {
        validateAdminAccess(principal);

        Page<User> usersPage = userRepository.findWithFilters(role, status, query, pageable);

        return usersPage.map(this::enrichUserResponse);
    }

    @Transactional
    public AdminUserResponse updateUserStatus(UUID targetUserId, UpdateUserStatusRequest request,
            UserPrincipal adminPrincipal, HttpServletRequest servletRequest) {
        validateAdminAccess(adminPrincipal);

        if (adminPrincipal.getId().equals(targetUserId)) {
            throw new IllegalArgumentException("Không thể tự thay đổi trạng thái tài khoản của chính mình.");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại: " + targetUserId));

        if (request.status() == UserStatus.SUSPENDED || request.status() == UserStatus.INACTIVE) {
            // Check active trip
            List<Trip> activeTrips = tripRepository.findByUserIdAndStatus(targetUserId, TripStatus.ACTIVE);
            if (!activeTrips.isEmpty()) {
                throw new IllegalStateException(
                        "Không thể khóa tài khoản khi người dùng đang có chuyến đi đang diễn ra (Mã xe: " +
                                activeTrips.get(0).getVehicle().getName() + ").");
            }

            // Check upcoming confirmed bookings
            boolean hasUpcomingBookings = bookingRepository.findByUserIdOrderByStartTimeDesc(targetUserId).stream()
                    .anyMatch(b -> b.getStatus() == BookingStatus.CONFIRMED
                            && b.getEndTime().isAfter(java.time.Instant.now()));
            if (hasUpcomingBookings) {
                throw new IllegalStateException(
                        "Người dùng đang có lịch đặt xe chưa kết thúc. Vui lòng hủy lịch trước khi khóa tài khoản.");
            }
        }

        UserStatus oldStatus = targetUser.getStatus();
        targetUser.setStatus(request.status());
        User savedUser = userRepository.save(targetUser);

        // Invalidate active refresh tokens on suspension or deactivation
        if (request.status() != UserStatus.ACTIVE) {
            refreshTokenRepository.deleteByUser(targetUser);
        }

        // Record centralized audit log
        String clientIp = extractClientIp(servletRequest);
        auditLogService.recordLog(
                adminPrincipal.getUser(),
                "UPDATE_USER_STATUS",
                "USER",
                targetUserId.toString(),
                oldStatus != null ? oldStatus.name() : "N/A",
                request.status().name(),
                String.format("Cập nhật trạng thái người dùng %s (%s) từ %s sang %s. Lý do: %s",
                        targetUser.getFullName(), targetUser.getEmail(), oldStatus, request.status(),
                        request.reason() != null ? request.reason() : "Không ghi nhận"),
                clientIp);

        return enrichUserResponse(savedUser);
    }

    @Transactional
    public AdminUserResponse updateUserRole(UUID targetUserId, UpdateUserRoleRequest request,
            UserPrincipal adminPrincipal, HttpServletRequest servletRequest) {
        validateAdminAccess(adminPrincipal);

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại: " + targetUserId));

        if (targetUser.getRole() == Role.ADMIN && request.role() != Role.ADMIN) {
            long remainingAdmins = userRepository.countByRole(Role.ADMIN);
            if (remainingAdmins <= 1) {
                throw new IllegalStateException(
                        "Hệ thống bắt buộc phải duy trì tối thiểu một tài khoản Quản trị viên (ADMIN).");
            }
        }

        Role oldRole = targetUser.getRole();
        targetUser.setRole(request.role());
        User savedUser = userRepository.save(targetUser);

        // Record centralized audit log
        String clientIp = extractClientIp(servletRequest);
        auditLogService.recordLog(
                adminPrincipal.getUser(),
                "UPDATE_USER_ROLE",
                "USER",
                targetUserId.toString(),
                oldRole != null ? oldRole.name() : "N/A",
                request.role().name(),
                String.format("Cập nhật vai trò người dùng %s (%s) từ %s sang %s. Lý do: %s",
                        targetUser.getFullName(), targetUser.getEmail(), oldRole, request.role(),
                        request.reason() != null ? request.reason() : "Không ghi nhận"),
                clientIp);

        return enrichUserResponse(savedUser);
    }

    @Transactional(readOnly = true)
    public AdminFinancialOverviewResponse getFinancialOverview(UserPrincipal principal) {
        validateAdminAccess(principal);

        List<Expense> expenses = expenseRepository.findAll();
        BigDecimal totalExpenses = BigDecimal.ZERO;
        Map<String, BigDecimal> byCategory = new LinkedHashMap<>();
        Map<String, BigDecimal> byVehicle = new LinkedHashMap<>();

        for (Expense e : expenses) {
            BigDecimal amt = e.getAmount() != null ? e.getAmount() : BigDecimal.ZERO;
            totalExpenses = totalExpenses.add(amt);

            String cat = e.getCategory() != null ? e.getCategory().name() : "OTHER";
            byCategory.put(cat, byCategory.getOrDefault(cat, BigDecimal.ZERO).add(amt));

            String vName = e.getVehicle() != null
                    ? (e.getVehicle().getName() != null ? e.getVehicle().getName() : e.getVehicle().getLicensePlate())
                    : "Chung";
            byVehicle.put(vName, byVehicle.getOrDefault(vName, BigDecimal.ZERO).add(amt));
        }

        List<PersonalExpensePayment> payments = paymentRepository.findAll();
        BigDecimal verifiedPayments = BigDecimal.ZERO;
        long awaitingCount = 0;

        for (PersonalExpensePayment p : payments) {
            if (p.getStatus() == PersonalPaymentStatus.PAYMENT_VERIFIED) {
                if (p.getAmount() != null) {
                    verifiedPayments = verifiedPayments.add(p.getAmount());
                }
            } else if (p.getStatus() == PersonalPaymentStatus.PAYMENT_SUBMITTED) {
                awaitingCount++;
            }
        }

        BigDecimal outstanding = totalExpenses.subtract(verifiedPayments).max(BigDecimal.ZERO);

        return new AdminFinancialOverviewResponse(
                totalExpenses,
                verifiedPayments,
                outstanding,
                awaitingCount,
                byCategory,
                byVehicle);
    }

    @Transactional(readOnly = true)
    public AdminMemberDetailResponse getMemberInspectionDetail(UUID groupId, UUID memberId, UserPrincipal principal) {
        validateAdminAccess(principal);

        GroupMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Thành viên không tồn tại: " + memberId));

        User u = member.getUser();
        UUID userId = u.getId();

        // Calculate ownership percentage
        BigDecimal ownershipPct = ownershipShareRepository.findByMemberId(memberId).stream()
                .map(OwnershipShare::getPercentage)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        CoOwnershipGroup group = member.getGroup();
        UUID vehicleId = null;
        if (group != null) {
            if (group.getVehicleId() != null) {
                vehicleId = group.getVehicleId();
            } else if (group.getGroupVehicles() != null) {
                vehicleId = group.getGroupVehicles().stream()
                        .filter(gv -> gv.getStatus() == GroupVehicleStatus.ACTIVE && gv.getVehicle() != null)
                        .map(gv -> gv.getVehicle().getId())
                        .findFirst()
                        .orElse(null);
            }
        }

        // Bookings
        long totalBookings = (vehicleId != null
                ? bookingRepository.findByUserIdAndVehicleIdOrderByStartTimeDesc(userId, vehicleId)
                : bookingRepository.findByUserIdOrderByStartTimeDesc(userId)).size();

        // Trips
        List<Trip> userTrips = (vehicleId != null
                ? tripRepository.findByUserIdAndVehicleIdOrderByStartedAtDesc(userId, vehicleId)
                : tripRepository.findByUserIdOrderByStartedAtDesc(userId));
        long totalTrips = userTrips.size();
        double totalDistance = userTrips.stream()
                .filter(t -> t.getStatus() == TripStatus.COMPLETED && t.getEndOdometer() != null
                        && t.getStartOdometer() != null)
                .mapToDouble(t -> t.getEndOdometer().subtract(t.getStartOdometer()).doubleValue())
                .sum();
        double totalHours = userTrips.stream()
                .filter(t -> t.getStatus() == TripStatus.COMPLETED && t.getStartedAt() != null
                        && t.getEndedAt() != null)
                .mapToDouble(t -> Duration.between(t.getStartedAt(), t.getEndedAt()).toMinutes() / 60.0)
                .sum();

        // Pending transfers
        long pendingTransfers = transferRepository.findByGroupIdAndStatusIn(
                groupId,
                List.of(TransferStatus.PENDING_ACCEPTANCE,
                        TransferStatus.PENDING_APPROVAL,
                        TransferStatus.APPROVED,
                        TransferStatus.PENDING_CONTRACT))
                .stream().filter(t -> (t.getFromUser() != null && t.getFromUser().getId().equals(userId)) ||
                        (t.getToUser() != null && t.getToUser().getId().equals(userId)))
                .count();

        // Financial obligations from ExpenseShares
        List<ExpenseShare> shares = expenseShareRepository.findByUserId(userId);
        BigDecimal requiredShare = shares.stream()
                .map(ExpenseShare::getShareAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<PersonalExpensePayment> payments = paymentRepository.findByPayerUserIdOrderByCreatedAtDesc(userId);
        BigDecimal paidAmount = payments.stream()
                .filter(p -> p.getStatus() == PersonalPaymentStatus.PAYMENT_VERIFIED)
                .map(PersonalExpensePayment::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal outstanding = requiredShare.subtract(paidAmount).max(BigDecimal.ZERO);

        boolean contractSigned = member.getStatus() == MemberStatus.ACTIVE;

        return new AdminMemberDetailResponse(
                member.getId(),
                u.getId(),
                u.getFullName(),
                u.getEmail(),
                member.getMemberRole() != null ? member.getMemberRole().name() : "MEMBER",
                member.getStatus() != null ? member.getStatus().name() : "ACTIVE",
                member.getJoinedAt(),
                ownershipPct,
                totalBookings,
                totalTrips,
                Math.round(totalDistance * 100.0) / 100.0,
                Math.round(totalHours * 10.0) / 10.0,
                pendingTransfers,
                contractSigned,
                requiredShare,
                paidAmount,
                outstanding);
    }

    private AdminUserResponse enrichUserResponse(User u) {
        List<GroupMember> memberships = memberRepository.findByUserIdAndStatus(u.getId(), MemberStatus.ACTIVE).stream()
                .filter(m -> m.getRemovedAt() == null)
                .toList();

        Set<UUID> vehicleIds = new LinkedHashSet<>();
        Set<String> directVehicleNames = new LinkedHashSet<>();

        for (GroupMember m : memberships) {
            CoOwnershipGroup group = m.getGroup();
            if (group != null) {
                if (group.getVehicleId() != null) {
                    vehicleIds.add(group.getVehicleId());
                }
                if (group.getGroupVehicles() != null) {
                    for (GroupVehicle gv : group.getGroupVehicles()) {
                        if (gv.getStatus() == GroupVehicleStatus.ACTIVE && gv.getVehicle() != null) {
                            if (gv.getVehicle().getName() != null) {
                                directVehicleNames.add(gv.getVehicle().getName());
                            } else if (gv.getVehicle().getId() != null) {
                                vehicleIds.add(gv.getVehicle().getId());
                            }
                        }
                    }
                }
            }
        }

        if (!vehicleIds.isEmpty()) {
            vehicleRepository.findAllById(vehicleIds).forEach(v -> {
                if (v.getName() != null) {
                    directVehicleNames.add(v.getName());
                }
            });
        }

        List<String> vehicleNames = new ArrayList<>(directVehicleNames);

        boolean hasActiveTrip = !tripRepository.findByUserIdAndStatus(u.getId(), TripStatus.ACTIVE).isEmpty();
        boolean hasActiveBooking = !bookingRepository.findByUserIdOrderByStartTimeDesc(u.getId()).stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED
                        && b.getEndTime().isAfter(java.time.Instant.now()))
                .toList().isEmpty();

        return new AdminUserResponse(
                u.getId(),
                u.getEmail(),
                u.getFullName(),
                u.getRole(),
                u.getStatus(),
                u.getCreatedAt(),
                u.getUpdatedAt(),
                memberships.size(),
                vehicleNames,
                hasActiveTrip,
                hasActiveBooking);
    }

    private void validateAdminAccess(UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }
        if (principal.getUser().getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Chỉ Quản trị viên (ADMIN) mới có quyền truy cập vào Trung tâm Quản trị.");
        }
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null)
            return "127.0.0.1";
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip != null ? ip.split(",")[0].trim() : "127.0.0.1";
    }
}
