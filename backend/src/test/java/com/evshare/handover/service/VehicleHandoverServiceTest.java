package com.evshare.handover.service;

import com.evshare.booking.entity.Booking;
import com.evshare.booking.entity.BookingStatus;
import com.evshare.booking.repository.BookingRepository;
import com.evshare.common.exception.DuplicateResourceException;
import com.evshare.handover.dto.VehicleHandoverResponse;
import com.evshare.handover.dto.VehicleInspectionRequest;
import com.evshare.handover.dto.VehicleInspectionResponse;
import com.evshare.handover.entity.HandoverStatus;
import com.evshare.handover.entity.InspectionCondition;
import com.evshare.handover.entity.VehicleHandover;
import com.evshare.inspection.entity.InspectionOverallResult;
import com.evshare.inspection.entity.InspectionStatus;
import com.evshare.inspection.entity.InspectionType;
import com.evshare.inspection.entity.VehicleInspection;
import com.evshare.handover.repository.VehicleHandoverRepository;
import com.evshare.inspection.repository.VehicleInspectionRepository;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.User;
import com.evshare.user.repository.UserRepository;
import com.evshare.handover.dto.HandoverEligibilityReason;
import com.evshare.handover.dto.VehicleHandoverEligibilityResponse;
import com.evshare.trip.entity.TripStatus;
import com.evshare.trip.repository.TripRepository;
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

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VehicleHandoverServiceTest {

    @Mock
    private VehicleHandoverRepository handoverRepository;

    @Mock
    private VehicleInspectionRepository inspectionRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private TripRepository tripRepository;

    @InjectMocks
    private VehicleHandoverService handoverService;

    private UUID bookingId;
    private UUID handoverId;
    private UUID staffId;
    private UUID coOwnerId;
    private Booking booking;
    private Vehicle vehicle;
    private User staff;
    private User coOwner;
    private VehicleHandover handover;

    @BeforeEach
    void setUp() {
        bookingId = UUID.randomUUID();
        handoverId = UUID.randomUUID();
        staffId = UUID.randomUUID();
        coOwnerId = UUID.randomUUID();

        vehicle = new Vehicle();
        vehicle.setId(UUID.randomUUID());
        vehicle.setName("EV01 - VinFast VF e34");
        vehicle.setLicensePlate("51K-888.88");

        staff = new User();
        staff.setId(staffId);
        staff.setFullName("Nguyen Van Staff");
        staff.setRole(Role.STAFF);

        coOwner = new User();
        coOwner.setId(coOwnerId);
        coOwner.setFullName("Tran Thi B");
        coOwner.setEmail("tran.b@evshare.com");
        coOwner.setRole(Role.CO_OWNER);

        booking = new Booking();
        booking.setId(bookingId);
        booking.setVehicle(vehicle);
        booking.setUser(coOwner);
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setPurpose("Đi công tác nội ô");
        booking.setStartTime(Instant.now().plus(1, ChronoUnit.HOURS));
        booking.setEndTime(Instant.now().plus(3, ChronoUnit.HOURS));

        handover = new VehicleHandover(handoverId, booking, vehicle, staff, coOwner, HandoverStatus.PENDING_PREPARATION);
    }

    @Test
    @DisplayName("Should successfully start handover for a confirmed booking")
    void testStartHandover_Success() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(userRepository.findById(staffId)).thenReturn(Optional.of(staff));
        when(handoverRepository.findByBookingId(bookingId)).thenReturn(Optional.of(handover));
        when(handoverRepository.save(any(VehicleHandover.class))).thenAnswer(i -> i.getArgument(0));

        VehicleHandoverResponse response = handoverService.startHandover(bookingId, staffId);

        assertNotNull(response);
        assertEquals(HandoverStatus.INSPECTION_IN_PROGRESS, response.getStatus());
        assertEquals(staffId, response.getStaffId());
        verify(handoverRepository).save(any(VehicleHandover.class));
    }

    @Test
    @DisplayName("Should throw UnsupportedOperationException when calling obsolete recordInspection")
    void testRecordInspection_Obsolete() {
        VehicleInspectionRequest request = new VehicleInspectionRequest("WHEEL_FL", InspectionCondition.GOOD, "Lốp xe mới, áp suất đạt chuẩn 2.4 bar");
        assertThrows(UnsupportedOperationException.class,
                () -> handoverService.recordInspection(handoverId, request, staffId));
    }

    @Test
    @DisplayName("Should reject mark ready when vehicle has no completed inspection")
    void testMarkReady_NoInspection_ThrowsIllegalStateException() {
        handover.setStatus(HandoverStatus.INSPECTION_IN_PROGRESS);
        when(handoverRepository.findById(handoverId)).thenReturn(Optional.of(handover));
        when(inspectionRepository.findLatestCompletedByVehicleId(vehicle.getId())).thenReturn(Optional.empty());

        assertThrows(IllegalStateException.class, () -> handoverService.markReadyForHandover(handoverId, staffId));
    }

    @Test
    @DisplayName("Should mark ready when valid completed inspection exists")
    void testMarkReady_ValidInspection_Success() {
        handover.setStatus(HandoverStatus.INSPECTION_IN_PROGRESS);
        when(handoverRepository.findById(handoverId)).thenReturn(Optional.of(handover));
        when(userRepository.findById(staffId)).thenReturn(Optional.of(staff));

        VehicleInspection completedInsp = new VehicleInspection(
                UUID.randomUUID(), vehicle, staff, InspectionType.PRE_HANDOVER);
        completedInsp.setStatus(InspectionStatus.COMPLETED);
        completedInsp.setOverallResult(InspectionOverallResult.PASS);
        completedInsp.setCompletedAt(Instant.now());

        when(inspectionRepository.findLatestCompletedByVehicleId(vehicle.getId())).thenReturn(Optional.of(completedInsp));
        when(handoverRepository.save(any(VehicleHandover.class))).thenAnswer(i -> i.getArgument(0));

        VehicleHandoverResponse response = handoverService.markReadyForHandover(handoverId, staffId);

        assertNotNull(response);
        assertEquals(HandoverStatus.READY_FOR_HANDOVER, response.getStatus());
        assertNotNull(response.getStaffPreparedAt());
        assertEquals(completedInsp.getId(), response.getInspectionId());
    }

    @Test
    @DisplayName("Should reject staff handover confirmation if vehicle is not READY_FOR_HANDOVER")
    void testConfirmStaffHandover_NotReady_ThrowsValidationException() {
        handover.setStatus(HandoverStatus.INSPECTION_IN_PROGRESS);
        when(handoverRepository.findById(handoverId)).thenReturn(Optional.of(handover));

        assertThrows(IllegalStateException.class, () -> handoverService.confirmStaffHandover(handoverId, staffId));
    }

    @Test
    @DisplayName("Should confirm staff handover when status is READY_FOR_HANDOVER")
    void testConfirmStaffHandover_Success() {
        handover.setStatus(HandoverStatus.READY_FOR_HANDOVER);
        when(handoverRepository.findById(handoverId)).thenReturn(Optional.of(handover));
        when(userRepository.findById(staffId)).thenReturn(Optional.of(staff));
        when(handoverRepository.save(any(VehicleHandover.class))).thenAnswer(i -> i.getArgument(0));

        VehicleHandoverResponse response = handoverService.confirmStaffHandover(handoverId, staffId);

        assertNotNull(response);
        assertEquals(HandoverStatus.HANDED_OVER, response.getStatus());
        assertNotNull(response.getStaffHandedOverAt());
    }

    @Test
    @DisplayName("Should reject owner confirmation if vehicle has not been HANDED_OVER by staff")
    void testConfirmOwnerReceipt_NotHandedOver_ThrowsValidationException() {
        handover.setStatus(HandoverStatus.READY_FOR_HANDOVER);
        when(handoverRepository.findById(handoverId)).thenReturn(Optional.of(handover));

        assertThrows(IllegalStateException.class, () -> handoverService.confirmOwnerReceipt(handoverId, coOwnerId));
    }

    @Test
    @DisplayName("Should reject owner confirmation if user is not the booking co-owner")
    void testConfirmOwnerReceipt_DifferentUser_ThrowsForbiddenException() {
        handover.setStatus(HandoverStatus.HANDED_OVER);
        when(handoverRepository.findById(handoverId)).thenReturn(Optional.of(handover));

        UUID anotherUserId = UUID.randomUUID();
        assertThrows(AccessDeniedException.class, () -> handoverService.confirmOwnerReceipt(handoverId, anotherUserId));
    }

    @Test
    @DisplayName("Should successfully acknowledge vehicle condition as CO_OWNER")
    void testAcknowledgeCondition_Success() {
        handover.setStatus(HandoverStatus.HANDED_OVER);
        when(handoverRepository.findById(handoverId)).thenReturn(Optional.of(handover));
        when(handoverRepository.save(any(VehicleHandover.class))).thenAnswer(i -> i.getArgument(0));

        VehicleHandoverResponse response = handoverService.acknowledgeCondition(handoverId, coOwnerId);

        assertNotNull(response);
        assertTrue(response.isConditionAcknowledged());
        assertNotNull(response.getOwnerConditionAcknowledgedAt());
    }

    @Test
    @DisplayName("Should reject owner confirmation without condition acknowledgment")
    void testConfirmOwnerReceipt_WithoutAcknowledgment_ThrowsException() {
        handover.setStatus(HandoverStatus.HANDED_OVER);
        handover.setStaff(staff);
        handover.setStaffHandedOverAt(Instant.now());
        handover.setOwnerConditionAcknowledgedAt(null); // not acknowledged
        when(handoverRepository.findById(handoverId)).thenReturn(Optional.of(handover));

        assertThrows(IllegalStateException.class, () -> handoverService.confirmOwnerReceipt(handoverId, coOwnerId));
    }

    @Test
    @DisplayName("Should successfully confirm owner receipt and complete check-in when acknowledged")
    void testConfirmOwnerReceipt_Success_CompletesHandover() {
        handover.setStatus(HandoverStatus.HANDED_OVER);
        handover.setStaff(staff);
        handover.setStaffHandedOverAt(Instant.now());
        handover.setOwnerConditionAcknowledgedAt(Instant.now()); // acknowledged
        when(handoverRepository.findById(handoverId)).thenReturn(Optional.of(handover));
        when(handoverRepository.save(any(VehicleHandover.class))).thenAnswer(i -> i.getArgument(0));

        VehicleHandoverResponse response = handoverService.confirmOwnerReceipt(handoverId, coOwnerId);

        assertNotNull(response);
        assertEquals(HandoverStatus.COMPLETED, response.getStatus());
        assertNotNull(response.getOwnerReceivedAt());
    }

    @Test
    @DisplayName("Should expose full recipient identification in handover response")
    void testConfirmStaffHandover_ExposesRecipientIdentity() {
        handover.setStatus(HandoverStatus.READY_FOR_HANDOVER);
        when(handoverRepository.findById(handoverId)).thenReturn(Optional.of(handover));
        when(userRepository.findById(staffId)).thenReturn(Optional.of(staff));
        when(handoverRepository.save(any(VehicleHandover.class))).thenAnswer(i -> i.getArgument(0));

        VehicleHandoverResponse response = handoverService.confirmStaffHandover(handoverId, staffId);

        assertNotNull(response);
        assertEquals("Tran Thi B", response.getCoOwnerName());
        assertEquals("tran.b@evshare.com", response.getCoOwnerEmail());
        assertEquals("Đi công tác nội ô", response.getBookingPurpose());
        assertEquals("CONFIRMED", response.getBookingStatus());
        assertEquals("EV01", response.getVehicleCode());
        assertEquals(booking.getStartTime(), response.getBookingStartTime());
        assertEquals(booking.getEndTime(), response.getBookingEndTime());
    }

    @Test
    @DisplayName("Should reject staff handover if recipient is inconsistent with booking owner")
    void testConfirmStaffHandover_InconsistentRecipient_ThrowsException() {
        handover.setStatus(HandoverStatus.READY_FOR_HANDOVER);
        User differentUser = new User();
        differentUser.setId(UUID.randomUUID());
        differentUser.setFullName("Wrong Person");
        handover.setCoOwner(differentUser); // mismatch with booking.getUser()

        when(handoverRepository.findById(handoverId)).thenReturn(Optional.of(handover));

        assertThrows(IllegalStateException.class, () -> handoverService.confirmStaffHandover(handoverId, staffId));
    }

    @Test
    @DisplayName("TEST 1: start handover when none exists -> creates exactly one")
    void testStartHandover_WhenNoneExists_CreatesExactlyOne() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(userRepository.findById(staffId)).thenReturn(Optional.of(staff));
        when(handoverRepository.findByBookingId(bookingId)).thenReturn(Optional.empty());
        when(handoverRepository.save(any(VehicleHandover.class))).thenAnswer(i -> i.getArgument(0));

        VehicleHandoverResponse response = handoverService.startHandover(bookingId, staffId);

        assertNotNull(response);
        assertEquals(HandoverStatus.INSPECTION_IN_PROGRESS, response.getStatus());
        assertEquals(staffId, response.getStaffId());
        assertEquals(bookingId, response.getBookingId());
        verify(handoverRepository, times(1)).save(any(VehicleHandover.class));
    }

    @Test
    @DisplayName("TEST 2: start same booking again -> does NOT create second row (reuses existing)")
    void testStartHandover_SameBookingAgain_ReusesExistingRow() {
        handover.setStatus(HandoverStatus.INSPECTION_IN_PROGRESS);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(userRepository.findById(staffId)).thenReturn(Optional.of(staff));
        when(handoverRepository.findByBookingId(bookingId)).thenReturn(Optional.of(handover));
        when(handoverRepository.save(any(VehicleHandover.class))).thenAnswer(i -> i.getArgument(0));

        VehicleHandoverResponse response = handoverService.startHandover(bookingId, staffId);

        assertNotNull(response);
        assertEquals(handoverId, response.getId());
        assertEquals(HandoverStatus.INSPECTION_IN_PROGRESS, response.getStatus());
        verify(handoverRepository, times(1)).save(handover);
    }

    @Test
    @DisplayName("TEST 3: GET handover -> never creates or saves row")
    void testGetHandover_NeverCreatesRow() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(handoverRepository.findByBookingId(bookingId)).thenReturn(Optional.of(handover));

        VehicleHandoverResponse response = handoverService.getHandoverByBookingId(bookingId, staffId, Role.STAFF);

        assertNotNull(response);
        assertEquals(handoverId, response.getId());
        verify(handoverRepository, never()).save(any(VehicleHandover.class));
    }

    @Test
    @DisplayName("TEST 4: CO_OWNER GET active handovers -> never creates or saves row")
    void testCoOwnerGet_NeverCreatesRow() {
        UUID vehicleId = vehicle.getId();
        when(handoverRepository.findActiveByCoOwnerAndVehicle(coOwnerId, vehicleId)).thenReturn(List.of(handover));

        List<VehicleHandoverResponse> list = handoverService.getActiveHandoversForVehicle(vehicleId, coOwnerId, Role.CO_OWNER);

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals(handoverId, list.get(0).getId());
        verify(handoverRepository, never()).save(any(VehicleHandover.class));
    }

    @Test
    @DisplayName("TEST 5: handover already HANDED_OVER -> start again rejected")
    void testStartHandover_AlreadyHandedOver_Rejected() {
        handover.setStatus(HandoverStatus.HANDED_OVER);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(userRepository.findById(staffId)).thenReturn(Optional.of(staff));
        when(handoverRepository.findByBookingId(bookingId)).thenReturn(Optional.of(handover));

        assertThrows(DuplicateResourceException.class, () -> handoverService.startHandover(bookingId, staffId));
        verify(handoverRepository, never()).save(any(VehicleHandover.class));
    }

    @Test
    @DisplayName("TEST 6: handover already HANDED_OVER -> confirm handover again rejected")
    void testConfirmStaffHandover_AlreadyHandedOver_ThrowsConflictException() {
        handover.setStatus(HandoverStatus.HANDED_OVER);
        when(handoverRepository.findById(handoverId)).thenReturn(Optional.of(handover));

        assertThrows(DuplicateResourceException.class, () -> handoverService.confirmStaffHandover(handoverId, staffId));
        verify(handoverRepository, never()).save(any(VehicleHandover.class));
    }

    @Test
    @DisplayName("TEST 7: Completed inspection is associated with canonical handover on mark ready")
    void testInspectionsRemainAssociatedWithOriginalHandover() {
        handover.setStatus(HandoverStatus.INSPECTION_IN_PROGRESS);
        when(handoverRepository.findById(handoverId)).thenReturn(Optional.of(handover));
        when(userRepository.findById(staffId)).thenReturn(Optional.of(staff));

        VehicleInspection completedInsp = new VehicleInspection(
                UUID.randomUUID(), vehicle, staff, InspectionType.PRE_HANDOVER);
        completedInsp.setStatus(InspectionStatus.COMPLETED);
        completedInsp.setOverallResult(InspectionOverallResult.PASS);
        completedInsp.setCompletedAt(Instant.now());

        when(inspectionRepository.findLatestCompletedByVehicleId(vehicle.getId())).thenReturn(Optional.of(completedInsp));
        when(handoverRepository.save(any(VehicleHandover.class))).thenAnswer(i -> i.getArgument(0));

        VehicleHandoverResponse resp = handoverService.markReadyForHandover(handoverId, staffId);

        assertNotNull(resp);
        assertEquals(completedInsp.getId(), resp.getInspectionId());
        verify(handoverRepository).save(argThat(h -> completedInsp.equals(h.getInspection())));
    }

    @Test
    @DisplayName("TEST 8: CO_OWNER resolves same handoverId used by STAFF")
    void testCoOwnerResolvesSameHandoverIdUsedByStaff() {
        handover.setStatus(HandoverStatus.HANDED_OVER);
        UUID vehicleId = vehicle.getId();
        when(handoverRepository.findActiveByCoOwnerAndVehicle(coOwnerId, vehicleId)).thenReturn(List.of(handover));

        List<VehicleHandoverResponse> responses = handoverService.getActiveHandoversForVehicle(vehicleId, coOwnerId, Role.CO_OWNER);

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals(handoverId, responses.get(0).getId());
        assertEquals(HandoverStatus.HANDED_OVER, responses.get(0).getStatus());
        assertEquals("Tran Thi B", responses.get(0).getCoOwnerName());
    }

    @Test
    @DisplayName("TEST 9: DB prevents duplicate booking_id (rejects secondary insert attempt)")
    void testDbPreventsDuplicateBookingId() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(userRepository.findById(staffId)).thenReturn(Optional.of(staff));
        when(handoverRepository.findByBookingId(bookingId)).thenReturn(Optional.empty());
        when(handoverRepository.save(any(VehicleHandover.class))).thenThrow(new org.springframework.dao.DataIntegrityViolationException("Duplicate entry for key 'booking_id'"));

        assertThrows(org.springframework.dao.DataIntegrityViolationException.class, () -> handoverService.startHandover(bookingId, staffId));
    }

    @Test
    @DisplayName("Should reject mark ready when vehicle is already HANDED_OVER")
    void testMarkReady_AlreadyHandedOver_ThrowsConflictException() {
        handover.setStatus(HandoverStatus.HANDED_OVER);
        when(handoverRepository.findById(handoverId)).thenReturn(Optional.of(handover));

        assertThrows(DuplicateResourceException.class, () -> handoverService.markReadyForHandover(handoverId, staffId));
    }

    @Test
    @DisplayName("Should be idempotent when marking ready on an already READY_FOR_HANDOVER handover")
    void testMarkReady_AlreadyReady_IsIdempotent() {
        handover.setStatus(HandoverStatus.READY_FOR_HANDOVER);
        when(handoverRepository.findById(handoverId)).thenReturn(Optional.of(handover));

        VehicleHandoverResponse res = handoverService.markReadyForHandover(handoverId, staffId);
        assertNotNull(res);
        assertEquals(HandoverStatus.READY_FOR_HANDOVER, res.getStatus());
    }

    @Test
    @DisplayName("Should reject record inspection as legacy operation when status is READY_FOR_HANDOVER or later")
    void testRecordInspection_LockedWhenReadyOrLater() {
        VehicleInspectionRequest req = new VehicleInspectionRequest();
        req.setVehiclePartCode("BODY");
        req.setConditionStatus(InspectionCondition.GOOD);

        assertThrows(UnsupportedOperationException.class, () -> handoverService.recordInspection(handoverId, req, staffId));
    }

    @Test
    @DisplayName("Should reject starting handover for an already completed booking")
    void testStartHandover_AlreadyHandedOver_ThrowsConflictException() {
        handover.setStatus(HandoverStatus.COMPLETED);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(userRepository.findById(staffId)).thenReturn(Optional.of(staff));
        when(handoverRepository.findByBookingId(bookingId)).thenReturn(Optional.of(handover));

        assertThrows(DuplicateResourceException.class, () -> handoverService.startHandover(bookingId, staffId));
    }

    @Test
    @DisplayName("Should be idempotent when owner confirms receipt on an already COMPLETED handover")
    void testConfirmOwnerReceipt_AlreadyCompleted_IsIdempotent() {
        handover.setStatus(HandoverStatus.COMPLETED);
        when(handoverRepository.findById(handoverId)).thenReturn(Optional.of(handover));

        VehicleHandoverResponse res = handoverService.confirmOwnerReceipt(handoverId, coOwnerId);
        assertNotNull(res);
        assertEquals(HandoverStatus.COMPLETED, res.getStatus());
    }

    @Test
    @DisplayName("Should reject starting handover when booking has EXPIRED")
    void testStartHandover_ExpiredBooking_ThrowsIllegalStateException() {
        booking.setEndTime(Instant.now().minus(1, ChronoUnit.HOURS));
        booking.setStatus(BookingStatus.EXPIRED);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> handoverService.startHandover(bookingId, staffId));
        assertTrue(ex.getMessage().contains("EXPIRED"));
    }

    @Test
    @DisplayName("Should reject record inspection as legacy operation")
    void testRecordInspection_ExpiredBooking_ThrowsIllegalStateException() {
        VehicleInspectionRequest req = new VehicleInspectionRequest();
        req.setVehiclePartCode("BODY");
        req.setConditionStatus(InspectionCondition.GOOD);

        assertThrows(UnsupportedOperationException.class,
                () -> handoverService.recordInspection(handoverId, req, staffId));
    }

    @Test
    @DisplayName("Should reject mark ready when booking has EXPIRED")
    void testMarkReady_ExpiredBooking_ThrowsIllegalStateException() {
        booking.setEndTime(Instant.now().minus(10, ChronoUnit.MINUTES));
        handover.setStatus(HandoverStatus.INSPECTION_IN_PROGRESS);
        when(handoverRepository.findById(handoverId)).thenReturn(Optional.of(handover));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> handoverService.markReadyForHandover(handoverId, staffId));
        assertTrue(ex.getMessage().contains("EXPIRED"));
    }

    @Test
    @DisplayName("Should reject staff handover when booking has EXPIRED")
    void testConfirmStaffHandover_ExpiredBooking_ThrowsIllegalStateException() {
        booking.setEndTime(Instant.now().minus(5, ChronoUnit.MINUTES));
        handover.setStatus(HandoverStatus.READY_FOR_HANDOVER);
        when(handoverRepository.findById(handoverId)).thenReturn(Optional.of(handover));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> handoverService.confirmStaffHandover(handoverId, staffId));
        assertTrue(ex.getMessage().contains("EXPIRED"));
    }

    @Test
    @DisplayName("Should reject owner receipt confirmation when booking has EXPIRED")
    void testConfirmOwnerReceipt_ExpiredBooking_ThrowsIllegalStateException() {
        booking.setEndTime(Instant.now().minus(2, ChronoUnit.MINUTES));
        handover.setStatus(HandoverStatus.HANDED_OVER);
        when(handoverRepository.findById(handoverId)).thenReturn(Optional.of(handover));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> handoverService.confirmOwnerReceipt(handoverId, coOwnerId));
        assertTrue(ex.getMessage().contains("EXPIRED"));
    }

    @Test
    @DisplayName("Should reject owner condition acknowledgement when booking has EXPIRED")
    void testAcknowledgeCondition_ExpiredBooking_ThrowsIllegalStateException() {
        booking.setEndTime(Instant.now().minus(2, ChronoUnit.MINUTES));
        handover.setStatus(HandoverStatus.HANDED_OVER);
        when(handoverRepository.findById(handoverId)).thenReturn(Optional.of(handover));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> handoverService.acknowledgeCondition(handoverId, coOwnerId));
        assertTrue(ex.getMessage().contains("EXPIRED"));
    }

    @Test
    @DisplayName("Should reject start handover when it is TOO_EARLY outside preparation window")
    void testStartHandover_TooEarly_ThrowsIllegalStateException() {
        booking.setStartTime(Instant.now().plus(5, ChronoUnit.HOURS));
        booking.setEndTime(Instant.now().plus(7, ChronoUnit.HOURS));
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> handoverService.startHandover(bookingId, staffId));
        assertTrue(ex.getMessage().contains("TOO_EARLY"));
    }

    @Test
    @DisplayName("Should return VEHICLE_IN_USE when vehicle is in active trip or status is IN_USE")
    void testEligibility_VehicleInUse() {
        vehicle.setStatus(VehicleStatus.IN_USE);
        when(vehicleRepository.findById(vehicle.getId())).thenReturn(Optional.of(vehicle));

        VehicleHandoverEligibilityResponse res = handoverService.getHandoverEligibility(vehicle.getId(), staffId, Role.STAFF);
        assertNotNull(res);
        assertEquals(HandoverEligibilityReason.VEHICLE_IN_USE, res.getReason());
        assertEquals("XE ĐANG ĐƯỢC SỬ DỤNG", res.getMessage());
        assertFalse(res.isEligibleForInspection());
    }

    @Test
    @DisplayName("Should return HANDED_OVER when vehicle has been handed over")
    void testEligibility_HandedOver() {
        handover.setStatus(HandoverStatus.HANDED_OVER);
        when(vehicleRepository.findById(vehicle.getId())).thenReturn(Optional.of(vehicle));
        when(handoverRepository.findActiveByVehicleId(vehicle.getId())).thenReturn(List.of(handover));

        VehicleHandoverEligibilityResponse res = handoverService.getHandoverEligibility(vehicle.getId(), staffId, Role.STAFF);
        assertNotNull(res);
        assertEquals(HandoverEligibilityReason.HANDED_OVER, res.getReason());
        assertEquals("XE ĐÃ ĐƯỢC BÀN GIAO", res.getMessage());
        assertFalse(res.isEligibleForInspection());
    }

    @Test
    @DisplayName("Should return NO_BOOKING when vehicle has no confirmed bookings")
    void testEligibility_NoBooking() {
        when(vehicleRepository.findById(vehicle.getId())).thenReturn(Optional.of(vehicle));
        when(handoverRepository.findActiveByVehicleId(vehicle.getId())).thenReturn(Collections.emptyList());
        when(bookingRepository.findByVehicleIdOrderByStartTimeAsc(vehicle.getId())).thenReturn(Collections.emptyList());

        VehicleHandoverEligibilityResponse res = handoverService.getHandoverEligibility(vehicle.getId(), staffId, Role.STAFF);
        assertNotNull(res);
        assertEquals(HandoverEligibilityReason.NO_BOOKING, res.getReason());
        assertEquals("KHÔNG CÓ LỊCH BÀN GIAO", res.getMessage());
        assertFalse(res.isEligibleForInspection());
    }

    @Test
    @DisplayName("Should return BOOKING_EXPIRED when all bookings are in the past")
    void testEligibility_BookingExpired() {
        booking.setStartTime(Instant.now().minus(4, ChronoUnit.HOURS));
        booking.setEndTime(Instant.now().minus(2, ChronoUnit.HOURS));
        booking.setStatus(BookingStatus.EXPIRED);

        when(vehicleRepository.findById(vehicle.getId())).thenReturn(Optional.of(vehicle));
        when(handoverRepository.findActiveByVehicleId(vehicle.getId())).thenReturn(Collections.emptyList());
        when(bookingRepository.findByVehicleIdOrderByStartTimeAsc(vehicle.getId())).thenReturn(List.of(booking));

        VehicleHandoverEligibilityResponse res = handoverService.getHandoverEligibility(vehicle.getId(), staffId, Role.STAFF);
        assertNotNull(res);
        assertEquals(HandoverEligibilityReason.BOOKING_EXPIRED, res.getReason());
        assertEquals("LỊCH ĐẶT ĐÃ HẾT HIỆU LỰC", res.getMessage());
        assertFalse(res.isEligibleForInspection());
    }

    @Test
    @DisplayName("Should return TOO_EARLY when valid booking is outside preparation window")
    void testEligibility_TooEarly() {
        booking.setStartTime(Instant.now().plus(6, ChronoUnit.HOURS));
        booking.setEndTime(Instant.now().plus(8, ChronoUnit.HOURS));

        when(vehicleRepository.findById(vehicle.getId())).thenReturn(Optional.of(vehicle));
        when(handoverRepository.findActiveByVehicleId(vehicle.getId())).thenReturn(Collections.emptyList());
        when(bookingRepository.findByVehicleIdOrderByStartTimeAsc(vehicle.getId())).thenReturn(List.of(booking));

        VehicleHandoverEligibilityResponse res = handoverService.getHandoverEligibility(vehicle.getId(), staffId, Role.STAFF);
        assertNotNull(res);
        assertEquals(HandoverEligibilityReason.TOO_EARLY, res.getReason());
        assertEquals("CHƯA ĐẾN THỜI GIAN CHUẨN BỊ XE", res.getMessage());
        assertFalse(res.isEligibleForInspection());
        assertNotNull(res.getRecipientName());
        assertNotNull(res.getSecondsUntilPreparation());
        assertTrue(res.getSecondsUntilPreparation() > 0);
    }

    @Test
    @DisplayName("Should return READY_FOR_PREPARATION with controlled message when handover record is missing")
    void testEligibility_ReadyForPreparation_HandoverMissing() {
        booking.setStartTime(Instant.now().plus(1, ChronoUnit.HOURS));
        booking.setEndTime(Instant.now().plus(3, ChronoUnit.HOURS));

        when(vehicleRepository.findById(vehicle.getId())).thenReturn(Optional.of(vehicle));
        when(handoverRepository.findActiveByVehicleId(vehicle.getId())).thenReturn(Collections.emptyList());
        when(bookingRepository.findByVehicleIdOrderByStartTimeAsc(vehicle.getId())).thenReturn(List.of(booking));
        when(handoverRepository.findByBookingId(booking.getId())).thenReturn(Optional.empty());

        VehicleHandoverEligibilityResponse res = handoverService.getHandoverEligibility(vehicle.getId(), staffId, Role.STAFF);
        assertNotNull(res);
        assertEquals(HandoverEligibilityReason.READY_FOR_PREPARATION, res.getReason());
        assertEquals("Chưa có hồ sơ bàn giao cho lượt đặt xe này.", res.getMessage());
        assertTrue(res.isEligibleForInspection());
        assertNull(res.getHandover());
        assertFalse(Boolean.TRUE.equals(res.getHandoverAllowed()));
    }

    @Test
    @DisplayName("Should resolve persisted handover by bookingId when available")
    void testEligibility_ResolvesPersistedHandoverByBooking() {
        booking.setStartTime(Instant.now().plus(1, ChronoUnit.HOURS));
        booking.setEndTime(Instant.now().plus(3, ChronoUnit.HOURS));

        when(vehicleRepository.findById(vehicle.getId())).thenReturn(Optional.of(vehicle));
        when(handoverRepository.findActiveByVehicleId(vehicle.getId())).thenReturn(Collections.emptyList());
        when(bookingRepository.findByVehicleIdOrderByStartTimeAsc(vehicle.getId())).thenReturn(List.of(booking));
        when(handoverRepository.findByBookingId(booking.getId())).thenReturn(Optional.of(handover));

        VehicleHandoverEligibilityResponse res = handoverService.getHandoverEligibility(vehicle.getId(), staffId, Role.STAFF);
        assertNotNull(res);
        assertNotNull(res.getHandover());
        assertEquals(handover.getId(), res.getHandoverId());
    }

    @Test
    @DisplayName("Should return READY with handoverAllowed=true when latest inspection is PASS")
    void testEligibility_ReadyWhenInspectionPass() {
        booking.setStartTime(Instant.now().plus(1, ChronoUnit.HOURS));
        booking.setEndTime(Instant.now().plus(3, ChronoUnit.HOURS));

        VehicleInspection insp = new VehicleInspection(UUID.randomUUID(), vehicle, staff, InspectionType.PRE_HANDOVER);
        insp.setStatus(InspectionStatus.COMPLETED);
        insp.setOverallResult(InspectionOverallResult.PASS);
        insp.setCompletedAt(Instant.now().minus(30, ChronoUnit.MINUTES));

        when(vehicleRepository.findById(vehicle.getId())).thenReturn(Optional.of(vehicle));
        when(inspectionRepository.findLatestCompletedByVehicleId(vehicle.getId())).thenReturn(Optional.of(insp));
        when(handoverRepository.findActiveByVehicleId(vehicle.getId())).thenReturn(Collections.emptyList());
        when(bookingRepository.findByVehicleIdOrderByStartTimeAsc(vehicle.getId())).thenReturn(List.of(booking));
        when(handoverRepository.findByBookingId(booking.getId())).thenReturn(Optional.empty());

        VehicleHandoverEligibilityResponse res = handoverService.getHandoverEligibility(vehicle.getId(), staffId, Role.STAFF);
        assertNotNull(res);
        assertEquals(HandoverEligibilityReason.READY, res.getReason());
        assertTrue(Boolean.TRUE.equals(res.getHandoverAllowed()));
        assertTrue(res.isInspectionAvailable());
        assertTrue(res.isInspectionFresh());
        assertEquals("PASS", res.getInspectionResult());
    }

    @Test
    @DisplayName("TEST: When previous booking and handover completed, and no upcoming booking, returns NO_BOOKING (Case C)")
    void testEligibility_WhenPreviousBookingCompleted_AndNoUpcomingBooking_ReturnsNoBooking() {
        Booking oldBooking = new Booking(UUID.randomUUID(), vehicle, coOwner, Instant.now().minus(2, ChronoUnit.HOURS), Instant.now().plus(1, ChronoUnit.HOURS), BookingStatus.COMPLETED, "Commute");

        VehicleHandover oldHandover = new VehicleHandover(UUID.randomUUID(), oldBooking, vehicle, staff, coOwner, HandoverStatus.COMPLETED);

        when(vehicleRepository.findById(vehicle.getId())).thenReturn(Optional.of(vehicle));
        when(bookingRepository.findByVehicleIdOrderByStartTimeAsc(vehicle.getId())).thenReturn(List.of(oldBooking));
        when(handoverRepository.findByBookingId(oldBooking.getId())).thenReturn(Optional.of(oldHandover));

        VehicleHandoverEligibilityResponse res = handoverService.getHandoverEligibility(vehicle.getId(), staffId, Role.STAFF);

        assertNotNull(res);
        assertEquals(HandoverEligibilityReason.NO_BOOKING, res.getReason());
        assertEquals("Hiện không có lượt đặt xe nào cần bàn giao.", res.getMessage());
        assertNull(res.getBookingId());
        assertNull(res.getHandoverId());
        assertNull(res.getHandover());
        assertFalse(res.isHandoverAllowed());
        assertFalse(res.isEligibleForInspection());
    }

    @Test
    @DisplayName("TEST: When previous booking completed, resolves next upcoming booking with fresh handover cycle")
    void testEligibility_WhenPreviousBookingCompleted_ResolvesNextUpcomingBooking() {
        Booking oldBooking = new Booking(UUID.randomUUID(), vehicle, coOwner, Instant.now().minus(2, ChronoUnit.HOURS), Instant.now().plus(1, ChronoUnit.HOURS), BookingStatus.COMPLETED, "Commute");
        VehicleHandover oldHandover = new VehicleHandover(UUID.randomUUID(), oldBooking, vehicle, staff, coOwner, HandoverStatus.COMPLETED);

        Booking newBooking = new Booking(UUID.randomUUID(), vehicle, coOwner, Instant.now().plus(1, ChronoUnit.HOURS), Instant.now().plus(3, ChronoUnit.HOURS), BookingStatus.CONFIRMED, "Client Meeting");

        when(vehicleRepository.findById(vehicle.getId())).thenReturn(Optional.of(vehicle));
        when(bookingRepository.findByVehicleIdOrderByStartTimeAsc(vehicle.getId())).thenReturn(List.of(oldBooking, newBooking));
        when(handoverRepository.findByBookingId(oldBooking.getId())).thenReturn(Optional.of(oldHandover));
        when(handoverRepository.findByBookingId(newBooking.getId())).thenReturn(Optional.empty());

        VehicleHandoverEligibilityResponse res = handoverService.getHandoverEligibility(vehicle.getId(), staffId, Role.STAFF);

        assertNotNull(res);
        assertEquals(newBooking.getId(), res.getBookingId());
        assertNull(res.getHandoverId());
        assertNull(res.getHandover());
        assertEquals(HandoverEligibilityReason.READY_FOR_PREPARATION, res.getReason());
        assertEquals("Chưa có hồ sơ bàn giao cho lượt đặt xe này.", res.getMessage());
    }

    @Test
    @DisplayName("TEST: When booking has completed trip, it is excluded and returns NO_BOOKING if no other booking")
    void testEligibility_WhenBookingHasCompletedTrip_ExcludedFromHandover() {
        Booking activeBooking = new Booking(UUID.randomUUID(), vehicle, coOwner, Instant.now().minus(1, ChronoUnit.HOURS), Instant.now().plus(2, ChronoUnit.HOURS), BookingStatus.IN_PROGRESS, "Commute");

        when(vehicleRepository.findById(vehicle.getId())).thenReturn(Optional.of(vehicle));
        when(bookingRepository.findByVehicleIdOrderByStartTimeAsc(vehicle.getId())).thenReturn(List.of(activeBooking));
        when(tripRepository.existsByBooking_IdAndStatus(activeBooking.getId(), TripStatus.COMPLETED)).thenReturn(true);

        VehicleHandoverEligibilityResponse res = handoverService.getHandoverEligibility(vehicle.getId(), staffId, Role.STAFF);

        assertNotNull(res);
        assertEquals(HandoverEligibilityReason.NO_BOOKING, res.getReason());
        assertNull(res.getBookingId());
    }
}
