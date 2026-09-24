package com.evshare.ownership.service;

import com.evshare.common.exception.DuplicateResourceException;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.ownership.dto.*;
import com.evshare.ownership.entity.*;
import com.evshare.ownership.repository.CoOwnershipGroupRepository;
import com.evshare.ownership.repository.GroupMemberRepository;
import com.evshare.ownership.repository.GroupVehicleRepository;
import com.evshare.ownership.repository.OwnershipShareRepository;
import com.evshare.user.entity.User;
import com.evshare.user.repository.UserRepository;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

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
            group = gvs.get(0).getGroup();
        } else {
            // 2. Fallback to legacy vehicle_id on group
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

    @Transactional
    public GroupMemberResponse addMember(UUID groupId, AddMemberRequest request) {
        CoOwnershipGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhóm đồng sở hữu: " + groupId));

        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại: " + request.userId()));

        if (memberRepository.existsByGroupIdAndUserId(groupId, user.getId())) {
            throw new DuplicateResourceException("Người dùng đã là thành viên của nhóm đồng sở hữu này");
        }

        GroupMemberRole role = request.memberRole() != null ? request.memberRole() : GroupMemberRole.MEMBER;
        MemberStatus status = request.status() != null ? request.status() : MemberStatus.ACTIVE;

        GroupMember member = new GroupMember(UUID.randomUUID(), group, user, role, status);
        GroupMember saved = memberRepository.save(member);
        return toMemberResponse(saved, null);
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
            member.setStatus(request.status());
        }

        GroupMember saved = memberRepository.save(member);
        return toMemberResponse(saved, null);
    }

    @Transactional
    public void removeMember(UUID groupId, UUID memberId) {
        GroupMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thành viên: " + memberId));

        if (!member.getGroup().getId().equals(groupId)) {
            throw new IllegalArgumentException("Thành viên không thuộc nhóm chỉ định");
        }

        // Set status to REMOVED and remove their shares
        member.setStatus(MemberStatus.REMOVED);
        shareRepository.deleteByMemberId(memberId);
        memberRepository.save(member);
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

        if (groupVehicleRepository.existsByGroupIdAndVehicleId(groupId, vehicleId)) {
            throw new DuplicateResourceException("Xe này đã được liên kết với nhóm");
        }

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
        // Resolve target vehicle if not provided
        Vehicle activeVehicle = targetVehicle;
        if (activeVehicle == null) {
            List<GroupVehicle> gvs = groupVehicleRepository.findByGroupIdAndStatus(group.getId(), GroupVehicleStatus.ACTIVE);
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
