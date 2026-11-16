package com.evshare.vehicle.controller;

import com.evshare.vehicle.dto.CreateVehicleRequest;
import com.evshare.vehicle.dto.UpdateVehicleRequest;
import com.evshare.vehicle.dto.VehicleAnalyticsResponse;
import com.evshare.vehicle.dto.VehicleResponse;
import com.evshare.vehicle.service.VehicleAnalyticsService;
import com.evshare.vehicle.service.VehicleService;
import com.evshare.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleService vehicleService;
    private final VehicleAnalyticsService vehicleAnalyticsService;

    public VehicleController(VehicleService vehicleService, VehicleAnalyticsService vehicleAnalyticsService) {
        this.vehicleService = vehicleService;
        this.vehicleAnalyticsService = vehicleAnalyticsService;
    }

    @GetMapping
    public ResponseEntity<List<VehicleResponse>> getAllVehicles(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<VehicleResponse> vehicles = vehicleService.getAllVehicles(principal);
        return ResponseEntity.ok(vehicles);
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleResponse> getVehicleById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        VehicleResponse vehicle = vehicleService.getVehicleById(id, principal);
        return ResponseEntity.ok(vehicle);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VehicleResponse> createVehicle(@Valid @RequestBody CreateVehicleRequest request) {
        VehicleResponse created = vehicleService.createVehicle(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CO_OWNER')")
    public ResponseEntity<VehicleResponse> updateVehicle(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateVehicleRequest request
    ) {
        VehicleResponse updated = vehicleService.updateVehicle(id, request);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}/analytics")
    public ResponseEntity<VehicleAnalyticsResponse> getVehicleAnalytics(
            @PathVariable String id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        VehicleAnalyticsResponse response = vehicleAnalyticsService.getVehicleAnalytics(id, from, to, principal);
        return ResponseEntity.ok(response);
    }
}
