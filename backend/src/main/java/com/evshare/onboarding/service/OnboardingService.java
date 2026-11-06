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
import com.evshare.user.entity.UserStatus;
import com.evshare.user.repository.UserRepository;
import com.evshare.vehicle.dto.VehicleResponse;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.entity.VehicleStatus;
import com.evshare.vehicle.repository.VehicleRepository;
import com.evshare.vehicle.service.VehicleService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

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
    private static final List<DraftStatus> ACTIVE_APPLICATION_STATUSES = List.of(
            DraftStatus.SUBMITTED,
            DraftStatus.UNDER_REVIEW);

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
                .map(this::mapDraftResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VehicleRegistrationDraftResponse getDraftById(UUID draftId, UserPrincipal principal) {
        if (principal == null)
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        VehicleRegistrationDraft draft = draftRepository.findByIdAndUserId(draftId, principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Bản nháp không tồn tại hoặc bạn không có quyền truy cập: " + draftId));
        return mapDraftResponse(draft);
    }

    @Transactional
    public VehicleRegistrationDraftResponse saveDraft(VehicleRegistrationDraftRequest request,
            UserPrincipal principal) {
        if (principal == null)
            throw new UnauthorizedException("Vui lòng đăng nhập.");

        String reqPlate = normalizeLicensePlate(request.licensePlate());
        String reqVin = normalizeVin(request.vin());
        String reqModel = request.model() != null && !request.model().isBlank()
                ? request.model().trim()
                : request.getResolvedVehicleName();

        // Idempotency & same-applicant draft reuse:
        // If the same user already has an application for this license plate (or exact logical submission),
        // update/reuse the existing record rather than creating competing duplicate rows for the same user.
        if (reqPlate != null) {
            List<VehicleRegistrationDraft> userDrafts = draftRepository.findByUserIdOrderByUpdatedAtDesc(principal.getId());
            for (VehicleRegistrationDraft existing : userDrafts) {
                String existingPlate = normalizeLicensePlate(existing.getLicensePlate());
                boolean samePlate = reqPlate.equalsIgnoreCase(existingPlate);
                if (samePlate || isSameLogicalSubmission(existing, principal.getId(), reqPlate, reqVin, reqModel)) {
                    if (existing.getStatus() == DraftStatus.DRAFT || existing.getStatus() == DraftStatus.CHANGES_REQUESTED) {
                        existing.setVehicleName(request.getResolvedVehicleName());
                        populateDraftFields(existing, request);
                        return mapDraftResponse(draftRepository.save(existing));
                    }
                    if (existing.getStatus() == DraftStatus.SUBMITTED || existing.getStatus() == DraftStatus.UNDER_REVIEW) {
                        DraftStatus preservedStatus = existing.getStatus();
                        Instant preservedSubmittedAt = existing.getSubmittedAt();
                        existing.setVehicleName(request.getResolvedVehicleName());
                        populateDraftFields(existing, request);
                        existing.setStatus(preservedStatus);
                        existing.setSubmittedAt(preservedSubmittedAt != null ? preservedSubmittedAt : Instant.now());
                        return mapDraftResponse(draftRepository.save(existing));
                    }
                }
            }
        }

        VehicleRegistrationDraft draft = new VehicleRegistrationDraft(
                UUID.randomUUID(),
                principal.getId(),
                request.getResolvedVehicleName());
        populateDraftFields(draft, request);
        VehicleRegistrationDraft saved = draftRepository.save(draft);
        return mapDraftResponse(saved);
    }

    @Transactional
    public VehicleRegistrationDraftResponse updateDraft(UUID draftId, VehicleRegistrationDraftRequest request,
            UserPrincipal principal) {
        if (principal == null)
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        VehicleRegistrationDraft draft = draftRepository.findByIdAndUserId(draftId, principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Bản nháp không tồn tại: " + draftId));

        if (draft.getStatus() == DraftStatus.APPROVED) {
            throw new IllegalStateException("Không thể chỉnh sửa hồ sơ đã được phê duyệt.");
        }

        if (draft.getStatus() == DraftStatus.SUBMITTED || draft.getStatus() == DraftStatus.UNDER_REVIEW) {
            DraftStatus preservedStatus = draft.getStatus();
            Instant preservedSubmittedAt = draft.getSubmittedAt();
            draft.setVehicleName(request.getResolvedVehicleName());
            populateDraftFields(draft, request);
            draft.setStatus(preservedStatus);
            draft.setSubmittedAt(preservedSubmittedAt != null ? preservedSubmittedAt : Instant.now());
            return mapDraftResponse(draftRepository.save(draft));
        }

        draft.setVehicleName(request.getResolvedVehicleName());
        populateDraftFields(draft, request);
        VehicleRegistrationDraft updated = draftRepository.save(draft);
        return mapDraftResponse(updated);
    }

    @Transactional
    public void deleteDraft(UUID draftId, UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }
        VehicleRegistrationDraft draft = draftRepository.findById(draftId)
                .orElseThrow(() -> new ResourceNotFoundException("Bản nháp không tồn tại hoặc đã được xóa."));

        if (!draft.getUserId().equals(principal.getId())) {
            throw new AccessDeniedException("Bạn không có quyền xóa bản nháp của người dùng khác.");
        }

        if (draft.getCreatedVehicleId() != null || draft.getCreatedGroupId() != null) {
            throw new IllegalStateException("Không thể xóa hồ sơ đã gắn với xe hoặc nhóm đồng sở hữu đang hoạt động.");
        }

        DraftStatus currentStatus = draft.getStatus() != null ? draft.getStatus() : DraftStatus.DRAFT;
        if (currentStatus == DraftStatus.SUBMITTED || currentStatus == DraftStatus.UNDER_REVIEW) {
            throw new IllegalStateException("Không thể xóa hồ sơ đã gửi và đang chờ nhân viên xét duyệt.");
        }
        if (currentStatus == DraftStatus.APPROVED) {
            throw new IllegalStateException("Không thể xóa hồ sơ đăng ký xe đã được phê duyệt.");
        }
        if (currentStatus == DraftStatus.REJECTED) {
            throw new IllegalStateException("Không thể xóa hồ sơ đăng ký xe đã có quyết định từ chối.");
        }
        if (currentStatus != DraftStatus.DRAFT) {
            throw new IllegalStateException("Chỉ có thể xóa bản nháp chưa gửi xét duyệt.");
        }

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
        String resolvedModel = request.model() != null && !request.model().isBlank()
                ? request.model().trim()
                : request.getResolvedVehicleName();
        String resolvedManufacturer = request.manufacturer() != null && !request.manufacturer().isBlank()
                ? request.manufacturer().trim()
                : resolveBrandFromModelName(resolvedModel);

        draft.setManufacturer(resolvedManufacturer);
        draft.setModel(resolvedModel);
        draft.setModelYear(request.modelYear() != null ? request.modelYear() : 2025);
        if (request.licensePlate() != null) {
            draft.setLicensePlate(normalizeLicensePlate(request.licensePlate()));
        }
        if (request.vin() != null) {
            draft.setVin(normalizeVin(request.vin()));
        }
        draft.setBatteryCapacity(request.batteryCapacity());
        draft.setBatteryType(request.batteryType());
        if (request.exteriorColor() != null && !request.exteriorColor().isBlank()) {
            draft.setExteriorColor(sanitizeExteriorColor(request.exteriorColor()));
        }
        if (request.vehicleValue() != null && request.vehicleValue().compareTo(BigDecimal.ZERO) > 0) {
            draft.setVehicleValue(request.vehicleValue());
        }
        if (request.registrationCity() != null && !request.registrationCity().isBlank()) {
            draft.setRegistrationCity(request.registrationCity().trim());
        }
        if (request.model3dUrl() != null && !request.model3dUrl().isBlank()) {
            draft.setModel3dUrl(request.model3dUrl().trim());
        } else {
            draft.setModel3dUrl(resolveModel3dUrl(resolvedModel));
        }

        String resolvedGroupName = request.groupName() != null && !request.groupName().isBlank()
                ? request.groupName().trim()
                : ("Nhóm Đồng Sở Hữu " + resolvedModel);
        draft.setGroupName(resolvedGroupName);

        if (request.monthlyFundContribution() != null) {
            draft.setMonthlyFundContribution(request.monthlyFundContribution());
        }
        if (request.latePaymentFeeRate() != null) {
            draft.setLatePaymentFeeRate(request.latePaymentFeeRate());
        }
        if (request.maintenanceReserveRate() != null) {
            draft.setMaintenanceReserveRate(request.maintenanceReserveRate());
        }
        if (request.maxConsecutiveBookingDays() != null) {
            draft.setMaxConsecutiveBookingDays(request.maxConsecutiveBookingDays());
        }
        if (request.currentStep() != null) {
            draft.setCurrentStep(request.currentStep());
        }
        if (request.votingRule() != null)
            draft.setVotingRule(request.votingRule());
        if (request.quorumPercentage() != null)
            draft.setQuorumPercentage(request.quorumPercentage());
        if (request.approvalThresholdPercentage() != null)
            draft.setApprovalThresholdPercentage(request.approvalThresholdPercentage());
        draft.setProposedCoOwners(request.proposedCoOwners());
    }

    // ==========================================
    // 3. Submit Registration (Enter Staff Review Queue)
    // ==========================================

    @Transactional
    public VehicleRegistrationDraftResponse submitRegistration(UUID draftId, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để nộp hồ sơ xe.");
        }
        VehicleRegistrationDraft draft = draftRepository.findByIdAndUserId(draftId, principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ đăng ký không tồn tại hoặc bạn không có quyền truy cập: " + draftId));

        // Idempotent retry: if the same authenticated user retries submitting the exact same application ID
        // while it is already SUBMITTED or UNDER_REVIEW, validate its current plate/VIN uniqueness first.
        if (draft.getStatus() == DraftStatus.SUBMITTED || draft.getStatus() == DraftStatus.UNDER_REVIEW) {
            String currentPlate = normalizeLicensePlate(draft.getLicensePlate());
            String currentVin = normalizeVin(draft.getVin());
            validateVehicleIdentityUniqueness(currentPlate, currentVin, draft.getId(), principal.getId());
            return mapDraftResponse(draft);
        }
        if (draft.getStatus() == DraftStatus.APPROVED) {
            throw new IllegalStateException("Hồ sơ này đã được phê duyệt trước đó.");
        }

        User creator = principal.getUser();

        // 1. Validate required fields
        String normalizedPlate = normalizeLicensePlate(draft.getLicensePlate());
        if (normalizedPlate == null || normalizedPlate.isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập biển số xe hợp lệ.");
        }
        String normalizedVin = normalizeVin(draft.getVin());
        if (normalizedVin == null || normalizedVin.isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập số khung (VIN) hợp lệ.");
        }
        String vName = draft.getModel() != null && !draft.getModel().isBlank()
                ? draft.getModel().trim()
                : (draft.getVehicleName() != null && !draft.getVehicleName().isBlank() ? draft.getVehicleName().trim() : "Xe điện EVShare");
        if (draft.getBatteryCapacity() == null || draft.getBatteryCapacity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Dung lượng pin phải lớn hơn 0 kWh.");
        }

        // 1b. If an auto-generated default VIN ("VF8VN2026888999" or a plate-derived prefix from a previous plate edit)
        // was left unchanged when the user changed the license plate, re-derive a clean plate-scoped VIN.
        String cleanPlateAlnum = normalizedPlate.replaceAll("[^A-Z0-9]", "");
        boolean isAutoGeneratedVinPattern = "VF8VN2026888999".equalsIgnoreCase(normalizedVin)
                || (normalizedVin.matches("^(HYU|TSL|VFS|EVS)VN2026[A-Z0-9]+$") && !normalizedVin.contains(cleanPlateAlnum));
        if (isAutoGeneratedVinPattern) {
            boolean vinTaken = vehicleRepository.existsByVinIgnoreCase(normalizedVin)
                    || draftRepository.existsByVinIgnoreCaseAndStatusInAndIdNot(
                            normalizedVin, ACTIVE_APPLICATION_STATUSES, draft.getId());
            if (vinTaken || !normalizedVin.contains(cleanPlateAlnum)) {
                normalizedVin = derivePlateScopedVin(normalizedPlate, vName);
                draft.setVin(normalizedVin);
            }
        }

        // 1c. Same-applicant pending application check:
        // If this user already has a pending (SUBMITTED / UNDER_REVIEW) application for the same license plate,
        // merge/sync the latest registration details into that pending application and return it idempotently
        // instead of throwing a false-positive duplicate plate error against the user's own application.
        List<VehicleRegistrationDraft> userDrafts = draftRepository.findByUserIdOrderByUpdatedAtDesc(principal.getId());
        for (VehicleRegistrationDraft existing : userDrafts) {
            if (!existing.getId().equals(draft.getId())
                    && (existing.getStatus() == DraftStatus.SUBMITTED || existing.getStatus() == DraftStatus.UNDER_REVIEW)) {
                String existingPlate = normalizeLicensePlate(existing.getLicensePlate());
                if (normalizedPlate.equalsIgnoreCase(existingPlate)
                        || isSameLogicalSubmission(existing, principal.getId(), normalizedPlate, normalizedVin, vName)) {
                    syncDraftIntoExistingApplication(draft, existing, vName, normalizedPlate, normalizedVin);
                    draftRepository.delete(draft);
                    draftRepository.flush();
                    VehicleRegistrationDraft synced = draftRepository.saveAndFlush(existing);
                    return mapDraftResponse(synced);
                }
            }
        }

        // 2. Validate License Plate & VIN uniqueness against operational vehicles and other applicants' pending submissions
        validateVehicleIdentityUniqueness(normalizedPlate, normalizedVin, draft.getId(), principal.getId());

        // 3. Validate proposed co-owners & share allocation (must sum to 100%)
        List<Map<String, Object>> proposedCoOwners = parseProposedCoOwners(draft.getProposedCoOwners());
        if (!proposedCoOwners.isEmpty()) {
            BigDecimal sum = BigDecimal.ZERO;
            for (Map<String, Object> coOwner : proposedCoOwners) {
                Object pctObj = coOwner.get("percentage") != null ? coOwner.get("percentage") : coOwner.get("sharePercentage");
                BigDecimal pct = pctObj != null ? new BigDecimal(pctObj.toString()) : BigDecimal.ZERO;
                if (pct.compareTo(BigDecimal.ZERO) <= 0) {
                    throw new IllegalArgumentException("Tỷ lệ cổ phần của mỗi thành viên phải lớn hơn 0%.");
                }
                sum = sum.add(pct);
            }
            if (sum.subtract(new BigDecimal("100.00")).abs().compareTo(new BigDecimal("0.01")) > 0) {
                throw new IllegalArgumentException("Tổng tỷ lệ sở hữu của tất cả thành viên phải bằng đúng 100%.");
            }
        }

        // 4. Ensure consistent Group Name (never stale VF8 when another model is selected)
        String gName = draft.getGroupName();
        if (gName == null || gName.isBlank()
                || (gName.equalsIgnoreCase("Nhóm Đồng Sở Hữu VF8") && !vName.toLowerCase().contains("vf8"))) {
            gName = "Nhóm Đồng Sở Hữu " + vName;
            draft.setGroupName(gName);
        }

        draft.setVehicleName(vName);
        draft.setManufacturer(draft.getManufacturer() != null && !draft.getManufacturer().isBlank()
                ? draft.getManufacturer().trim()
                : resolveBrandFromModelName(vName));
        draft.setLicensePlate(normalizedPlate);
        draft.setVin(normalizedVin);
        if (draft.getModel3dUrl() == null || draft.getModel3dUrl().isBlank()) {
            draft.setModel3dUrl(resolveModel3dUrl(vName));
        }

        // 5. Transition application to SUBMITTED (Pending Staff Review) — DO NOT create active Vehicle yet
        draft.setStatus(DraftStatus.SUBMITTED);
        draft.setSubmittedAt(Instant.now());
        draft.setReviewDecision("PENDING_REVIEW");
        draft.setReviewReason(null);

        VehicleRegistrationDraft savedDraft = draftRepository.saveAndFlush(draft);

        final UUID appId = savedDraft.getId();
        final UUID applicantId = creator.getId();
        final String applicantName = creator.getFullName();
        final String finalVehicleName = vName;
        final String finalPlate = normalizedPlate;
        final String finalGroupName = gName;

        // 6. Dispatch notifications after transaction commits
        runAfterCommit(() -> {
            notificationService.sendNotification(
                    applicantId,
                    null,
                    null,
                    "VEHICLE_REGISTRATION_APPLICATION",
                    appId,
                    "REGISTRATION_SUBMITTED",
                    "Hồ sơ đăng ký xe đang chờ xét duyệt",
                    "Hồ sơ đăng ký xe " + finalVehicleName + " (Biển số: " + finalPlate + ") cho nhóm \""
                            + finalGroupName + "\" đã được gửi và đang chờ nhân viên xét duyệt.",
                    "INFO");

            List<User> staffUsers = userRepository.findAll().stream()
                    .filter(u -> (u.getRole() == Role.STAFF || u.getRole() == Role.ADMIN) && u.getStatus() == UserStatus.ACTIVE)
                    .toList();
            for (User staff : staffUsers) {
                notificationService.sendNotification(
                        staff.getId(),
                        null,
                        null,
                        "VEHICLE_REGISTRATION_APPLICATION",
                        appId,
                        "STAFF_REGISTRATION_REVIEW_REQUIRED",
                        "Hồ sơ đăng ký xe mới chờ duyệt",
                        applicantName + " đã gửi hồ sơ đăng ký xe " + finalVehicleName + " (Biển số: " + finalPlate
                                + ", Nhóm: " + finalGroupName + ") cần xét duyệt.",
                        "WARNING");
            }
        });

        return mapDraftResponse(savedDraft);
    }

    // ==========================================
    // 3.1 Staff Review & Approval Workflow
    // ==========================================

    @Transactional(readOnly = true)
    public List<VehicleRegistrationDraftResponse> getStaffApplications(String statusFilter, UserPrincipal principal) {
        ensureStaffOrAdmin(principal);

        List<VehicleRegistrationDraft> list;
        if (statusFilter == null || statusFilter.isBlank() || statusFilter.equalsIgnoreCase("ALL")) {
            list = draftRepository.findByStatusNotOrderByUpdatedAtDesc(DraftStatus.DRAFT);
        } else if (statusFilter.equalsIgnoreCase("PENDING")) {
            list = draftRepository.findByStatusInOrderByUpdatedAtDesc(
                    List.of(DraftStatus.SUBMITTED, DraftStatus.UNDER_REVIEW));
        } else {
            try {
                DraftStatus ds = DraftStatus.valueOf(statusFilter.trim().toUpperCase());
                list = draftRepository.findByStatusInOrderByUpdatedAtDesc(List.of(ds));
            } catch (IllegalArgumentException ex) {
                list = draftRepository.findByStatusNotOrderByUpdatedAtDesc(DraftStatus.DRAFT);
            }
        }

        return list.stream()
                .map(this::mapDraftResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VehicleRegistrationDraftResponse getStaffApplicationById(UUID applicationId, UserPrincipal principal) {
        ensureStaffOrAdmin(principal);
        VehicleRegistrationDraft draft = draftRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ đăng ký không tồn tại: " + applicationId));
        return mapDraftResponse(draft);
    }

    @Transactional
    public VehicleRegistrationDraftResponse reviewVehicleRegistration(
            UUID applicationId,
            ReviewVehicleRegistrationRequest request,
            UserPrincipal principal) {
        ensureStaffOrAdmin(principal);

        VehicleRegistrationDraft draft = draftRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ đăng ký không tồn tại: " + applicationId));

        if (draft.getUserId().equals(principal.getId())) {
            throw new AccessDeniedException("Người nộp hồ sơ không được phép tự xét duyệt hồ sơ của chính mình.");
        }

        if (draft.getStatus() == DraftStatus.APPROVED) {
            throw new IllegalStateException("Hồ sơ đăng ký này đã được phê duyệt trước đó.");
        }
        if (draft.getStatus() != DraftStatus.SUBMITTED && draft.getStatus() != DraftStatus.UNDER_REVIEW) {
            throw new IllegalStateException("Chỉ có thể xét duyệt hồ sơ đang ở trạng thái chờ duyệt (Trạng thái hiện tại: " + draft.getStatus() + ").");
        }

        String rawDecision = request.decision() != null ? request.decision().trim().toUpperCase() : "";
        String reason = request.reason() != null ? request.reason().trim() : "";

        if (rawDecision.equals("APPROVE") || rawDecision.equals("APPROVED")) {
            return approveVehicleRegistrationApplication(draft, reason, principal);
        } else if (rawDecision.equals("REJECT") || rawDecision.equals("REJECTED")) {
            if (reason.isBlank()) {
                throw new IllegalArgumentException("Vui lòng nhập lý do từ chối hồ sơ đăng ký xe.");
            }
            draft.setStatus(DraftStatus.REJECTED);
            draft.setReviewedBy(principal.getId());
            draft.setReviewedAt(Instant.now());
            draft.setReviewDecision("REJECTED");
            draft.setReviewReason(reason);
            VehicleRegistrationDraft saved = draftRepository.saveAndFlush(draft);

            final UUID appId = saved.getId();
            final UUID applicantId = saved.getUserId();
            final String vName = saved.getModel() != null ? saved.getModel() : saved.getVehicleName();
            final String plate = saved.getLicensePlate();
            final String finalReason = reason;

            runAfterCommit(() -> notificationService.sendNotification(
                    applicantId,
                    null,
                    null,
                    "VEHICLE_REGISTRATION_APPLICATION",
                    appId,
                    "REGISTRATION_REJECTED",
                    "Hồ sơ đăng ký xe bị từ chối",
                    "Hồ sơ đăng ký xe " + vName + " (Biển số: " + plate + ") đã bị từ chối. Lý do: " + finalReason,
                    "ERROR"));

            return mapDraftResponse(saved);
        } else if (rawDecision.equals("REQUEST_CHANGES") || rawDecision.equals("CHANGES_REQUESTED")) {
            if (reason.isBlank()) {
                throw new IllegalArgumentException("Vui lòng nhập nội dung yêu cầu chỉnh sửa hoặc bổ sung hồ sơ.");
            }
            draft.setStatus(DraftStatus.CHANGES_REQUESTED);
            draft.setReviewedBy(principal.getId());
            draft.setReviewedAt(Instant.now());
            draft.setReviewDecision("CHANGES_REQUESTED");
            draft.setReviewReason(reason);
            VehicleRegistrationDraft saved = draftRepository.saveAndFlush(draft);

            final UUID appId = saved.getId();
            final UUID applicantId = saved.getUserId();
            final String vName = saved.getModel() != null ? saved.getModel() : saved.getVehicleName();
            final String plate = saved.getLicensePlate();
            final String finalReason = reason;

            runAfterCommit(() -> notificationService.sendNotification(
                    applicantId,
                    null,
                    null,
                    "VEHICLE_REGISTRATION_APPLICATION",
                    appId,
                    "REGISTRATION_CHANGES_REQUESTED",
                    "Yêu cầu bổ sung / chỉnh sửa hồ sơ đăng ký xe",
                    "Nhân viên vận hành yêu cầu bổ sung/chỉnh sửa hồ sơ xe " + vName + " (Biển số: " + plate
                            + "). Nội dung: " + finalReason,
                    "WARNING"));

            return mapDraftResponse(saved);
        } else {
            throw new IllegalArgumentException("Quyết định xét duyệt không hợp lệ: " + rawDecision);
        }
    }

    private VehicleRegistrationDraftResponse approveVehicleRegistrationApplication(
            VehicleRegistrationDraft draft,
            String reason,
            UserPrincipal staffPrincipal) {

        User creator = userRepository.findById(draft.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người nộp hồ sơ: " + draft.getUserId()));

        String licPlate = normalizeLicensePlate(draft.getLicensePlate());
        if (licPlate == null || licPlate.isBlank()) {
            throw new IllegalArgumentException("Biển số xe trong hồ sơ không hợp lệ.");
        }
        String vin = normalizeVin(draft.getVin());
        if (vin == null || vin.isBlank()) {
            throw new IllegalArgumentException("Số khung VIN trong hồ sơ không hợp lệ.");
        }

        // Recheck vehicle identity uniqueness before approval
        validateVehicleIdentityUniqueness(licPlate, vin, draft.getId());

        String vName = draft.getModel() != null && !draft.getModel().isBlank()
                ? draft.getModel().trim()
                : (draft.getVehicleName() != null && !draft.getVehicleName().isBlank() ? draft.getVehicleName().trim() : "Xe điện EVShare");
        String brand = draft.getManufacturer() != null && !draft.getManufacturer().isBlank()
                ? draft.getManufacturer().trim()
                : resolveBrandFromModelName(vName);
        String modelName = draft.getModel() != null && !draft.getModel().isBlank() ? draft.getModel().trim() : vName;
        BigDecimal capacity = draft.getBatteryCapacity() != null && draft.getBatteryCapacity().compareTo(BigDecimal.ZERO) > 0
                ? draft.getBatteryCapacity()
                : new BigDecimal("75.00");
        String model3dUrl = draft.getModel3dUrl() != null && !draft.getModel3dUrl().isBlank()
                ? draft.getModel3dUrl().trim()
                : resolveModel3dUrl(modelName);

        // 1. Create and immediately flush Vehicle inside race-condition-safe try/catch
        Vehicle vehicle = new Vehicle();
        vehicle.setId(UUID.randomUUID());
        vehicle.setName(vName);
        vehicle.setBrand(brand);
        vehicle.setModel(modelName);
        vehicle.setYear(draft.getModelYear() != null ? draft.getModelYear() : 2025);
        vehicle.setLicensePlate(licPlate);
        vehicle.setVin(vin);
        vehicle.setBatteryCapacity(capacity);
        vehicle.setCurrentBatteryLevel(100);
        vehicle.setOdometer(BigDecimal.ZERO);
        vehicle.setStatus(VehicleStatus.AVAILABLE);
        vehicle.setModel3dUrl(model3dUrl);
        vehicle.setExteriorColor(draft.getExteriorColor() != null && !draft.getExteriorColor().isBlank()
                ? draft.getExteriorColor()
                : "Trắng ngọc trai");

        Vehicle savedVehicle;
        try {
            savedVehicle = vehicleRepository.saveAndFlush(vehicle);
        } catch (DataIntegrityViolationException ex) {
            String raw = ex.getMostSpecificCause() != null && ex.getMostSpecificCause().getMessage() != null
                    ? ex.getMostSpecificCause().getMessage().toLowerCase()
                    : "";
            if (raw.contains("vin")) {
                throw new DuplicateResourceException("Số khung VIN " + vin + " đã được đăng ký trong hệ thống. Không thể phê duyệt hồ sơ trùng lặp.");
            }
            throw new DuplicateResourceException("Biển số " + licPlate + " đã được đăng ký trong hệ thống. Vui lòng kiểm tra và nhập biển số khác.");
        }

        // 2. Create CoOwnershipGroup Entity with finalized group name
        String gName = draft.getGroupName() != null && !draft.getGroupName().isBlank()
                ? draft.getGroupName().trim()
                : ("Nhóm Đồng Sở Hữu " + vName);

        CoOwnershipGroup group = new CoOwnershipGroup(UUID.randomUUID(), savedVehicle.getId(), gName);
        group.setCreatedBy(creator.getId());
        if (draft.getVotingRule() != null)
            group.setVotingRule(draft.getVotingRule());
        if (draft.getQuorumPercentage() != null)
            group.setQuorumPercentage(draft.getQuorumPercentage());
        if (draft.getApprovalThresholdPercentage() != null)
            group.setApprovalThresholdPercentage(draft.getApprovalThresholdPercentage());
        CoOwnershipGroup savedGroup = groupRepository.saveAndFlush(group);

        // 3. Link Group & Vehicle
        GroupVehicle gv = new GroupVehicle(UUID.randomUUID(), savedGroup, savedVehicle, GroupVehicleStatus.ACTIVE);
        groupVehicleRepository.saveAndFlush(gv);

        // 4. Add Creator as ACTIVE Group Representative
        GroupMember creatorMember = new GroupMember(
                UUID.randomUUID(),
                savedGroup,
                creator,
                GroupMemberRole.REPRESENTATIVE,
                MemberStatus.ACTIVE);
        GroupMember savedCreatorMember = memberRepository.saveAndFlush(creatorMember);

        // 5. Parse Proposed Co-Owners (distinguishing creator from invited co-owners)
        BigDecimal creatorPercentage = new BigDecimal("100.00");
        List<Map<String, Object>> proposedCoOwners = parseProposedCoOwners(draft.getProposedCoOwners());
        List<GroupInvitation> createdInvitations = new ArrayList<>();

        if (!proposedCoOwners.isEmpty()) {
            BigDecimal totalInvitedShare = BigDecimal.ZERO;

            for (int i = 0; i < proposedCoOwners.size(); i++) {
                Map<String, Object> coOwner = proposedCoOwners.get(i);
                String email = coOwner.get("email") != null ? coOwner.get("email").toString().trim() : "";
                String roleStr = coOwner.get("role") != null ? coOwner.get("role").toString().trim() : "";
                String userIdStr = coOwner.get("userId") != null ? coOwner.get("userId").toString().trim() : "";
                Object pctObj = coOwner.get("percentage") != null ? coOwner.get("percentage")
                        : coOwner.get("sharePercentage");
                BigDecimal percentage = pctObj != null ? new BigDecimal(pctObj.toString()) : BigDecimal.ZERO;

                boolean isCreatorEntry = (i == 0 && "REPRESENTATIVE".equalsIgnoreCase(roleStr))
                        || (!userIdStr.isEmpty() && userIdStr.equalsIgnoreCase(creator.getId().toString()))
                        || (!email.isEmpty() && email.equalsIgnoreCase(creator.getEmail()));

                if (isCreatorEntry) {
                    continue;
                }

                if (!email.isBlank() && percentage.compareTo(BigDecimal.ZERO) > 0) {
                    totalInvitedShare = totalInvitedShare.add(percentage);

                    String inviteCode = generateInviteCode();
                    Instant expiresAt = Instant.now().plus(14, ChronoUnit.DAYS);

                    Optional<User> recipientUser = Optional.empty();
                    if (!userIdStr.isEmpty()) {
                        try {
                            recipientUser = userRepository.findById(UUID.fromString(userIdStr));
                        } catch (Exception ignored) {
                        }
                    }
                    if (recipientUser.isEmpty()) {
                        recipientUser = userRepository.findByEmail(email);
                    }

                    GroupInvitation invitation = new GroupInvitation(
                            UUID.randomUUID(),
                            savedGroup.getId(),
                            creator.getId(),
                            email,
                            recipientUser.map(User::getId).orElse(null),
                            percentage,
                            inviteCode,
                            expiresAt);
                    createdInvitations.add(invitationRepository.save(invitation));
                }
            }

            creatorPercentage = new BigDecimal("100.00").subtract(totalInvitedShare);
            if (creatorPercentage.compareTo(BigDecimal.ZERO) <= 0) {
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
        shareRepository.saveAndFlush(creatorShare);

        // 7. Make Group Discoverable by default
        GroupDiscoverySetting discovery = new GroupDiscoverySetting(
                savedGroup.getId(),
                true,
                3,
                modelName);
        discovery.setPublicTerms("Đồng sở hữu theo tỷ lệ vốn góp. Biểu quyết tự động theo trọng số sở hữu.");
        discovery.setJoinConditions("Yêu cầu cam kết tuân thủ quy tắc quản lý và thanh toán chi phí dùng xe đúng hạn.");
        discoveryRepository.saveAndFlush(discovery);

        // 8. Generate Authoritative Contract for Vehicle & Group referencing applicant as creator
        try {
            contractService.getContractSummaryByVehicle(savedVehicle.getId().toString(), new UserPrincipal(creator));
        } catch (Exception ignored) {
        }

        // 9. Update Draft Status with Reviewer Audit Metadata
        draft.setStatus(DraftStatus.APPROVED);
        draft.setReviewedBy(staffPrincipal.getId());
        draft.setReviewedAt(Instant.now());
        draft.setReviewDecision("APPROVED");
        draft.setReviewReason(reason != null && !reason.isBlank()
                ? reason
                : "Hồ sơ đăng ký hợp lệ. Đã phê duyệt phương tiện và kích hoạt nhóm đồng sở hữu.");
        draft.setCreatedVehicleId(savedVehicle.getId());
        draft.setCreatedGroupId(savedGroup.getId());
        VehicleRegistrationDraft savedDraft = draftRepository.saveAndFlush(draft);

        // 10. Dispatch notifications strictly after transaction commits
        final UUID applicantId = creator.getId();
        final UUID finalVehicleId = savedVehicle.getId();
        final UUID finalGroupId = savedGroup.getId();
        final String finalVName = vName;
        final String finalGroupName = gName;
        final List<GroupInvitation> finalInvitations = new ArrayList<>(createdInvitations);

        runAfterCommit(() -> {
            notificationService.sendNotification(
                    applicantId,
                    finalVehicleId,
                    finalGroupId,
                    "VEHICLE_REGISTRATION",
                    finalVehicleId,
                    "REGISTRATION_COMPLETED",
                    "Hồ sơ đăng ký xe đã được phê duyệt",
                    "Hồ sơ đăng ký xe " + finalVName + " (Biển số: " + licPlate + ") và nhóm \""
                            + finalGroupName + "\" đã được nhân viên phê duyệt thành công.",
                    "SUCCESS");

            for (GroupInvitation inv : finalInvitations) {
                if (inv.getInviteeUserId() != null) {
                    notificationService.sendNotification(
                            inv.getInviteeUserId(),
                            finalVehicleId,
                            finalGroupId,
                            "GROUP_INVITATION",
                            inv.getId(),
                            "INVITATION_RECEIVED",
                            "Lời mời tham gia nhóm xe " + finalVName,
                            "Bạn nhận được lời mời tham gia \"" + finalGroupName + "\" (" + finalVName
                                    + ") với tỷ lệ cổ phần đề xuất " + inv.getProposedPercentage()
                                    + "%. Vui lòng xem xét và ký xác nhận hợp đồng điện tử để kích hoạt quyền đồng sở hữu.",
                            "INFO");
                }
            }
        });

        return mapDraftResponse(savedDraft);
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
            String vModel = resolveVehicleModelLabel(v);
            String vPlate = v != null ? v.getLicensePlate() : "";
            BigDecimal estVal = resolveGroupVehicleValuation(grp, v);
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

        BigDecimal estVal = resolveGroupVehicleValuation(group, vehicle);
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
                resolveVehicleModelLabel(vehicle),
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
        String vModel = resolveVehicleModelLabel(vehicle);
        String vPlate = vehicle != null ? vehicle.getLicensePlate() : "";
        BigDecimal estVal = resolveGroupVehicleValuation(group, vehicle);
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

            final UUID inviterId = inv.getInviterId();
            final UUID groupVehicleId = group.getVehicleId();
            final UUID groupId = group.getId();
            final UUID invId = inv.getId();
            final String acceptorName = principal.getUser().getFullName();
            final String groupName = group.getName();
            runAfterCommit(() -> {
                try {
                    notificationService.sendNotification(
                            inviterId,
                            groupVehicleId,
                            groupId,
                            "GROUP_INVITATION",
                            invId,
                            "INVITATION_ACCEPTED",
                            "Lời mời đã được chấp nhận",
                            acceptorName + " đã ký hợp đồng và đồng ý tham gia nhóm " + groupName + ".",
                            "SUCCESS");
                } catch (Exception ignored) {
                }
            });
        } else {
            inv.setStatus(InvitationStatus.DECLINED);
        }

        GroupInvitation saved = invitationRepository.save(inv);
        String inviterName = userRepository.findById(inv.getInviterId()).map(User::getFullName).orElse("");
        Vehicle vehicle = resolveGroupVehicle(group);
        String vModel = resolveVehicleModelLabel(vehicle);
        String vPlate = vehicle != null ? vehicle.getLicensePlate() : "";
        BigDecimal estVal = resolveGroupVehicleValuation(group, vehicle);
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

    private void ensureStaffOrAdmin(UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }
        Role role = principal.getUser().getRole();
        if (role != Role.STAFF && role != Role.ADMIN) {
            throw new AccessDeniedException("Chỉ Nhân viên vận hành (STAFF) hoặc Quản trị viên (ADMIN) mới có quyền xét duyệt hồ sơ đăng ký xe.");
        }
    }

    private boolean isSameLogicalSubmission(
            VehicleRegistrationDraft existing,
            UUID userId,
            String normalizedPlate,
            String normalizedVin,
            String resolvedModel) {
        if (existing == null || userId == null || !userId.equals(existing.getUserId())) {
            return false;
        }
        if (normalizedPlate == null || normalizedVin == null || resolvedModel == null) {
            return false;
        }
        String existingPlate = normalizeLicensePlate(existing.getLicensePlate());
        String existingVin = normalizeVin(existing.getVin());
        String existingModel = existing.getModel() != null ? existing.getModel().trim() : existing.getVehicleName();
        return normalizedPlate.equalsIgnoreCase(existingPlate)
                && normalizedVin.equalsIgnoreCase(existingVin)
                && resolvedModel.equalsIgnoreCase(existingModel != null ? existingModel.trim() : "");
    }

    private void syncDraftIntoExistingApplication(
            VehicleRegistrationDraft source,
            VehicleRegistrationDraft target,
            String resolvedVehicleName,
            String normalizedPlate,
            String normalizedVin) {
        target.setVehicleName(resolvedVehicleName);
        target.setModel(source.getModel() != null && !source.getModel().isBlank() ? source.getModel().trim() : resolvedVehicleName);
        target.setManufacturer(source.getManufacturer() != null && !source.getManufacturer().isBlank()
                ? source.getManufacturer().trim()
                : resolveBrandFromModelName(resolvedVehicleName));
        if (source.getModelYear() != null) {
            target.setModelYear(source.getModelYear());
        }
        target.setLicensePlate(normalizedPlate);
        if (normalizedVin != null && !normalizedVin.isBlank()
                && !vehicleRepository.existsByVinIgnoreCase(normalizedVin)
                && !draftRepository.existsByVinIgnoreCaseAndStatusInAndIdNot(normalizedVin, ACTIVE_APPLICATION_STATUSES, target.getId())) {
            target.setVin(normalizedVin);
        }
        if (source.getBatteryCapacity() != null) {
            target.setBatteryCapacity(source.getBatteryCapacity());
        }
        if (source.getBatteryType() != null) {
            target.setBatteryType(source.getBatteryType());
        }
        if (source.getExteriorColor() != null && !source.getExteriorColor().isBlank()) {
            target.setExteriorColor(source.getExteriorColor());
        }
        if (source.getVehicleValue() != null) {
            target.setVehicleValue(source.getVehicleValue());
        }
        if (source.getRegistrationCity() != null && !source.getRegistrationCity().isBlank()) {
            target.setRegistrationCity(source.getRegistrationCity());
        }
        target.setModel3dUrl(source.getModel3dUrl() != null && !source.getModel3dUrl().isBlank()
                ? source.getModel3dUrl().trim()
                : resolveModel3dUrl(resolvedVehicleName));
        String gName = source.getGroupName();
        if (gName == null || gName.isBlank()
                || (gName.equalsIgnoreCase("Nhóm Đồng Sở Hữu VF8") && !resolvedVehicleName.toLowerCase().contains("vf8"))) {
            gName = "Nhóm Đồng Sở Hữu " + resolvedVehicleName;
        }
        target.setGroupName(gName);
        if (source.getMonthlyFundContribution() != null) {
            target.setMonthlyFundContribution(source.getMonthlyFundContribution());
        }
        if (source.getLatePaymentFeeRate() != null) {
            target.setLatePaymentFeeRate(source.getLatePaymentFeeRate());
        }
        if (source.getMaintenanceReserveRate() != null) {
            target.setMaintenanceReserveRate(source.getMaintenanceReserveRate());
        }
        if (source.getMaxConsecutiveBookingDays() != null) {
            target.setMaxConsecutiveBookingDays(source.getMaxConsecutiveBookingDays());
        }
        if (source.getVotingRule() != null) {
            target.setVotingRule(source.getVotingRule());
        }
        if (source.getQuorumPercentage() != null) {
            target.setQuorumPercentage(source.getQuorumPercentage());
        }
        if (source.getApprovalThresholdPercentage() != null) {
            target.setApprovalThresholdPercentage(source.getApprovalThresholdPercentage());
        }
        if (source.getProposedCoOwners() != null && !source.getProposedCoOwners().isBlank()) {
            target.setProposedCoOwners(source.getProposedCoOwners());
        }
    }

    private String derivePlateScopedVin(String normalizedPlate, String modelName) {
        String prefix = "EVS";
        if (modelName != null) {
            String lower = modelName.toLowerCase();
            if (lower.contains("hyundai") || lower.contains("mistra") || lower.contains("kona")) {
                prefix = "HYU";
            } else if (lower.contains("tesla")) {
                prefix = "TSL";
            } else if (lower.contains("vinfast") || lower.contains("vf")) {
                prefix = "VFS";
            }
        }
        String cleanPlate = normalizedPlate != null
                ? normalizedPlate.replaceAll("[^A-Z0-9]", "")
                : "000000";
        String candidate = (prefix + "VN2026" + cleanPlate + "9999999999").substring(0, 17);
        if (!vehicleRepository.existsByVinIgnoreCase(candidate)
                && !draftRepository.existsByVinIgnoreCaseAndStatusInAndIdNot(candidate, ACTIVE_APPLICATION_STATUSES, new UUID(0L, 0L))) {
            return candidate;
        }
        String randomSuffix = String.valueOf(Math.abs(UUID.randomUUID().getMostSignificantBits())).substring(0, 6);
        return (prefix + cleanPlate + randomSuffix + "8888888888").substring(0, 17);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> validateLicensePlateAvailability(
            String rawPlate,
            UUID currentDraftId,
            UserPrincipal principal) {
        String normalizedPlate = normalizeLicensePlate(rawPlate);
        Map<String, Object> result = new HashMap<>();
        result.put("normalizedPlate", normalizedPlate != null ? normalizedPlate : "");

        if (normalizedPlate == null || normalizedPlate.length() < 5) {
            result.put("available", false);
            result.put("code", "INVALID_PLATE");
            result.put("message", "Vui lòng nhập biển số xe hợp lệ.");
            return result;
        }

        UUID currentUserId = principal != null ? principal.getId() : null;
        UUID excludeId = currentDraftId != null ? currentDraftId : new UUID(0L, 0L);

        Optional<Vehicle> existingVehicleOpt = vehicleRepository.findByLicensePlateIgnoreCase(normalizedPlate);
        if (existingVehicleOpt.isPresent()) {
            Vehicle existingVehicle = existingVehicleOpt.get();
            String existingVehicleLabel = resolveVehicleModelLabel(existingVehicle);
            result.put("available", false);
            result.put("code", "LICENSE_PLATE_EXISTS");
            result.put("message", "Biển số xe đã được đăng ký trong hệ thống.");
            result.put("detailMessage", "Biển số " + normalizedPlate + " đã thuộc về phương tiện đang hoạt động trong hệ thống ("
                    + existingVehicleLabel + ").");
            return result;
        }

        boolean existsInOtherApplicantPending = currentUserId != null
                ? draftRepository.existsByLicensePlateIgnoreCaseAndStatusInAndUserIdNot(
                        normalizedPlate, ACTIVE_APPLICATION_STATUSES, currentUserId)
                : draftRepository.existsByLicensePlateIgnoreCaseAndStatusInAndIdNot(
                        normalizedPlate, ACTIVE_APPLICATION_STATUSES, excludeId);

        if (existsInOtherApplicantPending) {
            result.put("available", false);
            result.put("code", "LICENSE_PLATE_EXISTS");
            result.put("message", "Biển số xe đã được đăng ký trong hệ thống.");
            result.put("detailMessage", "Biển số " + normalizedPlate + " đang nằm trong một hồ sơ chờ xét duyệt của người dùng khác.");
            return result;
        }

        boolean ownPendingApplication = false;
        if (currentUserId != null) {
            List<VehicleRegistrationDraft> userDrafts = draftRepository.findByUserIdOrderByUpdatedAtDesc(currentUserId);
            for (VehicleRegistrationDraft d : userDrafts) {
                if (normalizedPlate.equalsIgnoreCase(normalizeLicensePlate(d.getLicensePlate()))
                        && (d.getStatus() == DraftStatus.SUBMITTED || d.getStatus() == DraftStatus.UNDER_REVIEW)) {
                    ownPendingApplication = true;
                    break;
                }
            }
        }

        result.put("available", true);
        result.put("code", "AVAILABLE");
        result.put("ownPendingApplication", ownPendingApplication);
        result.put("message", "Biển số hợp lệ để tiếp tục.");
        return result;
    }

    private void validateVehicleIdentityUniqueness(String normalizedPlate, String normalizedVin, UUID currentDraftId) {
        validateVehicleIdentityUniqueness(normalizedPlate, normalizedVin, currentDraftId, null);
    }

    private void validateVehicleIdentityUniqueness(
            String normalizedPlate,
            String normalizedVin,
            UUID currentDraftId,
            UUID currentUserId) {
        UUID excludeId = currentDraftId != null ? currentDraftId : new UUID(0L, 0L);

        if (normalizedPlate != null && !normalizedPlate.isBlank()) {
            Optional<Vehicle> existingVehicleOpt = vehicleRepository.findByLicensePlateIgnoreCase(normalizedPlate);
            if (existingVehicleOpt.isPresent()) {
                throw new DuplicateResourceException(
                        "LICENSE_PLATE_EXISTS",
                        "Biển số xe đã được đăng ký trong hệ thống.");
            }
            if (currentUserId != null) {
                if (draftRepository.existsByLicensePlateIgnoreCaseAndStatusInAndUserIdNot(
                        normalizedPlate, ACTIVE_APPLICATION_STATUSES, currentUserId)) {
                    throw new DuplicateResourceException(
                            "LICENSE_PLATE_EXISTS",
                            "Biển số xe đã được đăng ký trong hệ thống.");
                }
            } else if (draftRepository.existsByLicensePlateIgnoreCaseAndStatusInAndIdNot(
                    normalizedPlate, ACTIVE_APPLICATION_STATUSES, excludeId)) {
                throw new DuplicateResourceException(
                        "LICENSE_PLATE_EXISTS",
                        "Biển số xe đã được đăng ký trong hệ thống.");
            }
        }

        if (normalizedVin != null && !normalizedVin.isBlank()) {
            Optional<Vehicle> existingVinVehicleOpt = vehicleRepository.findByVinIgnoreCase(normalizedVin);
            if (existingVinVehicleOpt.isPresent()) {
                throw new DuplicateResourceException(
                        "VIN_EXISTS",
                        "Số khung (VIN) " + normalizedVin + " đã thuộc về một phương tiện đang hoạt động trong hệ thống. Vui lòng kiểm tra lại số VIN ở Bước 1.");
            }
            if (currentUserId != null) {
                if (draftRepository.existsByVinIgnoreCaseAndStatusInAndUserIdNot(
                        normalizedVin, ACTIVE_APPLICATION_STATUSES, currentUserId)) {
                    throw new DuplicateResourceException(
                            "VIN_EXISTS",
                            "Số khung (VIN) " + normalizedVin + " đang nằm trong một hồ sơ chờ xét duyệt của người dùng khác. Vui lòng kiểm tra lại số VIN ở Bước 1.");
                }
            } else if (draftRepository.existsByVinIgnoreCaseAndStatusInAndIdNot(
                    normalizedVin, ACTIVE_APPLICATION_STATUSES, excludeId)) {
                throw new DuplicateResourceException(
                        "VIN_EXISTS",
                        "Số khung (VIN) " + normalizedVin + " đang nằm trong một hồ sơ chờ xét duyệt khác trong hệ thống.");
            }
        }
    }

    private String normalizeLicensePlate(String raw) {
        if (raw == null) {
            return null;
        }
        String cleaned = raw.trim().toUpperCase().replaceAll("\\s+", "");
        return cleaned.isEmpty() ? null : cleaned;
    }

    private String normalizeVin(String raw) {
        if (raw == null) {
            return null;
        }
        String cleaned = raw.trim().toUpperCase().replaceAll("\\s+", "");
        return cleaned.isEmpty() ? null : cleaned;
    }

    private String resolveBrandFromModelName(String model) {
        if (model == null || model.isBlank()) {
            return "VinFast";
        }
        String lower = model.trim().toLowerCase();
        if (lower.contains("hyundai") || lower.contains("mistra") || lower.contains("kona") || lower.contains("ioniq")) {
            return "Hyundai";
        }
        if (lower.contains("tesla") || lower.contains("model y") || lower.contains("model 3") || lower.contains("cybertruck")) {
            return "Tesla";
        }
        if (lower.contains("vinfast") || lower.contains("vf")) {
            return "VinFast";
        }
        if (lower.contains("porsche") || lower.contains("taycan")) {
            return "Porsche";
        }
        if (lower.contains("audi") || lower.contains("e-tron")) {
            return "Audi";
        }
        if (lower.contains("bmw")) {
            return "BMW";
        }
        if (lower.contains("mercedes") || lower.contains("eq")) {
            return "Mercedes-Benz";
        }
        if (lower.contains("byd")) {
            return "BYD";
        }
        if (lower.contains("kia") || lower.contains("ev6") || lower.contains("ev9")) {
            return "KIA";
        }
        String[] parts = model.trim().split("\\s+");
        return parts.length > 0 ? parts[0] : "VinFast";
    }

    private String resolveModel3dUrl(String model) {
        if (model == null || model.isBlank()) {
            return "/models/11111111-1111-1111-1111-111111111101.glb";
        }
        String lower = model.trim().toLowerCase();
        if (lower.contains("mistra")) {
            return "/models/2021_hyundai_mistra_ev.glb";
        }
        if (lower.contains("kona")) {
            return "/models/2024_hyundai_kona_electric.glb";
        }
        if (lower.contains("model y")) {
            return "/models/tesla_2018_model_y.glb";
        }
        if (lower.contains("model 3")) {
            return "/models/tesla_2018_model_3.glb";
        }
        if (lower.contains("cybertruck")) {
            return "/models/tesla_cybertruck.glb";
        }
        if (lower.contains("roadster")) {
            return "/models/2023_tesla_roadster.glb";
        }
        if (lower.contains("vf3") || lower.contains("vf 3")) {
            return "/models/vinfast_vf3.glb";
        }
        if (lower.contains("vf9") || lower.contains("vf 9")) {
            return "/models/11111111-1111-1111-1111-111111111102.glb";
        }
        return "/models/11111111-1111-1111-1111-111111111101.glb";
    }

    private String resolveVehicleModelLabel(Vehicle v) {
        if (v == null) {
            return "VinFast VF8 Plus";
        }
        String brand = v.getBrand() != null ? v.getBrand().trim() : "";
        String model = v.getModel() != null ? v.getModel().trim() : "";
        if (model.isEmpty()) {
            return brand.isEmpty() ? "VinFast VF8 Plus" : brand;
        }
        if (brand.isEmpty() || model.toLowerCase().startsWith(brand.toLowerCase())) {
            return model;
        }
        return brand + " " + model;
    }

    private BigDecimal resolveGroupVehicleValuation(CoOwnershipGroup group, Vehicle v) {
        if (group != null && group.getId() != null) {
            Optional<VehicleRegistrationDraft> byGroup = draftRepository.findFirstByCreatedGroupIdOrderByUpdatedAtDesc(group.getId());
            if (byGroup.isPresent() && byGroup.get().getVehicleValue() != null
                    && byGroup.get().getVehicleValue().compareTo(BigDecimal.ZERO) > 0) {
                return byGroup.get().getVehicleValue();
            }
        }
        if (v != null && v.getId() != null) {
            Optional<VehicleRegistrationDraft> byVehicle = draftRepository.findFirstByCreatedVehicleIdOrderByUpdatedAtDesc(v.getId());
            if (byVehicle.isPresent() && byVehicle.get().getVehicleValue() != null
                    && byVehicle.get().getVehicleValue().compareTo(BigDecimal.ZERO) > 0) {
                return byVehicle.get().getVehicleValue();
            }
        }
        return new BigDecimal("1200000000");
    }

    private VehicleRegistrationDraftResponse mapDraftResponse(VehicleRegistrationDraft draft) {
        User creator = draft.getCreatorId() != null
                ? userRepository.findById(draft.getCreatorId()).orElse(null)
                : null;
        User reviewer = draft.getReviewedBy() != null
                ? userRepository.findById(draft.getReviewedBy()).orElse(null)
                : null;
        List<Map<String, Object>> parsedCoOwners = parseProposedCoOwners(draft.getProposedCoOwners());
        String resolvedUrl = (draft.getModel3dUrl() != null && !draft.getModel3dUrl().isBlank())
                ? draft.getModel3dUrl()
                : resolveModel3dUrl(draft.getVehicleModel());

        return VehicleRegistrationDraftResponse.fromEntity(
                draft,
                parsedCoOwners,
                creator != null ? creator.getFullName() : "Thành viên EVShare",
                creator != null ? creator.getEmail() : "",
                reviewer != null ? reviewer.getFullName() : null,
                resolvedUrl);
    }

    private void runAfterCommit(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
        } else {
            action.run();
        }
    }
}
