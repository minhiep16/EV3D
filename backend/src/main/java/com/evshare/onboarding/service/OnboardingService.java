package com.evshare.onboarding.service;

import com.evshare.common.exception.DuplicateResourceException;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.common.exception.UnauthorizedException;
import com.evshare.contract.entity.CoOwnershipContract;
import com.evshare.contract.entity.CoOwnershipContractVersion;
import com.evshare.contract.entity.ContractAcceptance;
import com.evshare.contract.repository.CoOwnershipContractRepository;
import com.evshare.contract.repository.CoOwnershipContractVersionRepository;
import com.evshare.contract.repository.ContractAcceptanceRepository;
import com.evshare.contract.service.CoOwnershipContractService;
import com.evshare.notification.service.NotificationService;
import com.evshare.onboarding.dto.*;
import com.evshare.onboarding.entity.DraftStatus;
import com.evshare.onboarding.entity.GroupDiscoverySetting;
import com.evshare.onboarding.entity.GroupInvitation;
import com.evshare.onboarding.entity.GroupJoinRequest;
import com.evshare.onboarding.entity.InvitationStatus;
import com.evshare.onboarding.entity.JoinRequestStatus;
import com.evshare.onboarding.entity.VehicleRegistrationDraft;
import com.evshare.onboarding.repository.*;
import com.evshare.ownership.entity.CoOwnershipGroup;
import com.evshare.ownership.entity.GroupMember;
import com.evshare.ownership.entity.GroupMemberRole;
import com.evshare.ownership.entity.GroupStatus;
import com.evshare.ownership.entity.GroupVehicle;
import com.evshare.ownership.entity.GroupVehicleStatus;
import com.evshare.ownership.entity.MemberStatus;
import com.evshare.ownership.entity.OwnershipShare;
import com.evshare.ownership.repository.*;
import com.evshare.security.UserPrincipal;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import com.evshare.user.repository.UserRepository;
import com.evshare.vehicle.dto.VehicleResponse;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.entity.VehicleStatus;
import com.evshare.vehicle.repository.VehicleRepository;
import com.evshare.vehicle.service.VehicleService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OnboardingService {

    private final VehicleRegistrationDraftRepository draftRepository;
    private final GroupDiscoverySettingRepository discoveryRepository;
    private final GroupJoinRequestRepository joinRequestRepository;
    private final GroupInvitationRepository invitationRepository;
    private final CoOwnershipGroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final OwnershipShareRepository shareRepository;
    private final GroupVehicleRepository groupVehicleRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final VehicleService vehicleService;
    private final NotificationService notificationService;
    private final CoOwnershipContractService contractService;
    private final CoOwnershipContractRepository contractRepository;
    private final CoOwnershipContractVersionRepository contractVersionRepository;
    private final ContractAcceptanceRepository contractAcceptanceRepository;
    private final ObjectMapper objectMapper;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    public OnboardingService(
            VehicleRegistrationDraftRepository draftRepository,
            GroupDiscoverySettingRepository discoveryRepository,
            GroupJoinRequestRepository joinRequestRepository,
            GroupInvitationRepository invitationRepository,
            CoOwnershipGroupRepository groupRepository,
            GroupMemberRepository memberRepository,
            OwnershipShareRepository shareRepository,
            GroupVehicleRepository groupVehicleRepository,
            VehicleRepository vehicleRepository,
            UserRepository userRepository,
            VehicleService vehicleService,
            NotificationService notificationService,
            CoOwnershipContractService contractService,
            CoOwnershipContractRepository contractRepository,
            CoOwnershipContractVersionRepository contractVersionRepository,
            ContractAcceptanceRepository contractAcceptanceRepository,
            ObjectMapper objectMapper) {
        this.draftRepository = draftRepository;
        this.discoveryRepository = discoveryRepository;
        this.joinRequestRepository = joinRequestRepository;
        this.invitationRepository = invitationRepository;
        this.groupRepository = groupRepository;
        this.memberRepository = memberRepository;
        this.shareRepository = shareRepository;
        this.groupVehicleRepository = groupVehicleRepository;
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
        this.vehicleService = vehicleService;
        this.notificationService = notificationService;
        this.contractService = contractService;
        this.contractRepository = contractRepository;
        this.contractVersionRepository = contractVersionRepository;
        this.contractAcceptanceRepository = contractAcceptanceRepository;
        this.objectMapper = objectMapper;
    }

    // ==========================================
    // 1. Overall Onboarding Status for User
    // ==========================================

    @Transactional(readOnly = true)
    public OnboardingStatusResponse getOnboardingStatus(UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để kiểm tra trạng thái.");
        }

        UUID userId = principal.getId();
        User user = principal.getUser();
        Role role = user.getRole();

        // Staff and Admin always have garage access
        if (role == Role.STAFF || role == Role.ADMIN) {
            List<VehicleResponse> allVehicles = vehicleService.getAllVehicles(principal);
            return new OnboardingStatusResponse(
                    true,
                    allVehicles.size(),
                    allVehicles,
                    0,
                    0,
                    0,
                    role.name(),
                    "/garage");
        }

        // CO_OWNER: Check active memberships in active groups
        List<GroupMember> activeMemberships = memberRepository.findByUserIdAndStatus(userId, MemberStatus.ACTIVE)
                .stream()
                .filter(m -> m.getRemovedAt() == null && m.getGroup() != null
                        && m.getGroup().getStatus() == GroupStatus.ACTIVE)
                .toList();

        List<VehicleResponse> authorizedVehicles = vehicleService.getAllVehicles(principal);
        boolean hasActiveGroup = !activeMemberships.isEmpty() && !authorizedVehicles.isEmpty();

        long pendingInvitations = invitationRepository.countByInviteeEmailAndStatus(user.getEmail(),
                InvitationStatus.PENDING);
        long pendingJoinRequests = joinRequestRepository.countByUserIdAndStatus(userId, JoinRequestStatus.PENDING);
        long draftsCount = draftRepository.countByUserIdAndStatus(userId, DraftStatus.DRAFT);

        String route = hasActiveGroup ? "/garage" : "/onboarding";

        return new OnboardingStatusResponse(
                hasActiveGroup,
                authorizedVehicles.size(),
                authorizedVehicles,
                pendingInvitations,
                pendingJoinRequests,
                draftsCount,
                role.name(),
                route);
    }

    // ==========================================
    // 2. Vehicle Registration Drafts
    // ==========================================

    @Transactional(readOnly = true)
    public List<VehicleRegistrationDraftResponse> getMyDrafts(UserPrincipal principal) {
        if (principal == null)
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        return draftRepository.findByUserIdOrderByUpdatedAtDesc(principal.getId()).stream()
                .map(VehicleRegistrationDraftResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VehicleRegistrationDraftResponse getDraftById(UUID draftId, UserPrincipal principal) {
        if (principal == null)
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        VehicleRegistrationDraft draft = draftRepository.findByIdAndUserId(draftId, principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Bản nháp không tồn tại hoặc bạn không có quyền truy cập: " + draftId));
        return VehicleRegistrationDraftResponse.fromEntity(draft);
    }

    @Transactional
    public VehicleRegistrationDraftResponse saveDraft(VehicleRegistrationDraftRequest request,
            UserPrincipal principal) {
        if (principal == null)
            throw new UnauthorizedException("Vui lòng đăng nhập.");

        VehicleRegistrationDraft draft = new VehicleRegistrationDraft(
                UUID.randomUUID(),
                principal.getId(),
                request.getResolvedVehicleName());
        populateDraftFields(draft, request);
        VehicleRegistrationDraft saved = draftRepository.save(draft);
        return VehicleRegistrationDraftResponse.fromEntity(saved);
    }

    @Transactional
    public VehicleRegistrationDraftResponse updateDraft(UUID draftId, VehicleRegistrationDraftRequest request,
            UserPrincipal principal) {
        if (principal == null)
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        VehicleRegistrationDraft draft = draftRepository.findByIdAndUserId(draftId, principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Bản nháp không tồn tại: " + draftId));

        if (draft.getStatus() != DraftStatus.DRAFT) {
            throw new IllegalStateException("Không thể chỉnh sửa bản nháp đã nộp hoặc đã phê duyệt.");
        }

        draft.setVehicleName(request.getResolvedVehicleName());
        populateDraftFields(draft, request);
        VehicleRegistrationDraft updated = draftRepository.save(draft);
        return VehicleRegistrationDraftResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteDraft(UUID draftId, UserPrincipal principal) {
        if (principal == null)
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        VehicleRegistrationDraft draft = draftRepository.findByIdAndUserId(draftId, principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Bản nháp không tồn tại: " + draftId));
        draftRepository.delete(draft);
    }

    // ==========================================
    // 2.1 Co-Owner User Search for Registration Wizard
    // ==========================================

    @Transactional(readOnly = true)
    public List<OnboardingUserSearchResponse> searchEligibleUsers(String query, UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để tìm kiếm người dùng.");
        }
        if (query == null || query.trim().length() < 3) {
            return Collections.emptyList();
        }

        String trimmed = query.trim();
        UUID currentUserId = principal.getId();

        // Invariant: One CO_OWNER user = maximum 1 active contract in an active group
        Set<UUID> usersWithActiveContracts = memberRepository.findByStatus(MemberStatus.ACTIVE).stream()
                .filter(m -> m.getRemovedAt() == null && m.getGroup() != null
                        && m.getGroup().getStatus() == GroupStatus.ACTIVE)
                .map(m -> m.getUser().getId())
                .collect(Collectors.toSet());

        List<User> matchingUsers = userRepository.searchEligibleUsers(Role.CO_OWNER, UserStatus.ACTIVE, trimmed);

        return matchingUsers.stream()
                .filter(u -> !u.getId().equals(currentUserId))
                .filter(u -> !usersWithActiveContracts.contains(u.getId()))
                .limit(10)
                .map(u -> OnboardingUserSearchResponse.from(u.getId(), u.getFullName(), u.getEmail()))
                .toList();
    }

    private void populateDraftFields(VehicleRegistrationDraft draft, VehicleRegistrationDraftRequest request) {
        draft.setManufacturer(request.manufacturer());
        draft.setModel(request.model());
        draft.setModelYear(request.modelYear());
        draft.setLicensePlate(request.licensePlate());
        draft.setVin(request.vin());
        draft.setBatteryCapacity(request.batteryCapacity());
        draft.setBatteryType(request.batteryType());
        if (request.exteriorColor() != null && !request.exteriorColor().isBlank()) {
            draft.setExteriorColor(sanitizeExteriorColor(request.exteriorColor()));
        }
        draft.setGroupName(request.groupName());
        if (request.votingRule() != null)
            draft.setVotingRule(request.votingRule());
        if (request.quorumPercentage() != null)
            draft.setQuorumPercentage(request.quorumPercentage());
        if (request.approvalThresholdPercentage() != null)
            draft.setApprovalThresholdPercentage(request.approvalThresholdPercentage());
        draft.setProposedCoOwners(request.proposedCoOwners());
    }

    // ==========================================
    // 3. Submit Registration: Create Vehicle + Group + Contract
    // ==========================================

    @Transactional
    public VehicleResponse submitRegistration(UUID draftId, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để nộp hồ sơ xe.");
        }
        VehicleRegistrationDraft draft = draftRepository.findByIdAndUserId(draftId, principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Bản nháp không tồn tại: " + draftId));

        if (draft.getStatus() != DraftStatus.DRAFT) {
            throw new IllegalStateException("Hồ sơ này đã được nộp.");
        }

        User creator = principal.getUser();

        // 1. Create Real Vehicle Entity
        String vName = draft.getVehicleName();
        String licPlate = draft.getLicensePlate() != null && !draft.getLicensePlate().isBlank()
                ? draft.getLicensePlate()
                : "51E-" + (10000 + RANDOM.nextInt(90000));
        String vin = draft.getVin() != null && !draft.getVin().isBlank()
                ? draft.getVin()
                : "VIN" + UUID.randomUUID().toString().substring(0, 14).toUpperCase();

        BigDecimal capacity = draft.getBatteryCapacity() != null ? draft.getBatteryCapacity() : new BigDecimal("75.00");

        Vehicle vehicle = new Vehicle();
        vehicle.setId(UUID.randomUUID());
        vehicle.setName(vName);
        vehicle.setBrand(draft.getManufacturer() != null && !draft.getManufacturer().isBlank() ? draft.getManufacturer()
                : "VinFast");
        vehicle.setModel(draft.getModel() != null && !draft.getModel().isBlank() ? draft.getModel() : "VF8");
        vehicle.setYear(draft.getModelYear() != null ? draft.getModelYear() : 2025);
        vehicle.setLicensePlate(licPlate);
        vehicle.setVin(vin);
        vehicle.setBatteryCapacity(capacity);
        vehicle.setCurrentBatteryLevel(100);
        vehicle.setOdometer(BigDecimal.ZERO);
        vehicle.setStatus(VehicleStatus.AVAILABLE);
        vehicle.setModel3dUrl("/models/ev-car.glb");
        vehicle.setExteriorColor(draft.getExteriorColor() != null && !draft.getExteriorColor().isBlank()
                ? draft.getExteriorColor()
                : "Trắng ngọc trai");
        Vehicle savedVehicle = vehicleRepository.save(vehicle);

        // 2. Create CoOwnershipGroup Entity
        String gName = draft.getGroupName() != null && !draft.getGroupName().isBlank()
                ? draft.getGroupName()
                : "Nhóm xe " + vName;

        CoOwnershipGroup group = new CoOwnershipGroup(UUID.randomUUID(), savedVehicle.getId(), gName);
        group.setCreatedBy(creator.getId());
        if (draft.getVotingRule() != null)
            group.setVotingRule(draft.getVotingRule());
        if (draft.getQuorumPercentage() != null)
            group.setQuorumPercentage(draft.getQuorumPercentage());
        if (draft.getApprovalThresholdPercentage() != null)
            group.setApprovalThresholdPercentage(draft.getApprovalThresholdPercentage());
        CoOwnershipGroup savedGroup = groupRepository.save(group);

        // 3. Link Group & Vehicle
        GroupVehicle gv = new GroupVehicle(UUID.randomUUID(), savedGroup, savedVehicle, GroupVehicleStatus.ACTIVE);
        groupVehicleRepository.save(gv);

        // 4. Add Creator as ACTIVE Group Representative
        GroupMember creatorMember = new GroupMember(
                UUID.randomUUID(),
                savedGroup,
                creator,
                GroupMemberRole.REPRESENTATIVE,
                MemberStatus.ACTIVE);
        GroupMember savedCreatorMember = memberRepository.save(creatorMember);

        // 5. Parse and Process Proposed Co-Owners from Draft
        BigDecimal creatorPercentage = new BigDecimal("100.00");
        List<Map<String, Object>> proposedCoOwners = parseProposedCoOwners(draft.getProposedCoOwners());

        if (!proposedCoOwners.isEmpty()) {
            BigDecimal totalInvitedShare = BigDecimal.ZERO;

            for (Map<String, Object> coOwner : proposedCoOwners) {
                String email = (String) coOwner.get("email");
                Object pctObj = coOwner.get("percentage") != null ? coOwner.get("percentage")
                        : coOwner.get("sharePercentage");
                BigDecimal percentage = pctObj != null ? new BigDecimal(pctObj.toString()) : BigDecimal.ZERO;

                if (email != null && !email.isBlank() && percentage.compareTo(BigDecimal.ZERO) > 0) {
                    totalInvitedShare = totalInvitedShare.add(percentage);

                    // Generate secure invite code
                    String inviteCode = generateInviteCode();
                    Instant expiresAt = Instant.now().plus(14, ChronoUnit.DAYS);

                    // Optional matching user: check canonical userId if available, then fallback to
                    // email
                    Optional<User> recipientUser = Optional.empty();
                    if (coOwner.get("userId") != null) {
                        try {
                            recipientUser = userRepository.findById(UUID.fromString(coOwner.get("userId").toString()));
                        } catch (Exception ignored) {
                        }
                    }
                    if (recipientUser.isEmpty()) {
                        recipientUser = userRepository.findByEmail(email.trim());
                    }

                    GroupInvitation invitation = new GroupInvitation(
                            UUID.randomUUID(),
                            savedGroup.getId(),
                            creator.getId(),
                            email.trim(),
                            recipientUser.map(User::getId).orElse(null),
                            percentage,
                            inviteCode,
                            expiresAt);
                    invitationRepository.save(invitation);

                    // Notify recipient if registered
                    recipientUser.ifPresent(u -> notificationService.sendNotification(
                            u.getId(),
                            savedVehicle.getId(),
                            savedGroup.getId(),
                            "GROUP_INVITATION",
                            invitation.getId(),
                            "INVITATION_RECEIVED",
                            "Lời mời tham gia nhóm xe",
                            "Bạn nhận được lời mời tham gia nhóm xe " + vName + " với tỷ lệ đề xuất " + percentage
                                    + "%.",
                            "INFO"));
                }
            }

            // Creator gets remainder
            creatorPercentage = new BigDecimal("100.00").subtract(totalInvitedShare);
            if (creatorPercentage.compareTo(BigDecimal.ZERO) < 0) {
                creatorPercentage = new BigDecimal("50.00");
            }
        }

        // 6. Assign Initial Ownership Share to Creator
        OwnershipShare creatorShare = new OwnershipShare(
                UUID.randomUUID(),
                savedGroup,
                savedVehicle,
                savedCreatorMember,
                creatorPercentage);
        shareRepository.save(creatorShare);

        // 7. Make Group Discoverable by default
        GroupDiscoverySetting discovery = new GroupDiscoverySetting(
                savedGroup.getId(),
                true,
                3,
                draft.getModel() != null ? draft.getModel() : vName);
        discovery.setPublicTerms("Đồng sở hữu theo tỷ lệ vốn góp. Biểu quyết tự động theo trọng số sở hữu.");
        discovery.setJoinConditions("Yêu cầu cam kết tuân thủ quy tắc quản lý và thanh toán chi phí dùng xe đúng hạn.");
        discoveryRepository.save(discovery);

        // 8. Generate Authoritative Contract for Vehicle
        try {
            contractService.getContractSummaryByVehicle(savedVehicle.getId().toString(), principal);
        } catch (Exception ignored) {
        }

        // 9. Update Draft Status
        draft.setStatus(DraftStatus.APPROVED);
        draftRepository.save(draft);

        // 10. Notify Creator
        notificationService.sendNotification(
                creator.getId(),
                savedVehicle.getId(),
                savedGroup.getId(),
                "VEHICLE_REGISTRATION",
                savedVehicle.getId(),
                "REGISTRATION_COMPLETED",
                "Đăng ký xe thành công",
                "Xe điện " + vName + " và nhóm đồng sở hữu đã được khởi tạo thành công.",
                "SUCCESS");

        return VehicleResponse.fromEntity(savedVehicle);
    }

    // ==========================================
    // 4. Discoverable Groups & Public Search
    // ==========================================

    @Transactional(readOnly = true)
    public List<DiscoverableGroupResponse> getDiscoverableGroups(String query, UserPrincipal principal) {
        List<GroupDiscoverySetting> settings = discoveryRepository.searchDiscoverable(query);
        UUID currentUserId = principal != null ? principal.getId() : null;

        List<DiscoverableGroupResponse> results = new ArrayList<>();
        for (GroupDiscoverySetting setting : settings) {
            Optional<CoOwnershipGroup> groupOpt = groupRepository.findById(setting.getGroupId());
            if (groupOpt.isEmpty())
                continue;
            CoOwnershipGroup group = groupOpt.get();
            if (group.getStatus() != GroupStatus.ACTIVE)
                continue;

            // Resolve vehicle
            Vehicle vehicle = resolveGroupVehicle(group);

            // Resolve join status for current user
            String joinStatus = "NONE";
            if (currentUserId != null) {
                boolean isMember = memberRepository.findByGroupIdAndStatus(group.getId(), MemberStatus.ACTIVE).stream()
                        .anyMatch(m -> m.getRemovedAt() == null && m.getUser().getId().equals(currentUserId));
                if (isMember) {
                    joinStatus = "MEMBER";
                } else {
                    boolean isPending = joinRequestRepository.existsByGroupIdAndUserIdAndStatus(
                            group.getId(), currentUserId, JoinRequestStatus.PENDING);
                    if (isPending) {
                        joinStatus = "PENDING";
                    }
                }
            }

            int memberCount = (int) memberRepository.findByGroupIdAndStatus(group.getId(), MemberStatus.ACTIVE).stream()
                    .filter(m -> m.getRemovedAt() == null).count();

            results.add(new DiscoverableGroupResponse(
                    group.getId(),
                    group.getName(),
                    vehicle != null ? vehicle.getId() : null,
                    vehicle != null ? vehicle.getName() : "EVShare Electric Vehicle",
                    setting.getTargetModel() != null ? setting.getTargetModel()
                            : (vehicle != null ? vehicle.getName() : "EV"),
                    setting.getOpenSlots(),
                    setting.getPublicTerms(),
                    setting.getJoinConditions(),
                    setting.isDiscoverable(),
                    joinStatus,
                    memberCount,
                    group.getCreatedAt()));
        }

        return results;
    }

    @Transactional(readOnly = true)
    public DiscoverableGroupResponse getDiscoverableGroupDetail(UUID groupId, UserPrincipal principal) {
        CoOwnershipGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhóm đồng sở hữu: " + groupId));

        GroupDiscoverySetting setting = discoveryRepository.findById(groupId)
                .orElse(new GroupDiscoverySetting(groupId, true, 2, "EVShare Smart Car"));

        Vehicle vehicle = resolveGroupVehicle(group);
        UUID currentUserId = principal != null ? principal.getId() : null;

        String joinStatus = "NONE";
        if (currentUserId != null) {
            boolean isMember = memberRepository.findByGroupIdAndStatus(group.getId(), MemberStatus.ACTIVE).stream()
                    .anyMatch(m -> m.getRemovedAt() == null && m.getUser().getId().equals(currentUserId));
            if (isMember) {
                joinStatus = "MEMBER";
            } else if (joinRequestRepository.existsByGroupIdAndUserIdAndStatus(group.getId(), currentUserId,
                    JoinRequestStatus.PENDING)) {
                joinStatus = "PENDING";
            }
        }

        int memberCount = (int) memberRepository.findByGroupIdAndStatus(group.getId(), MemberStatus.ACTIVE).stream()
                .filter(m -> m.getRemovedAt() == null).count();

        return new DiscoverableGroupResponse(
                group.getId(),
                group.getName(),
                vehicle != null ? vehicle.getId() : null,
                vehicle != null ? vehicle.getName() : "EVShare Electric Vehicle",
                setting.getTargetModel() != null ? setting.getTargetModel()
                        : (vehicle != null ? vehicle.getName() : "EV"),
                setting.getOpenSlots(),
                setting.getPublicTerms(),
                setting.getJoinConditions(),
                setting.isDiscoverable(),
                joinStatus,
                memberCount,
                group.getCreatedAt());
    }

    // ==========================================
    // 5. Join Request Workflows
    // ==========================================

    @Transactional
    public GroupJoinRequestResponse submitJoinRequest(UUID groupId, CreateJoinRequestDto dto, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để gửi yêu cầu tham gia.");
        }
        CoOwnershipGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Nhóm đồng sở hữu không tồn tại: " + groupId));

        UUID userId = principal.getId();

        // 1. Check if user is already an active member
        boolean isAlreadyMember = memberRepository.findByGroupIdAndStatus(groupId, MemberStatus.ACTIVE).stream()
                .anyMatch(m -> m.getRemovedAt() == null && m.getUser().getId().equals(userId));
        if (isAlreadyMember) {
            throw new DuplicateResourceException("Bạn đã là thành viên của nhóm đồng sở hữu này.");
        }

        // 2. Check if a pending request already exists
        if (joinRequestRepository.existsByGroupIdAndUserIdAndStatus(groupId, userId, JoinRequestStatus.PENDING)) {
            throw new DuplicateResourceException("Bạn đã gửi yêu cầu tham gia nhóm này và đang chờ duyệt.");
        }

        GroupJoinRequest req = new GroupJoinRequest(
                UUID.randomUUID(),
                groupId,
                userId,
                dto.requestedPercentage() != null ? dto.requestedPercentage() : new BigDecimal("20.00"),
                dto.message() != null ? dto.message() : "Xin chào, tôi mong muốn tham gia nhóm đồng sở hữu xe.");
        GroupJoinRequest saved = joinRequestRepository.save(req);

        // Notify Group Representative
        memberRepository.findByGroupIdAndStatus(groupId, MemberStatus.ACTIVE).stream()
                .filter(m -> m.getMemberRole() == GroupMemberRole.REPRESENTATIVE)
                .findFirst()
                .ifPresent(rep -> notificationService.sendNotification(
                        rep.getUser().getId(),
                        group.getVehicleId(),
                        groupId,
                        "JOIN_REQUEST",
                        saved.getId(),
                        "JOIN_REQUEST_SUBMITTED",
                        "Yêu cầu tham gia nhóm mới",
                        principal.getUser().getFullName() + " vừa gửi yêu cầu tham gia nhóm " + group.getName() + ".",
                        "INFO"));

        return GroupJoinRequestResponse.fromEntity(
                saved,
                group.getName(),
                principal.getUser().getFullName(),
                principal.getUser().getEmail());
    }

    @Transactional(readOnly = true)
    public List<GroupJoinRequestResponse> getMyJoinRequests(UserPrincipal principal) {
        if (principal == null)
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        List<GroupJoinRequest> list = joinRequestRepository.findByUserIdOrderByCreatedAtDesc(principal.getId());

        return list.stream().map(req -> {
            String groupName = groupRepository.findById(req.getGroupId()).map(CoOwnershipGroup::getName)
                    .orElse("Nhóm xe");
            return GroupJoinRequestResponse.fromEntity(
                    req,
                    groupName,
                    principal.getUser().getFullName(),
                    principal.getUser().getEmail());
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GroupJoinRequestResponse> getGroupJoinRequests(UUID groupId, UserPrincipal principal) {
        if (principal == null)
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        validateRepresentativeOrAdmin(groupId, principal);

        CoOwnershipGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Nhóm không tồn tại: " + groupId));

        return joinRequestRepository.findByGroupIdOrderByCreatedAtDesc(groupId).stream()
                .map(req -> {
                    User applicant = userRepository.findById(req.getUserId()).orElse(null);
                    return GroupJoinRequestResponse.fromEntity(
                            req,
                            group.getName(),
                            applicant != null ? applicant.getFullName() : "Người dùng EVShare",
                            applicant != null ? applicant.getEmail() : "");
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public GroupJoinRequestResponse reviewJoinRequest(UUID requestId, ReviewJoinRequestDto dto,
            UserPrincipal principal) {
        if (principal == null)
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        GroupJoinRequest req = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu không tồn tại: " + requestId));

        validateRepresentativeOrAdmin(req.getGroupId(), principal);

        CoOwnershipGroup group = groupRepository.findById(req.getGroupId())
                .orElseThrow(() -> new ResourceNotFoundException("Nhóm không tồn tại: " + req.getGroupId()));

        req.setReviewedBy(principal.getId());
        req.setReviewedAt(Instant.now());
        req.setReviewNotes(dto.reviewNotes());

        if (dto.approve()) {
            req.setStatus(JoinRequestStatus.APPROVED);

            // Add member as ACTIVE or PENDING contract consent
            User applicant = userRepository.findById(req.getUserId()).orElseThrow();
            boolean isMember = memberRepository.findByGroupIdAndStatus(group.getId(), MemberStatus.ACTIVE).stream()
                    .anyMatch(m -> m.getRemovedAt() == null && m.getUser().getId().equals(applicant.getId()));

            if (!isMember) {
                GroupMember newMember = new GroupMember(
                        UUID.randomUUID(),
                        group,
                        applicant,
                        GroupMemberRole.MEMBER,
                        MemberStatus.ACTIVE);
                memberRepository.save(newMember);
            }

            notificationService.sendNotification(
                    applicant.getId(),
                    group.getVehicleId(),
                    group.getId(),
                    "JOIN_REQUEST",
                    req.getId(),
                    "JOIN_REQUEST_APPROVED",
                    "Yêu cầu tham gia đã được duyệt",
                    "Chúc mừng! Yêu cầu tham gia nhóm " + group.getName() + " của bạn đã được phê duyệt.",
                    "SUCCESS");
        } else {
            req.setStatus(JoinRequestStatus.REJECTED);

            notificationService.sendNotification(
                    req.getUserId(),
                    group.getVehicleId(),
                    group.getId(),
                    "JOIN_REQUEST",
                    req.getId(),
                    "JOIN_REQUEST_REJECTED",
                    "Yêu cầu tham gia bị từ chối",
                    "Yêu cầu tham gia nhóm " + group.getName() + " của bạn chưa được chấp thuận: "
                            + (dto.reviewNotes() != null ? dto.reviewNotes() : "Chưa đạt điều kiện tham gia."),
                    "WARNING");
        }

        GroupJoinRequest saved = joinRequestRepository.save(req);
        User applicant = userRepository.findById(req.getUserId()).orElse(null);

        return GroupJoinRequestResponse.fromEntity(
                saved,
                group.getName(),
                applicant != null ? applicant.getFullName() : "",
                applicant != null ? applicant.getEmail() : "");
    }

    // ==========================================
    // 6. Member Invitations & Code Redemption
    // ==========================================

    @Transactional
    public GroupInvitationResponse createInvitation(UUID groupId, CreateInvitationRequest request,
            UserPrincipal principal) {
        if (principal == null)
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        validateRepresentativeOrAdmin(groupId, principal);

        CoOwnershipGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Nhóm không tồn tại: " + groupId));

        if (invitationRepository.existsByGroupIdAndInviteeEmailAndStatus(groupId, request.inviteeEmail(),
                InvitationStatus.PENDING)) {
            throw new DuplicateResourceException("Lời mời đã được gửi đến email này và đang chờ phản hồi.");
        }

        String inviteCode = generateInviteCode();
        Instant expiresAt = Instant.now().plus(14, ChronoUnit.DAYS);

        Optional<User> recipient = userRepository.findByEmail(request.inviteeEmail());

        GroupInvitation inv = new GroupInvitation(
                UUID.randomUUID(),
                groupId,
                principal.getId(),
                request.inviteeEmail(),
                recipient.map(User::getId).orElse(request.inviteeUserId()),
                request.proposedPercentage(),
                inviteCode,
                expiresAt);
        GroupInvitation saved = invitationRepository.save(inv);

        // Notify recipient if registered
        recipient.ifPresent(u -> notificationService.sendNotification(
                u.getId(),
                group.getVehicleId(),
                groupId,
                "GROUP_INVITATION",
                saved.getId(),
                "INVITATION_RECEIVED",
                "Lời mời tham gia nhóm xe",
                principal.getUser().getFullName() + " mời bạn tham gia nhóm " + group.getName() + " với tỷ lệ sở hữu "
                        + request.proposedPercentage() + "%.",
                "INFO"));

        return GroupInvitationResponse.fromEntity(saved, group.getName(), principal.getUser().getFullName());
    }

    @Transactional(readOnly = true)
    public List<GroupInvitationResponse> getMyInvitations(UserPrincipal principal) {
        if (principal == null || principal.getUser() == null)
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        String email = principal.getUser().getEmail();

        List<GroupInvitation> list = invitationRepository.findByInviteeEmailAndStatusOrderByCreatedAtDesc(
                email, InvitationStatus.PENDING);

        return list.stream().map(inv -> {
            CoOwnershipGroup grp = groupRepository.findById(inv.getGroupId()).orElse(null);
            String gName = grp != null ? grp.getName() : "Nhóm xe";
            String inviter = userRepository.findById(inv.getInviterId()).map(User::getFullName).orElse("Đại diện nhóm");

            Vehicle v = grp != null ? resolveGroupVehicle(grp) : null;
            String vModel = v != null ? (v.getBrand() + " " + v.getModel()) : "VinFast VF8";
            String vPlate = v != null ? v.getLicensePlate() : "";
            BigDecimal estVal = new BigDecimal("1200000000");
            BigDecimal pct = inv.getProposedPercentage() != null ? inv.getProposedPercentage() : BigDecimal.ZERO;
            BigDecimal contrib = estVal.multiply(pct).divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);

            CoOwnershipContract contract = grp != null ? contractRepository.findByGroupId(grp.getId()).orElse(null) : null;
            UUID cId = contract != null ? contract.getId() : null;
            UUID vId = contract != null && contract.getCurrentVersion() != null ? contract.getCurrentVersion().getId() : null;
            String cHash = contract != null && contract.getCurrentVersion() != null ? contract.getCurrentVersion().getContentHash() : null;

            return GroupInvitationResponse.fromEntity(
                    inv, gName, inviter, vModel, vPlate, contrib, cId, vId, cHash
            );
        }).collect(Collectors.toList());
    }

    @Transactional
    public InvitationContractReviewResponse getInvitationContractReview(UUID invitationId, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }
        GroupInvitation inv = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Lời mời không tồn tại: " + invitationId));

        if (!inv.getInviteeEmail().equalsIgnoreCase(principal.getUser().getEmail())
                && (inv.getInviteeUserId() == null || !inv.getInviteeUserId().equals(principal.getId()))) {
            throw new AccessDeniedException("Bạn không phải người nhận lời mời này.");
        }

        if (inv.getStatus() != InvitationStatus.PENDING) {
            throw new IllegalStateException("Lời mời này đã được phản hồi hoặc đã hết hạn.");
        }

        // Section 5: Critical Zero-Percent Guard
        if (inv.getProposedPercentage() == null || inv.getProposedPercentage().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("Cổ phần chưa hợp lệ (0%). Vui lòng liên hệ người mời để cập nhật.");
        }

        CoOwnershipGroup group = groupRepository.findById(inv.getGroupId())
                .orElseThrow(() -> new ResourceNotFoundException("Nhóm không tồn tại: " + inv.getGroupId()));

        Vehicle vehicle = resolveGroupVehicle(group);
        if (vehicle == null) {
            throw new IllegalStateException("Nhóm đồng sở hữu chưa được gán xe hợp lệ.");
        }

        // Resolve or create authoritative contract for this group
        CoOwnershipContract contract = contractRepository.findByGroupId(group.getId())
                .orElseGet(() -> {
                    contractService.getContractSummaryByVehicle(vehicle.getId().toString(), principal);
                    return contractRepository.findByGroupId(group.getId())
                            .orElseThrow(() -> new ResourceNotFoundException("Chưa có hợp đồng nào cho nhóm xe này."));
                });

        CoOwnershipContractVersion version = contract.getCurrentVersion();
        if (version == null) {
            List<CoOwnershipContractVersion> versions = contractVersionRepository.findByContractIdOrderByVersionNumberDesc(contract.getId());
            if (!versions.isEmpty()) {
                version = versions.get(0);
            }
        }
        if (version == null) {
            throw new IllegalStateException("Chưa có phiên bản hợp đồng nào sẵn sàng để ký duyệt.");
        }

        BigDecimal estVal = new BigDecimal("1200000000");
        BigDecimal contrib = estVal.multiply(inv.getProposedPercentage()).divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);
        String inviterName = userRepository.findById(inv.getInviterId()).map(User::getFullName).orElse("Đại diện nhóm");

        boolean alreadyConsented = inv.getConsentedAt() != null
                && version.getId().equals(inv.getContractVersionId())
                && version.getContentHash().equalsIgnoreCase(inv.getConsentContentHash());

        return new InvitationContractReviewResponse(
                inv.getId(),
                group.getId(),
                group.getName(),
                vehicle.getId(),
                vehicle.getName(),
                vehicle.getBrand() + " " + vehicle.getModel(),
                vehicle.getLicensePlate(),
                estVal,
                inv.getInviterId(),
                inviterName,
                inv.getInviteeEmail(),
                principal.getUser().getFullName(),
                inv.getProposedPercentage(),
                contrib,
                contract.getId(),
                contract.getContractCode(),
                version.getId(),
                version.getVersionNumber(),
                version.getVersionNumberFormatted(),
                version.getTitle(),
                version.getContentSnapshot(),
                version.getContentHash(),
                group.getVotingRule() != null ? group.getVotingRule() : "OWNERSHIP_WEIGHTED",
                group.getQuorumPercentage() != null ? group.getQuorumPercentage() : new BigDecimal("50.00"),
                group.getApprovalThresholdPercentage() != null ? group.getApprovalThresholdPercentage() : new BigDecimal("50.00"),
                alreadyConsented,
                inv.getConsentedAt(),
                inv.getSignerFullName()
        );
    }

    @Transactional
    public GroupInvitationResponse recordInvitationConsent(
            UUID invitationId,
            InvitationConsentRequest request,
            UserPrincipal principal,
            String ipAddress
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }
        GroupInvitation inv = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Lời mời không tồn tại: " + invitationId));

        if (!inv.getInviteeEmail().equalsIgnoreCase(principal.getUser().getEmail())
                && (inv.getInviteeUserId() == null || !inv.getInviteeUserId().equals(principal.getId()))) {
            throw new AccessDeniedException("Bạn không phải người nhận lời mời này.");
        }

        if (inv.getStatus() != InvitationStatus.PENDING) {
            throw new IllegalStateException("Lời mời này đã được phản hồi hoặc đã hết hạn.");
        }

        // Section 5: Critical Zero-Percent Guard
        if (inv.getProposedPercentage() == null || inv.getProposedPercentage().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("Cổ phần chưa hợp lệ (0%). Vui lòng liên hệ người mời để cập nhật.");
        }

        if (!request.confirmReadAndAgreed()) {
            throw new IllegalArgumentException("Bạn cần xác nhận đã đọc và đồng ý với nội dung hợp đồng.");
        }

        if (request.signerFullName() == null || request.signerFullName().trim().length() < 2) {
            throw new IllegalArgumentException("Vui lòng nhập họ tên xác nhận chữ ký điện tử.");
        }

        CoOwnershipContractVersion version = contractVersionRepository.findById(request.contractVersionId())
                .orElseThrow(() -> new ResourceNotFoundException("Phiên bản hợp đồng không tồn tại: " + request.contractVersionId()));

        // Section 8: Document Immutability Guard
        if (!version.getContentHash().equalsIgnoreCase(request.contentHash())) {
            throw new IllegalStateException("Nội dung hợp đồng đã thay đổi. Vui lòng tải lại và xem phiên bản mới nhất.");
        }

        // Record consent audit on invitation
        inv.setContractVersionId(version.getId());
        inv.setConsentContentHash(version.getContentHash());
        inv.setConsentedAt(Instant.now());
        inv.setSignerFullName(request.signerFullName().trim());
        inv.setConsentMethod("AUTHENTICATED_ELECTRONIC_CONSENT");
        inv.setConsentIpAddress(ipAddress != null ? ipAddress : "127.0.0.1");
        GroupInvitation saved = invitationRepository.save(inv);

        // Also record in central contract_acceptances if not exists
        if (!contractAcceptanceRepository.existsByContractVersionIdAndUserId(version.getId(), principal.getId())) {
            ContractAcceptance acceptance = new ContractAcceptance(
                    UUID.randomUUID(),
                    version,
                    principal.getUser(),
                    version.getContentHash(),
                    "AUTHENTICATED_ELECTRONIC_CONSENT",
                    ipAddress != null ? ipAddress : "127.0.0.1",
                    "EVShare3D/InvitationConsent"
            );
            contractAcceptanceRepository.save(acceptance);
        }

        CoOwnershipGroup group = groupRepository.findById(saved.getGroupId()).orElseThrow();
        String inviterName = userRepository.findById(saved.getInviterId()).map(User::getFullName).orElse("");
        Vehicle vehicle = resolveGroupVehicle(group);
        String vModel = vehicle != null ? (vehicle.getBrand() + " " + vehicle.getModel()) : "VinFast VF8";
        String vPlate = vehicle != null ? vehicle.getLicensePlate() : "";
        BigDecimal estVal = new BigDecimal("1200000000");
        BigDecimal contrib = estVal.multiply(saved.getProposedPercentage()).divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);

        return GroupInvitationResponse.fromEntity(
                saved,
                group.getName(),
                inviterName,
                vModel,
                vPlate,
                contrib,
                version.getContract().getId(),
                version.getId(),
                version.getContentHash()
        );
    }

    @Transactional
    public GroupInvitationResponse signAndAcceptInvitation(
            UUID invitationId,
            InvitationConsentRequest request,
            UserPrincipal principal,
            String ipAddress
    ) {
        recordInvitationConsent(invitationId, request, principal, ipAddress);
        return respondToInvitation(invitationId, true, principal);
    }

    @Transactional
    public GroupInvitationResponse respondToInvitation(UUID invitationId, boolean accept, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null)
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        GroupInvitation inv = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Lời mời không tồn tại: " + invitationId));

        if (!inv.getInviteeEmail().equalsIgnoreCase(principal.getUser().getEmail())
                && (inv.getInviteeUserId() == null || !inv.getInviteeUserId().equals(principal.getId()))) {
            throw new AccessDeniedException("Bạn không phải người nhận lời mời này.");
        }

        if (inv.getStatus() != InvitationStatus.PENDING) {
            throw new IllegalStateException("Lời mời này đã được phản hồi hoặc đã hết hạn.");
        }

        CoOwnershipGroup group = groupRepository.findById(inv.getGroupId())
                .orElseThrow(() -> new ResourceNotFoundException("Nhóm không tồn tại: " + inv.getGroupId()));

        if (accept) {
            // Section 5 Guard: Zero-Percent Guard
            if (inv.getProposedPercentage() == null || inv.getProposedPercentage().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalStateException("Cổ phần đề xuất chưa hợp lệ (0%). Vui lòng liên hệ người mời để cập nhật.");
            }

            // Section 13 Guard: Required Electronic Consent
            if (inv.getConsentedAt() == null || inv.getContractVersionId() == null || inv.getConsentContentHash() == null) {
                throw new IllegalStateException("Bạn bắt buộc phải xem hợp đồng và ký xác nhận điện tử trước khi chấp nhận lời mời.");
            }

            // Section 8 & 13 Guard: Document Immutability
            CoOwnershipContractVersion version = contractVersionRepository.findById(inv.getContractVersionId())
                    .orElseThrow(() -> new IllegalStateException("Phiên bản hợp đồng đã ký không còn tồn tại."));
            if (!version.getContentHash().equalsIgnoreCase(inv.getConsentContentHash())) {
                throw new IllegalStateException("Hợp đồng đã có bản cập nhật mới. Bạn cần đọc và ký xác nhận lại phiên bản mới.");
            }

            // Check duplicate membership
            boolean alreadyMember = memberRepository.findByGroupIdAndUserId(group.getId(), principal.getId())
                    .filter(m -> m.getStatus() == MemberStatus.ACTIVE && m.getRemovedAt() == null)
                    .isPresent();

            GroupMember savedMember;
            if (!alreadyMember) {
                GroupMember member = new GroupMember(
                        UUID.randomUUID(),
                        group,
                        principal.getUser(),
                        GroupMemberRole.MEMBER,
                        MemberStatus.ACTIVE);
                savedMember = memberRepository.save(member);
            } else {
                savedMember = memberRepository.findByGroupIdAndUserId(group.getId(), principal.getId()).orElseThrow();
            }

            // Assign share
            Vehicle vehicle = resolveGroupVehicle(group);
            if (vehicle != null && savedMember != null) {
                OwnershipShare share = new OwnershipShare(
                        UUID.randomUUID(),
                        group,
                        vehicle,
                        savedMember,
                        inv.getProposedPercentage());
                shareRepository.save(share);
            }

            inv.setStatus(InvitationStatus.ACCEPTED);

            notificationService.sendNotification(
                    inv.getInviterId(),
                    group.getVehicleId(),
                    group.getId(),
                    "GROUP_INVITATION",
                    inv.getId(),
                    "INVITATION_ACCEPTED",
                    "Lời mời đã được chấp nhận",
                    principal.getUser().getFullName() + " đã ký hợp đồng và đồng ý tham gia nhóm " + group.getName() + ".",
                    "SUCCESS");
        } else {
            inv.setStatus(InvitationStatus.DECLINED);
        }

        GroupInvitation saved = invitationRepository.save(inv);
        String inviterName = userRepository.findById(inv.getInviterId()).map(User::getFullName).orElse("");
        Vehicle vehicle = resolveGroupVehicle(group);
        String vModel = vehicle != null ? (vehicle.getBrand() + " " + vehicle.getModel()) : "VinFast VF8";
        String vPlate = vehicle != null ? vehicle.getLicensePlate() : "";
        BigDecimal estVal = new BigDecimal("1200000000");
        BigDecimal contrib = estVal.multiply(saved.getProposedPercentage() != null ? saved.getProposedPercentage() : BigDecimal.ZERO)
                .divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);

        return GroupInvitationResponse.fromEntity(
                saved,
                group.getName(),
                inviterName,
                vModel,
                vPlate,
                contrib,
                inv.getContractVersionId(),
                inv.getContractVersionId(),
                inv.getConsentContentHash()
        );
    }

    @Transactional
    public GroupInvitationResponse redeemInviteCode(String code, UserPrincipal principal) {
        if (principal == null)
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        GroupInvitation inv = invitationRepository.findByInviteCode(code.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Mã mời không hợp lệ hoặc không tồn tại: " + code));

        if (inv.getStatus() != InvitationStatus.PENDING) {
            throw new IllegalStateException("Mã mời này đã được sử dụng hoặc đã hết hạn.");
        }

        CoOwnershipGroup group = groupRepository.findById(inv.getGroupId())
                .orElseThrow(() -> new ResourceNotFoundException("Nhóm không tồn tại: " + inv.getGroupId()));
        String inviter = userRepository.findById(inv.getInviterId()).map(User::getFullName).orElse("Đại diện nhóm");

        return GroupInvitationResponse.fromEntity(inv, group.getName(), inviter);
    }

    // ==========================================
    // Helpers
    // ==========================================

    private void validateRepresentativeOrAdmin(UUID groupId, UserPrincipal principal) {
        if (principal.getUser().getRole() == Role.ADMIN)
            return;

        boolean isRep = memberRepository.findByGroupIdAndStatus(groupId, MemberStatus.ACTIVE).stream()
                .anyMatch(m -> m.getRemovedAt() == null
                        && m.getUser().getId().equals(principal.getId())
                        && m.getMemberRole() == GroupMemberRole.REPRESENTATIVE);

        if (!isRep) {
            throw new AccessDeniedException(
                    "Chỉ người đại diện nhóm hoặc quản trị viên mới có quyền thực hiện thao tác này.");
        }
    }

    private Vehicle resolveGroupVehicle(CoOwnershipGroup group) {
        if (group.getVehicleId() != null) {
            return vehicleRepository.findById(group.getVehicleId()).orElse(null);
        }
        List<GroupVehicle> gvs = groupVehicleRepository.findByGroupIdAndStatus(group.getId(),
                GroupVehicleStatus.ACTIVE);
        if (!gvs.isEmpty() && gvs.get(0).getVehicle() != null) {
            return gvs.get(0).getVehicle();
        }
        return null;
    }

    private String generateInviteCode() {
        StringBuilder sb = new StringBuilder("EV-");
        for (int i = 0; i < 6; i++) {
            sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }

    private List<Map<String, Object>> parseProposedCoOwners(String json) {
        if (json == null || json.isBlank())
            return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {
            });
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private String sanitizeExteriorColor(String rawColor) {
        if (rawColor == null || rawColor.isBlank()) {
            return "Trắng ngọc trai";
        }
        String trimmed = rawColor.trim();
        String lower = trimmed.toLowerCase();
        if (lower.contains("trắng") || lower.contains("white") || lower.equalsIgnoreCase("#f8f9fa")) {
            return "Trắng ngọc trai";
        }
        if (lower.contains("đen") || lower.contains("black") || lower.equalsIgnoreCase("#1a1a1a")) {
            return "Đen huyền bí";
        }
        if (lower.contains("xám") || lower.contains("bạc") || lower.contains("silver") || lower.equalsIgnoreCase("#8e9297")) {
            return "Xám bạc";
        }
        if (lower.contains("dương") || lower.contains("blue") || lower.equalsIgnoreCase("#10447c")) {
            return "Xanh đại dương";
        }
        if (lower.contains("đỏ") || lower.contains("red") || lower.equalsIgnoreCase("#a31a24")) {
            return "Đỏ thẫm";
        }
        return trimmed;
    }
}
