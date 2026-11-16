package com.evshare.ownership.controller;

import com.evshare.ownership.dto.*;
import com.evshare.ownership.service.MembershipInvitationService;
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
@RequestMapping("/api")
public class MembershipInvitationController {

    private final MembershipInvitationService invitationService;

    public MembershipInvitationController(MembershipInvitationService invitationService) {
        this.invitationService = invitationService;
    }

    // ==========================================
    // 1. Leader Permission & Preview
    // ==========================================

    @GetMapping("/co-ownership-groups/{groupId}/invitation-permission")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<InvitationPermissionResponse> getInvitationPermission(
            @PathVariable UUID groupId,
            @RequestParam(required = false) UUID vehicleId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(invitationService.getInvitationPermission(groupId, vehicleId, principal));
    }

    @PostMapping("/co-ownership-groups/{groupId}/invitations/preview")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'ADMIN')")
    public ResponseEntity<InvitationPreviewResponse> previewInvitation(
            @PathVariable UUID groupId,
            @Valid @RequestBody InvitationPreviewRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(invitationService.previewInvitation(groupId, request, principal));
    }

    // ==========================================
    // 2. Invitation Lifecycle
    // ==========================================

    @PostMapping("/co-ownership-groups/{groupId}/invitations")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'ADMIN')")
    public ResponseEntity<MembershipInvitationResponse> createInvitation(
            @PathVariable UUID groupId,
            @Valid @RequestBody CreateInvitationRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        MembershipInvitationResponse resp = invitationService.createInvitation(groupId, request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @GetMapping("/co-ownership-groups/{groupId}/invitations")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<MembershipInvitationResponse>> getGroupInvitations(
            @PathVariable UUID groupId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(invitationService.getGroupInvitations(groupId, principal));
    }

    @GetMapping("/invitations/my-pending")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<MembershipInvitationResponse>> getMyInvitations(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(invitationService.getMyInvitations(principal));
    }

    @PostMapping("/invitations/recover-pending")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<MembershipInvitationResponse>> recoverPendingInvitations(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(invitationService.recoverPendingInvitations(principal));
    }

    @PostMapping("/invitations/{invitationId}/resend-notification")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<MembershipInvitationResponse> resendInvitationNotification(
            @PathVariable UUID invitationId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(invitationService.resendInvitationNotification(invitationId, principal));
    }

    @GetMapping("/invitations/{invitationId}")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<MembershipInvitationResponse> getInvitationById(
            @PathVariable UUID invitationId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(invitationService.getInvitationById(invitationId, principal));
    }

    // ==========================================
    // 3. Contributor Consent & Invitee Response
    // ==========================================

    @PostMapping("/invitations/{invitationId}/contributor-consent")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'ADMIN')")
    public ResponseEntity<MembershipInvitationResponse> recordContributorConsent(
            @PathVariable UUID invitationId,
            @Valid @RequestBody InvitationConsentActionRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(invitationService.recordContributorConsent(invitationId, request, principal));
    }

    @PostMapping("/invitations/{invitationId}/respond")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'ADMIN')")
    public ResponseEntity<MembershipInvitationResponse> respondToInvitation(
            @PathVariable UUID invitationId,
            @Valid @RequestBody InvitationRespondRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(invitationService.respondToInvitation(invitationId, request, principal));
    }

    // ==========================================
    // 4. Contract Signing & Finalization
    // ==========================================

    @PostMapping("/invitations/{invitationId}/sign")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'ADMIN')")
    public ResponseEntity<MembershipInvitationResponse> signInvitation(
            @PathVariable UUID invitationId,
            @RequestBody(required = false) InvitationSignRequest request,
            HttpServletRequest servletRequest,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(invitationService.signInvitation(invitationId, request, servletRequest, principal));
    }

    @PostMapping("/invitations/{invitationId}/finalize")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'ADMIN')")
    public ResponseEntity<MembershipInvitationResponse> finalizeInvitation(
            @PathVariable UUID invitationId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(invitationService.finalizeInvitation(invitationId, principal));
    }

    @PostMapping("/invitations/{invitationId}/cancel")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'ADMIN')")
    public ResponseEntity<MembershipInvitationResponse> cancelInvitation(
            @PathVariable UUID invitationId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(invitationService.cancelInvitation(invitationId, principal));
    }
}
