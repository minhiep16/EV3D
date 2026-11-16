package com.evshare.maintenance.service;

import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.common.exception.UnauthorizedException;
import com.evshare.damage.dto.DamageRecordResponse;
import com.evshare.damage.entity.DamageRecord;
import com.evshare.damage.entity.DamageStatus;
import com.evshare.damage.repository.DamageRecordRepository;
import com.evshare.expense.entity.*;
import com.evshare.expense.repository.ExpenseRepository;
import com.evshare.expense.service.ExpenseShareService;
import com.evshare.fund.dto.CommonDisbursementRequest;
import com.evshare.fund.entity.SharedFund;
import com.evshare.fund.repository.SharedFundRepository;
import com.evshare.fund.service.SharedFundService;
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
    private final ExpenseRepository expenseRepository;
    private final ExpenseShareService expenseShareService;
    private final SharedFundService sharedFundService;
    private final SharedFundRepository sharedFundRepository;

    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.evshare.voting.service.VoteProposalService voteProposalService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.evshare.voting.repository.VoteProposalRepository voteProposalRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.evshare.notification.service.NotificationService notificationService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.evshare.inspection.repository.VehicleInspectionRepository vehicleInspectionRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.evshare.inspection.repository.VehicleInspectionItemRepository vehicleInspectionItemRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.evshare.charging.repository.ChargingSessionRepository chargingSessionRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.evshare.handover.repository.VehicleHandoverRepository vehicleHandoverRepository;

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
            CoOwnershipGroupRepository coOwnershipGroupRepository,
            ExpenseRepository expenseRepository,
            ExpenseShareService expenseShareService,
            SharedFundService sharedFundService,
            SharedFundRepository sharedFundRepository
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
        this.expenseRepository = expenseRepository;
        this.expenseShareService = expenseShareService;
        this.sharedFundService = sharedFundService;
        this.sharedFundRepository = sharedFundRepository;
    }

    /**
     * Get all maintenance requests for a vehicle, sorted newest first.
     */
    @Transactional
    public List<MaintenanceResponse> getVehicleMaintenance(UUID vehicleId, UserPrincipal principal) {
        validateVehicleAccess(vehicleId, principal);

        if (!vehicleRepository.existsById(vehicleId)) {
            throw new ResourceNotFoundException("Xe không tồn tại trong hệ thống: " + vehicleId);
        }

        // Idempotently reconcile any approved voting maintenance proposals missing execution records
        if (voteProposalService != null) {
            try {
                voteProposalService.reconcileApprovedProposals(vehicleId);
            } catch (Exception ignored) {
            }
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
     * STAFF / ADMIN / CO_OWNER creates a new maintenance request.
     * New requests start in PENDING_APPROVAL status requiring co-owner approval before starting.
     */
    @Transactional
    public MaintenanceResponse createMaintenance(
            UUID vehicleId,
            CreateMaintenanceRequest request,
            UUID actorId,
            Role actorRole
    ) {
        if (actorRole != Role.STAFF && actorRole != Role.ADMIN && actorRole != Role.CO_OWNER) {
            throw new AccessDeniedException("Chỉ Nhân viên, Quản trị viên hoặc Đồng sở hữu mới có quyền tạo yêu cầu bảo dưỡng.");
        }

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Xe không tồn tại trong hệ thống: " + vehicleId));

        if (actorRole == Role.CO_OWNER) {
            CoOwnershipGroup group = getActiveGroupForVehicle(vehicleId);
            getActiveGroupMember(group.getId(), actorId);
        }

        User creator = userRepository.findById(actorId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại: " + actorId));

        User assignedStaff = null;
        if (request.getAssignedStaffId() != null) {
            assignedStaff = userRepository.findById(request.getAssignedStaffId())
                    .orElseThrow(() -> new ResourceNotFoundException("Nhân viên phụ trách không tồn tại: " + request.getAssignedStaffId()));
        }

        String desc = request.getDescription() != null ? request.getDescription().trim() : "";
        if (request.getEstimatedCost() != null && request.getEstimatedCost().compareTo(BigDecimal.ZERO) > 0) {
            desc = (desc.isBlank() ? "" : desc + " | ") + "Dự toán chi phí: " + request.getEstimatedCost().setScale(0, java.math.RoundingMode.HALF_UP) + " VND";
        }

        // Duplicate Request Prevention & Backend Idempotency (Section 6)
        if (request.getDamageRecordIds() != null && !request.getDamageRecordIds().isEmpty()) {
            List<MaintenanceRequest> existingRequests = maintenanceRequestRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId);
            for (MaintenanceRequest existing : existingRequests) {
                if (existing.getStatus() != MaintenanceStatus.COMPLETED
                        && existing.getStatus() != MaintenanceStatus.CANCELLED
                        && existing.getStatus() != MaintenanceStatus.REJECTED) {
                    if (existing.getDamageRecords() != null) {
                        for (DamageRecord dr : existing.getDamageRecords()) {
                            if (request.getDamageRecordIds().contains(dr.getId())) {
                                return MaintenanceResponse.fromEntity(existing);
                            }
                        }
                    }
                }
            }
        }

        MaintenanceRequest maintenance = new MaintenanceRequest(
                UUID.randomUUID(),
                vehicle,
                MaintenanceStatus.PENDING_APPROVAL,
                request.getPriority() != null ? request.getPriority() : MaintenancePriority.MEDIUM,
                request.getMaintenanceType() != null ? request.getMaintenanceType() : MaintenanceType.PREVENTIVE,
                request.getTitle().trim(),
                desc.isBlank() ? null : desc,
                request.getScheduledAt(),
                creator,
                assignedStaff
        );

        // Associate damage records if provided
        Set<DamageRecord> validDamages = new HashSet<>();
        if (request.getDamageRecordIds() != null && !request.getDamageRecordIds().isEmpty()) {
            List<DamageRecord> damages = damageRecordRepository.findAllById(request.getDamageRecordIds());
            if (damages.size() != request.getDamageRecordIds().size()) {
                throw new ResourceNotFoundException("Một hoặc nhiều bản ghi hư hỏng không tồn tại trong hệ thống.");
            }
            for (DamageRecord damage : damages) {
                if (damage.getVehicle() == null || !damage.getVehicle().getId().equals(vehicleId)) {
                    throw new IllegalArgumentException("Hư hỏng không thuộc về phương tiện đã chọn: " + damage.getId());
                }
                if (damage.getStatus() == DamageStatus.RESOLVED) {
                    throw new IllegalStateException("Hư hỏng đã được khắc phục (RESOLVED), không thể tạo đề xuất sửa chữa mới: " + damage.getId());
                }
                validDamages.add(damage);
            }
        }

        // Support preliminary findings (VehicleInspectionItem) directly
        if (request.getInspectionItemIds() != null && !request.getInspectionItemIds().isEmpty() && vehicleInspectionItemRepository != null) {
            List<com.evshare.inspection.entity.VehicleInspectionItem> items = vehicleInspectionItemRepository.findAllById(request.getInspectionItemIds());
            for (com.evshare.inspection.entity.VehicleInspectionItem item : items) {
                if (item.getConditionStatus() == null || item.getConditionStatus() == com.evshare.inspection.entity.InspectionItemCondition.GOOD) {
                    continue;
                }
                String canonicalCode = com.evshare.inspection.service.VehicleInspectionService.normalizeCanonicalPartCode(item.getVehiclePartCode());
                List<DamageRecord> existingUnresolved = damageRecordRepository
                        .findByVehicleIdAndVehiclePartCodeAndStatusNot(vehicleId, canonicalCode, DamageStatus.RESOLVED);
                if (!existingUnresolved.isEmpty()) {
                    validDamages.addAll(existingUnresolved);
                } else {
                    com.evshare.damage.entity.DamageType damageType = switch (item.getConditionStatus()) {
                        case CRACK -> com.evshare.damage.entity.DamageType.CRACK;
                        case DENT -> com.evshare.damage.entity.DamageType.DENT;
                        case SCRATCH -> com.evshare.damage.entity.DamageType.SCRATCH;
                        default -> com.evshare.damage.entity.DamageType.OTHER;
                    };
                    com.evshare.damage.entity.DamageSeverity severity = switch (item.getConditionStatus()) {
                        case CRACK -> com.evshare.damage.entity.DamageSeverity.SEVERE;
                        case DENT -> com.evshare.damage.entity.DamageSeverity.MODERATE;
                        case SCRATCH -> com.evshare.damage.entity.DamageSeverity.MINOR;
                        default -> com.evshare.damage.entity.DamageSeverity.MODERATE;
                    };
                    BigDecimal[] coords = com.evshare.inspection.service.VehicleInspectionService.getCanonicalPartCoordinates(canonicalCode);
                    String note = (item.getNote() != null && !item.getNote().isBlank())
                            ? item.getNote().trim()
                            : "Ghi nhận từ phát hiện sơ bộ 3D (" + item.getConditionStatus().name() + ")";
                    if (note.length() > 1000) {
                        note = note.substring(0, 1000);
                    }
                    DamageRecord newDamage = new DamageRecord(
                            UUID.randomUUID(),
                            vehicle,
                            null,
                            null,
                            null,
                            canonicalCode,
                            damageType,
                            severity,
                            note,
                            coords[0],
                            coords[1],
                            coords[2],
                            creator
                    );
                    newDamage.setStatus(DamageStatus.OPEN);
                    DamageRecord savedDamage = damageRecordRepository.save(newDamage);
                    validDamages.add(savedDamage);
                }
            }
        }

        if (!validDamages.isEmpty()) {
            maintenance.setDamageRecords(validDamages);
        }

        MaintenanceRequest saved = maintenanceRequestRepository.save(maintenance);

        // Unify with Central Voting System: auto-create and link authoritative VoteProposal when pending approval
        if (saved.getStatus() == MaintenanceStatus.PENDING_APPROVAL) {
            try {
                if (voteProposalService != null) {
                    UserPrincipal creatorPrincipal = new UserPrincipal(creator);
                    com.evshare.voting.dto.VoteProposalResponse propRes = voteProposalService.createVoteForMaintenance(saved.getId(), creatorPrincipal);
                    if (propRes != null) {
                        saved.setRelatedProposalId(propRes.id());
                        saved = maintenanceRequestRepository.save(saved);
                    }
                }
            } catch (Exception ignored) {
            }
        }

        if (notificationService != null) {
            try {
                CoOwnershipGroup grp = getActiveGroupForVehicle(saved.getVehicle().getId());
                if (grp != null) {
                    notificationService.notifyProposalAwaitingVote(
                            saved.getVehicle().getId(),
                            grp.getId(),
                            saved.getId(),
                            saved.getTitle()
                    );
                }
            } catch (Exception ignored) {
            }
        }

        return MaintenanceResponse.fromEntity(saved);
    }

    /**
     * Get approval summary and votes for a maintenance request.
     * Uses authoritative VoteProposal data if linked.
     */
    @Transactional(readOnly = true)
    public MaintenanceApprovalResponse getMaintenanceApproval(UUID maintenanceId, UserPrincipal principal) {
        MaintenanceRequest maintenance = maintenanceRequestRepository.findByIdWithDetails(maintenanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu bảo dưỡng không tồn tại: " + maintenanceId));

        validateVehicleAccess(maintenance.getVehicle().getId(), principal);

        UUID vehicleId = maintenance.getVehicle().getId();
        CoOwnershipGroup group = getActiveGroupForVehicle(vehicleId);
        UUID currentUserId = principal != null ? principal.getId() : null;

        // If linked to authoritative VoteProposal, build response from central VoteProposal data
        if (maintenance.getRelatedProposalId() != null && voteProposalRepository != null) {
            Optional<com.evshare.voting.entity.VoteProposal> propOpt = voteProposalRepository.findById(maintenance.getRelatedProposalId());
            if (propOpt.isPresent()) {
                return buildApprovalResponseFromProposal(maintenance, propOpt.get(), group.getId(), vehicleId, currentUserId);
            }
        }

        return buildApprovalResponse(maintenance, group.getId(), vehicleId, currentUserId);
    }

    /**
     * CO_OWNER casts or updates their approval vote on a maintenance request.
     * Delegates to authoritative VoteProposalService as Single Source of Truth.
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

        // Delegate to authoritative VoteProposalService as Single Source of Truth
        if (voteProposalService != null) {
            UUID proposalId = maintenance.getRelatedProposalId();
            if (proposalId == null) {
                try {
                    com.evshare.voting.dto.VoteProposalResponse propRes = voteProposalService.createVoteForMaintenance(maintenanceId, principal);
                    if (propRes != null) {
                        proposalId = propRes.id();
                        maintenance.setRelatedProposalId(proposalId);
                        maintenance = maintenanceRequestRepository.save(maintenance);
                    }
                } catch (Exception ignored) {
                }
            }

            if (proposalId != null) {
                com.evshare.voting.entity.ProposalVoteChoice choice = switch (voteRequest.getDecision()) {
                    case APPROVE -> com.evshare.voting.entity.ProposalVoteChoice.APPROVE;
                    case REJECT -> com.evshare.voting.entity.ProposalVoteChoice.REJECT;
                    case ABSTAIN -> com.evshare.voting.entity.ProposalVoteChoice.ABSTAIN;
                };

                voteProposalService.castVote(proposalId, new com.evshare.voting.dto.CastProposalVoteRequest(choice, voteRequest.getComment()), principal);
            }
        }

        // Also synchronize legacy MaintenanceApprovalVote for backward compatibility
        try {
            GroupMember member = getActiveGroupMember(group.getId(), principal.getId());
            OwnershipShare share = getActiveOwnershipShare(group.getId(), vehicleId, member.getId());

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
        } catch (Exception ignored) {
        }

        return getMaintenanceApproval(maintenanceId, principal);
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

        if (notificationService != null) {
            try {
                CoOwnershipGroup grp = getActiveGroupForVehicle(saved.getVehicle().getId());
                notificationService.notifyStaffScheduledRepair(
                        saved.getVehicle().getId(),
                        grp != null ? grp.getId() : null,
                        saved.getId(),
                        saved.getScheduledAt() != null ? saved.getScheduledAt().toString() : "kế hoạch"
                );
            } catch (Exception ignored) {
            }
        }

        return MaintenanceResponse.fromEntity(saved);
    }

    /**
     * Authoritative vehicle status resolver based on business conditions:
     * - Active maintenance restrictions -> MAINTENANCE
     * - Active trip -> IN_USE
     * - Active charging session -> CHARGING
     * - Active handover (HANDED_OVER -> IN_USE; READY/PREP/INSPECTION -> RESERVED)
     * - Unresolved safety-critical damage -> UNAVAILABLE
     * - Otherwise -> AVAILABLE
     */
    @Transactional
    public VehicleStatus resolveAndApplyVehicleStatus(Vehicle vehicle) {
        if (vehicle == null) return VehicleStatus.AVAILABLE;
        UUID vId = vehicle.getId();

        // 1. Maintenance restrictions
        boolean hasActiveMaintenance = maintenanceRequestRepository.existsByVehicleIdAndStatus(vId, MaintenanceStatus.IN_PROGRESS);
        if (hasActiveMaintenance) {
            vehicle.setStatus(VehicleStatus.MAINTENANCE);
            vehicleRepository.save(vehicle);
            return VehicleStatus.MAINTENANCE;
        }

        // 2. Active Trip
        boolean hasActiveTrip = tripRepository.existsByVehicleIdAndStatus(vId, TripStatus.ACTIVE);
        if (hasActiveTrip) {
            vehicle.setStatus(VehicleStatus.IN_USE);
            vehicleRepository.save(vehicle);
            return VehicleStatus.IN_USE;
        }

        // 3. Charging Session
        if (chargingSessionRepository != null) {
            boolean hasActiveCharging = chargingSessionRepository.existsByVehicleIdAndStatus(vId, com.evshare.charging.entity.ChargingSessionStatus.ACTIVE);
            if (hasActiveCharging) {
                vehicle.setStatus(VehicleStatus.CHARGING);
                vehicleRepository.save(vehicle);
                return VehicleStatus.CHARGING;
            }
        }

        // 4. Active Handover
        if (vehicleHandoverRepository != null) {
            List<com.evshare.handover.entity.VehicleHandover> activeHandovers = vehicleHandoverRepository.findActiveByVehicleId(vId);
            if (!activeHandovers.isEmpty()) {
                com.evshare.handover.entity.VehicleHandover ho = activeHandovers.get(0);
                if (ho.getStatus() == com.evshare.handover.entity.HandoverStatus.HANDED_OVER
                        || ho.getStatus() == com.evshare.handover.entity.HandoverStatus.OWNER_CONFIRMED) {
                    vehicle.setStatus(VehicleStatus.IN_USE);
                    vehicleRepository.save(vehicle);
                    return VehicleStatus.IN_USE;
                } else if (ho.getStatus() == com.evshare.handover.entity.HandoverStatus.READY_FOR_HANDOVER
                        || ho.getStatus() == com.evshare.handover.entity.HandoverStatus.INSPECTION_IN_PROGRESS
                        || ho.getStatus() == com.evshare.handover.entity.HandoverStatus.PENDING_PREPARATION) {
                    vehicle.setStatus(VehicleStatus.RESERVED);
                    vehicleRepository.save(vehicle);
                    return VehicleStatus.RESERVED;
                }
            }
        }

        // 5. Unresolved safety-critical damage
        List<DamageRecord> unresolved = damageRecordRepository.findByVehicleIdAndStatusNot(vId, DamageStatus.RESOLVED);
        boolean hasSevereDamage = unresolved.stream().anyMatch(d -> d.getSeverity() == com.evshare.damage.entity.DamageSeverity.SEVERE);
        if (hasSevereDamage) {
            vehicle.setStatus(VehicleStatus.UNAVAILABLE);
            vehicleRepository.save(vehicle);
            return VehicleStatus.UNAVAILABLE;
        }

        // 6. Otherwise Available
        vehicle.setStatus(VehicleStatus.AVAILABLE);
        vehicleRepository.save(vehicle);
        return VehicleStatus.AVAILABLE;
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

        // Strict Approval Gate (Section 14: Common expense voting gate)
        if (maintenance.getStatus() == MaintenanceStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Đề xuất chưa được các thành viên thông qua.");
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

        if (notificationService != null) {
            try {
                CoOwnershipGroup grp = getActiveGroupForVehicle(saved.getVehicle().getId());
                notificationService.notifyStaffRepairStarted(
                        saved.getVehicle().getId(),
                        grp != null ? grp.getId() : null,
                        saved.getId()
                );
            } catch (Exception ignored) {
            }
        }

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

        // Section 17: Completion Inspection Gate (PASSED, FAILED, REQUIRES_REWORK)
        if (request != null && request.getInspectionResult() != null) {
            String ir = request.getInspectionResult().trim().toUpperCase();
            if (ir.equals("FAILED") || ir.equals("REQUIRES_REWORK")) {
                String reworkNote = "Nghiệm thu: " + (ir.equals("FAILED") ? "KHÔNG ĐẠT" : "CẦN SỬA LẠI");
                if (request.getCompletionNote() != null && !request.getCompletionNote().isBlank()) {
                    reworkNote += " - " + request.getCompletionNote().trim();
                }
                maintenance.setCompletionNote(reworkNote);
                MaintenanceRequest saved = maintenanceRequestRepository.save(maintenance);

                if (notificationService != null) {
                    try {
                        CoOwnershipGroup grp = getActiveGroupForVehicle(saved.getVehicle().getId());
                        notificationService.notifyRepairInspectionFailed(
                                saved.getVehicle().getId(),
                                grp != null ? grp.getId() : null,
                                saved.getId(),
                                request.getCompletionNote()
                        );
                    } catch (Exception ignored) {
                    }
                }

                return MaintenanceResponse.fromEntity(saved);
            }
        }

        maintenance.setStatus(MaintenanceStatus.COMPLETED);
        Instant now = Instant.now();
        maintenance.setCompletedAt(now);

        // Build audit completion note
        StringBuilder noteBuilder = new StringBuilder();
        noteBuilder.append("Nghiệm thu: ĐẠT (PASSED)");
        if (request != null) {
            if (request.getPerformedWork() != null && !request.getPerformedWork().isBlank()) {
                noteBuilder.append(" | Công việc: ").append(request.getPerformedWork().trim());
            }
            if (request.getReplacedParts() != null && !request.getReplacedParts().isBlank()) {
                noteBuilder.append(" | Phụ tùng: ").append(request.getReplacedParts().trim());
            }
            if (request.getFinalOdometer() != null && request.getFinalOdometer().compareTo(BigDecimal.ZERO) > 0) {
                noteBuilder.append(" | ODO: ").append(request.getFinalOdometer()).append(" km");
                maintenance.getVehicle().setOdometer(request.getFinalOdometer());
                vehicleRepository.save(maintenance.getVehicle());
            }
            if (request.getActualCost() != null && request.getActualCost().compareTo(BigDecimal.ZERO) > 0) {
                noteBuilder.append(" | Chi phí thực tế: ").append(request.getActualCost().setScale(0, java.math.RoundingMode.HALF_UP)).append(" VND");
            }
            if (request.getCompletionNote() != null && !request.getCompletionNote().isBlank()) {
                noteBuilder.append(" | Ghi chú: ").append(request.getCompletionNote().trim());
            }
        }
        maintenance.setCompletionNote(noteBuilder.toString());

        // Transactionally resolve explicitly linked damage records (Requirement 18: DO NOT delete rows)
        java.util.Set<String> resolvedExplicitParts = new java.util.HashSet<>();

        if (maintenance.getDamageRecords() != null) {
            for (DamageRecord damage : maintenance.getDamageRecords()) {
                // Temporal integrity: Do not resolve newer defects created after maintenance completion
                if (damage.getCreatedAt() != null && damage.getCreatedAt().isAfter(now)) {
                    continue;
                }
                if (damage.getStatus() == DamageStatus.UNDER_MAINTENANCE || damage.getStatus() == DamageStatus.OPEN) {
                    damage.setStatus(DamageStatus.RESOLVED);
                    damage.setResolvedAt(now);
                    damage.setResolvedByMaintenanceRequestId(maintenance.getId());
                    damageRecordRepository.save(damage);
                    if (damage.getVehiclePartCode() != null) {
                        resolvedExplicitParts.add(com.evshare.inspection.service.VehicleInspectionService.normalizeCanonicalPartCode(damage.getVehiclePartCode()));
                    }
                }
            }
        }

        // Support explicitly passed resolvedDamageIds in CompleteMaintenanceRequest
        if (request != null && request.getResolvedDamageIds() != null && !request.getResolvedDamageIds().isEmpty()) {
            List<DamageRecord> explicitDamages = damageRecordRepository.findAllById(request.getResolvedDamageIds());
            for (DamageRecord damage : explicitDamages) {
                if (damage.getVehicle() != null && damage.getVehicle().getId().equals(maintenance.getVehicle().getId())) {
                    if (damage.getCreatedAt() != null && damage.getCreatedAt().isAfter(now)) {
                        continue;
                    }
                    if (damage.getStatus() != DamageStatus.RESOLVED) {
                        damage.setStatus(DamageStatus.RESOLVED);
                        damage.setResolvedAt(now);
                        damage.setResolvedByMaintenanceRequestId(maintenance.getId());
                        damageRecordRepository.save(damage);
                        if (damage.getVehiclePartCode() != null) {
                            resolvedExplicitParts.add(com.evshare.inspection.service.VehicleInspectionService.normalizeCanonicalPartCode(damage.getVehiclePartCode()));
                        }
                        if (maintenance.getDamageRecords() != null && !maintenance.getDamageRecords().contains(damage)) {
                            maintenance.getDamageRecords().add(damage);
                        }
                    }
                }
            }
        }

        // Support explicitly passed resolvedInspectionItemIds in CompleteMaintenanceRequest
        if (request != null && request.getResolvedInspectionItemIds() != null && !request.getResolvedInspectionItemIds().isEmpty() && vehicleInspectionItemRepository != null) {
            List<com.evshare.inspection.entity.VehicleInspectionItem> explicitItems = vehicleInspectionItemRepository.findAllById(request.getResolvedInspectionItemIds());
            for (com.evshare.inspection.entity.VehicleInspectionItem item : explicitItems) {
                if (item.getConditionStatus() != com.evshare.inspection.entity.InspectionItemCondition.GOOD) {
                    item.setConditionStatus(com.evshare.inspection.entity.InspectionItemCondition.GOOD);
                    String curNote = item.getNote() != null ? item.getNote().trim() : "";
                    item.setNote((curNote.isEmpty() ? "" : curNote + " | ") + "[Đã khắc phục qua bảo dưỡng #" + maintenance.getId().toString().substring(0, 8) + "]");
                    vehicleInspectionItemRepository.save(item);
                    if (item.getVehiclePartCode() != null) {
                        resolvedExplicitParts.add(com.evshare.inspection.service.VehicleInspectionService.normalizeCanonicalPartCode(item.getVehiclePartCode()));
                    }
                }
            }
        }

        // Automatic preliminary inspection finding resolution for explicitly resolved parts in draft session:
        // Update in-progress draft inspection items created prior to repair completion to GOOD
        if (vehicleInspectionRepository != null && vehicleInspectionItemRepository != null && !resolvedExplicitParts.isEmpty()) {
            try {
                List<com.evshare.inspection.entity.VehicleInspection> inProgressList =
                        vehicleInspectionRepository.findInProgressByVehicleIdOrderByStartedAtDesc(maintenance.getVehicle().getId());
                for (com.evshare.inspection.entity.VehicleInspection activeInsp : inProgressList) {
                    if (activeInsp.getItems() != null) {
                        for (com.evshare.inspection.entity.VehicleInspectionItem item : activeInsp.getItems()) {
                            if (item.getVehiclePartCode() != null) {
                                String norm = com.evshare.inspection.service.VehicleInspectionService.normalizeCanonicalPartCode(item.getVehiclePartCode());
                                boolean isPriorOrDuring = item.getCreatedAt() == null || !item.getCreatedAt().isAfter(now);
                                if (resolvedExplicitParts.contains(norm) && isPriorOrDuring && item.getConditionStatus() != com.evshare.inspection.entity.InspectionItemCondition.GOOD) {
                                    item.setConditionStatus(com.evshare.inspection.entity.InspectionItemCondition.GOOD);
                                    String curNote = item.getNote() != null ? item.getNote().trim() : "";
                                    item.setNote((curNote.isEmpty() ? "" : curNote + " | ") + "[Đã khắc phục qua bảo dưỡng #" + maintenance.getId().toString().substring(0, 8) + "]");
                                    vehicleInspectionItemRepository.save(item);
                                }
                            }
                        }
                    }
                }
            } catch (Exception ignored) {
            }
        }

        MaintenanceRequest saved = maintenanceRequestRepository.save(maintenance);

        // Section 19 & 20: Record Actual Verified Expense and run existing periodic maintenance cost allocation
        if (request != null && request.getActualCost() != null && request.getActualCost().compareTo(BigDecimal.ZERO) > 0) {
            CoOwnershipGroup group = getActiveGroupForVehicle(saved.getVehicle().getId());
            User staffUser = userRepository.findById(actorId).orElse(saved.getCreatedBy());

            ExpenseCategory category = (saved.getMaintenanceType() == MaintenanceType.REPAIR || saved.getMaintenanceType() == MaintenanceType.BODY)
                    ? ExpenseCategory.REPAIR
                    : ExpenseCategory.MAINTENANCE;

            // Idempotent: check if expense already created for this maintenance request
            boolean expenseExists = expenseRepository.findByVehicleIdOrderByOccurredAtDesc(saved.getVehicle().getId())
                    .stream()
                    .anyMatch(e -> saved.getId().toString().equals(e.getSourceReferenceId()));

            if (!expenseExists) {
                Expense expense = new Expense(
                        UUID.randomUUID(),
                        saved.getVehicle(),
                        group,
                        category,
                        request.getActualCost(),
                        "Bảo dưỡng: " + saved.getTitle(),
                        now,
                        staffUser,
                        staffUser,
                        ExpenseSourceType.MANUAL,
                        saved.getId().toString(),
                        ExpenseStatus.APPROVED,
                        request.getEvidenceUrl(),
                        noteBuilder.toString()
                );
                expense.setApprovedAt(now);
                if (saved.getRelatedProposalId() != null) {
                    expense.setRelatedProposalId(saved.getRelatedProposalId());
                }
                expense.setAllocationPolicy(ExpenseAllocationPolicy.USAGE_AND_CAPITAL);

                Expense savedExpense = expenseRepository.save(expense);

                // Section 20: Reuse authoritative periodic maintenance allocation service
                try {
                    expenseShareService.generateSharesForExpense(savedExpense);
                } catch (Exception ex) {
                    // Log error without mutating the authoritative USAGE_AND_CAPITAL policy
                }

                if (notificationService != null) {
                    try {
                        String costStr = String.format("%,d VND", savedExpense.getAmount().longValue());
                        String expenseDisplay = (savedExpense.getDescription() != null && !savedExpense.getDescription().isBlank())
                                ? savedExpense.getDescription()
                                : saved.getTitle();
                        notificationService.notifyFinancialAllocation(
                                group.getId(),
                                savedExpense.getId(),
                                expenseDisplay,
                                costStr
                        );
                    } catch (Exception ignored) {
                    }
                }

                // Direct Co-owner Allocation: Maintenance expenses are allocated directly to co-owners as payment obligations
                // Shared Fund automatic disbursement is disabled in accordance with direct expense allocation model.
                // Each co-owner receives individual payment obligation for their share.
            }
        }

        // Vehicle status integrity validation (Section 5)
        resolveAndApplyVehicleStatus(maintenance.getVehicle());

        if (notificationService != null) {
            try {
                CoOwnershipGroup grp = getActiveGroupForVehicle(saved.getVehicle().getId());
                notificationService.notifyRepairInspectionPassed(
                        saved.getVehicle().getId(),
                        grp != null ? grp.getId() : null,
                        saved.getId()
                );
                if (saved.getDamageRecords() != null) {
                    for (DamageRecord damage : saved.getDamageRecords()) {
                        notificationService.notifyDamageResolved(
                                saved.getVehicle().getId(),
                                saved.getVehicle() != null ? saved.getVehicle().getLicensePlate() : null,
                                damage.getVehiclePartCode(),
                                damage.getId()
                        );
                    }
                }
            } catch (Exception ignored) {
            }
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

        if (notificationService != null) {
            try {
                CoOwnershipGroup grp = getActiveGroupForVehicle(saved.getVehicle().getId());
                notificationService.notifyStaffScheduledRepair(
                        saved.getVehicle().getId(),
                        grp != null ? grp.getId() : null,
                        saved.getId(),
                        saved.getScheduledAt() != null ? saved.getScheduledAt().toString() : "kế hoạch"
                );
            } catch (Exception ignored) {
            }
        }

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
        BigDecimal abstainWeight = BigDecimal.ZERO;

        for (MaintenanceApprovalVote v : votes) {
            if (v.getDecision() == VoteDecision.APPROVE) {
                approveWeight = approveWeight.add(v.getVotingWeight());
            } else if (v.getDecision() == VoteDecision.REJECT) {
                rejectWeight = rejectWeight.add(v.getVotingWeight());
            } else if (v.getDecision() == VoteDecision.ABSTAIN) {
                abstainWeight = abstainWeight.add(v.getVotingWeight());
            }
        }

        BigDecimal totalShares = ownershipShareRepository.sumPercentageByGroupIdAndVehicleId(groupId, vehicleId);
        if (totalShares == null || totalShares.compareTo(BigDecimal.ZERO) <= 0) {
            totalShares = new BigDecimal("100.00");
        }

        BigDecimal pendingWeight = totalShares.subtract(approveWeight).subtract(rejectWeight).subtract(abstainWeight);
        if (pendingWeight.compareTo(BigDecimal.ZERO) < 0) {
            pendingWeight = BigDecimal.ZERO;
        }

        // Authoritative decision logic (Requirements 5 & 6)
        CoOwnershipGroup group = coOwnershipGroupRepository.findById(groupId).orElse(null);
        BigDecimal threshold = (group != null && group.getApprovalThresholdPercentage() != null)
                ? group.getApprovalThresholdPercentage()
                : MAINTENANCE_APPROVAL_THRESHOLD;

        if (maintenance.getStatus() == MaintenanceStatus.PENDING_APPROVAL) {
            if (approveWeight.compareTo(threshold) >= 0) {
                maintenance.setStatus(MaintenanceStatus.APPROVED);
                maintenance.setApprovedAt(Instant.now());
                maintenance.setApprovedWeight(approveWeight);
                maintenanceRequestRepository.save(maintenance);
            } else if (totalShares.subtract(rejectWeight).compareTo(threshold) < 0) {
                // If maximum achievable approval weight is strictly less than threshold, proposal is rejected
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
        BigDecimal abstainWeight = BigDecimal.ZERO;

        for (MaintenanceApprovalVote v : votes) {
            if (v.getDecision() == VoteDecision.APPROVE) {
                approveWeight = approveWeight.add(v.getVotingWeight());
            } else if (v.getDecision() == VoteDecision.REJECT) {
                rejectWeight = rejectWeight.add(v.getVotingWeight());
            } else if (v.getDecision() == VoteDecision.ABSTAIN) {
                abstainWeight = abstainWeight.add(v.getVotingWeight());
            }
        }

        BigDecimal totalShares = ownershipShareRepository.sumPercentageByGroupIdAndVehicleId(groupId, vehicleId);
        if (totalShares == null || totalShares.compareTo(BigDecimal.ZERO) <= 0) {
            totalShares = new BigDecimal("100.00");
        }

        BigDecimal pendingWeight = totalShares.subtract(approveWeight).subtract(rejectWeight).subtract(abstainWeight);
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
        CoOwnershipGroup grp = coOwnershipGroupRepository.findById(groupId).orElse(null);
        BigDecimal requiredThreshold = (grp != null && grp.getApprovalThresholdPercentage() != null)
                ? grp.getApprovalThresholdPercentage()
                : MAINTENANCE_APPROVAL_THRESHOLD;

        MaintenanceApprovalResponse response = new MaintenanceApprovalResponse();
        response.setMaintenanceRequestId(maintenance.getId());
        response.setVehicleId(vehicleId);
        response.setStatus(maintenance.getStatus());
        response.setApproveWeight(approveWeight);
        response.setRejectWeight(rejectWeight);
        response.setPendingWeight(pendingWeight);
        response.setRequiredThreshold(requiredThreshold);
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

    private MaintenanceApprovalResponse buildApprovalResponseFromProposal(
            MaintenanceRequest maintenance,
            com.evshare.voting.entity.VoteProposal proposal,
            UUID groupId,
            UUID vehicleId,
            UUID currentUserId
    ) {
        MaintenanceApprovalResponse response = new MaintenanceApprovalResponse();
        response.setMaintenanceRequestId(maintenance.getId());
        response.setVehicleId(vehicleId);
        response.setStatus(maintenance.getStatus());

        List<com.evshare.voting.entity.ProposalVote> votes = proposal.getVotes() != null ? proposal.getVotes() : Collections.emptyList();
        List<com.evshare.voting.entity.ProposalVoteEligibility> eligibilities = proposal.getEligibilities() != null ? proposal.getEligibilities() : Collections.emptyList();

        BigDecimal approveWeight = BigDecimal.ZERO;
        BigDecimal rejectWeight = BigDecimal.ZERO;
        BigDecimal abstainWeight = BigDecimal.ZERO;

        for (com.evshare.voting.entity.ProposalVote v : votes) {
            if (v.getChoice() == com.evshare.voting.entity.ProposalVoteChoice.APPROVE) {
                approveWeight = approveWeight.add(v.getVotingWeightSnapshot());
            } else if (v.getChoice() == com.evshare.voting.entity.ProposalVoteChoice.REJECT) {
                rejectWeight = rejectWeight.add(v.getVotingWeightSnapshot());
            } else if (v.getChoice() == com.evshare.voting.entity.ProposalVoteChoice.ABSTAIN) {
                abstainWeight = abstainWeight.add(v.getVotingWeightSnapshot());
            }
        }

        BigDecimal totalEligibleWeight = eligibilities.stream()
                .map(com.evshare.voting.entity.ProposalVoteEligibility::getVotingWeight)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalEligibleWeight.compareTo(BigDecimal.ZERO) <= 0) {
            totalEligibleWeight = new BigDecimal("100.00");
        }

        BigDecimal pendingWeight = totalEligibleWeight.subtract(approveWeight).subtract(rejectWeight).subtract(abstainWeight);
        if (pendingWeight.compareTo(BigDecimal.ZERO) < 0) {
            pendingWeight = BigDecimal.ZERO;
        }

        response.setApproveWeight(approveWeight);
        response.setRejectWeight(rejectWeight);
        response.setPendingWeight(pendingWeight);
        response.setRequiredThreshold(proposal.getRequiredThresholdPercentage());
        response.setApprovedAt(proposal.getFinalizedAt());
        response.setApprovedWeight(proposal.getStatus() == com.evshare.voting.entity.VoteProposalStatus.APPROVED ? approveWeight : maintenance.getApprovedWeight());

        if (currentUserId != null) {
            Optional<com.evshare.voting.entity.ProposalVote> myVote = votes.stream()
                    .filter(v -> v.getVoterUser() != null && currentUserId.equals(v.getVoterUser().getId()))
                    .findFirst();
            if (myVote.isPresent()) {
                VoteDecision decision = switch (myVote.get().getChoice()) {
                    case APPROVE -> VoteDecision.APPROVE;
                    case REJECT -> VoteDecision.REJECT;
                    case ABSTAIN -> VoteDecision.ABSTAIN;
                };
                response.setCurrentUserVote(decision);
                response.setCurrentUserWeight(myVote.get().getVotingWeightSnapshot());
                response.setEligibleToVote(true);
            } else {
                Optional<com.evshare.voting.entity.ProposalVoteEligibility> myElig = eligibilities.stream()
                        .filter(e -> e.getUser() != null && currentUserId.equals(e.getUser().getId()))
                        .findFirst();
                if (myElig.isPresent()) {
                    response.setCurrentUserWeight(myElig.get().getVotingWeight());
                    response.setEligibleToVote(true);
                }
            }
        }

        List<MaintenanceVoteSummaryDto> voteDtos = new ArrayList<>();
        for (com.evshare.voting.entity.ProposalVote pv : votes) {
            MaintenanceVoteSummaryDto dto = MaintenanceVoteSummaryDto.fromProposalVote(pv);
            if (dto != null) {
                if (dto.getMemberId() == null && pv.getVoterUser() != null && groupId != null) {
                    try {
                        memberRepository.findByGroupIdAndUserId(groupId, pv.getVoterUser().getId())
                                .ifPresent(m -> dto.setMemberId(m.getId()));
                    } catch (Exception ignored) {
                    }
                }
                voteDtos.add(dto);
            }
        }
        response.setVotes(voteDtos);

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

    /**
     * Audited reconciliation: Safely reconciles verified damage records with unambiguous associations
     * (explicit join-table linkage) for completed repairs.
     * Never resolves newer damages or ambiguous records.
     */
    @Transactional
    public List<DamageRecordResponse> reconcileCompletedRepairDamages(UUID vehicleId, UserPrincipal principal) {
        validateVehicleAccess(vehicleId, principal);

        List<MaintenanceRequest> completedRequests = maintenanceRequestRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId)
                .stream()
                .filter(m -> m.getStatus() == MaintenanceStatus.COMPLETED)
                .filter(m -> m.getCompletionNote() == null || (!m.getCompletionNote().contains("FAILED") && !m.getCompletionNote().contains("KHÔNG ĐẠT")))
                .toList();

        List<DamageRecordResponse> reconciled = new java.util.ArrayList<>();
        Instant now = Instant.now();

        for (MaintenanceRequest maint : completedRequests) {
            // Unambiguous association: Direct join-table damages linked to the completed repair
            if (maint.getDamageRecords() != null) {
                for (DamageRecord damage : maint.getDamageRecords()) {
                    // Temporal integrity: Never resolve newer defects created after maintenance completion
                    if (damage.getCreatedAt() != null && maint.getCompletedAt() != null && damage.getCreatedAt().isAfter(maint.getCompletedAt())) {
                        continue;
                    }
                    if (damage.getStatus() != DamageStatus.RESOLVED) {
                        damage.setStatus(DamageStatus.RESOLVED);
                        damage.setResolvedAt(maint.getCompletedAt() != null ? maint.getCompletedAt() : now);
                        damage.setResolvedByMaintenanceRequestId(maint.getId());
                        damageRecordRepository.save(damage);
                        reconciled.add(DamageRecordResponse.fromEntity(damage));
                    }
                }
            }
        }

        return reconciled;
    }
}
