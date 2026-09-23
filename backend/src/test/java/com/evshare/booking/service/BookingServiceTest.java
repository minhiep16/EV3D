package com.evshare.booking.service;

import com.evshare.booking.dto.BookingResponse;
import com.evshare.booking.dto.CreateBookingRequest;
import com.evshare.booking.entity.Booking;
import com.evshare.booking.entity.BookingStatus;
import com.evshare.booking.repository.BookingRepository;
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
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private BookingService bookingService;

    private UUID vehicleId;
    private UUID userId;
    private Vehicle vehicle;
    private User user;

    @BeforeEach
    void setUp() {
        vehicleId = UUID.randomUUID();
        userId = UUID.randomUUID();

        vehicle = new Vehicle();
        vehicle.setId(vehicleId);
        vehicle.setName("EVShare Demo EV");
        vehicle.setBrand("Demo");
        vehicle.setModel("EV One");
        vehicle.setYear(2026);
        vehicle.setLicensePlate("51E-123.45");
        vehicle.setVin("EVSHAREDEMO000001");
        vehicle.setBatteryCapacity(new BigDecimal("75.00"));
        vehicle.setCurrentBatteryLevel(82);
        vehicle.setOdometer(new BigDecimal("10200.00"));
        vehicle.setStatus(VehicleStatus.AVAILABLE);
        vehicle.setModel3dUrl("/models/ev-car.glb");

        user = new User(
                userId,
                "owner_a@evshare.com",
                "hashedpassword",
                "Nguyen Van A",
                Role.CO_OWNER,
                UserStatus.ACTIVE
        );
    }

    @Test
    @DisplayName("Should successfully create a booking when interval is valid and has no conflicts")
    void createBooking_Success() {
        Instant now = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant start = now.truncatedTo(ChronoUnit.HOURS);
        Instant end = start.plus(2, ChronoUnit.HOURS);

        CreateBookingRequest request = new CreateBookingRequest(start, end, "Gặp khách hàng");

        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(bookingRepository.findConflictingBookings(eq(vehicleId), eq(start), eq(end), any()))
                .thenReturn(Collections.emptyList());

        Booking savedBooking = new Booking(UUID.randomUUID(), vehicle, user, start, end, BookingStatus.CONFIRMED, "Gặp khách hàng");
        when(bookingRepository.save(any(Booking.class))).thenReturn(savedBooking);

        BookingResponse response = bookingService.createBooking(vehicleId, userId, request);

        assertNotNull(response);
        assertEquals(vehicleId, response.getVehicleId());
        assertEquals(userId, response.getUserId());
        assertEquals(BookingStatus.CONFIRMED, response.getStatus());
        assertEquals("Gặp khách hàng", response.getPurpose());
        verify(bookingRepository, times(1)).save(any(Booking.class));
    }

    @Test
    @DisplayName("Should reject booking when requested interval conflicts with existing booking")
    void createBooking_Conflict_ThrowsException() {
        Instant now = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant start = now.truncatedTo(ChronoUnit.HOURS);
        Instant end = start.plus(2, ChronoUnit.HOURS);

        CreateBookingRequest request = new CreateBookingRequest(start, end, "Gặp khách hàng");

        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        Booking existing = new Booking(UUID.randomUUID(), vehicle, user, start.minus(1, ChronoUnit.HOURS), start.plus(1, ChronoUnit.HOURS), BookingStatus.CONFIRMED, "Lịch khác");
        when(bookingRepository.findConflictingBookings(eq(vehicleId), eq(start), eq(end), any()))
                .thenReturn(List.of(existing));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                bookingService.createBooking(vehicleId, userId, request)
        );

        assertTrue(ex.getMessage().contains("Khung giờ này đã được đặt"));
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    @DisplayName("Should reject booking when end time is before or equal to start time")
    void createBooking_InvalidInterval_ThrowsException() {
        Instant now = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant start = now.truncatedTo(ChronoUnit.HOURS);
        Instant end = start.minus(1, ChronoUnit.HOURS); // End is before start

        CreateBookingRequest request = new CreateBookingRequest(start, end, "Lỗi giờ");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                bookingService.createBooking(vehicleId, userId, request)
        );

        assertTrue(ex.getMessage().contains("Thời gian kết thúc phải sau"));
    }

    @Test
    @DisplayName("Should reject booking when start time is in the past")
    void createBooking_PastTime_ThrowsException() {
        Instant pastStart = Instant.now().minus(1, ChronoUnit.DAYS);
        Instant pastEnd = pastStart.plus(2, ChronoUnit.HOURS);

        CreateBookingRequest request = new CreateBookingRequest(pastStart, pastEnd, "Quá khứ");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                bookingService.createBooking(vehicleId, userId, request)
        );

        assertTrue(ex.getMessage().contains("Không thể đặt xe trong quá khứ"));
    }

    @Test
    @DisplayName("Should cancel an existing booking successfully")
    void cancelBooking_Success() {
        UUID bookingId = UUID.randomUUID();
        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant end = start.plus(2, ChronoUnit.HOURS);
        Booking booking = new Booking(bookingId, vehicle, user, start, end, BookingStatus.CONFIRMED, "Test");

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BookingResponse response = bookingService.cancelBooking(bookingId, userId, false);

        assertNotNull(response);
        assertEquals(BookingStatus.CANCELLED, response.getStatus());
        verify(bookingRepository, times(1)).save(booking);
    }
}
