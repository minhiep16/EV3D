package com.evshare.onboarding.service;

import com.evshare.common.exception.DuplicateResourceException;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.common.exception.UnauthorizedException;
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
            ObjectMapper objectMapper
    ) {
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
                    "/garage"
            );
        }

        // CO_OWNER: Check active memberships in active groups
        List<GroupMember> activeMemberships = memberRepository.findByUserIdAndStatus(userId, MemberStatus.ACTIVE).stream()
                .filter(m -> m.getRemovedAt() == null && m.getGroup() != null && m.getGroup().getStatus() == GroupStatus.ACTIVE)
                .toList();

        List<VehicleResponse> authorizedVehicles = vehicleService.getAllVehicles(principal);
        boolean hasActiveGroup = !activeMemberships.isEmpty() && !authorizedVehicles.isEmpty();

        long pendingInvitations = invitationRepository.countByInviteeEmailAndStatus(user.getEmail(), InvitationStatus.PENDING);
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
                route
        );
    }

    // ==========================================
    // 2. Vehicle Registration Drafts
    // ==========================================

    @Transactional(readOnly = true)
    public List<VehicleRegistrationDraftResponse> getMyDrafts(UserPrincipal principal) {
        if (principal == null) throw new UnauthorizedException("Vui lòng đăng nhập.");
        return draftRepository.findByUserIdOrderByUpdatedAtDesc(principal.getId()).stream()
                .map(VehicleRegistrationDraftResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VehicleRegistrationDraftResponse getDraftById(UUID draftId, UserPrincipal principal) {
        if (principal == null) throw new UnauthorizedException("Vui lòng đăng nhập.");
        VehicleRegistrationDraft draft = draftRepository.findByIdAndUserId(draftId, principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Bản nháp không tồn tại hoặc bạn không có quyền truy cập: " + draftId));
        return VehicleRegistrationDraftResponse.fromEntity(draft);
    }

    @Transactional
    public VehicleRegistrationDraftResponse saveDraft(VehicleRegistrationDraftRequest request, UserPrincipal principal) {
        if (principal == null) throw new UnauthorizedException("Vui lòng đăng nhập.");

        VehicleRegistrationDraft draft = new VehicleRegistrationDraft(
                UUID.randomUUID(),
                principal.getId(),
                request.vehicleName()
        );
        populateDraftFields(draft, request);
        VehicleRegistrationDraft saved = draftRepository.save(draft);
        return VehicleRegistrationDraftResponse.fromEntity(saved);
    }

    @Transactional
    public VehicleRegistrationDraftResponse updateDraft(UUID draftId, VehicleRegistrationDraftRequest request, UserPrincipal principal) {
        if (principal == null) throw new UnauthorizedException("Vui lòng đăng nhập.");
        VehicleRegistrationDraft draft = draftRepository.findByIdAndUserId(draftId, principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Bản nháp không tồn tại: " + draftId));

        if (draft.getStatus() != DraftStatus.DRAFT) {
            throw new IllegalStateException("Không thể chỉnh sửa bản nháp đã nộp hoặc đã phê duyệt.");
        }

        draft.setVehicleName(request.vehicleName());
        populateDraftFields(draft, request);
        VehicleRegistrationDraft updated = draftRepository.save(draft);
        return VehicleRegistrationDraftResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteDraft(UUID draftId, UserPrincipal principal) {
        if (principal == null) throw new UnauthorizedException("Vui lòng đăng nhập.");
        VehicleRegistrationDraft draft = draftRepository.findByIdAndUserId(draftId, principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Bản nháp không tồn tại: " + draftId));
        draftRepository.delete(draft);
    }

    private void populateDraftFields(VehicleRegistrationDraft draft, VehicleRegistrationDraftRequest request) {
        draft.setManufacturer(request.manufacturer());
        draft.setModel(request.model());
        draft.setModelYear(request.modelYear());
        draft.setLicensePlate(request.licensePlate());
        draft.setVin(request.vin());
        draft.setBatteryCapacity(request.batteryCapacity());
        draft.setBatteryType(request.batteryType());
        draft.setGroupName(request.groupName());
        if (request.votingRule() != null) draft.setVotingRule(request.votingRule());
        if (request.quorumPercentage() != null) draft.setQuorumPercentage(request.quorumPercentage());
        if (request.approvalThresholdPercentage() != null) draft.setApprovalThresholdPercentage(request.approvalThresholdPercentage());
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
        vehicle.setBrand(draft.getManufacturer() != null && !draft.getManufacturer().isBlank() ? draft.getManufacturer() : "VinFast");
        vehicle.setModel(draft.getModel() != null && !draft.getModel().isBlank() ? draft.getModel() : "VF8");
        vehicle.setYear(draft.getModelYear() != null ? draft.getModelYear() : 2025);
        vehicle.setLicensePlate(licPlate);
        vehicle.setVin(vin);
        vehicle.setBatteryCapacity(capacity);
        vehicle.setCurrentBatteryLevel(100);
        vehicle.setOdometer(BigDecimal.ZERO);
        vehicle.setStatus(VehicleStatus.AVAILABLE);
        vehicle.setModel3dUrl("/models/ev-car.glb");
        Vehicle savedVehicle = vehicleRepository.save(vehicle);

        // 2. Create CoOwnershipGroup Entity
        String gName = draft.getGroupName() != null && !draft.getGroupName().isBlank()
                ? draft.getGroupName()
                : "Nhóm xe " + vName;

        CoOwnershipGroup group = new CoOwnershipGroup(UUID.randomUUID(), savedVehicle.getId(), gName);
        group.setCreatedBy(creator.getId());
        if (draft.getVotingRule() != null) group.setVotingRule(draft.getVotingRule());
        if (draft.getQuorumPercentage() != null) group.setQuorumPercentage(draft.getQuorumPercentage());
        if (draft.getApprovalThresholdPercentage() != null) group.setApprovalThresholdPercentage(draft.getApprovalThresholdPercentage());
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
                MemberStatus.ACTIVE
        );
        GroupMember savedCreatorMember = memberRepository.save(creatorMember);

        // 5. Parse and Process Proposed Co-Owners from Draft
        BigDecimal creatorPercentage = new BigDecimal("100.00");
        List<Map<String, Object>> proposedCoOwners = parseProposedCoOwners(draft.getProposedCoOwners());

        if (!proposedCoOwners.isEmpty()) {
            BigDecimal totalInvitedShare = BigDecimal.ZERO;

            for (Map<String, Object> coOwner : proposedCoOwners) {
                String email = (String) coOwner.get("email");
                Object pctObj = coOwner.get("percentage");
                BigDecimal percentage = pctObj != null ? new BigDecimal(pctObj.toString()) : BigDecimal.ZERO;

                if (email != null && !email.isBlank() && percentage.compareTo(BigDecimal.ZERO) > 0) {
                    totalInvitedShare = totalInvitedShare.add(percentage);

                    // Generate secure invite code
                    String inviteCode = generateInviteCode();
                    Instant expiresAt = Instant.now().plus(14, ChronoUnit.DAYS);

                    // Optional matching user
                    Optional<User> recipientUser = userRepository.findByEmail(email);

                    GroupInvitation invitation = new GroupInvitation(
                            UUID.randomUUID(),
                            savedGroup.getId(),
                            creator.getId(),
                            email,
                            recipientUser.map(User::getId).orElse(null),
                            percentage,
                            inviteCode,
                            expiresAt
                    );
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
                            "Bạn nhận được lời mời tham gia nhóm xe " + vName + " với tỷ lệ đề xuất " + percentage + "%.",
                            "INFO"
                    ));
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
                creatorPercentage
        );
        shareRepository.save(creatorShare);

        // 7. Make Group Discoverable by default
        GroupDiscoverySetting discovery = new GroupDiscoverySetting(
                savedGroup.getId(),
                true,
                3,
                draft.getModel() != null ? draft.getModel() : vName
        );
        discovery.setPublicTerms("Đồng sở hữu theo tỷ lệ vốn góp. Biểu quyết tự động theo trọng số sở hữu.");
        discovery.setJoinConditions("Yêu cầu cam kết tuân thủ quy tắc quản lý và thanh toán chi phí dùng xe đúng hạn.");
        discoveryRepository.save(discovery);

        // 8. Generate Authoritative Contract for Vehicle
        try {
            contractService.getContractSummaryByVehicle(savedVehicle.getId().toString(), principal);
        } catch (Exception ignored) {}

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
                "SUCCESS"
        );

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
            if (groupOpt.isEmpty()) continue;
            CoOwnershipGroup group = groupOpt.get();
            if (group.getStatus() != GroupStatus.ACTIVE) continue;

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
                            group.getId(), currentUserId, JoinRequestStatus.PENDING
                    );
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
                    setting.getTargetModel() != null ? setting.getTargetModel() : (vehicle != null ? vehicle.getName() : "EV"),
                    setting.getOpenSlots(),
                    setting.getPublicTerms(),
                    setting.getJoinConditions(),
                    setting.isDiscoverable(),
                    joinStatus,
                    memberCount,
                    group.getCreatedAt()
            ));
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
            } else if (joinRequestRepository.existsByGroupIdAndUserIdAndStatus(group.getId(), currentUserId, JoinRequestStatus.PENDING)) {
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
                setting.getTargetModel() != null ? setting.getTargetModel() : (vehicle != null ? vehicle.getName() : "EV"),
                setting.getOpenSlots(),
                setting.getPublicTerms(),
                setting.getJoinConditions(),
                setting.isDiscoverable(),
                joinStatus,
                memberCount,
                group.getCreatedAt()
        );
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
                dto.message() != null ? dto.message() : "Xin chào, tôi mong muốn tham gia nhóm đồng sở hữu xe."
        );
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
                        "INFO"
                ));

        return GroupJoinRequestResponse.fromEntity(
                saved,
                group.getName(),
                principal.getUser().getFullName(),
                principal.getUser().getEmail()
        );
    }

    @Transactional(readOnly = true)
    public List<GroupJoinRequestResponse> getMyJoinRequests(UserPrincipal principal) {
        if (principal == null) throw new UnauthorizedException("Vui lòng đăng nhập.");
        List<GroupJoinRequest> list = joinRequestRepository.findByUserIdOrderByCreatedAtDesc(principal.getId());

        return list.stream().map(req -> {
            String groupName = groupRepository.findById(req.getGroupId()).map(CoOwnershipGroup::getName).orElse("Nhóm xe");
            return GroupJoinRequestResponse.fromEntity(
                    req,
                    groupName,
                    principal.getUser().getFullName(),
                    principal.getUser().getEmail()
            );
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GroupJoinRequestResponse> getGroupJoinRequests(UUID groupId, UserPrincipal principal) {
        if (principal == null) throw new UnauthorizedException("Vui lòng đăng nhập.");
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
                            applicant != null ? applicant.getEmail() : ""
                    );
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public GroupJoinRequestResponse reviewJoinRequest(UUID requestId, ReviewJoinRequestDto dto, UserPrincipal principal) {
        if (principal == null) throw new UnauthorizedException("Vui lòng đăng nhập.");
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
                        MemberStatus.ACTIVE
                );
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
                    "SUCCESS"
            );
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
                    "Yêu cầu tham gia nhóm " + group.getName() + " của bạn chưa được chấp thuận: " + (dto.reviewNotes() != null ? dto.reviewNotes() : "Chưa đạt điều kiện tham gia."),
                    "WARNING"
            );
        }

        GroupJoinRequest saved = joinRequestRepository.save(req);
        User applicant = userRepository.findById(req.getUserId()).orElse(null);

        return GroupJoinRequestResponse.fromEntity(
                saved,
                group.getName(),
                applicant != null ? applicant.getFullName() : "",
                applicant != null ? applicant.getEmail() : ""
        );
    }

    // ==========================================
    // 6. Member Invitations & Code Redemption
    // ==========================================

    @Transactional
    public GroupInvitationResponse createInvitation(UUID groupId, CreateInvitationRequest request, UserPrincipal principal) {
        if (principal == null) throw new UnauthorizedException("Vui lòng đăng nhập.");
        validateRepresentativeOrAdmin(groupId, principal);

        CoOwnershipGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Nhóm không tồn tại: " + groupId));

        if (invitationRepository.existsByGroupIdAndInviteeEmailAndStatus(groupId, request.inviteeEmail(), InvitationStatus.PENDING)) {
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
                expiresAt
        );
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
                principal.getUser().getFullName() + " mời bạn tham gia nhóm " + group.getName() + " với tỷ lệ sở hữu " + request.proposedPercentage() + "%.",
                "INFO"
        ));

        return GroupInvitationResponse.fromEntity(saved, group.getName(), principal.getUser().getFullName());
    }

    @Transactional(readOnly = true)
    public List<GroupInvitationResponse> getMyInvitations(UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) throw new UnauthorizedException("Vui lòng đăng nhập.");
        String email = principal.getUser().getEmail();

        List<GroupInvitation> list = invitationRepository.findByInviteeEmailAndStatusOrderByCreatedAtDesc(
                email, InvitationStatus.PENDING
        );

        return list.stream().map(inv -> {
            String gName = groupRepository.findById(inv.getGroupId()).map(CoOwnershipGroup::getName).orElse("Nhóm xe");
            String inviter = userRepository.findById(inv.getInviterId()).map(User::getFullName).orElse("Đại diện nhóm");
            return GroupInvitationResponse.fromEntity(inv, gName, inviter);
        }).collect(Collectors.toList());
    }

    @Transactional
    public GroupInvitationResponse respondToInvitation(UUID invitationId, boolean accept, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) throw new UnauthorizedException("Vui lòng đăng nhập.");
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
            inv.setStatus(InvitationStatus.ACCEPTED);

            // Add member to group
            GroupMember member = new GroupMember(
                    UUID.randomUUID(),
                    group,
                    principal.getUser(),
                    GroupMemberRole.MEMBER,
                    MemberStatus.ACTIVE
            );
            GroupMember savedMember = memberRepository.save(member);

            // Assign share
            Vehicle vehicle = resolveGroupVehicle(group);
            if (vehicle != null) {
                OwnershipShare share = new OwnershipShare(
                        UUID.randomUUID(),
                        group,
                        vehicle,
                        savedMember,
                        inv.getProposedPercentage()
                );
                shareRepository.save(share);
            }

            notificationService.sendNotification(
                    inv.getInviterId(),
                    group.getVehicleId(),
                    group.getId(),
                    "GROUP_INVITATION",
                    inv.getId(),
                    "INVITATION_ACCEPTED",
                    "Lời mời đã được chấp nhận",
                    principal.getUser().getFullName() + " đã đồng ý tham gia nhóm " + group.getName() + ".",
                    "SUCCESS"
            );
        } else {
            inv.setStatus(InvitationStatus.DECLINED);
        }

        GroupInvitation saved = invitationRepository.save(inv);
        String inviterName = userRepository.findById(inv.getInviterId()).map(User::getFullName).orElse("");
        return GroupInvitationResponse.fromEntity(saved, group.getName(), inviterName);
    }

    @Transactional
    public GroupInvitationResponse redeemInviteCode(String code, UserPrincipal principal) {
        if (principal == null) throw new UnauthorizedException("Vui lòng đăng nhập.");
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
        if (principal.getUser().getRole() == Role.ADMIN) return;

        boolean isRep = memberRepository.findByGroupIdAndStatus(groupId, MemberStatus.ACTIVE).stream()
                .anyMatch(m -> m.getRemovedAt() == null
                        && m.getUser().getId().equals(principal.getId())
                        && m.getMemberRole() == GroupMemberRole.REPRESENTATIVE);

        if (!isRep) {
            throw new AccessDeniedException("Chỉ người đại diện nhóm hoặc quản trị viên mới có quyền thực hiện thao tác này.");
        }
    }

    private Vehicle resolveGroupVehicle(CoOwnershipGroup group) {
        if (group.getVehicleId() != null) {
            return vehicleRepository.findById(group.getVehicleId()).orElse(null);
        }
        List<GroupVehicle> gvs = groupVehicleRepository.findByGroupIdAndStatus(group.getId(), GroupVehicleStatus.ACTIVE);
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
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}

