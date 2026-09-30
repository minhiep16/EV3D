package com.evshare.charging.controller;

import com.evshare.charging.dto.ChargingSessionResponse;
import com.evshare.charging.dto.CreateChargingSessionRequest;
import com.evshare.charging.dto.ProgressChargingSessionRequest;
import com.evshare.charging.service.ChargingService;
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
public class ChargingSessionController {

    private final ChargingService chargingService;

    public ChargingSessionController(ChargingService chargingService) {
        this.chargingService = chargingService;
    }

    @GetMapping("/api/vehicles/{vehicleId}/charging-session/active")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<ChargingSessionResponse> getActiveSession(
            @PathVariable UUID vehicleId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ChargingSessionResponse activeSession = chargingService.getActiveSessionForVehicle(vehicleId, principal);
        if (activeSession == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(activeSession);
    }

    @GetMapping("/api/vehicles/{vehicleId}/charging-sessions")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<ChargingSessionResponse>> getSessionHistory(
            @PathVariable UUID vehicleId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<ChargingSessionResponse> sessions = chargingService.getSessionHistoryForVehicle(vehicleId, principal);
        return ResponseEntity.ok(sessions);
    }

    @PostMapping("/api/vehicles/{vehicleId}/charging-sessions")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<ChargingSessionResponse> createChargingSession(
            @PathVariable UUID vehicleId,
            @Valid @RequestBody CreateChargingSessionRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ChargingSessionResponse session = chargingService.createChargingSession(vehicleId, request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(session);
    }

    @PostMapping("/api/charging-sessions/{sessionId}/start")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<ChargingSessionResponse> startChargingSession(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ChargingSessionResponse session = chargingService.startChargingSession(sessionId, principal);
        return ResponseEntity.ok(session);
    }

    @PostMapping("/api/charging-sessions/{sessionId}/complete")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<ChargingSessionResponse> completeChargingSession(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ChargingSessionResponse session = chargingService.completeChargingSession(sessionId, principal);
        return ResponseEntity.ok(session);
    }

    @PostMapping("/api/charging-sessions/{sessionId}/cancel")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<ChargingSessionResponse> cancelChargingSession(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ChargingSessionResponse session = chargingService.cancelChargingSession(sessionId, principal);
        return ResponseEntity.ok(session);
    }

    @PatchMapping("/api/charging-sessions/{sessionId}/progress")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<ChargingSessionResponse> progressChargingSession(
            @PathVariable UUID sessionId,
            @Valid @RequestBody ProgressChargingSessionRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ChargingSessionResponse session = chargingService.progressChargingSession(sessionId, request, principal);
        return ResponseEntity.ok(session);
    }
}
