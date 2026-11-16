package com.evshare.voting.service;

import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.common.exception.UnauthorizedException;
import com.evshare.damage.entity.DamageRecord;
import com.evshare.damage.entity.DamageStatus;
import com.evshare.damage.repository.DamageRecordRepository;
import com.evshare.expense.entity.*;
import com.evshare.expense.repository.ExpenseRepository;
import com.evshare.expense.service.ExpenseShareService;
import com.evshare.maintenance.entity.MaintenancePriority;
import com.evshare.maintenance.entity.MaintenanceRequest;
import com.evshare.maintenance.entity.MaintenanceStatus;
import com.evshare.maintenance.entity.MaintenanceType;
import com.evshare.maintenance.repository.MaintenanceRequestRepository;
import com.evshare.ownership.entity.*;
import com.evshare.ownership.repository.CoOwnershipGroupRepository;
import com.evshare.ownership.repository.GroupMemberRepository;
import com.evshare.ownership.repository.GroupVehicleRepository;
import com.evshare.ownership.repository.OwnershipShareRepository;
import com.evshare.security.UserPrincipal;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import com.evshare.user.repository.UserRepository;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.entity.VehicleStatus;
import com.evshare.vehicle.repository.VehicleRepository;
import com.evshare.voting.dto.*;
import com.evshare.voting.entity.*;
import com.evshare.voting.repository.ProposalVoteEligibilityRepository;
import com.evshare.voting.repository.ProposalVoteRepository;
import com.evshare.voting.repository.VoteProposalRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class VoteProposalService {

    private final VoteProposalRepository voteProposalRepository;
    private final ProposalVoteRepository proposalVoteRepository;
    private final ProposalVoteEligibilityRepository eligibilityRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final CoOwnershipGroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final OwnershipShareRepository ownershipShareRepository;
    private final GroupVehicleRepository groupVehicleRepository;
    private final MaintenanceRequestRepository maintenanceRequestRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseShareService expenseShareService;
    private final com.evshare.contract.repository.CoOwnershipContractRepository contractRepository;
    private final DamageRecordRepository damageRecordRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.evshare.maintenance.repository.MaintenanceApprovalVoteRepository maintenanceApprovalVoteRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.evshare.notification.service.NotificationService notificationService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.evshare.inspection.repository.VehicleInspectionRepository vehicleInspectionRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.evshare.inspection.repository.VehicleInspectionItemRepository vehicleInspectionItemRepository;

    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.evshare.maintenance.service.MaintenanceService maintenanceService;

    public VoteProposalService(
            VoteProposalRepository voteProposalRepository,
            ProposalVoteRepository proposalVoteRepository,
            ProposalVoteEligibilityRepository eligibilityRepository,
            VehicleRepository vehicleRepository,
            UserRepository userRepository,
            CoOwnershipGroupRepository groupRepository,
            GroupMemberRepository memberRepository,
            OwnershipShareRepository ownershipShareRepository,
            GroupVehicleRepository groupVehicleRepository,
            MaintenanceRequestRepository maintenanceRequestRepository,
            ExpenseRepository expenseRepository,
            ExpenseShareService expenseShareService,
            com.evshare.contract.repository.CoOwnershipContractRepository contractRepository,
            DamageRecordRepository damageRecordRepository
    ) {
        this.voteProposalRepository = voteProposalRepository;
        this.proposalVoteRepository = proposalVoteRepository;
        this.eligibilityRepository = eligibilityRepository;
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.memberRepository = memberRepository;
        this.ownershipShareRepository = ownershipShareRepository;
        this.groupVehicleRepository = groupVehicleRepository;
        this.maintenanceRequestRepository = maintenanceRequestRepository;
        this.expenseRepository = expenseRepository;
        this.expenseShareService = expenseShareService;
        this.contractRepository = contractRepository;
        this.damageRecordRepository = damageRecordRepository;
    }

    /**
     * Create a new vote proposal for a co-ownership group vehicle.
     * Snapshots eligible voters and voting weights at creation.
     */
    @Transactional
    public VoteProposalResponse createProposal(CreateVoteProposalRequest request, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để tạo đề xuất biểu quyết.");
        }

        UUID vehicleId = request.vehicleId();
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Xe không tồn tại: " + vehicleId));

        validateVehicleAccess(vehicleId, principal);

        CoOwnershipGroup group = getActiveGroupForVehicle(vehicleId);

        // Section IX: Check if voting policy is configured
        if (group.getVotingRule() == null || group.getVotingRule().isBlank()) {
            throw new IllegalStateException("Nhóm chưa thiết lập quy tắc biểu quyết.");
        }

        VoteDecisionRule decisionRule;
        try {
            decisionRule = VoteDecisionRule.valueOf(group.getVotingRule());
        } catch (Exception e) {
            decisionRule = VoteDecisionRule.OWNERSHIP_WEIGHTED;
        }

        BigDecimal quorumPct = group.getQuorumPercentage() != null ? group.getQuorumPercentage() : new BigDecimal("50.00");
        BigDecimal thresholdPct = group.getApprovalThresholdPercentage() != null ? group.getApprovalThresholdPercentage() : new BigDecimal("50.00");

        // Calculate voting deadline
        Instant now = Instant.now();
        Instant endsAt;
        if (request.votingEndsAt() != null) {
            if (request.votingEndsAt().isBefore(now.plus(1, ChronoUnit.HOURS))) {
                throw new IllegalArgumentException("Thời hạn biểu quyết phải kéo dài ít nhất 1 giờ kể từ thời điểm hiện tại.");
            }
            endsAt = request.votingEndsAt();
        } else {
            int days = (request.votingDurationDays() != null && request.votingDurationDays() > 0)
                    ? request.votingDurationDays() : 5;
            endsAt = now.plus(days, ChronoUnit.DAYS);
        }

        User creator = principal.getUser();

        // Section IX: Resolve authoritative active contract agreement version
        String agreementVersion = "V1.0";
        if (contractRepository != null) {
            Optional<com.evshare.contract.entity.CoOwnershipContract> contractOpt = contractRepository.findByVehicleId(vehicleId);
            if (contractOpt.isPresent() && contractOpt.get().getCurrentVersion() != null) {
                agreementVersion = contractOpt.get().getCurrentVersion().getVersionNumberFormatted();
            }
        }

        VoteProposal proposal = new VoteProposal(
                UUID.randomUUID(),
                group,
                vehicle,
                creator,
                request.proposalType(),
                request.title().trim(),
                request.description() != null ? request.description().trim() : null,
                request.estimatedAmount(),
                request.estimatedAmount(),
                "VND",
                VoteProposalStatus.OPEN,
                decisionRule,
                quorumPct,
                thresholdPct,
                agreementVersion,
                now,
                endsAt
        );

        // Link maintenance request if specified
        if (request.relatedMaintenanceRequestId() != null) {
            MaintenanceRequest maint = maintenanceRequestRepository.findById(request.relatedMaintenanceRequestId())
                    .orElse(null);
            if (maint != null) {
                proposal.setRelatedMaintenanceRequest(maint);
                maint.setRelatedProposalId(proposal.getId());
                maintenanceRequestRepository.save(maint);
            }
        }

        VoteProposal savedProposal = voteProposalRepository.save(proposal);

        // Section X & 11: Snapshot eligible voters and their voting weights
        List<GroupMember> activeMembers = memberRepository.findByGroupIdAndStatus(group.getId(), MemberStatus.ACTIVE)
                .stream()
                .filter(m -> m.getRemovedAt() == null)
                .toList();

        if (activeMembers.isEmpty()) {
            throw new IllegalStateException("Nhóm đồng sở hữu không có thành viên hoạt động hợp lệ.");
        }

        // Enforce uniqueness: Exactly one eligibility snapshot per (proposalId, eligibleUserId)
        Map<UUID, GroupMember> uniqueMembersByUser = new LinkedHashMap<>();
        for (GroupMember member : activeMembers) {
            if (member.getUser() != null) {
                uniqueMembersByUser.putIfAbsent(member.getUser().getId(), member);
            }
        }

        List<ProposalVoteEligibility> eligibilities = new ArrayList<>();
        for (GroupMember member : uniqueMembersByUser.values()) {
            BigDecimal weight;
            if (decisionRule == VoteDecisionRule.OWNERSHIP_WEIGHTED) {
                OwnershipShare share = ownershipShareRepository.findByGroupIdAndVehicleIdAndMemberId(group.getId(), vehicleId, member.getId())
                        .or(() -> ownershipShareRepository.findByMemberIdAndVehicleId(member.getId(), vehicleId))
                        .orElse(null);
                weight = (share != null && share.getPercentage() != null) ? share.getPercentage() : BigDecimal.ZERO;
            } else {
                // ONE_MEMBER_ONE_VOTE
                weight = BigDecimal.ONE.setScale(2, RoundingMode.HALF_UP);
            }

            ProposalVoteEligibility eligibility = new ProposalVoteEligibility(
                    UUID.randomUUID(),
                    savedProposal,
                    member.getUser(),
                    member,
                    weight
            );
            eligibilities.add(eligibility);
        }

        List<ProposalVoteEligibility> savedEligibilities = eligibilityRepository.saveAll(eligibilities);
        savedProposal.setEligibilities(savedEligibilities);

        if (notificationService != null) {
            try {
                notificationService.notifyNewRepairProposal(
                        vehicleId,
                        group.getId(),
                        savedProposal.getId(),
                        savedProposal.getTitle(),
                        principal.getId()
                );
                notificationService.notifyVotingSessionCreated(
                        vehicleId,
                        group.getId(),
                        savedProposal.getId(),
                        savedProposal.getTitle()
                );
            } catch (Exception ignored) {
            }
        }

        return buildProposalResponse(savedProposal, principal.getId());
    }

    /**
     * Create an active vote proposal from an existing group-initiated maintenance/repair request.
     * Transitions maintenance status to PENDING_APPROVAL and snapshots group voter eligibility.
     */
    @Transactional
    public VoteProposalResponse createVoteForMaintenance(UUID maintenanceId, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để tạo phiên biểu quyết.");
        }

        MaintenanceRequest maint = maintenanceRequestRepository.findById(maintenanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu bảo dưỡng không tồn tại: " + maintenanceId));

        UUID vehicleId = maint.getVehicle().getId();
        validateVehicleAccess(vehicleId, principal);

        // Check if vote proposal already exists for this maintenance request
        Optional<VoteProposal> existingProposalOpt = voteProposalRepository.findByRelatedMaintenanceRequestId(maintenanceId);
        if (existingProposalOpt.isPresent()) {
            VoteProposal existing = existingProposalOpt.get();
            if (maint.getRelatedProposalId() == null) {
                maint.setRelatedProposalId(existing.getId());
                maintenanceRequestRepository.save(maint);
            }
            return buildProposalResponse(existing, principal.getId());
        }
        if (maint.getRelatedProposalId() != null) {
            Optional<VoteProposal> byIdOpt = voteProposalRepository.findById(maint.getRelatedProposalId());
            if (byIdOpt.isPresent()) {
                return buildProposalResponse(byIdOpt.get(), principal.getId());
            }
        }

        CoOwnershipGroup group = getActiveGroupForVehicle(vehicleId);

        VoteDecisionRule decisionRule = VoteDecisionRule.OWNERSHIP_WEIGHTED;
        if (group.getVotingRule() != null && !group.getVotingRule().isBlank()) {
            try {
                decisionRule = VoteDecisionRule.valueOf(group.getVotingRule());
            } catch (Exception ignored) {
            }
        }

        BigDecimal quorumPct = group.getQuorumPercentage() != null ? group.getQuorumPercentage() : new BigDecimal("50.00");
        BigDecimal thresholdPct = group.getApprovalThresholdPercentage() != null ? group.getApprovalThresholdPercentage() : new BigDecimal("50.00");

        // Parse estimated cost if present in description or set a reasonable default
        BigDecimal estimatedCost = new BigDecimal("2000000.00");
        if (maint.getDescription() != null && maint.getDescription().contains("Dự toán chi phí: ")) {
            try {
                String sub = maint.getDescription().substring(maint.getDescription().indexOf("Dự toán chi phí: ") + 17);
                String firstPart = sub.split(" ")[0].trim();
                String digitsOnly = firstPart.replaceAll("[^0-9]", "");
                if (!digitsOnly.isBlank()) {
                    estimatedCost = new BigDecimal(digitsOnly);
                }
            } catch (Exception ignored) {
            }
        }

        Instant now = Instant.now();
        Instant endsAt = now.plus(5, ChronoUnit.DAYS);

        String agreementVersion = "V1.0";
        if (contractRepository != null) {
            Optional<com.evshare.contract.entity.CoOwnershipContract> contractOpt = contractRepository.findByVehicleId(vehicleId);
            if (contractOpt.isPresent() && contractOpt.get().getCurrentVersion() != null) {
                agreementVersion = contractOpt.get().getCurrentVersion().getVersionNumberFormatted();
            }
        }

        boolean hasDamages = false;
        try {
            hasDamages = maint.getDamageRecords() != null && !maint.getDamageRecords().isEmpty();
        } catch (Exception ignored) {
        }

        VoteProposalType propType = (maint.getMaintenanceType() == MaintenanceType.REPAIR || hasDamages)
                ? VoteProposalType.REPAIR
                : (maint.getMaintenanceType() == MaintenanceType.PREVENTIVE || maint.getMaintenanceType() == MaintenanceType.INSPECTION
                        ? VoteProposalType.MAINTENANCE
                        : VoteProposalType.REPAIR);

        VoteProposalStatus initialStatus = VoteProposalStatus.OPEN;
        if (maint.getStatus() == MaintenanceStatus.APPROVED || maint.getStatus() == MaintenanceStatus.SCHEDULED
                || maint.getStatus() == MaintenanceStatus.IN_PROGRESS || maint.getStatus() == MaintenanceStatus.COMPLETED) {
            initialStatus = VoteProposalStatus.APPROVED;
        } else if (maint.getStatus() == MaintenanceStatus.REJECTED || maint.getStatus() == MaintenanceStatus.CANCELLED) {
            initialStatus = VoteProposalStatus.REJECTED;
        }

        User creator = maint.getCreatedBy() != null ? maint.getCreatedBy() : (principal != null ? principal.getUser() : null);

        VoteProposal proposal = new VoteProposal(
                UUID.randomUUID(),
                group,
                maint.getVehicle(),
                creator,
                propType,
                maint.getTitle(),
                maint.getDescription(),
                estimatedCost,
                estimatedCost,
                "VND",
                initialStatus,
                decisionRule,
                quorumPct,
                thresholdPct,
                agreementVersion,
                now,
                endsAt
        );

        proposal.setRelatedMaintenanceRequest(maint);
        VoteProposal savedProposal = voteProposalRepository.save(proposal);

        // Snapshot eligible voters
        List<GroupMember> activeMembers = memberRepository.findByGroupIdAndStatus(group.getId(), MemberStatus.ACTIVE)
                .stream()
                .filter(m -> m.getRemovedAt() == null)
                .toList();

        if (activeMembers.isEmpty()) {
            throw new IllegalStateException("Nhóm đồng sở hữu không có thành viên hoạt động hợp lệ.");
        }

        Map<UUID, GroupMember> uniqueMembersByUser = new LinkedHashMap<>();
        for (GroupMember member : activeMembers) {
            if (member.getUser() != null) {
                uniqueMembersByUser.putIfAbsent(member.getUser().getId(), member);
            }
        }

        List<ProposalVoteEligibility> eligibilities = new ArrayList<>();
        for (GroupMember member : uniqueMembersByUser.values()) {
            BigDecimal weight;
            if (decisionRule == VoteDecisionRule.OWNERSHIP_WEIGHTED) {
                OwnershipShare share = ownershipShareRepository.findByGroupIdAndVehicleIdAndMemberId(group.getId(), vehicleId, member.getId())
                        .or(() -> ownershipShareRepository.findByMemberIdAndVehicleId(member.getId(), vehicleId))
                        .orElse(null);
                weight = (share != null && share.getPercentage() != null) ? share.getPercentage() : BigDecimal.ZERO;
            } else {
                weight = BigDecimal.ONE.setScale(2, RoundingMode.HALF_UP);
            }

            ProposalVoteEligibility eligibility = new ProposalVoteEligibility(
                    UUID.randomUUID(),
                    savedProposal,
                    member.getUser(),
                    member,
                    weight
            );
            eligibilities.add(eligibility);
        }

        List<ProposalVoteEligibility> savedEligibilities = eligibilityRepository.saveAll(eligibilities);
        savedProposal.setEligibilities(savedEligibilities);

        // Reconcile and import any legacy votes from maintenance_approval_votes
        if (maintenanceApprovalVoteRepository != null) {
            try {
                List<com.evshare.maintenance.entity.MaintenanceApprovalVote> legacyVotes =
                        maintenanceApprovalVoteRepository.findByMaintenanceRequestId(maintenanceId);
                for (com.evshare.maintenance.entity.MaintenanceApprovalVote mav : legacyVotes) {
                    if (mav.getUser() != null) {
                        ProposalVoteEligibility voterElig = savedEligibilities.stream()
                                .filter(e -> e.getUser().getId().equals(mav.getUser().getId()))
                                .findFirst()
                                .orElse(null);
                        if (voterElig != null) {
                            ProposalVoteChoice choice = switch (mav.getDecision()) {
                                case APPROVE -> ProposalVoteChoice.APPROVE;
                                case REJECT -> ProposalVoteChoice.REJECT;
                                case ABSTAIN -> ProposalVoteChoice.ABSTAIN;
                            };
                            ProposalVote pv = new ProposalVote(
                                    UUID.randomUUID(),
                                    savedProposal,
                                    mav.getUser(),
                                    voterElig.getMember(),
                                    choice,
                                    voterElig.getVotingWeight(),
                                    mav.getComment()
                            );
                            if (mav.getCreatedAt() != null) {
                                pv.setCastAt(mav.getCreatedAt());
                            }
                            if (mav.getUpdatedAt() != null) {
                                pv.setUpdatedAt(mav.getUpdatedAt());
                            }
                            proposalVoteRepository.save(pv);
                        }
                    }
                }
            } catch (Exception ignored) {
            }
        }

        // Evaluate rules with snapshot and any imported votes
        evaluateAndFinalize(savedProposal);

        // Transition maintenance request to PENDING_APPROVAL and link proposal
        maint.setRelatedProposalId(savedProposal.getId());
        if (maint.getStatus() == MaintenanceStatus.PENDING) {
            maint.setStatus(MaintenanceStatus.PENDING_APPROVAL);
        }
        maintenanceRequestRepository.save(maint);

        if (notificationService != null) {
            try {
                notificationService.notifyVotingSessionCreated(
                        vehicleId,
                        group.getId(),
                        savedProposal.getId(),
                        savedProposal.getTitle()
                );
            } catch (Exception ignored) {
            }
        }

        return buildProposalResponse(savedProposal, principal != null ? principal.getId() : null);
    }

    /**
     * Get list of proposals for a vehicle, with auto-expiration check.
     * Automatically reconciles and links unlinked maintenance proposals.
     */
    @Transactional
    public List<VoteProposalResponse> getProposalsForVehicle(UUID vehicleId, VoteProposalStatus statusFilter, UserPrincipal principal) {
        validateVehicleAccess(vehicleId, principal);

        // Auto-reconcile unlinked maintenance requests for this vehicle requiring co-owner voting
        List<MaintenanceRequest> vehicleMaintRequests = maintenanceRequestRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId);
        for (MaintenanceRequest maint : vehicleMaintRequests) {
            if (maint.getStatus() == MaintenanceStatus.PENDING_APPROVAL || maint.getStatus() == MaintenanceStatus.APPROVED || maint.getStatus() == MaintenanceStatus.REJECTED) {
                if (maint.getRelatedProposalId() == null) {
                    Optional<VoteProposal> existingOpt = voteProposalRepository.findByRelatedMaintenanceRequestId(maint.getId());
                    if (existingOpt.isEmpty()) {
                        try {
                            createVoteForMaintenance(maint.getId(), principal);
                        } catch (Exception ignored) {
                        }
                    } else {
                        maint.setRelatedProposalId(existingOpt.get().getId());
                        maintenanceRequestRepository.save(maint);
                    }
                }
            }
        }

        // Auto-reconcile approved proposals missing execution records
        reconcileApprovedProposals(vehicleId);

        List<VoteProposal> list = voteProposalRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId);

        // Auto-reconciliation check for expired proposals
        Instant now = Instant.now();
        for (VoteProposal p : list) {
            if (p.getStatus() == VoteProposalStatus.OPEN && now.isAfter(p.getVotingEndsAt())) {
                evaluateAndFinalize(p);
            }
        }

        UUID currentUserId = principal != null ? principal.getId() : null;
        return list.stream()
                .filter(p -> statusFilter == null || p.getStatus() == statusFilter)
                .map(p -> buildProposalResponse(p, currentUserId))
                .collect(Collectors.toList());
    }

    /**
     * Get proposal details by ID.
     */
    @Transactional
    public VoteProposalResponse getProposalById(UUID proposalId, UserPrincipal principal) {
        VoteProposal proposal = voteProposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Đề xuất biểu quyết không tồn tại: " + proposalId));

        validateVehicleAccess(proposal.getVehicle().getId(), principal);

        // Auto-reconciliation check for expiration
        if (proposal.getStatus() == VoteProposalStatus.OPEN && Instant.now().isAfter(proposal.getVotingEndsAt())) {
            evaluateAndFinalize(proposal);
        }

        UUID currentUserId = principal != null ? principal.getId() : null;
        return buildProposalResponse(proposal, currentUserId);
    }

    /**
     * Cast or update a vote on an OPEN proposal.
     */
    @Transactional
    public VoteProposalResponse castVote(UUID proposalId, CastProposalVoteRequest request, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để biểu quyết.");
        }

        VoteProposal proposal = voteProposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Đề xuất biểu quyết không tồn tại: " + proposalId));

        // Invariant: Only OPEN proposals accept votes
        if (proposal.getStatus() != VoteProposalStatus.OPEN) {
            throw new IllegalStateException("Đề xuất không ở trạng thái mở biểu quyết (Trạng thái hiện tại: "
                    + proposal.getStatus().getVietnameseLabel() + "). Biểu quyết đã kết thúc.");
        }

        // Section XIV: Vote expiration check
        if (Instant.now().isAfter(proposal.getVotingEndsAt())) {
            evaluateAndFinalize(proposal);
            throw new IllegalStateException("Thời hạn biểu quyết đã kết thúc vào: " + proposal.getVotingEndsAt());
        }

        UUID userId = principal.getId();

        // Section IX: Eligibility check against snapshotted eligible voter identities
        ProposalVoteEligibility eligibility = eligibilityRepository.findByProposalIdAndUserId(proposalId, userId)
                .orElseThrow(() -> new AccessDeniedException("Bạn không nằm trong danh sách đồng sở hữu hợp lệ có quyền biểu quyết cho đề xuất này."));

        if (eligibility.getVotingWeight().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AccessDeniedException("Tỷ lệ biểu quyết của bạn là 0%, không có quyền biểu quyết.");
        }

        // Section XI: Idempotent vote cast or update
        Optional<ProposalVote> existingVoteOpt = proposalVoteRepository.findByProposalIdAndVoterUserId(proposalId, userId);
        ProposalVote vote;
        if (existingVoteOpt.isPresent()) {
            vote = existingVoteOpt.get();
            vote.setChoice(request.choice());
            vote.setVotingWeightSnapshot(eligibility.getVotingWeight());
            vote.setComment(request.comment() != null ? request.comment().trim() : null);
            vote.setUpdatedAt(Instant.now());
        } else {
            vote = new ProposalVote(
                    UUID.randomUUID(),
                    proposal,
                    principal.getUser(),
                    eligibility.getMember(),
                    request.choice(),
                    eligibility.getVotingWeight(),
                    request.comment() != null ? request.comment().trim() : null
            );
        }
        proposalVoteRepository.save(vote);

        // Sync to legacy maintenance_approval_votes if proposal is linked to a MaintenanceRequest
        if (proposal.getRelatedMaintenanceRequest() != null && maintenanceApprovalVoteRepository != null) {
            try {
                UUID maintId = proposal.getRelatedMaintenanceRequest().getId();
                com.evshare.maintenance.entity.VoteDecision decision = switch (request.choice()) {
                    case APPROVE -> com.evshare.maintenance.entity.VoteDecision.APPROVE;
                    case REJECT -> com.evshare.maintenance.entity.VoteDecision.REJECT;
                    case ABSTAIN -> com.evshare.maintenance.entity.VoteDecision.ABSTAIN;
                };
                Optional<com.evshare.maintenance.entity.MaintenanceApprovalVote> existingMav =
                        maintenanceApprovalVoteRepository.findByMaintenanceRequestIdAndUserId(maintId, userId);
                if (existingMav.isPresent()) {
                    com.evshare.maintenance.entity.MaintenanceApprovalVote mav = existingMav.get();
                    mav.setDecision(decision);
                    mav.setVotingWeight(eligibility.getVotingWeight());
                    mav.setComment(request.comment() != null ? request.comment().trim() : null);
                    mav.setUpdatedAt(Instant.now());
                    maintenanceApprovalVoteRepository.save(mav);
                } else {
                    com.evshare.maintenance.entity.MaintenanceApprovalVote mav = new com.evshare.maintenance.entity.MaintenanceApprovalVote(
                            UUID.randomUUID(),
                            proposal.getRelatedMaintenanceRequest(),
                            proposal.getGroup(),
                            eligibility.getMember(),
                            principal.getUser(),
                            decision,
                            eligibility.getVotingWeight(),
                            request.comment() != null ? request.comment().trim() : null
                    );
                    maintenanceApprovalVoteRepository.save(mav);
                }
            } catch (Exception ignored) {
            }
        }

        // Section XIII: Evaluate rules and finalize if threshold or rejection definitively reached
        evaluateAndFinalize(proposal);

        return buildProposalResponse(proposal, userId);
    }

    /**
     * Manually finalize a proposal (triggers evaluation of quorum, threshold, and deadline).
     */
    @Transactional
    public VoteProposalResponse finalizeProposal(UUID proposalId, UserPrincipal principal) {
        VoteProposal proposal = voteProposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Đề xuất biểu quyết không tồn tại: " + proposalId));

        validateVehicleAccess(proposal.getVehicle().getId(), principal);

        if (proposal.getStatus() == VoteProposalStatus.OPEN) {
            evaluateAndFinalize(proposal);
        }

        UUID currentUserId = principal != null ? principal.getId() : null;
        return buildProposalResponse(proposal, currentUserId);
    }

    /**
     * Get auditable vote results for a proposal.
     */
    @Transactional(readOnly = true)
    public VoteResultResponse getVoteResults(UUID proposalId, UserPrincipal principal) {
        VoteProposal proposal = voteProposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Đề xuất biểu quyết không tồn tại: " + proposalId));

        validateVehicleAccess(proposal.getVehicle().getId(), principal);

        List<ProposalVote> votes = proposalVoteRepository.findByProposalId(proposalId);
        List<ProposalVoteEligibility> eligibilities = eligibilityRepository.findByProposalId(proposalId);

        BigDecimal totalEligibleWeight = eligibilities.stream()
                .map(ProposalVoteEligibility::getVotingWeight)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Set<UUID> eligibleUserIds = eligibilities.stream()
                .filter(e -> e.getUser() != null && e.getVotingWeight() != null && e.getVotingWeight().compareTo(BigDecimal.ZERO) > 0)
                .map(e -> e.getUser().getId())
                .collect(Collectors.toSet());

        Set<UUID> distinctApprovingUserIds = new HashSet<>();
        Set<UUID> distinctRejectingUserIds = new HashSet<>();
        Set<UUID> distinctAbstainingUserIds = new HashSet<>();

        BigDecimal approveWeight = BigDecimal.ZERO;
        BigDecimal rejectWeight = BigDecimal.ZERO;
        BigDecimal abstainWeight = BigDecimal.ZERO;

        for (ProposalVote v : votes) {
            if (v.getVoterUser() == null || !eligibleUserIds.contains(v.getVoterUser().getId())) {
                continue;
            }
            UUID voterId = v.getVoterUser().getId();
            BigDecimal weight = v.getVotingWeightSnapshot() != null ? v.getVotingWeightSnapshot() : BigDecimal.ZERO;

            if (v.getChoice() == ProposalVoteChoice.APPROVE) {
                if (distinctApprovingUserIds.add(voterId)) {
                    approveWeight = approveWeight.add(weight);
                }
            } else if (v.getChoice() == ProposalVoteChoice.REJECT) {
                if (distinctRejectingUserIds.add(voterId)) {
                    rejectWeight = rejectWeight.add(weight);
                }
            } else if (v.getChoice() == ProposalVoteChoice.ABSTAIN) {
                if (distinctAbstainingUserIds.add(voterId)) {
                    abstainWeight = abstainWeight.add(weight);
                }
            }
        }

        int approveCount = distinctApprovingUserIds.size();
        int rejectCount = distinctRejectingUserIds.size();
        int abstainCount = distinctAbstainingUserIds.size();
        int participatingMemberCount = approveCount + rejectCount + abstainCount;

        BigDecimal participatingWeight = approveWeight.add(rejectWeight).add(abstainWeight);
        BigDecimal actualQuorumPct = totalEligibleWeight.compareTo(BigDecimal.ZERO) > 0
                ? participatingWeight.multiply(new BigDecimal("100")).divide(totalEligibleWeight, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal actualApprovePct = totalEligibleWeight.compareTo(BigDecimal.ZERO) > 0
                ? approveWeight.multiply(new BigDecimal("100")).divide(totalEligibleWeight, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        int eligibleMemberCount = eligibleUserIds.size() > 0 ? eligibleUserIds.size() : eligibilities.size();
        int requiredParticipatingMembers = (int) Math.ceil(eligibleMemberCount * 0.75);
        int requiredApprovingMembers = (eligibleMemberCount / 2) + 1;

        boolean memberQuorumMet = participatingMemberCount >= requiredParticipatingMembers;
        boolean weightQuorumMet = actualQuorumPct.compareTo(proposal.getRequiredQuorumPercentage()) >= 0;
        boolean quorumMet = memberQuorumMet && weightQuorumMet;

        boolean memberThresholdMet = approveCount >= requiredApprovingMembers;
        boolean weightThresholdMet = actualApprovePct.compareTo(proposal.getRequiredThresholdPercentage()) >= 0;
        boolean thresholdMet = memberThresholdMet && weightThresholdMet;

        return new VoteResultResponse(
                proposal.getId(),
                proposal.getTitle(),
                proposal.getProposalType(),
                proposal.getProposalType().getVietnameseLabel(),
                proposal.getStatus(),
                proposal.getStatus().getVietnameseLabel(),
                proposal.getStatus() == VoteProposalStatus.APPROVED,
                proposal.getDecisionRule(),
                proposal.getDecisionRule().getVietnameseLabel(),
                proposal.getRequiredQuorumPercentage(),
                proposal.getRequiredThresholdPercentage(),
                actualQuorumPct,
                quorumMet,
                actualApprovePct,
                thresholdMet,
                proposal.getApprovedBudget(),
                proposal.getCurrency(),
                proposal.getFinalizedAt(),
                proposal.getExecutionStatus(),
                proposal.getExecutionStatus().getVietnameseLabel(),
                proposal.getRelatedMaintenanceRequest() != null ? proposal.getRelatedMaintenanceRequest().getId() : null,
                proposal.getRelatedExpense() != null ? proposal.getRelatedExpense().getId() : null,
                eligibilities.size(),
                votes.size(),
                approveCount,
                rejectCount,
                abstainCount,
                approveWeight,
                rejectWeight,
                abstainWeight,
                votes.stream().map(ProposalVoteResponse::fromEntity).collect(Collectors.toList())
        );
    }

    /**
     * Section XIX: STAFF views approved work authorizations.
     */
    @Transactional
    public List<ApprovedWorkResponse> getStaffApprovedWork(UUID vehicleId, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }

        // Idempotent reconciliation of approved maintenance proposals missing execution records
        reconcileApprovedProposals(vehicleId);

        List<VoteProposal> proposals;
        if (vehicleId != null) {
            proposals = voteProposalRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId);
        } else {
            proposals = voteProposalRepository.findAll();
        }

        return proposals.stream()
                .filter(p -> p.getStatus() == VoteProposalStatus.APPROVED
                        || p.getStatus() == VoteProposalStatus.OPEN
                        || p.getExecutionStatus() == ProposalExecutionStatus.ACCEPTED
                        || p.getExecutionStatus() == ProposalExecutionStatus.IN_PROGRESS
                        || p.getExecutionStatus() == ProposalExecutionStatus.COMPLETED)
                .map(this::mapToApprovedWorkResponse)
                .collect(Collectors.toList());
    }

    /**
     * Section XIX: STAFF accepts authorized work proposal.
     * Transitions executionStatus: NOT_STARTED / PENDING_STAFF -> ACCEPTED.
     */
    @Transactional
    public ApprovedWorkResponse acceptProposalWork(UUID proposalId, UUID assignedStaffId, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }

        Role role = principal.getUser().getRole();
        if (role != Role.STAFF && role != Role.ADMIN) {
            throw new AccessDeniedException("Chỉ Nhân viên (STAFF) hoặc Quản trị viên (ADMIN) mới có quyền tiếp nhận công việc.");
        }

        VoteProposal proposal = voteProposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Đề xuất không tồn tại: " + proposalId));

        if (proposal.getStatus() != VoteProposalStatus.APPROVED) {
            throw new IllegalStateException("Đề xuất chưa được phê duyệt (Trạng thái hiện tại: "
                    + proposal.getStatus().getVietnameseLabel() + "). Chỉ đề xuất đã duyệt mới có thể tiếp nhận.");
        }

        if (proposal.getExecutionStatus() == ProposalExecutionStatus.ACCEPTED) {
            return mapToApprovedWorkResponse(proposal);
        }

        if (proposal.getExecutionStatus() == ProposalExecutionStatus.IN_PROGRESS) {
            throw new IllegalStateException("Công việc đang được tiến hành.");
        }

        if (proposal.getExecutionStatus() == ProposalExecutionStatus.COMPLETED) {
            throw new IllegalStateException("Công việc đã hoàn tất trước đó.");
        }

        User staff = principal.getUser();
        if (assignedStaffId != null) {
            staff = userRepository.findById(assignedStaffId).orElse(staff);
        }

        proposal.setExecutionStatus(ProposalExecutionStatus.ACCEPTED);
        proposal.setExecutedByStaff(staff);

        // Update related MaintenanceRequest if linked
        MaintenanceRequest maint = null;
        if (proposal.getRelatedMaintenanceRequest() != null) {
            maint = maintenanceRequestRepository.findByIdWithDetails(proposal.getRelatedMaintenanceRequest().getId())
                    .orElse(proposal.getRelatedMaintenanceRequest());
        } else {
            maint = maintenanceRequestRepository.findByRelatedProposalId(proposal.getId()).orElse(null);
        }

        if (maint != null) {
            maint.setStatus(MaintenanceStatus.ACCEPTED);
            maint.setAssignedStaff(staff);
            maintenanceRequestRepository.save(maint);
        }

        VoteProposal saved = voteProposalRepository.save(proposal);

        if (notificationService != null) {
            try {
                notificationService.notifyStaffAcceptedRepair(
                        proposal.getVehicle().getId(),
                        proposal.getGroup().getId(),
                        maint != null ? maint.getId() : proposal.getId(),
                        staff.getFullName()
                );
            } catch (Exception ignored) {
            }
        }

        return mapToApprovedWorkResponse(saved);
    }

    /**
     * Section XIX: STAFF begins authorized work.
     * Enforces approval gate: Throws IllegalStateException if proposal is still OPEN or PENDING.
     */
    @Transactional
    public ApprovedWorkResponse startProposalWork(UUID proposalId, StartProposalWorkRequest request, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }

        Role role = principal.getUser().getRole();
        if (role != Role.STAFF && role != Role.ADMIN) {
            throw new AccessDeniedException("Chỉ Nhân viên (STAFF) hoặc Quản trị viên (ADMIN) mới có quyền thực hiện công việc được phê duyệt.");
        }

        VoteProposal proposal = voteProposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Đề xuất không tồn tại: " + proposalId));

        // Strict Authorization Gate (Section XIX)
        if (proposal.getStatus() != VoteProposalStatus.APPROVED) {
            throw new IllegalStateException("Đề xuất chưa được các thành viên thông qua (Trạng thái hiện tại: "
                    + proposal.getStatus().getVietnameseLabel() + "). Nghiêm cấm bắt đầu thực hiện khi chưa được phê duyệt.");
        }

        if (proposal.getExecutionStatus() == ProposalExecutionStatus.IN_PROGRESS) {
            return mapToApprovedWorkResponse(proposal);
        }

        if (proposal.getExecutionStatus() == ProposalExecutionStatus.COMPLETED) {
            throw new IllegalStateException("Công việc này đã được hoàn tất trước đó.");
        }

        proposal.setExecutionStatus(ProposalExecutionStatus.IN_PROGRESS);
        proposal.setExecutionStartedAt(Instant.now());
        proposal.setExecutedByStaff(principal.getUser());

        // Update related MaintenanceRequest if linked
        MaintenanceRequest maint = null;
        if (proposal.getRelatedMaintenanceRequest() != null) {
            maint = maintenanceRequestRepository.findByIdWithDetails(proposal.getRelatedMaintenanceRequest().getId())
                    .orElse(proposal.getRelatedMaintenanceRequest());
        } else {
            maint = maintenanceRequestRepository.findByRelatedProposalId(proposal.getId()).orElse(null);
        }

        if (maint != null) {
            if (maint.getStatus() == MaintenanceStatus.APPROVED || maint.getStatus() == MaintenanceStatus.ACCEPTED || maint.getStatus() == MaintenanceStatus.SCHEDULED || maint.getStatus() == MaintenanceStatus.PENDING_APPROVAL) {
                maint.setStatus(MaintenanceStatus.IN_PROGRESS);
                maint.setStartedAt(Instant.now());
                maint.setAssignedStaff(principal.getUser());
                maintenanceRequestRepository.save(maint);

                // Update vehicle status to MAINTENANCE
                Vehicle vehicle = proposal.getVehicle();
                vehicle.setStatus(VehicleStatus.MAINTENANCE);
                vehicleRepository.save(vehicle);

                // Transactionally advance linked damage records: OPEN -> UNDER_MAINTENANCE
                if (maint.getDamageRecords() != null && !maint.getDamageRecords().isEmpty()) {
                    for (DamageRecord damage : maint.getDamageRecords()) {
                        if (damage.getStatus() == DamageStatus.OPEN) {
                            damage.setStatus(DamageStatus.UNDER_MAINTENANCE);
                            damageRecordRepository.save(damage);
                        }
                    }
                }
            }
        }

        VoteProposal saved = voteProposalRepository.save(proposal);

        if (notificationService != null) {
            try {
                notificationService.notifyStaffAcceptedRepair(
                        proposal.getVehicle().getId(),
                        proposal.getGroup().getId(),
                        maint != null ? maint.getId() : proposal.getId(),
                        principal.getUser().getFullName()
                );
                notificationService.notifyStaffRepairStarted(
                        proposal.getVehicle().getId(),
                        proposal.getGroup().getId(),
                        maint != null ? maint.getId() : proposal.getId()
                );
            } catch (Exception ignored) {
            }
        }

        return mapToApprovedWorkResponse(saved);
    }

    /**
     * Section XIX, XX, XXI, XXII: STAFF completes work and records actual expense.
     * Enforces budget cap, generates official Expense with USAGE_AND_CAPITAL allocation.
     */
    @Transactional
    public ApprovedWorkResponse completeProposalWork(UUID proposalId, CompleteProposalWorkRequest request, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }

        Role role = principal.getUser().getRole();
        if (role != Role.STAFF && role != Role.ADMIN) {
            throw new AccessDeniedException("Chỉ Nhân viên hoặc Quản trị viên mới có quyền hoàn tất công việc.");
        }

        VoteProposal proposal = voteProposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Đề xuất không tồn tại: " + proposalId));

        if (proposal.getStatus() != VoteProposalStatus.APPROVED) {
            throw new IllegalStateException("Chỉ công việc đã được phê duyệt mới có thể hoàn tất.");
        }

        if (proposal.getExecutionStatus() != ProposalExecutionStatus.IN_PROGRESS) {
            throw new IllegalStateException("Công việc chưa được bắt đầu (Trạng thái hiện tại: "
                    + proposal.getExecutionStatus().getVietnameseLabel() + ").");
        }

        BigDecimal actualCost = request.actualCost();
        if (actualCost == null || actualCost.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Chi phí thực tế phải lớn hơn 0.");
        }

        // Section XXII: Approved Budget Cap Enforcement
        BigDecimal approvedBudget = proposal.getApprovedBudget() != null ? proposal.getApprovedBudget() : proposal.getEstimatedAmount();
        if (actualCost.compareTo(approvedBudget) > 0) {
            throw new IllegalStateException("Chi phí thực tế (" + actualCost + " VNĐ) vượt quá ngân sách đã được phê duyệt ("
                    + approvedBudget + " VNĐ). Nghiêm cấm ghi nhận chi phí vượt hạn mức mà không có biểu quyết bổ sung.");
        }

        Instant now = Instant.now();
        proposal.setExecutionStatus(ProposalExecutionStatus.COMPLETED);
        proposal.setExecutionCompletedAt(now);
        proposal.setActualCost(actualCost);

        // Section XX & XXI: Create verified official Expense
        ExpenseCategory expenseCategory = mapProposalTypeToExpenseCategory(proposal.getProposalType());
        User staff = principal.getUser();

        Expense expense = new Expense(
                UUID.randomUUID(),
                proposal.getVehicle(),
                proposal.getGroup(),
                expenseCategory,
                actualCost,
                proposal.getTitle(),
                now,
                staff,
                staff,
                ExpenseSourceType.MANUAL,
                proposal.getId().toString(),
                ExpenseStatus.APPROVED, // Pre-authorized by co-owner vote proposal
                request.evidenceUrl(),
                request.completionNote() != null ? request.completionNote().trim() : "Chi phí thực hiện theo đề xuất biểu quyết đã duyệt."
        );
        expense.setApprovedAt(now);
        expense.setRelatedProposalId(proposal.getId());
        expense.setAllocationPolicy(ExpenseAllocationPolicy.USAGE_AND_CAPITAL);

        Expense savedExpense = expenseRepository.save(expense);

        // Section XXI: Run Phase 19 USAGE_AND_CAPITAL expense allocation
        try {
            expenseShareService.generateSharesForExpense(savedExpense);
            if (notificationService != null && proposal.getGroup() != null) {
                String costStr = String.format("%,d VND", savedExpense.getAmount().longValue());
                notificationService.notifyFinancialAllocation(
                        proposal.getGroup().getId(),
                        savedExpense.getId(),
                        savedExpense.getDescription() != null ? savedExpense.getDescription() : proposal.getTitle(),
                        costStr
                );
            }
        } catch (Exception e) {
            // Keep expense created even if share generation requires further trip verification
        }

        proposal.setRelatedExpense(savedExpense);

        // Complete linked MaintenanceRequest if any
        MaintenanceRequest maint = null;
        if (proposal.getRelatedMaintenanceRequest() != null) {
            maint = maintenanceRequestRepository.findByIdWithDetails(proposal.getRelatedMaintenanceRequest().getId())
                    .orElse(proposal.getRelatedMaintenanceRequest());
        } else {
            maint = maintenanceRequestRepository.findByRelatedProposalId(proposal.getId()).orElse(null);
        }

        if (maint != null) {
            maint.setStatus(MaintenanceStatus.COMPLETED);
            maint.setCompletedAt(now);
            if (request.completionNote() != null) {
                maint.setCompletionNote(request.completionNote().trim());
            }
            maintenanceRequestRepository.save(maint);

            // Transactionally resolve explicitly linked damage records (Requirement 18: DO NOT delete rows)
            java.util.Set<String> resolvedExplicitParts = new java.util.HashSet<>();
            if (maint.getDamageRecords() != null && !maint.getDamageRecords().isEmpty()) {
                for (DamageRecord damage : maint.getDamageRecords()) {
                    if (damage.getCreatedAt() != null && damage.getCreatedAt().isAfter(now)) {
                        continue;
                    }
                    if (damage.getStatus() == DamageStatus.UNDER_MAINTENANCE || damage.getStatus() == DamageStatus.OPEN) {
                        damage.setStatus(DamageStatus.RESOLVED);
                        damage.setResolvedAt(now);
                        damage.setResolvedByMaintenanceRequestId(maint.getId());
                        damageRecordRepository.save(damage);
                        if (damage.getVehiclePartCode() != null) {
                            resolvedExplicitParts.add(com.evshare.inspection.service.VehicleInspectionService.normalizeCanonicalPartCode(damage.getVehiclePartCode()));
                        }
                    }
                }
            }

            // Automatic preliminary inspection finding resolution for explicitly resolved parts in draft session:
            if (vehicleInspectionRepository != null && vehicleInspectionItemRepository != null && !resolvedExplicitParts.isEmpty()) {
                try {
                    List<com.evshare.inspection.entity.VehicleInspection> inProgressList =
                            vehicleInspectionRepository.findInProgressByVehicleIdOrderByStartedAtDesc(proposal.getVehicle().getId());
                    for (com.evshare.inspection.entity.VehicleInspection activeInsp : inProgressList) {
                        if (activeInsp.getItems() != null) {
                            for (com.evshare.inspection.entity.VehicleInspectionItem item : activeInsp.getItems()) {
                                if (item.getVehiclePartCode() != null) {
                                    String norm = com.evshare.inspection.service.VehicleInspectionService.normalizeCanonicalPartCode(item.getVehiclePartCode());
                                    boolean isPriorOrDuring = item.getCreatedAt() == null || !item.getCreatedAt().isAfter(now);
                                    if (resolvedExplicitParts.contains(norm) && isPriorOrDuring && item.getConditionStatus() != com.evshare.inspection.entity.InspectionItemCondition.GOOD) {
                                        item.setConditionStatus(com.evshare.inspection.entity.InspectionItemCondition.GOOD);
                                        String curNote = item.getNote() != null ? item.getNote().trim() : "";
                                        item.setNote((curNote.isEmpty() ? "" : curNote + " | ") + "[Đã khắc phục hoàn tất qua đề xuất #" + proposal.getId().toString().substring(0, 8) + "]");
                                        vehicleInspectionItemRepository.save(item);
                                    }
                                }
                            }
                        }
                    }
                } catch (Exception ignored) {
                }
            }

            // Authoritative vehicle status integrity validation (Section 5)
            if (maintenanceService != null) {
                maintenanceService.resolveAndApplyVehicleStatus(proposal.getVehicle());
            } else {
                Vehicle vehicle = proposal.getVehicle();
                vehicle.setStatus(VehicleStatus.AVAILABLE);
                vehicleRepository.save(vehicle);
            }
        }

        VoteProposal saved = voteProposalRepository.save(proposal);

        if (notificationService != null) {
            try {
                notificationService.notifyRepairInspectionPassed(
                        proposal.getVehicle().getId(),
                        proposal.getGroup().getId(),
                        maint != null ? maint.getId() : proposal.getId()
                );
                if (maint != null && maint.getDamageRecords() != null) {
                    for (DamageRecord damage : maint.getDamageRecords()) {
                        notificationService.notifyDamageResolved(
                                proposal.getVehicle().getId(),
                                proposal.getVehicle() != null ? proposal.getVehicle().getLicensePlate() : null,
                                damage.getVehiclePartCode(),
                                damage.getId()
                        );
                    }
                }
            } catch (Exception ignored) {
            }
        }

        return mapToApprovedWorkResponse(saved);
    }

    /**
     * Section IX: Controlled configuration path for group voting policy.
     */
    @Transactional
    public void updateVotingPolicy(UUID groupId, UpdateVotingPolicyRequest request, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }

        CoOwnershipGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Nhóm đồng sở hữu không tồn tại: " + groupId));

        Role role = principal.getUser().getRole();
        if (role != Role.ADMIN) {
            GroupMember member = memberRepository.findByGroupIdAndUserId(groupId, principal.getId())
                    .orElseThrow(() -> new AccessDeniedException("Bạn không phải thành viên nhóm đồng sở hữu này."));
            if (member.getStatus() != MemberStatus.ACTIVE || member.getMemberRole() != GroupMemberRole.REPRESENTATIVE) {
                throw new AccessDeniedException("Chỉ Đại diện nhóm (REPRESENTATIVE) hoặc Quản trị viên (ADMIN) mới có quyền cấu hình quy tắc biểu quyết.");
            }
        }

        group.setVotingRule(request.votingRule().name());
        group.setQuorumPercentage(request.quorumPercentage());
        group.setApprovalThresholdPercentage(request.approvalThresholdPercentage());
        groupRepository.save(group);
    }

    // =========================================================================
    // Internal Decision Engine & Helpers
    // =========================================================================

    private void evaluateAndFinalize(VoteProposal proposal) {
        List<ProposalVote> votes = proposalVoteRepository.findByProposalId(proposal.getId());
        List<ProposalVoteEligibility> eligibilities = eligibilityRepository.findByProposalId(proposal.getId());

        BigDecimal totalEligibleWeight = eligibilities.stream()
                .map(ProposalVoteEligibility::getVotingWeight)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalEligibleWeight.compareTo(BigDecimal.ZERO) <= 0) {
            totalEligibleWeight = new BigDecimal("100.00");
        }

        Set<UUID> eligibleUserIds = eligibilities.stream()
                .filter(e -> e.getUser() != null && e.getVotingWeight() != null && e.getVotingWeight().compareTo(BigDecimal.ZERO) > 0)
                .map(e -> e.getUser().getId())
                .collect(Collectors.toSet());

        Set<UUID> distinctApprovingUserIds = new HashSet<>();
        Set<UUID> distinctRejectingUserIds = new HashSet<>();
        Set<UUID> distinctAbstainingUserIds = new HashSet<>();

        BigDecimal approveWeight = BigDecimal.ZERO;
        BigDecimal rejectWeight = BigDecimal.ZERO;
        BigDecimal abstainWeight = BigDecimal.ZERO;

        for (ProposalVote v : votes) {
            if (v.getVoterUser() == null || !eligibleUserIds.contains(v.getVoterUser().getId())) {
                continue;
            }
            UUID voterId = v.getVoterUser().getId();
            BigDecimal weight = v.getVotingWeightSnapshot() != null ? v.getVotingWeightSnapshot() : BigDecimal.ZERO;

            if (v.getChoice() == ProposalVoteChoice.APPROVE) {
                if (distinctApprovingUserIds.add(voterId)) {
                    approveWeight = approveWeight.add(weight);
                }
            } else if (v.getChoice() == ProposalVoteChoice.REJECT) {
                if (distinctRejectingUserIds.add(voterId)) {
                    rejectWeight = rejectWeight.add(weight);
                }
            } else if (v.getChoice() == ProposalVoteChoice.ABSTAIN) {
                if (distinctAbstainingUserIds.add(voterId)) {
                    abstainWeight = abstainWeight.add(weight);
                }
            }
        }

        int approveCount = distinctApprovingUserIds.size();
        int rejectCount = distinctRejectingUserIds.size();
        int abstainCount = distinctAbstainingUserIds.size();
        int participatingMemberCount = approveCount + rejectCount + abstainCount;

        BigDecimal participatingWeight = approveWeight.add(rejectWeight).add(abstainWeight);
        int eligibleMemberCount = eligibleUserIds.size() > 0 ? eligibleUserIds.size() : eligibilities.size();

        // Collective Voting Dual Approval Rules:
        // 1. Dual Quorum: BOTH member participation (>= 75% ceil) AND ownership weight (>= required quorum %)
        int requiredParticipatingMembers = (int) Math.ceil(eligibleMemberCount * 0.75);
        boolean memberQuorumMet = participatingMemberCount >= requiredParticipatingMembers;

        BigDecimal quorumNeeded = totalEligibleWeight.multiply(proposal.getRequiredQuorumPercentage())
                .divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
        boolean weightQuorumMet = participatingWeight.compareTo(quorumNeeded) >= 0;
        boolean quorumMet = memberQuorumMet && weightQuorumMet;

        // 2. Dual Approval: BOTH member approval count (> 50% floor+1) AND ownership approval weight (>= required threshold %)
        int requiredApprovingMembers = (eligibleMemberCount / 2) + 1;
        boolean memberApprovalMet = approveCount >= requiredApprovingMembers;

        BigDecimal thresholdNeeded = totalEligibleWeight.multiply(proposal.getRequiredThresholdPercentage())
                .divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
        boolean weightThresholdMet = approveWeight.compareTo(thresholdNeeded) >= 0;
        boolean thresholdMet = memberApprovalMet && weightThresholdMet;

        boolean deadlinePassed = Instant.now().isAfter(proposal.getVotingEndsAt());

        // Decision logic
        if (proposal.getStatus() == VoteProposalStatus.OPEN) {
            if (quorumMet && thresholdMet) {
                // Approved!
                proposal.setStatus(VoteProposalStatus.APPROVED);
                proposal.setFinalizedAt(Instant.now());
                proposal.setApprovedBudget(proposal.getEstimatedAmount());

                // Sync or create linked maintenance request if category is MAINTENANCE or REPAIR
                MaintenanceRequest maint = null;
                if (proposal.getRelatedMaintenanceRequest() != null) {
                    maint = maintenanceRequestRepository.findById(proposal.getRelatedMaintenanceRequest().getId())
                            .orElse(proposal.getRelatedMaintenanceRequest());
                    if (maint.getStatus() == MaintenanceStatus.PENDING_APPROVAL) {
                        maint.setStatus(MaintenanceStatus.APPROVED);
                        maint.setApprovedAt(Instant.now());
                        maint.setApprovedWeight(approveWeight);
                        maint = maintenanceRequestRepository.save(maint);
                    }
                } else if (proposal.getProposalType() == VoteProposalType.MAINTENANCE || proposal.getProposalType() == VoteProposalType.REPAIR) {
                    Optional<MaintenanceRequest> existingMaintOpt = maintenanceRequestRepository.findByRelatedProposalId(proposal.getId());
                    if (existingMaintOpt.isPresent()) {
                        maint = existingMaintOpt.get();
                        maint.setStatus(MaintenanceStatus.APPROVED);
                        maint.setApprovedAt(Instant.now());
                        maint.setApprovedWeight(approveWeight);
                        maint = maintenanceRequestRepository.save(maint);
                    } else {
                        maint = new MaintenanceRequest(
                                UUID.randomUUID(),
                                proposal.getVehicle(),
                                MaintenanceStatus.APPROVED,
                                MaintenancePriority.MEDIUM,
                                proposal.getProposalType() == VoteProposalType.REPAIR ? MaintenanceType.REPAIR : MaintenanceType.PREVENTIVE,
                                proposal.getTitle(),
                                proposal.getDescription(),
                                null,
                                proposal.getCreatedByUser(),
                                null
                        );
                        maint.setApprovedAt(Instant.now());
                        maint.setApprovedWeight(approveWeight);
                        maint.setRelatedProposalId(proposal.getId());

                        // Match damage records if applicable
                        if (proposal.getVehicle() != null) {
                            String t = (proposal.getTitle() != null ? proposal.getTitle().toUpperCase() : "") + " " + (proposal.getDescription() != null ? proposal.getDescription().toUpperCase() : "");
                            List<DamageRecord> vehicleDamages = damageRecordRepository.findByVehicleIdOrderByCreatedAtDesc(proposal.getVehicle().getId());
                            Set<DamageRecord> matchedDamages = new HashSet<>();
                            for (DamageRecord d : vehicleDamages) {
                                if (d.getStatus() == DamageStatus.OPEN && d.getVehiclePartCode() != null) {
                                    String partCode = d.getVehiclePartCode().toUpperCase();
                                    if (t.contains(partCode) || (partCode.equals("DOOR_RL") && (t.contains("CỬA SAU TRÁI") || t.contains("CỬA SAU T"))) || (partCode.equals("DOOR_FR") && (t.contains("CỬA TRƯỚC PHẢI") || t.contains("CỬA TRƯỚC P")))) {
                                        matchedDamages.add(d);
                                    }
                                }
                            }
                            if (!matchedDamages.isEmpty()) {
                                maint.setDamageRecords(matchedDamages);
                            }
                        }

                        maint = maintenanceRequestRepository.save(maint);
                    }
                    proposal.setRelatedMaintenanceRequest(maint);
                }
                voteProposalRepository.save(proposal);

                if (notificationService != null) {
                    try {
                        notificationService.notifyVoteFinalized(
                                proposal.getVehicle().getId(),
                                proposal.getGroup().getId(),
                                proposal.getId(),
                                proposal.getTitle(),
                                true
                        );
                        if (maint != null) {
                            notificationService.notifyRepairApprovedForStaff(
                                    proposal.getVehicle().getId(),
                                    proposal.getVehicle() != null ? proposal.getVehicle().getLicensePlate() : null,
                                    maint.getId(),
                                    proposal.getTitle()
                            );
                        }
                    } catch (Exception ignored) {
                    }
                }
            } else if (deadlinePassed || totalEligibleWeight.subtract(rejectWeight).compareTo(thresholdNeeded) < 0) {
                // Deadline passed without meeting approval conditions OR mathematically impossible to approve
                if (deadlinePassed && !quorumMet) {
                    proposal.setStatus(VoteProposalStatus.EXPIRED);
                } else {
                    proposal.setStatus(VoteProposalStatus.REJECTED);
                }
                proposal.setFinalizedAt(Instant.now());

                // Sync linked maintenance request if present
                if (proposal.getRelatedMaintenanceRequest() != null) {
                    MaintenanceRequest maint = maintenanceRequestRepository.findById(proposal.getRelatedMaintenanceRequest().getId())
                            .orElse(proposal.getRelatedMaintenanceRequest());
                    if (maint.getStatus() == MaintenanceStatus.PENDING_APPROVAL) {
                        maint.setStatus(MaintenanceStatus.REJECTED);
                        maintenanceRequestRepository.save(maint);
                    }
                }
                voteProposalRepository.save(proposal);

                if (notificationService != null) {
                    try {
                        notificationService.notifyVoteFinalized(
                                proposal.getVehicle().getId(),
                                proposal.getGroup().getId(),
                                proposal.getId(),
                                proposal.getTitle(),
                                false
                        );
                    } catch (Exception ignored) {
                    }
                }
            } else {
                // Check if impossible to pass: rejection weight >= 100 - threshold
                BigDecimal impossibleThreshold = totalEligibleWeight.subtract(thresholdNeeded);
                if (rejectWeight.compareTo(impossibleThreshold) > 0) {
                    proposal.setStatus(VoteProposalStatus.REJECTED);
                    proposal.setFinalizedAt(Instant.now());
                    voteProposalRepository.save(proposal);

                    if (notificationService != null) {
                        try {
                            notificationService.notifyVoteFinalized(
                                    proposal.getVehicle().getId(),
                                    proposal.getGroup().getId(),
                                    proposal.getId(),
                                    proposal.getTitle(),
                                    false
                            );
                        } catch (Exception ignored) {
                        }
                    }
                }
            }
        }
    }

    private VoteProposalResponse buildProposalResponse(VoteProposal proposal, UUID currentUserId) {
        List<ProposalVote> votes = proposalVoteRepository.findByProposalId(proposal.getId());
        List<ProposalVoteEligibility> eligibilities = eligibilityRepository.findByProposalId(proposal.getId());

        BigDecimal totalEligibleWeight = eligibilities.stream()
                .map(ProposalVoteEligibility::getVotingWeight)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Set<UUID> eligibleUserIds = eligibilities.stream()
                .filter(e -> e.getUser() != null && e.getVotingWeight() != null && e.getVotingWeight().compareTo(BigDecimal.ZERO) > 0)
                .map(e -> e.getUser().getId())
                .collect(Collectors.toSet());

        Set<UUID> distinctApprovingUserIds = new HashSet<>();
        Set<UUID> distinctRejectingUserIds = new HashSet<>();
        Set<UUID> distinctAbstainingUserIds = new HashSet<>();

        BigDecimal approveWeight = BigDecimal.ZERO;
        BigDecimal rejectWeight = BigDecimal.ZERO;
        BigDecimal abstainWeight = BigDecimal.ZERO;

        ProposalVoteChoice currentUserVote = null;
        BigDecimal currentUserWeight = BigDecimal.ZERO;
        boolean isEligible = false;

        for (ProposalVote v : votes) {
            if (v.getVoterUser() == null || !eligibleUserIds.contains(v.getVoterUser().getId())) {
                continue;
            }
            UUID voterId = v.getVoterUser().getId();
            BigDecimal weight = v.getVotingWeightSnapshot() != null ? v.getVotingWeightSnapshot() : BigDecimal.ZERO;

            if (v.getChoice() == ProposalVoteChoice.APPROVE) {
                if (distinctApprovingUserIds.add(voterId)) {
                    approveWeight = approveWeight.add(weight);
                }
            } else if (v.getChoice() == ProposalVoteChoice.REJECT) {
                if (distinctRejectingUserIds.add(voterId)) {
                    rejectWeight = rejectWeight.add(weight);
                }
            } else if (v.getChoice() == ProposalVoteChoice.ABSTAIN) {
                if (distinctAbstainingUserIds.add(voterId)) {
                    abstainWeight = abstainWeight.add(weight);
                }
            }

            if (currentUserId != null && voterId.equals(currentUserId)) {
                currentUserVote = v.getChoice();
                currentUserWeight = weight;
            }
        }

        int approveCount = distinctApprovingUserIds.size();
        int rejectCount = distinctRejectingUserIds.size();
        int abstainCount = distinctAbstainingUserIds.size();
        int participatingMemberCount = approveCount + rejectCount + abstainCount;

        if (currentUserId != null) {
            for (ProposalVoteEligibility e : eligibilities) {
                if (e.getUser().getId().equals(currentUserId)) {
                    isEligible = true;
                    if (currentUserWeight.compareTo(BigDecimal.ZERO) == 0) {
                        currentUserWeight = e.getVotingWeight();
                    }
                    break;
                }
            }
        }

        BigDecimal participatingWeight = approveWeight.add(rejectWeight).add(abstainWeight);
        BigDecimal quorumNeeded = totalEligibleWeight.multiply(proposal.getRequiredQuorumPercentage())
                .divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
        BigDecimal thresholdNeeded = totalEligibleWeight.multiply(proposal.getRequiredThresholdPercentage())
                .divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);

        int eligibleMemberCount = eligibleUserIds.size() > 0 ? eligibleUserIds.size() : eligibilities.size();
        int requiredParticipatingMembers = (int) Math.ceil(eligibleMemberCount * 0.75);
        int requiredApprovingMembers = (eligibleMemberCount / 2) + 1;

        boolean memberQuorumMet = participatingMemberCount >= requiredParticipatingMembers;
        boolean weightQuorumMet = participatingWeight.compareTo(quorumNeeded) >= 0;
        boolean quorumSatisfied = memberQuorumMet && weightQuorumMet;

        boolean memberApprovalMet = approveCount >= requiredApprovingMembers;
        boolean weightThresholdMet = approveWeight.compareTo(thresholdNeeded) >= 0;
        boolean thresholdSatisfied = memberApprovalMet && weightThresholdMet;

        return new VoteProposalResponse(
                proposal.getId(),
                proposal.getGroup().getId(),
                proposal.getGroup().getName(),
                proposal.getVehicle().getId(),
                proposal.getVehicle().getName(),
                proposal.getVehicle().getLicensePlate(),
                proposal.getCreatedByUser().getId(),
                proposal.getCreatedByUser().getFullName(),
                proposal.getProposalType(),
                proposal.getProposalType().getVietnameseLabel(),
                proposal.getTitle(),
                proposal.getDescription(),
                proposal.getEstimatedAmount(),
                proposal.getApprovedBudget(),
                proposal.getCurrency(),
                proposal.getStatus(),
                proposal.getStatus().getVietnameseLabel(),
                proposal.getDecisionRule(),
                proposal.getDecisionRule().getVietnameseLabel(),
                proposal.getRequiredQuorumPercentage(),
                proposal.getRequiredThresholdPercentage(),
                proposal.getAgreementVersion(),
                proposal.getVotingStartsAt(),
                proposal.getVotingEndsAt(),
                proposal.getFinalizedAt(),
                proposal.getExecutionStatus(),
                proposal.getExecutionStatus().getVietnameseLabel(),
                proposal.getExecutionStartedAt(),
                proposal.getExecutionCompletedAt(),
                proposal.getExecutedByStaff() != null ? proposal.getExecutedByStaff().getFullName() : null,
                proposal.getActualCost(),
                proposal.getRelatedMaintenanceRequest() != null ? proposal.getRelatedMaintenanceRequest().getId() : null,
                proposal.getRelatedExpense() != null ? proposal.getRelatedExpense().getId() : null,
                totalEligibleWeight,
                eligibilities.size(),
                participatingWeight,
                votes.size(),
                approveWeight,
                rejectWeight,
                abstainWeight,
                approveCount,
                rejectCount,
                abstainCount,
                quorumSatisfied,
                thresholdSatisfied,
                currentUserVote,
                currentUserWeight,
                isEligible,
                eligibilities.stream().map(ProposalEligibilityDto::fromEntity).collect(Collectors.toList()),
                votes.stream().map(ProposalVoteResponse::fromEntity).collect(Collectors.toList()),
                proposal.getCreatedAt(),
                proposal.getUpdatedAt()
        );
    }

    /**
     * Section 4: Safe, Idempotent Reconciliation Mechanism for APPROVED maintenance proposals.
     * Inspects existing links first, creates only missing execution records, preserves budgets.
     */
    @Transactional
    public void reconcileApprovedProposals(UUID vehicleId) {
        List<VoteProposal> proposals;
        if (vehicleId != null) {
            proposals = voteProposalRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId);
        } else {
            proposals = voteProposalRepository.findAll();
        }

        for (VoteProposal p : proposals) {
            if (p.getStatus() == VoteProposalStatus.APPROVED
                    && (p.getProposalType() == VoteProposalType.MAINTENANCE || p.getProposalType() == VoteProposalType.REPAIR)) {

                // Dual approval validation: enforce quorum & member approval before advancing unexecuted proposals
                if (p.getExecutionStatus() == ProposalExecutionStatus.NOT_STARTED || p.getExecutionStatus() == ProposalExecutionStatus.PENDING_STAFF) {
                    List<ProposalVote> pVotes = proposalVoteRepository.findByProposalId(p.getId());
                    List<ProposalVoteEligibility> pElig = eligibilityRepository.findByProposalId(p.getId());
                    if (!pElig.isEmpty()) {
                        Set<UUID> eligibleIds = pElig.stream()
                                .filter(e -> e.getUser() != null && e.getVotingWeight() != null && e.getVotingWeight().compareTo(BigDecimal.ZERO) > 0)
                                .map(e -> e.getUser().getId())
                                .collect(Collectors.toSet());

                        long actApprovers = pVotes.stream()
                                .filter(v -> v.getVoterUser() != null && eligibleIds.contains(v.getVoterUser().getId()) && v.getChoice() == ProposalVoteChoice.APPROVE)
                                .map(v -> v.getVoterUser().getId())
                                .distinct()
                                .count();

                        long distinctParticipants = pVotes.stream()
                                .filter(v -> v.getVoterUser() != null && eligibleIds.contains(v.getVoterUser().getId()))
                                .map(v -> v.getVoterUser().getId())
                                .distinct()
                                .count();

                        int eligCount = eligibleIds.size() > 0 ? eligibleIds.size() : pElig.size();
                        int reqParticipants = (int) Math.ceil(eligCount * 0.75);
                        int reqApprovers = (eligCount / 2) + 1;

                        if (distinctParticipants < reqParticipants || actApprovers < reqApprovers) {
                            if (p.getVotingEndsAt() != null && Instant.now().isBefore(p.getVotingEndsAt())) {
                                p.setStatus(VoteProposalStatus.OPEN);
                                p.setFinalizedAt(null);
                                voteProposalRepository.save(p);
                                continue;
                            } else {
                                p.setStatus(distinctParticipants < reqParticipants ? VoteProposalStatus.EXPIRED : VoteProposalStatus.REJECTED);
                                p.setFinalizedAt(Instant.now());
                                voteProposalRepository.save(p);
                                continue;
                            }
                        }
                    }
                }

                // 1. Ensure approved budget is set from proposal estimated amount
                if (p.getApprovedBudget() == null && p.getEstimatedAmount() != null) {
                    p.setApprovedBudget(p.getEstimatedAmount());
                    p = voteProposalRepository.save(p);
                }

                // 2. Inspect existing links first
                if (p.getRelatedMaintenanceRequest() == null) {
                    Optional<MaintenanceRequest> existingMaintOpt = maintenanceRequestRepository.findByRelatedProposalId(p.getId());
                    if (existingMaintOpt.isPresent()) {
                        p.setRelatedMaintenanceRequest(existingMaintOpt.get());
                        voteProposalRepository.save(p);
                    } else {
                        // Create only missing work record
                        MaintenanceStatus targetMaintStatus = MaintenanceStatus.APPROVED;
                        if (p.getExecutionStatus() == ProposalExecutionStatus.COMPLETED) {
                            targetMaintStatus = MaintenanceStatus.COMPLETED;
                        } else if (p.getExecutionStatus() == ProposalExecutionStatus.IN_PROGRESS) {
                            targetMaintStatus = MaintenanceStatus.IN_PROGRESS;
                        } else if (p.getExecutionStatus() == ProposalExecutionStatus.ACCEPTED) {
                            targetMaintStatus = MaintenanceStatus.ACCEPTED;
                        }

                        MaintenanceRequest maint = new MaintenanceRequest(
                                UUID.randomUUID(),
                                p.getVehicle(),
                                targetMaintStatus,
                                MaintenancePriority.MEDIUM,
                                p.getProposalType() == VoteProposalType.REPAIR ? MaintenanceType.REPAIR : MaintenanceType.PREVENTIVE,
                                p.getTitle(),
                                p.getDescription(),
                                null,
                                p.getCreatedByUser(),
                                p.getExecutedByStaff()
                        );
                        maint.setApprovedAt(p.getFinalizedAt() != null ? p.getFinalizedAt() : Instant.now());
                        maint.setApprovedWeight(p.getRequiredThresholdPercentage());
                        maint.setRelatedProposalId(p.getId());

                        // Match damage records if applicable
                        if (p.getVehicle() != null) {
                            String t = (p.getTitle() != null ? p.getTitle().toUpperCase() : "") + " " + (p.getDescription() != null ? p.getDescription().toUpperCase() : "");
                            List<DamageRecord> vehicleDamages = damageRecordRepository.findByVehicleIdOrderByCreatedAtDesc(p.getVehicle().getId());
                            Set<DamageRecord> matchedDamages = new HashSet<>();
                            for (DamageRecord d : vehicleDamages) {
                                if (d.getStatus() == DamageStatus.OPEN && d.getVehiclePartCode() != null) {
                                    String partCode = d.getVehiclePartCode().toUpperCase();
                                    if (t.contains(partCode) || (partCode.equals("DOOR_RL") && (t.contains("CỬA SAU TRÁI") || t.contains("CỬA SAU T"))) || (partCode.equals("DOOR_FR") && (t.contains("CỬA TRƯỚC PHẢI") || t.contains("CỬA TRƯỚC P")))) {
                                        matchedDamages.add(d);
                                    }
                                }
                            }
                            if (!matchedDamages.isEmpty()) {
                                maint.setDamageRecords(matchedDamages);
                            }
                        }

                        MaintenanceRequest savedMaint = maintenanceRequestRepository.save(maint);
                        p.setRelatedMaintenanceRequest(savedMaint);
                        voteProposalRepository.save(p);
                    }
                }
            }
        }
    }

    private ApprovedWorkResponse mapToApprovedWorkResponse(VoteProposal proposal) {
        boolean canStart = proposal.getStatus() == VoteProposalStatus.APPROVED
                && (proposal.getExecutionStatus() == ProposalExecutionStatus.NOT_STARTED
                    || proposal.getExecutionStatus() == ProposalExecutionStatus.PENDING_STAFF
                    || proposal.getExecutionStatus() == ProposalExecutionStatus.ACCEPTED);

        String blockReason = null;
        if (proposal.getStatus() == VoteProposalStatus.OPEN) {
            blockReason = "ĐANG CHỜ BIỂU QUYẾT";
        } else if (proposal.getStatus() == VoteProposalStatus.REJECTED) {
            blockReason = "ĐỀ XUẤT ĐÃ BỊ TỪ CHỐI";
        } else if (proposal.getStatus() == VoteProposalStatus.EXPIRED) {
            blockReason = "ĐỀ XUẤT ĐÃ HẾT HẠN";
        } else if (proposal.getExecutionStatus() == ProposalExecutionStatus.IN_PROGRESS) {
            blockReason = "CÔNG VIỆC ĐANG ĐƯỢC TIẾN HÀNH";
        } else if (proposal.getExecutionStatus() == ProposalExecutionStatus.COMPLETED) {
            blockReason = "CÔNG VIỆC ĐÃ HOÀN TẤT";
        }

        return new ApprovedWorkResponse(
                proposal.getId(),
                proposal.getId(),
                proposal.getVehicle().getId(),
                proposal.getVehicle().getName(),
                proposal.getVehicle().getLicensePlate(),
                proposal.getGroup().getId(),
                proposal.getGroup().getName(),
                proposal.getCreatedByUser() != null ? proposal.getCreatedByUser().getFullName() : "Đồng sở hữu",
                proposal.getProposalType(),
                proposal.getProposalType().getVietnameseLabel(),
                proposal.getTitle(),
                proposal.getDescription(),
                proposal.getApprovedBudget(),
                proposal.getEstimatedAmount(),
                proposal.getCurrency(),
                proposal.getStatus(),
                proposal.getStatus().getVietnameseLabel(),
                proposal.getExecutionStatus(),
                proposal.getExecutionStatus().getVietnameseLabel(),
                proposal.getFinalizedAt(),
                proposal.getExecutionStartedAt(),
                proposal.getExecutionCompletedAt(),
                proposal.getExecutedByStaff() != null ? proposal.getExecutedByStaff().getFullName() : null,
                proposal.getActualCost(),
                canStart,
                blockReason,
                proposal.getRelatedMaintenanceRequest() != null ? proposal.getRelatedMaintenanceRequest().getId() : null,
                proposal.getRelatedExpense() != null ? proposal.getRelatedExpense().getId() : null
        );
    }

    private ExpenseCategory mapProposalTypeToExpenseCategory(VoteProposalType type) {
        if (type == null) return ExpenseCategory.OTHER;
        return switch (type) {
            case MAINTENANCE -> ExpenseCategory.MAINTENANCE;
            case REPAIR -> ExpenseCategory.REPAIR;
            case ACCESSORY, UPGRADE, OTHER_COMMON_EXPENSE -> ExpenseCategory.OTHER;
            case OWNERSHIP_TRANSFER, MEMBER_ADMISSION, MEMBER_WITHDRAWAL ->
                throw new IllegalArgumentException("Loại đề xuất " + type.getVietnameseLabel()
                        + " thuộc quy chế quản trị thành viên, không tạo chi phí vận hành phương tiện.");
        };
    }

    private CoOwnershipGroup getActiveGroupForVehicle(UUID vehicleId) {
        List<GroupVehicle> gvs = groupVehicleRepository.findByVehicleIdAndStatus(vehicleId, GroupVehicleStatus.ACTIVE);
        if (!gvs.isEmpty()) {
            return gvs.get(0).getGroup();
        }
        return groupRepository.findByVehicleId(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhóm đồng sở hữu hoạt động cho xe: " + vehicleId));
    }

    public void validateVehicleAccess(UUID vehicleId, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new AccessDeniedException("Vui lòng đăng nhập để tiếp tục.");
        }

        Role role = principal.getUser().getRole();
        if (role == Role.STAFF || role == Role.ADMIN) {
            return;
        }

        UUID userId = principal.getId();
        List<GroupMember> activeMemberships = memberRepository.findByUserIdAndStatus(userId, MemberStatus.ACTIVE);
        boolean hasAccess = false;
        for (GroupMember member : activeMemberships) {
            if (member.getRemovedAt() != null) continue;
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
            throw new AccessDeniedException("Bạn không có quyền truy cập đề xuất biểu quyết của xe này.");
        }
    }
}
