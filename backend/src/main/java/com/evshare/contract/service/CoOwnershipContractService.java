package com.evshare.contract.service;

import com.evshare.common.exception.DuplicateResourceException;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.common.exception.UnauthorizedException;
import com.evshare.contract.dto.*;
import com.evshare.contract.entity.*;
import com.evshare.contract.repository.*;
import com.evshare.ownership.entity.*;
import com.evshare.ownership.repository.*;
import com.evshare.security.UserPrincipal;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import com.evshare.user.repository.UserRepository;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.repository.VehicleRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.*;
import com.evshare.ownership.repository.OwnershipTransferRequestRepository;
import java.util.stream.Collectors;

@Service
public class CoOwnershipContractService {

    private final CoOwnershipContractRepository contractRepository;
    private final CoOwnershipContractVersionRepository versionRepository;
    private final ContractAcceptanceRepository acceptanceRepository;
    private final CoOwnershipGroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final OwnershipShareRepository shareRepository;
    private final GroupVehicleRepository groupVehicleRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final OwnershipTransferRequestRepository transferRepository;
    private final ObjectMapper objectMapper;

    public CoOwnershipContractService(
            CoOwnershipContractRepository contractRepository,
            CoOwnershipContractVersionRepository versionRepository,
            ContractAcceptanceRepository acceptanceRepository,
            CoOwnershipGroupRepository groupRepository,
            GroupMemberRepository memberRepository,
            OwnershipShareRepository shareRepository,
            GroupVehicleRepository groupVehicleRepository,
            VehicleRepository vehicleRepository,
            UserRepository userRepository,
            OwnershipTransferRequestRepository transferRepository,
            ObjectMapper objectMapper
    ) {
        this.contractRepository = contractRepository;
        this.versionRepository = versionRepository;
        this.acceptanceRepository = acceptanceRepository;
        this.groupRepository = groupRepository;
        this.memberRepository = memberRepository;
        this.shareRepository = shareRepository;
        this.groupVehicleRepository = groupVehicleRepository;
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
        this.transferRepository = transferRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Get or create authoritative contract for vehicle
     */
    @Transactional
    public ContractSummaryResponse getContractSummaryByVehicle(String vehicleIdOrIdentifier, UserPrincipal principal) {
        Vehicle vehicle = resolveVehicle(vehicleIdOrIdentifier);
        CoOwnershipGroup group = resolveGroupForVehicle(vehicle.getId());
        validateGroupAccess(group.getId(), principal);

        CoOwnershipContract contract = contractRepository.findByGroupId(group.getId())
                .orElseGet(() -> createInitialContractForGroup(group, vehicle, principal != null ? principal.getUser() : null));

        return mapToSummary(contract, principal != null ? principal.getUser() : null);
    }

    /**
     * Get contract detail by contract ID
     */
    @Transactional(readOnly = true)
    public ContractSummaryResponse getContractSummaryById(UUID contractId, UserPrincipal principal) {
        CoOwnershipContract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Hợp đồng không tồn tại: " + contractId));
        validateGroupAccess(contract.getGroup().getId(), principal);
        return mapToSummary(contract, principal != null ? principal.getUser() : null);
    }

    /**
     * List all versions of a contract (History)
     */
    @Transactional(readOnly = true)
    public List<ContractVersionResponse> getContractVersions(UUID contractId, UserPrincipal principal) {
        CoOwnershipContract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Hợp đồng không tồn tại: " + contractId));
        validateGroupAccess(contract.getGroup().getId(), principal);

        List<CoOwnershipContractVersion> versions = versionRepository.findByContractIdOrderByVersionNumberDesc(contractId);
        return versions.stream().map(this::mapToVersionResponse).collect(Collectors.toList());
    }

    /**
     * Get specific contract version with content snapshot & acceptances
     */
    @Transactional(readOnly = true)
    public ContractVersionResponse getContractVersion(UUID contractId, UUID versionId, UserPrincipal principal) {
        CoOwnershipContractVersion version = versionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Phiên bản hợp đồng không tồn tại: " + versionId));
        if (!version.getContract().getId().equals(contractId)) {
            throw new IllegalArgumentException("Phiên bản không thuộc hợp đồng này.");
        }
        validateGroupAccess(version.getContract().getGroup().getId(), principal);
        return mapToVersionResponse(version);
    }

    /**
     * Create a new draft contract version (Amendment proposal)
     */
    @Transactional
    public ContractVersionResponse createDraftVersion(UUID contractId, CreateContractVersionRequest request, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }
        if (principal.getUser().getRole() == Role.STAFF) {
            throw new AccessDeniedException("Nhân viên vận hành không có quyền tạo hoặc chỉnh sửa hợp đồng.");
        }

        CoOwnershipContract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Hợp đồng không tồn tại: " + contractId));
        validateGroupAccess(contract.getGroup().getId(), principal);

        CoOwnershipGroup group = contract.getGroup();

        // Section V: Validate authoritative backend ownership percentages (SUM == 100%)
        validateOwnershipTotals(group.getId());

        // Snapshot authoritative members and percentages
        String ownershipJson = buildOwnershipSnapshotJson(group.getId());

        // Snapshot authoritative voting rules
        String votingRule = request.votingRule() != null && !request.votingRule().isBlank()
                ? request.votingRule().trim()
                : (group.getVotingRule() != null ? group.getVotingRule() : "OWNERSHIP_WEIGHTED");
        BigDecimal quorum = request.quorumPercentage() != null
                ? request.quorumPercentage()
                : (group.getQuorumPercentage() != null ? group.getQuorumPercentage() : new BigDecimal("50.00"));
        BigDecimal threshold = request.approvalThresholdPercentage() != null
                ? request.approvalThresholdPercentage()
                : (group.getApprovalThresholdPercentage() != null ? group.getApprovalThresholdPercentage() : new BigDecimal("50.00"));

        Map<String, Object> votingMap = new LinkedHashMap<>();
        votingMap.put("decisionRule", votingRule);
        votingMap.put("quorumPercentage", quorum);
        votingMap.put("approvalThresholdPercentage", threshold);
        String votingJson = toJson(votingMap);

        // Snapshot financial rules
        Map<String, Object> financialMap = new LinkedHashMap<>();
        financialMap.put("chargingPolicy", "USER_RESPONSIBILITY");
        financialMap.put("maintenancePolicy", "USAGE_AND_CAPITAL");
        financialMap.put("insurancePolicy", "OWNERSHIP_RATIO");
        String financialJson = toJson(financialMap);

        Integer maxVersion = versionRepository.findMaxVersionNumberByContractId(contractId);
        int nextVersionNumber = (maxVersion != null ? maxVersion : 0) + 1;

        String contentSnapshot = request.contentSnapshot();
        if (contentSnapshot == null || contentSnapshot.isBlank()) {
            contentSnapshot = generateDefaultContractContent(contract, nextVersionNumber, group);
        }
        String contentHash = calculateSha256(contentSnapshot);

        CoOwnershipContractVersion newVersion = new CoOwnershipContractVersion(
                UUID.randomUUID(),
                contract,
                nextVersionNumber,
                request.title() != null && !request.title().isBlank()
                        ? request.title().trim()
                        : "Hợp đồng Đồng sở hữu " + contract.getVehicle().getName() + " (V" + nextVersionNumber + ".0)",
                contentSnapshot,
                contentHash,
                ownershipJson,
                votingJson,
                financialJson,
                principal.getUser()
        );

        newVersion.setStatus(ContractVersionStatus.DRAFT);
        CoOwnershipContractVersion saved = versionRepository.save(newVersion);
        return mapToVersionResponse(saved);
    }

