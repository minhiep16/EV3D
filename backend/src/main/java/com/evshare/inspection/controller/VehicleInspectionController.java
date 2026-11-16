package com.evshare.inspection.controller;

import com.evshare.inspection.dto.CompleteInspectionRequest;
import com.evshare.inspection.dto.InspectionComparisonResponse;
import com.evshare.inspection.dto.VehicleInspectionItemRequest;
import com.evshare.inspection.dto.VehicleInspectionResponse;
import com.evshare.inspection.entity.InspectionType;
import com.evshare.inspection.service.VehicleInspectionService;
import com.evshare.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class VehicleInspectionController {

    private final VehicleInspectionService inspectionService;

    public VehicleInspectionController(VehicleInspectionService inspectionService) {
        this.inspectionService = inspectionService;
    }

    @GetMapping("/vehicles/{vehicleId}/inspections/latest-completed")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<VehicleInspectionResponse> getLatestCompleted(
            @PathVariable UUID vehicleId
    ) {
        Optional<VehicleInspectionResponse> opt = inspectionService.getLatestCompletedInspection(vehicleId);
        return opt.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/vehicles/{vehicleId}/inspections/active")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<VehicleInspectionResponse> getActiveInspection(
            @PathVariable UUID vehicleId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Optional<VehicleInspectionResponse> opt = inspectionService.getActiveInspection(vehicleId, principal);
        return opt.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/vehicles/{vehicleId}/inspections/start")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<VehicleInspectionResponse> startInspection(
            @PathVariable UUID vehicleId,
            @RequestParam(required = false, defaultValue = "PRE_HANDOVER") InspectionType type,
            @RequestParam(required = false, defaultValue = "false") boolean forceNew,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        VehicleInspectionResponse response = inspectionService.startOrGetActiveInspection(vehicleId, principal.getId(), type, forceNew);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/inspections/{inspectionId}")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<VehicleInspectionResponse> getInspectionById(
            @PathVariable UUID inspectionId
    ) {
        VehicleInspectionResponse response = inspectionService.getInspectionById(inspectionId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/inspections/{inspectionId}/items")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<VehicleInspectionResponse> recordItem(
            @PathVariable UUID inspectionId,
            @Valid @RequestBody VehicleInspectionItemRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        VehicleInspectionResponse response = inspectionService.recordInspectionItem(inspectionId, request, principal.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/inspections/{inspectionId}/complete")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<VehicleInspectionResponse> completeInspection(
            @PathVariable UUID inspectionId,
            @RequestBody(required = false) CompleteInspectionRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        VehicleInspectionResponse response = inspectionService.completeInspection(inspectionId, request, principal.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * Compare pre-handover and post-trip inspections (Phase 2 Section 10).
     */
    @GetMapping("/inspections/compare")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<InspectionComparisonResponse> compareInspections(
            @RequestParam UUID preInspectionId,
            @RequestParam UUID postInspectionId
    ) {
        InspectionComparisonResponse response =
                inspectionService.compareInspections(preInspectionId, postInspectionId);
        return ResponseEntity.ok(response);
    }

    /**
     * Compare pre and post inspections for a given trip.
     */
    @GetMapping("/trips/{tripId}/inspection-comparison")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<InspectionComparisonResponse> getTripInspectionComparison(
            @PathVariable UUID tripId
    ) {
        InspectionComparisonResponse response =
                inspectionService.compareTripInspections(tripId);
        return ResponseEntity.ok(response);
    }
}
