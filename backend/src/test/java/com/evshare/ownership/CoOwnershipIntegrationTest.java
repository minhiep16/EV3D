package com.evshare.ownership;

import com.evshare.ownership.dto.AddMemberRequest;
import com.evshare.ownership.dto.AssignShareRequest;
import com.evshare.ownership.dto.CoOwnershipGroupResponse;
import com.evshare.ownership.dto.UpdateMemberRequest;
import com.evshare.ownership.entity.GroupMemberRole;
import com.evshare.ownership.entity.MemberStatus;
import com.evshare.ownership.service.CoOwnershipService;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import com.evshare.user.entity.UserStatus;
import com.evshare.user.repository.UserRepository;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.entity.VehicleStatus;
import com.evshare.vehicle.repository.VehicleRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class CoOwnershipIntegrationTest {

    private static final UUID EV01_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID DEMO_GROUP_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Autowired
    private CoOwnershipService coOwnershipService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Test
    @DisplayName("Manual Test 29: Seed data integrity and 100% complete status")
    void testSeedDataIntegrity() {
        CoOwnershipGroupResponse group = coOwnershipService.getCoOwnershipByVehicleId(EV01_ID);

        assertNotNull(group, "Group must exist for EV01");
        assertEquals(DEMO_GROUP_ID, group.id(), "Group ID must match seeded ID");
        assertEquals("EV01 Co-ownership Group", group.name());
        assertEquals(3, group.members().size(), "Must have 3 initial active members");

        // Verify members come from DB
        var memberNames = group.members().stream().map(m -> m.fullName()).toList();
        assertTrue(memberNames.contains("Nguyen Van A"));
        assertTrue(memberNames.contains("Tran Thi B"));
        assertTrue(memberNames.contains("Le Van C"));

        // Verify total percentage == 100.00% and statusLabel == HOÀN CHỈNH
        assertEquals(new BigDecimal("100.00"), group.totalOwnershipPercentage());
        assertEquals(new BigDecimal("0.00"), group.availablePercentage());
        assertEquals("HOÀN CHỈNH", group.statusLabel());
    }

    @Test
    @DisplayName("Manual Test 30: Dynamic members addition and deactivation")
    void testDynamicMembers() {
        // 1. Create a 4th user
        User user4 = new User(
                UUID.randomUUID(),
                "owner_d_" + System.currentTimeMillis() + "@evshare.com",
                "$2a$10$PEBBrUTFUQoMPa5cTMlCqe2p7WRvtzRsTutRSzz3Omw5kkYIAMVlW",
                "Hoang Van D",
                Role.CO_OWNER,
                UserStatus.ACTIVE
        );
        userRepository.save(user4);

        // 2. Add 4th member to the group
        var addedMember = coOwnershipService.addMember(
                DEMO_GROUP_ID,
                new AddMemberRequest(user4.getId(), GroupMemberRole.MEMBER, MemberStatus.ACTIVE)
        );
        assertNotNull(addedMember);

        // 3. Verify API returns 4 active members
        CoOwnershipGroupResponse groupWith4 = coOwnershipService.getCoOwnershipByVehicleId(EV01_ID);
        assertEquals(4, groupWith4.members().size(), "Should have 4 active members now");

        // 4. Deactivate 4th member
        coOwnershipService.updateMember(
                DEMO_GROUP_ID,
                addedMember.id(),
                new UpdateMemberRequest(GroupMemberRole.MEMBER, MemberStatus.INACTIVE)
        );

        // 5. Verify deactivated member disappears from active 3D view
        CoOwnershipGroupResponse groupAfterDeactivation = coOwnershipService.getCoOwnershipByVehicleId(EV01_ID);
        assertEquals(3, groupAfterDeactivation.members().size(), "Should return to 3 active members, no stale orb");
        assertFalse(groupAfterDeactivation.members().stream().anyMatch(m -> m.id().equals(addedMember.id())));
    }

    @Test
    @DisplayName("Manual Test 31: Share validation rules (<= 100%, reject > 100%, reject <= 0%)")
    void testShareValidationRules() {
        var group = coOwnershipService.getCoOwnershipByVehicleId(EV01_ID);
        var memberA = group.members().stream()
                .filter(m -> "Nguyen Van A".equals(m.fullName()))
                .findFirst()
                .orElseThrow();

        // Negative percentage -> rejected
        assertThrows(IllegalArgumentException.class, () -> {
            coOwnershipService.assignVehicleShare(DEMO_GROUP_ID, EV01_ID, new AssignShareRequest(memberA.id(), new BigDecimal("-10.00")));
        });

        // Zero percentage -> rejected
        assertThrows(IllegalArgumentException.class, () -> {
            coOwnershipService.assignVehicleShare(DEMO_GROUP_ID, EV01_ID, new AssignShareRequest(memberA.id(), new BigDecimal("0.00")));
        });

        // > 100 for one member -> rejected
        assertThrows(IllegalArgumentException.class, () -> {
            coOwnershipService.assignVehicleShare(DEMO_GROUP_ID, EV01_ID, new AssignShareRequest(memberA.id(), new BigDecimal("105.00")));
        });

        // 60 + 50 (Member A has 40%, other 2 have 30%+30%=60%. Giving Member A 50% = 110% > 100%) -> rejected
        assertThrows(IllegalArgumentException.class, () -> {
            coOwnershipService.assignVehicleShare(DEMO_GROUP_ID, EV01_ID, new AssignShareRequest(memberA.id(), new BigDecimal("50.00")));
        });

        // Valid but incomplete (giving Member A 20% instead of 40% -> total = 20 + 30 + 30 = 80%)
        coOwnershipService.assignVehicleShare(DEMO_GROUP_ID, EV01_ID, new AssignShareRequest(memberA.id(), new BigDecimal("20.00")));
        CoOwnershipGroupResponse incompleteGroup = coOwnershipService.getCoOwnershipByVehicleId(EV01_ID);
        assertEquals(new BigDecimal("80.00"), incompleteGroup.totalOwnershipPercentage());
        assertEquals(new BigDecimal("20.00"), incompleteGroup.availablePercentage());
        assertEquals("CHƯA PHÂN BỔ ĐỦ", incompleteGroup.statusLabel());
    }

    @Test
    @DisplayName("Manual Test 32: Multi-vehicle readiness (EV01 vs EV02 shares are isolated)")
    void testMultiVehicleReadiness() {
        // Create second vehicle EV02
        Vehicle ev02 = new Vehicle(
                UUID.randomUUID(),
                "EV02",
                "VinFast",
                "VF9",
                2024,
                "30A-99999",
                "VIN-EV02-TEST-99999",
                new BigDecimal("123.0"),
                95,
                new BigDecimal("500.0"),
                VehicleStatus.AVAILABLE,
                "/models/ev-car.glb"
        );
        vehicleRepository.save(ev02);

        // Associate EV02 with same demo group
        coOwnershipService.addVehicleToGroup(DEMO_GROUP_ID, ev02.getId());

        // Get group for EV01: total is 100%
        CoOwnershipGroupResponse groupEv01 = coOwnershipService.getCoOwnershipByVehicleId(EV01_ID);
        assertEquals(new BigDecimal("100.00"), groupEv01.totalOwnershipPercentage());

        // Get group for EV02: total is 0% (shares not yet allocated for EV02)
        CoOwnershipGroupResponse groupEv02 = coOwnershipService.getCoOwnershipByVehicleId(ev02.getId());
        assertEquals(new BigDecimal("0.00"), groupEv02.totalOwnershipPercentage());
        assertEquals("CHƯA PHÂN BỔ ĐỦ", groupEv02.statusLabel());

        // Assign 70% of EV02 to Member A
        var memberA = groupEv02.members().get(0);
        coOwnershipService.assignVehicleShare(DEMO_GROUP_ID, ev02.getId(), new AssignShareRequest(memberA.id(), new BigDecimal("70.00")));

        // Verify EV02 has 70% allocated
        CoOwnershipGroupResponse groupEv02Updated = coOwnershipService.getCoOwnershipByVehicleId(ev02.getId());
        assertEquals(new BigDecimal("70.00"), groupEv02Updated.totalOwnershipPercentage());

        // Verify EV01 STILL has 100% allocated (completely isolated!)
        CoOwnershipGroupResponse groupEv01After = coOwnershipService.getCoOwnershipByVehicleId(EV01_ID);
        assertEquals(new BigDecimal("100.00"), groupEv01After.totalOwnershipPercentage());
    }
}