    /**
     * Submit version for member acceptance (DRAFT -> PENDING_ACCEPTANCE)
     */
    @Transactional
    public ContractVersionResponse submitVersionForAcceptance(UUID contractId, UUID versionId, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }
        if (principal.getUser().getRole() == Role.STAFF) {
            throw new AccessDeniedException("Nhân viên không có quyền thay đổi trạng thái hợp đồng.");
        }

        CoOwnershipContractVersion version = versionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Phiên bản hợp đồng không tồn tại: " + versionId));
        if (!version.getContract().getId().equals(contractId)) {
            throw new IllegalArgumentException("Phiên bản không thuộc hợp đồng này.");
        }
        validateGroupAccess(version.getContract().getGroup().getId(), principal);

        if (version.getStatus() != ContractVersionStatus.DRAFT) {
            throw new IllegalStateException("Chỉ phiên bản ở trạng thái Dự thảo (DRAFT) mới có thể gửi yêu cầu xác nhận.");
        }

        // Section V: Re-verify ownership total == 100%
        validateOwnershipTotals(version.getContract().getGroup().getId());

        version.setStatus(ContractVersionStatus.PENDING_ACCEPTANCE);
        versionRepository.save(version);

        CoOwnershipContract contract = version.getContract();
        if (contract.getStatus() == ContractStatus.DRAFT) {
            contract.setStatus(ContractStatus.PENDING_ACCEPTANCE);
            contractRepository.save(contract);
        }

