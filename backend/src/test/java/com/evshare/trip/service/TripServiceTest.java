package com.evshare.trip.service;

import com.evshare.booking.entity.Booking;
import com.evshare.booking.entity.BookingStatus;
import com.evshare.booking.repository.BookingRepository;
import com.evshare.common.exception.DuplicateResourceException;
import com.evshare.handover.entity.HandoverStatus;
import com.evshare.handover.entity.VehicleHandover;
import com.evshare.handover.repository.VehicleHandoverRepository;
import com.evshare.battery.repository.VehicleBatteryHealthRepository;
import com.evshare.trip.dto.TripResponse;
import com.evshare.trip.dto.TripStartEligibilityResponse;
import com.evshare.trip.entity.Trip;
import com.evshare.trip.entity.TripStatus;
import com.evshare.trip.repository.TripRepository;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import com.evshare.user.entity.UserStatus;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.entity.VehicleStatus;
import com.evshare.vehicle.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TripServiceTest {

    @Mock
    private TripRepository tripRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private VehicleHandoverRepository handoverRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private VehicleBatteryHealthRepository batteryHealthRepository;

    @Spy
    private VehicleEnergyModelService energyModelService = new VehicleEnergyModelService();

    @InjectMocks
    private TripService tripService;

    private UUID bookingId;
    private UUID coOwnerId;
    private UUID otherUserId;
    private UUID vehicleId;
    private User coOwner;
    private User otherUser;
    private Vehicle vehicle;
    private Booking booking;
    private VehicleHandover completedHandover;

    @BeforeEach
    void setUp() {
        bookingId = UUID.randomUUID();
        coOwnerId = UUID.randomUUID();
        otherUserId = UUID.randomUUID();
        vehicleId = UUID.randomUUID();

        coOwner = new User(coOwnerId, "coowner@evshare.com", "hash", "Tran Thi CoOwner", Role.CO_OWNER, UserStatus.ACTIVE);
        otherUser = new User(otherUserId, "other@evshare.com", "hash", "Le Van Other", Role.CO_OWNER, UserStatus.ACTIVE);

        vehicle = new Vehicle();
        vehicle.setId(vehicleId);
        vehicle.setName("EV01 Demo");
        vehicle.setCurrentBatteryLevel(88);
        vehicle.setOdometer(new BigDecimal("10550.50"));
        vehicle.setStatus(VehicleStatus.AVAILABLE);

        Instant now = Instant.now();
        booking = new Booking(
                bookingId,
                vehicle,
                coOwner,
                now.minus(5, ChronoUnit.MINUTES),
                now.plus(2, ChronoUnit.HOURS),
                BookingStatus.CONFIRMED,
                "Chuyến đi công tác"
        );

        completedHandover = new VehicleHandover(
                UUID.randomUUID(),
                booking,
                vehicle,
                null,
                coOwner,
                HandoverStatus.COMPLETED
        );
    }

    @Test
    @DisplayName("1. CO_OWNER + completed handover + valid booking -> start succeeds")
    void testStartTrip_Success() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(handoverRepository.findByBookingId(bookingId)).thenReturn(Optional.of(completedHandover));
        when(tripRepository.findByBookingId(bookingId)).thenReturn(Optional.empty());
        when(tripRepository.existsByVehicleIdAndStatus(vehicleId, TripStatus.ACTIVE)).thenReturn(false);
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(tripRepository.save(any(Trip.class))).thenAnswer(inv -> inv.getArgument(0));

        TripResponse response = tripService.startTrip(bookingId, coOwnerId, Role.CO_OWNER);

        assertNotNull(response);
        assertEquals(bookingId, response.getBookingId());
        assertEquals(vehicleId, response.getVehicleId());
        assertEquals(coOwnerId, response.getUserId());
        assertEquals(TripStatus.ACTIVE, response.getStatus());
        assertEquals(88, response.getStartBatteryLevel());
        assertEquals(new BigDecimal("10550.50"), response.getStartOdometer());
        assertNotNull(response.getStartedAt());
        assertNull(response.getEndedAt());

        // Verify vehicle status updated to IN_USE
        assertEquals(VehicleStatus.IN_USE, vehicle.getStatus());
        verify(vehicleRepository).save(vehicle);
        verify(tripRepository).save(any(Trip.class));
    }

    @Test
    @DisplayName("2. Handover not completed -> rejected with HANDOVER_NOT_COMPLETED")
    void testStartTrip_HandoverNotCompleted_ThrowsException() {
        completedHandover.setStatus(HandoverStatus.READY_FOR_HANDOVER);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(handoverRepository.findByBookingId(bookingId)).thenReturn(Optional.of(completedHandover));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                tripService.startTrip(bookingId, coOwnerId, Role.CO_OWNER)
        );
        assertEquals(TripService.MSG_HANDOVER_NOT_COMPLETED, ex.getMessage());
        verify(tripRepository, never()).save(any());
    }

    @Test
    @DisplayName("3. Another user's booking -> rejected with AccessDeniedException")
    void testStartTrip_AnotherUserBooking_ThrowsAccessDenied() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));

        assertThrows(AccessDeniedException.class, () ->
                tripService.startTrip(bookingId, otherUserId, Role.CO_OWNER)
        );
        verify(tripRepository, never()).save(any());
    }

    @Test
    @DisplayName("4. STAFF -> 403 / AccessDeniedException")
    void testStartTrip_StaffRole_ThrowsAccessDenied() {
        assertThrows(AccessDeniedException.class, () ->
                tripService.startTrip(bookingId, coOwnerId, Role.STAFF)
        );
        verify(tripRepository, never()).save(any());
    }

    @Test
    @DisplayName("5. ADMIN -> cannot normal-start trip")
    void testStartTrip_AdminRole_ThrowsAccessDenied() {
        assertThrows(AccessDeniedException.class, () ->
                tripService.startTrip(bookingId, coOwnerId, Role.ADMIN)
        );
        verify(tripRepository, never()).save(any());
    }

    @Test
    @DisplayName("6. Same booking start twice -> only one Trip / DuplicateResourceException")
    void testStartTrip_DuplicateStart_ThrowsDuplicateResourceException() {
        Trip existing = new Trip(UUID.randomUUID(), booking, vehicle, coOwner, TripStatus.ACTIVE, Instant.now(), new BigDecimal("10000"), 80);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(handoverRepository.findByBookingId(bookingId)).thenReturn(Optional.of(completedHandover));
        when(tripRepository.findByBookingId(bookingId)).thenReturn(Optional.of(existing));

        assertThrows(DuplicateResourceException.class, () ->
                tripService.startTrip(bookingId, coOwnerId, Role.CO_OWNER)
        );
        verify(tripRepository, never()).save(any());
    }

    @Test
    @DisplayName("7. Vehicle with ACTIVE trip -> second trip rejected with VEHICLE_IN_USE")
    void testStartTrip_VehicleAlreadyInUse_ThrowsIllegalStateException() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(handoverRepository.findByBookingId(bookingId)).thenReturn(Optional.of(completedHandover));
        when(tripRepository.findByBookingId(bookingId)).thenReturn(Optional.empty());
        when(tripRepository.existsByVehicleIdAndStatus(vehicleId, TripStatus.ACTIVE)).thenReturn(true);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                tripService.startTrip(bookingId, coOwnerId, Role.CO_OWNER)
        );
        assertEquals(TripService.MSG_VEHICLE_IN_USE, ex.getMessage());
        verify(tripRepository, never()).save(any());
    }

    @Test
    @DisplayName("8 & 9. startBatteryLevel and startOdometer come authoritatively from Vehicle")
    void testStartTrip_VehicleTelemetrySnapshots() {
        vehicle.setCurrentBatteryLevel(95);
        vehicle.setOdometer(new BigDecimal("12345.67"));

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(handoverRepository.findByBookingId(bookingId)).thenReturn(Optional.of(completedHandover));
        when(tripRepository.findByBookingId(bookingId)).thenReturn(Optional.empty());
        when(tripRepository.existsByVehicleIdAndStatus(vehicleId, TripStatus.ACTIVE)).thenReturn(false);
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(tripRepository.save(any(Trip.class))).thenAnswer(inv -> inv.getArgument(0));

        TripResponse res = tripService.startTrip(bookingId, coOwnerId, Role.CO_OWNER);
        assertEquals(95, res.getStartBatteryLevel());
        assertEquals(new BigDecimal("12345.67"), res.getStartOdometer());
    }

    @Test
    @DisplayName("10 & 11. startedAt persisted and Trip.status = ACTIVE")
    void testStartTrip_PersistsActiveStatusAndTimestamp() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(handoverRepository.findByBookingId(bookingId)).thenReturn(Optional.of(completedHandover));
        when(tripRepository.findByBookingId(bookingId)).thenReturn(Optional.empty());
        when(tripRepository.existsByVehicleIdAndStatus(vehicleId, TripStatus.ACTIVE)).thenReturn(false);
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(tripRepository.save(any(Trip.class))).thenAnswer(inv -> inv.getArgument(0));

        TripResponse res = tripService.startTrip(bookingId, coOwnerId, Role.CO_OWNER);
        assertEquals(TripStatus.ACTIVE, res.getStatus());
        assertNotNull(res.getStartedAt());
    }

    @Test
    @DisplayName("12. Completed VehicleHandover remains unchanged")
    void testStartTrip_HandoverRemainsUnchanged() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(handoverRepository.findByBookingId(bookingId)).thenReturn(Optional.of(completedHandover));
        when(tripRepository.findByBookingId(bookingId)).thenReturn(Optional.empty());
        when(tripRepository.existsByVehicleIdAndStatus(vehicleId, TripStatus.ACTIVE)).thenReturn(false);
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(tripRepository.save(any(Trip.class))).thenAnswer(inv -> inv.getArgument(0));

        tripService.startTrip(bookingId, coOwnerId, Role.CO_OWNER);

        assertEquals(HandoverStatus.COMPLETED, completedHandover.getStatus());
        verify(handoverRepository, never()).save(any());
    }

    @Test
    @DisplayName("13. GET eligibility never creates Trip or mutates data")
    void testCheckStartEligibility_NeverMutates() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(handoverRepository.findByBookingId(bookingId)).thenReturn(Optional.of(completedHandover));
        when(tripRepository.findByBookingId(bookingId)).thenReturn(Optional.empty());
        when(tripRepository.findByVehicleIdAndStatus(vehicleId, TripStatus.ACTIVE)).thenReturn(Optional.empty());
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));

        TripStartEligibilityResponse res = tripService.checkStartEligibility(bookingId, coOwnerId, Role.CO_OWNER);

        assertTrue(res.isEligible());
        assertNull(res.getReasonCode());
        assertEquals("COMPLETED", res.getHandoverStatus());
        assertEquals(88, res.getCurrentBatteryLevel());
        assertEquals(new BigDecimal("10550.50"), res.getCurrentOdometer());

        verify(tripRepository, never()).save(any());
        verify(vehicleRepository, never()).save(any());
        verify(handoverRepository, never()).save(any());
    }

    @Test
    @DisplayName("14. GET eligibility returns not eligible when too early")
    void testCheckStartEligibility_TooEarly() {
        Instant future = Instant.now().plus(5, ChronoUnit.HOURS);
        booking.setStartTime(future);
        booking.setEndTime(future.plus(2, ChronoUnit.HOURS));

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(handoverRepository.findByBookingId(bookingId)).thenReturn(Optional.of(completedHandover));

        TripStartEligibilityResponse res = tripService.checkStartEligibility(bookingId, coOwnerId, Role.CO_OWNER);

        assertFalse(res.isEligible());
        assertEquals(TripService.REASON_TOO_EARLY, res.getReasonCode());
        assertEquals(TripService.MSG_TOO_EARLY, res.getMessage());
    }

    @Test
    @DisplayName("15. GET eligibility returns not eligible when booking expired")
    void testCheckStartEligibility_BookingExpired() {
        Instant past = Instant.now().minus(5, ChronoUnit.HOURS);
        booking.setStartTime(past.minus(2, ChronoUnit.HOURS));
        booking.setEndTime(past);

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(handoverRepository.findByBookingId(bookingId)).thenReturn(Optional.of(completedHandover));

        TripStartEligibilityResponse res = tripService.checkStartEligibility(bookingId, coOwnerId, Role.CO_OWNER);

        assertFalse(res.isEligible());
        assertEquals(TripService.REASON_BOOKING_EXPIRED, res.getReasonCode());
        assertEquals(TripService.MSG_BOOKING_EXPIRED, res.getMessage());
    }

    @Test
    @DisplayName("16. Handover data inconsistent -> HANDOVER_DATA_INCONSISTENT")
    void testCheckStartEligibility_HandoverDataInconsistent() {
        completedHandover.setVehicle(new Vehicle()); // different vehicle
        completedHandover.getVehicle().setId(UUID.randomUUID());

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(handoverRepository.findByBookingId(bookingId)).thenReturn(Optional.of(completedHandover));

        TripStartEligibilityResponse res = tripService.checkStartEligibility(bookingId, coOwnerId, Role.CO_OWNER);

        assertFalse(res.isEligible());
        assertEquals(TripService.REASON_HANDOVER_DATA_INCONSISTENT, res.getReasonCode());
        assertEquals(TripService.MSG_HANDOVER_DATA_INCONSISTENT, res.getMessage());
    }

    @Test
    @DisplayName("17. getTripById authorized owner succeeds")
    void testGetTripById_AuthorizedOwner() {
        UUID tripId = UUID.randomUUID();
        Trip trip = new Trip(tripId, booking, vehicle, coOwner, TripStatus.ACTIVE, Instant.now(), new BigDecimal("1000"), 80);
        when(tripRepository.findById(tripId)).thenReturn(Optional.of(trip));

        Optional<TripResponse> res = tripService.getTripById(tripId, coOwnerId, Role.CO_OWNER);
        assertTrue(res.isPresent());
        assertEquals(tripId, res.get().getId());
        assertEquals("EV01", res.get().getVehicleCode());
    }

    @Test
    @DisplayName("18. getTripById unauthorized co-owner throws AccessDeniedException")
    void testGetTripById_UnauthorizedCoOwner() {
        UUID tripId = UUID.randomUUID();
        Trip trip = new Trip(tripId, booking, vehicle, coOwner, TripStatus.ACTIVE, Instant.now(), new BigDecimal("1000"), 80);
        when(tripRepository.findById(tripId)).thenReturn(Optional.of(trip));

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () ->
                tripService.getTripById(tripId, otherUserId, Role.CO_OWNER));
        assertEquals("BẠN KHÔNG CÓ QUYỀN XEM CHUYẾN ĐI NÀY", ex.getMessage());
    }

    @Test
    @DisplayName("19. getTripById staff/admin succeeds for any trip")
    void testGetTripById_StaffAdminAccess() {
        UUID tripId = UUID.randomUUID();
        Trip trip = new Trip(tripId, booking, vehicle, coOwner, TripStatus.ACTIVE, Instant.now(), new BigDecimal("1000"), 80);
        when(tripRepository.findById(tripId)).thenReturn(Optional.of(trip));

        Optional<TripResponse> staffRes = tripService.getTripById(tripId, otherUserId, Role.STAFF);
        assertTrue(staffRes.isPresent());

        Optional<TripResponse> adminRes = tripService.getTripById(tripId, otherUserId, Role.ADMIN);
        assertTrue(adminRes.isPresent());
    }

    // ========================================================================
    // Phase 12 Tests: Check-out / Complete Trip
    // ========================================================================

    @Test
    @DisplayName("20. CO_OWNER completes own ACTIVE trip -> success, vehicle AVAILABLE, booking COMPLETED")
    void testCompleteTrip_Success() {
        UUID tripId = UUID.randomUUID();
        vehicle.setStatus(VehicleStatus.IN_USE);
        vehicle.setCurrentBatteryLevel(88);
        vehicle.setOdometer(new BigDecimal("10620.00"));

        Trip activeTrip = new Trip(tripId, booking, vehicle, coOwner, TripStatus.ACTIVE,
                Instant.now().minus(1, ChronoUnit.HOURS), new BigDecimal("10550.50"), 88);

        when(tripRepository.findById(tripId)).thenReturn(Optional.of(activeTrip));
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(tripRepository.save(any(Trip.class))).thenAnswer(inv -> inv.getArgument(0));

        TripResponse res = tripService.completeTrip(tripId, coOwnerId, Role.CO_OWNER);

        assertNotNull(res);
        assertEquals(TripStatus.COMPLETED, res.getStatus());
        assertNotNull(res.getEndedAt());
        assertEquals(69, res.getEndBatteryLevel());
        assertEquals(new BigDecimal("69.29"), res.getEndSocPercent());
        assertEquals(new BigDecimal("12.163"), res.getEnergyConsumedKwh());
        assertEquals(new BigDecimal("18.71"), res.getSocConsumedPercent());
        assertEquals(new BigDecimal("10620.00"), res.getEndOdometer());
        assertEquals(19, res.getBatteryUsed()); // 88 - 69 = 19%
        assertEquals(new BigDecimal("69.50"), res.getDistanceTraveled()); // 10620.00 - 10550.50 = 69.50 km
        assertNotNull(res.getDurationSeconds());
        assertTrue(res.getDurationSeconds() >= 3600);

        // Verify Vehicle transitions out of IN_USE to AVAILABLE
        assertEquals(VehicleStatus.AVAILABLE, vehicle.getStatus());
        verify(vehicleRepository).save(vehicle);

        // Verify Booking transitions to COMPLETED
        assertEquals(BookingStatus.COMPLETED, booking.getStatus());
        verify(bookingRepository).save(booking);

        verify(tripRepository).save(activeTrip);
    }

    @Test
    @DisplayName("20a. EV01 Volvo EX30-like: 35 km -> 6.125 kWh consumed, ~9.42% SOC consumed, 100% -> 90.58%")
    void testCompleteTrip_EV01_RealisticEnergyModel_MatchesPromptExample() {
        UUID tripId = UUID.randomUUID();
        vehicle.setName("EV01 — realistic compact electric SUV");
        vehicle.setStatus(VehicleStatus.IN_USE);
        vehicle.setCurrentBatteryLevel(100);
        vehicle.setOdometer(new BigDecimal("10200.00"));

        Trip activeTrip = new Trip(tripId, booking, vehicle, coOwner, TripStatus.ACTIVE,
                Instant.now().minus(1, ChronoUnit.HOURS), new BigDecimal("10200.00"), 100);

        when(tripRepository.findById(tripId)).thenReturn(Optional.of(activeTrip));
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(tripRepository.save(any(Trip.class))).thenAnswer(inv -> inv.getArgument(0));

        TripResponse res = tripService.completeTrip(tripId, coOwnerId, Role.CO_OWNER, new BigDecimal("10235.00"));

        assertNotNull(res);
        assertEquals(TripStatus.COMPLETED, res.getStatus());
        assertEquals(new BigDecimal("10235.00"), res.getEndOdometer());
        assertEquals(new BigDecimal("35.00"), res.getDistanceTraveled());
        assertEquals(new BigDecimal("6.125"), res.getEnergyConsumedKwh());
        assertEquals(new BigDecimal("9.42"), res.getSocConsumedPercent());
        assertEquals(new BigDecimal("90.58"), res.getEndSocPercent());
        assertEquals(91, res.getEndBatteryLevel());
        assertEquals(9, res.getBatteryUsed()); // 100 - 91 = 9%
        assertEquals(new BigDecimal("17.50"), res.getEnergyConsumptionKwhPer100Km());
        assertEquals(new BigDecimal("65.00"), res.getUsableBatteryCapacityKwh());
        assertEquals(new BigDecimal("69.00"), res.getGrossBatteryCapacityKwh());
    }

    @Test
    @DisplayName("20b. EV02 lighter stylized EV: 35 km -> 5.775 kWh consumed, ~9.63% SOC consumed, 100% -> 90.38%")
    void testCompleteTrip_EV02_RealisticEnergyModel() {
        UUID tripId = UUID.randomUUID();
        vehicle.setName("EV02 — lighter stylized EV");
        vehicle.setStatus(VehicleStatus.IN_USE);
        vehicle.setCurrentBatteryLevel(100);
        vehicle.setOdometer(new BigDecimal("4520.00"));

        Trip activeTrip = new Trip(tripId, booking, vehicle, coOwner, TripStatus.ACTIVE,
                Instant.now().minus(1, ChronoUnit.HOURS), new BigDecimal("4520.00"), 100);

        when(tripRepository.findById(tripId)).thenReturn(Optional.of(activeTrip));
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(tripRepository.save(any(Trip.class))).thenAnswer(inv -> inv.getArgument(0));

        TripResponse res = tripService.completeTrip(tripId, coOwnerId, Role.CO_OWNER, new BigDecimal("4555.00"));

        assertNotNull(res);
        assertEquals(TripStatus.COMPLETED, res.getStatus());
        assertEquals(new BigDecimal("4555.00"), res.getEndOdometer());
        assertEquals(new BigDecimal("35.00"), res.getDistanceTraveled());
        assertEquals(new BigDecimal("5.775"), res.getEnergyConsumedKwh());
        assertEquals(new BigDecimal("9.63"), res.getSocConsumedPercent());
        assertEquals(new BigDecimal("90.38"), res.getEndSocPercent());
        assertEquals(90, res.getEndBatteryLevel());
        assertEquals(10, res.getBatteryUsed()); // 100 - 90 = 10%
        assertEquals(new BigDecimal("16.50"), res.getEnergyConsumptionKwhPer100Km());
        assertEquals(new BigDecimal("60.00"), res.getUsableBatteryCapacityKwh());
    }

    @Test
    @DisplayName("21. Another CO_OWNER tries to complete trip -> AccessDeniedException")
    void testCompleteTrip_OtherCoOwner_ThrowsAccessDenied() {
        UUID tripId = UUID.randomUUID();
        Trip activeTrip = new Trip(tripId, booking, vehicle, coOwner, TripStatus.ACTIVE,
                Instant.now().minus(30, ChronoUnit.MINUTES), new BigDecimal("10550.50"), 88);

        when(tripRepository.findById(tripId)).thenReturn(Optional.of(activeTrip));

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () ->
                tripService.completeTrip(tripId, otherUserId, Role.CO_OWNER));
        assertEquals(TripService.MSG_NOT_TRIP_OWNER, ex.getMessage());
        verify(vehicleRepository, never()).save(any());
        verify(tripRepository, never()).save(any());
    }

    @Test
    @DisplayName("22. STAFF tries to complete CO_OWNER trip -> AccessDeniedException")
    void testCompleteTrip_Staff_ThrowsAccessDenied() {
        UUID tripId = UUID.randomUUID();

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () ->
                tripService.completeTrip(tripId, coOwnerId, Role.STAFF));
        assertEquals(TripService.MSG_ONLY_CO_OWNER_CHECKOUT, ex.getMessage());
        verify(tripRepository, never()).save(any());
    }

    @Test
    @DisplayName("23. ADMIN tries to complete trip -> AccessDeniedException")
    void testCompleteTrip_Admin_ThrowsAccessDenied() {
        UUID tripId = UUID.randomUUID();

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () ->
                tripService.completeTrip(tripId, coOwnerId, Role.ADMIN));
        assertEquals(TripService.MSG_ONLY_CO_OWNER_CHECKOUT, ex.getMessage());
        verify(tripRepository, never()).save(any());
    }

    @Test
    @DisplayName("24. Completing already COMPLETED trip -> IllegalStateException (idempotent duplicate protection)")
    void testCompleteTrip_AlreadyCompleted_ThrowsIllegalState() {
        UUID tripId = UUID.randomUUID();
        Trip completedTrip = new Trip(tripId, booking, vehicle, coOwner, TripStatus.COMPLETED,
                Instant.now().minus(2, ChronoUnit.HOURS), new BigDecimal("10550.50"), 88);
        completedTrip.setEndedAt(Instant.now().minus(1, ChronoUnit.HOURS));

        when(tripRepository.findById(tripId)).thenReturn(Optional.of(completedTrip));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                tripService.completeTrip(tripId, coOwnerId, Role.CO_OWNER));
        assertEquals(TripService.MSG_TRIP_ALREADY_COMPLETED, ex.getMessage());
        verify(vehicleRepository, never()).save(any());
        verify(tripRepository, never()).save(any());
    }

    @Test
    @DisplayName("25. ACTIVE trip past booking end time (overtime) -> completion still allowed")
    void testCompleteTrip_OvertimeTrip_Allowed() {
        UUID tripId = UUID.randomUUID();
        // Booking ended 30 minutes ago
        booking.setStartTime(Instant.now().minus(3, ChronoUnit.HOURS));
        booking.setEndTime(Instant.now().minus(30, ChronoUnit.MINUTES));

        vehicle.setStatus(VehicleStatus.IN_USE);
        vehicle.setCurrentBatteryLevel(60);
        vehicle.setOdometer(new BigDecimal("10700.00"));

        Trip overtimeTrip = new Trip(tripId, booking, vehicle, coOwner, TripStatus.ACTIVE,
                Instant.now().minus(2, ChronoUnit.HOURS), new BigDecimal("10550.50"), 88);

        when(tripRepository.findById(tripId)).thenReturn(Optional.of(overtimeTrip));
        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(tripRepository.save(any(Trip.class))).thenAnswer(inv -> inv.getArgument(0));

        TripResponse res = tripService.completeTrip(tripId, coOwnerId, Role.CO_OWNER);
        assertNotNull(res);
        assertEquals(TripStatus.COMPLETED, res.getStatus());
        assertEquals(VehicleStatus.AVAILABLE, vehicle.getStatus());
        assertEquals(BookingStatus.COMPLETED, booking.getStatus());
    }

    @Test
    @DisplayName("26. Repeat completion attempt: original endedAt, endBattery, endOdometer not overwritten, no duplicate Trip created")
    void testCompleteTrip_RepeatAttempt_PreservesOriginalData() {
        UUID tripId = UUID.randomUUID();
        Instant originalEndedAt = Instant.now().minus(1, ChronoUnit.HOURS);
        Integer originalEndBattery = 70;
        BigDecimal originalEndOdo = new BigDecimal("10600.00");

        Trip completedTrip = new Trip(tripId, booking, vehicle, coOwner, TripStatus.COMPLETED,
                Instant.now().minus(2, ChronoUnit.HOURS), new BigDecimal("10550.50"), 88);
        completedTrip.setEndedAt(originalEndedAt);
        completedTrip.setEndBatteryLevel(originalEndBattery);
        completedTrip.setEndOdometer(originalEndOdo);

        when(tripRepository.findById(tripId)).thenReturn(Optional.of(completedTrip));

        // Attempting to complete again must fail with IllegalStateException (HTTP 409)
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                tripService.completeTrip(tripId, coOwnerId, Role.CO_OWNER));
        assertEquals(TripService.MSG_TRIP_ALREADY_COMPLETED, ex.getMessage());

        // Verify original values are UNTOUCHED
        assertEquals(originalEndedAt, completedTrip.getEndedAt());
        assertEquals(originalEndBattery, completedTrip.getEndBatteryLevel());
        assertEquals(originalEndOdo, completedTrip.getEndOdometer());
        assertEquals(TripStatus.COMPLETED, completedTrip.getStatus());

        // Verify no repository save or duplicate creations occurred
        verify(vehicleRepository, never()).save(any());
        verify(bookingRepository, never()).save(any());
        verify(tripRepository, never()).save(any());
    }

    @Test
    @DisplayName("27. Trip not found -> ResourceNotFoundException (404)")
    void testCompleteTrip_NotFound_ThrowsResourceNotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(tripRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        com.evshare.common.exception.ResourceNotFoundException ex = assertThrows(
                com.evshare.common.exception.ResourceNotFoundException.class,
                () -> tripService.completeTrip(nonExistentId, coOwnerId, Role.CO_OWNER)
        );
        assertTrue(ex.getMessage().contains("Không tìm thấy chuyến đi"));
    }
}
