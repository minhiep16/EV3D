package com.evshare.damage.service;

import com.evshare.booking.entity.Booking;
import com.evshare.booking.entity.BookingStatus;
import com.evshare.common.exception.ResourceNotFoundException;
import com.evshare.damage.dto.CreateDamageRequest;
import com.evshare.damage.dto.DamageRecordResponse;
import com.evshare.damage.entity.DamageRecord;
import com.evshare.damage.entity.DamageSeverity;
import com.evshare.damage.entity.DamageType;
import com.evshare.damage.repository.DamageRecordRepository;
import com.evshare.handover.entity.VehicleHandover;
import com.evshare.handover.repository.VehicleHandoverRepository;
import com.evshare.trip.entity.Trip;
import com.evshare.trip.entity.TripStatus;
import com.evshare.trip.repository.TripRepository;
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
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DamageServiceTest {

    @Mock
    private DamageRecordRepository damageRecordRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private VehicleHandoverRepository handoverRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private DamageService damageService;

    private UUID tripId;
    private UUID vehicleId;
    private UUID bookingId;
    private UUID staffId;
    private UUID coOwnerId;
    private UUID adminId;

    private User staffUser;
    private User coOwnerUser;
    private Vehicle vehicle;
    private Booking booking;
    private Trip completedTrip;
    private Trip activeTrip;

    @BeforeEach
    void setUp() {
        tripId = UUID.randomUUID();
        vehicleId = UUID.randomUUID();
        bookingId = UUID.randomUUID();
        staffId = UUID.randomUUID();
        coOwnerId = UUID.randomUUID();
        adminId = UUID.randomUUID();

        staffUser = new User(staffId, "staff@evshare.com", "hash", "Nguyen Van Staff", Role.STAFF, UserStatus.ACTIVE);
        coOwnerUser = new User(coOwnerId, "coowner@evshare.com", "hash", "Tran Thi CoOwner", Role.CO_OWNER, UserStatus.ACTIVE);

        vehicle = new Vehicle();
        vehicle.setId(vehicleId);
        vehicle.setName("EV01 Demo");
        vehicle.setStatus(VehicleStatus.AVAILABLE);

        booking = new Booking(bookingId, vehicle, coOwnerUser, Instant.now().minusSeconds(7200), Instant.now().minusSeconds(3600), BookingStatus.COMPLETED, "Cong tac");

        completedTrip = new Trip(tripId, booking, vehicle, coOwnerUser, TripStatus.COMPLETED, Instant.now().minusSeconds(7000), new BigDecimal("10500.00"), 85);
        completedTrip.setEndedAt(Instant.now().minusSeconds(3500));
        completedTrip.setEndBatteryLevel(72);
        completedTrip.setEndOdometer(new BigDecimal("10580.00"));

        activeTrip = new Trip(UUID.randomUUID(), booking, vehicle, coOwnerUser, TripStatus.ACTIVE, Instant.now().minusSeconds(1000), new BigDecimal("10500.00"), 85);
    }

    @Test
    @DisplayName("1. STAFF creates damage for COMPLETED trip -> success, xyz persisted correctly, server createdAt used")
    void testCreateDamage_StaffCompletedTrip_Success() {
        CreateDamageRequest request = new CreateDamageRequest(
                "BODY",
                DamageType.SCRATCH,
                DamageSeverity.MINOR,
                "Vet tray dai 5cm tai cua trai",
                new BigDecimal("-0.8500"),
                new BigDecimal("0.7200"),
                new BigDecimal("0.4500")
        );

        when(tripRepository.findById(tripId)).thenReturn(Optional.of(completedTrip));
        when(handoverRepository.findByBookingId(bookingId)).thenReturn(Optional.empty());
        when(userRepository.findById(staffId)).thenReturn(Optional.of(staffUser));
        when(damageRecordRepository.save(any(DamageRecord.class))).thenAnswer(inv -> {
            DamageRecord r = inv.getArgument(0);
            r.setCreatedAt(Instant.now());
            return r;
        });

        DamageRecordResponse res = damageService.createDamage(tripId, request, staffId, Role.STAFF);

        assertNotNull(res);
        assertEquals("BODY", res.getVehiclePartCode());
        assertEquals(DamageType.SCRATCH, res.getDamageType());
        assertEquals(DamageSeverity.MINOR, res.getSeverity());
        assertEquals("Vet tray dai 5cm tai cua trai", res.getNote());
        assertEquals(new BigDecimal("-0.8500"), res.getLocalPositionX());
        assertEquals(new BigDecimal("0.7200"), res.getLocalPositionY());
        assertEquals(new BigDecimal("0.4500"), res.getLocalPositionZ());
        assertEquals(vehicleId, res.getVehicleId());
        assertEquals(tripId, res.getTripId());
        assertEquals(bookingId, res.getBookingId());
        assertEquals(staffId, res.getCreatedByUserId());
        assertNotNull(res.getCreatedAt());

        verify(damageRecordRepository).save(any(DamageRecord.class));
    }

    @Test
    @DisplayName("4b. Success: STAFF creates damage record for DOOR_FR")
    void testCreateDamage_DoorFR_Success() {
        CreateDamageRequest request = new CreateDamageRequest(
                "DOOR_FR", DamageType.OTHER, DamageSeverity.MINOR, "Tray nhe cua truoc phai",
                new BigDecimal("0.9000"), new BigDecimal("0.7000"), new BigDecimal("0.3000")
        );

        when(tripRepository.findById(tripId)).thenReturn(Optional.of(completedTrip));
        when(userRepository.findById(staffId)).thenReturn(Optional.of(staffUser));
        when(damageRecordRepository.save(any(DamageRecord.class))).thenAnswer(inv -> {
            DamageRecord r = inv.getArgument(0);
            r.setCreatedAt(Instant.now());
            return r;
        });

        DamageRecordResponse res = damageService.createDamage(tripId, request, staffId, Role.STAFF);

        assertNotNull(res);
        assertEquals("DOOR_FR", res.getVehiclePartCode());
        assertEquals(DamageType.OTHER, res.getDamageType());
        assertEquals(DamageSeverity.MINOR, res.getSeverity());
    }

    @Test
    @DisplayName("2. CO_OWNER tries to create damage -> AccessDeniedException (403)")
    void testCreateDamage_CoOwnerRole_ThrowsAccessDenied() {
        CreateDamageRequest request = new CreateDamageRequest(
                "BODY", DamageType.SCRATCH, DamageSeverity.MINOR, "Note",
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO
        );

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () ->
                damageService.createDamage(tripId, request, coOwnerId, Role.CO_OWNER));

        assertTrue(ex.getMessage().contains("STAFF"));
        verify(damageRecordRepository, never()).save(any());
    }

    @Test
    @DisplayName("3. ADMIN tries to create damage -> AccessDeniedException (403)")
    void testCreateDamage_AdminRole_ThrowsAccessDenied() {
        CreateDamageRequest request = new CreateDamageRequest(
                "BODY", DamageType.SCRATCH, DamageSeverity.MINOR, "Note",
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO
        );

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () ->
                damageService.createDamage(tripId, request, adminId, Role.ADMIN));

        assertTrue(ex.getMessage().contains("STAFF"));
        verify(damageRecordRepository, never()).save(any());
    }

    @Test
    @DisplayName("4. ACTIVE trip damage creation -> IllegalStateException (409 Conflict)")
    void testCreateDamage_ActiveTrip_ThrowsIllegalState() {
        UUID activeTripId = activeTrip.getId();
        when(tripRepository.findById(activeTripId)).thenReturn(Optional.of(activeTrip));

        CreateDamageRequest request = new CreateDamageRequest(
                "BODY", DamageType.SCRATCH, DamageSeverity.MINOR, "Note",
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO
        );

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                damageService.createDamage(activeTripId, request, staffId, Role.STAFF));

        assertTrue(ex.getMessage().contains("Chuyến đi chưa hoàn tất"));
        verify(damageRecordRepository, never()).save(any());
    }

    @Test
    @DisplayName("5. Invalid semantic part -> IllegalArgumentException (400 Bad Request)")
    void testCreateDamage_InvalidSemanticPart_ThrowsIllegalArgument() {
        when(tripRepository.findById(tripId)).thenReturn(Optional.of(completedTrip));

        CreateDamageRequest request = new CreateDamageRequest(
                "INVALID_PART_CODE", DamageType.SCRATCH, DamageSeverity.MINOR, "Note",
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                damageService.createDamage(tripId, request, staffId, Role.STAFF));

        assertTrue(ex.getMessage().contains("Mã bộ phận phương tiện không hợp lệ"));
        verify(damageRecordRepository, never()).save(any());
    }

    @Test
    @DisplayName("6. Missing or infinite coordinates -> IllegalArgumentException (400 Bad Request)")
    void testCreateDamage_InvalidCoordinates_ThrowsIllegalArgument() {
        when(tripRepository.findById(tripId)).thenReturn(Optional.of(completedTrip));

        CreateDamageRequest request = new CreateDamageRequest(
                "HOOD", DamageType.DENT, DamageSeverity.MODERATE, "Mop capo",
                null, BigDecimal.ZERO, BigDecimal.ZERO
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                damageService.createDamage(tripId, request, staffId, Role.STAFF));

        assertTrue(ex.getMessage().contains("Tọa độ"));
    }

    @Test
    @DisplayName("7. Multiple damage records allowed for same trip and part")
    void testCreateDamage_MultipleDamagesAllowed() {
        CreateDamageRequest req1 = new CreateDamageRequest(
                "BODY", DamageType.SCRATCH, DamageSeverity.MINOR, "Vet tray cua trai",
                new BigDecimal("-0.80"), new BigDecimal("0.70"), new BigDecimal("0.40")
        );
        CreateDamageRequest req2 = new CreateDamageRequest(
                "BODY", DamageType.DENT, DamageSeverity.SEVERE, "Vung mop sau tai duoi xe",
                new BigDecimal("0.60"), new BigDecimal("0.65"), new BigDecimal("-1.50")
        );

        when(tripRepository.findById(tripId)).thenReturn(Optional.of(completedTrip));
        when(userRepository.findById(staffId)).thenReturn(Optional.of(staffUser));
        when(damageRecordRepository.save(any(DamageRecord.class))).thenAnswer(inv -> inv.getArgument(0));

        DamageRecordResponse res1 = damageService.createDamage(tripId, req1, staffId, Role.STAFF);
        DamageRecordResponse res2 = damageService.createDamage(tripId, req2, staffId, Role.STAFF);

        assertNotNull(res1);
        assertNotNull(res2);
        assertNotEquals(res1.getId(), res2.getId());
        assertEquals(DamageType.SCRATCH, res1.getDamageType());
        assertEquals(DamageType.DENT, res2.getDamageType());
        verify(damageRecordRepository, times(2)).save(any(DamageRecord.class));
    }

    @Test
    @DisplayName("8. GET endpoints do not mutate data; CO_OWNER can read own trip damages")
    void testGetDamages_ReadOnly_CoOwnerAllowed() {
        DamageRecord record = new DamageRecord(
                UUID.randomUUID(), vehicle, completedTrip, booking, null,
                "ROOF", DamageType.CRACK, DamageSeverity.MODERATE, "Nut nhe kinh tran",
                BigDecimal.ZERO, new BigDecimal("1.45"), BigDecimal.ZERO, staffUser
        );

        when(tripRepository.findById(tripId)).thenReturn(Optional.of(completedTrip));
        when(damageRecordRepository.findByTripIdOrderByCreatedAtDesc(tripId)).thenReturn(List.of(record));

        List<DamageRecordResponse> list = damageService.getDamagesByTrip(tripId, coOwnerId, Role.CO_OWNER);

        assertEquals(1, list.size());
        assertEquals("ROOF", list.get(0).getVehiclePartCode());
        assertEquals(DamageType.CRACK, list.get(0).getDamageType());
        verify(damageRecordRepository, never()).save(any());
        verify(damageRecordRepository, never()).delete(any());
    }

    @Test
    @DisplayName("9. CO_OWNER cannot read another user's trip damages -> AccessDeniedException (403)")
    void testGetDamages_OtherCoOwner_ThrowsAccessDenied() {
        UUID otherCoOwnerId = UUID.randomUUID();
        when(tripRepository.findById(tripId)).thenReturn(Optional.of(completedTrip));

        assertThrows(AccessDeniedException.class, () ->
                damageService.getDamagesByTrip(tripId, otherCoOwnerId, Role.CO_OWNER));
    }
}
