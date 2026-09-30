package com.evshare.battery.controller;

import com.evshare.battery.dto.BatteryHealthResponse;
import com.evshare.battery.service.BatteryHealthService;
import com.evshare.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/vehicles/{vehicleId}/battery-health")
public class BatteryHealthController {

    private final BatteryHealthService batteryHealthService;

    public BatteryHealthController(BatteryHealthService batteryHealthService) {
        this.batteryHealthService = batteryHealthService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<BatteryHealthResponse> getBatteryHealth(
            @PathVariable UUID vehicleId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        BatteryHealthResponse response = batteryHealthService.getBatteryHealth(vehicleId, principal);
        return ResponseEntity.ok(response);
    }
}
