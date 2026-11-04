package com.evshare.notification.service;

import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.common.exception.UnauthorizedException;
import com.evshare.notification.dto.NotificationResponse;
import com.evshare.notification.entity.Notification;
import com.evshare.notification.repository.NotificationRepository;
import com.evshare.ownership.entity.GroupMember;
import com.evshare.ownership.entity.GroupVehicle;
import com.evshare.ownership.entity.MemberStatus;
import com.evshare.ownership.repository.GroupMemberRepository;
import com.evshare.ownership.repository.GroupVehicleRepository;
import com.evshare.security.UserPrincipal;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import com.evshare.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final GroupVehicleRepository groupVehicleRepository;
    private final GroupMemberRepository groupMemberRepository;

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
                return existing;
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
        List<User> staffUsers = getAllStaffUsers();
        String title = "Đã gửi yêu cầu xác minh thanh toán";
        String message = String.format("Yêu cầu xác minh thanh toán số tiền %s đang chờ nhân viên kiểm tra (DEMO).", amountFormatted);

        for (User staff : staffUsers) {
            sendNotification(
                    staff.getId(),
                    null,
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
        String title = "Thanh toán đã được xác minh";
        String message = String.format("Thanh toán số tiền %s đã được nhân viên xác nhận hợp lệ (DEMO).", amountFormatted);

        sendNotification(
                recipientUserId,
                null,
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
}

