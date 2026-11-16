package com.evshare.notification.service;

import com.evshare.booking.entity.Booking;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.common.exception.UnauthorizedException;
import com.evshare.handover.entity.VehicleHandover;
import com.evshare.notification.dto.NotificationResponse;
import com.evshare.notification.entity.Notification;
import com.evshare.notification.repository.NotificationRepository;
import com.evshare.ownership.entity.GroupMember;
import com.evshare.ownership.entity.GroupVehicle;
import com.evshare.ownership.entity.MemberStatus;
import com.evshare.ownership.repository.GroupMemberRepository;
import com.evshare.ownership.repository.GroupVehicleRepository;
import com.evshare.security.UserPrincipal;
import com.evshare.trip.entity.Trip;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import com.evshare.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final GroupVehicleRepository groupVehicleRepository;
    private final GroupMemberRepository groupMemberRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.evshare.booking.repository.BookingRepository bookingRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository,
            GroupVehicleRepository groupVehicleRepository,
            GroupMemberRepository groupMemberRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.groupVehicleRepository = groupVehicleRepository;
        this.groupMemberRepository = groupMemberRepository;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotificationsForUser(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để xem thông báo");
        }
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(principal.getId())
                .stream()
                .map(NotificationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UserPrincipal principal) {
        if (principal == null) return 0;
        return notificationRepository.countByRecipientIdAndReadAtIsNull(principal.getId());
    }

    @Transactional
    public NotificationResponse markAsRead(UUID id, UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo"));

        if (!notification.getRecipient().getId().equals(principal.getId())) {
            throw new UnauthorizedException("Không có quyền truy cập thông báo này");
        }

        if (notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
            notification = notificationRepository.save(notification);
        }
        return NotificationResponse.fromEntity(notification);
    }

    @Transactional
    public int markAllAsRead(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }
        return notificationRepository.markAllAsReadForUser(principal.getId(), Instant.now());
    }

    @Transactional
    public void deleteNotification(UUID id, UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo"));

        if (!notification.getRecipient().getId().equals(principal.getId())) {
            throw new UnauthorizedException("Không có quyền xóa thông báo này");
        }
        notificationRepository.delete(notification);
    }

    @Transactional
    public int deleteAllReadNotifications(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }
        return notificationRepository.deleteAllReadForUser(principal.getId());
    }

    @Transactional
    public int deleteAllNotifications(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }
        return notificationRepository.deleteAllForUser(principal.getId());
    }

    /**
     * Send persistent notification with idempotent deduplication.
     */
    @Transactional
    public Optional<Notification> sendNotification(
            UUID recipientUserId,
            UUID vehicleId,
            UUID groupId,
            String entityType,
            UUID entityId,
            String eventType,
            String title,
            String message,
            String severity) {

        if (recipientUserId == null) return Optional.empty();

        // Duplicate Protection (Section 12): check if identical event already recorded for this entity
        if (entityId != null && eventType != null) {
            Optional<Notification> existing = notificationRepository
                    .findFirstByRecipientIdAndEventTypeAndEntityId(recipientUserId, eventType, entityId);
            if (existing.isPresent()) {
                Notification notif = existing.get();
                boolean changed = false;
                if (title != null && !title.equals(notif.getTitle())) {
                    notif.setTitle(title);
                    changed = true;
                }
                if (message != null && !message.equals(notif.getMessage())) {
                    notif.setMessage(message);
                    changed = true;
                }
                if (changed) {
                    notificationRepository.save(notif);
                }
                return Optional.of(notif);
            }
        }

        User recipient = userRepository.findById(recipientUserId).orElse(null);
        if (recipient == null) return Optional.empty();

        Notification notif = new Notification(
                UUID.randomUUID(),
                recipient,
                vehicleId,
                groupId,
                entityType,
                entityId,
                eventType,
                title,
                message,
                severity
        );

        return Optional.of(notificationRepository.save(notif));
    }

    // ==========================================
    // DOMAIN NOTIFICATION HELPERS
    // ==========================================

    private List<User> getActiveCoOwnersForVehicle(UUID vehicleId) {
        if (vehicleId == null) return Collections.emptyList();
        List<GroupVehicle> gvs = groupVehicleRepository.findByVehicleId(vehicleId);
        Set<User> coOwners = new HashSet<>();
        for (GroupVehicle gv : gvs) {
            if (gv.getGroup() != null) {
                List<GroupMember> members = groupMemberRepository.findByGroupIdAndStatus(
                        gv.getGroup().getId(), MemberStatus.ACTIVE);
                for (GroupMember m : members) {
                    if (m.getUser() != null && m.getRemovedAt() == null) {
                        coOwners.add(m.getUser());
                    }
                }
            }
        }
        return new ArrayList<>(coOwners);
    }

    private List<User> getActiveCoOwnersForGroup(UUID groupId) {
        if (groupId == null) return Collections.emptyList();
        List<GroupMember> members = groupMemberRepository.findByGroupIdAndStatus(groupId, MemberStatus.ACTIVE);
        List<User> users = new ArrayList<>();
        for (GroupMember m : members) {
            if (m.getUser() != null && m.getRemovedAt() == null) {
                users.add(m.getUser());
            }
        }
        return users;
    }

    private List<User> getAllStaffUsers() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.STAFF || u.getRole() == Role.ADMIN)
                .collect(Collectors.toList());
    }

    // 1. Damage Notifications (Section 3)
    @Transactional
    public void notifyCoOwnersOfDamageRecorded(
            UUID vehicleId, String vehiclePlate, String partCode, String damageType, String severity, UUID damageId) {
        List<User> coOwners = getActiveCoOwnersForVehicle(vehicleId);
        String title = "Đã ghi nhận hư hỏng mới";
        String message = String.format("Phương tiện %s ghi nhận hư hỏng ở bộ phận %s (Loại: %s, Mức độ: %s).",
                vehiclePlate != null ? vehiclePlate : "xe",
                partCode != null ? partCode : "thân vỏ",
                damageType != null ? damageType : "Hư hại",
                severity != null ? severity : "Cần kiểm tra");

        for (User coOwner : coOwners) {
            sendNotification(
                    coOwner.getId(),
                    vehicleId,
                    null,
                    "DAMAGE",
                    damageId,
                    "DAMAGE_RECORDED",
                    title,
                    message,
                    "WARNING"
            );
        }
    }

    @Transactional
    public void notifyDamageResolved(UUID vehicleId, String vehiclePlate, String partCode, UUID damageId) {
        List<User> coOwners = getActiveCoOwnersForVehicle(vehicleId);
        String title = "Hư hỏng đã được sửa chữa";
        String message = String.format("Hư hỏng bộ phận %s trên xe %s đã được nhân viên khắc phục và nghiệm thu hoàn tất.",
                partCode != null ? partCode : "phương tiện",
                vehiclePlate != null ? vehiclePlate : "xe");

        for (User coOwner : coOwners) {
            sendNotification(
                    coOwner.getId(),
                    vehicleId,
                    null,
                    "DAMAGE",
                    damageId,
                    "DAMAGE_RESOLVED",
                    title,
                    message,
                    "SUCCESS"
            );
        }
    }

    // 2. Repair Proposal Notifications (Section 4)
    @Transactional
    public void notifyNewRepairProposal(
            UUID vehicleId, UUID groupId, UUID proposalId, String proposalTitle, UUID creatorUserId) {
        List<User> members = getActiveCoOwnersForGroup(groupId);
        String title = "Có đề xuất sửa chữa mới";
        String message = String.format("Thành viên nhóm vừa tạo đề xuất sửa chữa mới: \"%s\".", proposalTitle);

        for (User member : members) {
            // Notify other co-owners
            if (creatorUserId == null || !creatorUserId.equals(member.getId())) {
                sendNotification(
                        member.getId(),
                        vehicleId,
                        groupId,
                        "PROPOSAL",
                        proposalId,
                        "PROPOSAL_CREATED",
                        title,
                        message,
                        "INFO"
                );
            }
        }
    }

    @Transactional
    public void notifyProposalAwaitingVote(
            UUID vehicleId, UUID groupId, UUID proposalId, String proposalTitle) {
        List<User> members = getActiveCoOwnersForGroup(groupId);
        String title = "Đề xuất sửa chữa đang chờ tạo biểu quyết";
        String message = String.format("Đề xuất sửa chữa \"%s\" cần được tạo phiên biểu quyết để nhóm thống nhất tiến hành.", proposalTitle);

        for (User member : members) {
            sendNotification(
                    member.getId(),
                    vehicleId,
                    groupId,
                    "PROPOSAL",
                    proposalId,
                    "PROPOSAL_AWAITING_VOTE",
                    title,
                    message,
                    "ACTION_REQUIRED"
            );
        }
    }

    // 3. Voting Notifications (Section 5)
    @Transactional
    public void notifyVotingSessionCreated(
            UUID vehicleId, UUID groupId, UUID proposalId, String proposalTitle) {
        List<User> members = getActiveCoOwnersForGroup(groupId);
        String title = "Có biểu quyết sửa chữa cần tham gia";
        String message = String.format("Phiên biểu quyết sửa chữa \"%s\" đã được mở. Vui lòng tham gia bỏ phiếu.", proposalTitle);

        for (User member : members) {
            sendNotification(
                    member.getId(),
                    vehicleId,
                    groupId,
                    "VOTE",
                    proposalId,
                    "VOTE_SESSION_OPENED",
                    title,
                    message,
                    "ACTION_REQUIRED"
            );
        }
    }

    @Transactional
    public void notifyVoteFinalized(
            UUID vehicleId, UUID groupId, UUID proposalId, String proposalTitle, boolean passed) {
        List<User> members = getActiveCoOwnersForGroup(groupId);
        String title = passed ? "Biểu quyết sửa chữa đã thông qua" : "Biểu quyết sửa chữa không được thông qua";
        String message = passed
                ? String.format("Biểu quyết sửa chữa \"%s\" đã đạt tỷ lệ biểu quyết đồng thuận và được thông qua.", proposalTitle)
                : String.format("Biểu quyết sửa chữa \"%s\" không đạt ngưỡng phê duyệt của nhóm đồng sở hữu.", proposalTitle);

        String severity = passed ? "SUCCESS" : "INFO";

        for (User member : members) {
            sendNotification(
                    member.getId(),
                    vehicleId,
                    groupId,
                    "VOTE",
                    proposalId,
                    passed ? "VOTE_PASSED" : "VOTE_REJECTED",
                    title,
                    message,
                    severity
            );
        }
    }

    // 4. STAFF Workflow Notifications (Section 6)
    @Transactional
    public void notifyRepairApprovedForStaff(
            UUID vehicleId, String vehiclePlate, UUID maintenanceId, String title) {
        List<User> staffUsers = getAllStaffUsers();
        String notifTitle = "Có công việc sửa chữa đã được phê duyệt";
        String message = String.format("Yêu cầu sửa chữa \"%s\" của xe %s đã được đồng sở hữu phê duyệt và chờ tiếp nhận.",
                title != null ? title : "Bảo dưỡng",
                vehiclePlate != null ? vehiclePlate : "xe");

        for (User staff : staffUsers) {
            sendNotification(
                    staff.getId(),
                    vehicleId,
                    null,
                    "MAINTENANCE",
                    maintenanceId,
                    "REPAIR_APPROVED_FOR_STAFF",
                    notifTitle,
                    message,
                    "ACTION_REQUIRED"
            );
        }
    }

    @Transactional
    public void notifyStaffAcceptedRepair(
            UUID vehicleId, UUID groupId, UUID maintenanceId, String staffName) {
        List<User> members = getActiveCoOwnersForVehicle(vehicleId);
        String title = "Nhân viên đã tiếp nhận sửa chữa";
        String message = String.format("Nhân viên kỹ thuật %s đã tiếp nhận lệnh sửa chữa và chuẩn bị quy trình kỹ thuật.",
                staffName != null ? staffName : "vận hành");

        for (User member : members) {
            sendNotification(
                    member.getId(),
                    vehicleId,
                    groupId,
                    "MAINTENANCE",
                    maintenanceId,
                    "STAFF_ACCEPTED_REPAIR",
                    title,
                    message,
                    "INFO"
            );
        }
    }

    @Transactional
    public void notifyStaffScheduledRepair(
            UUID vehicleId, UUID groupId, UUID maintenanceId, String scheduledDate) {
        List<User> members = getActiveCoOwnersForVehicle(vehicleId);
        String title = "Đã lên lịch sửa chữa";
        String message = String.format("Lịch sửa chữa phương tiện đã được ấn định vào %s.",
                scheduledDate != null ? scheduledDate : "thời gian tới");

        for (User member : members) {
            sendNotification(
                    member.getId(),
                    vehicleId,
                    groupId,
                    "MAINTENANCE",
                    maintenanceId,
                    "STAFF_SCHEDULED_REPAIR",
                    title,
                    message,
                    "INFO"
            );
        }
    }

    @Transactional
    public void notifyStaffRepairStarted(
            UUID vehicleId, UUID groupId, UUID maintenanceId) {
        List<User> members = getActiveCoOwnersForVehicle(vehicleId);
        String title = "Xe đang được sửa chữa";
        String message = "Xe đã được đưa vào khu vực xưởng kỹ thuật và đang tiến hành sửa chữa.";

        for (User member : members) {
            sendNotification(
                    member.getId(),
                    vehicleId,
                    groupId,
                    "MAINTENANCE",
                    maintenanceId,
                    "STAFF_REPAIR_STARTED",
                    title,
                    message,
                    "INFO"
            );
        }
    }

    @Transactional
    public void notifyRepairInspectionPassed(
            UUID vehicleId, UUID groupId, UUID maintenanceId) {
        List<User> members = getActiveCoOwnersForVehicle(vehicleId);
        String title = "Sửa chữa hoàn tất";
        String message = "Quá trình sửa chữa và kiểm tra nghiệm thu đạt chuẩn (PASSED). Phương tiện đã sẵn sàng vận hành.";

        for (User member : members) {
            sendNotification(
                    member.getId(),
                    vehicleId,
                    groupId,
                    "MAINTENANCE",
                    maintenanceId,
                    "INSPECTION_PASSED",
                    title,
                    message,
                    "SUCCESS"
            );
        }
    }

    @Transactional
    public void notifyRepairInspectionFailed(
            UUID vehicleId, UUID groupId, UUID maintenanceId, String notes) {
        List<User> members = getActiveCoOwnersForVehicle(vehicleId);
        String title = "Sửa chữa chưa đạt nghiệm thu";
        String message = String.format("Kiểm tra nghiệm thu chưa đạt chuẩn. Nhân viên đang tiến hành hiệu chỉnh lại (%s).",
                notes != null && !notes.isBlank() ? notes : "Cần khắc phục bổ sung");

        for (User member : members) {
            sendNotification(
                    member.getId(),
                    vehicleId,
                    groupId,
                    "MAINTENANCE",
                    maintenanceId,
                    "INSPECTION_FAILED",
                    title,
                    message,
                    "WARNING"
            );
        }
    }

    // 5. Financial Notifications (Section 7)
    @Transactional
    public void notifyFinancialAllocation(
            UUID groupId, UUID expenseId, String title, String amountFormatted) {
        List<User> members = getActiveCoOwnersForGroup(groupId);
        String notifTitle = "Chi phí bảo dưỡng đã được phân bổ";
        String message = String.format("Chi phí \"%s\" (%s) đã được phân bổ theo tỷ lệ sở hữu nhóm (Chế độ mô phỏng DEMO).",
                title != null ? title : "Bảo dưỡng", amountFormatted);

        for (User member : members) {
            sendNotification(
                    member.getId(),
                    null,
                    groupId,
                    "FINANCE",
                    expenseId,
                    "FINANCIAL_ALLOCATED",
                    notifTitle,
                    message,
                    "INFO"
            );
        }
    }

    @Transactional
    public void notifyPaymentVerificationRequested(
            UUID groupId, UUID paymentId, String amountFormatted) {
        notifyPaymentVerificationRequested(null, groupId, paymentId, amountFormatted, null);
    }

    @Transactional
    public void notifyPaymentVerificationRequested(
            UUID vehicleId, UUID groupId, UUID paymentId, String amountFormatted, String payerName) {
        List<User> staffUsers = getAllStaffUsers();
        String title = "Đã gửi yêu cầu xác minh thanh toán";
        String message = payerName != null
                ? String.format("Đồng sở hữu %s đã gửi thanh toán %s (DEMO), đang chờ nhân viên kiểm tra xác thực.", payerName, amountFormatted)
                : String.format("Yêu cầu xác minh thanh toán số tiền %s đang chờ nhân viên kiểm tra (DEMO).", amountFormatted);

        for (User staff : staffUsers) {
            sendNotification(
                    staff.getId(),
                    vehicleId,
                    groupId,
                    "FINANCE",
                    paymentId,
                    "PAYMENT_VERIFICATION_REQUESTED",
                    title,
                    message,
                    "ACTION_REQUIRED"
            );
        }
    }

    @Transactional
    public void notifyPaymentVerified(
            UUID recipientUserId, UUID paymentId, String amountFormatted) {
        notifyPaymentVerified(recipientUserId, null, paymentId, amountFormatted);
    }

    @Transactional
    public void notifyPaymentVerified(
            UUID recipientUserId, UUID vehicleId, UUID paymentId, String amountFormatted) {
        String title = "Thanh toán đã được xác minh";
        String message = String.format("Thanh toán số tiền %s đã được nhân viên xác nhận hợp lệ thành công (DEMO).", amountFormatted);

        sendNotification(
                recipientUserId,
                vehicleId,
                null,
                "FINANCE",
                paymentId,
                "PAYMENT_VERIFIED",
                title,
                message,
                "SUCCESS"
        );
    }

    @Transactional
    public void notifyPaymentRejected(
            UUID recipientUserId, UUID vehicleId, UUID paymentId, String amountFormatted, String reason) {
        String title = "Thanh toán bị từ chối xác minh";
        String message = String.format("Thanh toán số tiền %s chưa được phê duyệt. Lý do: %s (DEMO).",
                amountFormatted, (reason != null && !reason.isBlank()) ? reason : "Thông tin chưa khớp hoặc thiếu chứng từ");

        sendNotification(
                recipientUserId,
                vehicleId,
                null,
                "FINANCE",
                paymentId,
                "PAYMENT_REJECTED",
                title,
                message,
                "WARNING"
        );
    }

    @Transactional
    public void notifyFinancialSettled(
            UUID groupId, UUID expenseId, String title) {
        List<User> members = getActiveCoOwnersForGroup(groupId);
        String notifTitle = "Chi phí đã được quyết toán";
        String message = String.format("Hạng mục \"%s\" đã hoàn tất quyết toán tài chính từ quỹ chung nhóm (DEMO).",
                title != null ? title : "Chi phí bảo dưỡng");

        for (User member : members) {
            sendNotification(
                    member.getId(),
                    null,
                    groupId,
                    "FINANCE",
                    expenseId,
                    "FINANCIAL_SETTLED",
                    notifTitle,
                    message,
                    "SUCCESS"
            );
        }
    }

    // ==========================================
    // VEHICLE LIFECYCLE NOTIFICATION HELPERS
    // ==========================================

    private static final DateTimeFormatter TIME_FORMATTER_VI = DateTimeFormatter.ofPattern("HH:mm")
            .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    private static final DateTimeFormatter DATE_FORMATTER_VI = DateTimeFormatter.ofPattern("dd/MM/yyyy")
            .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    private String formatTimeVi(Instant instant) {
        if (instant == null) return "--:--";
        return TIME_FORMATTER_VI.format(instant);
    }

    private String formatDateVi(Instant instant) {
        if (instant == null) return "hôm nay";
        return DATE_FORMATTER_VI.format(instant);
    }

    // 6. Booking Confirmation Notifications
    @Transactional
    public void notifyBookingConfirmed(Booking booking) {
        if (booking == null || booking.getUser() == null || booking.getVehicle() == null) {
            return;
        }
        String vehicleName = booking.getVehicle().getName() != null
                ? booking.getVehicle().getName()
                : (booking.getVehicle().getLicensePlate() != null ? booking.getVehicle().getLicensePlate() : "phương tiện");
        String dateStr = formatDateVi(booking.getStartTime());
        String startTimeStr = formatTimeVi(booking.getStartTime());
        String endTimeStr = formatTimeVi(booking.getEndTime());

        // A. Notify CO_OWNER
        String coOwnerTitle = "ĐẶT LỊCH XE THÀNH CÔNG";
        String coOwnerMessage = String.format("Bạn đã đặt lịch sử dụng %s vào %s, từ %s đến %s.",
                vehicleName, dateStr, startTimeStr, endTimeStr);

        sendNotification(
                booking.getUser().getId(),
                booking.getVehicle().getId(),
                null,
                "BOOKING",
                booking.getId(),
                "BOOKING_CONFIRMED",
                coOwnerTitle,
                coOwnerMessage,
                "SUCCESS"
        );

        // B. Notify STAFF
        List<User> staffUsers = getAllStaffUsers();
        String staffTitle = "CÓ LỊCH BÀN GIAO XE MỚI";
        String staffMessage = String.format("%s có lịch sử dụng mới cần chuẩn bị bàn giao.", vehicleName);

        for (User staff : staffUsers) {
            sendNotification(
                    staff.getId(),
                    booking.getVehicle().getId(),
                    null,
                    "BOOKING",
                    booking.getId(),
                    "STAFF_NEW_BOOKING_PREPARATION",
                    staffTitle,
                    staffMessage,
                    "ACTION_REQUIRED"
            );
        }
    }

    // 6b. Booking Cancellation Notifications (Section 4)
    @Transactional
    public void notifyBookingCancelled(Booking booking) {
        if (booking == null) {
            return;
        }
        notifyBookingCancelled(booking.getId());
    }

    @Transactional
    public void notifyBookingCancelled(UUID bookingId) {
        if (bookingId == null || bookingRepository == null) {
            return;
        }

        Booking booking = bookingRepository.findByIdWithVehicleAndUser(bookingId)
                .orElseGet(() -> bookingRepository.findById(bookingId).orElse(null));
        if (booking == null || booking.getUser() == null || booking.getVehicle() == null) {
            return;
        }

        String vehicleName = booking.getVehicle().getName() != null
                ? booking.getVehicle().getName()
                : (booking.getVehicle().getLicensePlate() != null ? booking.getVehicle().getLicensePlate() : "phương tiện");
        String plate = booking.getVehicle().getLicensePlate() != null ? booking.getVehicle().getLicensePlate() : "";
        String bookingRef = booking.getId().toString().substring(0, 8).toUpperCase();
        String dateStr = formatDateVi(booking.getStartTime());
        String startTimeStr = formatTimeVi(booking.getStartTime());
        String endTimeStr = formatTimeVi(booking.getEndTime());
        String cancelTimeStr = formatTimeVi(Instant.now());
        String coOwnerName = booking.getUser().getFullName() != null ? booking.getUser().getFullName() : "Đồng sở hữu";

        // A. Notify Booking Owner (CO_OWNER)
        String coOwnerTitle = "Lịch đặt xe đã được hủy";
        String coOwnerMessage = String.format("Lịch đặt xe %s (%s, Mã: #%s) vào ngày %s (từ %s đến %s) đã được hủy thành công lúc %s.",
                vehicleName, plate, bookingRef, dateStr, startTimeStr, endTimeStr, cancelTimeStr);

        sendNotification(
                booking.getUser().getId(),
                booking.getVehicle().getId(),
                null,
                "BOOKING",
                booking.getId(),
                "BOOKING_CANCELLED",
                coOwnerTitle,
                coOwnerMessage,
                "INFO"
        );

        // B. Notify STAFF and ADMIN
        List<User> staffUsers = getAllStaffUsers();
        String staffTitle = "LỊCH ĐẶT XE ĐÃ HỦY";
        String staffMessage = String.format("Đồng sở hữu %s đã hủy lịch đặt xe %s (%s, Mã: #%s) khung giờ %s–%s ngày %s.",
                coOwnerName, vehicleName, plate, bookingRef, startTimeStr, endTimeStr, dateStr);

        for (User staff : staffUsers) {
            sendNotification(
                    staff.getId(),
                    booking.getVehicle().getId(),
                    null,
                    "BOOKING",
                    booking.getId(),
                    "STAFF_BOOKING_CANCELLED",
                    staffTitle,
                    staffMessage,
                    "INFO"
            );
        }
    }

    // 7. Staff Handover Completed Notification
    @Transactional
    public void notifyHandoverCompleted(VehicleHandover handover) {
        if (handover == null || handover.getCoOwner() == null || handover.getVehicle() == null) {
            return;
        }
        String vehicleName = handover.getVehicle().getName() != null
                ? handover.getVehicle().getName()
                : (handover.getVehicle().getLicensePlate() != null ? handover.getVehicle().getLicensePlate() : "phương tiện");
        Booking booking = handover.getBooking();
        String startTimeStr = (booking != null && booking.getStartTime() != null) ? formatTimeVi(booking.getStartTime()) : "--:--";
        String endTimeStr = (booking != null && booking.getEndTime() != null) ? formatTimeVi(booking.getEndTime()) : "--:--";
        String dateStr = (booking != null && booking.getStartTime() != null) ? formatDateVi(booking.getStartTime()) : "hôm nay";

        String title = "XE ĐÃ ĐƯỢC BÀN GIAO";
        String message = String.format("Nhân viên đã hoàn tất bàn giao %s cho lịch đặt %s–%s ngày %s.",
                vehicleName, startTimeStr, endTimeStr, dateStr);

        sendNotification(
                handover.getCoOwner().getId(),
                handover.getVehicle().getId(),
                null,
                "HANDOVER",
                handover.getId(),
                "STAFF_HANDOVER_COMPLETED",
                title,
                message,
                "SUCCESS"
        );
    }

    // 8. Trip Start Window Arrival Notification
    @Transactional
    public void notifyTripStartWindowOpened(Booking booking) {
        if (booking == null) {
            return;
        }
        notifyTripStartWindowOpened(booking.getId());
    }

    @Transactional
    public void notifyTripStartWindowOpened(UUID bookingId) {
        if (bookingId == null || bookingRepository == null) {
            return;
        }

        Booking booking = bookingRepository.findByIdWithVehicleAndUser(bookingId)
                .orElseGet(() -> bookingRepository.findById(bookingId).orElse(null));
        if (booking == null || booking.getUser() == null || booking.getVehicle() == null) {
            return;
        }

        // Deduplication check: prevent duplicate notifications for the same booking
        boolean alreadyNotified = notificationRepository
                .findFirstByRecipientIdAndEventTypeAndEntityId(
                        booking.getUser().getId(),
                        "TRIP_START_WINDOW_OPENED",
                        booking.getId()
                ).isPresent();

        if (alreadyNotified) {
            return;
        }

        String vehicleName = booking.getVehicle().getName() != null
                ? booking.getVehicle().getName()
                : (booking.getVehicle().getLicensePlate() != null ? booking.getVehicle().getLicensePlate() : "phương tiện");

        String title = "ĐÃ ĐẾN GIỜ SỬ DỤNG XE";
        String message = String.format("Bạn có thể bắt đầu chuyến đi với %s theo lịch đã đặt.", vehicleName);

        sendNotification(
                booking.getUser().getId(),
                booking.getVehicle().getId(),
                null,
                "TRIP",
                booking.getId(),
                "TRIP_START_WINDOW_OPENED",
                title,
                message,
                "ACTION_REQUIRED"
        );
    }

    // 9. Trip Started Notification
    @Transactional
    public void notifyTripStarted(Trip trip) {
        if (trip == null || trip.getUser() == null || trip.getVehicle() == null) {
            return;
        }
        String vehicleName = trip.getVehicle().getName() != null
                ? trip.getVehicle().getName()
                : (trip.getVehicle().getLicensePlate() != null ? trip.getVehicle().getLicensePlate() : "phương tiện");
        String startTimeStr = formatTimeVi(trip.getStartedAt());
        String bookingRef = trip.getBooking() != null ? String.valueOf(trip.getBooking().getId()).substring(0, 8) : "--";

        String title = "CHUYẾN ĐI ĐÃ BẮT ĐẦU";
        String message = String.format("Chuyến đi với xe %s (Mã đặt: #%s) đã bắt đầu lúc %s. Chúc bạn có một hành trình an toàn!",
                vehicleName, bookingRef, startTimeStr);

        sendNotification(
                trip.getUser().getId(),
                trip.getVehicle().getId(),
                null,
                "TRIP",
                trip.getId(),
                "TRIP_STARTED",
                title,
                message,
                "SUCCESS"
        );
    }

    // 10. Staff Vehicle Return Requested Notification
    @Transactional
    public void notifyStaffReturnRequested(Trip trip) {
        if (trip == null || trip.getVehicle() == null) {
            return;
        }
        String vehicleName = trip.getVehicle().getName() != null
                ? trip.getVehicle().getName()
                : "phương tiện";
        String plate = trip.getVehicle().getLicensePlate() != null
                ? trip.getVehicle().getLicensePlate()
                : "chưa có biển số";
        String coOwnerName = (trip.getUser() != null && trip.getUser().getFullName() != null)
                ? trip.getUser().getFullName()
                : "Đồng sở hữu";
        String reqTimeStr = formatTimeVi(trip.getReturnRequestedAt() != null ? trip.getReturnRequestedAt() : Instant.now());
        String bookingRef = trip.getBooking() != null ? String.valueOf(trip.getBooking().getId()).substring(0, 8) : "--";

        List<User> staffUsers = getAllStaffUsers();
        String title = "CÓ YÊU CẦU TRẢ XE";
        String message = String.format("Đồng sở hữu %s đã yêu cầu trả xe %s (%s, Mã đặt: #%s) lúc %s. Vui lòng tiếp nhận và kiểm tra xe.",
                coOwnerName, vehicleName, plate, bookingRef, reqTimeStr);

        for (User staff : staffUsers) {
            sendNotification(
                    staff.getId(),
                    trip.getVehicle().getId(),
                    null,
                    "TRIP",
                    trip.getId(),
                    "TRIP_RETURN_REQUESTED",
                    title,
                    message,
                    "ACTION_REQUIRED"
            );
        }
    }

    // 11. Staff Return Confirmed Notification
    @Transactional
    public void notifyTripReturnConfirmed(Trip trip, BigDecimal verifiedDistanceKm, BigDecimal expenseAmount) {
        if (trip == null || trip.getUser() == null || trip.getVehicle() == null) {
            return;
        }
        String vehicleName = trip.getVehicle().getName() != null
                ? trip.getVehicle().getName()
                : (trip.getVehicle().getLicensePlate() != null ? trip.getVehicle().getLicensePlate() : "phương tiện");
        String endTimeStr = formatTimeVi(trip.getEndedAt() != null ? trip.getEndedAt() : Instant.now());
        String distStr = (verifiedDistanceKm != null) ? verifiedDistanceKm.setScale(1, RoundingMode.HALF_UP).toPlainString() : "0.0";
        String startOdoStr = (trip.getStartOdometer() != null) ? trip.getStartOdometer().toPlainString() : "0";
        String endOdoStr = (trip.getEndOdometer() != null) ? trip.getEndOdometer().toPlainString() : startOdoStr;

        String title = "TRẢ XE THÀNH CÔNG";
        String message;
        if (expenseAmount != null && expenseAmount.compareTo(BigDecimal.ZERO) > 0) {
            String formattedCost = java.text.NumberFormat.getInstance(Locale.forLanguageTag("vi-VN")).format(expenseAmount);
            message = String.format("Chuyến đi với xe %s đã kết thúc lúc %s. Quãng đường di chuyển: %s km (Odo: %s -> %s km). Chi phí năng lượng đã hạch toán: %s VNĐ.",
                    vehicleName, endTimeStr, distStr, startOdoStr, endOdoStr, formattedCost);
        } else {
            message = String.format("Chuyến đi với xe %s đã kết thúc lúc %s. Quãng đường di chuyển: %s km (Odo: %s -> %s km).",
                    vehicleName, endTimeStr, distStr, startOdoStr, endOdoStr);
        }

        sendNotification(
                trip.getUser().getId(),
                trip.getVehicle().getId(),
                null,
                "TRIP",
                trip.getId(),
                "TRIP_RETURN_CONFIRMED",
                title,
                message,
                "SUCCESS"
        );
    }

    // 12. Trip Extension Negotiation Requested Notification (Section 9)
    @Transactional
    public void notifyCoOwnerExtensionRequested(com.evshare.trip.entity.TripExtensionRequest request) {
        if (request == null || request.getAffectedOwner() == null || request.getVehicle() == null) {
            return;
        }
        String vehicleName = request.getVehicle().getName() != null ? request.getVehicle().getName() : "phương tiện";
        String plate = request.getVehicle().getLicensePlate() != null ? request.getVehicle().getLicensePlate() : "";
        String requesterName = request.getRequester() != null && request.getRequester().getFullName() != null
                ? request.getRequester().getFullName()
                : "Thành viên đồng sở hữu";

        String title = "Yêu cầu nhường lịch sử dụng xe";
        String message = String.format("%s muốn gia hạn chuyến đi thêm %d phút cho xe %s (%s). Vui lòng xem xét và phản hồi.",
                requesterName, request.getAdditionalMinutes(), vehicleName, plate);

        sendNotification(
                request.getAffectedOwner().getId(),
                request.getVehicle().getId(),
                null,
                "TRIP",
                request.getId(),
                "TRIP_EXTENSION_REQUEST",
                title,
                message,
                "ACTION_REQUIRED"
        );
    }

    // 13. Trip Extension Approved Notification
    @Transactional
    public void notifyRequesterExtensionApproved(com.evshare.trip.entity.TripExtensionRequest request) {
        if (request == null || request.getRequester() == null) {
            return;
        }
        String approverName = request.getAffectedOwner() != null && request.getAffectedOwner().getFullName() != null
                ? request.getAffectedOwner().getFullName()
                : "Thành viên";
        String newDeadlineStr = formatTimeVi(request.getProposedEndTime());

        String title = "Yêu cầu nhường lịch được chấp nhận";
        String message = String.format("%s đã đồng ý nhường %d phút. Chuyến đi của bạn đã được gia hạn thành công đến %s.",
                approverName, request.getAdditionalMinutes(), newDeadlineStr);

        sendNotification(
                request.getRequester().getId(),
                request.getVehicle() != null ? request.getVehicle().getId() : null,
                null,
                "TRIP",
                request.getId(),
                "TRIP_EXTENSION_APPROVED",
                title,
                message,
                "SUCCESS"
        );
    }

    // 14. Trip Extension Rejected Notification
    @Transactional
    public void notifyRequesterExtensionRejected(com.evshare.trip.entity.TripExtensionRequest request) {
        if (request == null || request.getRequester() == null) {
            return;
        }
        String approverName = request.getAffectedOwner() != null && request.getAffectedOwner().getFullName() != null
                ? request.getAffectedOwner().getFullName()
                : "Thành viên";

        String title = "Yêu cầu nhường lịch bị từ chối";
        String message = String.format("%s đã từ chối yêu cầu nhường lịch sử dụng xe. Hạn trả xe giữ nguyên theo lịch ban đầu.",
                approverName);

        sendNotification(
                request.getRequester().getId(),
                request.getVehicle() != null ? request.getVehicle().getId() : null,
                null,
                "TRIP",
                request.getId(),
                "TRIP_EXTENSION_REJECTED",
                title,
                message,
                "WARNING"
        );
    }

    // 15. Staff Notification for Trip Extended (Section 15)
    @Transactional
    public void notifyStaffTripExtended(Trip trip, int additionalMinutes, Instant newEndTime) {
        if (trip == null || trip.getVehicle() == null) {
            return;
        }
        String vehicleName = trip.getVehicle().getName() != null ? trip.getVehicle().getName() : "phương tiện";
        String plate = trip.getVehicle().getLicensePlate() != null ? trip.getVehicle().getLicensePlate() : "";
        String coOwnerName = (trip.getUser() != null && trip.getUser().getFullName() != null)
                ? trip.getUser().getFullName()
                : "Đồng sở hữu";
        String newDeadlineStr = formatTimeVi(newEndTime);

        List<User> staffUsers = getAllStaffUsers();
        String title = "CHUYẾN ĐI ĐÃ GIA HẠN";
        String message = String.format("Đồng sở hữu %s đã gia hạn chuyến đi xe %s (%s) thêm %d phút. Hạn trả mới: %s.",
                coOwnerName, vehicleName, plate, additionalMinutes, newDeadlineStr);

        for (User staff : staffUsers) {
            sendNotification(
                    staff.getId(),
                    trip.getVehicle().getId(),
                    null,
                    "TRIP",
                    trip.getId(),
                    "TRIP_EXTENDED",
                    title,
                    message,
                    "INFO"
            );
        }
    }

    // 15. Charging Session Completed Notification
    @Transactional
    public void notifyChargingCompleted(
            com.evshare.charging.entity.ChargingSession session,
            BigDecimal storedKwh,
            BigDecimal chargingCost,
            BigDecimal avgCost
    ) {
        if (session == null || session.getVehicle() == null) {
            return;
        }

        String vehicleName = session.getVehicle().getName() != null
                ? session.getVehicle().getName()
                : (session.getVehicle().getLicensePlate() != null ? session.getVehicle().getLicensePlate() : "phương tiện");
        String finalSoc = session.getCurrentSocPercent() != null ? session.getCurrentSocPercent().setScale(0, RoundingMode.HALF_UP).toPlainString() : "--";
        String storedKwhStr = storedKwh != null ? storedKwh.setScale(1, RoundingMode.HALF_UP).toPlainString() : "0.0";
        String costFormatted = chargingCost != null
                ? java.text.NumberFormat.getInstance(Locale.forLanguageTag("vi-VN")).format(chargingCost)
                : "0";
        String avgCostFormatted = avgCost != null
                ? java.text.NumberFormat.getInstance(Locale.forLanguageTag("vi-VN")).format(avgCost)
                : "3.850";

        String title = "XE ĐÃ HOÀN TẤT SẠC PIN";
        String message = String.format("Xe %s đã hoàn tất sạc pin (%s%%). Điện năng lưu trữ: %s kWh (Chi phí sạc: %s đ). Giá điện bình quân trong pin: %s đ/kWh. Chi phí sẽ phân bổ khi xe được sử dụng.",
                vehicleName, finalSoc, storedKwhStr, costFormatted, avgCostFormatted);

        if (session.getStartedBy() != null) {
            sendNotification(
                    session.getStartedBy().getId(),
                    session.getVehicle().getId(),
                    null,
                    "CHARGING",
                    session.getId(),
                    "CHARGING_COMPLETED",
                    title,
                    message,
                    "SUCCESS"
            );
        }
    }

    // ==========================================
    // 16. Membership Invitation & Onboarding Notifications
    // ==========================================

    @Transactional
    public void notifyContributorConsentNeeded(
            UUID contributorUserId,
            UUID vehicleId,
            UUID invitationId,
            String vehicleName,
            String leaderName,
            BigDecimal percentage
    ) {
        String title = "YÊU CẦU XÁC NHẬN ĐÓNG GÓP CỔ PHẦN";
        String message = String.format(
                "Trưởng nhóm %s đã đề xuất bạn đóng góp %.2f%% tỷ lệ sở hữu xe %s để mời thành viên mới. Vui lòng xác nhận hoặc từ chối.",
                leaderName != null ? leaderName : "Trưởng nhóm",
                percentage != null ? percentage : BigDecimal.ZERO,
                vehicleName != null ? vehicleName : "xe"
        );

        sendNotification(
                contributorUserId,
                vehicleId,
                null,
                "OWNERSHIP",
                invitationId,
                "CONTRIBUTOR_CONSENT_NEEDED",
                title,
                message,
                "ACTION_REQUIRED"
        );
    }

    @Transactional
    public void notifyInviteeNewInvitation(
            UUID inviteeUserId,
            UUID vehicleId,
            UUID invitationId,
            String vehicleName,
            String groupName,
            BigDecimal percentage
    ) {
        notifyInviteeNewInvitation(
                inviteeUserId,
                vehicleId,
                invitationId,
                null,
                vehicleName,
                null,
                groupName,
                percentage,
                null
        );
    }

    @Transactional
    public void notifyInviteeNewInvitation(
            UUID inviteeUserId,
            UUID vehicleId,
            UUID invitationId,
            String leaderName,
            String vehicleName,
            String licensePlate,
            String groupName,
            BigDecimal percentage,
            Instant expiresAt
    ) {
        String title = "Lời mời tham gia nhóm đồng sở hữu";
        String expiryStr = expiresAt != null
                ? java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
                        .withZone(java.time.ZoneId.of("Asia/Ho_Chi_Minh"))
                        .format(expiresAt)
                : "Không thời hạn";

        String plateStr = (licensePlate != null && !licensePlate.isBlank()) ? " (Biển số: " + licensePlate + ")" : "";
        String leaderStr = (leaderName != null && !leaderName.isBlank()) ? leaderName : "Trưởng nhóm";
        String refIdStr = invitationId != null ? invitationId.toString().substring(0, 8).toUpperCase() : "N/A";

        String message = String.format(
                "Trưởng nhóm %s mời bạn tham gia nhóm đồng sở hữu \"%s\" cho xe %s%s với tỷ lệ sở hữu %.2f%%. Hạn phản hồi: %s. Mã lời mời: #%s.",
                leaderStr,
                groupName != null ? groupName : "Nhóm đồng sở hữu",
                vehicleName != null ? vehicleName : "xe điện",
                plateStr,
                percentage != null ? percentage : BigDecimal.ZERO,
                expiryStr,
                refIdStr
        );

        sendNotification(
                inviteeUserId,
                vehicleId,
                null,
                "INVITATION",
                invitationId,
                "MEMBERSHIP_INVITATION_RECEIVED",
                title,
                message,
                "ACTION_REQUIRED"
        );
    }

    @Transactional
    public void notifyLeaderContributorDeclined(
            UUID leaderUserId,
            UUID vehicleId,
            UUID invitationId,
            String contributorName
    ) {
        String title = "ĐỒNG SỞ HỮU TỪ CHỐI ĐÓNG GÓP";
        String message = String.format(
                "Thành viên %s đã từ chối đóng góp cổ phần cho lời mời thành viên mới. Lời mời đã được cập nhật hoặc hủy.",
                contributorName != null ? contributorName : "Một thành viên"
        );

        sendNotification(
                leaderUserId,
                vehicleId,
                null,
                "OWNERSHIP",
                invitationId,
                "CONTRIBUTOR_CONSENT_DECLINED",
                title,
                message,
                "WARNING"
        );
    }

    @Transactional
    public void notifyLeaderInviteeAccepted(
            UUID leaderUserId,
            UUID vehicleId,
            UUID invitationId,
            String inviteeName
    ) {
        String title = "LỜI MỜI ĐÃ ĐƯỢC CHẤP NHẬN";
        String message = String.format(
                "Người được mời %s đã chấp nhận tham gia nhóm đồng sở hữu. Phụ lục hợp đồng đã sẵn sàng để các bên ký số.",
                inviteeName != null ? inviteeName : "Người được mời"
        );

        sendNotification(
                leaderUserId,
                vehicleId,
                null,
                "OWNERSHIP",
                invitationId,
                "INVITATION_ACCEPTED",
                title,
                message,
                "SUCCESS"
        );
    }

    @Transactional
    public void notifyLeaderInviteeRejected(
            UUID leaderUserId,
            UUID vehicleId,
            UUID invitationId,
            String inviteeName,
            String reason
    ) {
        String title = "LỜI MỜI BỊ TỪ CHỐI";
        String message = String.format(
                "Người được mời %s đã từ chối lời mời gia nhập nhóm đồng sở hữu.%s",
                inviteeName != null ? inviteeName : "Người được mời",
                (reason != null && !reason.isBlank()) ? (" Lý do: " + reason) : ""
        );

        sendNotification(
                leaderUserId,
                vehicleId,
                null,
                "OWNERSHIP",
                invitationId,
                "INVITATION_REJECTED",
                title,
                message,
                "WARNING"
        );
    }

    @Transactional
    public void notifyContractSignatureRequired(
            UUID userId,
            UUID vehicleId,
            UUID invitationId,
            String vehicleName
    ) {
        String title = "YÊU CẦU KÝ PHỤ LỤC HỢP ĐỒNG ĐỒNG SỞ HỮU";
        String message = String.format(
                "Phụ lục hợp đồng tiếp nhận thành viên mới cho xe %s đã được tạo. Vui lòng kiểm tra và ký xác nhận điện tử.",
                vehicleName != null ? vehicleName : "xe"
        );

        sendNotification(
                userId,
                vehicleId,
                null,
                "OWNERSHIP",
                invitationId,
                "CONTRACT_SIGNATURE_REQUIRED",
                title,
                message,
                "ACTION_REQUIRED"
        );
    }

    @Transactional
    public void notifyMemberOnboarded(
            UUID memberUserId,
            UUID vehicleId,
            String vehicleName,
            String newMemberName,
            BigDecimal newMemberPercentage,
            String newLeaderName
    ) {
        String title = "CHÀO MỪNG ĐỒNG SỞ HỮU MỚI";
        String message = String.format(
                "Thành viên %s đã hoàn tất ký hợp đồng và chính thức sở hữu %.2f%% xe %s. Đại diện nhóm hiện tại: %s.",
                newMemberName != null ? newMemberName : "Thành viên mới",
                newMemberPercentage != null ? newMemberPercentage : BigDecimal.ZERO,
                vehicleName != null ? vehicleName : "xe",
                newLeaderName != null ? newLeaderName : "Đang cập nhật"
        );

        sendNotification(
                memberUserId,
                vehicleId,
                null,
                "OWNERSHIP",
                vehicleId,
                "MEMBER_ONBOARDED",
                title,
                message,
                "SUCCESS"
        );
    }

    // ==========================================
    // 17. Overdue Trip and Return Conflict Notifications
    // ==========================================

    @Transactional
    public void notifyDriverTripOverdue(
            UUID driverUserId,
            UUID vehicleId,
            UUID tripId,
            String vehicleName,
            long overdueMinutes
    ) {
        String eventType = "DRIVER_TRIP_OVERDUE";
        Optional<Notification> existing = notificationRepository
                .findFirstByRecipientIdAndEventTypeAndEntityId(driverUserId, eventType, tripId);
        if (existing.isPresent()) return;

        String title = "CẢNH BÁO QUÁ HẠN TRẢ XE";
        String message = String.format(
                "Chuyến đi với xe %s của bạn đã quá hạn kết thúc %d phút. Vui lòng di chuyển xe về bãi và thực hiện thủ tục trả xe sớm nhất để tránh ảnh hưởng đến các thành viên tiếp theo.",
                vehicleName != null ? vehicleName : "xe",
                overdueMinutes
        );

        sendNotification(
                driverUserId,
                vehicleId,
                null,
                "TRIP",
                tripId,
                eventType,
                title,
                message,
                "WARNING"
        );
    }

    @Transactional
    public void notifyAffectedBookingOwner(
            UUID affectedUserId,
            UUID vehicleId,
            UUID bookingId,
            String vehicleName,
            Instant scheduledStart
    ) {
        String eventType = "BOOKING_AFFECTED_BY_OVERDUE";
        Optional<Notification> existing = notificationRepository
                .findFirstByRecipientIdAndEventTypeAndEntityId(affectedUserId, eventType, bookingId);
        if (existing.isPresent()) return;

        String timeStr = scheduledStart != null
                ? java.time.format.DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy")
                        .withZone(java.time.ZoneId.of("Asia/Ho_Chi_Minh"))
                        .format(scheduledStart)
                : "sắp tới";

        String title = "THÔNG BÁO: CHUYẾN ĐI TRƯỚC ĐANG TRỄ HẠN";
        String message = String.format(
                "Phương tiện %s bạn đã đặt (lịch bắt đầu lúc %s) hiện đang bị thành viên trước trả trễ. Hệ thống đã bảo lưu lịch đặt và thông báo cho nhân viên vận hành để hỗ trợ bạn.",
                vehicleName != null ? vehicleName : "xe",
                timeStr
        );

        sendNotification(
                affectedUserId,
                vehicleId,
                null,
                "BOOKING",
                bookingId,
                eventType,
                title,
                message,
                "WARNING"
        );
    }

    @Transactional
    public void notifyStaffVehicleOverdue(
            UUID vehicleId,
            UUID tripId,
            String vehicleName,
            long overdueMinutes,
            int affectedCount
    ) {
        String eventType = "STAFF_TRIP_OVERDUE_ALERT";
        List<User> staffUsers = getAllStaffUsers();
        String title = "YÊU CẦU ĐIỀU PHỐI: PHƯƠNG TIỆN QUÁ HẠN TRẢ";
        String message = String.format(
                "Xe %s đã quá hạn trả %d phút. Có %d lịch đặt tiếp theo có thể bị ảnh hưởng. Vui lòng liên hệ tài xế và sẵn sàng phương án điều phối.",
                vehicleName != null ? vehicleName : "xe",
                overdueMinutes,
                affectedCount
        );

        for (User staff : staffUsers) {
            Optional<Notification> existing = notificationRepository
                    .findFirstByRecipientIdAndEventTypeAndEntityId(staff.getId(), eventType, tripId);
            if (existing.isEmpty()) {
                sendNotification(
                        staff.getId(),
                        vehicleId,
                        null,
                        "TRIP",
                        tripId,
                        eventType,
                        title,
                        message,
                        "ACTION_REQUIRED"
                );
            }
        }
    }
}

