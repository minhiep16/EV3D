package com.evshare.contract.controller;

import com.evshare.contract.dto.*;
import com.evshare.contract.service.CoOwnershipContractService;
import com.evshare.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/contracts")
public class CoOwnershipContractController {

    private final CoOwnershipContractService contractService;

    public CoOwnershipContractController(CoOwnershipContractService contractService) {
        this.contractService = contractService;
    }

    /**
     * Get authoritative contract summary for a vehicle
     * GET /api/contracts/vehicle/{vehicleId}
     */
    @GetMapping("/vehicle/{vehicleId}")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<ContractSummaryResponse> getContractSummaryByVehicle(
            @PathVariable("vehicleId") String vehicleId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ContractSummaryResponse response = contractService.getContractSummaryByVehicle(vehicleId, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Get contract summary by contract ID
     * GET /api/contracts/{contractId}
     */
    @GetMapping("/{contractId}")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<ContractSummaryResponse> getContractById(
            @PathVariable("contractId") UUID contractId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ContractSummaryResponse response = contractService.getContractSummaryById(contractId, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * List all versions of a contract (History)
     * GET /api/contracts/{contractId}/versions
     */
    @GetMapping("/{contractId}/versions")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<ContractVersionResponse>> getContractVersions(
            @PathVariable("contractId") UUID contractId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<ContractVersionResponse> responses = contractService.getContractVersions(contractId, principal);
        return ResponseEntity.ok(responses);
    }

    /**
     * Get specific contract version detail
     * GET /api/contracts/{contractId}/versions/{versionId}
     */
    @GetMapping("/{contractId}/versions/{versionId}")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<ContractVersionResponse> getContractVersion(
            @PathVariable("contractId") UUID contractId,
            @PathVariable("versionId") UUID versionId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ContractVersionResponse response = contractService.getContractVersion(contractId, versionId, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Create a new draft contract version (Amendment proposal)
     * POST /api/contracts/{contractId}/versions
     */
    @PostMapping("/{contractId}/versions")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'ADMIN')")
    public ResponseEntity<ContractVersionResponse> createDraftVersion(
            @PathVariable("contractId") UUID contractId,
            @Valid @RequestBody CreateContractVersionRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ContractVersionResponse response = contractService.createDraftVersion(contractId, request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Submit draft version for member acceptance
     * POST /api/contracts/{contractId}/versions/{versionId}/submit
     */
    @PostMapping("/{contractId}/versions/{versionId}/submit")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'ADMIN')")
    public ResponseEntity<ContractVersionResponse> submitVersionForAcceptance(
            @PathVariable("contractId") UUID contractId,
            @PathVariable("versionId") UUID versionId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ContractVersionResponse response = contractService.submitVersionForAcceptance(contractId, versionId, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Electronic Acceptance of contract version (DEMO)
     * POST /api/contracts/versions/{versionId}/accept
     */
    @PostMapping("/versions/{versionId}/accept")
    @PreAuthorize("hasRole('CO_OWNER')")
    public ResponseEntity<ContractAcceptanceResponse> acceptContractVersion(
            @PathVariable("versionId") UUID versionId,
            @RequestBody(required = false) ContractAcceptanceRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest servletRequest
    ) {
        String ipAddress = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");
        ContractAcceptanceResponse response = contractService.acceptContractVersion(
                versionId,
                request,
                principal,
                ipAddress,
                userAgent
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Explicit activation of contract version
     * POST /api/contracts/{contractId}/versions/{versionId}/activate
     */
    @PostMapping("/{contractId}/versions/{versionId}/activate")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'ADMIN')")
    public ResponseEntity<ContractSummaryResponse> activateContractVersion(
            @PathVariable("contractId") UUID contractId,
            @PathVariable("versionId") UUID versionId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ContractSummaryResponse response = contractService.activateContractVersion(contractId, versionId, principal);
        return ResponseEntity.ok(response);
    }
}
