package com.evshare.ownership.controller;

import com.evshare.ownership.dto.*;
import com.evshare.ownership.service.MembershipWithdrawalService;
import com.evshare.ownership.service.OwnershipTransferService;
import com.evshare.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class OwnershipTransferController {

    private final OwnershipTransferService transferService;
    private final MembershipWithdrawalService withdrawalService;

    public OwnershipTransferController(
            OwnershipTransferService transferService,
            MembershipWithdrawalService withdrawalService
    ) {
        this.transferService = transferService;
        this.withdrawalService = withdrawalService;
    }

    // ==========================================
    // 1. Ownership Transfer Endpoints
    // ==========================================

    @PostMapping({"/groups/{groupId}/transfers", "/co-ownership-groups/{groupId}/transfers"})
    @PreAuthorize("hasAnyRole('CO_OWNER', 'ADMIN')")
    public ResponseEntity<OwnershipTransferResponse> createTransferRequest(
            @PathVariable UUID groupId,
            @Valid @RequestBody CreateTransferRequest request,
            HttpServletRequest servletRequest,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        OwnershipTransferResponse response = transferService.createTransferRequest(groupId, request, servletRequest, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping({"/groups/{groupId}/transfers", "/co-ownership-groups/{groupId}/transfers"})
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<OwnershipTransferResponse>> getGroupTransfers(
            @PathVariable UUID groupId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(transferService.getTransferRequestsByGroup(groupId, principal));
    }

    @GetMapping({"/groups/{groupId}/transfers/incoming", "/ownership-transfers/incoming"})
    @PreAuthorize("hasAnyRole('CO_OWNER', 'ADMIN')")
    public ResponseEntity<List<OwnershipTransferResponse>> getIncomingTransfers(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(transferService.getIncomingTransferRequests(principal));
    }

    @GetMapping({"/groups/{groupId}/transfers/preview", "/co-ownership-groups/{groupId}/transfers/preview"})
    @PreAuthorize("hasAnyRole('CO_OWNER', 'ADMIN')")
    public ResponseEntity<OwnershipDistributionPreviewResponse> previewTransferDistribution(
            @PathVariable UUID groupId,
            @RequestParam UUID vehicleId,
            @RequestParam UUID fromUserId,
            @RequestParam UUID toUserId,
            @RequestParam BigDecimal transferPercentage
    ) {
        return ResponseEntity.ok(transferService.previewTransferDistribution(groupId, vehicleId, fromUserId, toUserId, transferPercentage));
    }

    @GetMapping("/ownership-transfers/{transferId}")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<OwnershipTransferResponse> getTransferById(
            @PathVariable UUID transferId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(transferService.getTransferRequestById(transferId, principal));
    }

    @PostMapping("/ownership-transfers/{transferId}/accept")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'ADMIN')")
    public ResponseEntity<OwnershipTransferResponse> acceptTransfer(
            @PathVariable UUID transferId,
            @RequestBody(required = false) AcceptTransferConsentRequest request,
            HttpServletRequest servletRequest,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(transferService.acceptTransferRequest(transferId, request, servletRequest, principal));
    }

    @PostMapping("/ownership-transfers/{transferId}/transferor-consent")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'ADMIN')")
    public ResponseEntity<OwnershipTransferResponse> confirmTransferorConsent(
            @PathVariable UUID transferId,
            @RequestBody(required = false) AcceptTransferConsentRequest request,
            HttpServletRequest servletRequest,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(transferService.confirmTransferorConsent(transferId, request, servletRequest, principal));
    }

    @PostMapping("/ownership-transfers/{transferId}/reject")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'ADMIN')")
    public ResponseEntity<OwnershipTransferResponse> rejectTransfer(
            @PathVariable UUID transferId,
            @Valid @RequestBody RejectTransferRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(transferService.rejectTransferRequest(transferId, request, principal));
    }

    @PostMapping("/ownership-transfers/{transferId}/cancel")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'ADMIN')")
    public ResponseEntity<OwnershipTransferResponse> cancelTransfer(
            @PathVariable UUID transferId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(transferService.cancelTransferRequest(transferId, principal));
    }

    @PostMapping("/ownership-transfers/{transferId}/complete")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'ADMIN')")
    public ResponseEntity<OwnershipTransferResponse> completeTransfer(
            @PathVariable UUID transferId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(transferService.completeTransfer(transferId, principal));
    }

    // ==========================================
    // 2. Ownership History Endpoints
    // ==========================================

    @GetMapping({"/groups/{groupId}/ownership-history", "/co-ownership-groups/{groupId}/ownership-history"})
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<OwnershipHistoryResponse>> getOwnershipHistory(
            @PathVariable UUID groupId
    ) {
        return ResponseEntity.ok(transferService.getOwnershipHistory(groupId));
    }

    // ==========================================
    // 3. Member Withdrawal Endpoints
    // ==========================================

    @PostMapping({"/groups/{groupId}/withdrawal-requests", "/co-ownership-groups/{groupId}/withdrawal-requests"})
    @PreAuthorize("hasRole('CO_OWNER')")
    public ResponseEntity<MembershipWithdrawalResponse> createWithdrawalRequest(
            @PathVariable UUID groupId,
            @Valid @RequestBody CreateWithdrawalRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        MembershipWithdrawalResponse response = withdrawalService.createWithdrawalRequest(groupId, request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping({"/groups/{groupId}/withdrawal-requests", "/co-ownership-groups/{groupId}/withdrawal-requests"})
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<MembershipWithdrawalResponse>> getWithdrawalRequests(
            @PathVariable UUID groupId
    ) {
        return ResponseEntity.ok(withdrawalService.getWithdrawalRequestsByGroup(groupId));
    }

    @PostMapping("/withdrawal-requests/{requestId}/review")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'ADMIN')")
    public ResponseEntity<MembershipWithdrawalResponse> reviewWithdrawalRequest(
            @PathVariable UUID requestId,
            @Valid @RequestBody ReviewWithdrawalRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(withdrawalService.reviewWithdrawalRequest(requestId, request, principal));
    }
}
