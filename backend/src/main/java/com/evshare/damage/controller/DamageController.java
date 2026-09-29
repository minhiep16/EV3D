package com.evshare.damage.controller;

import com.evshare.common.exception.UnauthorizedException;
import com.evshare.damage.dto.CreateDamageRequest;
import com.evshare.damage.dto.DamageRecordResponse;
import com.evshare.damage.service.DamageService;
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
public class DamageController {

    private final DamageService damageService;

    public DamageController(DamageService damageService) {
        this.damageService = damageService;
    }

    /**
     * STAFF records a new 3D damage for a completed trip (Phase 13).
     */
    @PostMapping("/trips/{tripId}/damages")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<DamageRecordResponse> recordTripDamage(
            @PathVariable UUID tripId,
            @Valid @RequestBody CreateDamageRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để thực hiện ghi nhận hư hỏng");
        }

        DamageRecordResponse response = damageService.createDamage(
                tripId,
                request,
                principal.getId(),
                principal.getUser().getRole()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * STAFF records a new 3D damage for a vehicle (associates to latest completed trip).
     */
    @PostMapping("/vehicles/{vehicleId}/damages")
    @PreAuthorize("hasAnyRole('STAFF', 'CO_OWNER')")
    public ResponseEntity<DamageRecordResponse> recordVehicleDamage(
            @PathVariable UUID vehicleId,
            @Valid @RequestBody CreateDamageRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để thực hiện ghi nhận hư hỏng");
        }

        DamageRecordResponse response = damageService.createDamageForVehicle(
                vehicleId,
                request,
                principal.getId(),
                principal.getUser().getRole()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get all damage records for a trip.
     * STAFF and ADMIN can view all; CO_OWNER can view only for their own trip.
     */
    @GetMapping("/trips/{tripId}/damages")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'CO_OWNER')")
    public ResponseEntity<List<DamageRecordResponse>> getDamagesByTrip(
            @PathVariable UUID tripId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để xem thông tin hư hỏng");
        }

        List<DamageRecordResponse> damages = damageService.getDamagesByTrip(
                tripId,
                principal.getId(),
                principal.getUser().getRole()
        );

        return ResponseEntity.ok(damages);
    }

    /**
     * Get all damage records for a vehicle (vehicle damage history / inspection view).
     */
    @GetMapping("/vehicles/{vehicleId}/damages")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'CO_OWNER')")
    public ResponseEntity<List<DamageRecordResponse>> getDamagesByVehicle(
            @PathVariable UUID vehicleId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<DamageRecordResponse> damages = damageService.getDamagesByVehicle(vehicleId, principal);
        return ResponseEntity.ok(damages);
    }
}
