package com.evshare.ownership.service;

import com.evshare.ownership.dto.AssignShareRequest;
import com.evshare.ownership.entity.*;
import com.evshare.ownership.repository.CoOwnershipGroupRepository;
import com.evshare.ownership.repository.GroupMemberRepository;
import com.evshare.ownership.repository.GroupVehicleRepository;
import com.evshare.ownership.repository.OwnershipShareRepository;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import com.evshare.user.entity.UserStatus;
import com.evshare.user.repository.UserRepository;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.entity.VehicleStatus;
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
    private GroupVehicleRepository groupVehicleRepository;

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
    private UUID vehicle2Id;
    private UUID memberAId;
    private UUID memberBId;
    private CoOwnershipGroup group;
    private Vehicle vehicle;
    private Vehicle vehicle2;
    private GroupMember memberA;
    private GroupMember memberB;

    @BeforeEach
    void setUp() {
        groupId = UUID.randomUUID();
        vehicleId = UUID.randomUUID();
        vehicle2Id = UUID.randomUUID();
        memberAId = UUID.randomUUID();
        memberBId = UUID.randomUUID();

        group = new CoOwnershipGroup(groupId, "EVShare Demo Group", GroupStatus.ACTIVE, null);
        vehicle = createTestVehicle(vehicleId, "EV01", "VF8");
        vehicle2 = createTestVehicle(vehicle2Id, "EV02", "VF9");

        User userA = new User(UUID.randomUUID(), "owner_a@evshare.com", "hash", "Nguyen Van A", Role.CO_OWNER, UserStatus.ACTIVE);
        User userB = new User(UUID.randomUUID(), "owner_b@evshare.com", "hash", "Tran Thi B", Role.CO_OWNER, UserStatus.ACTIVE);

        memberA = new GroupMember(memberAId, group, userA, GroupMemberRole.REPRESENTATIVE, MemberStatus.ACTIVE);
        memberB = new GroupMember(memberBId, group, userB, GroupMemberRole.MEMBER, MemberStatus.ACTIVE);
    }

    private Vehicle createTestVehicle(UUID id, String name, String model) {
        return new Vehicle(
                id, name, "VinFast", model, 2024,
                "30A-" + name, "VIN-" + name, new BigDecimal("82.0"),
                90, new BigDecimal("1500.0"), VehicleStatus.AVAILABLE, "/models/ev-car.glb"
        );
    }

    @Test
    @DisplayName("Should successfully assign share when total percentage <= 100% (40 + 30 + 30 model)")
    void shouldAssignShareSuccessfully() {
        when(groupRepository.findById(groupId)).thenReturn(Optional.of(group));
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(groupVehicleRepository.existsByGroupIdAndVehicleId(groupId, vehicleId)).thenReturn(true);
        when(memberRepository.findById(memberAId)).thenReturn(Optional.of(memberA));
        when(shareRepository.findByGroupIdAndVehicleId(groupId, vehicleId)).thenReturn(List.of());
        when(shareRepository.findByGroupIdAndVehicleIdAndMemberId(groupId, vehicleId, memberAId)).thenReturn(Optional.empty());

        OwnershipShare savedShare = new OwnershipShare(UUID.randomUUID(), group, vehicle, memberA, new BigDecimal("40.00"));
        when(shareRepository.save(any(OwnershipShare.class))).thenReturn(savedShare);

        AssignShareRequest request = new AssignShareRequest(memberAId, new BigDecimal("40.00"));
        var response = coOwnershipService.assignVehicleShare(groupId, vehicleId, request);

        assertNotNull(response);
        assertEquals(new BigDecimal("40.00"), response.percentage());
        verify(shareRepository, times(1)).save(any(OwnershipShare.class));
    }

    @Test
    @DisplayName("Should reject share assignment when total percentage exceeds 100%")
    void shouldRejectShareWhenTotalExceeds100() {
        when(groupRepository.findById(groupId)).thenReturn(Optional.of(group));
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(groupVehicleRepository.existsByGroupIdAndVehicleId(groupId, vehicleId)).thenReturn(true);
        when(memberRepository.findById(memberBId)).thenReturn(Optional.of(memberB));

        // Member A already has 70% share for this vehicle
        OwnershipShare shareA = new OwnershipShare(UUID.randomUUID(), group, vehicle, memberA, new BigDecimal("70.00"));
        when(shareRepository.findByGroupIdAndVehicleId(groupId, vehicleId)).thenReturn(List.of(shareA));

        // Attempting to give Member B 40% (70% + 40% = 110% > 100%)
        AssignShareRequest request = new AssignShareRequest(memberBId, new BigDecimal("40.00"));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            coOwnershipService.assignVehicleShare(groupId, vehicleId, request);
        });

        assertTrue(exception.getMessage().contains("Tổng tỷ lệ sở hữu không được vượt quá 100.00%"));
        verify(shareRepository, never()).save(any(OwnershipShare.class));
    }

    @Test
    @DisplayName("Should reject share when percentage <= 0")
    void shouldRejectZeroOrNegativePercentage() {
        when(groupRepository.findById(groupId)).thenReturn(Optional.of(group));
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(groupVehicleRepository.existsByGroupIdAndVehicleId(groupId, vehicleId)).thenReturn(true);
        when(memberRepository.findById(memberAId)).thenReturn(Optional.of(memberA));

        AssignShareRequest request = new AssignShareRequest(memberAId, new BigDecimal("0.00"));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            coOwnershipService.assignVehicleShare(groupId, vehicleId, request);
        });

        assertTrue(exception.getMessage().contains("Tỷ lệ sở hữu phải lớn hơn 0%"));
        verify(shareRepository, never()).save(any(OwnershipShare.class));
    }

    @Test
    @DisplayName("Multi-vehicle readiness: Shares are isolated per vehicle within same group")
    void shouldIsolateSharesPerVehicle() {
        when(groupRepository.findById(groupId)).thenReturn(Optional.of(group));
        when(vehicleRepository.findById(vehicle2Id)).thenReturn(Optional.of(vehicle2));
        when(groupVehicleRepository.existsByGroupIdAndVehicleId(groupId, vehicle2Id)).thenReturn(true);
        when(memberRepository.findById(memberAId)).thenReturn(Optional.of(memberA));

        // vehicle 1 has 100% allocated, but vehicle 2 has 0% allocated
        when(shareRepository.findByGroupIdAndVehicleId(groupId, vehicle2Id)).thenReturn(List.of());
        when(shareRepository.findByGroupIdAndVehicleIdAndMemberId(groupId, vehicle2Id, memberAId)).thenReturn(Optional.empty());

        OwnershipShare savedShare = new OwnershipShare(UUID.randomUUID(), group, vehicle2, memberA, new BigDecimal("60.00"));
        when(shareRepository.save(any(OwnershipShare.class))).thenReturn(savedShare);

        AssignShareRequest request = new AssignShareRequest(memberAId, new BigDecimal("60.00"));
        var response = coOwnershipService.assignVehicleShare(groupId, vehicle2Id, request);

        assertNotNull(response);
        assertEquals(new BigDecimal("60.00"), response.percentage());
        verify(shareRepository, times(1)).save(any(OwnershipShare.class));
    }

    @Test
    @DisplayName("Should verify active membership for booking compatibility")
    void shouldVerifyActiveMembership() {
        GroupVehicle gv = new GroupVehicle(UUID.randomUUID(), group, vehicle, GroupVehicleStatus.ACTIVE);
        when(groupVehicleRepository.findByVehicleIdAndStatus(vehicleId, GroupVehicleStatus.ACTIVE)).thenReturn(List.of(gv));
        when(memberRepository.existsByGroupIdAndUserIdAndStatus(groupId, memberA.getUser().getId(), MemberStatus.ACTIVE)).thenReturn(true);

        boolean isMember = coOwnershipService.isUserActiveMemberForVehicle(memberA.getUser().getId(), vehicleId);
        assertTrue(isMember);

        UUID nonMemberId = UUID.randomUUID();
        when(memberRepository.existsByGroupIdAndUserIdAndStatus(groupId, nonMemberId, MemberStatus.ACTIVE)).thenReturn(false);
        boolean isNonMember = coOwnershipService.isUserActiveMemberForVehicle(nonMemberId, vehicleId);
        assertFalse(isNonMember);
    }
}
