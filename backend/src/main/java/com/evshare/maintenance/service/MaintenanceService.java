package com.evshare.maintenance.service;

import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.common.exception.UnauthorizedException;
import com.evshare.damage.entity.DamageRecord;
import com.evshare.damage.entity.DamageStatus;
import com.evshare.damage.repository.DamageRecordRepository;
import com.evshare.maintenance.dto.CastMaintenanceVoteRequest;
import com.evshare.maintenance.dto.CompleteMaintenanceRequest;
import com.evshare.maintenance.dto.CreateMaintenanceRequest;
import com.evshare.maintenance.dto.MaintenanceApprovalResponse;
import com.evshare.maintenance.dto.MaintenanceResponse;
import com.evshare.maintenance.dto.MaintenanceVoteSummaryDto;
import com.evshare.maintenance.dto.ScheduleMaintenanceRequest;
import com.evshare.maintenance.entity.MaintenanceApprovalVote;
import com.evshare.maintenance.entity.MaintenancePriority;
import com.evshare.maintenance.entity.MaintenanceRequest;
import com.evshare.maintenance.entity.MaintenanceStatus;
import com.evshare.maintenance.entity.MaintenanceType;
import com.evshare.maintenance.entity.VoteDecision;
import com.evshare.maintenance.repository.MaintenanceApprovalVoteRepository;
import com.evshare.maintenance.repository.MaintenanceRequestRepository;
import com.evshare.ownership.entity.CoOwnershipGroup;
import com.evshare.ownership.entity.GroupMember;
import com.evshare.ownership.entity.GroupStatus;
import com.evshare.ownership.entity.GroupVehicle;
import com.evshare.ownership.entity.GroupVehicleStatus;
import com.evshare.ownership.entity.MemberStatus;
import com.evshare.ownership.entity.OwnershipShare;
import com.evshare.ownership.repository.CoOwnershipGroupRepository;
import com.evshare.ownership.repository.GroupMemberRepository;
import com.evshare.ownership.repository.GroupVehicleRepository;
import com.evshare.ownership.repository.OwnershipShareRepository;
import com.evshare.security.UserPrincipal;
import com.evshare.trip.entity.TripStatus;
import com.evshare.trip.repository.TripRepository;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import com.evshare.user.repository.UserRepository;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.entity.VehicleStatus;
import com.evshare.vehicle.repository.VehicleRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MaintenanceService {

    public static final BigDecimal MAINTENANCE_APPROVAL_THRESHOLD = new BigDecimal("50.00");

    private final MaintenanceRequestRepository maintenanceRequestRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final DamageRecordRepository damageRecordRepository;
    private final TripRepository tripRepository;
    private final GroupMemberRepository memberRepository;
    private final GroupVehicleRepository groupVehicleRepository;
    private final MaintenanceApprovalVoteRepository voteRepository;
    private final OwnershipShareRepository ownershipShareRepository;
    private final CoOwnershipGroupRepository coOwnershipGroupRepository;

    public MaintenanceService(
            MaintenanceRequestRepository maintenanceRequestRepository,
            VehicleRepository vehicleRepository,
            UserRepository userRepository,
            DamageRecordRepository damageRecordRepository,
            TripRepository tripRepository,
            GroupMemberRepository memberRepository,
            GroupVehicleRepository groupVehicleRepository,
            MaintenanceApprovalVoteRepository voteRepository,
            OwnershipShareRepository ownershipShareRepository,
            CoOwnershipGroupRepository coOwnershipGroupRepository
    ) {
        this.maintenanceRequestRepository = maintenanceRequestRepository;
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
        this.damageRecordRepository = damageRecordRepository;
        this.tripRepository = tripRepository;
        this.memberRepository = memberRepository;
        this.groupVehicleRepository = groupVehicleRepository;
        this.voteRepository = voteRepository;
        this.ownershipShareRepository = ownershipShareRepository;
        this.coOwnershipGroupRepository = coOwnershipGroupRepository;
    }

    /**
     * Get all maintenance requests for a vehicle, sorted newest first.
     */
    @Transactional(readOnly = true)
    public List<MaintenanceResponse> getVehicleMaintenance(UUID vehicleId, UserPrincipal principal) {
        validateVehicleAccess(vehicleId, principal);

        if (!vehicleRepository.existsById(vehicleId)) {
            throw new ResourceNotFoundException("Xe không tồn tại trong hệ thống: " + vehicleId);
        }

        return maintenanceRequestRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId)
                .stream()
                .map(MaintenanceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get maintenance request by ID.
     */
    @Transactional(readOnly = true)
    public MaintenanceResponse getMaintenanceById(UUID maintenanceId, UserPrincipal principal) {
        MaintenanceRequest request = maintenanceRequestRepository.findByIdWithDetails(maintenanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu bảo dưỡng không tồn tại: " + maintenanceId));

        validateVehicleAccess(request.getVehicle().getId(), principal);

        return MaintenanceResponse.fromEntity(request);
    }

    /**
     * STAFF / ADMIN creates a new maintenance request.
     * New requests start in PENDING_APPROVAL status requiring co-owner approval before starting.
     */
    @Transactional
    public MaintenanceResponse createMaintenance(
            UUID vehicleId,
            CreateMaintenanceRequest request,
            UUID actorId,
            Role actorRole
    ) {
        if (actorRole != Role.STAFF && actorRole != Role.ADMIN) {
            throw new AccessDeniedException("Chỉ Nhân viên hoặc Quản trị viên mới có quyền tạo yêu cầu bảo dưỡng.");
        }

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Xe không tồn tại trong hệ thống: " + vehicleId));

        User creator = userRepository.findById(actorId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại: " + actorId));

        User assignedStaff = null;
        if (request.getAssignedStaffId() != null) {
            assignedStaff = userRepository.findById(request.getAssignedStaffId())
                    .orElseThrow(() -> new ResourceNotFoundException("Nhân viên phụ trách không tồn tại: " + request.getAssignedStaffId()));
        }

        MaintenanceRequest maintenance = new MaintenanceRequest(
                UUID.randomUUID(),
                vehicle,
                MaintenanceStatus.PENDING_APPROVAL,
                request.getPriority() != null ? request.getPriority() : MaintenancePriority.MEDIUM,
                request.getMaintenanceType() != null ? request.getMaintenanceType() : MaintenanceType.PREVENTIVE,
                request.getTitle().trim(),
                request.getDescription() != null ? request.getDescription().trim() : null,
                request.getScheduledAt(),
                creator,
                assignedStaff
        );

        // Associate damage records if provided
        if (request.getDamageRecordIds() != null && !request.getDamageRecordIds().isEmpty()) {
            List<DamageRecord> damages = damageRecordRepository.findAllById(request.getDamageRecordIds());
            Set<DamageRecord> validDamages = new HashSet<>();
            for (DamageRecord damage : damages) {
                if (damage.getVehicle() != null && damage.getVehicle().getId().equals(vehicleId)) {
                    validDamages.add(damage);
                }
            }
            maintenance.setDamageRecords(validDamages);
        }

        MaintenanceRequest saved = maintenanceRequestRepository.save(maintenance);
        return MaintenanceResponse.fromEntity(saved);
    }

    /**
     * Get approval summary and votes for a maintenance request.
     */
    @Transactional(readOnly = true)
    public MaintenanceApprovalResponse getMaintenanceApproval(UUID maintenanceId, UserPrincipal principal) {
        MaintenanceRequest maintenance = maintenanceRequestRepository.findByIdWithDetails(maintenanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu bảo dưỡng không tồn tại: " + maintenanceId));

        validateVehicleAccess(maintenance.getVehicle().getId(), principal);

        UUID vehicleId = maintenance.getVehicle().getId();
        CoOwnershipGroup group = getActiveGroupForVehicle(vehicleId);

        UUID currentUserId = principal != null ? principal.getId() : null;
        return buildApprovalResponse(maintenance, group.getId(), vehicleId, currentUserId);
    }

    /**
     * CO_OWNER casts or updates their approval vote on a maintenance request.
     * Enforces dynamic ownership share weighting and authorization.
     */
    @Transactional
    public MaintenanceApprovalResponse castVote(UUID maintenanceId, CastMaintenanceVoteRequest voteRequest, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để biểu quyết.");
        }

        MaintenanceRequest maintenance = maintenanceRequestRepository.findByIdWithDetails(maintenanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu bảo dưỡng không tồn tại: " + maintenanceId));

        if (maintenance.getStatus() != MaintenanceStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Yêu cầu bảo dưỡng không ở trạng thái chờ phê duyệt (Trạng thái hiện tại: " + maintenance.getStatus() + "). Biểu quyết không thể thay đổi.");
        }

        Role userRole = principal.getUser().getRole();
        if (userRole != Role.CO_OWNER) {
            throw new AccessDeniedException("Chỉ thành viên nhóm đồng sở hữu phương tiện mới có quyền biểu quyết.");
        }

        UUID vehicleId = maintenance.getVehicle().getId();
        CoOwnershipGroup group = getActiveGroupForVehicle(vehicleId);
        GroupMember member = getActiveGroupMember(group.getId(), principal.getId());
        OwnershipShare share = getActiveOwnershipShare(group.getId(), vehicleId, member.getId());

        // Check if vote already exists for this member
        Optional<MaintenanceApprovalVote> existingOpt = voteRepository.findByMaintenanceRequestIdAndMemberId(maintenanceId, member.getId());
        MaintenanceApprovalVote vote;
        if (existingOpt.isPresent()) {
            vote = existingOpt.get();
            vote.setDecision(voteRequest.getDecision());
            vote.setVotingWeight(share.getPercentage());
            vote.setComment(voteRequest.getComment() != null ? voteRequest.getComment().trim() : null);
            vote.setUpdatedAt(Instant.now());
        } else {
            vote = new MaintenanceApprovalVote(
                    UUID.randomUUID(),
                    maintenance,
                    group,
                    member,
                    principal.getUser(),
                    voteRequest.getDecision(),
                    share.getPercentage(),
                    voteRequest.getComment() != null ? voteRequest.getComment().trim() : null
            );
        }
        voteRepository.save(vote);

        // Recalculate weights, evaluate threshold, update request status if reached
        return recalculateApprovalState(maintenance, group.getId(), vehicleId, principal.getId());
    }

    /**
     * Schedule a maintenance request.
     * If PENDING_APPROVAL: records proposed schedule, but keeps PENDING_APPROVAL.
     * If APPROVED or SCHEDULED: transitions to SCHEDULED.
     */
    @Transactional
    public MaintenanceResponse scheduleMaintenance(
            UUID maintenanceId,
            ScheduleMaintenanceRequest request,
            UUID actorId,
            Role actorRole
    ) {
        if (actorRole != Role.STAFF && actorRole != Role.ADMIN) {
            throw new AccessDeniedException("Chỉ Nhân viên hoặc Quản trị viên mới có quyền lên lịch bảo dưỡng.");
        }

        MaintenanceRequest maintenance = maintenanceRequestRepository.findByIdWithDetails(maintenanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu bảo dưỡng không tồn tại: " + maintenanceId));

        if (maintenance.getStatus() != MaintenanceStatus.PENDING_APPROVAL
                && maintenance.getStatus() != MaintenanceStatus.APPROVED
                && maintenance.getStatus() != MaintenanceStatus.SCHEDULED) {
            throw new IllegalStateException("Không thể lên lịch bảo dưỡng vì yêu cầu đang ở trạng thái: " + maintenance.getStatus());
        }

        maintenance.setScheduledAt(request.getScheduledAt());
        if (request.getAssignedStaffId() != null) {
            User staff = userRepository.findById(request.getAssignedStaffId())
                    .orElseThrow(() -> new ResourceNotFoundException("Nhân viên phụ trách không tồn tại: " + request.getAssignedStaffId()));
            maintenance.setAssignedStaff(staff);
        }

        // Only transition to SCHEDULED if already APPROVED or already SCHEDULED
        if (maintenance.getStatus() == MaintenanceStatus.APPROVED || maintenance.getStatus() == MaintenanceStatus.SCHEDULED) {
            maintenance.setStatus(MaintenanceStatus.SCHEDULED);
        }

        MaintenanceRequest saved = maintenanceRequestRepository.save(maintenance);
        return MaintenanceResponse.fromEntity(saved);
    }

    /**
     * Start maintenance work (APPROVED or valid SCHEDULED -> IN_PROGRESS).
     * Enforces co-owner approval gate: returns HTTP 409 if still PENDING_APPROVAL.
     * Transactionally updates linked DamageRecord rows from OPEN to UNDER_MAINTENANCE.
     * Transitions Vehicle.status -> MAINTENANCE.
     */
    @Transactional
    public MaintenanceResponse startMaintenance(
            UUID maintenanceId,
            UUID actorId,
            Role actorRole
    ) {
        if (actorRole != Role.STAFF && actorRole != Role.ADMIN) {
            throw new AccessDeniedException("Chỉ Nhân viên hoặc Quản trị viên mới có quyền bắt đầu bảo dưỡng.");
        }

        MaintenanceRequest maintenance = maintenanceRequestRepository.findByIdWithDetails(maintenanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu bảo dưỡng không tồn tại: " + maintenanceId));

        // Strict Approval Gate
        if (maintenance.getStatus() == MaintenanceStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Yêu cầu bảo dưỡng chưa được các đồng sở hữu phê duyệt.");
        }

        if (maintenance.getStatus() != MaintenanceStatus.APPROVED && maintenance.getStatus() != MaintenanceStatus.SCHEDULED) {
            throw new IllegalStateException("Không thể bắt đầu bảo dưỡng vì yêu cầu đang ở trạng thái: " + maintenance.getStatus());
        }

        // Concurrency Check: Only 1 maintenance request can be IN_PROGRESS simultaneously per vehicle
        UUID vehicleId = maintenance.getVehicle().getId();
        boolean alreadyInProgress = maintenanceRequestRepository.existsByVehicleIdAndStatus(
                vehicleId,
                MaintenanceStatus.IN_PROGRESS
        );
        if (alreadyInProgress) {
            throw new IllegalStateException("Xe đang có một yêu cầu bảo dưỡng khác đang được xử lý.");
        }

        // Set status and start timestamp
        maintenance.setStatus(MaintenanceStatus.IN_PROGRESS);
        if (maintenance.getStartedAt() == null) {
            maintenance.setStartedAt(Instant.now());
        }

        // Assign staff if unassigned
        if (maintenance.getAssignedStaff() == null) {
            userRepository.findById(actorId).ifPresent(maintenance::setAssignedStaff);
        }

        // Update Vehicle status to MAINTENANCE
        Vehicle vehicle = maintenance.getVehicle();
        vehicle.setStatus(VehicleStatus.MAINTENANCE);
        vehicleRepository.save(vehicle);

        // Transactionally advance linked damage records: OPEN -> UNDER_MAINTENANCE
        if (maintenance.getDamageRecords() != null) {
            for (DamageRecord damage : maintenance.getDamageRecords()) {
                if (damage.getStatus() == DamageStatus.OPEN) {
                    damage.setStatus(DamageStatus.UNDER_MAINTENANCE);
                    damageRecordRepository.save(damage);
                }
            }
        }

        MaintenanceRequest saved = maintenanceRequestRepository.save(maintenance);
        return MaintenanceResponse.fromEntity(saved);
    }

    /**
     * Complete maintenance work (IN_PROGRESS -> COMPLETED).
     * Transactionally resolves linked DamageRecord rows: UNDER_MAINTENANCE -> RESOLVED.
     * Records resolvedAt and resolvedByMaintenanceRequestId without deleting rows.
     * Recalculates vehicle availability.
     */
    @Transactional
    public MaintenanceResponse completeMaintenance(
            UUID maintenanceId,
            CompleteMaintenanceRequest request,
            UUID actorId,
            Role actorRole
    ) {
        if (actorRole != Role.STAFF && actorRole != Role.ADMIN) {
            throw new AccessDeniedException("Chỉ Nhân viên hoặc Quản trị viên mới có quyền hoàn tất bảo dưỡng.");
        }

        MaintenanceRequest maintenance = maintenanceRequestRepository.findByIdWithDetails(maintenanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu bảo dưỡng không tồn tại: " + maintenanceId));

        if (maintenance.getStatus() != MaintenanceStatus.IN_PROGRESS) {
            throw new IllegalStateException("Chỉ có thể hoàn tất yêu cầu bảo dưỡng đang trong tiến trình xử lý (IN_PROGRESS). Trạng thái hiện tại: " + maintenance.getStatus());
        }

        maintenance.setStatus(MaintenanceStatus.COMPLETED);
        Instant now = Instant.now();
        maintenance.setCompletedAt(now);
        if (request != null && request.getCompletionNote() != null) {
            maintenance.setCompletionNote(request.getCompletionNote().trim());
        }

        // Transactionally resolve all linked damage records (Requirement 18: DO NOT delete rows)
        if (maintenance.getDamageRecords() != null) {
            for (DamageRecord damage : maintenance.getDamageRecords()) {
                damage.setStatus(DamageStatus.RESOLVED);
                damage.setResolvedAt(now);
                damage.setResolvedByMaintenanceRequestId(maintenance.getId());
                damageRecordRepository.save(damage);
            }
        }

        MaintenanceRequest saved = maintenanceRequestRepository.save(maintenance);

        // Vehicle availability check: verify no other active IN_PROGRESS maintenance
        Vehicle vehicle = maintenance.getVehicle();
        List<MaintenanceRequest> activeRequests = maintenanceRequestRepository.findByVehicleIdAndStatus(
                vehicle.getId(),
                MaintenanceStatus.IN_PROGRESS
        );

        boolean hasOtherActive = activeRequests.stream().anyMatch(r -> !r.getId().equals(maintenance.getId()));
        if (!hasOtherActive) {
            boolean hasActiveTrip = tripRepository.existsByVehicleIdAndStatus(vehicle.getId(), TripStatus.ACTIVE);
            if (hasActiveTrip) {
                vehicle.setStatus(VehicleStatus.IN_USE);
            } else {
                vehicle.setStatus(VehicleStatus.AVAILABLE);
            }
            vehicleRepository.save(vehicle);
        }

        return MaintenanceResponse.fromEntity(saved);
    }

    /**
     * Cancel a maintenance request (PENDING_APPROVAL, APPROVED or SCHEDULED -> CANCELLED).
     */
    @Transactional
    public MaintenanceResponse cancelMaintenance(
            UUID maintenanceId,
            UUID actorId,
            Role actorRole
    ) {
        if (actorRole != Role.STAFF && actorRole != Role.ADMIN) {
            throw new AccessDeniedException("Chỉ Nhân viên hoặc Quản trị viên mới có quyền hủy yêu cầu bảo dưỡng.");
        }

        MaintenanceRequest maintenance = maintenanceRequestRepository.findByIdWithDetails(maintenanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu bảo dưỡng không tồn tại: " + maintenanceId));

        if (maintenance.getStatus() == MaintenanceStatus.COMPLETED) {
            throw new IllegalStateException("Không thể hủy yêu cầu bảo dưỡng đã hoàn tất.");
        }

        if (maintenance.getStatus() == MaintenanceStatus.IN_PROGRESS) {
            throw new IllegalStateException("Không thể hủy yêu cầu bảo dưỡng đang trong tiến trình thực hiện.");
        }

        if (maintenance.getStatus() == MaintenanceStatus.CANCELLED) {
            return MaintenanceResponse.fromEntity(maintenance);
        }

        maintenance.setStatus(MaintenanceStatus.CANCELLED);
        MaintenanceRequest saved = maintenanceRequestRepository.save(maintenance);
        return MaintenanceResponse.fromEntity(saved);
    }

    /**
     * Recalculates approval weights and updates request status if threshold reached.
     */
    @Transactional
    public MaintenanceApprovalResponse recalculateApprovalState(
            MaintenanceRequest maintenance,
            UUID groupId,
            UUID vehicleId,
            UUID currentUserId
    ) {
        List<MaintenanceApprovalVote> votes = voteRepository.findByMaintenanceRequestId(maintenance.getId());

        BigDecimal approveWeight = BigDecimal.ZERO;
        BigDecimal rejectWeight = BigDecimal.ZERO;

        for (MaintenanceApprovalVote v : votes) {
            if (v.getDecision() == VoteDecision.APPROVE) {
                approveWeight = approveWeight.add(v.getVotingWeight());
            } else if (v.getDecision() == VoteDecision.REJECT) {
                rejectWeight = rejectWeight.add(v.getVotingWeight());
            }
        }

        BigDecimal totalShares = ownershipShareRepository.sumPercentageByGroupIdAndVehicleId(groupId, vehicleId);
        if (totalShares == null || totalShares.compareTo(BigDecimal.ZERO) <= 0) {
            totalShares = new BigDecimal("100.00");
        }

        BigDecimal pendingWeight = totalShares.subtract(approveWeight).subtract(rejectWeight);
        if (pendingWeight.compareTo(BigDecimal.ZERO) < 0) {
            pendingWeight = BigDecimal.ZERO;
        }

        // Authoritative decision logic (Requirements 5 & 6)
        if (maintenance.getStatus() == MaintenanceStatus.PENDING_APPROVAL) {
            if (approveWeight.compareTo(MAINTENANCE_APPROVAL_THRESHOLD) > 0) {
                maintenance.setStatus(MaintenanceStatus.APPROVED);
                maintenance.setApprovedAt(Instant.now());
                maintenance.setApprovedWeight(approveWeight);
                maintenanceRequestRepository.save(maintenance);
            } else if (rejectWeight.compareTo(MAINTENANCE_APPROVAL_THRESHOLD) >= 0) {
                maintenance.setStatus(MaintenanceStatus.REJECTED);
                maintenanceRequestRepository.save(maintenance);
            }
        }

        return buildApprovalResponseInternal(maintenance, groupId, vehicleId, currentUserId, votes, approveWeight, rejectWeight, pendingWeight);
    }

    private MaintenanceApprovalResponse buildApprovalResponse(
            MaintenanceRequest maintenance,
            UUID groupId,
            UUID vehicleId,
            UUID currentUserId
    ) {
        List<MaintenanceApprovalVote> votes = voteRepository.findByMaintenanceRequestId(maintenance.getId());

        BigDecimal approveWeight = BigDecimal.ZERO;
        BigDecimal rejectWeight = BigDecimal.ZERO;

        for (MaintenanceApprovalVote v : votes) {
            if (v.getDecision() == VoteDecision.APPROVE) {
                approveWeight = approveWeight.add(v.getVotingWeight());
            } else if (v.getDecision() == VoteDecision.REJECT) {
                rejectWeight = rejectWeight.add(v.getVotingWeight());
            }
        }

        BigDecimal totalShares = ownershipShareRepository.sumPercentageByGroupIdAndVehicleId(groupId, vehicleId);
        if (totalShares == null || totalShares.compareTo(BigDecimal.ZERO) <= 0) {
            totalShares = new BigDecimal("100.00");
        }

        BigDecimal pendingWeight = totalShares.subtract(approveWeight).subtract(rejectWeight);
        if (pendingWeight.compareTo(BigDecimal.ZERO) < 0) {
            pendingWeight = BigDecimal.ZERO;
        }

        return buildApprovalResponseInternal(maintenance, groupId, vehicleId, currentUserId, votes, approveWeight, rejectWeight, pendingWeight);
    }

    private MaintenanceApprovalResponse buildApprovalResponseInternal(
            MaintenanceRequest maintenance,
            UUID groupId,
            UUID vehicleId,
            UUID currentUserId,
            List<MaintenanceApprovalVote> votes,
            BigDecimal approveWeight,
            BigDecimal rejectWeight,
            BigDecimal pendingWeight
    ) {
        MaintenanceApprovalResponse response = new MaintenanceApprovalResponse();
        response.setMaintenanceRequestId(maintenance.getId());
        response.setVehicleId(vehicleId);
        response.setStatus(maintenance.getStatus());
        response.setApproveWeight(approveWeight);
        response.setRejectWeight(rejectWeight);
        response.setPendingWeight(pendingWeight);
        response.setRequiredThreshold(MAINTENANCE_APPROVAL_THRESHOLD);
        response.setApprovedAt(maintenance.getApprovedAt());
        response.setApprovedWeight(maintenance.getApprovedWeight());

        if (currentUserId != null) {
            Optional<MaintenanceApprovalVote> myVote = votes.stream()
                    .filter(v -> v.getUser() != null && currentUserId.equals(v.getUser().getId()))
                    .findFirst();
            if (myVote.isPresent()) {
                response.setCurrentUserVote(myVote.get().getDecision());
                response.setCurrentUserWeight(myVote.get().getVotingWeight());
                response.setEligibleToVote(true);
            } else {
                try {
                    GroupMember member = memberRepository.findByGroupIdAndUserId(groupId, currentUserId).orElse(null);
                    if (member != null && member.getStatus() == MemberStatus.ACTIVE && member.getRemovedAt() == null) {
                        OwnershipShare share = ownershipShareRepository.findByGroupIdAndVehicleIdAndMemberId(groupId, vehicleId, member.getId())
                                .or(() -> ownershipShareRepository.findByMemberIdAndVehicleId(member.getId(), vehicleId)).orElse(null);
                        if (share != null && share.getPercentage() != null && share.getPercentage().compareTo(BigDecimal.ZERO) > 0) {
                            response.setCurrentUserWeight(share.getPercentage());
                            response.setEligibleToVote(true);
                        }
                    }
                } catch (Exception ignored) {
                }
            }
        }

        response.setVotes(votes.stream()
                .map(MaintenanceVoteSummaryDto::fromEntity)
                .collect(Collectors.toList()));

        return response;
    }

    private CoOwnershipGroup getActiveGroupForVehicle(UUID vehicleId) {
        return coOwnershipGroupRepository.findByVehicleId(vehicleId)
                .or(() -> {
                    List<CoOwnershipGroup> list = coOwnershipGroupRepository.findActiveGroupsByVehicleId(vehicleId);
                    return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
                })
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhóm đồng sở hữu hoạt động cho xe: " + vehicleId));
    }

    private GroupMember getActiveGroupMember(UUID groupId, UUID userId) {
        GroupMember member = memberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new AccessDeniedException("Bạn không phải là thành viên của nhóm đồng sở hữu quản lý phương tiện này."));

        if (member.getStatus() != MemberStatus.ACTIVE || member.getRemovedAt() != null) {
            throw new AccessDeniedException("Tài khoản của bạn trong nhóm đồng sở hữu không ở trạng thái hoạt động.");
        }
        return member;
    }

    private OwnershipShare getActiveOwnershipShare(UUID groupId, UUID vehicleId, UUID memberId) {
        OwnershipShare share = ownershipShareRepository.findByGroupIdAndVehicleIdAndMemberId(groupId, vehicleId, memberId)
                .or(() -> ownershipShareRepository.findByMemberIdAndVehicleId(memberId, vehicleId))
                .orElseThrow(() -> new AccessDeniedException("Bạn không có tỷ lệ sở hữu hợp lệ đối với phương tiện này để tham gia biểu quyết."));

        if (share.getPercentage() == null || share.getPercentage().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AccessDeniedException("Tỷ lệ sở hữu của bạn là 0%, không có quyền biểu quyết.");
        }
        return share;
    }

    /**
     * Authoritative vehicle access validation for CO_OWNER role.
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
            throw new AccessDeniedException("Bạn không có quyền truy cập thông tin bảo dưỡng của xe này.");
        }
    }
}
