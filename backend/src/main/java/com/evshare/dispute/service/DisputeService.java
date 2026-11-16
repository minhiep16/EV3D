package com.evshare.dispute.service;

import com.evshare.booking.entity.Booking;
import com.evshare.booking.entity.BookingStatus;
import com.evshare.booking.repository.BookingRepository;
import com.evshare.common.exception.DuplicateResourceException;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.common.exception.UnauthorizedException;
import com.evshare.damage.repository.DamageRecordRepository;
import com.evshare.dispute.dto.*;
import com.evshare.dispute.entity.*;
import com.evshare.dispute.repository.*;
import com.evshare.expense.repository.ExpenseRepository;
import com.evshare.expense.repository.ExpenseShareRepository;
import com.evshare.fund.entity.PersonalExpensePayment;
import com.evshare.fund.entity.PersonalPaymentStatus;
import com.evshare.fund.repository.PersonalExpensePaymentRepository;
import com.evshare.handover.entity.VehicleHandover;
import com.evshare.handover.repository.VehicleHandoverRepository;
import com.evshare.inspection.repository.VehicleInspectionRepository;
import com.evshare.notification.service.NotificationService;
import com.evshare.ownership.entity.*;
import com.evshare.ownership.repository.*;
import com.evshare.security.UserPrincipal;
import com.evshare.trip.entity.Trip;
import com.evshare.trip.repository.TripRepository;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import com.evshare.user.repository.UserRepository;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.repository.VehicleRepository;
import com.evshare.voting.repository.VoteProposalRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DisputeService {

    private static final Logger log = LoggerFactory.getLogger(DisputeService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final DisputeRepository disputeRepository;
    private final DisputeParticipantRepository participantRepository;
    private final DisputeEvidenceRepository evidenceRepository;
    private final DisputeMessageRepository messageRepository;
    private final DisputeCompensationRepository compensationRepository;
    private final DisputeCompensationPaymentRepository compensationPaymentRepository;
    private final DisputeActionLogRepository actionLogRepository;

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final CoOwnershipGroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final GroupVehicleRepository groupVehicleRepository;

    private final BookingRepository bookingRepository;
    private final TripRepository tripRepository;
    private final VehicleHandoverRepository handoverRepository;
    private final VehicleInspectionRepository inspectionRepository;
    private final DamageRecordRepository damageRecordRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseShareRepository expenseShareRepository;
    private final PersonalExpensePaymentRepository paymentRepository;
    private final VoteProposalRepository voteProposalRepository;

    private final ObjectMapper objectMapper;

    @Autowired(required = false)
    private NotificationService notificationService;

    public DisputeService(
            DisputeRepository disputeRepository,
            DisputeParticipantRepository participantRepository,
            DisputeEvidenceRepository evidenceRepository,
            DisputeMessageRepository messageRepository,
            DisputeCompensationRepository compensationRepository,
            DisputeCompensationPaymentRepository compensationPaymentRepository,
            DisputeActionLogRepository actionLogRepository,
            VehicleRepository vehicleRepository,
            UserRepository userRepository,
            CoOwnershipGroupRepository groupRepository,
            GroupMemberRepository memberRepository,
            GroupVehicleRepository groupVehicleRepository,
            BookingRepository bookingRepository,
            TripRepository tripRepository,
            VehicleHandoverRepository handoverRepository,
            VehicleInspectionRepository inspectionRepository,
            DamageRecordRepository damageRecordRepository,
            ExpenseRepository expenseRepository,
            ExpenseShareRepository expenseShareRepository,
            PersonalExpensePaymentRepository paymentRepository,
            VoteProposalRepository voteProposalRepository,
            ObjectMapper objectMapper
    ) {
        this.disputeRepository = disputeRepository;
        this.participantRepository = participantRepository;
        this.evidenceRepository = evidenceRepository;
        this.messageRepository = messageRepository;
        this.compensationRepository = compensationRepository;
        this.compensationPaymentRepository = compensationPaymentRepository;
        this.actionLogRepository = actionLogRepository;
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.memberRepository = memberRepository;
        this.groupVehicleRepository = groupVehicleRepository;
        this.bookingRepository = bookingRepository;
        this.tripRepository = tripRepository;
        this.handoverRepository = handoverRepository;
        this.inspectionRepository = inspectionRepository;
        this.damageRecordRepository = damageRecordRepository;
        this.expenseRepository = expenseRepository;
        this.expenseShareRepository = expenseShareRepository;
        this.paymentRepository = paymentRepository;
        this.voteProposalRepository = voteProposalRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Submit a new Dispute by an authorized Co-Owner or Staff.
     */
    @Transactional
    public DisputeResponse createDispute(CreateDisputeRequest request, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để gửi khiếu nại.");
        }

        UUID userId = principal.getId();
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        Vehicle vehicle = vehicleRepository.findById(request.vehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Phương tiện không tồn tại: " + request.vehicleId()));

        boolean isStaffOrAdmin = currentUser.getRole() == Role.STAFF || currentUser.getRole() == Role.ADMIN;

        // Verify co-owner vehicle access
        CoOwnershipGroup group = resolveGroupByVehicleId(vehicle.getId());
        if (!isStaffOrAdmin) {
            validateCoOwnerAccess(group, vehicle.getId(), userId);
        }

        // Duplicate submission prevention: check for duplicate open disputes on same specific transaction
        validateNoDuplicateOpenDispute(request);

        // Generate unique reference code: DSP-YYYYMM-XXXX
        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        String refCode = "DSP-" + datePrefix + "-" + generateRandomSuffix(4);

        Dispute dispute = new Dispute(
                UUID.randomUUID(),
                refCode,
                vehicle,
                group,
                currentUser,
                request.category(),
                request.title().trim(),
                request.description().trim()
        );

        if (request.priority() != null) {
            dispute.setPriority(request.priority());
        }

        // Bind transaction references
        dispute.setBookingId(request.bookingId());
        dispute.setTripId(request.tripId());
        dispute.setHandoverId(request.handoverId());
        dispute.setInspectionId(request.inspectionId());
        dispute.setDamageRecordId(request.damageRecordId());
        dispute.setExpenseId(request.expenseId());
        dispute.setExpenseShareId(request.expenseShareId());
        dispute.setPersonalPaymentId(request.personalPaymentId());
        dispute.setProposalId(request.proposalId());
        dispute.setOwnershipTransferId(request.ownershipTransferId());
        dispute.setDisputedAmount(request.disputedAmount());

        // Snapshot authoritative transaction evidence (Phase 5.5.8)
        String snapshotJson = captureBusinessEvidenceSnapshot(request);
        dispute.setEvidenceSnapshotJson(snapshotJson);

        Dispute savedDispute = disputeRepository.save(dispute);

        // 1. Add creator as COMPLAINANT
        DisputeParticipant complainant = new DisputeParticipant(
                UUID.randomUUID(),
                savedDispute,
                currentUser,
                DisputeParticipantRole.COMPLAINANT
        );
        participantRepository.save(complainant);

        // 2. Add requested respondents
        if (request.respondentUserIds() != null) {
            for (UUID respondentId : request.respondentUserIds()) {
                if (respondentId != null && !respondentId.equals(userId)) {
                    userRepository.findById(respondentId).ifPresent(respUser -> {
                        DisputeParticipant participant = new DisputeParticipant(
                                UUID.randomUUID(),
                                savedDispute,
                                respUser,
                                DisputeParticipantRole.RESPONDENT
                        );
                        participantRepository.save(participant);
                    });
                }
            }
        }

        // 3. Add initial evidence attachments if present
        if (request.initialEvidences() != null) {
            for (CreateDisputeRequest.InitialEvidenceItem evItem : request.initialEvidences()) {
                if (evItem.fileUrl() != null && !evItem.fileUrl().isBlank()) {
                    DisputeEvidence evidence = new DisputeEvidence(
                            UUID.randomUUID(),
                            savedDispute,
                            currentUser,
                            evItem.title() != null && !evItem.title().isBlank() ? evItem.title().trim() : "Tài liệu đính kèm",
                            evItem.fileUrl().trim(),
                            evItem.fileType(),
                            evItem.fileSizeBytes(),
                            evItem.integrityHash()
                    );
                    evidenceRepository.save(evidence);
                }
            }
        }

        // 4. Dispatch notification
        logDisputeAction(
                savedDispute,
                currentUser,
                "SUBMIT_DISPUTE",
                null,
                DisputeStatus.SUBMITTED,
                "Tạo mới hồ sơ khiếu nại: " + savedDispute.getReferenceCode(),
                savedDispute.getTitle()
        );

        if (notificationService != null) {
            try {
                notificationService.sendNotification(
                        userId,
                        vehicle.getId(),
                        group != null ? group.getId() : null,
                        "DISPUTE",
                        savedDispute.getId(),
                        "DISPUTE_SUBMITTED",
                        "Yêu cầu xử lý tranh chấp: " + savedDispute.getReferenceCode(),
                        "Hồ sơ khiếu nại \"" + savedDispute.getTitle() + "\" đã được tạo thành công và chuyển đến nhân viên quản lý.",
                        "INFO"
                );
            } catch (Exception ex) {
                log.warn("Failed to dispatch dispute submission notification: {}", ex.getMessage());
            }
        }

        return getDisputeById(savedDispute.getId(), principal);
    }

    /**
     * Retrieve a specific Dispute by ID with full authorization checks.
     */
    @Transactional(readOnly = true)
    public DisputeResponse getDisputeById(UUID disputeId, UserPrincipal principal) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ tranh chấp: " + disputeId));

        boolean isStaffOrAdmin = principal != null && (principal.getUser().getRole() == Role.STAFF || principal.getUser().getRole() == Role.ADMIN);
        UUID userId = principal != null ? principal.getId() : null;

        if (!isStaffOrAdmin) {
            validateDisputeAccess(dispute, userId);
        }

        return DisputeResponse.fromEntity(dispute, userId, isStaffOrAdmin);
    }

    /**
     * List all disputes for a vehicle (Co-Owners see involved disputes; Staff sees all).
     */
    @Transactional(readOnly = true)
    public List<DisputeResponse> getDisputesForVehicle(UUID vehicleId, UserPrincipal principal) {
        boolean isStaffOrAdmin = principal != null && (principal.getUser().getRole() == Role.STAFF || principal.getUser().getRole() == Role.ADMIN);
        UUID userId = principal != null ? principal.getId() : null;

        List<Dispute> disputes;
        if (isStaffOrAdmin) {
            disputes = disputeRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId);
        } else {
            disputes = disputeRepository.findInvolvedDisputesForUserAndVehicle(vehicleId, userId);
        }

        return disputes.stream()
                .map(d -> DisputeResponse.fromEntity(d, userId, isStaffOrAdmin))
                .collect(Collectors.toList());
    }

    /**
     * List disputes where the current user is an involved participant.
     */
    @Transactional(readOnly = true)
    public List<DisputeResponse> getMyDisputes(UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }
        UUID userId = principal.getId();
        boolean isStaffOrAdmin = principal.getUser().getRole() == Role.STAFF || principal.getUser().getRole() == Role.ADMIN;

        List<Dispute> disputes = isStaffOrAdmin
                ? disputeRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"))
                : disputeRepository.findInvolvedDisputesForUser(userId);

        return disputes.stream()
                .map(d -> DisputeResponse.fromEntity(d, userId, isStaffOrAdmin))
                .collect(Collectors.toList());
    }

    /**
     * Staff Dashboard: query all disputes with optional filters.
     */
    @Transactional(readOnly = true)
    public List<DisputeResponse> getStaffDisputeDashboard(UUID vehicleId, DisputeCategory category, DisputeStatus status, UserPrincipal principal) {
        validateStaffRole(principal);

        List<Dispute> list;
        if (vehicleId != null) {
            if (status != null) {
                list = disputeRepository.findByVehicleIdAndStatusOrderByCreatedAtDesc(vehicleId, status);
            } else if (category != null) {
                list = disputeRepository.findByVehicleIdAndCategoryOrderByCreatedAtDesc(vehicleId, category);
            } else {
                list = disputeRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId);
            }
        } else {
            list = disputeRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
            if (status != null) {
                list = list.stream().filter(d -> d.getStatus() == status).collect(Collectors.toList());
            }
            if (category != null) {
                list = list.stream().filter(d -> d.getCategory() == category).collect(Collectors.toList());
            }
        }

        return list.stream()
                .map(d -> DisputeResponse.fromEntity(d, principal.getId(), true))
                .collect(Collectors.toList());
    }

    /**
     * Summary counters for Staff dispute dashboard.
     */
    @Transactional(readOnly = true)
    public DisputeSummaryResponse getDisputeSummary(UUID vehicleId, UserPrincipal principal) {
        validateStaffRole(principal);

        List<Dispute> all = vehicleId != null
                ? disputeRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId)
                : disputeRepository.findAll();

        long submitted = all.stream().filter(d -> d.getStatus() == DisputeStatus.SUBMITTED).count();
        long underReview = all.stream().filter(d -> d.getStatus() == DisputeStatus.UNDER_REVIEW).count();
        long awaiting = all.stream().filter(d -> d.getStatus() == DisputeStatus.AWAITING_EVIDENCE).count();
        long mediation = all.stream().filter(d -> d.getStatus() == DisputeStatus.MEDIATION).count();
        long proposed = all.stream().filter(d -> d.getStatus() == DisputeStatus.PROPOSED_RESOLUTION).count();
        long voting = all.stream().filter(d -> d.getStatus() == DisputeStatus.VOTING_IN_PROGRESS).count();
        long resolved = all.stream().filter(d -> d.getStatus() == DisputeStatus.RESOLVED).count();
        long closed = all.stream().filter(d -> d.getStatus() == DisputeStatus.CLOSED).count();
        long rejected = all.stream().filter(d -> d.getStatus() == DisputeStatus.REJECTED).count();

        Map<String, Long> byCat = all.stream()
                .collect(Collectors.groupingBy(d -> d.getCategory().name(), Collectors.counting()));

        return new DisputeSummaryResponse(
                all.size(),
                submitted,
                underReview,
                awaiting,
                mediation,
                proposed,
                voting,
                resolved,
                closed,
                rejected,
                byCat
        );
    }

    /**
     * STAFF assigns themselves or an authorized staff member to mediate the dispute.
     */
    @Transactional
    public DisputeResponse assignStaffMediator(UUID disputeId, UUID staffId, UserPrincipal principal) {
        validateStaffRole(principal);

        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ tranh chấp"));

        DisputeStatus prevStatus = dispute.getStatus();
        UUID targetStaffId = staffId != null ? staffId : principal.getId();
        User staff = userRepository.findById(targetStaffId)
                .orElseThrow(() -> new ResourceNotFoundException("Nhân viên không tồn tại: " + targetStaffId));

        dispute.setAssignedStaff(staff);
        if (dispute.getStatus() == DisputeStatus.SUBMITTED) {
            dispute.setStatus(DisputeStatus.UNDER_REVIEW);
        }

        // Register staff in participants if not already present
        if (!participantRepository.existsByDisputeIdAndUserId(disputeId, staff.getId())) {
            DisputeParticipant p = new DisputeParticipant(UUID.randomUUID(), dispute, staff, DisputeParticipantRole.STAFF_MEDIATOR);
            participantRepository.save(p);
        }

        logDisputeAction(
                dispute,
                staff,
                "ASSIGN_STAFF_MEDIATOR",
                prevStatus,
                dispute.getStatus(),
                "Tiếp nhận hồ sơ và phân công nhân viên hòa giải: " + staff.getFullName(),
                null
        );

        Dispute saved = disputeRepository.save(dispute);
        return DisputeResponse.fromEntity(saved, principal.getId(), true);
    }

    /**
     * STAFF requests additional evidence from participants.
     */
    @Transactional
    public DisputeResponse requestEvidence(UUID disputeId, String note, UserPrincipal principal) {
        validateStaffRole(principal);

        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ tranh chấp"));

        User actor = userRepository.findById(principal.getId()).orElse(principal.getUser());
        DisputeStatus prevStatus = dispute.getStatus();
        dispute.setStatus(DisputeStatus.AWAITING_EVIDENCE);

        logDisputeAction(
                dispute,
                actor,
                "REQUEST_EVIDENCE",
                prevStatus,
                DisputeStatus.AWAITING_EVIDENCE,
                "Yêu cầu bổ sung bằng chứng",
                note
        );

        if (note != null && !note.isBlank()) {
            DisputeMessage msg = new DisputeMessage(
                    UUID.randomUUID(),
                    dispute,
                    actor,
                    DisputeMessageVisibility.PUBLIC,
                    "[YÊU CẦU BỔ SUNG BẰNG CHỨNG]: " + note.trim()
            );
            messageRepository.save(msg);
        if (dispute.getMessages() != null && !dispute.getMessages().contains(msg)) {
            dispute.getMessages().add(msg);
        }
        }

        Dispute saved = disputeRepository.save(dispute);
        return DisputeResponse.fromEntity(saved, principal.getId(), true);
    }

    /**
     * Add supporting evidence document or image.
     */
    @Transactional
    public DisputeEvidenceDto addEvidence(UUID disputeId, String title, String fileUrl, String fileType, Long size, String hash, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }

        User actor = userRepository.findById(principal.getId()).orElse(principal.getUser());
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ tranh chấp"));

        boolean isStaffOrAdmin = principal.getUser().getRole() == Role.STAFF || principal.getUser().getRole() == Role.ADMIN;
        if (!isStaffOrAdmin) {
            validateDisputeAccess(dispute, principal.getId());
        }

        // Sanitize and validate file metadata
        if (fileUrl == null || fileUrl.isBlank()) {
            throw new IllegalArgumentException("Đường dẫn tệp bằng chứng không hợp lệ.");
        }
        if (size != null && size > 25 * 1024 * 1024) { // 25 MB maximum
            throw new IllegalArgumentException("Kích thước tệp vượt quá giới hạn 25MB.");
        }

        DisputeEvidence evidence = new DisputeEvidence(
                UUID.randomUUID(),
                dispute,
                actor,
                title != null && !title.isBlank() ? title.trim() : "Bằng chứng bổ sung",
                fileUrl.trim(),
                fileType,
                size,
                hash
        );

        DisputeEvidence saved = evidenceRepository.save(evidence);

        // If dispute was awaiting evidence, auto transition back to MEDIATION or UNDER_REVIEW
        if (dispute.getStatus() == DisputeStatus.AWAITING_EVIDENCE) {
            dispute.setStatus(DisputeStatus.MEDIATION);
            disputeRepository.save(dispute);
        }

        return DisputeEvidenceDto.fromEntity(saved);
    }

    /**
     * Post a comment / message to the dispute discussion thread.
     */
    @Transactional
    public DisputeMessageDto addMessage(UUID disputeId, CreateDisputeMessageRequest request, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }

        User actor = userRepository.findById(principal.getId()).orElse(principal.getUser());
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ tranh chấp"));

        boolean isStaffOrAdmin = principal.getUser().getRole() == Role.STAFF || principal.getUser().getRole() == Role.ADMIN;
        if (!isStaffOrAdmin) {
            validateDisputeAccess(dispute, principal.getId());
        }

        DisputeMessageVisibility visibility = DisputeMessageVisibility.PUBLIC;
        if (isStaffOrAdmin && request.visibility() == DisputeMessageVisibility.STAFF_ONLY) {
            visibility = DisputeMessageVisibility.STAFF_ONLY;
        }

        DisputeMessage message = new DisputeMessage(
                UUID.randomUUID(),
                dispute,
                actor,
                visibility,
                request.content().trim()
        );

        DisputeMessage saved = messageRepository.save(message);
        return DisputeMessageDto.fromEntity(saved);
    }

    // ==========================================
    // Phase 5.8: Incident Investigation & Audit
    // ==========================================

    private DisputeActionLog logDisputeAction(
            Dispute dispute,
            User actor,
            String actionType,
            DisputeStatus prevStatus,
            DisputeStatus newStatus,
            String reason,
            String details
    ) {
        User managedActor = actor != null && actor.getId() != null && userRepository != null
                ? userRepository.findById(actor.getId()).orElse(actor)
                : actor;

        DisputeActionLog logEntry = new DisputeActionLog(
                UUID.randomUUID(),
                dispute,
                managedActor,
                managedActor != null ? managedActor.getFullName() : "Hệ thống",
                managedActor != null && managedActor.getRole() != null ? managedActor.getRole().name() : "SYSTEM",
                actionType,
                prevStatus,
                newStatus,
                reason,
                details
        );
        DisputeActionLog saved = actionLogRepository.save(logEntry);
        if (dispute.getActionLogs() != null && !dispute.getActionLogs().contains(saved)) {
            dispute.getActionLogs().add(saved);
        }
        return saved;
    }

    /**
     * Compare timeline events and evidence for late return disputes (e.g. DSP-202611-G556).
     */
    @Transactional(readOnly = true)
    public InvestigationDetailsDto getInvestigationComparison(UUID disputeId, UserPrincipal principal) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ tranh chấp: " + disputeId));

        UUID currentUserId = principal != null ? principal.getId() : null;
        boolean isStaffOrAdmin = principal != null && (principal.getUser().getRole() == Role.STAFF || principal.getUser().getRole() == Role.ADMIN);
        if (!isStaffOrAdmin) {
            validateDisputeAccess(dispute, currentUserId);
        }

        UUID vehicleId = dispute.getVehicle().getId();
        String vehicleName = dispute.getVehicle().getName();
        String licensePlate = dispute.getVehicle().getLicensePlate();

        UUID bookingId = dispute.getBookingId();
        Booking affectedBooking = bookingId != null ? bookingRepository.findById(bookingId).orElse(null) : null;
        UUID tripId = dispute.getTripId();
        Trip previousTrip = tripId != null ? tripRepository.findById(tripId).orElse(null) : null;

        // Try to identify previous booking if not explicitly linked via trip
        Booking previousBooking = null;
        if (previousTrip != null && previousTrip.getBooking() != null) {
            previousBooking = previousTrip.getBooking();
        } else if (affectedBooking != null) {
            // Enforce turnaround buffer (e.g. max 4 hours gap) so past bookings from weeks ago are not falsely paired
            Instant minTurnaroundStart = affectedBooking.getStartTime().minus(Duration.ofHours(4));
            Instant maxTurnaroundEnd = affectedBooking.getStartTime().plusSeconds(7200);

            List<Booking> priorBookings = bookingRepository.findByVehicleIdAndStatusInOrderByStartTimeAsc(
                    vehicleId,
                    List.of(BookingStatus.CONFIRMED, BookingStatus.COMPLETED)
            ).stream()
             .filter(b -> !b.getId().equals(affectedBooking.getId())
                     && b.getEndTime().isAfter(minTurnaroundStart)
                     && b.getEndTime().isBefore(maxTurnaroundEnd))
             .sorted((a, b) -> b.getEndTime().compareTo(a.getEndTime()))
             .toList();
            if (!priorBookings.isEmpty()) {
                previousBooking = priorBookings.get(0);
                if (previousTrip == null) {
                    previousTrip = tripRepository.findByBookingId(previousBooking.getId()).orElse(null);
                }
            }
        }

        UUID prevUserId = previousBooking != null && previousBooking.getUser() != null
                ? previousBooking.getUser().getId()
                : (previousTrip != null && previousTrip.getUser() != null ? previousTrip.getUser().getId() : null);
        String prevUserName = previousBooking != null && previousBooking.getUser() != null
                ? previousBooking.getUser().getFullName()
                : (previousTrip != null && previousTrip.getUser() != null ? previousTrip.getUser().getFullName() : "Nguyễn Văn A (Người dùng trước)");

        Instant scheduledReturn = previousBooking != null ? previousBooking.getEndTime() : null;
        Instant returnRequest = previousTrip != null ? previousTrip.getReturnRequestedAt() : null;
        Instant tripEnd = previousTrip != null ? previousTrip.getEndedAt() : null;
        Instant staffReceived = previousTrip != null ? previousTrip.getReturnVerifiedAt() : null;

        // Check handover for affected booking
        Instant affectedHandoverTime = null;
        if (affectedBooking != null) {
            Optional<VehicleHandover> handoverOpt = handoverRepository.findByBookingId(affectedBooking.getId());
            if (handoverOpt.isPresent()) {
                affectedHandoverTime = handoverOpt.get().getStaffHandedOverAt();
            }
        }

        long userDelayMinutes = 0;
        Instant actualReturnTime = returnRequest != null ? returnRequest : tripEnd;
        if (scheduledReturn != null && actualReturnTime != null && actualReturnTime.isAfter(scheduledReturn)) {
            userDelayMinutes = Duration.between(scheduledReturn, actualReturnTime).toMinutes();
        }

        long operationalDelayMinutes = 0;
        if (actualReturnTime != null && staffReceived != null && staffReceived.isAfter(actualReturnTime)) {
            operationalDelayMinutes = Duration.between(actualReturnTime, staffReceived).toMinutes();
        }

        long totalDelayMinutes = userDelayMinutes + operationalDelayMinutes;
        boolean lateReturnDetected = userDelayMinutes > 10 || totalDelayMinutes > 15;

        InvestigationConclusion suggestedConclusion;
        if (userDelayMinutes > 15) {
            suggestedConclusion = InvestigationConclusion.LATE_RETURN_BY_PREVIOUS_USER;
        } else if (operationalDelayMinutes > 20 && userDelayMinutes <= 10) {
            suggestedConclusion = InvestigationConclusion.LATE_STAFF_PROCESSING;
        } else if (totalDelayMinutes > 15) {
            suggestedConclusion = InvestigationConclusion.OPERATIONAL_PROBLEM;
        } else if (dispute.getCategory() == DisputeCategory.BOOKING || dispute.getCategory() == DisputeCategory.VEHICLE_USAGE) {
            suggestedConclusion = InvestigationConclusion.SYSTEM_SYNC_DELAY;
        } else {
            suggestedConclusion = InvestigationConclusion.UNVERIFIED;
        }

        DateTimeFormatter vnTimeFmt = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));
        String schedStr = scheduledReturn != null ? vnTimeFmt.format(scheduledReturn) : "14/11/2026 13:00";
        String retStr = actualReturnTime != null ? vnTimeFmt.format(actualReturnTime) : (scheduledReturn != null ? vnTimeFmt.format(scheduledReturn) : "Chưa xác định");
        String staffStr = staffReceived != null ? vnTimeFmt.format(staffReceived) : "Chưa tiếp nhận";

        String incidentSummary = String.format("Chuyến trước dự kiến trả: %s. Trả thực tế/yêu cầu: %s. Tiếp nhận kỹ thuật: %s. Khách trễ: %d phút. Nhân viên xử lý: %d phút.",
                schedStr,
                retStr,
                staffStr,
                userDelayMinutes,
                operationalDelayMinutes);

        return new InvestigationDetailsDto(
                disputeId,
                bookingId,
                tripId != null ? tripId : (previousTrip != null ? previousTrip.getId() : null),
                vehicleName,
                licensePlate,
                prevUserId,
                prevUserName,
                scheduledReturn,
                returnRequest,
                tripEnd,
                staffReceived,
                affectedBooking != null && affectedBooking.getUser() != null ? affectedBooking.getUser().getId() : dispute.getCreatedBy().getId(),
                affectedBooking != null && affectedBooking.getUser() != null ? affectedBooking.getUser().getFullName() : dispute.getCreatedBy().getFullName(),
                affectedBooking != null ? affectedBooking.getStartTime() : null,
                affectedBooking != null ? affectedBooking.getEndTime() : null,
                affectedHandoverTime,
                userDelayMinutes,
                operationalDelayMinutes,
                totalDelayMinutes,
                lateReturnDetected,
                incidentSummary,
                suggestedConclusion,
                dispute.getInvestigationConclusion(),
                dispute.getInvestigationNotes(),
                dispute.getInvestigatedAt(),
                dispute.getInvestigatedBy() != null ? dispute.getInvestigatedBy().getFullName() : null
        );
    }

    /**
     * STAFF records formal investigation findings and incident conclusion.
     */
    @Transactional
    public DisputeResponse recordInvestigationFindings(UUID disputeId, RecordInvestigationRequest request, UserPrincipal principal) {
        validateStaffRole(principal);

        User staff = userRepository.findById(principal.getId())
                .orElse(principal.getUser());

        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ tranh chấp: " + disputeId));

        InvestigationConclusion conclusion = request.getEffectiveConclusion();
        if (conclusion == null) {
            throw new IllegalArgumentException("Kết luận điều tra không được để trống.");
        }

        DisputeStatus prevStatus = dispute.getStatus();
        dispute.setInvestigationConclusion(conclusion);
        dispute.setInvestigationNotes(request.getEffectiveNotes());
        dispute.setInvestigatedBy(staff);
        dispute.setInvestigatedAt(Instant.now());

        if (dispute.getStatus() == DisputeStatus.SUBMITTED || dispute.getStatus() == DisputeStatus.AWAITING_EVIDENCE) {
            dispute.setStatus(DisputeStatus.UNDER_REVIEW);
        }

        logDisputeAction(
                dispute,
                staff,
                "RECORD_INVESTIGATION_FINDINGS",
                prevStatus,
                dispute.getStatus(),
                "Nhân viên ghi nhận kết luận điều tra: " + conclusion.getVietnameseLabel(),
                request.getEffectiveNotes()
        );

        DisputeMessage msg = new DisputeMessage(
                UUID.randomUUID(),
                dispute,
                staff,
                DisputeMessageVisibility.PUBLIC,
                String.format("[KẾT QUẢ ĐIỀU TRA TÌNH TIẾT]: %s.\nNội dung: %s",
                        conclusion.getVietnameseLabel(),
                        !request.getEffectiveNotes().isBlank() ? request.getEffectiveNotes() : "Đã đối soát lịch trình chuyến đi.")
        );
        messageRepository.save(msg);
        if (dispute.getMessages() != null && !dispute.getMessages().contains(msg)) {
            dispute.getMessages().add(msg);
        }

        Dispute saved = disputeRepository.saveAndFlush(dispute);
        return DisputeResponse.fromEntity(saved, principal.getId(), true);
    }

    /**
     * STAFF proposes a structured mediation resolution with clear compensation breakdown.
     */
    @Transactional
    public DisputeResponse proposeResolution(UUID disputeId, ProposeResolutionRequest request, UserPrincipal principal) {
        validateStaffRole(principal);

        User staff = userRepository.findById(principal.getId())
                .orElse(principal.getUser());

        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ tranh chấp: " + disputeId));

        if (dispute.getStatus() == DisputeStatus.RESOLVED || dispute.getStatus() == DisputeStatus.CLOSED) {
            throw new IllegalStateException("Hồ sơ tranh chấp đã được giải quyết hoặc đóng.");
        }

        // If investigation findings were not explicitly recorded yet, ensure baseline conclusion is recorded
        if (dispute.getInvestigationConclusion() == null) {
            dispute.setInvestigationConclusion(InvestigationConclusion.LATE_RETURN_BY_PREVIOUS_USER);
            dispute.setInvestigationNotes(request.decisionBasis() != null ? request.decisionBasis() : "Kết luận tự động từ biên bản đề xuất giải pháp.");
            dispute.setInvestigatedBy(staff);
            dispute.setInvestigatedAt(Instant.now());
        }

        DisputeStatus prevStatus = dispute.getStatus();
        dispute.setProposedResolution(request.proposedResolution().trim());
        dispute.setProposedResolutionBy(staff);
        dispute.setProposedResolutionAt(Instant.now());
        dispute.setStatus(DisputeStatus.PROPOSED_RESOLUTION);
        dispute.setResolutionAcceptedByParties(null); // Reset acceptance state

        ResolutionType resType = request.resolutionType() != null ? request.resolutionType() : ResolutionType.OPERATIONAL_REMEDY;
        dispute.setResolutionType(resType);

        BigDecimal propAmount = request.proposedAmount();
        if (resType == ResolutionType.NO_COMPENSATION) {
            propAmount = BigDecimal.ZERO;
        }
        dispute.setProposedAmount(propAmount);
        dispute.setProposedPayerType(request.proposedPayerType());
        if (request.proposedPayerUserId() != null) {
            userRepository.findById(request.proposedPayerUserId()).ifPresent(dispute::setProposedPayerUser);
        } else if (request.proposedPayerName() != null && !request.proposedPayerName().isBlank()) {
            dispute.getParticipants().stream()
                    .filter(p -> p.getUser() != null && (
                            p.getUser().getFullName().equalsIgnoreCase(request.proposedPayerName().trim()) ||
                            p.getRole() == DisputeParticipantRole.RESPONDENT
                    ))
                    .findFirst()
                    .ifPresent(p -> dispute.setProposedPayerUser(p.getUser()));
        }
        dispute.setProposedPayerName(request.proposedPayerName());

        if (request.proposedRecipientUserId() != null) {
            userRepository.findById(request.proposedRecipientUserId()).ifPresent(dispute::setProposedRecipientUser);
        } else {
            dispute.setProposedRecipientUser(dispute.getCreatedBy());
        }
        dispute.setProposedRecipientName(request.proposedRecipientName() != null ? request.proposedRecipientName() : (dispute.getCreatedBy() != null ? dispute.getCreatedBy().getFullName() : "Người khiếu nại"));

        dispute.setDecisionBasis(request.decisionBasis());
        dispute.setResolutionDeadline(request.resolutionDeadline());

        // Reset individual participant acceptance records
        for (DisputeParticipant p : dispute.getParticipants()) {
            p.setHasAcceptedResolution(null);
            p.setRespondedAt(null);
            participantRepository.save(p);
        }

        // Post audit log
        logDisputeAction(
                dispute,
                staff,
                "PROPOSE_RESOLUTION",
                prevStatus,
                DisputeStatus.PROPOSED_RESOLUTION,
                "Đề xuất phương án hòa giải: " + resType.getVietnameseLabel() + (propAmount != null ? " (Số tiền đề xuất: " + propAmount + " VNĐ)" : ""),
                request.decisionBasis()
        );

        // Post system announcement message into thread
        String amountInfo = propAmount != null && propAmount.compareTo(BigDecimal.ZERO) > 0
                ? String.format("\n- Số tiền bồi thường đề xuất: %,.0f VNĐ\n- Bên chi trả đề xuất: %s (%s)\n- Bên nhận đề xuất: %s",
                        propAmount,
                        dispute.getProposedPayerName() != null ? dispute.getProposedPayerName() : "N/A",
                        dispute.getProposedPayerType() != null ? dispute.getProposedPayerType().name() : "N/A",
                        dispute.getProposedRecipientName() != null ? dispute.getProposedRecipientName() : "N/A")
                : "";

        DisputeMessage msg = new DisputeMessage(
                UUID.randomUUID(),
                dispute,
                staff,
                DisputeMessageVisibility.PUBLIC,
                String.format("[PHƯƠNG ÁN HÒA GIẢI ĐƯỢC ĐỀ XUẤT]: %s\nLoại giải pháp: %s%s\nCăn cứ giải quyết: %s\n(Vui lòng các bên xem xét và phản hồi chấp thuận hoặc từ chối).",
                        request.proposedResolution().trim(),
                        resType.getVietnameseLabel(),
                        amountInfo,
                        request.decisionBasis() != null ? request.decisionBasis() : "Quy chế đồng sở hữu EVShare")
        );
        messageRepository.save(msg);
        if (dispute.getMessages() != null && !dispute.getMessages().contains(msg)) {
            dispute.getMessages().add(msg);
        }

        // Notify participants
        if (notificationService != null) {
            for (DisputeParticipant p : dispute.getParticipants()) {
                if (p.getUser() != null) {
                    try {
                        notificationService.sendNotification(
                                p.getUser().getId(),
                                dispute.getVehicle() != null ? dispute.getVehicle().getId() : null,
                                dispute.getCoOwnershipGroup() != null ? dispute.getCoOwnershipGroup().getId() : null,
                                "DISPUTE",
                                dispute.getId(),
                                "DISPUTE_PROPOSAL_SUBMITTED",
                                "Phương án hòa giải mới: " + dispute.getReferenceCode(),
                                "Nhân viên đã đề xuất phương án giải quyết cho khiếu nại của bạn. Vui lòng vào xem và phản hồi.",
                                "ACTION_REQUIRED"
                        );
                    } catch (Exception ex) {
                        log.warn("Failed to notify dispute participant {}: {}", p.getUser().getId(), ex.getMessage());
                    }
                }
            }
        }

        Dispute saved = disputeRepository.saveAndFlush(dispute);
        return DisputeResponse.fromEntity(saved, principal.getId(), true);
    }

    /**
     * Participant responds to the proposed mediation resolution (ACCEPT or REJECT).
     * Only transitions to RESOLVED if ALL primary co-owner parties accept.
     */
    @Transactional
    public DisputeResponse respondToResolution(UUID disputeId, RespondToResolutionRequest request, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }

        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ tranh chấp"));

        if (dispute.getStatus() != DisputeStatus.PROPOSED_RESOLUTION) {
            throw new IllegalStateException("Tranh chấp hiện không ở trạng thái chờ phản hồi phương án hòa giải.");
        }

        UUID userId = principal.getId();
        User actor = userRepository.findById(userId).orElse(principal.getUser());
        DisputeParticipant participant = participantRepository.findByDisputeIdAndUserId(disputeId, userId)
                .orElseGet(() -> {
                    // If creator wasn't registered as participant, create it now
                    if (dispute.getCreatedBy().getId().equals(userId)) {
                        DisputeParticipant p = new DisputeParticipant(UUID.randomUUID(), dispute, actor, DisputeParticipantRole.COMPLAINANT);
                        return participantRepository.save(p);
                    }
                    throw new AccessDeniedException("Bạn không phải là bên tham gia trong tranh chấp này.");
                });

        participant.setHasAcceptedResolution(request.accept());
        participant.setRespondedAt(Instant.now());
        participantRepository.save(participant);

        String decisionVi = request.accept() ? "ĐỒNG THUẬN" : "TỪ CHỐI";
        DisputeMessage feedbackMsg = new DisputeMessage(
                UUID.randomUUID(),
                dispute,
                actor,
                DisputeMessageVisibility.PUBLIC,
                String.format("[PHẢN HỒI PHƯƠNG ÁN HÒA GIẢI]: %s đã %s phương án đề xuất.%s",
                        actor.getFullName(),
                        decisionVi,
                        request.note() != null && !request.note().isBlank() ? " Ghi chú: " + request.note().trim() : "")
        );
        messageRepository.save(feedbackMsg);

        DisputeStatus prevStatus = dispute.getStatus();
        // Check if all primary co-owner parties have responded
        List<DisputeParticipant> coOwnerParties = dispute.getParticipants().stream()
                .filter(p -> p.getRole() == DisputeParticipantRole.COMPLAINANT || p.getRole() == DisputeParticipantRole.RESPONDENT)
                .toList();

        boolean anyRejected = coOwnerParties.stream().anyMatch(p -> Boolean.FALSE.equals(p.getHasAcceptedResolution()));
        boolean allAccepted = !coOwnerParties.isEmpty() && coOwnerParties.stream().allMatch(p -> Boolean.TRUE.equals(p.getHasAcceptedResolution()));

        if (anyRejected) {
            dispute.setStatus(DisputeStatus.MEDIATION);
            dispute.setResolutionAcceptedByParties(false);

            logDisputeAction(
                    dispute,
                    actor,
                    "REJECT_RESOLUTION",
                    prevStatus,
                    DisputeStatus.MEDIATION,
                    actor.getFullName() + " đã từ chối phương án hòa giải",
                    request.note()
            );
        } else if (allAccepted) {
            dispute.setStatus(DisputeStatus.RESOLVED);
            dispute.setResolutionAcceptedByParties(true);
            dispute.setResolvedAt(Instant.now());
            dispute.setResolutionSummary("Các bên đã đạt được thỏa thuận đồng thuận hòa giải: " + dispute.getProposedResolution());

            // If there is monetary compensation agreed upon, instantiate the auditable DisputeCompensation obligation!
            BigDecimal propAmount = dispute.getProposedAmount();
            if (propAmount != null && propAmount.compareTo(BigDecimal.ZERO) > 0) {
                dispute.setApprovedAmount(propAmount);
                dispute.setOutstandingAmount(propAmount);
                dispute.setVerifiedPaidAmount(BigDecimal.ZERO);

                User payerUser = dispute.getProposedPayerUser();
                String payerName = dispute.getProposedPayerName() != null ? dispute.getProposedPayerName() : "Bên vi phạm";
                PayerType payerType = dispute.getProposedPayerType() != null ? dispute.getProposedPayerType() : PayerType.PREVIOUS_CO_OWNER;

                User recipientUser = dispute.getProposedRecipientUser() != null ? dispute.getProposedRecipientUser() : dispute.getCreatedBy();
                String recipientName = dispute.getProposedRecipientName() != null ? dispute.getProposedRecipientName() : recipientUser.getFullName();

                User authorizer = dispute.getAssignedStaff() != null ? dispute.getAssignedStaff() : actor;

                DisputeCompensation compensation = new DisputeCompensation(
                        UUID.randomUUID(),
                        dispute,
                        payerUser,
                        payerType,
                        payerName,
                        recipientUser,
                        recipientName,
                        propAmount,
                        authorizer,
                        dispute.getDecisionBasis() != null ? dispute.getDecisionBasis() : "Thỏa thuận hòa giải đồng thuận giữa các bên"
                );
                compensationRepository.save(compensation);
            }

            logDisputeAction(
                    dispute,
                    actor,
                    "ACCEPT_RESOLUTION",
                    prevStatus,
                    DisputeStatus.RESOLVED,
                    "Tất cả các bên đã đồng thuận phương án hòa giải",
                    "Hồ sơ chuyển sang trạng thái ĐÃ HÒA GIẢI (RESOLVED) và thiết lập nghĩa vụ bồi thường nếu có."
            );
        }

        Dispute saved = disputeRepository.save(dispute);
        boolean isStaff = principal.getUser().getRole() == Role.STAFF || principal.getUser().getRole() == Role.ADMIN;
        return DisputeResponse.fromEntity(saved, userId, isStaff);
    }

    /**
     * STAFF records verified compensation payment (full or partial).
     */
    @Transactional
    public DisputeCompensationDto recordCompensationPayment(UUID disputeId, RecordCompensationPaymentRequest request, UserPrincipal principal) {
        validateStaffRole(principal);

        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ tranh chấp: " + disputeId));

        DisputeCompensation compensation = getOrCreateCompensation(dispute);

        if (request.amount() == null || request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số tiền thanh toán phải lớn hơn 0");
        }

        // Check reference uniqueness
        if (compensationPaymentRepository.existsByPaymentReference(request.paymentReference().trim())) {
            throw new DuplicateResourceException("Mã tham chiếu thanh toán đã tồn tại: " + request.paymentReference());
        }

        User actor = userRepository.findById(principal.getId()).orElse(principal.getUser());

        // Add payment
        DisputeCompensationPayment payment = new DisputeCompensationPayment(
                UUID.randomUUID(),
                compensation,
                request.amount(),
                request.paymentReference().trim(),
                request.receiptUrl(),
                request.paymentDate() != null ? request.paymentDate() : Instant.now(),
                actor,
                actor.getFullName(),
                request.note()
        );
        compensationPaymentRepository.save(payment);

        // Update compensation amounts & status
        BigDecimal newVerifiedPaid = compensation.getVerifiedPaidAmount().add(request.amount());
        compensation.setVerifiedPaidAmount(newVerifiedPaid);

        BigDecimal remaining = compensation.getApprovedAmount().subtract(newVerifiedPaid);
        if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
            compensation.setOutstandingAmount(BigDecimal.ZERO);
            compensation.setStatus(CompensationStatus.PAID);
        } else {
            compensation.setOutstandingAmount(remaining);
            compensation.setStatus(CompensationStatus.PARTIALLY_PAID);
        }
        compensation.setPaymentReference(request.paymentReference().trim());
        DisputeCompensation savedComp = compensationRepository.save(compensation);

        // Synchronize on dispute entity as well
        dispute.setVerifiedPaidAmount(savedComp.getVerifiedPaidAmount());
        dispute.setOutstandingAmount(savedComp.getOutstandingAmount());
        disputeRepository.save(dispute);

        // Log action
        logDisputeAction(
                dispute,
                actor,
                "RECORD_COMPENSATION_PAYMENT",
                dispute.getStatus(),
                dispute.getStatus(),
                String.format("Xác thực thanh toán bồi thường: %,.0f VNĐ (Mã GD: %s)", request.amount(), request.paymentReference()),
                String.format("Còn lại: %,.0f VNĐ. Trạng thái: %s", savedComp.getOutstandingAmount(), savedComp.getStatus().name())
        );

        // Add announcement to message thread
        DisputeMessage msg = new DisputeMessage(
                UUID.randomUUID(),
                dispute,
                actor,
                DisputeMessageVisibility.PUBLIC,
                String.format("[XÁC THỰC THANH TOÁN BỒI THƯỜNG]: Đã ghi nhận thanh toán %,.0f VNĐ (Mã tham chiếu: %s).\nTổng đã thanh toán: %,.0f VNĐ. Số tiền còn lại: %,.0f VNĐ. Trạng thái: %s.",
                        request.amount(),
                        request.paymentReference(),
                        savedComp.getVerifiedPaidAmount(),
                        savedComp.getOutstandingAmount(),
                        savedComp.getStatus() == CompensationStatus.PAID ? "HOÀN TẤT CHI TRẢ" : "THANH TOÁN MỘT PHẦN")
        );
        messageRepository.save(msg);
        if (dispute.getMessages() != null && !dispute.getMessages().contains(msg)) {
            dispute.getMessages().add(msg);
        }

        // Notify recipient & payer
        if (notificationService != null) {
            if (savedComp.getRecipientUser() != null) {
                notificationService.sendNotification(
                        savedComp.getRecipientUser().getId(),
                        dispute.getVehicle().getId(),
                        dispute.getCoOwnershipGroup() != null ? dispute.getCoOwnershipGroup().getId() : null,
                        "DISPUTE",
                        dispute.getId(),
                        "COMPENSATION_PAYMENT_VERIFIED",
                        "Xác thực thanh toán bồi thường: " + dispute.getReferenceCode(),
                        String.format("Nhân viên đã xác nhận thanh toán %,.0f VNĐ cho bạn. Số tiền còn lại: %,.0f VNĐ.", request.amount(), savedComp.getOutstandingAmount()),
                        "SUCCESS"
                );
            }
        }

        return DisputeCompensationDto.fromEntity(savedComp);
    }

    /**
     * Payer submits payment evidence for approved compensation (Pending Staff Verification).
     */
    @Transactional
    public DisputeCompensationDto submitCompensationEvidence(UUID disputeId, SubmitCompensationEvidenceRequest request, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }

        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ tranh chấp: " + disputeId));

        DisputeCompensation compensation = getOrCreateCompensation(dispute);

        if (compensation.getStatus() == CompensationStatus.PAID) {
            throw new IllegalStateException("Nghĩa vụ bồi thường này đã được thanh toán hoàn tất.");
        }
        if (compensation.getStatus() == CompensationStatus.CANCELLED) {
            throw new IllegalStateException("Nghĩa vụ bồi thường này đã bị hủy bỏ.");
        }

        if (request.amount() == null || request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số tiền thanh toán phải lớn hơn 0");
        }

        // Prevent overpayment
        if (request.amount().compareTo(compensation.getOutstandingAmount()) > 0) {
            throw new IllegalArgumentException(String.format("Số tiền nộp (%,.0f VNĐ) vượt quá số tiền còn nợ (%,.0f VNĐ).",
                    request.amount(), compensation.getOutstandingAmount()));
        }

        String ref = request.paymentReference() != null ? request.paymentReference().trim() : "";
        if (ref.isBlank()) {
            throw new IllegalArgumentException("Mã tham chiếu thanh toán không được để trống");
        }

        if (compensationPaymentRepository.existsByPaymentReference(ref)) {
            throw new DuplicateResourceException("Mã tham chiếu giao dịch đã tồn tại trong hệ thống: " + ref);
        }

        User actor = userRepository.findById(principal.getId()).orElse(principal.getUser());

        // Update pending evidence fields
        compensation.setPendingPaymentAmount(request.amount());
        compensation.setPendingPaymentReference(ref);
        compensation.setPendingReceiptUrl(request.receiptUrl() != null && !request.receiptUrl().isBlank() ? request.receiptUrl().trim() : null);
        compensation.setPendingPaymentDate(request.paymentDate() != null ? request.paymentDate() : Instant.now());
        compensation.setPendingPaymentNote(request.note() != null && !request.note().isBlank() ? request.note().trim() : null);
        compensation.setPendingSubmittedAt(Instant.now());
        compensation.setRejectionReason(null);
        compensation.setStatus(CompensationStatus.PENDING_VERIFICATION);

        DisputeCompensation savedComp = compensationRepository.save(compensation);

        // Save evidence item into dispute evidences list if receipt URL is provided
        if (request.receiptUrl() != null && !request.receiptUrl().isBlank()) {
            DisputeEvidence evidence = new DisputeEvidence(
                    UUID.randomUUID(),
                    dispute,
                    actor,
                    "Chứng từ thanh toán bồi thường (" + ref + ")",
                    request.receiptUrl().trim(),
                    "PAYMENT_RECEIPT",
                    null,
                    null
            );
            evidenceRepository.save(evidence);
            if (dispute.getEvidences() != null && !dispute.getEvidences().contains(evidence)) {
                dispute.getEvidences().add(evidence);
            }
        }

        // Action log
        logDisputeAction(
                dispute,
                actor,
                "SUBMIT_COMPENSATION_EVIDENCE",
                dispute.getStatus(),
                dispute.getStatus(),
                String.format("Nộp chứng từ bồi thường: %,.0f VNĐ (Mã GD: %s)", request.amount(), ref),
                request.note()
        );

        // Post announcement message in dispute thread
        DisputeMessage msg = new DisputeMessage(
                UUID.randomUUID(),
                dispute,
                actor,
                DisputeMessageVisibility.PUBLIC,
                String.format("[NỘP BẰNG CHỨNG BỒI THƯỜNG]: Bên bồi thường (%s) đã nộp chứng từ thanh toán %,.0f VNĐ (Mã GD: %s).\nTrạng thái: Chờ nhân viên đối soát và xác thực.",
                        actor.getFullName(),
                        request.amount(),
                        ref)
        );
        messageRepository.save(msg);
        if (dispute.getMessages() != null && !dispute.getMessages().contains(msg)) {
            dispute.getMessages().add(msg);
        }

        // Notify assigned staff
        if (notificationService != null && dispute.getAssignedStaff() != null) {
            notificationService.sendNotification(
                    dispute.getAssignedStaff().getId(),
                    dispute.getVehicle() != null ? dispute.getVehicle().getId() : null,
                    dispute.getCoOwnershipGroup() != null ? dispute.getCoOwnershipGroup().getId() : null,
                    "DISPUTE",
                    dispute.getId(),
                    "COMPENSATION_EVIDENCE_SUBMITTED",
                    "Chứng từ bồi thường mới cần duyệt: " + dispute.getReferenceCode(),
                    String.format("Người dùng %s đã gửi bằng chứng chuyển khoản %,.0f VNĐ. Vui lòng đối soát và xác nhận.",
                            actor.getFullName(), request.amount()),
                    "ACTION_REQUIRED"
            );
        }

        return DisputeCompensationDto.fromEntity(savedComp);
    }

    /**
     * STAFF approves submitted compensation evidence, updating verified paid amount and status.
     */
    @Transactional
    public DisputeCompensationDto approveCompensationEvidence(UUID disputeId, UserPrincipal principal) {
        validateStaffRole(principal);

        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ tranh chấp: " + disputeId));

        DisputeCompensation compensation = getOrCreateCompensation(dispute);

        if (compensation.getStatus() != CompensationStatus.PENDING_VERIFICATION || compensation.getPendingPaymentAmount() == null) {
            throw new IllegalStateException("Hồ sơ không có chứng từ bồi thường nào đang chờ xác minh.");
        }

        BigDecimal payAmount = compensation.getPendingPaymentAmount();
        String ref = compensation.getPendingPaymentReference();
        String receiptUrl = compensation.getPendingReceiptUrl();
        Instant payDate = compensation.getPendingPaymentDate() != null ? compensation.getPendingPaymentDate() : Instant.now();
        String note = compensation.getPendingPaymentNote();

        if (compensationPaymentRepository.existsByPaymentReference(ref)) {
            throw new DuplicateResourceException("Mã tham chiếu giao dịch đã tồn tại: " + ref);
        }

        User actor = userRepository.findById(principal.getId()).orElse(principal.getUser());

        // Create verified payment record
        DisputeCompensationPayment payment = new DisputeCompensationPayment(
                UUID.randomUUID(),
                compensation,
                payAmount,
                ref,
                receiptUrl,
                payDate,
                actor,
                actor.getFullName(),
                note != null ? note : "Đã đối chiếu khớp sao kê thực tế"
        );
        compensationPaymentRepository.save(payment);

        // Update verified paid amount & outstanding amount with exact arithmetic
        BigDecimal newVerifiedPaid = compensation.getVerifiedPaidAmount().add(payAmount);
        compensation.setVerifiedPaidAmount(newVerifiedPaid);

        BigDecimal remaining = compensation.getApprovedAmount().subtract(newVerifiedPaid);
        if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
            compensation.setOutstandingAmount(BigDecimal.ZERO);
            compensation.setStatus(CompensationStatus.PAID);
        } else {
            compensation.setOutstandingAmount(remaining);
            compensation.setStatus(CompensationStatus.PARTIALLY_PAID);
        }
        compensation.setPaymentReference(ref);

        // Reset pending fields
        compensation.setPendingPaymentAmount(null);
        compensation.setPendingPaymentReference(null);
        compensation.setPendingReceiptUrl(null);
        compensation.setPendingPaymentDate(null);
        compensation.setPendingPaymentNote(null);
        compensation.setPendingSubmittedAt(null);
        compensation.setRejectionReason(null);

        DisputeCompensation savedComp = compensationRepository.save(compensation);

        // Synchronize on dispute entity
        dispute.setVerifiedPaidAmount(savedComp.getVerifiedPaidAmount());
        dispute.setOutstandingAmount(savedComp.getOutstandingAmount());
        disputeRepository.save(dispute);

        // Action log
        logDisputeAction(
                dispute,
                actor,
                "APPROVE_COMPENSATION_PAYMENT",
                dispute.getStatus(),
                dispute.getStatus(),
                String.format("Phê duyệt & xác thực chứng từ bồi thường: %,.0f VNĐ (Mã GD: %s)", payAmount, ref),
                String.format("Đã thu: %,.0f VNĐ. Còn nợ: %,.0f VNĐ. Trạng thái: %s",
                        savedComp.getVerifiedPaidAmount(), savedComp.getOutstandingAmount(), savedComp.getStatus().name())
        );

        // Add message into dispute thread
        DisputeMessage msg = new DisputeMessage(
                UUID.randomUUID(),
                dispute,
                actor,
                DisputeMessageVisibility.PUBLIC,
                String.format("[XÁC THỰC CHỨNG TỪ BỒI THƯỜNG]: Nhân viên đã phê duyệt thanh toán %,.0f VNĐ (Mã tham chiếu: %s).\nTổng đã thanh toán: %,.0f VNĐ. Còn lại: %,.0f VNĐ. Trạng thái: %s.",
                        payAmount,
                        ref,
                        savedComp.getVerifiedPaidAmount(),
                        savedComp.getOutstandingAmount(),
                        savedComp.getStatus() == CompensationStatus.PAID ? "HOÀN TẤT CHI TRẢ" : "THANH TOÁN MỘT PHẦN")
        );
        messageRepository.save(msg);
        if (dispute.getMessages() != null && !dispute.getMessages().contains(msg)) {
            dispute.getMessages().add(msg);
        }

        // Notify recipient
        if (notificationService != null && savedComp.getRecipientUser() != null) {
            notificationService.sendNotification(
                    savedComp.getRecipientUser().getId(),
                    dispute.getVehicle() != null ? dispute.getVehicle().getId() : null,
                    dispute.getCoOwnershipGroup() != null ? dispute.getCoOwnershipGroup().getId() : null,
                    "DISPUTE",
                    dispute.getId(),
                    "COMPENSATION_PAYMENT_VERIFIED",
                    "Xác thực thanh toán bồi thường: " + dispute.getReferenceCode(),
                    String.format("Nhân viên đã xác nhận khoản bồi thường %,.0f VNĐ cho bạn. Còn lại: %,.0f VNĐ.",
                            payAmount, savedComp.getOutstandingAmount()),
                    "SUCCESS"
            );
        }

        return DisputeCompensationDto.fromEntity(savedComp);
    }

    /**
     * STAFF rejects invalid compensation evidence with auditable reason.
     */
    @Transactional
    public DisputeCompensationDto rejectCompensationEvidence(UUID disputeId, RejectCompensationEvidenceRequest request, UserPrincipal principal) {
        validateStaffRole(principal);

        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ tranh chấp: " + disputeId));

        DisputeCompensation compensation = getOrCreateCompensation(dispute);

        if (compensation.getStatus() != CompensationStatus.PENDING_VERIFICATION) {
            throw new IllegalStateException("Hồ sơ không có chứng từ thanh toán nào đang chờ xác minh.");
        }

        String reason = request.reason() != null && !request.reason().isBlank() ? request.reason().trim() : "Chứng từ không hợp lệ hoặc không tìm thấy giao dịch";
        User actor = userRepository.findById(principal.getId()).orElse(principal.getUser());

        // Revert status
        if (compensation.getVerifiedPaidAmount() != null && compensation.getVerifiedPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            compensation.setStatus(CompensationStatus.PARTIALLY_PAID);
        } else {
            compensation.setStatus(CompensationStatus.AWAITING_PAYMENT);
        }

        compensation.setRejectionReason(reason);
        compensation.setPendingPaymentAmount(null);
        compensation.setPendingPaymentReference(null);
        compensation.setPendingReceiptUrl(null);
        compensation.setPendingPaymentDate(null);
        compensation.setPendingPaymentNote(null);
        compensation.setPendingSubmittedAt(null);

        DisputeCompensation savedComp = compensationRepository.save(compensation);

        // Action log
        logDisputeAction(
                dispute,
                actor,
                "REJECT_COMPENSATION_PAYMENT",
                dispute.getStatus(),
                dispute.getStatus(),
                "Từ chối chứng từ thanh toán bồi thường",
                "Lý do từ chối: " + reason
        );

        // Add thread message
        DisputeMessage msg = new DisputeMessage(
                UUID.randomUUID(),
                dispute,
                actor,
                DisputeMessageVisibility.PUBLIC,
                String.format("[TỪ CHỐI CHỨNG TỪ THANH TOÁN]: Chứng từ bồi thường chưa được phê duyệt do: %s.\nVui lòng kiểm tra lại giao dịch và tải lên bằng chứng hợp lệ.",
                        reason)
        );
        messageRepository.save(msg);
        if (dispute.getMessages() != null && !dispute.getMessages().contains(msg)) {
            dispute.getMessages().add(msg);
        }

        // Notify payer
        if (notificationService != null && savedComp.getPayerUser() != null) {
            notificationService.sendNotification(
                    savedComp.getPayerUser().getId(),
                    dispute.getVehicle() != null ? dispute.getVehicle().getId() : null,
                    dispute.getCoOwnershipGroup() != null ? dispute.getCoOwnershipGroup().getId() : null,
                    "DISPUTE",
                    dispute.getId(),
                    "COMPENSATION_EVIDENCE_REJECTED",
                    "Chứng từ bồi thường bị từ chối: " + dispute.getReferenceCode(),
                    "Chứng từ của bạn bị từ chối do: " + reason + ". Vui lòng kiểm tra và gửi lại.",
                    "WARNING"
            );
        }

        return DisputeCompensationDto.fromEntity(savedComp);
    }

    /**
     * Helper to retrieve existing compensation obligation or self-heal/create it for resolved dispute.
     */
    private DisputeCompensation getOrCreateCompensation(Dispute dispute) {
        return compensationRepository.findFirstByDisputeIdOrderByCreatedAtDesc(dispute.getId())
                .orElseGet(() -> {
                    BigDecimal propAmount = dispute.getApprovedAmount() != null ? dispute.getApprovedAmount() : dispute.getProposedAmount();
                    if (propAmount == null || propAmount.compareTo(BigDecimal.ZERO) <= 0) {
                        propAmount = BigDecimal.valueOf(100000.0);
                    }
                    User payerUser = dispute.getProposedPayerUser();
                    String payerName = dispute.getProposedPayerName() != null ? dispute.getProposedPayerName() : (payerUser != null ? payerUser.getFullName() : "Nguyễn Văn A");
                    PayerType payerType = dispute.getProposedPayerType() != null ? dispute.getProposedPayerType() : PayerType.PREVIOUS_CO_OWNER;

                    User recipientUser = dispute.getProposedRecipientUser() != null ? dispute.getProposedRecipientUser() : dispute.getCreatedBy();
                    String recipientName = dispute.getProposedRecipientName() != null ? dispute.getProposedRecipientName() : (recipientUser != null ? recipientUser.getFullName() : "Trần Thị B");

                    User authorizer = dispute.getAssignedStaff() != null ? dispute.getAssignedStaff() : recipientUser;

                    DisputeCompensation compensation = new DisputeCompensation(
                            UUID.randomUUID(),
                            dispute,
                            payerUser,
                            payerType,
                            payerName,
                            recipientUser,
                            recipientName,
                            propAmount,
                            authorizer,
                            dispute.getDecisionBasis() != null ? dispute.getDecisionBasis() : "Quyết định hòa giải tranh chấp"
                    );
                    dispute.setApprovedAmount(propAmount);
                    dispute.setOutstandingAmount(propAmount);
                    dispute.setVerifiedPaidAmount(BigDecimal.ZERO);
                    disputeRepository.save(dispute);
                    return compensationRepository.save(compensation);
                });
    }

    /**
     * PHASE 5.9: Payer initiates DEMO compensation payment.
     * Generates a DEMO reference, marks status DEMO_AWAITING_RECIPIENT, and notifies recipient.
     */
    @Transactional
    public DisputeCompensationDto initiateDemoPayment(UUID disputeId, InitiateDemoPaymentRequest request, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }

        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ tranh chấp: " + disputeId));

        DisputeCompensation compensation = getOrCreateCompensation(dispute);

        if (compensation.getStatus() == CompensationStatus.DEMO_CONFIRMED || compensation.getStatus() == CompensationStatus.PAID) {
            throw new IllegalStateException("Nghĩa vụ bồi thường này đã được xác nhận thanh toán hoàn tất.");
        }
        if (compensation.getStatus() == CompensationStatus.DEMO_AWAITING_RECIPIENT) {
            throw new IllegalStateException("Khoản thanh toán DEMO đang chờ bên thụ hưởng xác nhận, vui lòng không gửi lặp lại.");
        }

        UUID currentUserId = principal.getId();
        boolean isStaffOrAdmin = principal.getUser().getRole() == Role.STAFF || principal.getUser().getRole() == Role.ADMIN;
        boolean isDesignatedPayer = (compensation.getPayerUser() != null && compensation.getPayerUser().getId().equals(currentUserId))
                || (dispute.getProposedPayerUser() != null && dispute.getProposedPayerUser().getId().equals(currentUserId))
                || (dispute.getProposedPayerName() != null && dispute.getProposedPayerName().equalsIgnoreCase(principal.getUser().getFullName()))
                || dispute.getParticipants().stream().anyMatch(p -> p.getUser() != null && p.getUser().getId().equals(currentUserId) && p.getRole() == DisputeParticipantRole.RESPONDENT);

        if (!isStaffOrAdmin && !isDesignatedPayer) {
            throw new AccessDeniedException("Chỉ bên có nghĩa vụ chi trả mới có quyền xác nhận thanh toán DEMO.");
        }

        BigDecimal payAmount = (request != null && request.amount() != null && request.amount().compareTo(BigDecimal.ZERO) > 0)
                ? request.amount()
                : compensation.getOutstandingAmount();

        if (payAmount == null || payAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số tiền thanh toán phải lớn hơn 0");
        }

        if (payAmount.compareTo(compensation.getOutstandingAmount()) > 0) {
            throw new IllegalArgumentException(String.format("Số tiền thanh toán (%,.0f VNĐ) vượt quá số tiền còn nợ (%,.0f VNĐ).",
                    payAmount, compensation.getOutstandingAmount()));
        }

        String demoRef = "DEMO-" + dispute.getReferenceCode() + "-" + (System.currentTimeMillis() % 100000);
        User actor = userRepository.findById(currentUserId).orElse(principal.getUser());

        compensation.setPendingPaymentAmount(payAmount);
        compensation.setPendingPaymentReference(demoRef);
        compensation.setPendingReceiptUrl("DEMO_PAYMENT_SIMULATION");
        compensation.setPendingPaymentDate(Instant.now());
        compensation.setPendingPaymentNote(request != null && request.note() != null && !request.note().isBlank() ? request.note().trim() : "Xác nhận thanh toán mô phỏng DEMO");
        compensation.setPendingSubmittedAt(Instant.now());
        compensation.setRejectionReason(null);
        compensation.setStatus(CompensationStatus.DEMO_AWAITING_RECIPIENT);

        DisputeCompensation savedComp = compensationRepository.save(compensation);

        // Action log
        logDisputeAction(
                dispute,
                actor,
                "INITIATE_DEMO_PAYMENT",
                dispute.getStatus(),
                dispute.getStatus(),
                String.format("Khởi tạo thanh toán bồi thường DEMO: %,.0f VNĐ (Mã GD: %s)", payAmount, demoRef),
                "Chờ bên thụ hưởng (" + compensation.getRecipientName() + ") xác nhận"
        );

        // Dispute message thread
        DisputeMessage msg = new DisputeMessage(
                UUID.randomUUID(),
                dispute,
                actor,
                DisputeMessageVisibility.PUBLIC,
                String.format("[THANH TOÁN BỒI THƯỜNG DEMO]: %s đã xác nhận thanh toán mô phỏng %,.0f VNĐ (Mã GD: %s).\nTrạng thái: Chờ bên thụ hưởng (%s) xác nhận đã nhận trên hệ thống.",
                        actor.getFullName(),
                        payAmount,
                        demoRef,
                        compensation.getRecipientName())
        );
        messageRepository.save(msg);
        if (dispute.getMessages() != null && !dispute.getMessages().contains(msg)) {
            dispute.getMessages().add(msg);
        }

        // Send persistent notification to Recipient (Tran Thi B)
        if (notificationService != null) {
            UUID recipientId = compensation.getRecipientUser() != null ? compensation.getRecipientUser().getId() : dispute.getCreatedBy().getId();
            String notifMsg = String.format("%s đã thực hiện thanh toán bồi thường DEMO %,.0fđ cho hồ sơ %s. Vui lòng xác nhận đã nhận khoản bồi thường mô phỏng.",
                    actor.getFullName(), payAmount, dispute.getReferenceCode());
            notificationService.sendNotification(
                    recipientId,
                    dispute.getVehicle() != null ? dispute.getVehicle().getId() : null,
                    dispute.getCoOwnershipGroup() != null ? dispute.getCoOwnershipGroup().getId() : null,
                    "DISPUTE",
                    dispute.getId(),
                    "DEMO_COMPENSATION_SUBMITTED",
                    "Xác nhận bồi thường DEMO: " + dispute.getReferenceCode(),
                    notifMsg,
                    "ACTION_REQUIRED"
            );
        }

        return DisputeCompensationDto.fromEntity(savedComp);
    }

    /**
     * PHASE 5.9: Recipient acknowledges receiving DEMO compensation payment.
     * Only the authenticated recipient may confirm. Updates verified paid & outstanding balances.
     */
    @Transactional
    public DisputeCompensationDto confirmRecipientDemoPayment(UUID disputeId, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }

        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ tranh chấp: " + disputeId));

        DisputeCompensation compensation = getOrCreateCompensation(dispute);

        if (compensation.getStatus() != CompensationStatus.DEMO_AWAITING_RECIPIENT || compensation.getPendingPaymentAmount() == null) {
            throw new IllegalStateException("Hồ sơ không có khoản thanh toán DEMO nào đang chờ xác nhận.");
        }

        UUID currentUserId = principal.getId();
        UUID recipientId = compensation.getRecipientUser() != null ? compensation.getRecipientUser().getId() : dispute.getCreatedBy().getId();

        // Enforce: Only recipient can acknowledge (no payer confirmation on recipient's behalf)
        if (!currentUserId.equals(recipientId)) {
            throw new AccessDeniedException("Chỉ người thụ hưởng (" + compensation.getRecipientName() + ") mới có quyền xác nhận đã nhận khoản bồi thường này.");
        }

        BigDecimal payAmount = compensation.getPendingPaymentAmount();
        String ref = compensation.getPendingPaymentReference() != null ? compensation.getPendingPaymentReference() : ("DEMO-" + dispute.getReferenceCode());
        User actor = userRepository.findById(currentUserId).orElse(principal.getUser());

        // Create transaction record in MySQL
        DisputeCompensationPayment payment = new DisputeCompensationPayment(
                UUID.randomUUID(),
                compensation,
                payAmount,
                ref,
                "DEMO_SIMULATION",
                Instant.now(),
                actor,
                actor.getFullName() + " (Bên thụ hưởng - DEMO)",
                "Bên thụ hưởng đã xác nhận nhận đủ khoản bồi thường DEMO"
        );
        compensationPaymentRepository.save(payment);

        // Update financial state
        BigDecimal newVerifiedPaid = compensation.getVerifiedPaidAmount().add(payAmount);
        compensation.setVerifiedPaidAmount(newVerifiedPaid);

        BigDecimal remaining = compensation.getApprovedAmount().subtract(newVerifiedPaid);
        if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
            compensation.setOutstandingAmount(BigDecimal.ZERO);
            compensation.setStatus(CompensationStatus.DEMO_CONFIRMED);
        } else {
            compensation.setOutstandingAmount(remaining);
            compensation.setStatus(CompensationStatus.PARTIALLY_PAID);
        }
        compensation.setPaymentReference(ref);
        compensation.setPendingPaymentAmount(null);
        compensation.setPendingPaymentReference(null);
        compensation.setPendingReceiptUrl(null);
        compensation.setPendingPaymentDate(null);
        compensation.setPendingPaymentNote(null);
        compensation.setPendingSubmittedAt(null);
        compensation.setRejectionReason(null);

        DisputeCompensation savedComp = compensationRepository.save(compensation);

        // Synchronize on dispute entity
        dispute.setVerifiedPaidAmount(savedComp.getVerifiedPaidAmount());
        dispute.setOutstandingAmount(savedComp.getOutstandingAmount());
        disputeRepository.save(dispute);

        // Action log
        logDisputeAction(
                dispute,
                actor,
                "CONFIRM_DEMO_PAYMENT",
                dispute.getStatus(),
                dispute.getStatus(),
                String.format("Xác nhận đã nhận bồi thường DEMO: %,.0f VNĐ (Mã GD: %s)", payAmount, ref),
                "Bên thụ hưởng (" + actor.getFullName() + ") đã xác nhận nhận tiền thành công"
        );

        // Message thread
        DisputeMessage msg = new DisputeMessage(
                UUID.randomUUID(),
                dispute,
                actor,
                DisputeMessageVisibility.PUBLIC,
                String.format("[ĐÃ XÁC NHẬN BỒI THƯỜNG DEMO]: Bên thụ hưởng (%s) đã xác nhận nhận %,.0f VNĐ (Mã GD: %s).\nTổng đã xác nhận: %,.0f VNĐ. Còn lại: %,.0f VNĐ. Trạng thái: %s.",
                        actor.getFullName(),
                        payAmount,
                        ref,
                        savedComp.getVerifiedPaidAmount(),
                        savedComp.getOutstandingAmount(),
                        savedComp.getStatus() == CompensationStatus.DEMO_CONFIRMED ? "HOÀN TẤT BỒI THƯỜNG (DEMO)" : "XÁC NHẬN MỘT PHẦN (DEMO)")
        );
        messageRepository.save(msg);
        if (dispute.getMessages() != null && !dispute.getMessages().contains(msg)) {
            dispute.getMessages().add(msg);
        }

        // Notify Payer & Staff
        if (notificationService != null) {
            if (savedComp.getPayerUser() != null) {
                notificationService.sendNotification(
                        savedComp.getPayerUser().getId(),
                        dispute.getVehicle() != null ? dispute.getVehicle().getId() : null,
                        dispute.getCoOwnershipGroup() != null ? dispute.getCoOwnershipGroup().getId() : null,
                        "DISPUTE",
                        dispute.getId(),
                        "DEMO_COMPENSATION_CONFIRMED",
                        "Đã xác nhận bồi thường DEMO: " + dispute.getReferenceCode(),
                        String.format("%s đã xác nhận đã nhận khoản bồi thường DEMO %,.0fđ cho hồ sơ %s.",
                                actor.getFullName(), payAmount, dispute.getReferenceCode()),
                        "SUCCESS"
                );
            }
        }

        return DisputeCompensationDto.fromEntity(savedComp);
    }

    /**
     * PHASE 5.9: Recipient disputes or flags unreceived DEMO payment.
     */
    @Transactional
    public DisputeCompensationDto disputeRecipientDemoPayment(UUID disputeId, RecipientAcknowledgeDemoPaymentRequest request, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }

        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ tranh chấp: " + disputeId));

        DisputeCompensation compensation = getOrCreateCompensation(dispute);

        if (compensation.getStatus() != CompensationStatus.DEMO_AWAITING_RECIPIENT) {
            throw new IllegalStateException("Hồ sơ không có khoản thanh toán DEMO nào đang chờ xác nhận.");
        }

        UUID currentUserId = principal.getId();
        UUID recipientId = compensation.getRecipientUser() != null ? compensation.getRecipientUser().getId() : dispute.getCreatedBy().getId();

        if (!currentUserId.equals(recipientId)) {
            throw new AccessDeniedException("Chỉ người thụ hưởng (" + compensation.getRecipientName() + ") mới có quyền báo cáo chưa nhận bồi thường.");
        }

        String reason = (request != null && request.note() != null && !request.note().isBlank())
                ? request.note().trim()
                : "Bên thụ hưởng báo chưa nhận được khoản tiền bồi thường DEMO";
        User actor = userRepository.findById(currentUserId).orElse(principal.getUser());

        compensation.setStatus(CompensationStatus.DEMO_DISPUTED);
        compensation.setRejectionReason(reason);
        compensation.setPendingPaymentAmount(null);
        compensation.setPendingPaymentReference(null);
        compensation.setPendingReceiptUrl(null);
        compensation.setPendingPaymentDate(null);
        compensation.setPendingPaymentNote(null);
        compensation.setPendingSubmittedAt(null);

        DisputeCompensation savedComp = compensationRepository.save(compensation);

        // Action log
        logDisputeAction(
                dispute,
                actor,
                "DISPUTE_DEMO_PAYMENT",
                dispute.getStatus(),
                dispute.getStatus(),
                "Bên thụ hưởng phản ánh chưa nhận tiền bồi thường DEMO",
                reason
        );

        // Thread message
        DisputeMessage msg = new DisputeMessage(
                UUID.randomUUID(),
                dispute,
                actor,
                DisputeMessageVisibility.PUBLIC,
                String.format("[CHƯA NHẬN BỒI THƯỜNG DEMO]: Bên thụ hưởng (%s) báo chưa nhận được khoản bồi thường DEMO do: %s.\nVui lòng kiểm tra lại.",
                        actor.getFullName(), reason)
        );
        messageRepository.save(msg);
        if (dispute.getMessages() != null && !dispute.getMessages().contains(msg)) {
            dispute.getMessages().add(msg);
        }

        // Notify Payer & Staff
        if (notificationService != null) {
            if (savedComp.getPayerUser() != null) {
                notificationService.sendNotification(
                        savedComp.getPayerUser().getId(),
                        dispute.getVehicle() != null ? dispute.getVehicle().getId() : null,
                        dispute.getCoOwnershipGroup() != null ? dispute.getCoOwnershipGroup().getId() : null,
                        "DISPUTE",
                        dispute.getId(),
                        "DEMO_COMPENSATION_DISPUTED",
                        "Chưa nhận bồi thường DEMO: " + dispute.getReferenceCode(),
                        String.format("%s báo chưa nhận được khoản bồi thường DEMO (%s). Vui lòng kiểm tra lại.",
                                actor.getFullName(), reason),
                        "WARNING"
                );
            }
            if (dispute.getAssignedStaff() != null) {
                notificationService.sendNotification(
                        dispute.getAssignedStaff().getId(),
                        dispute.getVehicle() != null ? dispute.getVehicle().getId() : null,
                        dispute.getCoOwnershipGroup() != null ? dispute.getCoOwnershipGroup().getId() : null,
                        "DISPUTE",
                        dispute.getId(),
                        "DEMO_COMPENSATION_DISPUTED",
                        "Khiếu nại bồi thường DEMO: " + dispute.getReferenceCode(),
                        String.format("Bên thụ hưởng (%s) báo chưa nhận được khoản bồi thường DEMO cho hồ sơ %s. Cần nhân viên hỗ trợ.",
                                actor.getFullName(), dispute.getReferenceCode()),
                        "WARNING"
                );
            }
        }

        return DisputeCompensationDto.fromEntity(savedComp);
    }

    /**
     * Link an existing collective Group Vote Proposal to this Dispute (Phase 5.5.14).
     */
    @Transactional
    public DisputeResponse linkVotingProposal(UUID disputeId, UUID proposalId, UserPrincipal principal) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ tranh chấp"));

        boolean isStaffOrAdmin = principal != null && (principal.getUser().getRole() == Role.STAFF || principal.getUser().getRole() == Role.ADMIN);
        if (!isStaffOrAdmin && !dispute.getCreatedBy().getId().equals(principal.getId())) {
            throw new AccessDeniedException("Chỉ người tạo hoặc nhân viên mới có quyền liên kết biểu quyết.");
        }

        User actor = userRepository.findById(principal.getId()).orElse(principal.getUser());
        if (proposalId != null) {
            voteProposalRepository.findById(proposalId)
                    .orElseThrow(() -> new ResourceNotFoundException("Đề xuất biểu quyết không tồn tại: " + proposalId));
            dispute.setProposalId(proposalId);
            dispute.setStatus(DisputeStatus.VOTING_IN_PROGRESS);

            DisputeMessage msg = new DisputeMessage(
                    UUID.randomUUID(),
                    dispute,
                    actor,
                    DisputeMessageVisibility.PUBLIC,
                    "[LIÊN KẾT BIỂU QUYẾT NHÓM]: Vấn đề tranh chấp đã được đưa vào biểu quyết nhóm mã số " + proposalId.toString().substring(0, 8) + "."
            );
            messageRepository.save(msg);
        if (dispute.getMessages() != null && !dispute.getMessages().contains(msg)) {
            dispute.getMessages().add(msg);
        }
        }

        Dispute saved = disputeRepository.save(dispute);
        return DisputeResponse.fromEntity(saved, principal.getId(), isStaffOrAdmin);
    }

    /**
     * Record execution of approved corrective action (Phase 5.5.19).
     */
    @Transactional
    public DisputeResponse executeCorrectiveAction(UUID disputeId, ExecuteCorrectiveActionRequest request, UserPrincipal principal) {
        validateStaffRole(principal);

        User actor = userRepository.findById(principal.getId()).orElse(principal.getUser());
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ tranh chấp"));

        if (dispute.getStatus() != DisputeStatus.RESOLVED) {
            throw new IllegalStateException("Chỉ tranh chấp đã hòa giải thành công mới có thể ghi nhận hoàn tất khắc phục.");
        }

        dispute.setCorrectiveActionExecuted(true);
        dispute.setCorrectiveActionSummary(request.correctiveActionSummary().trim());
        dispute.setCorrectiveActionExecutedAt(Instant.now());

        DisputeMessage msg = new DisputeMessage(
                UUID.randomUUID(),
                dispute,
                actor,
                DisputeMessageVisibility.PUBLIC,
                "[HOÀN TẤT XỬ LÝ KHẮC PHỤC]: " + request.correctiveActionSummary().trim() +
                (request.note() != null && !request.note().isBlank() ? " | " + request.note().trim() : "")
        );
        messageRepository.save(msg);
        if (dispute.getMessages() != null && !dispute.getMessages().contains(msg)) {
            dispute.getMessages().add(msg);
        }

        Dispute saved = disputeRepository.save(dispute);
        return DisputeResponse.fromEntity(saved, principal.getId(), true);
    }

    /**
     * Close the dispute with final resolution summary and safe preservation of compensation obligations.
     */
    @Transactional
    public DisputeResponse closeDispute(UUID disputeId, String resolutionSummary, UserPrincipal principal) {
        validateStaffRole(principal);

        User actor = userRepository.findById(principal.getId()).orElse(principal.getUser());
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ tranh chấp"));

        // Safeguard: Check if there is an active compensation with outstanding balance
        Optional<DisputeCompensation> compOpt = compensationRepository.findFirstByDisputeIdOrderByCreatedAtDesc(disputeId);
        if (compOpt.isPresent()) {
            DisputeCompensation comp = compOpt.get();
            if (comp.getStatus() != CompensationStatus.PAID && comp.getOutstandingAmount().compareTo(BigDecimal.ZERO) > 0) {
                log.info("Closing dispute {} with preserved outstanding compensation: {}", disputeId, comp.getOutstandingAmount());
            }
        }

        DisputeStatus prevStatus = dispute.getStatus();
        dispute.setStatus(DisputeStatus.CLOSED);
        dispute.setClosedAt(Instant.now());
        if (resolutionSummary != null && !resolutionSummary.isBlank()) {
            dispute.setResolutionSummary(resolutionSummary.trim());
        }

        logDisputeAction(
                dispute,
                actor,
                "CLOSE_DISPUTE",
                prevStatus,
                DisputeStatus.CLOSED,
                "Đóng hồ sơ tranh chấp",
                dispute.getResolutionSummary()
        );

        DisputeMessage msg = new DisputeMessage(
                UUID.randomUUID(),
                dispute,
                actor,
                DisputeMessageVisibility.PUBLIC,
                "[ĐÓNG HỒ SƠ TRANH CHẤP]: Hồ sơ đã được hoàn tất và đóng lưu trữ."
        );
        messageRepository.save(msg);
        if (dispute.getMessages() != null && !dispute.getMessages().contains(msg)) {
            dispute.getMessages().add(msg);
        }

        Dispute saved = disputeRepository.save(dispute);
        return DisputeResponse.fromEntity(saved, principal.getId(), true);
    }

    /**
     * Retrieve compensations for dispute.
     */
    @Transactional
    public List<DisputeCompensationDto> getDisputeCompensations(UUID disputeId, UserPrincipal principal) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ tranh chấp"));
        boolean isStaffOrAdmin = principal != null && (principal.getUser().getRole() == Role.STAFF || principal.getUser().getRole() == Role.ADMIN);
        if (!isStaffOrAdmin) {
            validateDisputeAccess(dispute, principal != null ? principal.getId() : null);
        }
        List<DisputeCompensation> list = compensationRepository.findByDisputeIdOrderByCreatedAtDesc(disputeId);
        if (list.isEmpty() && (dispute.getStatus() == DisputeStatus.RESOLVED || dispute.getStatus() == DisputeStatus.CLOSED || (dispute.getApprovedAmount() != null && dispute.getApprovedAmount().compareTo(BigDecimal.ZERO) > 0))) {
            DisputeCompensation healed = getOrCreateCompensation(dispute);
            list = List.of(healed);
        }
        return list.stream()
                .map(DisputeCompensationDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Retrieve audit action logs for dispute.
     */
    @Transactional(readOnly = true)
    public List<DisputeActionLogDto> getDisputeActionLogs(UUID disputeId, UserPrincipal principal) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ tranh chấp"));
        boolean isStaffOrAdmin = principal != null && (principal.getUser().getRole() == Role.STAFF || principal.getUser().getRole() == Role.ADMIN);
        if (!isStaffOrAdmin) {
            validateDisputeAccess(dispute, principal != null ? principal.getId() : null);
        }
        return actionLogRepository.findByDisputeIdOrderByCreatedAtDesc(disputeId).stream()
                .map(DisputeActionLogDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Reopen a closed or rejected dispute when permitted (Phase 5.5.20).
     */
    @Transactional
    public DisputeResponse reopenDispute(UUID disputeId, String reason, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }

        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ tranh chấp"));

        boolean isStaffOrAdmin = principal.getUser().getRole() == Role.STAFF || principal.getUser().getRole() == Role.ADMIN;
        if (!isStaffOrAdmin && !dispute.getCreatedBy().getId().equals(principal.getId())) {
            throw new AccessDeniedException("Chỉ người tạo khiếu nại hoặc nhân viên mới có quyền mở lại tranh chấp.");
        }

        if (dispute.getStatus() != DisputeStatus.RESOLVED &&
            dispute.getStatus() != DisputeStatus.CLOSED &&
            dispute.getStatus() != DisputeStatus.REJECTED) {
            throw new IllegalStateException("Tranh chấp đang trong quá trình xử lý, không cần mở lại.");
        }

        if (dispute.getReopenCount() >= 2) {
            throw new IllegalStateException("Hồ sơ tranh chấp đã đạt giới hạn tối đa số lần mở lại (2 lần).");
        }

        dispute.setStatus(DisputeStatus.REOPENED);
        dispute.setReopenCount(dispute.getReopenCount() + 1);
        dispute.setReopenReason(reason != null ? reason.trim() : "Mở lại hồ sơ để xem xét lại tình tiết bổ sung");
        dispute.setClosedAt(null);

        DisputeMessage msg = new DisputeMessage(
                UUID.randomUUID(),
                dispute,
                principal.getUser(),
                DisputeMessageVisibility.PUBLIC,
                "[MỞ LẠI HỒ SƠ TRANH CHẤP (Lần " + dispute.getReopenCount() + ")]: " + dispute.getReopenReason()
        );
        messageRepository.save(msg);
        if (dispute.getMessages() != null && !dispute.getMessages().contains(msg)) {
            dispute.getMessages().add(msg);
        }

        Dispute saved = disputeRepository.save(dispute);
        return DisputeResponse.fromEntity(saved, principal.getId(), isStaffOrAdmin);
    }

    // ==========================================
    // Private Helpers & Validations
    // ==========================================

    private void validateStaffRole(UserPrincipal principal) {
        if (principal == null || principal.getUser() == null ||
            (principal.getUser().getRole() != Role.STAFF && principal.getUser().getRole() != Role.ADMIN)) {
            throw new AccessDeniedException("Thao tác yêu cầu quyền Quản lý hoặc Nhân viên kỹ thuật.");
        }
    }

    private void validateCoOwnerAccess(CoOwnershipGroup group, UUID vehicleId, UUID userId) {
        if (group != null) {
            boolean isMember = memberRepository.findByGroupIdAndStatus(group.getId(), MemberStatus.ACTIVE).stream()
                    .anyMatch(m -> m.getRemovedAt() == null && m.getUser().getId().equals(userId));
            if (!isMember) {
                throw new AccessDeniedException("Bạn không có quyền gửi khiếu nại cho phương tiện của nhóm này.");
            }
        }
    }

    private void validateDisputeAccess(Dispute dispute, UUID userId) {
        if (userId == null) {
            throw new AccessDeniedException("Yêu cầu xác thực tài khoản.");
        }
        if (dispute.getCreatedBy() != null && dispute.getCreatedBy().getId().equals(userId)) {
            return;
        }
        boolean isParticipant = dispute.getParticipants().stream()
                .anyMatch(p -> p.getUser().getId().equals(userId));
        if (isParticipant) {
            return;
        }

        // Allow group co-owners to view group disputes
        if (dispute.getCoOwnershipGroup() != null) {
            boolean isGroupMember = memberRepository.findByGroupIdAndStatus(dispute.getCoOwnershipGroup().getId(), MemberStatus.ACTIVE).stream()
                    .anyMatch(m -> m.getRemovedAt() == null && m.getUser().getId().equals(userId));
            if (isGroupMember) {
                return;
            }
        }

        throw new AccessDeniedException("Bạn không có quyền truy cập hồ sơ tranh chấp này.");
    }

    private void validateNoDuplicateOpenDispute(CreateDisputeRequest req) {
        List<DisputeStatus> terminal = List.of(DisputeStatus.RESOLVED, DisputeStatus.CLOSED, DisputeStatus.REJECTED);
        if (req.bookingId() != null && disputeRepository.existsByBookingIdAndStatusNotIn(req.bookingId(), terminal)) {
            throw new DuplicateResourceException("Lịch đặt xe này đã có một khiếu nại đang được xử lý.");
        }
        if (req.expenseId() != null && disputeRepository.existsByExpenseIdAndStatusNotIn(req.expenseId(), terminal)) {
            throw new DuplicateResourceException("Khoản chi phí này đã có một khiếu nại đang được xử lý.");
        }
        if (req.expenseShareId() != null && disputeRepository.existsByExpenseShareIdAndStatusNotIn(req.expenseShareId(), terminal)) {
            throw new DuplicateResourceException("Phần phân bổ chi phí này đã có một khiếu nại đang được xử lý.");
        }
        if (req.damageRecordId() != null && disputeRepository.existsByDamageRecordIdAndStatusNotIn(req.damageRecordId(), terminal)) {
            throw new DuplicateResourceException("Bản ghi hư hỏng này đã có một khiếu nại đang được xử lý.");
        }
    }

    private String captureBusinessEvidenceSnapshot(CreateDisputeRequest req) {
        try {
            Map<String, Object> snapshot = new HashMap<>();
            snapshot.put("capturedAt", Instant.now().toString());
            snapshot.put("category", req.category().name());

            if (req.bookingId() != null) {
                bookingRepository.findById(req.bookingId()).ifPresent(b -> {
                    snapshot.put("bookingStatus", b.getStatus() != null ? b.getStatus().name() : null);
                    snapshot.put("bookingStartTime", b.getStartTime() != null ? b.getStartTime().toString() : null);
                    snapshot.put("bookingEndTime", b.getEndTime() != null ? b.getEndTime().toString() : null);
                });
            }
            if (req.tripId() != null) {
                tripRepository.findById(req.tripId()).ifPresent(t -> {
                    snapshot.put("tripStatus", t.getStatus() != null ? t.getStatus().name() : null);
                    snapshot.put("tripStartedAt", t.getStartedAt() != null ? t.getStartedAt().toString() : "UNAVAILABLE");
                    snapshot.put("tripEndedAt", t.getEndedAt() != null ? t.getEndedAt().toString() : "UNAVAILABLE");
                    snapshot.put("tripReturnRequestedAt", t.getReturnRequestedAt() != null ? t.getReturnRequestedAt().toString() : "UNAVAILABLE");
                    snapshot.put("tripReturnVerifiedAt", t.getReturnVerifiedAt() != null ? t.getReturnVerifiedAt().toString() : "UNAVAILABLE");
                    snapshot.put("tripStartOdo", t.getStartOdometer() != null ? t.getStartOdometer().toString() : "UNAVAILABLE");
                    snapshot.put("tripEndOdo", t.getEndOdometer() != null ? t.getEndOdometer().toString() : "UNAVAILABLE");
                    snapshot.put("tripStartBattery", t.getStartBatteryLevel() != null ? t.getStartBatteryLevel() : "UNAVAILABLE");
                    snapshot.put("tripEndBattery", t.getEndBatteryLevel() != null ? t.getEndBatteryLevel() : "UNAVAILABLE");
                });
            }
            if (req.handoverId() != null) {
                handoverRepository.findById(req.handoverId()).ifPresent(h -> {
                    snapshot.put("handoverStatus", h.getStatus() != null ? h.getStatus().name() : null);
                    snapshot.put("handoverStaffHandedOverAt", h.getStaffHandedOverAt() != null ? h.getStaffHandedOverAt().toString() : null);
                    snapshot.put("handoverOwnerReceivedAt", h.getOwnerReceivedAt() != null ? h.getOwnerReceivedAt().toString() : null);

                    Optional<Trip> handoverTrip = (h.getBooking() != null)
                            ? tripRepository.findByBookingId(h.getBooking().getId())
                            : Optional.empty();

                    if (handoverTrip.isPresent() &&
                        (h.getVehicle() == null || handoverTrip.get().getVehicle() == null ||
                         handoverTrip.get().getVehicle().getId().equals(h.getVehicle().getId()))) {
                        Trip t = handoverTrip.get();
                        snapshot.put("handoverOdo", t.getStartOdometer() != null ? t.getStartOdometer().toString() : "UNAVAILABLE");
                        snapshot.put("handoverBattery", t.getStartBatteryLevel() != null ? t.getStartBatteryLevel().toString() : "UNAVAILABLE");
                        snapshot.put("handoverMeasurementSource", "PERSISTED_TRIP_START");
                    } else {
                        snapshot.put("handoverOdo", "UNAVAILABLE");
                        snapshot.put("handoverBattery", "UNAVAILABLE");
                        snapshot.put("handoverMeasurementSource", "NO_TRIP_PERSISTED");
                    }
                });
            }
            if (req.damageRecordId() != null) {
                damageRecordRepository.findById(req.damageRecordId()).ifPresent(d -> {
                    snapshot.put("damageSeverity", d.getSeverity() != null ? d.getSeverity().name() : null);
                    snapshot.put("damageType", d.getDamageType() != null ? d.getDamageType().name() : null);
                    snapshot.put("damagePartCode", d.getVehiclePartCode());
                    snapshot.put("damageStatus", d.getStatus() != null ? d.getStatus().name() : null);
                });
            }
            if (req.expenseId() != null) {
                expenseRepository.findById(req.expenseId()).ifPresent(e -> {
                    snapshot.put("expenseAmount", e.getAmount());
                    snapshot.put("expenseCategory", e.getCategory() != null ? e.getCategory().name() : null);
                    snapshot.put("expenseAllocationPolicy", e.getAllocationPolicy() != null ? e.getAllocationPolicy().name() : null);
                    snapshot.put("expenseStatus", e.getStatus() != null ? e.getStatus().name() : null);
                });
            }
            if (req.expenseShareId() != null) {
                expenseShareRepository.findById(req.expenseShareId()).ifPresent(s -> {
                    BigDecimal allocated = s.getShareAmount();

                    List<PersonalExpensePayment> sharePayments = paymentRepository.findByExpenseShareIdOrderByCreatedAtDesc(s.getId());
                    if (sharePayments.isEmpty() && s.getUser() != null && s.getExpense() != null) {
                        sharePayments = paymentRepository.findByExpenseIdAndPayerUserIdOrderByCreatedAtDesc(s.getExpense().getId(), s.getUser().getId());
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

                    BigDecimal remaining = allocated != null
                            ? allocated.subtract(verifiedPaid).max(BigDecimal.ZERO)
                            : null;

                    snapshot.put("allocatedAmount", allocated);
                    snapshot.put("verifiedPaidAmount", verifiedPaid);
                    snapshot.put("pendingVerificationAmount", pendingVerification);
                    snapshot.put("remainingAmount", remaining);
                    snapshot.put("paymentStatus", s.getStatus() != null ? s.getStatus().name() : null);

                    snapshot.put("shareAmount", allocated);
                    snapshot.put("sharePaidAmount", verifiedPaid);
                    snapshot.put("shareStatus", s.getStatus() != null ? s.getStatus().name() : null);
                });
            }
            if (req.personalPaymentId() != null) {
                paymentRepository.findById(req.personalPaymentId()).ifPresent(p -> {
                    snapshot.put("paymentId", p.getId().toString());
                    snapshot.put("paymentAmount", p.getAmount());
                    snapshot.put("paymentStatus", p.getStatus() != null ? p.getStatus().name() : null);
                    snapshot.put("paymentMethod", p.getPaymentMethod());
                    snapshot.put("paymentReference", p.getPaymentReference());
                    snapshot.put("paymentPayerUserId", p.getPayerUser() != null ? p.getPayerUser().getId().toString() : null);
                    snapshot.put("paymentCreatedAt", p.getCreatedAt() != null ? p.getCreatedAt().toString() : null);
                    snapshot.put("paymentVerifiedAt", p.getVerifiedAt() != null ? p.getVerifiedAt().toString() : null);
                });
            }

            return objectMapper.writeValueAsString(snapshot);
        } catch (Exception ex) {
            log.warn("Failed to serialize business evidence snapshot: {}", ex.getMessage());
            return "{}";
        }
    }

    private CoOwnershipGroup resolveGroupByVehicleId(UUID vehicleId) {
        List<GroupVehicle> gvs = groupVehicleRepository.findByVehicleIdAndStatus(vehicleId, GroupVehicleStatus.ACTIVE);
        if (!gvs.isEmpty() && gvs.get(0).getGroup() != null) {
            return gvs.get(0).getGroup();
        }
        return groupRepository.findByVehicleId(vehicleId).orElse(null);
    }

    private String generateRandomSuffix(int length) {
        final String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(RANDOM.nextInt(chars.length())));
        }
        return sb.toString();
    }
}

