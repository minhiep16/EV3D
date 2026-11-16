package com.evshare.energy.controller;

import com.evshare.energy.dto.VehicleEnergyInventoryResponse;
import com.evshare.energy.dto.VehicleEnergyTransactionResponse;
import com.evshare.energy.service.VehicleEnergyInventoryService;
import com.evshare.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/vehicles/{vehicleId}/energy-inventory")
public class EnergyInventoryController {

    private final VehicleEnergyInventoryService inventoryService;

    public EnergyInventoryController(VehicleEnergyInventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping({"", "/"})
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<VehicleEnergyInventoryResponse> getEnergyInventory(
            @PathVariable UUID vehicleId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        VehicleEnergyInventoryResponse response = inventoryService.getInventoryResponse(vehicleId, principal);
        return ResponseEntity.ok(response);
    }

    @GetMapping({"/transactions", "/transactions/"})
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<VehicleEnergyTransactionResponse>> getEnergyTransactions(
            @PathVariable UUID vehicleId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<VehicleEnergyTransactionResponse> transactions = inventoryService.getTransactionHistory(vehicleId, principal);
        return ResponseEntity.ok(transactions);
    }
}
