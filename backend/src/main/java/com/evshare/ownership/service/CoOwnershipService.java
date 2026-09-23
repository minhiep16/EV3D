package com.evshare.ownership.service;

import com.evshare.common.exception.DuplicateResourceException;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.ownership.dto.*;
import com.evshare.ownership.entity.CoOwnershipGroup;
import com.evshare.ownership.entity.GroupMember;
import com.evshare.ownership.entity.MemberStatus;
import com.evshare.ownership.entity.OwnershipShare;
import com.evshare.ownership.repository.CoOwnershipGroupRepository;
import com.evshare.ownership.repository.GroupMemberRepository;
import com.evshare.ownership.repository.OwnershipShareRepository;
import com.evshare.user.entity.User;
import com.evshare.user.repository.UserRepository;
import com.evshare.vehicle.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
public class CoOwnershipService {

    private static final BigDecimal MAX_TOTAL_PERCENTAGE = new BigDecimal("100.00");

    private final CoOwnershipGroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final OwnershipShareRepository shareRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    public CoOwnershipService(
            CoOwnershipGroupRepository groupRepository,
            GroupMemberRepository memberRepository,
            OwnershipShareRepository shareRepository,
            VehicleRepository vehicleRepository,
            UserRepository userRepository
    ) {
        this.groupRepository = groupRepository;
        this.memberRepository = memberRepository;
        this.shareRepository = shareRepository;
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public CoOwnershipGroupResponse getCoOwnershipByVehicleId(UUID vehicleId) {
        if (!vehicleRepository.existsById(vehicleId)) {
            throw new ResourceNotFoundException("Vehicle not found: " + vehicleId);
        }

        CoOwnershipGroup group = groupRepository.findByVehicleId(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("No co-ownership group found for vehicle: " + vehicleId));

        return toGroupResponse(group);
    }

    @Transactional
    public CoOwnershipGroupResponse createCoOwnershipGroup(UUID vehicleId, CreateGroupRequest request) {
        if (!vehicleRepository.existsById(vehicleId)) {
            throw new ResourceNotFoundException("Vehicle not found: " + vehicleId);
        }

        if (groupRepository.existsByVehicleId(vehicleId)) {
            throw new DuplicateResourceException("Co-ownership group already exists for vehicle: " + vehicleId);
        }

        CoOwnershipGroup group = new CoOwnershipGroup(UUID.randomUUID(), vehicleId, request.name());
        CoOwnershipGroup saved = groupRepository.save(group);
        return toGroupResponse(saved);
    }

    @Transactional
    public GroupMemberResponse addMember(UUID groupId, AddMemberRequest request) {
        CoOwnershipGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Co-ownership group not found: " + groupId));

        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.userId()));

        if (memberRepository.existsByGroupIdAndUserId(groupId, user.getId())) {
            throw new DuplicateResourceException("User is already a member of this co-ownership group");
        }