        return mapToVersionResponse(version);
    }

    /**
     * Electronic Acceptance of contract version (DEMO)
     */
    @Transactional
    public ContractAcceptanceResponse acceptContractVersion(
            UUID versionId,
            ContractAcceptanceRequest request,
            UserPrincipal principal,
            String ipAddress,
            String userAgent
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để thực hiện xác nhận hợp đồng.");
        }
        if (principal.getUser().getRole() == Role.STAFF) {
            throw new AccessDeniedException("Nhân viên vận hành không được phép ký xác nhận thay thành viên đồng sở hữu.");
        }

        CoOwnershipContractVersion version = versionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Phiên bản hợp đồng không tồn tại: " + versionId));
        CoOwnershipContract contract = version.getContract();
        CoOwnershipGroup group = contract.getGroup();

        // 1. Verify user is active group member
        GroupMember member = memberRepository.findByGroupIdAndUserId(group.getId(), principal.getUser().getId())
                .orElseThrow(() -> new AccessDeniedException("Bạn không phải là thành viên trong nhóm đồng sở hữu của hợp đồng này."));
        if (member.getStatus() != MemberStatus.ACTIVE || member.getRemovedAt() != null) {
            throw new AccessDeniedException("Tài khoản của bạn không ở trạng thái hoạt động trong nhóm đồng sở hữu.");
        }

        // 2. Verify version is pending acceptance or active
        if (version.getStatus() != ContractVersionStatus.PENDING_ACCEPTANCE && version.getStatus() != ContractVersionStatus.ACTIVE) {
            throw new IllegalStateException("Phiên bản này hiện không mở tiếp nhận xác nhận điện tử.");
        }

        // 3. Prevent duplicate acceptance records
        Optional<ContractAcceptance> existing = acceptanceRepository.findByContractVersionIdAndUserId(versionId, principal.getUser().getId());
        if (existing.isPresent()) {
            return mapToAcceptanceResponse(existing.get(), member);
        }

        // 4. Verify content hash integrity if provided
        if (request != null && request.contentHash() != null && !request.contentHash().isBlank()) {
            if (!request.contentHash().equalsIgnoreCase(version.getContentHash())) {
                throw new IllegalStateException("Mã băm nội dung tài liệu không khớp với phiên bản máy chủ. Vui lòng tải lại trang.");
            }
        }

        // 5. Record electronic acceptance
        ContractAcceptance acceptance = new ContractAcceptance(
                UUID.randomUUID(),
                version,
                principal.getUser(),
                version.getContentHash(),
                "DEMO_ELECTRONIC_ACCEPTANCE",
                ipAddress,
                userAgent
        );
        ContractAcceptance saved = acceptanceRepository.save(acceptance);

        // 6. Check if all active members have accepted -> Auto-activate or ready to activate
        checkAndAttemptAutoActivation(version, group);

        return mapToAcceptanceResponse(saved, member);
    }

    /**
     * Explicit activation of contract version (Requires 100% acceptance from all active members)
     */
    @Transactional
    public ContractSummaryResponse activateContractVersion(UUID contractId, UUID versionId, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }
        if (principal.getUser().getRole() == Role.STAFF) {
            throw new AccessDeniedException("Nhân viên vận hành không có quyền kích hoạt hợp đồng.");
        }

        CoOwnershipContractVersion version = versionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Phiên bản hợp đồng không tồn tại: " + versionId));
        if (!version.getContract().getId().equals(contractId)) {
            throw new IllegalArgumentException("Phiên bản không thuộc hợp đồng này.");
        }
        validateGroupAccess(version.getContract().getGroup().getId(), principal);

        CoOwnershipContract contract = version.getContract();
        CoOwnershipGroup group = contract.getGroup();

        ConsentPolicy consentPolicy = resolveVersionConsentPolicy(version);

        if (consentPolicy == ConsentPolicy.INTERNAL_OWNERSHIP_TRANSFER) {
            List<OwnershipTransferRequest> transfers = transferRepository.findByContractVersionId(versionId);
            if (!transfers.isEmpty()) {
                OwnershipTransferRequest transfer = transfers.get(0);
                List<ContractAcceptance> acceptances = acceptanceRepository.findByContractVersionId(versionId);
                Set<UUID> validAcceptedUserIds = acceptances.stream()
                        .filter(a -> version.getContentHash().equalsIgnoreCase(a.getContentHashAtAcceptance()))
                        .map(a -> a.getUser().getId())
                        .collect(Collectors.toSet());

                if (!validAcceptedUserIds.contains(transfer.getFromUser().getId())) {
                    throw new IllegalStateException("Hợp đồng phụ lục chuyển nhượng chưa thể kích hoạt: Người chuyển nhượng chưa ký xác nhận hoặc mã băm không khớp.");
                }
                if (!validAcceptedUserIds.contains(transfer.getToUser().getId())) {
                    throw new IllegalStateException("Hợp đồng phụ lục chuyển nhượng chưa thể kích hoạt: Người nhận chưa ký xác nhận hoặc mã băm không khớp.");
                }
            }
        } else {
            // 1. Verify 100% active member acceptance for initial contract or general amendments
            List<GroupMember> activeMembers = memberRepository.findByGroupIdAndStatus(group.getId(), MemberStatus.ACTIVE)
                    .stream().filter(m -> m.getRemovedAt() == null).toList();

            List<ContractAcceptance> acceptances = acceptanceRepository.findByContractVersionId(versionId);
            Set<UUID> acceptedUserIds = acceptances.stream().map(a -> a.getUser().getId()).collect(Collectors.toSet());

            for (GroupMember m : activeMembers) {
                if (!acceptedUserIds.contains(m.getUser().getId())) {
                    throw new IllegalStateException("Hợp đồng chưa thể kích hoạt vì thành viên " + m.getUser().getFullName() + " chưa xác nhận đồng ý.");
                }
            }
        }

        // 2. Verify ownership totals == 100%
        validateOwnershipTotals(group.getId());

        // 3. Mark previous active version as SUPERSEDED
        if (contract.getCurrentVersion() != null && !contract.getCurrentVersion().getId().equals(version.getId())) {
            CoOwnershipContractVersion prevVersion = contract.getCurrentVersion();
            prevVersion.setStatus(ContractVersionStatus.SUPERSEDED);
            prevVersion.setEffectiveUntil(Instant.now());
            versionRepository.save(prevVersion);
        }

        // 4. Activate new version
        Instant now = Instant.now();
        version.setStatus(ContractVersionStatus.ACTIVE);
        version.setEffectiveFrom(now);
        version.setActivatedAt(now);
        versionRepository.save(version);

        // 5. Update contract header
        contract.setCurrentVersion(version);
        contract.setStatus(ContractStatus.ACTIVE);
        contract.setUpdatedAt(now);
        CoOwnershipContract savedContract = contractRepository.save(contract);

        return mapToSummary(savedContract, principal.getUser());
    }

    /**
     * Get active contract version for a vehicle (used by Voting System & Operational modules)
     */
    @Transactional(readOnly = true)
    public Optional<CoOwnershipContractVersion> getActiveContractVersionForVehicle(UUID vehicleId) {
        return contractRepository.findByVehicleId(vehicleId)
                .filter(c -> c.getStatus() == ContractStatus.ACTIVE && c.getCurrentVersion() != null)
                .map(CoOwnershipContract::getCurrentVersion);
    }

    // =========================================================================
    // HELPER & VALIDATION METHODS
    // =========================================================================

    private void checkAndAttemptAutoActivation(CoOwnershipContractVersion version, CoOwnershipGroup group) {
        ConsentPolicy consentPolicy = resolveVersionConsentPolicy(version);
        // Note: Internal transfer activation is triggered atomically through completeTransfer endpoint with full checks
        if (consentPolicy == ConsentPolicy.INTERNAL_OWNERSHIP_TRANSFER) {
            return;
        }

        List<GroupMember> activeMembers = memberRepository.findByGroupIdAndStatus(group.getId(), MemberStatus.ACTIVE)
                .stream().filter(m -> m.getRemovedAt() == null).toList();

        List<ContractAcceptance> acceptances = acceptanceRepository.findByContractVersionId(version.getId());
        Set<UUID> acceptedUserIds = acceptances.stream().map(a -> a.getUser().getId()).collect(Collectors.toSet());

        boolean allAccepted = activeMembers.stream().allMatch(m -> acceptedUserIds.contains(m.getUser().getId()));
        if (allAccepted && version.getStatus() == ContractVersionStatus.PENDING_ACCEPTANCE) {
            // Auto activate
            CoOwnershipContract contract = version.getContract();
            Instant now = Instant.now();

            if (contract.getCurrentVersion() != null && !contract.getCurrentVersion().getId().equals(version.getId())) {
                CoOwnershipContractVersion prevVersion = contract.getCurrentVersion();
                prevVersion.setStatus(ContractVersionStatus.SUPERSEDED);
                prevVersion.setEffectiveUntil(now);
                versionRepository.save(prevVersion);
            }

            version.setStatus(ContractVersionStatus.ACTIVE);
            version.setEffectiveFrom(now);
            version.setActivatedAt(now);
            versionRepository.save(version);

            contract.setCurrentVersion(version);
            contract.setStatus(ContractStatus.ACTIVE);
            contract.setUpdatedAt(now);
            contractRepository.save(contract);
        }
    }

    private void validateOwnershipTotals(UUID groupId) {
        List<GroupMember> activeMembers = memberRepository.findByGroupIdAndStatus(groupId, MemberStatus.ACTIVE)
                .stream().filter(m -> m.getRemovedAt() == null).toList();

        BigDecimal sum = BigDecimal.ZERO;
        for (GroupMember m : activeMembers) {
            List<OwnershipShare> memberShares = shareRepository.findByMemberId(m.getId());
            for (OwnershipShare share : memberShares) {
                if (share != null && share.getGroup() != null && groupId.equals(share.getGroup().getId()) && share.getPercentage() != null) {
                    sum = sum.add(share.getPercentage());
                }
            }
        }

        if (sum.compareTo(new BigDecimal("100.00")) != 0) {
            throw new IllegalStateException("Tổng tỷ lệ sở hữu của các thành viên (" + sum + "%) không bằng 100.00%. Không thể tạo hoặc kích hoạt hợp đồng.");
        }
    }

    private String buildOwnershipSnapshotJson(UUID groupId) {
        List<GroupMember> activeMembers = memberRepository.findByGroupIdAndStatus(groupId, MemberStatus.ACTIVE)
                .stream().filter(m -> m.getRemovedAt() == null).toList();

        List<Map<String, Object>> snapshot = new ArrayList<>();
        for (GroupMember m : activeMembers) {
            OwnershipShare share = shareRepository.findByMemberId(m.getId()).stream()
                    .filter(s -> s.getGroup() != null && groupId.equals(s.getGroup().getId()))
                    .findFirst()
                    .orElse(null);
            Map<String, Object> memberMap = new LinkedHashMap<>();
            memberMap.put("userId", m.getUser().getId().toString());
            memberMap.put("fullName", m.getUser().getFullName());
            memberMap.put("email", m.getUser().getEmail());
            memberMap.put("role", m.getMemberRole() != null ? m.getMemberRole().name() : "MEMBER");
            memberMap.put("percentage", share != null && share.getPercentage() != null ? share.getPercentage() : BigDecimal.ZERO);
            snapshot.add(memberMap);
        }
        return toJson(snapshot);
    }

    private CoOwnershipContract createInitialContractForGroup(CoOwnershipGroup group, Vehicle vehicle, User creator) {
        User resolvedCreator = creator != null ? creator : group.getMembers().stream()
                .filter(m -> m.getMemberRole() == GroupMemberRole.REPRESENTATIVE)
                .map(GroupMember::getUser)
                .findFirst()
                .orElse(userRepository.findAll().get(0));

        String vehicleCode = vehicle.getName() != null && !vehicle.getName().isBlank() ? vehicle.getName() : "EV01";
        String contractCode = "HD-" + vehicleCode.replaceAll("\\s+", "").toUpperCase() + "-2026";

        CoOwnershipContract contract = new CoOwnershipContract(
                UUID.randomUUID(),
                group,
                vehicle,
                contractCode,
                resolvedCreator
        );
        contract = contractRepository.save(contract);

        // Create Version 1.0
        String ownershipJson = buildOwnershipSnapshotJson(group.getId());
        Map<String, Object> votingMap = new LinkedHashMap<>();
        votingMap.put("decisionRule", group.getVotingRule() != null ? group.getVotingRule() : "OWNERSHIP_WEIGHTED");
        votingMap.put("quorumPercentage", group.getQuorumPercentage() != null ? group.getQuorumPercentage() : new BigDecimal("50.00"));
        votingMap.put("approvalThresholdPercentage", group.getApprovalThresholdPercentage() != null ? group.getApprovalThresholdPercentage() : new BigDecimal("50.00"));

        Map<String, Object> financialMap = new LinkedHashMap<>();
        financialMap.put("chargingPolicy", "USER_RESPONSIBILITY");
        financialMap.put("maintenancePolicy", "USAGE_AND_CAPITAL");
        financialMap.put("insurancePolicy", "OWNERSHIP_RATIO");

        String contentSnapshot = generateDefaultContractContent(contract, 1, group);
        String contentHash = calculateSha256(contentSnapshot);

        CoOwnershipContractVersion version = new CoOwnershipContractVersion(
                UUID.randomUUID(),
                contract,
                1,
                "Hợp đồng Đồng sở hữu " + vehicle.getName() + " (V1.0)",
                contentSnapshot,
                contentHash,
                ownershipJson,
                toJson(votingMap),
                toJson(financialMap),
                resolvedCreator
        );

        version.setStatus(ContractVersionStatus.ACTIVE);
        version.setEffectiveFrom(Instant.now());
        version.setActivatedAt(Instant.now());
        version = versionRepository.save(version);

        contract.setCurrentVersion(version);
        contract.setStatus(ContractStatus.ACTIVE);
        contract = contractRepository.save(contract);

        // Auto-seed acceptances for active members
        List<GroupMember> activeMembers = memberRepository.findByGroupIdAndStatus(group.getId(), MemberStatus.ACTIVE);
        for (GroupMember m : activeMembers) {
            ContractAcceptance acceptance = new ContractAcceptance(
                    UUID.randomUUID(),
                    version,
                    m.getUser(),
                    contentHash,
                    "DEMO_ELECTRONIC_ACCEPTANCE",
                    "127.0.0.1",
                    "EVShare3D/Phase22"
            );
            acceptanceRepository.save(acceptance);
        }

        return contract;
    }

    private String generateDefaultContractContent(CoOwnershipContract contract, int versionNum, CoOwnershipGroup group) {
        Vehicle v = contract.getVehicle();
        return "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\n"
                + "HỢP ĐỒNG ĐỒNG SỞ HỮU VÀ QUY CHẾ VẬN HÀNH PHƯƠNG TIỆN ĐIỆN\n"
                + "(Phiên bản: V" + versionNum + ".0 — Mã hợp đồng: " + contract.getContractCode() + ")\n\n"
                + "1. THÔNG TIN HỢP ĐỒNG\n"
                + "- Mã hợp đồng: " + contract.getContractCode() + "\n"
                + "- Nhóm đồng sở hữu: " + group.getName() + "\n"
                + "- Ngày lập quy chế: " + Instant.now().toString().substring(0, 10) + "\n"
                + "- Nền tảng điều phối: Hệ thống xe điện chia sẻ EVShare 3D.\n\n"
                + "2. THÔNG TIN PHƯƠNG TIỆN ĐỒNG SỞ HỮU\n"
                + "- Tên xe: " + (v.getName() != null ? v.getName() : "VinFast VF8") + "\n"
                + "- Biển số kiểm soát: " + (v.getLicensePlate() != null ? v.getLicensePlate() : "30K-123.45") + "\n"
                + "- Số khung (VIN): " + (v.getVin() != null ? v.getVin() : "VF8VN2026EV010001") + "\n"
                + "- Tình trạng pháp lý: Đủ điều kiện lưu hành và vận hành theo mô hình đồng sở hữu.\n\n"
                + "3. DANH SÁCH ĐỒNG SỞ HỮU\n"
                + "Các thành viên có tên trong danh sách đăng ký hoạt động hợp pháp của nhóm đồng sở hữu trên hệ thống.\n\n"
                + "4. TỶ LỆ SỞ HỮU VÀ VỐN GÓP\n"
                + "Tỷ lệ sở hữu được ghi nhận bất biến theo số liệu đối soát thời gian thực của nhóm, tổng tỷ lệ luôn đạt 100.00%.\n\n"
                + "5. QUYỀN SỬ DỤNG PHƯƠNG TIỆN\n"
                + "Thành viên có quyền đặt lịch sử dụng xe theo tỷ lệ sở hữu. Hạn mức giờ sử dụng ưu tiên hàng tháng được hệ thống tự động phân bổ công bằng.\n\n"
                + "6. QUY TRÌNH ĐẶT LỊCH VÀ BÀN GIAO XE\n"
                + "Mọi chuyến đi phải được tạo trên lịch đặt xe trước. Nhận xe và trả xe bắt buộc phải có quy trình bàn giao của nhân viên STAFF tại trạm để xác nhận ngoại quan và pin.\n\n"
                + "7. TRÁCH NHIỆM KHI SỬ DỤNG PHƯƠNG TIỆN\n"
                + "Người lái xe chịu hoàn toàn trách nhiệm pháp lý khi tham gia giao thông, bảo quản xe cẩn thận và bàn giao đúng giờ quy định.\n\n"
                + "8. NGUYÊN TẮC TÍNH CHI PHÍ ĐIỆN\n"
                + "Chi phí sạc pin phát sinh trong thời gian đặt xe hoặc sử dụng trạm sạc thuộc 100% trách nhiệm của cá nhân người lái xe (USER_RESPONSIBILITY).\n\n"
                + "9. NGUYÊN TẮC PHÂN BỔ CHI PHÍ CHUNG\n"
                + "Các chi phí bảo dưỡng định kỳ, đăng kiểm, bảo hiểm thân vỏ và nâng cấp xe được phân bổ theo tỷ lệ sở hữu và vốn góp (OWNERSHIP_RATIO hoặc USAGE_AND_CAPITAL).\n\n"
                + "10. QUY CHẾ BIỂU QUYẾT\n"
                + "Mọi quyết định chi tiêu chung hoặc sửa đổi quy chế phải thông qua biểu quyết trên hệ thống EVShare 3D với tỷ lệ Quorum 50% và Tỷ lệ thông qua 50%.\n\n"
                + "11. QUỸ CHUNG VÀ GIẢI NGÂN\n"
                + "Nhóm duy trì Quỹ chung (Shared Fund) tại hệ thống. Quỹ chỉ giải ngân khi có đề xuất biểu quyết đã được thông qua hoặc biên bản chi phí hợp lệ.\n\n"
                + "12. BẢO DƯỠNG, SỬA CHỮA VÀ NÂNG CẤP\n"
                + "Thực hiện theo khuyến cáo của nhà sản xuất, tại garage ủy quyền của EVShare 3D dưới sự giám sát kỹ thuật của nhân viên STAFF.\n\n"
                + "13. XỬ LÝ HƯ HỎNG VÀ TRANH CHẤP\n"
                + "Hư hỏng mới được phát hiện trong quá trình bàn giao xe sẽ do người lái xe gần nhất chịu trách nhiệm theo biên bản kiểm tra 3D Damage Mapping.\n\n"
                + "14. THAY ĐỔI THÀNH VIÊN VÀ TỶ LỆ SỞ HỮU\n"
                + "Chuyển nhượng hoặc bổ sung thành viên phải được 100% đồng sở hữu chấp thuận và được ký điện tử vào phiên bản hợp đồng kế tiếp.\n\n"
                + "15. ĐIỀU KIỆN SỬA ĐỔI, CHẤM DỨT HỢP ĐỒNG\n"
                + "Mọi sửa đổi chỉ có hiệu lực khi phiên bản mới được toàn bộ các thành viên đồng sở hữu xác nhận chấp thuận.\n\n"
                + "16. XÁC NHẬN CỦA CÁC BÊN\n"
                + "Xác nhận chấp thuận được lưu trữ có tính chất kiểm tra kiểm toán trên hệ thống EVShare 3D.";
    }

    public ConsentPolicy resolveVersionConsentPolicy(CoOwnershipContractVersion version) {
        if (version == null) return ConsentPolicy.INITIAL_CONTRACT;
        if (version.getVersionNumber() != null && version.getVersionNumber() == 1) {
            return ConsentPolicy.INITIAL_CONTRACT;
        }
        List<OwnershipTransferRequest> transfers = transferRepository.findByContractVersionId(version.getId());
        if (!transfers.isEmpty()) {
            OwnershipTransferRequest transfer = transfers.get(0);
            Optional<GroupMember> toMemberOpt = memberRepository.findByGroupIdAndUserId(
                    transfer.getGroup().getId(), transfer.getToUser().getId()
            );
            boolean isInternal = toMemberOpt.isPresent()
                    && toMemberOpt.get().getStatus() == MemberStatus.ACTIVE
                    && toMemberOpt.get().getRemovedAt() == null;
            return isInternal ? ConsentPolicy.INTERNAL_OWNERSHIP_TRANSFER : ConsentPolicy.EXTERNAL_OWNERSHIP_TRANSFER;
        }
        if (version.getTitle() != null && version.getTitle().toLowerCase().contains("chuyển nhượng")) {
            return ConsentPolicy.INTERNAL_OWNERSHIP_TRANSFER;
        }
        return ConsentPolicy.GENERAL_AMENDMENT;
    }

    private ContractSummaryResponse mapToSummary(CoOwnershipContract contract, User currentUser) {
        CoOwnershipContractVersion resolvedVer = contract.getCurrentVersion();
        // If currentVersion is null or pending, find the latest ACTIVE version as authoritative base contract
        if (resolvedVer == null || resolvedVer.getStatus() != ContractVersionStatus.ACTIVE) {
            Optional<CoOwnershipContractVersion> activeVer = versionRepository.findByContractIdOrderByVersionNumberDesc(contract.getId())
                    .stream().filter(v -> v.getStatus() == ContractVersionStatus.ACTIVE).findFirst();
            if (activeVer.isPresent()) {
                resolvedVer = activeVer.get();
            }
        }
        final CoOwnershipContractVersion currentVer = resolvedVer;
        List<GroupMember> activeMembers = memberRepository.findByGroupIdAndStatus(contract.getGroup().getId(), MemberStatus.ACTIVE)
                .stream().filter(m -> m.getRemovedAt() == null).toList();

        int totalMembers = activeMembers.size();
        int acceptedMembers = 0;
        boolean isCurrentUserAccepted = false;

        if (currentVer != null) {
            List<ContractAcceptance> acceptances = acceptanceRepository.findByContractVersionId(currentVer.getId());
            acceptedMembers = acceptances.size();
            if (currentUser != null) {
                isCurrentUserAccepted = acceptances.stream().anyMatch(a -> a.getUser().getId().equals(currentUser.getId()));
            }
        }

        boolean canAccept = false;
        if (currentUser != null && currentUser.getRole() == Role.CO_OWNER && currentVer != null) {
            boolean isMember = activeMembers.stream().anyMatch(m -> m.getUser().getId().equals(currentUser.getId()));
            canAccept = isMember && !isCurrentUserAccepted &&
                    (currentVer.getStatus() == ContractVersionStatus.PENDING_ACCEPTANCE || currentVer.getStatus() == ContractVersionStatus.ACTIVE);
        }

        ConsentPolicy consentPolicy = resolveVersionConsentPolicy(currentVer);
        int requiredAcceptanceCount = totalMembers;
        int currentAcceptanceCount = acceptedMembers;
        String additionalApprovalStatus = "Không yêu cầu";

        if (consentPolicy == ConsentPolicy.INTERNAL_OWNERSHIP_TRANSFER && currentVer != null) {
            List<OwnershipTransferRequest> transfers = transferRepository.findByContractVersionId(currentVer.getId());
            if (!transfers.isEmpty()) {
                OwnershipTransferRequest transfer = transfers.get(0);
                List<ContractAcceptance> acceptances = acceptanceRepository.findByContractVersionId(currentVer.getId());
                final String versionContentHash = currentVer.getContentHash();
                Set<UUID> acceptedUserIds = acceptances.stream()
                        .filter(a -> versionContentHash != null && versionContentHash.equalsIgnoreCase(a.getContentHashAtAcceptance()))
                        .map(a -> a.getUser().getId())
                        .collect(Collectors.toSet());
                boolean fromAccepted = acceptedUserIds.contains(transfer.getFromUser().getId());
                boolean toAccepted = acceptedUserIds.contains(transfer.getToUser().getId());
                requiredAcceptanceCount = 2;
                currentAcceptanceCount = (fromAccepted ? 1 : 0) + (toAccepted ? 1 : 0);
            }
        }

        boolean canActivate = currentVer != null &&
                currentVer.getStatus() == ContractVersionStatus.PENDING_ACCEPTANCE &&
                currentAcceptanceCount >= requiredAcceptanceCount && requiredAcceptanceCount > 0;

        return new ContractSummaryResponse(
                contract.getId(),
                contract.getGroup().getId(),
                contract.getGroup().getName(),
                contract.getVehicle().getId(),
                contract.getVehicle().getName(),
                contract.getContractCode(),
                currentVer != null ? currentVer.getId() : null,
                currentVer != null ? currentVer.getVersionNumber() : null,
                currentVer != null ? currentVer.getVersionNumberFormatted() : "V1.0",
                contract.getStatus(),
                contract.getStatus().getVietnameseLabel(),
                currentVer != null ? currentVer.getEffectiveFrom() : contract.getCreatedAt(),
                totalMembers,
                acceptedMembers,
                isCurrentUserAccepted,
                canAccept,
                canActivate,
                contract.getCreatedAt(),
                contract.getUpdatedAt(),
                consentPolicy.name(),
                consentPolicy.getDescription(),
                requiredAcceptanceCount,
                currentAcceptanceCount,
                additionalApprovalStatus,
                List.of()
        );
    }

    private ContractVersionResponse mapToVersionResponse(CoOwnershipContractVersion version) {
        List<ContractAcceptance> acceptances = acceptanceRepository.findByContractVersionId(version.getId());
        List<GroupMember> activeMembers = memberRepository.findByGroupIdAndStatus(version.getContract().getGroup().getId(), MemberStatus.ACTIVE)
                .stream().filter(m -> m.getRemovedAt() == null).toList();

        Map<UUID, GroupMember> memberMap = activeMembers.stream().collect(Collectors.toMap(m -> m.getUser().getId(), m -> m, (a, b) -> a));

        List<ContractAcceptanceResponse> acceptanceResponses = acceptances.stream().map(a -> {
            GroupMember m = memberMap.get(a.getUser().getId());
            return mapToAcceptanceResponse(a, m);
        }).collect(Collectors.toList());

        ConsentPolicy consentPolicy = resolveVersionConsentPolicy(version);
        int requiredAcceptanceCount = activeMembers.size();
        int currentAcceptanceCount = acceptances.size();
        boolean allAccepted = !activeMembers.isEmpty() && acceptances.size() >= activeMembers.size();
        String additionalApprovalStatus = "Không yêu cầu";
        List<ContractSignatoryResponse> signatories = new ArrayList<>();

        if (consentPolicy == ConsentPolicy.INTERNAL_OWNERSHIP_TRANSFER) {
            List<OwnershipTransferRequest> transfers = transferRepository.findByContractVersionId(version.getId());
            if (transfers.isEmpty() && version.getContract() != null && version.getContract().getGroup() != null) {
                transfers = transferRepository.findByGroupIdOrderByCreatedAtDesc(version.getContract().getGroup().getId());
            }
            if (!transfers.isEmpty()) {
                OwnershipTransferRequest transfer = transfers.get(0);
                Set<UUID> validAcceptedUserIds = acceptances.stream()
                        .filter(a -> version.getContentHash().equalsIgnoreCase(a.getContentHashAtAcceptance()))
                        .map(a -> a.getUser().getId())
                        .collect(Collectors.toSet());

                Map<UUID, Instant> acceptedAtMap = acceptances.stream()
                        .filter(a -> version.getContentHash().equalsIgnoreCase(a.getContentHashAtAcceptance()))
                        .collect(Collectors.toMap(a -> a.getUser().getId(), ContractAcceptance::getAcceptedAt, (first, second) -> first));

                boolean fromAccepted = validAcceptedUserIds.contains(transfer.getFromUser().getId());
                boolean toAccepted = validAcceptedUserIds.contains(transfer.getToUser().getId());

                requiredAcceptanceCount = 2;
                currentAcceptanceCount = (fromAccepted ? 1 : 0) + (toAccepted ? 1 : 0);
                allAccepted = (currentAcceptanceCount >= 2);

                BigDecimal fromShare = resolvePercentageFromSnapshot(version.getOwnershipSnapshot(), transfer.getFromUser().getId());
                BigDecimal toShare = resolvePercentageFromSnapshot(version.getOwnershipSnapshot(), transfer.getToUser().getId());

                // 1. Transferor
                signatories.add(new ContractSignatoryResponse(
                        transfer.getFromUser().getId(),
                        transfer.getFromUser().getFullName(),
                        transfer.getFromUser().getEmail(),
                        "TRANSFEROR",
                        "Người chuyển",
                        fromShare,
                        fromAccepted,
                        acceptedAtMap.get(transfer.getFromUser().getId()),
                        fromAccepted ? "Đã xác nhận" : "Chờ xác nhận"
                ));

                // 2. Recipient
                signatories.add(new ContractSignatoryResponse(
                        transfer.getToUser().getId(),
                        transfer.getToUser().getFullName(),
                        transfer.getToUser().getEmail(),
                        "RECIPIENT",
                        "Người nhận",
                        toShare,
                        toAccepted,
                        acceptedAtMap.get(transfer.getToUser().getId()),
                        toAccepted ? "Đã xác nhận" : "Chờ xác nhận"
                ));

                // 3. Other co-owners (Le Van C) - Notified only, never fake signed
                for (GroupMember m : activeMembers) {
                    if (!m.getUser().getId().equals(transfer.getFromUser().getId()) && !m.getUser().getId().equals(transfer.getToUser().getId())) {
                        BigDecimal otherShare = resolvePercentageFromSnapshot(version.getOwnershipSnapshot(), m.getUser().getId());
                        signatories.add(new ContractSignatoryResponse(
                                m.getUser().getId(),
                                m.getUser().getFullName(),
                                m.getUser().getEmail(),
                                "NOTIFIED_CO_OWNER",
                                "Người liên quan",
                                otherShare,
                                false,
                                null,
                                "Được thông báo"
                        ));
                    }
                }
            }
        } else {
            // INITIAL_CONTRACT or GENERAL_AMENDMENT
            Set<UUID> acceptedUserIds = acceptances.stream().map(a -> a.getUser().getId()).collect(Collectors.toSet());
            Map<UUID, Instant> acceptedAtMap = acceptances.stream().collect(Collectors.toMap(a -> a.getUser().getId(), ContractAcceptance::getAcceptedAt, (first, second) -> first));

            for (GroupMember m : activeMembers) {
                boolean isAcc = acceptedUserIds.contains(m.getUser().getId());
                BigDecimal share = resolvePercentageFromSnapshot(version.getOwnershipSnapshot(), m.getUser().getId());
                signatories.add(new ContractSignatoryResponse(
                        m.getUser().getId(),
                        m.getUser().getFullName(),
                        m.getUser().getEmail(),
                        "CO_OWNER",
                        "Đồng sở hữu",
                        share,
                        isAcc,
                        acceptedAtMap.get(m.getUser().getId()),
                        isAcc ? "Đã xác nhận" : "Chờ xác nhận"
                ));
            }
        }

        return new ContractVersionResponse(
                version.getId(),
                version.getContract().getId(),
                version.getContract().getContractCode(),
                version.getVersionNumber(),
                version.getVersionNumberFormatted(),
                version.getTitle(),
                version.getContentSnapshot(),
                version.getContentHash(),
                version.getOwnershipSnapshot(),
                version.getVotingRuleSnapshot(),
                version.getFinancialRuleSnapshot(),
                version.getEffectiveFrom(),
                version.getEffectiveUntil(),
                version.getStatus(),
                version.getStatus().getVietnameseLabel(),
                version.getCreatedByUser() != null ? version.getCreatedByUser().getFullName() : "Hệ thống",
                version.getCreatedAt(),
                version.getActivatedAt(),
                acceptanceResponses,
                allAccepted,
                consentPolicy.name(),
                consentPolicy.getDescription(),
                requiredAcceptanceCount,
                currentAcceptanceCount,
                additionalApprovalStatus,
                signatories
        );
    }

    private ContractAcceptanceResponse mapToAcceptanceResponse(ContractAcceptance acceptance, GroupMember member) {
        BigDecimal percentage = BigDecimal.ZERO;
        if (acceptance.getContractVersion() != null && acceptance.getContractVersion().getOwnershipSnapshot() != null) {
            percentage = resolvePercentageFromSnapshot(acceptance.getContractVersion().getOwnershipSnapshot(), acceptance.getUser().getId());
        }
        if (percentage.compareTo(BigDecimal.ZERO) == 0 && member != null) {
            percentage = shareRepository.findByMemberId(member.getId()).stream()
                    .filter(s -> s.getGroup() != null && member.getGroup() != null && s.getGroup().getId().equals(member.getGroup().getId()))
                    .map(OwnershipShare::getPercentage)
                    .filter(Objects::nonNull)
                    .findFirst()
                    .orElse(BigDecimal.ZERO);
        }
        return new ContractAcceptanceResponse(
                acceptance.getId(),
                acceptance.getContractVersion().getId(),
                acceptance.getUser().getId(),
                acceptance.getUser().getFullName(),
                acceptance.getUser().getEmail(),
                percentage,
                acceptance.getStatus(),
                acceptance.getStatus().getVietnameseLabel(),
                acceptance.getAcceptedAt(),
                acceptance.getContentHashAtAcceptance(),
                acceptance.getAcceptanceMethod()
        );
    }

    private BigDecimal resolvePercentageFromSnapshot(String ownershipSnapshotJson, UUID userId) {
        if (ownershipSnapshotJson == null || ownershipSnapshotJson.isBlank() || userId == null) {
            return BigDecimal.ZERO;
        }
        try {
            JsonNode rootNode = objectMapper.readTree(ownershipSnapshotJson);
            if (rootNode.isArray()) {
                String targetUserId = userId.toString();
                for (JsonNode node : rootNode) {
                    if (node.has("userId") && targetUserId.equalsIgnoreCase(node.get("userId").asText())) {
                        if (node.has("percentage")) {
                            return new BigDecimal(node.get("percentage").asText());
                        }
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return BigDecimal.ZERO;
    }

    private Vehicle resolveVehicle(String vehicleIdOrIdentifier) {
        try {
            UUID vehicleId = UUID.fromString(vehicleIdOrIdentifier);
            return vehicleRepository.findById(vehicleId)
                    .orElseThrow(() -> new ResourceNotFoundException("Xe không tồn tại: " + vehicleIdOrIdentifier));
        } catch (IllegalArgumentException ignored) {
            return vehicleRepository.findAll().stream()
                    .filter(v -> v.getName().equalsIgnoreCase(vehicleIdOrIdentifier)
                            || v.getVin().equalsIgnoreCase(vehicleIdOrIdentifier)
                            || v.getLicensePlate().equalsIgnoreCase(vehicleIdOrIdentifier))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Xe không tồn tại: " + vehicleIdOrIdentifier));
        }
    }

    private CoOwnershipGroup resolveGroupForVehicle(UUID vehicleId) {
        List<GroupVehicle> gvs = groupVehicleRepository.findByVehicleIdAndStatus(vehicleId, GroupVehicleStatus.ACTIVE);
        if (!gvs.isEmpty()) {
            return gvs.get(0).getGroup();
        }
        return groupRepository.findByVehicleId(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Xe chưa được gán vào nhóm đồng sở hữu nào: " + vehicleId));
    }

    private void validateGroupAccess(UUID groupId, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập.");
        }
        User user = principal.getUser();
        if (user.getRole() == Role.ADMIN || user.getRole() == Role.STAFF) {
            return;
        }
        boolean isMember = memberRepository.findByGroupIdAndUserId(groupId, user.getId())
                .filter(m -> m.getStatus() == MemberStatus.ACTIVE && m.getRemovedAt() == null)
                .isPresent();
        if (!isMember) {
            throw new AccessDeniedException("Bạn không có quyền truy cập vào thông tin hợp đồng của nhóm này.");
        }
    }

    private String calculateSha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            return "hash-" + UUID.randomUUID().toString().replace("-", "");
        }
    }

    private String toJson(Object object) {
        try {
            return objectMapper.writeValueAsString(object);
        } catch (Exception e) {
            return "{}";
        }
    }
}
