package com.evshare.charging.controller;

import com.evshare.charging.dto.ChargingStationResponse;
import com.evshare.charging.service.ChargingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/charging-stations")
public class ChargingStationController {

    private final ChargingService chargingService;

    public ChargingStationController(ChargingService chargingService) {
        this.chargingService = chargingService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<ChargingStationResponse>> getChargingStations() {
        List<ChargingStationResponse> stations = chargingService.getChargingStations();
        return ResponseEntity.ok(stations);
    }

    @GetMapping("/{stationId}")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<ChargingStationResponse> getChargingStationById(@PathVariable UUID stationId) {
        ChargingStationResponse station = chargingService.getChargingStationById(stationId);
        return ResponseEntity.ok(station);
    }
}
