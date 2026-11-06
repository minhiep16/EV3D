package com.evshare.onboarding.controller;

import com.evshare.onboarding.dto.*;
import com.evshare.onboarding.service.OnboardingService;
import com.evshare.security.UserPrincipal;
import com.evshare.vehicle.dto.VehicleResponse;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/onboarding")
@CrossOrigin(origins = "*")
public class OnboardingController {

    private static final Logger log = LoggerFactory.getLogger(OnboardingController.class);

    private final OnboardingService onboardingService;

    public OnboardingController(OnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    // 1. Status overview
    @GetMapping("/status")
    public ResponseEntity<OnboardingStatusResponse> getOnboardingStatus(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        log.info("[Onboarding] Fetching status for user: {}", principal != null ? principal.getUsername() : "anonymous");
        return ResponseEntity.ok(onboardingService.getOnboardingStatus(principal));
    }

    // 2. Drafts
    @GetMapping("/drafts")
    public ResponseEntity<List<VehicleRegistrationDraftResponse>> getMyDrafts(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(onboardingService.getMyDrafts(principal));
    }

    @GetMapping("/drafts/{draftId}")
    public ResponseEntity<VehicleRegistrationDraftResponse> getDraftById(
            @PathVariable UUID draftId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(onboardingService.getDraftById(draftId, principal));
    }

    @PostMapping("/drafts")
    public ResponseEntity<VehicleRegistrationDraftResponse> saveDraft(
            @Valid @RequestBody VehicleRegistrationDraftRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(onboardingService.saveDraft(request, principal));
    }

    @PutMapping("/drafts/{draftId}")
    public ResponseEntity<VehicleRegistrationDraftResponse> updateDraft(
            @PathVariable UUID draftId,
            @Valid @RequestBody VehicleRegistrationDraftRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(onboardingService.updateDraft(draftId, request, principal));
    }

    @DeleteMapping("/drafts/{draftId}")
    public ResponseEntity<Map<String, String>> deleteDraft(
            @PathVariable UUID draftId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        onboardingService.deleteDraft(draftId, principal);
        return ResponseEntity.ok(Map.of("message", "Đã xóa bản nháp thành công."));
    }

    @GetMapping("/search-users")
    public ResponseEntity<List<OnboardingUserSearchResponse>> searchUsers(
            @RequestParam(required = false) String query,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(onboardingService.searchEligibleUsers(query, principal));
    }

    @GetMapping("/validate-plate")
    public ResponseEntity<Map<String, Object>> validateLicensePlate(
            @RequestParam String licensePlate,
            @RequestParam(required = false) UUID draftId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(onboardingService.validateLicensePlateAvailability(licensePlate, draftId, principal));
    }

    @PostMapping("/drafts/{draftId}/submit")
    public ResponseEntity<VehicleRegistrationDraftResponse> submitRegistration(
            @PathVariable UUID draftId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(onboardingService.submitRegistration(draftId, principal));
    }

    // 2B. Staff Registration Review Workflow
    @GetMapping("/staff/applications")
    public ResponseEntity<List<VehicleRegistrationDraftResponse>> getStaffApplications(
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(onboardingService.getStaffApplications(status, principal));
    }

    @GetMapping("/staff/applications/{applicationId}")
    public ResponseEntity<VehicleRegistrationDraftResponse> getStaffApplicationById(
            @PathVariable UUID applicationId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(onboardingService.getStaffApplicationById(applicationId, principal));
    }

    @PostMapping("/staff/applications/{applicationId}/review")
    public ResponseEntity<VehicleRegistrationDraftResponse> reviewVehicleRegistration(
            @PathVariable UUID applicationId,
            @RequestBody ReviewVehicleRegistrationRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(onboardingService.reviewVehicleRegistration(applicationId, request, principal));
    }

    // 3. Group Discovery
    @GetMapping("/discoverable-groups")
    public ResponseEntity<List<DiscoverableGroupResponse>> getDiscoverableGroups(
            @RequestParam(required = false) String search,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(onboardingService.getDiscoverableGroups(search, principal));
    }

    @GetMapping("/discoverable-groups/{groupId}")
    public ResponseEntity<DiscoverableGroupResponse> getDiscoverableGroupDetail(
            @PathVariable UUID groupId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(onboardingService.getDiscoverableGroupDetail(groupId, principal));
    }

    // 4. Join Requests
    @PostMapping("/discoverable-groups/{groupId}/join-requests")
    public ResponseEntity<GroupJoinRequestResponse> submitJoinRequest(
            @PathVariable UUID groupId,
            @Valid @RequestBody CreateJoinRequestDto request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(onboardingService.submitJoinRequest(groupId, request, principal));
    }

    @GetMapping("/my-join-requests")
    public ResponseEntity<List<GroupJoinRequestResponse>> getMyJoinRequests(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(onboardingService.getMyJoinRequests(principal));
    }

    @GetMapping("/groups/{groupId}/join-requests")
    public ResponseEntity<List<GroupJoinRequestResponse>> getGroupJoinRequests(
            @PathVariable UUID groupId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(onboardingService.getGroupJoinRequests(groupId, principal));
    }

    @PostMapping("/join-requests/{requestId}/review")
    public ResponseEntity<GroupJoinRequestResponse> reviewJoinRequest(
            @PathVariable UUID requestId,
            @Valid @RequestBody ReviewJoinRequestDto request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(onboardingService.reviewJoinRequest(requestId, request, principal));
    }

    // 5. Invitations
    @PostMapping("/groups/{groupId}/invitations")
    public ResponseEntity<GroupInvitationResponse> createInvitation(
            @PathVariable UUID groupId,
            @Valid @RequestBody CreateInvitationRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(onboardingService.createInvitation(groupId, request, principal));
    }

    @GetMapping("/my-invitations")
    public ResponseEntity<List<GroupInvitationResponse>> getMyInvitations(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(onboardingService.getMyInvitations(principal));
    }

    @GetMapping("/invitations/{invitationId}/contract")
    public ResponseEntity<InvitationContractReviewResponse> getInvitationContractReview(
            @PathVariable UUID invitationId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(onboardingService.getInvitationContractReview(invitationId, principal));
    }

    @PostMapping("/invitations/{invitationId}/consent")
    public ResponseEntity<GroupInvitationResponse> recordInvitationConsent(
            @PathVariable UUID invitationId,
            @Valid @RequestBody InvitationConsentRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            jakarta.servlet.http.HttpServletRequest servletRequest
    ) {
        String ipAddress = servletRequest != null ? servletRequest.getRemoteAddr() : "127.0.0.1";
        return ResponseEntity.ok(onboardingService.recordInvitationConsent(invitationId, request, principal, ipAddress));
    }

    @PostMapping("/invitations/{invitationId}/sign-and-accept")
    public ResponseEntity<GroupInvitationResponse> signAndAcceptInvitation(
            @PathVariable UUID invitationId,
            @Valid @RequestBody InvitationConsentRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            jakarta.servlet.http.HttpServletRequest servletRequest
    ) {
        String ipAddress = servletRequest != null ? servletRequest.getRemoteAddr() : "127.0.0.1";
        return ResponseEntity.ok(onboardingService.signAndAcceptInvitation(invitationId, request, principal, ipAddress));
    }

    @PostMapping("/invitations/{invitationId}/respond")
    public ResponseEntity<GroupInvitationResponse> respondToInvitation(
            @PathVariable UUID invitationId,
            @RequestParam boolean accept,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(onboardingService.respondToInvitation(invitationId, accept, principal));
    }

    @PostMapping("/invitations/redeem-code")
    public ResponseEntity<GroupInvitationResponse> redeemInviteCode(
            @Valid @RequestBody RedeemInviteCodeRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(onboardingService.redeemInviteCode(request.inviteCode(), principal));
    }
}
