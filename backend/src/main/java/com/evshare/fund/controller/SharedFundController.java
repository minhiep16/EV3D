package com.evshare.fund.controller;

import com.evshare.fund.dto.*;
import com.evshare.fund.service.SharedFundService;
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
@RequestMapping("/api/funds")
public class SharedFundController {

    private final SharedFundService sharedFundService;

    public SharedFundController(SharedFundService sharedFundService) {
        this.sharedFundService = sharedFundService;
    }

    /**
     * Primary Contract: Get authoritative Shared Fund summary by vehicle ID path segment
     * Matches expected endpoint: GET /api/funds/vehicle/{vehicleId}
     */
    @GetMapping("/vehicle/{vehicleId}")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<SharedFundSummaryResponse> getFundSummaryByVehicle(
            @PathVariable("vehicleId") String vehicleId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (vehicleId == null || vehicleId.isBlank()) {
            throw new IllegalArgumentException("Mã phương tiện (vehicleId) không được để trống.");
        }
        SharedFundSummaryResponse response = sharedFundService.getFundSummaryByVehicle(vehicleId, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Secondary Contract: Get authoritative Shared Fund summary via query parameter
     * Matches fallback endpoint: GET /api/funds/summary?vehicleId={vehicleId}
     */
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<SharedFundSummaryResponse> getFundSummaryByParam(
            @RequestParam("vehicleId") String vehicleId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (vehicleId == null || vehicleId.isBlank()) {
            throw new IllegalArgumentException("Mã phương tiện (vehicleId) không được để trống.");
        }
        SharedFundSummaryResponse response = sharedFundService.getFundSummaryByVehicle(vehicleId, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Submit a member contribution request (creates PENDING record in DEMO mode)
     */
    @PostMapping("/{fundId}/contributions")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<FundContributionResponse> submitContribution(
            @PathVariable("fundId") UUID fundId,
            @Valid @RequestBody FundContributionRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        FundContributionResponse response = sharedFundService.submitContribution(fundId, request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Staff/Admin verifies receipt of contribution funds (supports both PUT /contributions/... and POST /{fundId}/contributions/...)
     */
    @RequestMapping(
            value = {"/contributions/{contributionId}/verify", "/{fundId}/contributions/{contributionId}/verify"},
            method = {RequestMethod.PUT, RequestMethod.POST}
    )
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<FundContributionResponse> verifyContribution(
            @PathVariable(value = "fundId", required = false) UUID fundId,
            @PathVariable("contributionId") UUID contributionId,
            @Valid @RequestBody FundContributionVerifyRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        FundContributionResponse response = sharedFundService.verifyContribution(contributionId, request, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Disburse an approved common group expense from the Shared Fund
     */
    @PostMapping("/{fundId}/disburse")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<FundTransactionResponse> disburseCommonExpense(
            @PathVariable("fundId") UUID fundId,
            @Valid @RequestBody CommonDisbursementRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        FundTransactionResponse response = sharedFundService.disburseCommonExpense(fundId, request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get contribution history for a fund
     */
    @GetMapping("/{fundId}/contributions")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<FundContributionResponse>> getContributions(
            @PathVariable("fundId") UUID fundId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<FundContributionResponse> response = sharedFundService.getContributions(fundId, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Get audited transaction history for a fund
     */
    @GetMapping("/{fundId}/transactions")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<FundTransactionResponse>> getTransactions(
            @PathVariable("fundId") UUID fundId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<FundTransactionResponse> response = sharedFundService.getTransactions(fundId, principal);
        return ResponseEntity.ok(response);
    }
}
