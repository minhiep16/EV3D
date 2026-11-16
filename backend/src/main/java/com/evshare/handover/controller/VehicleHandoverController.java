package com.evshare.handover.controller;

import com.evshare.handover.dto.HandoverEligibilityReason;
import com.evshare.handover.dto.VehicleHandoverEligibilityResponse;
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

    @GetMapping(value = {"/vehicles/{vehicleId}/active-handover", "/vehicles/{vehicleId}/handovers/active"})
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<VehicleHandoverResponse> getActiveHandoverForVehicle(
            @PathVariable String vehicleId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        UUID resolvedId = handoverService.resolvePersistentVehicleId(vehicleId);
        if (resolvedId == null) {
            return ResponseEntity.noContent().build();
        }
        Optional<VehicleHandoverResponse> response = handoverService.getActiveHandoverForVehicle(
                resolvedId,
                principal.getId(),
                principal.getUser().getRole()
        );
        return response.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping(value = {"/vehicles/{vehicleId}/handover-history", "/vehicles/{vehicleId}/handovers/history"})
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<VehicleHandoverResponse>> getHandoverHistory(
            @PathVariable String vehicleId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        UUID resolvedId = handoverService.resolvePersistentVehicleId(vehicleId);
        if (resolvedId == null) {
            return ResponseEntity.ok(List.of());
        }
        List<VehicleHandoverResponse> response = handoverService.getHandoverHistory(
                resolvedId,
                principal.getId(),
                principal.getUser().getRole()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/vehicles/{vehicleId}/active-handovers")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<VehicleHandoverResponse>> getActiveHandoversForVehicle(
            @PathVariable String vehicleId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        UUID resolvedId = handoverService.resolvePersistentVehicleId(vehicleId);
        if (resolvedId == null) {
            return ResponseEntity.ok(List.of());
        }
        List<VehicleHandoverResponse> response = handoverService.getActiveHandoversForVehicle(
                resolvedId,
                principal.getId(),
                principal.getUser().getRole()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/vehicles/{vehicleId}/handover-eligibility")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<VehicleHandoverEligibilityResponse> getHandoverEligibility(
            @PathVariable String vehicleId,
            @RequestParam(required = false) UUID bookingId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (bookingId != null) {
            VehicleHandoverEligibilityResponse response = handoverService.getHandoverEligibilityByBookingId(
                    bookingId,
                    principal.getId(),
                    principal.getUser().getRole()
            );
            return ResponseEntity.ok(response);
        }
        UUID resolvedId = handoverService.resolvePersistentVehicleId(vehicleId);
        if (resolvedId == null) {
            return ResponseEntity.ok(VehicleHandoverEligibilityResponse.notFound("Không tìm thấy phương tiện với mã định danh cung cấp."));
        }
        VehicleHandoverEligibilityResponse response = handoverService.getHandoverEligibility(
                resolvedId,
                principal.getId(),
                principal.getUser().getRole()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/bookings/{bookingId}/handover-eligibility")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<VehicleHandoverEligibilityResponse> getHandoverEligibilityByBooking(
            @PathVariable UUID bookingId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        VehicleHandoverEligibilityResponse response = handoverService.getHandoverEligibilityByBookingId(
                bookingId,
                principal.getId(),
                principal.getUser().getRole()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/handovers/{handoverId}/eligibility")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<VehicleHandoverEligibilityResponse> getHandoverEligibilityByHandover(
            @PathVariable UUID handoverId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        VehicleHandoverEligibilityResponse response = handoverService.getHandoverEligibilityByHandoverId(
                handoverId,
                principal.getId(),
                principal.getUser().getRole()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bookings/{bookingId}/handover")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<VehicleHandoverResponse> createHandover(
            @PathVariable UUID bookingId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        VehicleHandoverResponse response = handoverService.createHandover(bookingId, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/bookings/{bookingId}/handover/start")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<VehicleHandoverResponse> startHandover(
            @PathVariable UUID bookingId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        VehicleHandoverResponse response = handoverService.startHandover(bookingId, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Deprecated
    @SuppressWarnings("deprecation")
    @PostMapping("/handovers/{handoverId}/inspections")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<VehicleInspectionResponse> recordInspection(
            @PathVariable UUID handoverId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody VehicleInspectionRequest request
    ) {
        VehicleInspectionResponse response = handoverService.recordInspection(handoverId, request, principal.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/handovers/{handoverId}/ready")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<VehicleHandoverResponse> markReady(
            @PathVariable UUID handoverId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        VehicleHandoverResponse response = handoverService.markReadyForHandover(handoverId, principal.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/handovers/{handoverId}/handover")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
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

    @PostMapping("/handovers/{handoverId}/recover")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<VehicleHandoverResponse> recoverVehicle(
            @PathVariable UUID handoverId,
            @RequestBody(required = false) java.util.Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        String note = (body != null && body.containsKey("note")) ? body.get("note") : null;
        VehicleHandoverResponse response = handoverService.recoverVehicle(handoverId, principal.getId(), note);
        return ResponseEntity.ok(response);
    }
}