        GroupMember member = new GroupMember(UUID.randomUUID(), group, user, MemberStatus.ACTIVE);
        GroupMember saved = memberRepository.save(member);
        return toMemberResponse(saved);
    }

    @Transactional
    public OwnershipShareResponse assignShare(UUID groupId, AssignShareRequest request) {
        CoOwnershipGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Co-ownership group not found: " + groupId));

        GroupMember member = memberRepository.findById(request.memberId())
                .orElseThrow(() -> new ResourceNotFoundException("Group member not found: " + request.memberId()));

        if (!member.getGroup().getId().equals(groupId)) {
            throw new IllegalArgumentException("Member does not belong to the specified co-ownership group");
        }

        BigDecimal percentage = request.percentage().setScale(2, RoundingMode.HALF_UP);
        validatePercentageLimits(percentage);

        // Calculate other members' share total
        List<OwnershipShare> existingShares = shareRepository.findByGroupId(groupId);
        BigDecimal currentOtherShares = existingShares.stream()
                .filter(s -> !s.getMember().getId().equals(member.getId()))
                .map(OwnershipShare::getPercentage)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal newTotal = currentOtherShares.add(percentage);
        if (newTotal.compareTo(MAX_TOTAL_PERCENTAGE) > 0) {
            BigDecimal maxAllowed = MAX_TOTAL_PERCENTAGE.subtract(currentOtherShares);
            throw new IllegalArgumentException(
                    String.format("Total ownership percentage cannot exceed 100.00%%. Current allocated: %.2f%%, max available for this member: %.2f%%",
                            currentOtherShares, maxAllowed.max(BigDecimal.ZERO))
            );
        }

        OwnershipShare share = shareRepository.findByGroupIdAndMemberId(groupId, member.getId())
                .orElseGet(() -> new OwnershipShare(UUID.randomUUID(), group, member, percentage));

        share.setPercentage(percentage);
        OwnershipShare saved = shareRepository.save(share);
        return toShareResponse(saved);
    }

    @Transactional
    public OwnershipShareResponse updateShareById(UUID groupId, UUID shareId, BigDecimal newPercentage) {
        CoOwnershipGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Co-ownership group not found: " + groupId));

        OwnershipShare share = shareRepository.findById(shareId)
                .orElseThrow(() -> new ResourceNotFoundException("Ownership share not found: " + shareId));

        if (!share.getGroup().getId().equals(groupId)) {
            throw new IllegalArgumentException("Share does not belong to the specified co-ownership group");
        }

        BigDecimal percentage = newPercentage.setScale(2, RoundingMode.HALF_UP);
        validatePercentageLimits(percentage);

        List<OwnershipShare> existingShares = shareRepository.findByGroupId(groupId);
        BigDecimal currentOtherShares = existingShares.stream()
                .filter(s -> !s.getId().equals(share.getId()))
                .map(OwnershipShare::getPercentage)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal newTotal = currentOtherShares.add(percentage);
        if (newTotal.compareTo(MAX_TOTAL_PERCENTAGE) > 0) {
            BigDecimal maxAllowed = MAX_TOTAL_PERCENTAGE.subtract(currentOtherShares);
            throw new IllegalArgumentException(
                    String.format("Total ownership percentage cannot exceed 100.00%%. Current allocated: %.2f%%, max available for this member: %.2f%%",
                            currentOtherShares, maxAllowed.max(BigDecimal.ZERO))
            );
        }

        share.setPercentage(percentage);
        OwnershipShare saved = shareRepository.save(share);
        return toShareResponse(saved);
    }

    private void validatePercentageLimits(BigDecimal percentage) {
        if (percentage.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Ownership percentage must be greater than 0%");
        }
        if (percentage.compareTo(MAX_TOTAL_PERCENTAGE) > 0) {
            throw new IllegalArgumentException("Ownership percentage cannot exceed 100%");
        }
    }

    private CoOwnershipGroupResponse toGroupResponse(CoOwnershipGroup group) {
        List<GroupMember> members = memberRepository.findByGroupId(group.getId());
        List<GroupMemberResponse> memberResponses = members.stream()
                .map(this::toMemberResponse)
                .toList();

        BigDecimal total = memberResponses.stream()
                .map(m -> m.share() != null ? m.share().percentage() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal available = MAX_TOTAL_PERCENTAGE.subtract(total).max(BigDecimal.ZERO);

        return new CoOwnershipGroupResponse(
                group.getId(),
                group.getVehicleId(),
                group.getName(),
                group.getCreatedAt(),
                memberResponses,
                total,
                available
        );
    }

    private GroupMemberResponse toMemberResponse(GroupMember member) {
        OwnershipShareResponse shareResponse = shareRepository.findByMemberId(member.getId())
                .map(this::toShareResponse)
                .orElse(null);

        User u = member.getUser();
        return new GroupMemberResponse(
                member.getId(),
                u.getId(),
                u.getFullName(),
                u.getEmail(),
                u.getRole().name(),
                member.getStatus(),
                member.getJoinedAt(),
                shareResponse
        );
    }

    private OwnershipShareResponse toShareResponse(OwnershipShare share) {
        return new OwnershipShareResponse(
                share.getId(),
                share.getMember().getId(),
                share.getPercentage(),
                share.getUpdatedAt() != null ? share.getUpdatedAt() : share.getCreatedAt()
        );
    }
}
