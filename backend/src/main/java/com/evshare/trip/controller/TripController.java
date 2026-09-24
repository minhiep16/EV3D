package com.evshare.trip.controller;

import com.evshare.security.UserPrincipal;
import com.evshare.trip.dto.TripResponse;
import com.evshare.trip.dto.TripStartEligibilityResponse;
import com.evshare.trip.service.TripService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class TripController {

    private final TripService tripService;

    public TripController(TripService tripService) {
        this.tripService = tripService;
    }

    /**
     * Get trip start eligibility for a booking (Section 11).
     * Computed on backend; never mutates data.
     */
    @GetMapping("/bookings/{bookingId}/trip/start-eligibility")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<TripStartEligibilityResponse> getStartEligibility(
            @PathVariable UUID bookingId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        TripStartEligibilityResponse response = tripService.checkStartEligibility(
                bookingId,
                principal.getId(),
                principal.getUser().getRole()
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Start a trip for a booking (Section 11 & 12).
     * Exclusively accessible by the authenticated CO_OWNER who owns the booking.
     */
    @PostMapping("/bookings/{bookingId}/trip/start")
    @PreAuthorize("hasRole('CO_OWNER')")
    public ResponseEntity<TripResponse> startTrip(
            @PathVariable UUID bookingId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        TripResponse response = tripService.startTrip(
                bookingId,
                principal.getId(),
                principal.getUser().getRole()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Retrieve trip associated with a booking (Section 11).
     */
    @GetMapping("/bookings/{bookingId}/trip")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<TripResponse> getTripByBooking(
            @PathVariable UUID bookingId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Optional<TripResponse> response = tripService.getTripByBookingId(
                bookingId,
                principal.getId(),
                principal.getUser().getRole()
        );
        return response.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    /**
     * Retrieve active trip for a vehicle (for reload restoration & operations monitoring).
     */
    @GetMapping("/vehicles/{vehicleId}/active-trip")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<TripResponse> getActiveTripForVehicle(
            @PathVariable UUID vehicleId
    ) {
        Optional<TripResponse> response = tripService.getActiveTripForVehicle(vehicleId);
        return response.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    /**
     * Retrieve trip by trip ID (purely read-only query).
     */
    @GetMapping("/trips/{tripId}")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<TripResponse> getTripById(
            @PathVariable UUID tripId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Optional<TripResponse> response = tripService.getTripById(
                tripId,
                principal.getId(),
                principal.getUser().getRole()
        );
        return response.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
