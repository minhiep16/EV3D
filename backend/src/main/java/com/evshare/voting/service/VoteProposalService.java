package com.evshare.voting.service;

import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.common.exception.UnauthorizedException;
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
            com.evshare.contract.repository.CoOwnershipContractRepository contractRepository
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

        return buildProposalResponse(savedProposal, principal.getId());
    }

    /**
     * Get list of proposals for a vehicle, with auto-expiration check.
     */
    @Transactional
    public List<VoteProposalResponse> getProposalsForVehicle(UUID vehicleId, VoteProposalStatus statusFilter, UserPrincipal principal) {
        validateVehicleAccess(vehicleId, principal);

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

        BigDecimal approveWeight = BigDecimal.ZERO;
        BigDecimal rejectWeight = BigDecimal.ZERO;
        BigDecimal abstainWeight = BigDecimal.ZERO;
        int approveCount = 0;
        int rejectCount = 0;
        int abstainCount = 0;

        for (ProposalVote v : votes) {
            if (v.getChoice() == ProposalVoteChoice.APPROVE) {
                approveWeight = approveWeight.add(v.getVotingWeightSnapshot());
                approveCount++;
            } else if (v.getChoice() == ProposalVoteChoice.REJECT) {
                rejectWeight = rejectWeight.add(v.getVotingWeightSnapshot());
                rejectCount++;
            } else if (v.getChoice() == ProposalVoteChoice.ABSTAIN) {
                abstainWeight = abstainWeight.add(v.getVotingWeightSnapshot());
                abstainCount++;
            }
        }

        BigDecimal participatingWeight = approveWeight.add(rejectWeight).add(abstainWeight);
        BigDecimal actualQuorumPct = totalEligibleWeight.compareTo(BigDecimal.ZERO) > 0
                ? participatingWeight.multiply(new BigDecimal("100")).divide(totalEligibleWeight, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal actualApprovePct = totalEligibleWeight.compareTo(BigDecimal.ZERO) > 0
                ? approveWeight.multiply(new BigDecimal("100")).divide(totalEligibleWeight, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        boolean quorumMet = actualQuorumPct.compareTo(proposal.getRequiredQuorumPercentage()) >= 0;
        boolean thresholdMet = actualApprovePct.compareTo(proposal.getRequiredThresholdPercentage()) >= 0;

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
    @Transactional(readOnly = true)
    public List<ApprovedWorkResponse> getStaffApprovedWork(UUID vehicleId, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }

        List<VoteProposal> proposals;
        if (vehicleId != null) {
            proposals = voteProposalRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId);
        } else {
            proposals = voteProposalRepository.findAll();
        }

        return proposals.stream()
                .filter(p -> p.getStatus() == VoteProposalStatus.APPROVED
                        || p.getStatus() == VoteProposalStatus.OPEN
                        || p.getExecutionStatus() == ProposalExecutionStatus.IN_PROGRESS
                        || p.getExecutionStatus() == ProposalExecutionStatus.COMPLETED)
                .map(this::mapToApprovedWorkResponse)
                .collect(Collectors.toList());
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
        if (proposal.getRelatedMaintenanceRequest() != null) {
            MaintenanceRequest maint = proposal.getRelatedMaintenanceRequest();
            if (maint.getStatus() == MaintenanceStatus.APPROVED || maint.getStatus() == MaintenanceStatus.SCHEDULED) {
                maint.setStatus(MaintenanceStatus.IN_PROGRESS);
                maint.setStartedAt(Instant.now());
                maint.setAssignedStaff(principal.getUser());
                maintenanceRequestRepository.save(maint);

                // Update vehicle status to MAINTENANCE
                Vehicle vehicle = proposal.getVehicle();
                vehicle.setStatus(VehicleStatus.MAINTENANCE);
                vehicleRepository.save(vehicle);
            }
        }

        VoteProposal saved = voteProposalRepository.save(proposal);
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
        } catch (Exception e) {
            // Keep expense created even if share generation requires further trip verification
        }

        proposal.setRelatedExpense(savedExpense);

        // Complete linked MaintenanceRequest if any
        if (proposal.getRelatedMaintenanceRequest() != null) {
            MaintenanceRequest maint = proposal.getRelatedMaintenanceRequest();
            maint.setStatus(MaintenanceStatus.COMPLETED);
            maint.setCompletedAt(now);
            if (request.completionNote() != null) {
                maint.setCompletionNote(request.completionNote().trim());
            }
            maintenanceRequestRepository.save(maint);

            // Recheck vehicle availability
            Vehicle vehicle = proposal.getVehicle();
            vehicle.setStatus(VehicleStatus.AVAILABLE);
            vehicleRepository.save(vehicle);
        }

        VoteProposal saved = voteProposalRepository.save(proposal);
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

        BigDecimal approveWeight = BigDecimal.ZERO;
        BigDecimal rejectWeight = BigDecimal.ZERO;
        BigDecimal abstainWeight = BigDecimal.ZERO;

        for (ProposalVote v : votes) {
            if (v.getChoice() == ProposalVoteChoice.APPROVE) {
                approveWeight = approveWeight.add(v.getVotingWeightSnapshot());
            } else if (v.getChoice() == ProposalVoteChoice.REJECT) {
                rejectWeight = rejectWeight.add(v.getVotingWeightSnapshot());
            } else if (v.getChoice() == ProposalVoteChoice.ABSTAIN) {
                abstainWeight = abstainWeight.add(v.getVotingWeightSnapshot());
            }
        }

        BigDecimal participatingWeight = approveWeight.add(rejectWeight).add(abstainWeight);
        BigDecimal quorumNeeded = totalEligibleWeight.multiply(proposal.getRequiredQuorumPercentage())
                .divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
        BigDecimal thresholdNeeded = totalEligibleWeight.multiply(proposal.getRequiredThresholdPercentage())
                .divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);

        boolean quorumMet = participatingWeight.compareTo(quorumNeeded) >= 0;
        boolean thresholdMet = approveWeight.compareTo(thresholdNeeded) >= 0;
        boolean deadlinePassed = Instant.now().isAfter(proposal.getVotingEndsAt());

        // Decision logic
        if (proposal.getStatus() == VoteProposalStatus.OPEN) {
            if (quorumMet && thresholdMet) {
                // Approved!
                proposal.setStatus(VoteProposalStatus.APPROVED);
                proposal.setFinalizedAt(Instant.now());
                proposal.setApprovedBudget(proposal.getEstimatedAmount());

                // Sync linked maintenance request if present
                if (proposal.getRelatedMaintenanceRequest() != null) {
                    MaintenanceRequest maint = proposal.getRelatedMaintenanceRequest();
                    if (maint.getStatus() == MaintenanceStatus.PENDING_APPROVAL) {
                        maint.setStatus(MaintenanceStatus.APPROVED);
                        maint.setApprovedAt(Instant.now());
                        maint.setApprovedWeight(approveWeight);
                        maintenanceRequestRepository.save(maint);
                    }
                }
                voteProposalRepository.save(proposal);
            } else if (deadlinePassed) {
                // Deadline passed without meeting approval conditions
                if (!quorumMet) {
                    proposal.setStatus(VoteProposalStatus.EXPIRED);
                } else {
                    proposal.setStatus(VoteProposalStatus.REJECTED);
                }
                proposal.setFinalizedAt(Instant.now());

                // Sync linked maintenance request if present
                if (proposal.getRelatedMaintenanceRequest() != null) {
                    MaintenanceRequest maint = proposal.getRelatedMaintenanceRequest();
                    if (maint.getStatus() == MaintenanceStatus.PENDING_APPROVAL) {
                        maint.setStatus(MaintenanceStatus.REJECTED);
                        maintenanceRequestRepository.save(maint);
                    }
                }
                voteProposalRepository.save(proposal);
            } else {
                // Check if impossible to pass: rejection weight >= 100 - threshold
                BigDecimal impossibleThreshold = totalEligibleWeight.subtract(thresholdNeeded);
                if (rejectWeight.compareTo(impossibleThreshold) > 0) {
                    proposal.setStatus(VoteProposalStatus.REJECTED);
                    proposal.setFinalizedAt(Instant.now());
                    voteProposalRepository.save(proposal);
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

        BigDecimal approveWeight = BigDecimal.ZERO;
        BigDecimal rejectWeight = BigDecimal.ZERO;
        BigDecimal abstainWeight = BigDecimal.ZERO;
        int approveCount = 0;
        int rejectCount = 0;
        int abstainCount = 0;

        ProposalVoteChoice currentUserVote = null;
        BigDecimal currentUserWeight = BigDecimal.ZERO;
        boolean isEligible = false;

        for (ProposalVote v : votes) {
            if (v.getChoice() == ProposalVoteChoice.APPROVE) {
                approveWeight = approveWeight.add(v.getVotingWeightSnapshot());
                approveCount++;
            } else if (v.getChoice() == ProposalVoteChoice.REJECT) {
                rejectWeight = rejectWeight.add(v.getVotingWeightSnapshot());
                rejectCount++;
            } else if (v.getChoice() == ProposalVoteChoice.ABSTAIN) {
                abstainWeight = abstainWeight.add(v.getVotingWeightSnapshot());
                abstainCount++;
            }

            if (currentUserId != null && v.getVoterUser().getId().equals(currentUserId)) {
                currentUserVote = v.getChoice();
                currentUserWeight = v.getVotingWeightSnapshot();
            }
        }

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

        boolean quorumSatisfied = participatingWeight.compareTo(quorumNeeded) >= 0;
        boolean thresholdSatisfied = approveWeight.compareTo(thresholdNeeded) >= 0;

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

    private ApprovedWorkResponse mapToApprovedWorkResponse(VoteProposal proposal) {
        boolean canStart = proposal.getStatus() == VoteProposalStatus.APPROVED
                && proposal.getExecutionStatus() == ProposalExecutionStatus.NOT_STARTED;

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
