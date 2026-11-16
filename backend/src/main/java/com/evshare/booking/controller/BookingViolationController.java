package com.evshare.booking.controller;

import com.evshare.booking.dto.BookingViolationResponse;
import com.evshare.booking.entity.BookingViolation;
import com.evshare.booking.entity.BookingViolationStatus;
import com.evshare.booking.repository.BookingViolationRepository;
import com.evshare.booking.service.BookingLifecycleService;
import com.evshare.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/violations")
public class BookingViolationController {

    private final BookingViolationRepository violationRepository;
    private final BookingLifecycleService lifecycleService;

    public BookingViolationController(
            BookingViolationRepository violationRepository,
            BookingLifecycleService lifecycleService
    ) {
        this.violationRepository = violationRepository;
        this.lifecycleService = lifecycleService;
    }

    @GetMapping("/my-violations")
    @PreAuthorize("hasRole('CO_OWNER')")
    public ResponseEntity<List<BookingViolationResponse>> getMyViolations(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<BookingViolation> list = violationRepository.findByUserIdOrderByCreatedAtDesc(principal.getId());
        List<BookingViolationResponse> responses = list.stream()
                .map(BookingViolationResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/vehicle/{vehicleId}")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<BookingViolationResponse>> getVehicleViolations(
            @PathVariable UUID vehicleId
    ) {
        List<BookingViolation> list = violationRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId);
        List<BookingViolationResponse> responses = list.stream()
                .map(BookingViolationResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/booking/{bookingId}")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<BookingViolationResponse> getViolationByBooking(
            @PathVariable UUID bookingId
    ) {
        return violationRepository.findByBookingId(bookingId)
                .map(BookingViolationResponse::fromEntity)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/pending-recovery")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<List<BookingViolationResponse>> getPendingRecoveryViolations() {
        List<BookingViolation> list = violationRepository.findByResolutionStatusOrderByCreatedAtDesc(BookingViolationStatus.RECOVERY_PENDING);
        List<BookingViolationResponse> responses = list.stream()
                .map(BookingViolationResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @PostMapping("/recover-vehicle")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<BookingViolationResponse> recoverVehicle(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Object targetIdObj = body.get("violationId");
        if (targetIdObj == null) {
            targetIdObj = body.get("handoverId");
        }
        if (targetIdObj == null) {
            targetIdObj = body.get("bookingId");
        }

        if (targetIdObj == null) {
            return ResponseEntity.badRequest().build();
        }

        UUID targetId = UUID.fromString(targetIdObj.toString());
        String note = body.get("note") != null ? body.get("note").toString() : null;

        BookingViolationResponse response = lifecycleService.recoverVehicle(targetId, principal.getId(), note);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{violationId}/recover")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<BookingViolationResponse> recoverVehicleById(
            @PathVariable UUID violationId,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        String note = (body != null && body.containsKey("note")) ? body.get("note") : null;
        BookingViolationResponse response = lifecycleService.recoverVehicle(violationId, principal.getId(), note);
        return ResponseEntity.ok(response);
    }
}
