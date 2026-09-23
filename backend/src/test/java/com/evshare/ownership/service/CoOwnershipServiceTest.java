package com.evshare.ownership.service;

import com.evshare.ownership.dto.AssignShareRequest;
import com.evshare.ownership.entity.CoOwnershipGroup;
import com.evshare.ownership.entity.GroupMember;
import com.evshare.ownership.entity.MemberStatus;
import com.evshare.ownership.entity.OwnershipShare;
import com.evshare.ownership.repository.CoOwnershipGroupRepository;
import com.evshare.ownership.repository.GroupMemberRepository;
import com.evshare.ownership.repository.OwnershipShareRepository;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import com.evshare.user.entity.UserStatus;
import com.evshare.user.repository.UserRepository;
import com.evshare.vehicle.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CoOwnershipServiceTest {

    @Mock
    private CoOwnershipGroupRepository groupRepository;

    @Mock
    private GroupMemberRepository memberRepository;

    @Mock
    private OwnershipShareRepository shareRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CoOwnershipService coOwnershipService;

    private UUID groupId;
    private UUID vehicleId;
    private UUID memberAId;
    private UUID memberBId;
    private CoOwnershipGroup group;
    private GroupMember memberA;
    private GroupMember memberB;

    @BeforeEach
    void setUp() {
        groupId = UUID.randomUUID();
        vehicleId = UUID.randomUUID();
        memberAId = UUID.randomUUID();
        memberBId = UUID.randomUUID();

        group = new CoOwnershipGroup(groupId, vehicleId, "EV01 Co-ownership Group");

        User userA = new User(UUID.randomUUID(), "owner_a@evshare.com", "hash", "Nguyen Van A", Role.CO_OWNER, UserStatus.ACTIVE);
        User userB = new User(UUID.randomUUID(), "owner_b@evshare.com", "hash", "Tran Thi B", Role.CO_OWNER, UserStatus.ACTIVE);

        memberA = new GroupMember(memberAId, group, userA, MemberStatus.ACTIVE);
        memberB = new GroupMember(memberBId, group, userB, MemberStatus.ACTIVE);
    }

    @Test
    @DisplayName("Should successfully assign share when total percentage <= 100%")
    void shouldAssignShareSuccessfully() {
        when(groupRepository.findById(groupId)).thenReturn(Optional.of(group));
        when(memberRepository.findById(memberAId)).thenReturn(Optional.of(memberA));
        when(shareRepository.findByGroupId(groupId)).thenReturn(List.of());
        when(shareRepository.findByGroupIdAndMemberId(groupId, memberAId)).thenReturn(Optional.empty());

        OwnershipShare savedShare = new OwnershipShare(UUID.randomUUID(), group, memberA, new BigDecimal("40.00"));
        when(shareRepository.save(any(OwnershipShare.class))).thenReturn(savedShare);

        AssignShareRequest request = new AssignShareRequest(memberAId, new BigDecimal("40.00"));
        var response = coOwnershipService.assignShare(groupId, request);

        assertNotNull(response);
        assertEquals(new BigDecimal("40.00"), response.percentage());
        verify(shareRepository, times(1)).save(any(OwnershipShare.class));
    }

    @Test
    @DisplayName("Should reject share assignment when total percentage exceeds 100%")
    void shouldRejectShareWhenTotalExceeds100() {
        when(groupRepository.findById(groupId)).thenReturn(Optional.of(group));
        when(memberRepository.findById(memberBId)).thenReturn(Optional.of(memberB));

        // Member A already has 70% share
        OwnershipShare shareA = new OwnershipShare(UUID.randomUUID(), group, memberA, new BigDecimal("70.00"));
        when(shareRepository.findByGroupId(groupId)).thenReturn(List.of(shareA));

        // Attempting to give Member B 40% (70% + 40% = 110% > 100%)
        AssignShareRequest request = new AssignShareRequest(memberBId, new BigDecimal("40.00"));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            coOwnershipService.assignShare(groupId, request);
        });

        assertTrue(exception.getMessage().contains("Total ownership percentage cannot exceed 100.00%"));
        verify(shareRepository, never()).save(any(OwnershipShare.class));
    }

    @Test
    @DisplayName("Should reject share when percentage <= 0")
    void shouldRejectZeroOrNegativePercentage() {
        when(groupRepository.findById(groupId)).thenReturn(Optional.of(group));
        when(memberRepository.findById(memberAId)).thenReturn(Optional.of(memberA));

        AssignShareRequest request = new AssignShareRequest(memberAId, new BigDecimal("0.00"));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            coOwnershipService.assignShare(groupId, request);
        });

        assertTrue(exception.getMessage().contains("must be greater than 0%"));
        verify(shareRepository, never()).save(any(OwnershipShare.class));
    }
}
