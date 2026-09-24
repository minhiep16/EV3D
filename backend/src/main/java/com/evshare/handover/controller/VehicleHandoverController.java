package com.evshare.handover.controller;

import com.evshare.handover.dto.VehicleHandoverResponse;
import com.evshare.handover.dto.VehicleInspectionRequest;
import com.evshare.handover.dto.VehicleInspectionResponse;
import com.evshare.handover.service.VehicleHandoverService;
import com.evshare.security.UserPrincipal;
import jakarta.validation.Valid;
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
public class VehicleHandoverController {

    private final VehicleHandoverService handoverService;

    public VehicleHandoverController(VehicleHandoverService handoverService) {
        this.handoverService = handoverService;
    }

    @GetMapping("/bookings/{bookingId}/handover")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<VehicleHandoverResponse> getHandoverByBooking(
            @PathVariable UUID bookingId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        VehicleHandoverResponse response = handoverService.getHandoverByBookingId(
                bookingId,
                principal.getId(),
                principal.getUser().getRole()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/vehicles/{vehicleId}/active-handover")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<VehicleHandoverResponse> getActiveHandoverForVehicle(
            @PathVariable UUID vehicleId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Optional<VehicleHandoverResponse> response = handoverService.getActiveHandoverForVehicle(
                vehicleId,
                principal.getId(),
                principal.getUser().getRole()
        );
        return response.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/vehicles/{vehicleId}/active-handovers")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<VehicleHandoverResponse>> getActiveHandoversForVehicle(
            @PathVariable UUID vehicleId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<VehicleHandoverResponse> response = handoverService.getActiveHandoversForVehicle(
                vehicleId,
                principal.getId(),
                principal.getUser().getRole()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/vehicles/{vehicleId}/handover-eligibility")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<com.evshare.handover.dto.VehicleHandoverEligibilityResponse> getHandoverEligibility(
            @PathVariable UUID vehicleId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        com.evshare.handover.dto.VehicleHandoverEligibilityResponse response = handoverService.getHandoverEligibility(
                vehicleId,
                principal.getId(),
                principal.getUser().getRole()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bookings/{bookingId}/handover/start")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<VehicleHandoverResponse> startHandover(
            @PathVariable UUID bookingId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        VehicleHandoverResponse response = handoverService.startHandover(bookingId, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/handovers/{handoverId}/inspections")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<VehicleInspectionResponse> recordInspection(
            @PathVariable UUID handoverId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody VehicleInspectionRequest request
    ) {
        VehicleInspectionResponse response = handoverService.recordInspection(handoverId, request, principal.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/handovers/{handoverId}/ready")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<VehicleHandoverResponse> markReady(
            @PathVariable UUID handoverId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        VehicleHandoverResponse response = handoverService.markReadyForHandover(handoverId, principal.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/handovers/{handoverId}/handover")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<VehicleHandoverResponse> confirmStaffHandover(
            @PathVariable UUID handoverId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        VehicleHandoverResponse response = handoverService.confirmStaffHandover(handoverId, principal.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/handovers/{handoverId}/acknowledge-condition")
    @PreAuthorize("hasRole('CO_OWNER')")
    public ResponseEntity<VehicleHandoverResponse> acknowledgeCondition(
            @PathVariable UUID handoverId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        VehicleHandoverResponse response = handoverService.acknowledgeCondition(handoverId, principal.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/handovers/{handoverId}/owner-confirm")
    @PreAuthorize("hasRole('CO_OWNER')")
    public ResponseEntity<VehicleHandoverResponse> confirmOwnerReceipt(
            @PathVariable UUID handoverId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        VehicleHandoverResponse response = handoverService.confirmOwnerReceipt(handoverId, principal.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/handovers/{handoverId}/complete")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'CO_OWNER')")
    public ResponseEntity<VehicleHandoverResponse> completeHandover(
            @PathVariable UUID handoverId
    ) {
        VehicleHandoverResponse response = handoverService.completeHandover(handoverId);
        return ResponseEntity.ok(response);
    }
}
