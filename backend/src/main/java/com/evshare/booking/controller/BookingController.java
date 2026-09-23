package com.evshare.booking.controller;

import com.evshare.booking.dto.BookingResponse;
import com.evshare.booking.dto.CreateBookingRequest;
import com.evshare.booking.service.BookingService;
import com.evshare.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping("/vehicles/{vehicleId}/bookings")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<BookingResponse>> getVehicleBookings(@PathVariable UUID vehicleId) {
        List<BookingResponse> bookings = bookingService.getBookingsByVehicle(vehicleId);
        return ResponseEntity.ok(bookings);
    }

    @PostMapping("/vehicles/{vehicleId}/bookings")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<BookingResponse> createBooking(
            @PathVariable UUID vehicleId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateBookingRequest request
    ) {
        UUID userId = principal.getId();
        BookingResponse created = bookingService.createBooking(vehicleId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/bookings/{bookingId}/cancel")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<BookingResponse> cancelBooking(
            @PathVariable UUID bookingId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        boolean isAdmin = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        BookingResponse cancelled = bookingService.cancelBooking(bookingId, principal.getId(), isAdmin);
        return ResponseEntity.ok(cancelled);
    }
}
