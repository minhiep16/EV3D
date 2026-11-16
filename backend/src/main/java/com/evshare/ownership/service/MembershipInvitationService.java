package com.evshare.ownership.service;

import com.evshare.common.exception.DuplicateResourceException;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.common.exception.UnauthorizedException;
import com.evshare.contract.dto.CreateContractVersionRequest;
import com.evshare.contract.entity.CoOwnershipContract;
import com.evshare.contract.entity.CoOwnershipContractVersion;
import com.evshare.contract.entity.ContractVersionStatus;
import com.evshare.contract.repository.CoOwnershipContractRepository;
import com.evshare.contract.repository.CoOwnershipContractVersionRepository;
import com.evshare.contract.service.CoOwnershipContractService;
import com.evshare.notification.service.NotificationService;
import com.evshare.ownership.dto.*;
import com.evshare.ownership.entity.*;
import com.evshare.ownership.repository.*;
import com.evshare.security.UserPrincipal;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import com.evshare.user.entity.UserStatus;
import com.evshare.user.repository.UserRepository;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.repository.VehicleRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.evshare.audit.service.AuditLogService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MembershipInvitationService {

    private static final Logger log = LoggerFactory.getLogger(MembershipInvitationService.class);

    public static final BigDecimal MIN_LEADER_TRANSFER_PERCENT = new BigDecimal("10.00");
    public static final BigDecimal TOTAL_OWNERSHIP = new BigDecimal("100.00");

    private final MembershipInvitationRepository invitationRepository;
    private final CoOwnershipGroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final OwnershipShareRepository shareRepository;
    private final GroupVehicleRepository groupVehicleRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final OwnershipChangeHistoryRepository historyRepository;
    private final CoOwnershipContractRepository contractRepository;
    private final CoOwnershipContractVersionRepository versionRepository;
    private final CoOwnershipContractService contractService;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    @Autowired(required = false)
    private AuditLogService auditLogService;

    public MembershipInvitationService(
            MembershipInvitationRepository invitationRepository,
            CoOwnershipGroupRepository groupRepository,
            GroupMemberRepository memberRepository,
            OwnershipShareRepository shareRepository,
            GroupVehicleRepository groupVehicleRepository,
            VehicleRepository vehicleRepository,
            UserRepository userRepository,
            OwnershipChangeHistoryRepository historyRepository,
            CoOwnershipContractRepository contractRepository,
            CoOwnershipContractVersionRepository versionRepository,
            CoOwnershipContractService contractService,
            NotificationService notificationService,
            PasswordEncoder passwordEncoder,
            ObjectMapper objectMapper
    ) {
        this.invitationRepository = invitationRepository;
        this.groupRepository = groupRepository;
        this.memberRepository = memberRepository;
        this.shareRepository = shareRepository;
        this.groupVehicleRepository = groupVehicleRepository;
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
        this.historyRepository = historyRepository;
        this.contractRepository = contractRepository;
        this.versionRepository = versionRepository;
        this.contractService = contractService;
        this.notificationService = notificationService;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
    }

    // ==========================================
    // 1. Leader Authorization & Permission Check
    // ==========================================

    @Transactional
    public InvitationPermissionResponse getInvitationPermission(UUID groupId, UUID vehicleId, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            return new InvitationPermissionResponse(false, null, null, BigDecimal.ZERO, BigDecimal.ZERO, MIN_LEADER_TRANSFER_PERCENT, "Chưa xác thực người dùng");
        }

        CoOwnershipGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhóm đồng sở hữu: " + groupId));

        UUID resolvedVehicleId = vehicleId != null ? vehicleId : resolveVehicleIdForGroup(group);

        GroupMember currentLeader = recalculateGroupLeader(groupId, resolvedVehicleId);
        if (currentLeader == null) {
            return new InvitationPermissionResponse(false, null, null, BigDecimal.ZERO, BigDecimal.ZERO, MIN_LEADER_TRANSFER_PERCENT, "Nhóm chưa có thành viên hoạt động");
        }

        User leaderUser = currentLeader.getUser();
        BigDecimal leaderShare = getMemberSharePercentage(groupId, resolvedVehicleId, currentLeader.getId());

        boolean isLeader = leaderUser.getId().equals(principal.getId());
        BigDecimal maxTransferable = leaderShare.max(BigDecimal.ZERO);

        String message = isLeader
                ? (leaderShare.compareTo(MIN_LEADER_TRANSFER_PERCENT) >= 0
                    ? "Bạn là Nhóm trưởng và đủ điều kiện mời thành viên mới (cần chuyển tối thiểu 10.00% cổ phần)."
                    : "Bạn là Nhóm trưởng nhưng tỷ lệ sở hữu hiện tại (" + leaderShare + "%) chưa đạt mức tối thiểu 10.00% để chuyển nhượng.")
                : "Chỉ Nhóm trưởng (" + leaderUser.getFullName() + " - " + leaderShare + "%) mới có quyền mời thành viên mới.";

        return new InvitationPermissionResponse(
                isLeader && leaderShare.compareTo(MIN_LEADER_TRANSFER_PERCENT) >= 0,
                leaderUser.getId(),
                leaderUser.getFullName(),
                leaderShare,
                maxTransferable,
                MIN_LEADER_TRANSFER_PERCENT,
                message
        );
    }

    public void validateIsGroupLeader(UUID groupId, UUID vehicleId, UUID userId) {
        GroupMember leader = recalculateGroupLeader(groupId, vehicleId);
        if (leader == null || !leader.getUser().getId().equals(userId)) {
            String leaderName = leader != null ? leader.getUser().getFullName() : "Khác";
            throw new AccessDeniedException("Chỉ Nhóm trưởng (thành viên sở hữu tỷ lệ cổ phần cao nhất: " + leaderName + ") mới có quyền khởi tạo lời mời thành viên mới.");
        }
    }

    // ==========================================
    // 2. Invitation Preview
    // ==========================================

    @Transactional(readOnly = true)
    public InvitationPreviewResponse previewInvitation(UUID groupId, InvitationPreviewRequest request, UserPrincipal principal) {
        CoOwnershipGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhóm: " + groupId));

        UUID vehicleId = resolveVehicleIdForGroup(group);
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Xe không tồn tại: " + vehicleId));

        User leader = principal != null ? principal.getUser() : null;
        if (leader == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }

        validateIsGroupLeader(groupId, vehicleId, leader.getId());

        BigDecimal leaderDeduction = request.leaderTransferPercentage() != null
                ? request.leaderTransferPercentage().setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        if (leaderDeduction.compareTo(MIN_LEADER_TRANSFER_PERCENT) < 0) {
            throw new IllegalArgumentException("Trưởng nhóm bắt buộc phải chuyển nhượng tối thiểu 10.00% tỷ lệ sở hữu.");
        }

        BigDecimal leaderCurrentShare = getUserSharePercentage(groupId, vehicleId, leader.getId());
        if (leaderDeduction.compareTo(leaderCurrentShare) > 0) {
            throw new IllegalArgumentException(String.format("Tỷ lệ chuyển nhượng (%.2f%%) vượt quá tỷ lệ sở hữu hiện tại của Trưởng nhóm (%.2f%%).", leaderDeduction, leaderCurrentShare));
        }

        // Additional voluntary contributions
        Map<UUID, BigDecimal> contributorDeductions = new HashMap<>();
        BigDecimal totalContributorDeduction = BigDecimal.ZERO;

        if (request.additionalContributions() != null) {
            for (ContributorShareContributionDto c : request.additionalContributions()) {
                if (c.userId() == null || c.percentage() == null || c.percentage().compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }
                if (c.userId().equals(leader.getId())) {
                    continue; // Leader is handled separately
                }
                BigDecimal contributorShare = getUserSharePercentage(groupId, vehicleId, c.userId());
                BigDecimal cDeduct = c.percentage().setScale(2, RoundingMode.HALF_UP);
                if (cDeduct.compareTo(contributorShare) > 0) {
                    throw new IllegalArgumentException(String.format("Cổ phần đóng góp của %s (%.2f%%) vượt quá tỷ lệ sở hữu hiện tại (%.2f%%).", c.fullName() != null ? c.fullName() : c.userId(), cDeduct, contributorShare));
                }
                contributorDeductions.put(c.userId(), cDeduct);
                totalContributorDeduction = totalContributorDeduction.add(cDeduct);
            }
        }

        BigDecimal totalOffered = leaderDeduction.add(totalContributorDeduction).setScale(2, RoundingMode.HALF_UP);

        // Invitee info
        User invitee = null;
        if (request.inviteeUserId() != null) {
            invitee = userRepository.findById(request.inviteeUserId()).orElse(null);
        } else if (request.inviteeEmail() != null && !request.inviteeEmail().isBlank()) {
            invitee = userRepository.findByEmail(request.inviteeEmail().trim()).orElse(null);
        }

        String inviteeName = invitee != null ? invitee.getFullName() : "Thành viên mới";
        String inviteeEmail = invitee != null ? invitee.getEmail() : (request.inviteeEmail() != null ? request.inviteeEmail() : "");

        // Build distributions
        List<GroupMember> activeMembers = memberRepository.findByGroupId(groupId).stream()
                .filter(m -> m.getStatus() == MemberStatus.ACTIVE)
                .toList();

        List<MemberSharePreviewDto> currentDistribution = new ArrayList<>();
        List<MemberSharePreviewDto> projectedDistribution = new ArrayList<>();

        GroupMember currentLeader = recalculateGroupLeader(groupId, vehicleId);
        UUID currentLeaderId = currentLeader != null ? currentLeader.getUser().getId() : null;
        String currentLeaderName = currentLeader != null ? currentLeader.getUser().getFullName() : "";

        // Determine projected max percentage & projected leader
        UUID projectedLeaderId = null;
        String projectedLeaderName = "";
        BigDecimal highestProjectedShare = BigDecimal.ZERO;
        Instant projectedEarliestJoin = Instant.MAX;

        for (GroupMember m : activeMembers) {
            BigDecimal currentP = getMemberSharePercentage(groupId, vehicleId, m.getId());
            BigDecimal deduct = BigDecimal.ZERO;
            if (m.getUser().getId().equals(leader.getId())) {
                deduct = leaderDeduction;
            } else if (contributorDeductions.containsKey(m.getUser().getId())) {
                deduct = contributorDeductions.get(m.getUser().getId());
            }

            BigDecimal projectedP = currentP.subtract(deduct).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

            currentDistribution.add(new MemberSharePreviewDto(
                    m.getUser().getId(),
                    m.getUser().getFullName(),
                    m.getUser().getEmail(),
                    currentP,
                    deduct,
                    projectedP,
                    m.getUser().getId().equals(currentLeaderId),
                    false,
                    m.getMemberRole().name()
            ));

            if (projectedP.compareTo(highestProjectedShare) > 0) {
                highestProjectedShare = projectedP;
                projectedLeaderId = m.getUser().getId();
                projectedLeaderName = m.getUser().getFullName();
                projectedEarliestJoin = m.getJoinedAt() != null ? m.getJoinedAt() : Instant.now();
            } else if (projectedP.compareTo(highestProjectedShare) == 0 && projectedP.compareTo(BigDecimal.ZERO) > 0) {
                // Tie breaking
                if (m.getUser().getId().equals(currentLeaderId)) {
                    projectedLeaderId = m.getUser().getId();
                    projectedLeaderName = m.getUser().getFullName();
                } else if (!Objects.equals(projectedLeaderId, currentLeaderId)) {
                    Instant joinTime = m.getJoinedAt() != null ? m.getJoinedAt() : Instant.now();
                    if (joinTime.isBefore(projectedEarliestJoin)) {
                        highestProjectedShare = projectedP;
                        projectedLeaderId = m.getUser().getId();
                        projectedLeaderName = m.getUser().getFullName();
                        projectedEarliestJoin = joinTime;
                    }
                }
            }
        }

        // Compare with invitee
        if (totalOffered.compareTo(highestProjectedShare) > 0) {
            highestProjectedShare = totalOffered;
            projectedLeaderId = invitee != null ? invitee.getId() : UUID.randomUUID();
            projectedLeaderName = inviteeName;
        }

        // Fill projected distribution list
        for (MemberSharePreviewDto c : currentDistribution) {
            boolean isProjLeader = c.userId().equals(projectedLeaderId);
            projectedDistribution.add(new MemberSharePreviewDto(
                    c.userId(),
                    c.fullName(),
                    c.email(),
                    c.currentPercentage(),
                    c.deductionPercentage(),
                    c.projectedPercentage(),
                    c.isCurrentLeader(),
                    isProjLeader,
                    isProjLeader ? "REPRESENTATIVE" : "MEMBER"
            ));
        }

        // Add invitee to projected distribution
        projectedDistribution.add(new MemberSharePreviewDto(
                invitee != null ? invitee.getId() : null,
                inviteeName + " (Thành viên mới)",
                inviteeEmail,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                totalOffered,
                false,
                Objects.equals(invitee != null ? invitee.getId() : null, projectedLeaderId),
                Objects.equals(invitee != null ? invitee.getId() : null, projectedLeaderId) ? "REPRESENTATIVE" : "MEMBER"
        ));

        boolean leaderChanges = !Objects.equals(currentLeaderId, projectedLeaderId);
        InvitationStatus initialStatus = contributorDeductions.isEmpty()
                ? InvitationStatus.PENDING_INVITEE_RESPONSE
                : InvitationStatus.PENDING_CONTRIBUTOR_CONSENT;

        return new InvitationPreviewResponse(
                group.getId(),
                group.getName(),
                vehicle.getId(),
                vehicle.getName(),
                invitee != null ? invitee.getId() : null,
                inviteeName,
                inviteeEmail,
                leaderDeduction,
                totalOffered,
                currentDistribution,
                projectedDistribution,
                currentLeaderId,
                currentLeaderName,
                projectedLeaderId,
                projectedLeaderName,
                leaderChanges,
                initialStatus.name(),
                contributorDeductions.isEmpty()
                        ? "Lời mời sẽ được chuyển thẳng đến người được mời."
                        : "Lời mời yêu cầu sự đồng thuận từ các đồng sở hữu đóng góp trước khi gửi đến người được mời."
        );
    }

    // ==========================================
    // 3. Create Invitation
    // ==========================================

    @Transactional
    public MembershipInvitationResponse createInvitation(UUID groupId, CreateInvitationRequest request, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }

        CoOwnershipGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhóm: " + groupId));

        UUID vehicleId = resolveVehicleIdForGroup(group);
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Xe không tồn tại: " + vehicleId));

        User leader = principal.getUser();
        validateIsGroupLeader(groupId, vehicleId, leader.getId());

        // Validate invitee
        User inviteeUser = null;
        String inviteeEmail = null;

        if (request.inviteeUserId() != null) {
            inviteeUser = userRepository.findById(request.inviteeUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng được mời."));
            inviteeEmail = inviteeUser.getEmail();
        } else if (request.inviteeEmail() != null && !request.inviteeEmail().isBlank()) {
            inviteeEmail = request.inviteeEmail().trim();
            inviteeUser = userRepository.findByEmailIgnoreCase(inviteeEmail).orElse(null);
            if (inviteeUser != null) {
                inviteeEmail = inviteeUser.getEmail();
            }
        } else {
            throw new IllegalArgumentException("Vui lòng cung cấp mã hoặc email người dùng được mời.");
        }

        if (inviteeUser != null) {
            if (inviteeUser.getStatus() != UserStatus.ACTIVE) {
                throw new IllegalArgumentException("Tài khoản người được mời hiện không ở trạng thái hoạt động.");
            }
            // Check if already active member in this group
            Optional<GroupMember> existingM = memberRepository.findByGroupIdAndUserId(groupId, inviteeUser.getId());
            if (existingM.isPresent() && existingM.get().getStatus() == MemberStatus.ACTIVE) {
                throw new DuplicateResourceException("Người dùng đã là thành viên đang hoạt động của nhóm.");
            }
        }

        // Leader deduction
        BigDecimal leaderTransfer = request.leaderTransferPercentage() != null
                ? request.leaderTransferPercentage().setScale(2, RoundingMode.HALF_UP)
                : (request.proposedPercentage() != null ? request.proposedPercentage().setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO);

        if (leaderTransfer.compareTo(MIN_LEADER_TRANSFER_PERCENT) < 0) {
            throw new IllegalArgumentException("Trưởng nhóm bắt buộc chuyển nhượng tối thiểu 10.00% tỷ lệ sở hữu.");
        }

        BigDecimal leaderShare = getUserSharePercentage(groupId, vehicleId, leader.getId());
        if (leaderTransfer.compareTo(leaderShare) > 0) {
            throw new IllegalArgumentException(String.format("Tỷ lệ chuyển nhượng của Trưởng nhóm (%.2f%%) vượt quá tỷ lệ sở hữu hiện tại (%.2f%%).", leaderTransfer, leaderShare));
        }

        // Contributor contributions
        List<ContributorShareContributionDto> contributorsList = new ArrayList<>();
        BigDecimal totalContributorDeduction = BigDecimal.ZERO;

        if (request.additionalContributions() != null) {
            for (ContributorShareContributionDto c : request.additionalContributions()) {
                if (c.userId() == null || c.percentage() == null || c.percentage().compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }
                if (c.userId().equals(leader.getId())) {
                    continue; // Skip leader in contributors list
                }
                User cUser = userRepository.findById(c.userId())
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thành viên đóng góp: " + c.userId()));

                BigDecimal cShare = getUserSharePercentage(groupId, vehicleId, cUser.getId());
                BigDecimal cP = c.percentage().setScale(2, RoundingMode.HALF_UP);
                if (cP.compareTo(cShare) > 0) {
                    throw new IllegalArgumentException(String.format("Cổ phần đóng góp của %s (%.2f%%) vượt quá tỷ lệ sở hữu (%.2f%%).", cUser.getFullName(), cP, cShare));
                }

                contributorsList.add(new ContributorShareContributionDto(
                        cUser.getId(),
                        cUser.getFullName(),
                        cUser.getEmail(),
                        cP,
                        false, // Consent pending
                        false,
                        null,
                        null
                ));
                totalContributorDeduction = totalContributorDeduction.add(cP);
            }
        }

        BigDecimal totalOffered = leaderTransfer.add(totalContributorDeduction).setScale(2, RoundingMode.HALF_UP);

        // Check if existing pending invitation already exists for this invitee
        if (inviteeUser != null) {
            List<InvitationStatus> pendingStatuses = List.of(
                    InvitationStatus.PENDING_CONTRIBUTOR_CONSENT,
                    InvitationStatus.PENDING_INVITEE_RESPONSE,
                    InvitationStatus.ACCEPTED,
                    InvitationStatus.PENDING_CONTRACT_SIGNATURE,
                    InvitationStatus.READY_FOR_COMPLETION
            );
            Optional<MembershipInvitation> existingInv = invitationRepository.findByGroupIdAndInviteeUserIdAndStatusIn(groupId, inviteeUser.getId(), pendingStatuses);
            if (existingInv.isPresent()) {
                throw new DuplicateResourceException("Đã tồn tại lời mời đang trong quá trình xử lý cho người dùng này.");
            }
        }

        InvitationStatus initialStatus = contributorsList.isEmpty()
                ? InvitationStatus.PENDING_INVITEE_RESPONSE
                : InvitationStatus.PENDING_CONTRIBUTOR_CONSENT;

        Instant expiresAt = Instant.now().plus(7, ChronoUnit.DAYS);

        MembershipInvitation invitation = new MembershipInvitation(
                UUID.randomUUID(),
                group,
                vehicle,
                leader,
                inviteeEmail,
                inviteeUser,
                totalOffered,
                request.invitationNote(),
                expiresAt
        );

        invitation.setLeaderTransferPercentage(leaderTransfer);
        invitation.setTotalOfferedPercentage(totalOffered);
        invitation.setAdditionalContributionsJson(toJson(contributorsList));
        invitation.setStatus(initialStatus);

        MembershipInvitation saved = invitationRepository.save(invitation);
        log.info("[MembershipInvitation] Created invitation {} for group {} with status {}", saved.getId(), groupId, initialStatus);

        // Notifications
        if (initialStatus == InvitationStatus.PENDING_CONTRIBUTOR_CONSENT) {
            for (ContributorShareContributionDto c : contributorsList) {
                notificationService.notifyContributorConsentNeeded(
                        c.userId(),
                        vehicle.getId(),
                        saved.getId(),
                        vehicle.getName(),
                        leader.getFullName(),
                        c.percentage()
                );
            }
        } else if (inviteeUser != null) {
            notificationService.notifyInviteeNewInvitation(
                    inviteeUser.getId(),
                    vehicle.getId(),
                    saved.getId(),
                    leader.getFullName(),
                    vehicle.getName(),
                    vehicle.getLicensePlate(),
                    group.getName(),
                    totalOffered,
                    saved.getExpiresAt()
            );
        }

        return enrichInvitationResponse(saved, principal.getUser());
    }

    // ==========================================
    // 4. Query Invitations
    // ==========================================

    @Transactional(readOnly = true)
    public List<MembershipInvitationResponse> getGroupInvitations(UUID groupId, UserPrincipal principal) {
        User user = principal != null ? principal.getUser() : null;
        List<MembershipInvitation> list = invitationRepository.findByGroupIdOrderByCreatedAtDesc(groupId);
        return list.stream()
                .map(inv -> enrichInvitationResponse(inv, user))
                .toList();
    }

    @Transactional
    public List<MembershipInvitationResponse> getMyInvitations(UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            return Collections.emptyList();
        }
        User user = principal.getUser();
        List<MembershipInvitation> list = invitationRepository
                .findByInviteeUserIdOrEmailIgnoreCaseOrderByCreatedAtDesc(user.getId(), user.getEmail());

        // Idempotently link invitee user if not yet associated, but do not create notifications in GET APIs (Section 6)
        boolean anyUpdated = false;
        for (MembershipInvitation inv : list) {
            if (inv.getInviteeUser() == null) {
                inv.setInviteeUser(user);
                anyUpdated = true;
            }
        }
        if (anyUpdated) {
            invitationRepository.saveAll(list);
        }

        return list.stream()
                .map(inv -> enrichInvitationResponse(inv, user))
                .toList();
    }

    @Transactional
    public MembershipInvitationResponse getInvitationById(UUID invitationId, UserPrincipal principal) {
        MembershipInvitation inv = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lời mời: " + invitationId));

        User user = principal != null ? principal.getUser() : null;
        if (user != null && inv.getInviteeUser() == null && inv.getInviteeEmail() != null
                && inv.getInviteeEmail().equalsIgnoreCase(user.getEmail())) {
            inv.setInviteeUser(user);
            invitationRepository.save(inv);
        }

        return enrichInvitationResponse(inv, user);
    }

    /**
     * Section 6 Idempotent Recovery for Pending Invitations.
     * Recovers missing persistent notifications for pending invitations awaiting invitee response
     * without modifying existing consent or requiring recreation.
     */
    @Transactional
    public List<MembershipInvitationResponse> recoverPendingInvitations(UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }
        User user = principal.getUser();

        List<InvitationStatus> pendingStatuses = List.of(
                InvitationStatus.PENDING_INVITEE_RESPONSE,
                InvitationStatus.INVITED
        );

        List<MembershipInvitation> candidates = invitationRepository
                .findByInviteeUserIdOrEmailIgnoreCaseAndStatusInOrderByCreatedAtDesc(
                        user.getId(),
                        user.getEmail(),
                        pendingStatuses
                );

        List<MembershipInvitation> recovered = new ArrayList<>();
        for (MembershipInvitation inv : candidates) {
            if (inv.getInviteeUser() == null) {
                inv.setInviteeUser(user);
            }

            String leaderName = inv.getInvitedByUser() != null ? inv.getInvitedByUser().getFullName() : "Trưởng nhóm";
            String vName = inv.getVehicle() != null ? inv.getVehicle().getName() : "xe điện";
            String vPlate = inv.getVehicle() != null ? inv.getVehicle().getLicensePlate() : "";
            String gName = inv.getGroup() != null ? inv.getGroup().getName() : "Nhóm đồng sở hữu";

            notificationService.notifyInviteeNewInvitation(
                    user.getId(),
                    inv.getVehicle() != null ? inv.getVehicle().getId() : null,
                    inv.getId(),
                    leaderName,
                    vName,
                    vPlate,
                    gName,
                    inv.getTotalOfferedPercentage(),
                    inv.getExpiresAt()
            );

            invitationRepository.save(inv);
            recovered.add(inv);
            log.info("[MembershipInvitation] Recovered pending invitation notification {} for user {}.", inv.getId(), user.getEmail());
        }

        return recovered.stream()
                .map(inv -> enrichInvitationResponse(inv, user))
                .toList();
    }

    /**
     * Resend / deliver notification for a specific pending invitation ID.
     */
    @Transactional
    public MembershipInvitationResponse resendInvitationNotification(UUID invitationId, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }
        MembershipInvitation inv = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lời mời: " + invitationId));

        if (inv.getStatus() != InvitationStatus.PENDING_INVITEE_RESPONSE && inv.getStatus() != InvitationStatus.INVITED) {
            throw new IllegalStateException("Chỉ có thể gửi lại thông báo cho lời mời đang chờ phản hồi.");
        }

        User invitee = inv.getInviteeUser();
        if (invitee == null && inv.getInviteeEmail() != null) {
            invitee = userRepository.findByEmailIgnoreCase(inv.getInviteeEmail().trim()).orElse(null);
            if (invitee != null) {
                inv.setInviteeUser(invitee);
                invitationRepository.save(inv);
            }
        }

        if (invitee != null) {
            String leaderName = inv.getInvitedByUser() != null ? inv.getInvitedByUser().getFullName() : "Trưởng nhóm";
            String vName = inv.getVehicle() != null ? inv.getVehicle().getName() : "xe điện";
            String vPlate = inv.getVehicle() != null ? inv.getVehicle().getLicensePlate() : "";
            String gName = inv.getGroup() != null ? inv.getGroup().getName() : "Nhóm đồng sở hữu";

            notificationService.notifyInviteeNewInvitation(
                    invitee.getId(),
                    inv.getVehicle() != null ? inv.getVehicle().getId() : null,
                    inv.getId(),
                    leaderName,
                    vName,
                    vPlate,
                    gName,
                    inv.getTotalOfferedPercentage(),
                    inv.getExpiresAt()
            );
        }

        return enrichInvitationResponse(inv, principal.getUser());
    }

    // ==========================================
    // 5. Contributor Consent Workflow
    // ==========================================

    @Transactional
    public MembershipInvitationResponse recordContributorConsent(UUID invitationId, InvitationConsentActionRequest request, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }

        MembershipInvitation inv = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lời mời: " + invitationId));

        if (inv.getStatus() != InvitationStatus.PENDING_CONTRIBUTOR_CONSENT) {
            throw new IllegalStateException("Lời mời hiện không ở trạng thái chờ đồng sở hữu xác nhận đóng góp.");
        }

        UUID userId = principal.getId();
        List<ContributorShareContributionDto> contributors = parseContributors(inv.getAdditionalContributionsJson());

        boolean found = false;
        boolean allApproved = true;

        List<ContributorShareContributionDto> updated = new ArrayList<>();
        for (ContributorShareContributionDto c : contributors) {
            if (c.userId().equals(userId)) {
                found = true;
                if (Boolean.TRUE.equals(request.approved())) {
                    updated.add(new ContributorShareContributionDto(
                            c.userId(), c.fullName(), c.email(), c.percentage(),
                            true, false, Instant.now(), request.note()
                    ));
                } else {
                    updated.add(new ContributorShareContributionDto(
                            c.userId(), c.fullName(), c.email(), c.percentage(),
                            false, true, Instant.now(), request.note()
                    ));
                    allApproved = false;
                }
            } else {
                updated.add(c);
                if (!Boolean.TRUE.equals(c.consented())) {
                    allApproved = false;
                }
            }
        }

        if (!found) {
            throw new AccessDeniedException("Bạn không nằm trong danh sách đồng sở hữu được yêu cầu đóng góp cho lời mời này.");
        }

        inv.setAdditionalContributionsJson(toJson(updated));

        if (Boolean.FALSE.equals(request.approved())) {
            // Contributor declined: cancel invitation
            inv.setStatus(InvitationStatus.CANCELLED);
            inv.setCancelledAt(Instant.now());
            inv.setRejectionReason("Đồng sở hữu " + principal.getUser().getFullName() + " đã từ chối đóng góp cổ phần.");
            invitationRepository.save(inv);

            notificationService.notifyLeaderContributorDeclined(
                    inv.getInvitedByUser().getId(),
                    inv.getVehicle().getId(),
                    inv.getId(),
                    principal.getUser().getFullName()
            );

            log.info("[MembershipInvitation] Contributor {} declined invitation {}. Status set to CANCELLED.", userId, invitationId);
            return enrichInvitationResponse(inv, principal.getUser());
        }

        if (allApproved) {
            // All contributors consented! Transition to PENDING_INVITEE_RESPONSE
            inv.setStatus(InvitationStatus.PENDING_INVITEE_RESPONSE);

            // Re-resolve invitee user if not yet linked (e.g. registered after creation or case difference)
            if (inv.getInviteeUser() == null && inv.getInviteeEmail() != null && !inv.getInviteeEmail().isBlank()) {
                userRepository.findByEmailIgnoreCase(inv.getInviteeEmail().trim())
                        .ifPresent(inv::setInviteeUser);
            }

            invitationRepository.save(inv);

            if (inv.getInviteeUser() != null) {
                String leaderName = inv.getInvitedByUser() != null ? inv.getInvitedByUser().getFullName() : "Trưởng nhóm";
                String vName = inv.getVehicle() != null ? inv.getVehicle().getName() : "xe điện";
                String vPlate = inv.getVehicle() != null ? inv.getVehicle().getLicensePlate() : "";
                String gName = inv.getGroup() != null ? inv.getGroup().getName() : "Nhóm đồng sở hữu";

                notificationService.notifyInviteeNewInvitation(
                        inv.getInviteeUser().getId(),
                        inv.getVehicle() != null ? inv.getVehicle().getId() : null,
                        inv.getId(),
                        leaderName,
                        vName,
                        vPlate,
                        gName,
                        inv.getTotalOfferedPercentage(),
                        inv.getExpiresAt()
                );
            }
            log.info("[MembershipInvitation] All contributors consented for invitation {}. Status set to PENDING_INVITEE_RESPONSE.", invitationId);
        } else {
            invitationRepository.save(inv);
        }

        return enrichInvitationResponse(inv, principal.getUser());
    }

    // ==========================================
    // 6. Invitee Respond (Accept / Reject)
    // ==========================================

    @Transactional
    public MembershipInvitationResponse respondToInvitation(UUID invitationId, InvitationRespondRequest request, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }

        MembershipInvitation inv = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lời mời: " + invitationId));

        if (inv.getStatus() != InvitationStatus.PENDING_INVITEE_RESPONSE && inv.getStatus() != InvitationStatus.INVITED) {
            throw new IllegalStateException("Lời mời hiện không ở trạng thái chờ người được mời phản hồi.");
        }

        User user = principal.getUser();
        boolean isInvitee = (inv.getInviteeUser() != null && inv.getInviteeUser().getId().equals(user.getId()))
                || (inv.getInviteeEmail() != null && inv.getInviteeEmail().equalsIgnoreCase(user.getEmail()));

        if (!isInvitee) {
            throw new AccessDeniedException("Bạn không phải là người được mời cho lời mời này.");
        }

        // Link inviteeUser if not previously linked
        if (inv.getInviteeUser() == null) {
            inv.setInviteeUser(user);
        }

        if (Boolean.FALSE.equals(request.accept())) {
            inv.setStatus(InvitationStatus.REJECTED);
            inv.setRejectedAt(Instant.now());
            inv.setRejectionReason(request.reason() != null && !request.reason().isBlank() ? request.reason().trim() : "Người được mời đã từ chối.");
            invitationRepository.save(inv);

            notificationService.notifyLeaderInviteeRejected(
                    inv.getInvitedByUser().getId(),
                    inv.getVehicle().getId(),
                    inv.getId(),
                    user.getFullName(),
                    request.reason()
            );

            log.info("[MembershipInvitation] Invitee {} rejected invitation {}", user.getId(), invitationId);
            return enrichInvitationResponse(inv, user);
        }

        // Invitee accepted terms!
        inv.setStatus(InvitationStatus.PENDING_CONTRACT_SIGNATURE);
        inv.setAcceptedAt(Instant.now());

        // Generate legal digital contract version/amendment
        CoOwnershipContract contract = contractRepository.findByGroupId(inv.getGroup().getId())
                .orElseGet(() -> contractService.getContractSummaryByVehicle(inv.getVehicle().getId().toString(), principal) != null
                        ? contractRepository.findByGroupId(inv.getGroup().getId()).orElse(null) : null);

        if (contract != null) {
            inv.setContractId(contract.getId());
            try {
                CoOwnershipContractVersion version = generateOnboardingContractVersion(contract, inv, user);
                inv.setContractVersionId(version.getId());
            } catch (Exception ex) {
                log.warn("[MembershipInvitation] Could not auto-generate contract version: {}", ex.getMessage());
            }
        }

        invitationRepository.save(inv);

        // Notifications
        notificationService.notifyLeaderInviteeAccepted(
                inv.getInvitedByUser().getId(),
                inv.getVehicle().getId(),
                inv.getId(),
                user.getFullName()
        );

        notificationService.notifyContractSignatureRequired(
                user.getId(),
                inv.getVehicle().getId(),
                inv.getId(),
                inv.getVehicle().getName()
        );

        log.info("[MembershipInvitation] Invitee {} accepted invitation {}. Status set to PENDING_CONTRACT_SIGNATURE.", user.getId(), invitationId);
        return enrichInvitationResponse(inv, user);
    }

    // ==========================================
    // 7. Digital Contract DEMO Signing
    // ==========================================

    @Transactional
    public MembershipInvitationResponse signInvitation(
            UUID invitationId,
            InvitationSignRequest request,
            HttpServletRequest servletRequest,
            UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }

        MembershipInvitation inv = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lời mời: " + invitationId));

        if (inv.getStatus() != InvitationStatus.PENDING_CONTRACT_SIGNATURE && inv.getStatus() != InvitationStatus.ACCEPTED) {
            throw new IllegalStateException("Lời mời hiện không ở trạng thái chờ ký hợp đồng.");
        }

        // Validate invitation expiration
        if (inv.getExpiresAt() != null && inv.getExpiresAt().isBefore(Instant.now())) {
            inv.setStatus(InvitationStatus.EXPIRED);
            invitationRepository.save(inv);
            throw new IllegalStateException("Lời mời tham gia đã hết hạn vào lúc " + inv.getExpiresAt() + ".");
        }

        User signer = principal.getUser();
        String ipAddress = extractClientIp(servletRequest);
        String userAgent = extractUserAgent(servletRequest);
        String signerMethod = request != null && request.signatureMethod() != null ? request.signatureMethod() : "DEMO_AUTHENTICATED_PIN";

        // Verify DEMO PIN authentication
        String pin = request != null ? request.pinOrPassword() : null;
        if (pin == null || pin.isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập mã PIN xác thực ký số.");
        }
        boolean pinValid = "123456".equals(pin.trim());
        if (!pinValid && passwordEncoder != null && signer.getPasswordHash() != null) {
            pinValid = passwordEncoder.matches(pin.trim(), signer.getPasswordHash());
        }
        if (!pinValid) {
            log.warn("[MembershipInvitation] Invalid signing PIN attempt for invitation {} by user {}", invitationId, signer.getId());
            throw new IllegalArgumentException("Mã PIN xác thực ký số không chính xác (Mặc định DEMO: 123456).");
        }

        // Check if signer is invitee, leader, or contributor
        boolean isInvitee = (inv.getInviteeUser() != null && inv.getInviteeUser().getId().equals(signer.getId()))
                || (inv.getInviteeEmail() != null && inv.getInviteeEmail().equalsIgnoreCase(signer.getEmail()));
        if (isInvitee && inv.getInviteeUser() == null) {
            inv.setInviteeUser(signer);
            invitationRepository.save(inv);
        }
        boolean isLeader = inv.getInvitedByUser().getId().equals(signer.getId());
        List<ContributorShareContributionDto> contributors = parseContributors(inv.getAdditionalContributionsJson());
        boolean isContributor = contributors.stream().anyMatch(c -> c.userId().equals(signer.getId()));

        if (!isInvitee && !isLeader && !isContributor && signer.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Bạn không thuộc danh sách các bên bắt buộc ký kết hợp đồng này.");
        }

        // For contributors, explicit consent must have been confirmed
        if (isContributor) {
            boolean hasConsent = contributors.stream()
                    .anyMatch(c -> c.userId().equals(signer.getId()) && Boolean.TRUE.equals(c.consented()));
            if (!hasConsent && signer.getRole() != Role.ADMIN) {
                throw new IllegalStateException("Bạn cần xác nhận đồng ý đóng góp cổ phần trước khi ký phụ lục hợp đồng.");
            }
        }

        String signerRole = isInvitee ? "NGƯỜI_ĐƯỢC_MỜI" : (isLeader ? "TRƯỞNG_NHÓM" : "ĐỒNG_SỞ_HỮU_ĐÓNG_GÓP");

        List<Map<String, Object>> sigList = parseSignatures(inv.getSignaturesJson());
        boolean alreadySigned = sigList.stream().anyMatch(s -> signer.getId().toString().equals(s.get("userId")));
        if (alreadySigned) {
            log.info("[MembershipInvitation] User {} has already signed invitation {}. Handling idempotently.", signer.getId(), invitationId);
            return enrichInvitationResponse(inv, signer);
        }

        // Ensure contract version is linked, immutable and verified
        CoOwnershipContractVersion version = ensureContractVersionBound(inv);
        if (version != null) {
            // Verify content hash integrity if provided by client
            if (request != null && request.contentHash() != null && !request.contentHash().isBlank()) {
                if (!request.contentHash().equalsIgnoreCase(version.getContentHash())) {
                    log.warn("[MembershipInvitation] Client content hash {} does not match server version hash {}",
                            request.contentHash(), version.getContentHash());
                    throw new IllegalStateException("Mã băm nội dung tài liệu không khớp với phiên bản máy chủ. Vui lòng tải lại trang.");
                }
            }
        }

        Map<String, Object> sig = new LinkedHashMap<>();
        sig.put("userId", signer.getId().toString());
        sig.put("signerName", signer.getFullName());
        sig.put("role", signerRole);
        sig.put("signedAt", Instant.now().toString());
        sig.put("ipAddress", ipAddress);
        sig.put("userAgent", userAgent);
        sig.put("method", signerMethod);
        sigList.add(sig);

        inv.setSignaturesJson(toJson(sigList));

        // Also record acceptance in contract version if present
        if (inv.getContractVersionId() != null) {
            String authoritativeHash = version != null ? version.getContentHash() : null;
            if (authoritativeHash == null) {
                authoritativeHash = versionRepository.findById(inv.getContractVersionId())
                        .map(CoOwnershipContractVersion::getContentHash)
                        .orElse(null);
            }

            contractService.acceptContractVersion(
                    inv.getContractVersionId(),
                    new com.evshare.contract.dto.ContractAcceptanceRequest(
                            authoritativeHash,
                            signer.getFullName() + " (Đã ký số " + signerRole + ")"
                    ),
                    principal,
                    ipAddress,
                    userAgent
            );
        }

        if (auditLogService != null) {
            auditLogService.recordLog(
                    signer,
                    "CONTRACT_SIGNING",
                    "MEMBERSHIP_INVITATION",
                    invitationId.toString(),
                    null,
                    "SIGNED",
                    String.format("Ký số hợp đồng bởi %s (%s) cho lời mời %s.", signer.getFullName(), signerRole, invitationId),
                    ipAddress
            );
        }

        // Check if all required parties have signed
        // Required: Invitee + Leader + any contributors
        Set<UUID> requiredUserIds = new HashSet<>();
        if (inv.getInviteeUser() != null) requiredUserIds.add(inv.getInviteeUser().getId());
        requiredUserIds.add(inv.getInvitedByUser().getId());
        for (ContributorShareContributionDto c : contributors) {
            requiredUserIds.add(c.userId());
        }

        Set<String> signedUserIds = sigList.stream()
                .map(s -> (String) s.get("userId"))
                .collect(Collectors.toSet());

        boolean allSigned = true;
        for (UUID reqId : requiredUserIds) {
            if (!signedUserIds.contains(reqId.toString())) {
                allSigned = false;
                break;
            }
        }

        if (allSigned) {
            inv.setStatus(InvitationStatus.READY_FOR_COMPLETION);
            invitationRepository.save(inv);
            log.info("[MembershipInvitation] All signatures collected for invitation {}. Executing atomic finalization...", invitationId);

            // Execute atomic finalization immediately
            finalizeMembershipAtomic(inv);
        } else {
            invitationRepository.save(inv);
            log.info("[MembershipInvitation] Signature by {} recorded for invitation {}. Waiting for others.", signer.getFullName(), invitationId);

            // Notify remaining signers that their signature is needed
            for (UUID reqId : requiredUserIds) {
                if (!signedUserIds.contains(reqId.toString())) {
                    try {
                        notificationService.notifyContractSignatureRequired(
                                reqId,
                                inv.getVehicle() != null ? inv.getVehicle().getId() : null,
                                inv.getId(),
                                inv.getVehicle() != null ? inv.getVehicle().getName() : "xe điện"
                        );
                    } catch (Exception ex) {
                        log.warn("[MembershipInvitation] Failed to dispatch signature required notification to user {}: {}", reqId, ex.getMessage());
                    }
                }
            }
        }

        return enrichInvitationResponse(inv, signer);
    }

    // ==========================================
    // 8. Atomic Finalization & Share Allocation
    // ==========================================

    @Transactional
    public MembershipInvitationResponse finalizeInvitation(UUID invitationId, UserPrincipal principal) {
        MembershipInvitation inv = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lời mời: " + invitationId));

        if (inv.getStatus() == InvitationStatus.COMPLETED) {
            return enrichInvitationResponse(inv, principal != null ? principal.getUser() : null);
        }

        if (inv.getStatus() != InvitationStatus.READY_FOR_COMPLETION && inv.getStatus() != InvitationStatus.PENDING_CONTRACT_SIGNATURE) {
            throw new IllegalStateException("Lời mời chưa hoàn tất đầy đủ chữ ký hợp đồng.");
        }

        finalizeMembershipAtomic(inv);
        return enrichInvitationResponse(inv, principal != null ? principal.getUser() : null);
    }

    private void finalizeMembershipAtomic(MembershipInvitation inv) {
        UUID groupId = inv.getGroup().getId();
        UUID vehicleId = inv.getVehicle().getId();
        User inviteeUser = inv.getInviteeUser();
        User leader = inv.getInvitedByUser();

        if (inviteeUser == null) {
            throw new IllegalStateException("Thông tin người dùng được mời không hợp lệ.");
        }

        BigDecimal leaderDeduct = inv.getLeaderTransferPercentage() != null ? inv.getLeaderTransferPercentage() : BigDecimal.ZERO;
        BigDecimal totalOffered = inv.getTotalOfferedPercentage() != null ? inv.getTotalOfferedPercentage() : BigDecimal.ZERO;

        log.info("[MembershipInvitation] Executing atomic finalization: groupId={}, vehicleId={}, invitee={}, totalShare={}%",
                groupId, vehicleId, inviteeUser.getFullName(), totalOffered);

        // Snapshot PREVIOUS ownership state
        String previousSnapshotJson = buildOwnershipSnapshotJson(groupId, vehicleId);

        // 1. Deduct leader share
        OwnershipShare leaderShare = shareRepository.findByGroupIdAndVehicleIdAndMemberId(
                groupId, vehicleId, getMemberIdForUser(groupId, leader.getId())
        ).orElseThrow(() -> new IllegalStateException("Không tìm thấy cổ phần của Trưởng nhóm"));

        if (leaderShare.getPercentage().compareTo(leaderDeduct) < 0) {
            throw new IllegalStateException("Cổ phần hiện tại của Trưởng nhóm (" + leaderShare.getPercentage()
                    + "%) không đủ để chuyển giao " + leaderDeduct + "%. Giao dịch bị hủy.");
        }

        BigDecimal newLeaderShare = leaderShare.getPercentage().subtract(leaderDeduct).setScale(2, RoundingMode.HALF_UP);
        leaderShare.setPercentage(newLeaderShare);
        shareRepository.save(leaderShare);

        // 2. Deduct contributor shares
        List<ContributorShareContributionDto> contributors = parseContributors(inv.getAdditionalContributionsJson());
        for (ContributorShareContributionDto c : contributors) {
            if (c.percentage() != null && c.percentage().compareTo(BigDecimal.ZERO) > 0) {
                OwnershipShare cShare = shareRepository.findByGroupIdAndVehicleIdAndMemberId(
                        groupId, vehicleId, getMemberIdForUser(groupId, c.userId())
                ).orElseThrow(() -> new IllegalStateException("Không tìm thấy cổ phần của thành viên đóng góp: " + c.fullName()));

                if (cShare.getPercentage().compareTo(c.percentage()) < 0) {
                    throw new IllegalStateException("Cổ phần hiện tại của thành viên " + c.fullName() + " (" + cShare.getPercentage()
                            + "%) không đủ để đóng góp " + c.percentage() + "%. Giao dịch bị hủy.");
                }

                BigDecimal newCShare = cShare.getPercentage().subtract(c.percentage()).setScale(2, RoundingMode.HALF_UP);
                cShare.setPercentage(newCShare);
                shareRepository.save(cShare);
            }
        }

        // 3. Add or reactivate new member
        GroupMember newMember = memberRepository.findByGroupIdAndUserId(groupId, inviteeUser.getId())
                .orElseGet(() -> new GroupMember(UUID.randomUUID(), inv.getGroup(), inviteeUser, GroupMemberRole.MEMBER, MemberStatus.ACTIVE));

        newMember.setStatus(MemberStatus.ACTIVE);
        newMember.setMemberRole(GroupMemberRole.MEMBER);
        newMember.setJoinedAt(Instant.now());
        newMember.setRemovedAt(null);
        GroupMember savedNewMember = memberRepository.save(newMember);

        // 4. Assign OwnershipShare to new member
        OwnershipShare newMemberShare = shareRepository.findByGroupIdAndVehicleIdAndMemberId(
                groupId, vehicleId, savedNewMember.getId()
        ).orElseGet(() -> new OwnershipShare(UUID.randomUUID(), inv.getGroup(), inv.getVehicle(), savedNewMember, totalOffered));

        newMemberShare.setPercentage(totalOffered);
        shareRepository.save(newMemberShare);

        // Ensure CoOwnershipGroup and GroupVehicle refer to the active vehicle
        if (inv.getGroup() != null) {
            if (inv.getGroup().getVehicleId() == null) {
                inv.getGroup().setVehicleId(vehicleId);
                groupRepository.save(inv.getGroup());
            }
            List<GroupVehicle> existingGvs = groupVehicleRepository.findByGroupIdAndStatus(groupId, GroupVehicleStatus.ACTIVE);
            if (existingGvs.isEmpty()) {
                GroupVehicle gv = new GroupVehicle(UUID.randomUUID(), inv.getGroup(), inv.getVehicle(), GroupVehicleStatus.ACTIVE);
                groupVehicleRepository.save(gv);
            }
        }

        // 5. Invariant verification: Total shares MUST EQUAL 100.00%
        BigDecimal totalSum = shareRepository.sumPercentageByGroupIdAndVehicleId(groupId, vehicleId);
        if (totalSum == null || totalSum.setScale(2, RoundingMode.HALF_UP).compareTo(TOTAL_OWNERSHIP) != 0) {
            throw new IllegalStateException("Vi phạm bất biến: Tổng tỷ lệ sở hữu sau khi kết nạp thành viên không bằng 100.00% (Hiện tại: " + totalSum + "%). Giao dịch bị hủy.");
        }

        // Snapshot NEW ownership state
        String newSnapshotJson = buildOwnershipSnapshotJson(groupId, vehicleId);
        Instant now = Instant.now();

        // 6. Record immutable OwnershipChangeHistory audit trail
        // Leader contribution
        if (leaderDeduct.compareTo(BigDecimal.ZERO) > 0) {
            recordHistoryEntry(
                    inv.getGroup(),
                    inv.getVehicle(),
                    leader,
                    inviteeUser,
                    leaderDeduct,
                    previousSnapshotJson,
                    newSnapshotJson,
                    "Chuyển nhượng cổ phần kết nạp thành viên mới: " + inviteeUser.getFullName(),
                    now,
                    leader
            );
        }

        // Other contributor shares
        for (ContributorShareContributionDto c : contributors) {
            if (c.percentage() != null && c.percentage().compareTo(BigDecimal.ZERO) > 0) {
                User contributorUser = userRepository.findById(c.userId()).orElse(null);
                if (contributorUser != null) {
                    recordHistoryEntry(
                            inv.getGroup(),
                            inv.getVehicle(),
                            contributorUser,
                            inviteeUser,
                            c.percentage(),
                            previousSnapshotJson,
                            newSnapshotJson,
                            "Đóng góp cổ phần cho thành viên mới: " + inviteeUser.getFullName(),
                            now,
                            leader
                    );
                }
            }
        }

        // 7. Recalculate Group Leader (Representative)
        GroupMember newLeader = recalculateGroupLeader(groupId, vehicleId);
        String newLeaderName = newLeader != null ? newLeader.getUser().getFullName() : "";

        // 8. Promote contract version to ACTIVE
        if (inv.getContractVersionId() != null) {
            try {
                CoOwnershipContractVersion version = versionRepository.findById(inv.getContractVersionId()).orElse(null);
                if (version != null) {
                    CoOwnershipContract contract = version.getContract();
                    if (contract != null) {
                        if (contract.getCurrentVersion() != null && !contract.getCurrentVersion().getId().equals(version.getId())) {
                            CoOwnershipContractVersion prevVersion = contract.getCurrentVersion();
                            prevVersion.setStatus(ContractVersionStatus.SUPERSEDED);
                            prevVersion.setEffectiveUntil(now);
                            versionRepository.save(prevVersion);
                        }
                        contract.setCurrentVersion(version);
                        contract.setStatus(com.evshare.contract.entity.ContractStatus.ACTIVE);
                        contract.setUpdatedAt(now);
                        contractRepository.save(contract);
                    }
                    version.setStatus(ContractVersionStatus.ACTIVE);
                    version.setEffectiveFrom(now);
                    version.setActivatedAt(now);
                    versionRepository.save(version);
                }
            } catch (Exception ex) {
                log.warn("[MembershipInvitation] Could not activate contract version: {}", ex.getMessage());
            }
        }

        // 9. Update invitation to COMPLETED
        inv.setStatus(InvitationStatus.COMPLETED);
        inv.setCompletedAt(now);
        invitationRepository.save(inv);

        // 10. Notify all group members
        List<GroupMember> activeMembers = memberRepository.findByGroupId(groupId).stream()
                .filter(m -> m.getStatus() == MemberStatus.ACTIVE)
                .toList();

        for (GroupMember m : activeMembers) {
            notificationService.notifyMemberOnboarded(
                    m.getUser().getId(),
                    vehicleId,
                    inv.getVehicle().getName(),
                    inviteeUser.getFullName(),
                    totalOffered,
                    newLeaderName
            );
        }

        if (auditLogService != null) {
            auditLogService.recordLog(
                    inv.getInvitedByUser(),
                    "MEMBERSHIP_ACTIVATION",
                    "MEMBERSHIP_INVITATION",
                    inv.getId().toString(),
                    "PENDING",
                    "COMPLETED",
                    String.format("Kết nạp thành viên mới %s vào nhóm %s xe %s với tỷ lệ sở hữu %.2f%%. Đại diện nhóm: %s.",
                            inviteeUser.getFullName(), inv.getGroup().getName(), inv.getVehicle().getName(), totalOffered, newLeaderName),
                    "127.0.0.1"
            );
        }

        log.info("[MembershipInvitation] Invitation {} successfully finalized. Total shares verified at 100.00%. Current leader: {}",
                inv.getId(), newLeaderName);
    }

    // ==========================================
    // 9. Cancellation
    // ==========================================

    @Transactional
    public MembershipInvitationResponse cancelInvitation(UUID invitationId, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }

        MembershipInvitation inv = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lời mời: " + invitationId));

        if (inv.getStatus() == InvitationStatus.COMPLETED) {
            throw new IllegalStateException("Lời mời đã hoàn tất gia nhập, không thể hủy.");
        }

        User user = principal.getUser();
        boolean isLeader = inv.getInvitedByUser().getId().equals(user.getId());
        if (!isLeader && user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Chỉ Trưởng nhóm khởi tạo hoặc Quản trị viên mới có quyền hủy lời mời.");
        }

        inv.setStatus(InvitationStatus.CANCELLED);
        inv.setCancelledAt(Instant.now());
        inv.setRejectionReason("Hủy bởi Trưởng nhóm " + user.getFullName());
        MembershipInvitation saved = invitationRepository.save(inv);

        log.info("[MembershipInvitation] Invitation {} cancelled by leader {}", invitationId, user.getFullName());
        return enrichInvitationResponse(saved, user);
    }

    // ==========================================
    // 10. Recalculate Group Leader & Helpers
    // ==========================================

    @Transactional
    public GroupMember recalculateGroupLeader(UUID groupId, UUID vehicleId) {
        List<GroupMember> activeMembers = memberRepository.findByGroupId(groupId).stream()
                .filter(m -> m.getStatus() == MemberStatus.ACTIVE)
                .toList();

        if (activeMembers.isEmpty()) {
            return null;
        }

        if (activeMembers.size() == 1) {
            GroupMember single = activeMembers.get(0);
            if (single.getMemberRole() != GroupMemberRole.REPRESENTATIVE) {
                single.setMemberRole(GroupMemberRole.REPRESENTATIVE);
                memberRepository.save(single);
            }
            return single;
        }

        // Map each member to their percentage
        Map<GroupMember, BigDecimal> shareMap = new HashMap<>();
        BigDecimal maxShare = BigDecimal.ZERO;

        for (GroupMember m : activeMembers) {
            BigDecimal p = getMemberSharePercentage(groupId, vehicleId, m.getId());
            shareMap.put(m, p);
            if (p.compareTo(maxShare) > 0) {
                maxShare = p;
            }
        }

        final BigDecimal finalMaxShare = maxShare;
        List<GroupMember> highestMembers = activeMembers.stream()
                .filter(m -> shareMap.getOrDefault(m, BigDecimal.ZERO).compareTo(finalMaxShare) == 0)
                .toList();

        GroupMember newLeader = null;

        // Tie breaking policy:
        // 1. If existing leader is among highest, retain them
        Optional<GroupMember> existingRep = highestMembers.stream()
                .filter(m -> m.getMemberRole() == GroupMemberRole.REPRESENTATIVE)
                .findFirst();

        if (existingRep.isPresent()) {
            newLeader = existingRep.get();
        } else {
            // 2. Select member with earliest joinedAt
            newLeader = highestMembers.stream()
                    .min(Comparator.comparing(
                            (GroupMember m) -> m.getJoinedAt() != null ? m.getJoinedAt() : Instant.now()
                    ).thenComparing(GroupMember::getId))
                    .orElse(highestMembers.get(0));
        }

        // Update roles
        for (GroupMember m : activeMembers) {
            if (m.getId().equals(newLeader.getId())) {
                if (m.getMemberRole() != GroupMemberRole.REPRESENTATIVE) {
                    m.setMemberRole(GroupMemberRole.REPRESENTATIVE);
                    memberRepository.save(m);
                }
            } else {
                if (m.getMemberRole() == GroupMemberRole.REPRESENTATIVE) {
                    m.setMemberRole(GroupMemberRole.MEMBER);
                    memberRepository.save(m);
                }
            }
        }

        return newLeader;
    }

    private CoOwnershipContractVersion ensureContractVersionBound(MembershipInvitation inv) {
        if (inv == null) return null;
        if (inv.getContractVersionId() != null) {
            CoOwnershipContractVersion version = versionRepository.findById(inv.getContractVersionId()).orElse(null);
            if (version != null) {
                if (version.getContentHash() == null || version.getContentHash().isBlank()) {
                    String hash = calculateSha256(version.getContentSnapshot() != null ? version.getContentSnapshot() : "");
                    version.setContentHash(hash);
                    version = versionRepository.save(version);
                }
                return version;
            }
        }

        // Heal/Bind if missing
        try {
            CoOwnershipContract contract = null;
            if (inv.getContractId() != null) {
                contract = contractRepository.findById(inv.getContractId()).orElse(null);
            }
            if (contract == null && inv.getGroup() != null) {
                contract = contractRepository.findByGroupId(inv.getGroup().getId()).orElse(null);
            }
            if (contract != null) {
                User invitee = inv.getInviteeUser();
                if (invitee == null && inv.getInviteeEmail() != null && !inv.getInviteeEmail().isBlank()) {
                    invitee = userRepository.findByEmailIgnoreCase(inv.getInviteeEmail().trim()).orElse(null);
                }
                if (invitee != null) {
                    CoOwnershipContractVersion newVersion = generateOnboardingContractVersion(contract, inv, invitee);
                    inv.setContractId(contract.getId());
                    inv.setContractVersionId(newVersion.getId());
                    invitationRepository.save(inv);
                    return newVersion;
                }
            }
        } catch (Exception ex) {
            log.warn("[MembershipInvitation] ensureContractVersionBound healing could not create contract version for invitation {}: {}",
                    inv.getId(), ex.getMessage());
        }
        return null;
    }

    private CoOwnershipContractVersion generateOnboardingContractVersion(CoOwnershipContract contract, MembershipInvitation inv, User invitee) {
        Integer maxVersion = versionRepository.findMaxVersionNumberByContractId(contract.getId());
        int nextVersionNumber = (maxVersion != null ? maxVersion : 0) + 1;

        String title = "Phụ lục Hợp đồng Đồng sở hữu - Tiếp nhận thành viên mới: " + invitee.getFullName() + " (V" + nextVersionNumber + ".0)";

        Instant createdInstant = inv.getCreatedAt() != null ? inv.getCreatedAt() : Instant.now();
        String createdDateStr = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")
                .withZone(java.time.ZoneId.of("Asia/Ho_Chi_Minh"))
                .format(createdInstant);

        List<ContributorShareContributionDto> contributors = parseContributors(inv.getAdditionalContributionsJson());

        Vehicle vehicle = inv.getVehicle();
        String vehicleName = vehicle != null && vehicle.getName() != null ? vehicle.getName() : "Xe điện EVShare";
        String licensePlate = vehicle != null && vehicle.getLicensePlate() != null ? vehicle.getLicensePlate() : "N/A";
        String vehicleCode = vehicle != null && vehicle.getVehicleCode() != null ? vehicle.getVehicleCode() : "N/A";
        String vehicleModel = vehicle != null && vehicle.getModel() != null ? vehicle.getModel() : "N/A";
        String batteryCap = vehicle != null && vehicle.getBatteryCapacity() != null ? vehicle.getBatteryCapacity() + " kWh" : "N/A";
        Integer year = vehicle != null ? vehicle.getYear() : null;

        StringBuilder sb = new StringBuilder();
        sb.append("# PHỤ LỤC HỢP ĐỒNG ĐỒNG SỞ HỮU XE ĐIỆN\n\n");
        sb.append(String.format("Căn cứ Hợp đồng Đồng sở hữu số: %s\n", contract.getId()));
        sb.append(String.format("Mã lời mời tham gia: %s\n", inv.getId()));
        sb.append(String.format("Thời điểm thiết lập văn bản: %s (Giờ Việt Nam)\n\n", createdDateStr));

        sb.append("## ĐIỀU 1: THÔNG TIN PHƯƠNG TIỆN ĐỒNG SỞ HỮU\n");
        sb.append(String.format("- Tên phương tiện: %s\n", vehicleName));
        sb.append(String.format("- Mẫu xe: %s (Năm sản xuất: %s)\n", vehicleModel, year != null ? year.toString() : "N/A"));
        sb.append(String.format("- Biển số đăng ký: %s\n", licensePlate));
        sb.append(String.format("- Mã định danh phương tiện: %s\n", vehicleCode));
        sb.append(String.format("- Dung lượng pin thiết kế: %s\n\n", batteryCap));

        sb.append("## ĐIỀU 2: CÁC BÊN THAM GIA KÝ KẾT\n");
        sb.append(String.format("1. Đại diện nhóm (Trưởng nhóm chuyển nhượng): %s (Email: %s)\n",
                inv.getInvitedByUser().getFullName(), inv.getInvitedByUser().getEmail()));
        if (!contributors.isEmpty()) {
            sb.append("2. Các thành viên đồng sở hữu đóng góp chuyển nhượng bổ sung:\n");
            for (int i = 0; i < contributors.size(); i++) {
                ContributorShareContributionDto c = contributors.get(i);
                sb.append(String.format("   %d.%d. %s (Email: %s) — Tỷ lệ đóng góp: %.2f%%\n",
                        2, i + 1, c.fullName(), c.email(), c.percentage() != null ? c.percentage() : BigDecimal.ZERO));
            }
            sb.append(String.format("3. Thành viên tiếp nhận mới: %s (Email: %s)\n\n", invitee.getFullName(), invitee.getEmail()));
        } else {
            sb.append(String.format("2. Thành viên tiếp nhận mới: %s (Email: %s)\n\n", invitee.getFullName(), invitee.getEmail()));
        }

        sb.append("## ĐIỀU 3: PHÂN BỔ TỶ LỆ SỞ HỮU VÀ TÍNH TOÀN VẸN 100%\n");
        sb.append(String.format("- Tỷ lệ chuyển nhượng từ Trưởng nhóm đại diện: %.2f%%\n",
                inv.getLeaderTransferPercentage() != null ? inv.getLeaderTransferPercentage() : BigDecimal.ZERO));
        BigDecimal contributorTotal = BigDecimal.ZERO;
        for (ContributorShareContributionDto c : contributors) {
            if (c.percentage() != null) {
                contributorTotal = contributorTotal.add(c.percentage());
            }
        }
        sb.append(String.format("- Tổng tỷ lệ chuyển nhượng từ các thành viên bổ sung: %.2f%%\n", contributorTotal));
        sb.append(String.format("- Tổng tỷ lệ sở hữu chính thức cấp cho Thành viên mới: %.2f%%\n",
                inv.getTotalOfferedPercentage() != null ? inv.getTotalOfferedPercentage() : BigDecimal.ZERO));
        sb.append("- Cam kết toàn vẹn: Tổng tỷ lệ cổ phần của toàn thể thành viên sau khi hoàn tất thủ tục đảm bảo chính xác 100.00%.\n\n");

        sb.append("## ĐIỀU 4: NGUYÊN TẮC VẬN HÀNH VÀ BẢO QUẢN\n");
        sb.append("1. Quyền biểu quyết và đặt lịch: Tương ứng với tỷ lệ cổ phần sở hữu hợp pháp trên hệ thống.\n");
        sb.append("2. Chi phí sạc, bảo dưỡng và vận hành định kỳ: Được phân bổ minh bạch theo hạn mức sử dụng và tỷ lệ sở hữu.\n");
        sb.append("3. Bảo toàn phương tiện: Các bên cam kết bảo quản tài sản chung, không chuyển nhượng trái quy định của nhóm.\n\n");

        sb.append("## ĐIỀU 5: XÁC THỰC VÀ HIỆU LỰC PHÁP LÝ\n");
        sb.append("Văn bản này được lập dưới dạng chứng từ điện tử, lưu trữ kèm mã băm kiểm toán SHA-256 bất biến. Văn bản có hiệu lực pháp lý ràng buộc sau khi tất cả các bên liên quan hoàn tất ký số điện tử trên hệ thống EVShare 3D.\n");

        String contentSnapshot = sb.toString();
        String contentHash = calculateSha256(contentSnapshot);

        CoOwnershipContractVersion version = new CoOwnershipContractVersion(
                UUID.randomUUID(),
                contract,
                nextVersionNumber,
                title,
                contentSnapshot,
                contentHash,
                "{}",
                "{}",
                "{}",
                inv.getInvitedByUser()
        );
        version.setStatus(ContractVersionStatus.PENDING_ACCEPTANCE);
        return versionRepository.save(version);
    }

    private void recordHistoryEntry(
            CoOwnershipGroup group,
            Vehicle vehicle,
            User fromUser,
            User toUser,
            BigDecimal transferredPercentage,
            String previousSnapshot,
            String newSnapshot,
            String reason,
            Instant effectiveAt,
            User recordedByUser
    ) {
        try {
            OwnershipChangeHistory entry = new OwnershipChangeHistory(
                    UUID.randomUUID(),
                    group,
                    vehicle,
                    null,
                    fromUser,
                    toUser,
                    transferredPercentage,
                    previousSnapshot,
                    newSnapshot,
                    reason,
                    effectiveAt != null ? effectiveAt : Instant.now(),
                    recordedByUser != null ? recordedByUser : fromUser
            );
            historyRepository.save(entry);
        } catch (Exception ex) {
            log.warn("[MembershipInvitation] Could not record history entry: {}", ex.getMessage());
        }
    }

    private String buildOwnershipSnapshotJson(UUID groupId, UUID vehicleId) {
        List<GroupMember> activeMembers = memberRepository.findByGroupIdAndStatus(groupId, MemberStatus.ACTIVE)
                .stream().filter(m -> m.getRemovedAt() == null).toList();

        List<Map<String, Object>> snapshot = new ArrayList<>();
        for (GroupMember m : activeMembers) {
            BigDecimal percentage = getMemberSharePercentage(groupId, vehicleId, m.getId());
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("userId", m.getUser().getId().toString());
            map.put("fullName", m.getUser().getFullName());
            map.put("email", m.getUser().getEmail());
            map.put("role", m.getMemberRole() != null ? m.getMemberRole().name() : "MEMBER");
            map.put("percentage", percentage);
            snapshot.add(map);
        }
        return toJson(snapshot);
    }

    private UUID getMemberIdForUser(UUID groupId, UUID userId) {
        return memberRepository.findByGroupIdAndUserId(groupId, userId)
                .map(GroupMember::getId)
                .orElseThrow(() -> new ResourceNotFoundException("Thành viên không tồn tại trong nhóm: " + userId));
    }

    private BigDecimal getMemberSharePercentage(UUID groupId, UUID vehicleId, UUID memberId) {
        return shareRepository.findByGroupIdAndVehicleIdAndMemberId(groupId, vehicleId, memberId)
                .map(OwnershipShare::getPercentage)
                .orElse(BigDecimal.ZERO);
    }

    private BigDecimal getUserSharePercentage(UUID groupId, UUID vehicleId, UUID userId) {
        Optional<GroupMember> m = memberRepository.findByGroupIdAndUserId(groupId, userId);
        if (m.isEmpty()) return BigDecimal.ZERO;
        return getMemberSharePercentage(groupId, vehicleId, m.get().getId());
    }

    private UUID resolveVehicleIdForGroup(CoOwnershipGroup group) {
        List<GroupVehicle> gvs = groupVehicleRepository.findByGroupIdAndStatus(group.getId(), GroupVehicleStatus.ACTIVE);
        if (!gvs.isEmpty()) {
            return gvs.get(0).getVehicle().getId();
        }
        if (group.getVehicleId() != null) {
            return group.getVehicleId();
        }
        throw new ResourceNotFoundException("Nhóm chưa liên kết với phương tiện nào.");
    }

    private MembershipInvitationResponse enrichInvitationResponse(MembershipInvitation entity, User currentUser) {
        MembershipInvitationResponse resp = MembershipInvitationResponse.fromEntity(entity);

        List<ContributorShareContributionDto> contributors = parseContributors(entity.getAdditionalContributionsJson());
        resp.setAdditionalContributions(contributors);

        List<Map<String, Object>> signatures = parseSignatures(entity.getSignaturesJson());
        resp.setSignatures(signatures);

        UUID currentUserId = currentUser != null ? currentUser.getId() : null;

        // Permissions
        boolean isLeader = entity.getInvitedByUser().getId().equals(currentUserId);
        boolean isInvitee = (entity.getInviteeUser() != null && entity.getInviteeUser().getId().equals(currentUserId))
                || (entity.getInviteeEmail() != null && currentUser != null && entity.getInviteeEmail().equalsIgnoreCase(currentUser.getEmail()));

        boolean isContributor = contributors.stream().anyMatch(c -> c.userId().equals(currentUserId));
        boolean hasConsented = contributors.stream().anyMatch(c -> c.userId().equals(currentUserId) && Boolean.TRUE.equals(c.consented()));
        boolean hasSigned = signatures.stream().anyMatch(s -> currentUserId != null && currentUserId.toString().equals(s.get("userId")));

        resp.setCanConsent(entity.getStatus() == InvitationStatus.PENDING_CONTRIBUTOR_CONSENT && isContributor && !hasConsented);
        resp.setCanAccept((entity.getStatus() == InvitationStatus.PENDING_INVITEE_RESPONSE || entity.getStatus() == InvitationStatus.INVITED) && isInvitee);
        resp.setCanReject((entity.getStatus() == InvitationStatus.PENDING_INVITEE_RESPONSE || entity.getStatus() == InvitationStatus.INVITED) && isInvitee);
        resp.setCanCancel((entity.getStatus() == InvitationStatus.PENDING_CONTRIBUTOR_CONSENT || entity.getStatus() == InvitationStatus.PENDING_INVITEE_RESPONSE || entity.getStatus() == InvitationStatus.PENDING_CONTRACT_SIGNATURE) && (isLeader || (currentUser != null && currentUser.getRole() == Role.ADMIN)));
        resp.setCanSign((entity.getStatus() == InvitationStatus.PENDING_CONTRACT_SIGNATURE || entity.getStatus() == InvitationStatus.ACCEPTED) && (isInvitee || isLeader || isContributor) && !hasSigned);
        resp.setCanFinalize(entity.getStatus() == InvitationStatus.READY_FOR_COMPLETION && (isLeader || (currentUser != null && currentUser.getRole() == Role.ADMIN)));

        // Vehicle details
        Vehicle v = entity.getVehicle();
        if (v != null) {
            resp.setCurrentSocPercent(v.getCurrentBatteryLevel() != null ? BigDecimal.valueOf(v.getCurrentBatteryLevel()) : null);
            resp.setOdometerKm(v.getOdometer());
            resp.setBatteryCapacityKwh(v.getBatteryCapacity());
            resp.setManufactureYear(v.getYear());
            resp.setVehicleModel(v.getModel());
            resp.setExteriorColor(v.getExteriorColor());
        }

        // Leader names & Ownership Distribution Preview
        UUID groupId = entity.getGroup().getId();
        UUID vehicleId = entity.getVehicle().getId();
        GroupMember leader = recalculateGroupLeader(groupId, vehicleId);
        resp.setCurrentLeaderName(leader != null ? leader.getUser().getFullName() : entity.getInvitedByUser().getFullName());

        List<GroupMember> activeMembers = memberRepository.findByGroupIdAndStatus(groupId, MemberStatus.ACTIVE);
        List<MemberSharePreviewDto> currentDistribution = new ArrayList<>();
        List<MemberSharePreviewDto> projectedDistribution = new ArrayList<>();

        UUID currentLeaderId = leader != null ? leader.getUser().getId() : null;
        UUID projectedLeaderId = null;
        String projectedLeaderName = "";
        BigDecimal highestProjectedShare = BigDecimal.ZERO;
        Instant projectedEarliestJoin = Instant.MAX;

        BigDecimal leaderDeduct = entity.getLeaderTransferPercentage() != null ? entity.getLeaderTransferPercentage() : BigDecimal.ZERO;
        Map<UUID, BigDecimal> contributorDeductions = contributors.stream()
                .filter(c -> c.percentage() != null && c.percentage().compareTo(BigDecimal.ZERO) > 0)
                .collect(Collectors.toMap(ContributorShareContributionDto::userId, ContributorShareContributionDto::percentage, (a, b) -> a));

        for (GroupMember m : activeMembers) {
            BigDecimal currentP = getMemberSharePercentage(groupId, vehicleId, m.getId());
            BigDecimal deduct = BigDecimal.ZERO;
            if (m.getUser().getId().equals(entity.getInvitedByUser().getId())) {
                deduct = leaderDeduct;
            } else if (contributorDeductions.containsKey(m.getUser().getId())) {
                deduct = contributorDeductions.get(m.getUser().getId());
            }

            BigDecimal projectedP = currentP.subtract(deduct).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

            currentDistribution.add(new MemberSharePreviewDto(
                    m.getUser().getId(),
                    m.getUser().getFullName(),
                    m.getUser().getEmail(),
                    currentP,
                    deduct,
                    projectedP,
                    m.getUser().getId().equals(currentLeaderId),
                    false,
                    m.getMemberRole().name()
            ));

            if (projectedP.compareTo(highestProjectedShare) > 0) {
                highestProjectedShare = projectedP;
                projectedLeaderId = m.getUser().getId();
                projectedLeaderName = m.getUser().getFullName();
                projectedEarliestJoin = m.getJoinedAt() != null ? m.getJoinedAt() : Instant.now();
            }
        }

        BigDecimal totalOffered = entity.getTotalOfferedPercentage() != null ? entity.getTotalOfferedPercentage() : BigDecimal.ZERO;

        User inviteeUser = entity.getInviteeUser();
        if (inviteeUser == null && entity.getInviteeEmail() != null && !entity.getInviteeEmail().isBlank()) {
            inviteeUser = userRepository.findByEmailIgnoreCase(entity.getInviteeEmail().trim()).orElse(null);
            if (inviteeUser != null) {
                resp.setInviteeUserId(inviteeUser.getId());
                resp.setInviteeUserName(inviteeUser.getFullName());
            }
        }

        String inviteeName = inviteeUser != null ? inviteeUser.getFullName()
                : (resp.getInviteeUserName() != null && !resp.getInviteeUserName().isBlank() ? resp.getInviteeUserName()
                : (entity.getInviteeEmail() != null ? entity.getInviteeEmail() : "Thành viên mới"));
        UUID inviteeId = inviteeUser != null ? inviteeUser.getId() : resp.getInviteeUserId();

        if (totalOffered.compareTo(highestProjectedShare) > 0) {
            highestProjectedShare = totalOffered;
            projectedLeaderId = inviteeId != null ? inviteeId : UUID.randomUUID();
            projectedLeaderName = inviteeName;
        }

        for (MemberSharePreviewDto c : currentDistribution) {
            boolean isProjLeader = c.userId().equals(projectedLeaderId);
            projectedDistribution.add(new MemberSharePreviewDto(
                    c.userId(),
                    c.fullName(),
                    c.email(),
                    c.currentPercentage(),
                    c.deductionPercentage(),
                    c.projectedPercentage(),
                    c.isCurrentLeader(),
                    isProjLeader,
                    isProjLeader ? "REPRESENTATIVE" : "MEMBER"
            ));
        }

        // Add prospective member to projected distribution if not already completed
        if (entity.getStatus() != InvitationStatus.COMPLETED) {
            boolean isInviteeProjLeader = inviteeId != null && inviteeId.equals(projectedLeaderId);
            projectedDistribution.add(new MemberSharePreviewDto(
                    inviteeId,
                    inviteeName + " (Thành viên mới)",
                    entity.getInviteeEmail(),
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    totalOffered,
                    false,
                    isInviteeProjLeader,
                    isInviteeProjLeader ? "REPRESENTATIVE" : "MEMBER"
            ));
        }

        resp.setCurrentDistribution(currentDistribution);
        resp.setProjectedDistribution(projectedDistribution);
        resp.setProjectedLeaderName(projectedLeaderName);

        // Build Authoritative Required Signatories list and signing progress
        List<InvitationSignatoryResponse> requiredSignatories = new ArrayList<>();
        Map<String, Map<String, Object>> signaturesByUserId = new HashMap<>();
        for (Map<String, Object> sig : signatures) {
            Object uId = sig.get("userId");
            if (uId != null) {
                signaturesByUserId.put(uId.toString(), sig);
            }
        }

        // 1. Inviting Group Leader (Mandatory signatory)
        User leaderUser = entity.getInvitedByUser();
        if (leaderUser != null) {
            String lUserId = leaderUser.getId().toString();
            boolean lSigned = signaturesByUserId.containsKey(lUserId);
            Map<String, Object> sigData = signaturesByUserId.get(lUserId);
            requiredSignatories.add(new InvitationSignatoryResponse(
                    leaderUser.getId(),
                    leaderUser.getFullName(),
                    leaderUser.getEmail(),
                    "TRƯỞNG_NHÓM",
                    "Trưởng nhóm (Đại diện chuyển nhượng)",
                    entity.getLeaderTransferPercentage(),
                    lSigned,
                    sigData != null ? (String) sigData.get("signedAt") : null,
                    sigData != null ? (String) sigData.get("method") : null,
                    sigData != null ? (String) sigData.get("ipAddress") : null
            ));
        }

        // 2. Contributing Co-Owners (Mandatory signatories if contributing > 0%)
        for (ContributorShareContributionDto c : contributors) {
            if (c.percentage() != null && c.percentage().compareTo(BigDecimal.ZERO) > 0) {
                String cUserId = c.userId().toString();
                boolean cSigned = signaturesByUserId.containsKey(cUserId);
                Map<String, Object> sigData = signaturesByUserId.get(cUserId);
                requiredSignatories.add(new InvitationSignatoryResponse(
                        c.userId(),
                        c.fullName(),
                        c.email(),
                        "ĐỒNG_SỞ_HỮU_ĐÓNG_GÓP",
                        "Đồng sở hữu đóng góp cổ phần",
                        c.percentage(),
                        cSigned,
                        sigData != null ? (String) sigData.get("signedAt") : null,
                        sigData != null ? (String) sigData.get("method") : null,
                        sigData != null ? (String) sigData.get("ipAddress") : null
                ));
            }
        }

        // 3. Invited Prospective Member (Mandatory signatory)
        String invUserId = inviteeId != null ? inviteeId.toString() : null;
        boolean invSigned = invUserId != null && signaturesByUserId.containsKey(invUserId);
        Map<String, Object> invSigData = invUserId != null ? signaturesByUserId.get(invUserId) : null;
        requiredSignatories.add(new InvitationSignatoryResponse(
                inviteeId,
                inviteeName,
                entity.getInviteeEmail(),
                "NGƯỜI_ĐƯỢC_MỜI",
                "Thành viên mới được kết nạp",
                entity.getTotalOfferedPercentage(),
                invSigned,
                invSigData != null ? (String) invSigData.get("signedAt") : null,
                invSigData != null ? (String) invSigData.get("method") : null,
                invSigData != null ? (String) invSigData.get("ipAddress") : null
        ));

        int signedCount = 0;
        List<String> pendingSignerNames = new ArrayList<>();
        for (InvitationSignatoryResponse sig : requiredSignatories) {
            if (sig.signed()) {
                signedCount++;
            } else {
                pendingSignerNames.add(sig.fullName());
            }
        }

        resp.setRequiredSignatories(requiredSignatories);
        resp.setSignedCount(signedCount);
        resp.setRequiredSignaturesCount(requiredSignatories.size());
        resp.setPendingSignerNames(pendingSignerNames);

        boolean isCurrentUserReq = currentUserId != null && requiredSignatories.stream()
                .anyMatch(s -> s.userId() != null && s.userId().equals(currentUserId));
        boolean hasCurrentUserSigned = currentUserId != null && signaturesByUserId.containsKey(currentUserId.toString());
        resp.setCurrentUserRequiredSigner(isCurrentUserReq);
        resp.setHasCurrentUserSigned(hasCurrentUserSigned);

        boolean canSign = (entity.getStatus() == InvitationStatus.PENDING_CONTRACT_SIGNATURE || entity.getStatus() == InvitationStatus.ACCEPTED)
                && isCurrentUserReq
                && !hasCurrentUserSigned;

        // If current user is a contributor, they must have consented first
        if (canSign && isContributor && !hasConsented) {
            canSign = false;
        }

        resp.setCanSign(canSign);

        // Populate contract document and hash details
        CoOwnershipContractVersion contractVersion = null;
        if (entity.getContractVersionId() != null) {
            contractVersion = versionRepository.findById(entity.getContractVersionId()).orElse(null);
        }
        if (contractVersion == null && entity.getStatus() != InvitationStatus.CANCELLED && entity.getStatus() != InvitationStatus.REJECTED) {
            try {
                contractVersion = ensureContractVersionBound(entity);
            } catch (Exception ex) {
                log.debug("[MembershipInvitation] Could not bind contract version in enrichInvitationResponse: {}", ex.getMessage());
            }
        }

        if (contractVersion != null) {
            resp.setContractVersionId(contractVersion.getId());
            if (contractVersion.getContract() != null) {
                resp.setContractId(contractVersion.getContract().getId());
            }
            resp.setContractTitle(contractVersion.getTitle());
            resp.setContractContent(contractVersion.getContentSnapshot());
            resp.setDocumentHash(contractVersion.getContentHash());
            resp.setContractVersionNumber(contractVersion.getVersionNumber());
        }

        return resp;
    }

    private List<ContributorShareContributionDto> parseContributors(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<ContributorShareContributionDto>>() {});
        } catch (Exception ex) {
            return new ArrayList<>();
        }
    }

    private List<Map<String, Object>> parseSignatures(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception ex) {
            return new ArrayList<>();
        }
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception ex) {
            return "[]";
        }
    }

    private String calculateSha256(String text) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(text.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception ex) {
            return UUID.randomUUID().toString();
        }
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) return "127.0.0.1";
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "127.0.0.1";
    }

    private String extractUserAgent(HttpServletRequest request) {
        if (request == null) return "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
        String ua = request.getHeader("User-Agent");
        return ua != null ? (ua.length() > 250 ? ua.substring(0, 250) : ua) : "Web-Browser";
    }
}
