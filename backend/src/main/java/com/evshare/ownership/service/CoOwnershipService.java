package com.evshare.ownership.service;

import com.evshare.common.exception.DuplicateResourceException;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.ownership.dto.*;
import com.evshare.ownership.entity.*;
import com.evshare.ownership.repository.CoOwnershipGroupRepository;
import com.evshare.ownership.repository.GroupMemberRepository;
import com.evshare.ownership.repository.GroupVehicleRepository;
import com.evshare.ownership.repository.OwnershipShareRepository;
import com.evshare.security.UserPrincipal;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import com.evshare.user.entity.UserStatus;
import com.evshare.user.repository.UserRepository;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.repository.VehicleRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CoOwnershipService {

    public static final BigDecimal MAX_TOTAL_PERCENTAGE = new BigDecimal("100.00");
    public static final String STATUS_LABEL_COMPLETE = "HOÀN CHỈNH";
    public static final String STATUS_LABEL_INCOMPLETE = "CHƯA PHÂN BỔ ĐỦ";

    private final CoOwnershipGroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final GroupVehicleRepository groupVehicleRepository;
    private final OwnershipShareRepository shareRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    public CoOwnershipService(
            CoOwnershipGroupRepository groupRepository,
            GroupMemberRepository memberRepository,
            GroupVehicleRepository groupVehicleRepository,
            OwnershipShareRepository shareRepository,
            VehicleRepository vehicleRepository,
            UserRepository userRepository
    ) {
        this.groupRepository = groupRepository;
        this.memberRepository = memberRepository;
        this.groupVehicleRepository = groupVehicleRepository;
        this.shareRepository = shareRepository;
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
    }

    // ==========================================
    // 1. Group Core Queries & Operations
    // ==========================================

    @Transactional(readOnly = true)
    public CoOwnershipGroupResponse getGroupById(UUID groupId) {
        CoOwnershipGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhóm đồng sở hữu: " + groupId));

        return toGroupResponse(group, null);
    }

    @Transactional(readOnly = true)
    public List<CoOwnershipGroupResponse> getAllGroups() {
        return groupRepository.findAll().stream()
                .map(g -> toGroupResponse(g, null))
                .toList();
    }

    @Transactional
    public CoOwnershipGroupResponse createGroup(CreateGroupRequest request, UUID createdBy) {
        CoOwnershipGroup group = new CoOwnershipGroup(UUID.randomUUID(), request.name(), GroupStatus.ACTIVE, createdBy);
        CoOwnershipGroup saved = groupRepository.save(group);
        return toGroupResponse(saved, null);
    }

    @Transactional(readOnly = true)
    public CoOwnershipGroupResponse getCoOwnershipByVehicleId(UUID vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Xe không tồn tại: " + vehicleId));

        // 1. Try group_vehicles association first
        List<GroupVehicle> gvs = groupVehicleRepository.findByVehicleIdAndStatus(vehicleId, GroupVehicleStatus.ACTIVE);
        CoOwnershipGroup group = null;
        if (!gvs.isEmpty()) {
            if (gvs.size() > 1) {
                throw new IllegalStateException("Dữ liệu không hợp lệ: Xe " + vehicleId + " thuộc nhiều hơn 1 nhóm đồng sở hữu đang hoạt động. Quy tắc bắt buộc: 1 xe = 1 nhóm.");
            }
            group = gvs.get(0).getGroup();
        } else {
            // 2. Fallback to vehicle_id on group
            group = groupRepository.findByVehicleId(vehicleId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhóm đồng sở hữu cho xe: " + vehicleId));
        }

        return toGroupResponse(group, vehicle);
    }

    @Transactional
    public CoOwnershipGroupResponse createCoOwnershipGroup(UUID vehicleId, CreateGroupRequest request) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Xe không tồn tại: " + vehicleId));

        if (!groupVehicleRepository.findByVehicleIdAndStatus(vehicleId, GroupVehicleStatus.ACTIVE).isEmpty()
                || groupRepository.existsByVehicleId(vehicleId)) {
            throw new DuplicateResourceException("Nhóm đồng sở hữu cho xe này đã tồn tại: " + vehicleId);
        }

        CoOwnershipGroup group = new CoOwnershipGroup(UUID.randomUUID(), vehicleId, request.name());
        CoOwnershipGroup savedGroup = groupRepository.save(group);

        GroupVehicle gv = new GroupVehicle(UUID.randomUUID(), savedGroup, vehicle, GroupVehicleStatus.ACTIVE);
        groupVehicleRepository.save(gv);

        return toGroupResponse(savedGroup, vehicle);
    }

    // ==========================================
    // 2. Group Membership Operations
    // ==========================================

    @Transactional(readOnly = true)
    public List<GroupMemberResponse> getGroupMembers(UUID groupId) {
        if (!groupRepository.existsById(groupId)) {
            throw new ResourceNotFoundException("Không tìm thấy nhóm đồng sở hữu: " + groupId);
        }
        return memberRepository.findByGroupId(groupId).stream()
                .map(m -> toMemberResponse(m, null))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AvailableUserResponse> getAvailableUsers(UUID groupId, String query, UserPrincipal principal) {
        CoOwnershipGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Nhóm đồng sở hữu không tồn tại: " + groupId));

        if (principal != null) {
            validateGroupMembershipManagementPermission(group, principal);
        }

        // Invariant: One CO_OWNER user = maximum 1 active contract
        // Exclude users who already have an active contract in any group
        Set<UUID> usersWithActiveContracts = memberRepository.findByStatus(MemberStatus.ACTIVE).stream()
                .filter(m -> m.getRemovedAt() == null && m.getGroup() != null && m.getGroup().getStatus() == GroupStatus.ACTIVE)
                .map(m -> m.getUser().getId())
                .collect(Collectors.toSet());

        String searchQuery = (query != null) ? query.trim() : "";
        List<User> matchingUsers = userRepository.searchEligibleUsers(Role.CO_OWNER, UserStatus.ACTIVE, searchQuery);

        return matchingUsers.stream()
                .filter(u -> !usersWithActiveContracts.contains(u.getId()))
                .limit(10)
                .map(u -> new AvailableUserResponse(u.getId(), u.getFullName(), u.getEmail()))
                .toList();
    }

    /**
     * Authoritative Rule: ONE CO_OWNER USER = MAXIMUM ONE ACTIVE CO-OWNERSHIP CONTRACT
     * Validates that the target user does NOT already have an ACTIVE membership in any OTHER group.
     */
    private void validateUserHasNoOtherActiveContract(UUID userId, UUID targetGroupId) {
        List<GroupMember> activeMemberships = memberRepository.findByUserIdAndStatus(userId, MemberStatus.ACTIVE);
        for (GroupMember existing : activeMemberships) {
            if (existing.getRemovedAt() == null && !existing.getGroup().getId().equals(targetGroupId)) {
                CoOwnershipGroup otherGroup = existing.getGroup();
                if (otherGroup != null && otherGroup.getStatus() == GroupStatus.ACTIVE) {
                    throw new DuplicateResourceException(
                            "Người dùng đã có hợp đồng đồng sở hữu đang hoạt động với một phương tiện khác."
                    );
                }
            }
        }
    }

    @Transactional
    public GroupMemberResponse addMember(UUID groupId, AddMemberRequest request, UserPrincipal principal) {
        CoOwnershipGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Nhóm đồng sở hữu không tồn tại: " + groupId));

        if (principal != null) {
            validateGroupMembershipManagementPermission(group, principal);
        }

        if (request == null || (request.userId() == null && (request.email() == null || request.email().isBlank()))) {
            throw new IllegalArgumentException("Vui lòng cung cấp userId hoặc email của người dùng");
        }

        User targetUser;
        if (request.userId() != null) {
            targetUser = userRepository.findById(request.userId())
                    .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));
        } else {
            targetUser = userRepository.findByEmail(request.email().trim())
                    .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));
        }

        if (targetUser.getRole() != Role.CO_OWNER) {
            throw new IllegalArgumentException("Người dùng không đủ điều kiện tham gia nhóm đồng sở hữu (chỉ chấp nhận vai trò CO_OWNER)");
        }
        if (targetUser.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalArgumentException("Tài khoản người dùng hiện không ở trạng thái hoạt động");
        }

        // Authoritative single-contract check: User cannot have multiple active contracts
        validateUserHasNoOtherActiveContract(targetUser.getId(), groupId);

        Optional<GroupMember> existingMemberOpt = memberRepository.findByGroupIdAndUserId(groupId, targetUser.getId());
        if (existingMemberOpt.isPresent()) {
            GroupMember existing = existingMemberOpt.get();
            if (existing.getStatus() == MemberStatus.ACTIVE) {
                throw new DuplicateResourceException("Người dùng đã là thành viên của nhóm.");
            }
            // Reactivate member previously marked INACTIVE or REMOVED
            existing.setStatus(MemberStatus.ACTIVE);
            existing.setMemberRole(GroupMemberRole.MEMBER);
            existing.setJoinedAt(Instant.now());
            existing.setRemovedAt(null);
            GroupMember saved = memberRepository.save(existing);
            return toMemberResponse(saved, null);
        }

        // Target user is added with role MEMBER and status ACTIVE without creating ownership share
        GroupMember member = new GroupMember(UUID.randomUUID(), group, targetUser, GroupMemberRole.MEMBER, MemberStatus.ACTIVE);
        GroupMember saved = memberRepository.save(member);
        return toMemberResponse(saved, null);
    }

    @Transactional
    public GroupMemberResponse addMember(UUID groupId, AddMemberRequest request) {
        return addMember(groupId, request, null);
    }

    @Transactional
    public GroupMemberResponse updateMember(UUID groupId, UUID memberId, UpdateMemberRequest request) {
        GroupMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thành viên: " + memberId));

        if (!member.getGroup().getId().equals(groupId)) {
            throw new IllegalArgumentException("Thành viên không thuộc nhóm chỉ định");
        }

        if (request.memberRole() != null) {
            member.setMemberRole(request.memberRole());
        }
        if (request.status() != null) {
            if (request.status() == MemberStatus.ACTIVE && member.getStatus() != MemberStatus.ACTIVE) {
                // Reactivating member in this group: verify no other active contracts exist
                validateUserHasNoOtherActiveContract(member.getUser().getId(), groupId);
                member.setRemovedAt(null);
            }
            member.setStatus(request.status());
        }

        GroupMember saved = memberRepository.save(member);
        return toMemberResponse(saved, null);
    }

    @Transactional
    public void removeMember(UUID groupId, UUID memberId, UserPrincipal principal) {
        CoOwnershipGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Nhóm đồng sở hữu không tồn tại: " + groupId));

        if (principal != null) {
            validateGroupMembershipManagementPermission(group, principal);
        }

        GroupMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thành viên: " + memberId));

        if (!member.getGroup().getId().equals(groupId)) {
            throw new IllegalArgumentException("Thành viên không thuộc nhóm chỉ định");
        }

        if (member.getStatus() == MemberStatus.INACTIVE || member.getStatus() == MemberStatus.REMOVED) {
            throw new IllegalStateException("Thành viên đã bị xoá khỏi nhóm trước đó.");
        }

        // Multi-vehicle safety check: check ownership share across ALL vehicles associated with the group
        List<OwnershipShare> memberShares = shareRepository.findByMemberId(memberId);
        boolean hasActiveShare = memberShares.stream()
                .anyMatch(s -> s.getPercentage() != null && s.getPercentage().compareTo(BigDecimal.ZERO) > 0);

        if (hasActiveShare) {
            throw new IllegalStateException("Thành viên vẫn còn tỷ lệ sở hữu. Vui lòng chuyển hoặc cập nhật tỷ lệ sở hữu trước khi xoá khỏi nhóm.");
        }

        // Soft removal: preserve historical records, do not delete past booking/trip/handover history
        member.setStatus(MemberStatus.INACTIVE);
        member.setRemovedAt(Instant.now());
        memberRepository.save(member);
    }

    @Transactional
    public void removeMember(UUID groupId, UUID memberId) {
        removeMember(groupId, memberId, null);
    }

    /**
     * Validates that the authenticated caller is the CURRENT ACTIVE GROUP REPRESENTATIVE (Nhóm trưởng).
     *
     * Authoritative business rule:
     * - Authenticated user: role == Role.CO_OWNER
     * - GroupMember: status == MemberStatus.ACTIVE
     * - GroupMember: memberRole == GroupMemberRole.REPRESENTATIVE
     *
     * Note: coOwnershipGroup.createdBy represents the group creator ("người tạo nhóm") and is NOT
     * a permanent management authority. Only the current active representative holds member management rights.
     *
     * Architecture & Future Phase Integration Points:
     * - Phase 21 (Voting): Responsible for election and rotation of the REPRESENTATIVE role through group voting.
     * - Phase 22 (Contract & Invitation):
     *     REPRESENTATIVE -> sends invitation
     *     -> invited CO_OWNER reviews proposed ownership percentage
     *     -> invited user accepts
     *     -> electronic contract generated & signed
     *     -> GroupMember becomes ACTIVE & OwnershipShare becomes effective.
     *   Future status progression model may utilize:
     *     INVITATION_SENT -> INVITATION_ACCEPTED -> CONTRACT_PENDING -> CONTRACT_SIGNED -> ACTIVATED (or REJECTED/EXPIRED).
     */
    private void validateGroupMembershipManagementPermission(CoOwnershipGroup group, UserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new AccessDeniedException("Yêu cầu xác thực tài khoản");
        }

        User caller = principal.getUser();
        if (caller.getRole() != Role.CO_OWNER) {
            throw new AccessDeniedException("Bạn không có quyền quản lý thành viên của nhóm. Chỉ Nhóm trưởng (REPRESENTATIVE) đang hoạt động mới có quyền quản lý.");
        }

        UUID callerId = caller.getId();

        // Authority belongs EXCLUSIVELY to the current active group representative.
        // createdBy ("người tạo nhóm") is intentionally NOT a permanent management authority.
        Optional<GroupMember> callerMemberOpt = memberRepository.findByGroupIdAndUserId(group.getId(), callerId);
        if (callerMemberOpt.isPresent()) {
            GroupMember callerMember = callerMemberOpt.get();
            if (callerMember.getStatus() == MemberStatus.ACTIVE &&
                    callerMember.getMemberRole() == GroupMemberRole.REPRESENTATIVE) {
                return;
            }
        }

        throw new AccessDeniedException("Bạn không có quyền quản lý thành viên của nhóm. Chỉ Nhóm trưởng (REPRESENTATIVE) đang hoạt động mới có quyền quản lý.");
    }

    // ==========================================
    // 3. Group Vehicle Operations
    // ==========================================

    @Transactional(readOnly = true)
    public List<GroupVehicleResponse> getGroupVehicles(UUID groupId) {
        if (!groupRepository.existsById(groupId)) {
            throw new ResourceNotFoundException("Không tìm thấy nhóm đồng sở hữu: " + groupId);
        }
        return groupVehicleRepository.findByGroupId(groupId).stream()
                .map(this::toGroupVehicleResponse)
                .toList();
    }

    @Transactional
    public GroupVehicleResponse addVehicleToGroup(UUID groupId, UUID vehicleId) {
        CoOwnershipGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhóm đồng sở hữu: " + groupId));

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Xe không tồn tại: " + vehicleId));

        // Enforce 1 group = 1 vehicle invariant: A group can only have at most 1 vehicle
        List<GroupVehicle> existingGroupVehicles = groupVehicleRepository.findByGroupId(groupId);
        if (!existingGroupVehicles.isEmpty() || group.getVehicleId() != null) {
            throw new IllegalStateException("Quy tắc kinh doanh: Mỗi nhóm đồng sở hữu chỉ được liên kết với duy nhất 1 xe. Nhóm đã có xe được liên kết.");
        }

        // Enforce 1 vehicle = 1 group invariant: A vehicle can only belong to at most 1 group
        if (groupVehicleRepository.existsByVehicleIdAndStatus(vehicleId, GroupVehicleStatus.ACTIVE)
                || groupRepository.existsByVehicleId(vehicleId)) {
            throw new DuplicateResourceException("Xe này đã được liên kết với một nhóm đồng sở hữu khác");
        }

        group.setVehicleId(vehicleId);
        groupRepository.save(group);

        GroupVehicle groupVehicle = new GroupVehicle(UUID.randomUUID(), group, vehicle, GroupVehicleStatus.ACTIVE);
        GroupVehicle saved = groupVehicleRepository.save(groupVehicle);
        return toGroupVehicleResponse(saved);
    }

    @Transactional
    public void removeVehicleFromGroup(UUID groupId, UUID vehicleId) {
        GroupVehicle gv = groupVehicleRepository.findByGroupIdAndVehicleId(groupId, vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Xe không thuộc nhóm này: " + vehicleId));

        // Delete associated shares for this (group, vehicle)
        shareRepository.deleteByGroupIdAndVehicleId(groupId, vehicleId);
        groupVehicleRepository.delete(gv);

        CoOwnershipGroup group = gv.getGroup();
        if (group != null && vehicleId.equals(group.getVehicleId())) {
            group.setVehicleId(null);
            groupRepository.save(group);
        }
    }

    // ==========================================
    // 4. Ownership Share Operations
    // ==========================================

    @Transactional(readOnly = true)
    public List<OwnershipShareResponse> getOwnershipShares(UUID groupId, UUID vehicleId) {
        if (!groupRepository.existsById(groupId)) {
            throw new ResourceNotFoundException("Không tìm thấy nhóm đồng sở hữu: " + groupId);
        }
        return shareRepository.findByGroupIdAndVehicleId(groupId, vehicleId).stream()
                .map(this::toShareResponse)
                .toList();
    }

    @Transactional
    public OwnershipShareResponse assignVehicleShare(UUID groupId, UUID vehicleId, AssignShareRequest request) {
        CoOwnershipGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhóm đồng sở hữu: " + groupId));

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Xe không tồn tại: " + vehicleId));

        // Verify vehicle belongs to group
        boolean linked = groupVehicleRepository.existsByGroupIdAndVehicleId(groupId, vehicleId)
                || (group.getVehicleId() != null && group.getVehicleId().equals(vehicleId));
        if (!linked) {
            throw new IllegalArgumentException("Xe không thuộc nhóm đồng sở hữu này");
        }

        GroupMember member = memberRepository.findById(request.memberId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thành viên: " + request.memberId()));

        if (!member.getGroup().getId().equals(groupId)) {
            throw new IllegalArgumentException("Thành viên không thuộc nhóm chỉ định");
        }

        if (member.getStatus() != MemberStatus.ACTIVE) {
            throw new IllegalArgumentException("Thành viên không ở trạng thái ACTIVE");
        }

        // Authoritative single-contract check: User cannot hold active ownership in another vehicle
        validateUserHasNoOtherActiveContract(member.getUser().getId(), groupId);

        BigDecimal percentage = request.percentage().setScale(2, RoundingMode.HALF_UP);
        validatePercentageLimits(percentage);

        // Sum shares of other members for this vehicle
        List<OwnershipShare> existingShares = shareRepository.findByGroupIdAndVehicleId(groupId, vehicleId);
        BigDecimal currentOtherShares = existingShares.stream()
                .filter(s -> !s.getMember().getId().equals(member.getId()))
                .map(OwnershipShare::getPercentage)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal newTotal = currentOtherShares.add(percentage);
        if (newTotal.compareTo(MAX_TOTAL_PERCENTAGE) > 0) {
            BigDecimal maxAllowed = MAX_TOTAL_PERCENTAGE.subtract(currentOtherShares).max(BigDecimal.ZERO);
            throw new IllegalArgumentException(
                    String.format("Tổng tỷ lệ sở hữu không được vượt quá 100.00%%. Hiện tại đã phân bổ: %.2f%%, tối đa còn lại cho thành viên: %.2f%%",
                            currentOtherShares, maxAllowed)
            );
        }

        OwnershipShare share = shareRepository.findByGroupIdAndVehicleIdAndMemberId(groupId, vehicleId, member.getId())
                .orElseGet(() -> new OwnershipShare(UUID.randomUUID(), group, vehicle, member, percentage));

        share.setPercentage(percentage);
        OwnershipShare saved = shareRepository.save(share);
        return toShareResponse(saved);
    }

    // Legacy fallback support for single-group assignShare
    @Transactional
    public OwnershipShareResponse assignShare(UUID groupId, AssignShareRequest request) {
        CoOwnershipGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhóm đồng sở hữu: " + groupId));

        UUID vehicleId = resolveVehicleIdForGroup(group);
        return assignVehicleShare(groupId, vehicleId, request);
    }

    @Transactional
    public OwnershipShareResponse updateShareById(UUID groupId, UUID shareId, BigDecimal newPercentage) {
        OwnershipShare share = shareRepository.findById(shareId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tỷ lệ sở hữu: " + shareId));

        if (!share.getGroup().getId().equals(groupId)) {
            throw new IllegalArgumentException("Tỷ lệ sở hữu không thuộc nhóm chỉ định");
        }

        UUID vehicleId = share.getVehicle().getId();
        BigDecimal percentage = newPercentage.setScale(2, RoundingMode.HALF_UP);
        validatePercentageLimits(percentage);

        List<OwnershipShare> existingShares = shareRepository.findByGroupIdAndVehicleId(groupId, vehicleId);
        BigDecimal currentOtherShares = existingShares.stream()
                .filter(s -> !s.getId().equals(share.getId()))
                .map(OwnershipShare::getPercentage)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal newTotal = currentOtherShares.add(percentage);
        if (newTotal.compareTo(MAX_TOTAL_PERCENTAGE) > 0) {
            BigDecimal maxAllowed = MAX_TOTAL_PERCENTAGE.subtract(currentOtherShares).max(BigDecimal.ZERO);
            throw new IllegalArgumentException(
                    String.format("Tổng tỷ lệ sở hữu không được vượt quá 100.00%%. Hiện tại đã phân bổ: %.2f%%, tối đa còn lại cho thành viên: %.2f%%",
                            currentOtherShares, maxAllowed)
            );
        }

        share.setPercentage(percentage);
        OwnershipShare saved = shareRepository.save(share);
        return toShareResponse(saved);
    }

    // ==========================================
    // 5. Booking / Handover / Trip Compatibility Helper
    // ==========================================

    @Transactional(readOnly = true)
    public boolean isUserActiveMemberForVehicle(UUID userId, UUID vehicleId) {
        List<GroupVehicle> gvs = groupVehicleRepository.findByVehicleIdAndStatus(vehicleId, GroupVehicleStatus.ACTIVE);
        if (gvs.isEmpty()) {
            // Check legacy vehicle_id
            Optional<CoOwnershipGroup> legacyGroup = groupRepository.findByVehicleId(vehicleId);
            if (legacyGroup.isEmpty()) {
                // No group constraints configured for this vehicle
                return true;
            }
            return memberRepository.existsByGroupIdAndUserIdAndStatus(legacyGroup.get().getId(), userId, MemberStatus.ACTIVE);
        }

        // Must be active member in at least one of the active groups owning this vehicle
        for (GroupVehicle gv : gvs) {
            if (memberRepository.existsByGroupIdAndUserIdAndStatus(gv.getGroup().getId(), userId, MemberStatus.ACTIVE)) {
                return true;
            }
        }
        return false;
    }

    // ==========================================
    // 6. Private Helpers & Mappers
    // ==========================================

    private UUID resolveVehicleIdForGroup(CoOwnershipGroup group) {
        List<GroupVehicle> gvs = groupVehicleRepository.findByGroupIdAndStatus(group.getId(), GroupVehicleStatus.ACTIVE);
        if (!gvs.isEmpty()) {
            return gvs.get(0).getVehicle().getId();
        }
        if (group.getVehicleId() != null) {
            return group.getVehicleId();
        }
        throw new ResourceNotFoundException("Nhóm chưa được liên kết với xe nào");
    }

    private void validatePercentageLimits(BigDecimal percentage) {
        if (percentage.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Tỷ lệ sở hữu phải lớn hơn 0%");
        }
        if (percentage.compareTo(MAX_TOTAL_PERCENTAGE) > 0) {
            throw new IllegalArgumentException("Tỷ lệ sở hữu không được vượt quá 100%");
        }
    }

    private CoOwnershipGroupResponse toGroupResponse(CoOwnershipGroup group, Vehicle targetVehicle) {
        List<GroupVehicle> allGvs = groupVehicleRepository.findByGroupId(group.getId());
        if (allGvs.size() > 1) {
            throw new IllegalStateException("Dữ liệu không hợp lệ: Nhóm đồng sở hữu " + group.getId() + " có nhiều hơn 1 xe liên kết (" + allGvs.size() + " xe). Quy tắc bắt buộc: 1 nhóm = 1 xe.");
        }
        List<GroupVehicle> gvs = allGvs.stream()
                .filter(gv -> gv.getStatus() == GroupVehicleStatus.ACTIVE)
                .toList();

        // Resolve target vehicle if not provided
        Vehicle activeVehicle = targetVehicle;
        if (activeVehicle == null) {
            if (!gvs.isEmpty()) {
                activeVehicle = gvs.get(0).getVehicle();
            } else if (group.getVehicleId() != null) {
                activeVehicle = vehicleRepository.findById(group.getVehicleId()).orElse(null);
            }
        }

        UUID vehicleId = activeVehicle != null ? activeVehicle.getId() : null;
        String vehicleCode = activeVehicle != null ? activeVehicle.getVehicleCode() : null;

        // Fetch ACTIVE members (or all if none active)
        List<GroupMember> members = memberRepository.findByGroupId(group.getId());

        List<GroupMemberResponse> memberResponses = members.stream()
                .filter(m -> m.getStatus() == MemberStatus.ACTIVE)
                .map(m -> toMemberResponse(m, vehicleId))
                .toList();

        // Calculate total percentage for active vehicle
        BigDecimal total = BigDecimal.ZERO;
        if (vehicleId != null) {
            total = shareRepository.sumPercentageByGroupIdAndVehicleId(group.getId(), vehicleId);
            if (total == null) total = BigDecimal.ZERO;
        }

        BigDecimal available = MAX_TOTAL_PERCENTAGE.subtract(total).max(BigDecimal.ZERO);
        String statusLabel = total.compareTo(MAX_TOTAL_PERCENTAGE) == 0 ? STATUS_LABEL_COMPLETE : STATUS_LABEL_INCOMPLETE;

        List<GroupVehicleResponse> vehicles = groupVehicleRepository.findByGroupId(group.getId()).stream()
                .map(this::toGroupVehicleResponse)
                .toList();

        return new CoOwnershipGroupResponse(
                group.getId(),
                group.getName(),
                group.getStatus(),
                group.getCreatedBy(),
                group.getCreatedAt(),
                group.getUpdatedAt(),
                memberResponses,
                vehicles,
                vehicleId,
                vehicleCode,
                total,
                available,
                statusLabel
        );
    }

    private GroupMemberResponse toMemberResponse(GroupMember member, UUID vehicleId) {
        OwnershipShareResponse shareResponse = null;
        if (vehicleId != null) {
            shareResponse = shareRepository.findByGroupIdAndVehicleIdAndMemberId(member.getGroup().getId(), vehicleId, member.getId())
                    .map(this::toShareResponse)
                    .orElse(null);
        } else {
            // Pick first share if no vehicle specified
            List<OwnershipShare> shares = shareRepository.findByMemberId(member.getId());
            if (!shares.isEmpty()) {
                shareResponse = toShareResponse(shares.get(0));
            }
        }

        User u = member.getUser();
        return new GroupMemberResponse(
                member.getId(),
                member.getGroup().getId(),
                u.getId(),
                u.getFullName(),
                u.getEmail(),
                u.getRole().name(),
                member.getMemberRole(),
                member.getStatus(),
                member.getJoinedAt(),
                member.getRemovedAt(),
                shareResponse
        );
    }

    private GroupVehicleResponse toGroupVehicleResponse(GroupVehicle gv) {
        Vehicle v = gv.getVehicle();
        return new GroupVehicleResponse(
                gv.getId(),
                gv.getGroup().getId(),
                v.getId(),
                v.getVehicleCode(),
                v.getModel(),
                gv.getStatus(),
                gv.getAddedAt()
        );
    }

    private OwnershipShareResponse toShareResponse(OwnershipShare share) {
        return new OwnershipShareResponse(
                share.getId(),
                share.getGroup().getId(),
                share.getVehicle().getId(),
                share.getMember().getId(),
                share.getPercentage(),
                share.getUpdatedAt() != null ? share.getUpdatedAt() : share.getCreatedAt()
        );
    }
}
