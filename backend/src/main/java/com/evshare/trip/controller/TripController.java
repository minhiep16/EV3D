package com.evshare.trip.controller;

import com.evshare.common.exception.UnauthorizedException;
import com.evshare.security.UserPrincipal;
import com.evshare.trip.dto.CompleteTripRequest;
import com.evshare.trip.dto.ConfirmTripReturnRequest;
import com.evshare.trip.dto.TripResponse;
import com.evshare.trip.dto.TripStartEligibilityResponse;
import com.evshare.trip.service.TripService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class TripController {

    private final TripService tripService;
    private final com.evshare.trip.service.TripExtensionService tripExtensionService;

    public TripController(TripService tripService, com.evshare.trip.service.TripExtensionService tripExtensionService) {
        this.tripService = tripService;
        this.tripExtensionService = tripExtensionService;
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
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để kiểm tra điều kiện");
        }
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
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để bắt đầu chuyến đi");
        }
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
     * Retrieve the latest completed trip for a vehicle (for completed-trip summary after return).
     * For CO_OWNER: restricted to their own completed trip on this vehicle.
     * For STAFF/ADMIN: retrieves the vehicle's latest completed trip.
     */
    @GetMapping("/vehicles/{vehicleId}/latest-completed-trip")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<TripResponse> getLatestCompletedTripForVehicle(
            @PathVariable UUID vehicleId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để xem thông tin chuyến đi.");
        }
        Optional<TripResponse> response = tripService.getLatestCompletedTripForVehicle(vehicleId, principal);
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

    /**
     * Acknowledge viewing completed trip details to dismiss the summary card from vehicle overview.
     */
    @PostMapping("/trips/{tripId}/acknowledge")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<TripResponse> acknowledgeTrip(
            @PathVariable UUID tripId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }
        return ResponseEntity.ok(tripService.acknowledgeTripViewed(tripId, principal));
    }

    /**
     * Check extension availability and detect conflicts (Section 5 & 14).
     */
    @PostMapping("/trips/{tripId}/extend/check")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'ADMIN')")
    public ResponseEntity<com.evshare.trip.dto.TripExtensionCheckResponse> checkExtensionAvailability(
            @PathVariable UUID tripId,
            @RequestBody com.evshare.trip.dto.ExtendTripRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }
        int minutes = request.getAdditionalMinutes() != null ? request.getAdditionalMinutes() : 30;
        return ResponseEntity.ok(tripExtensionService.checkAvailability(
                tripId, minutes, principal.getId(), principal.getUser().getRole()));
    }

    /**
     * Extend an active trip (Section 3, 6, 7).
     * Supports both POST and PATCH methods.
     */
    @RequestMapping(value = "/trips/{tripId}/extend", method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasAnyRole('CO_OWNER', 'ADMIN')")
    public ResponseEntity<?> extendTrip(
            @PathVariable UUID tripId,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody com.evshare.trip.dto.ExtendTripRequest request
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để gia hạn chuyến đi");
        }
        if (Boolean.TRUE.equals(request.getRequestNegotiation())) {
            int minutes = request.getAdditionalMinutes() != null ? request.getAdditionalMinutes() : 30;
            com.evshare.trip.dto.TripExtensionRequestResponse res = tripExtensionService.createNegotiationRequest(
                    tripId, minutes, request.getReason(), principal.getId(), principal.getUser().getRole());
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(res);
        }

        TripResponse response = tripService.extendTrip(
                tripId,
                principal.getId(),
                principal.getUser().getRole(),
                request
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Submit a direct booking negotiation request (Section 7, 8).
     */
    @PostMapping("/trips/{tripId}/extend/negotiate")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'ADMIN')")
    public ResponseEntity<com.evshare.trip.dto.TripExtensionRequestResponse> createNegotiationRequest(
            @PathVariable UUID tripId,
            @RequestBody com.evshare.trip.dto.ExtendTripRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }
        int minutes = request.getAdditionalMinutes() != null ? request.getAdditionalMinutes() : 30;
        com.evshare.trip.dto.TripExtensionRequestResponse res = tripExtensionService.createNegotiationRequest(
                tripId, minutes, request.getReason(), principal.getId(), principal.getUser().getRole());
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    /**
     * Retrieve active pending extension request for a trip.
     */
    @GetMapping("/trips/{tripId}/extension-request/active")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<com.evshare.trip.dto.TripExtensionRequestResponse> getActiveRequestForTrip(
            @PathVariable UUID tripId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }
        Optional<com.evshare.trip.dto.TripExtensionRequestResponse> opt = tripExtensionService.getActiveRequestForTrip(
                tripId, principal.getId(), principal.getUser().getRole());
        return opt.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }

    /**
     * Retrieve pending extension requests for the authenticated user (Section 9).
     */
    @GetMapping("/trips/extension-requests/pending")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<com.evshare.trip.dto.TripExtensionRequestResponse>> getPendingRequestsForUser(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }
        return ResponseEntity.ok(tripExtensionService.getPendingRequestsForUser(principal.getId()));
    }

    /**
     * Retrieve specific request details by ID.
     */
    @GetMapping("/trips/extension-requests/{requestId}")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<com.evshare.trip.dto.TripExtensionRequestResponse> getRequestById(
            @PathVariable UUID requestId
    ) {
        return ResponseEntity.ok(tripExtensionService.getRequestById(requestId));
    }

    /**
     * Accept a booking negotiation request (Section 10).
     */
    @PostMapping("/trips/extension-requests/{requestId}/accept")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'ADMIN')")
    public ResponseEntity<com.evshare.trip.dto.TripExtensionRequestResponse> acceptExtensionRequest(
            @PathVariable UUID requestId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }
        return ResponseEntity.ok(tripExtensionService.acceptExtensionRequest(
                requestId, principal.getId(), principal.getUser().getRole()));
    }

    /**
     * Reject a booking negotiation request (Section 12).
     */
    @PostMapping("/trips/extension-requests/{requestId}/reject")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'ADMIN')")
    public ResponseEntity<com.evshare.trip.dto.TripExtensionRequestResponse> rejectExtensionRequest(
            @PathVariable UUID requestId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }
        return ResponseEntity.ok(tripExtensionService.rejectExtensionRequest(
                requestId, principal.getId(), principal.getUser().getRole()));
    }

    /**
     * Cancel a pending extension request (Section 12).
     */
    @PostMapping("/trips/extension-requests/{requestId}/cancel")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'ADMIN')")
    public ResponseEntity<com.evshare.trip.dto.TripExtensionRequestResponse> cancelExtensionRequest(
            @PathVariable UUID requestId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }
        return ResponseEntity.ok(tripExtensionService.cancelExtensionRequest(
                requestId, principal.getId(), principal.getUser().getRole()));
    }

    /**
     * CO_OWNER requests vehicle return (Phase 10-12 & Section 7).
     * Exclusively accessible by the authenticated CO_OWNER who owns the active trip.
     */
    @PostMapping("/trips/{tripId}/request-return")
    @PreAuthorize("hasRole('CO_OWNER')")
    public ResponseEntity<TripResponse> requestReturn(
            @PathVariable UUID tripId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để yêu cầu trả xe");
        }
        TripResponse response = tripService.requestTripReturn(
                tripId,
                principal.getId(),
                principal.getUser().getRole()
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Complete / check-out an active trip (Phase 12 & Phase 18 Realistic EV Energy Model).
     * Exclusively accessible by the authenticated CO_OWNER who owns the active trip.
     */
    @PostMapping("/trips/{tripId}/complete")
    @PreAuthorize("hasRole('CO_OWNER')")
    public ResponseEntity<TripResponse> completeTrip(
            @PathVariable UUID tripId,
            @RequestBody(required = false) CompleteTripRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để trả xe");
        }
        TripResponse response = tripService.completeTrip(
                tripId,
                principal.getId(),
                principal.getUser().getRole(),
                request != null ? request.getEndOdometer() : null
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieve all pending vehicle return requests (STEP 2: STAFF receives vehicle).
     * Exclusively accessible by STAFF or ADMIN.
     */
    @GetMapping("/trips/pending-returns")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<List<TripResponse>> getPendingReturns() {
        return ResponseEntity.ok(tripService.getPendingReturnTrips());
    }

    /**
     * STAFF confirms vehicle return and verifies condition & energy usage (Phase 18 & 19).
     * Authoritatively creates verified trip energy expense.
     * Exclusively accessible by STAFF or ADMIN.
     */
    @PostMapping("/trips/{tripId}/confirm-return")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<TripResponse> confirmReturn(
            @PathVariable UUID tripId,
            @RequestBody(required = false) ConfirmTripReturnRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để xác nhận trả xe");
        }
        TripResponse response = tripService.confirmTripReturn(
                tripId,
                request,
                principal.getId(),
                principal.getUser().getRole()
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieve chronological trip history for a vehicle.
     * Accessible by STAFF, ADMIN, and CO_OWNER (with ownership validation in service).
     */
    @GetMapping("/vehicles/{vehicleId}/trips")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'CO_OWNER')")
    public ResponseEntity<List<TripResponse>> getTripsForVehicle(
            @PathVariable UUID vehicleId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để xem lịch sử chuyến đi");
        }
        List<TripResponse> trips = tripService.getTripsForVehicle(vehicleId, principal);
        return ResponseEntity.ok(trips);
    }
}
