package com.evshare.dispute.controller;

import com.evshare.dispute.dto.*;
import com.evshare.dispute.entity.DisputeCategory;
import com.evshare.dispute.entity.DisputeStatus;
import com.evshare.dispute.incident.BookingConflictIncidentDto;
import com.evshare.dispute.incident.BookingIncidentDetectionService;
import com.evshare.dispute.incident.PrefilledDisputeDto;
import com.evshare.dispute.service.DisputeService;
import com.evshare.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/disputes")
public class DisputeController {

    private final DisputeService disputeService;
    private final BookingIncidentDetectionService incidentDetectionService;

    public DisputeController(DisputeService disputeService, BookingIncidentDetectionService incidentDetectionService) {
        this.disputeService = disputeService;
        this.incidentDetectionService = incidentDetectionService;
    }

    /**
     * Submit a new Dispute by an authorized Co-Owner or Staff.
     */
    @PostMapping
    public ResponseEntity<DisputeResponse> createDispute(
            @Valid @RequestBody CreateDisputeRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        DisputeResponse response = disputeService.createDispute(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get Dispute by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<DisputeResponse> getDisputeById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        DisputeResponse response = disputeService.getDisputeById(id, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * List disputes for a specific vehicle.
     */
    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<List<DisputeResponse>> getDisputesForVehicle(
            @PathVariable UUID vehicleId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<DisputeResponse> responses = disputeService.getDisputesForVehicle(vehicleId, principal);
        return ResponseEntity.ok(responses);
    }

    /**
     * List disputes involving the current user.
     */
    @GetMapping("/my-disputes")
    public ResponseEntity<List<DisputeResponse>> getMyDisputes(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<DisputeResponse> responses = disputeService.getMyDisputes(principal);
        return ResponseEntity.ok(responses);
    }

    /**
     * Staff Dashboard list with optional filters.
     */
    @GetMapping("/staff/dashboard")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<List<DisputeResponse>> getStaffDisputeDashboard(
            @RequestParam(required = false) UUID vehicleId,
            @RequestParam(required = false) DisputeCategory category,
            @RequestParam(required = false) DisputeStatus status,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<DisputeResponse> responses = disputeService.getStaffDisputeDashboard(vehicleId, category, status, principal);
        return ResponseEntity.ok(responses);
    }

    /**
     * Staff Dashboard summary counts.
     */
    @GetMapping("/staff/summary")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<DisputeSummaryResponse> getDisputeSummary(
            @RequestParam(required = false) UUID vehicleId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        DisputeSummaryResponse response = disputeService.getDisputeSummary(vehicleId, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Staff claims or assigns mediator to a dispute.
     */
    @PatchMapping("/{id}/assign-staff")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<DisputeResponse> assignStaffMediator(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID staffId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        DisputeResponse response = disputeService.assignStaffMediator(id, staffId, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Staff requests additional evidence or clarification from participants.
     */
    @PatchMapping("/{id}/request-evidence")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<DisputeResponse> requestEvidence(
            @PathVariable UUID id,
            @RequestBody(required = false) RequestEvidenceRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        String note = request != null ? request.note() : null;
        DisputeResponse response = disputeService.requestEvidence(id, note, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Upload / attach supporting evidence.
     */
    @PostMapping("/{id}/evidence")
    public ResponseEntity<DisputeEvidenceDto> addEvidence(
            @PathVariable UUID id,
            @Valid @RequestBody AddEvidenceRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        DisputeEvidenceDto response = disputeService.addEvidence(
                id,
                request.title(),
                request.fileUrl(),
                request.fileType(),
                request.fileSizeBytes(),
                request.integrityHash(),
                principal
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Post a comment / message to the discussion thread.
     */
    @PostMapping("/{id}/messages")
    public ResponseEntity<DisputeMessageDto> addMessage(
            @PathVariable UUID id,
            @Valid @RequestBody CreateDisputeMessageRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        DisputeMessageDto response = disputeService.addMessage(id, request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Staff proposes a formal mediation resolution.
     */
    @RequestMapping(
            value = {"/{id}/propose-resolution", "/{id}/propose-resolution/"},
            method = {RequestMethod.POST, RequestMethod.PUT, RequestMethod.PATCH}
    )
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<DisputeResponse> proposeResolution(
            @PathVariable UUID id,
            @Valid @RequestBody ProposeResolutionRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        DisputeResponse response = disputeService.proposeResolution(id, request, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Participant responds to the proposed mediation resolution (ACCEPT or REJECT).
     */
    @PostMapping("/{id}/respond-resolution")
    public ResponseEntity<DisputeResponse> respondToResolution(
            @PathVariable UUID id,
            @Valid @RequestBody RespondToResolutionRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        DisputeResponse response = disputeService.respondToResolution(id, request, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Link an existing group vote proposal to this dispute.
     */
    @PostMapping("/{id}/link-voting")
    public ResponseEntity<DisputeResponse> linkVotingProposal(
            @PathVariable UUID id,
            @Valid @RequestBody LinkVotingRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        DisputeResponse response = disputeService.linkVotingProposal(id, request.proposalId(), principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Record execution of agreed corrective action (Staff only).
     */
    @PostMapping("/{id}/execute-corrective-action")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<DisputeResponse> executeCorrectiveAction(
            @PathVariable UUID id,
            @Valid @RequestBody ExecuteCorrectiveActionRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        DisputeResponse response = disputeService.executeCorrectiveAction(id, request, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Close the dispute with final resolution summary.
     */
    @PostMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<DisputeResponse> closeDispute(
            @PathVariable UUID id,
            @RequestBody(required = false) CloseDisputeRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        String summary = request != null ? request.resolutionSummary() : null;
        DisputeResponse response = disputeService.closeDispute(id, summary, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Reopen a closed or rejected dispute.
     */
    @PostMapping("/{id}/reopen")
    public ResponseEntity<DisputeResponse> reopenDispute(
            @PathVariable UUID id,
            @RequestBody(required = false) ReopenDisputeRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        String reason = request != null ? request.reason() : null;
        DisputeResponse response = disputeService.reopenDispute(id, reason, principal);
        return ResponseEntity.ok(response);
    }

    // ==========================================
    // PHASE 5.8 DISPUTE MEDIATION & COMPENSATION EXECUTION
    // ==========================================

    /**
     * Get late return & incident investigation timeline comparison data.
     */
    @GetMapping(value = {"/{id}/investigation", "/{id}/investigation/", "/{id}/investigation-comparison", "/{id}/investigation-comparison/"})
    public ResponseEntity<InvestigationDetailsDto> getInvestigationComparison(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        InvestigationDetailsDto comparison = disputeService.getInvestigationComparison(id, principal);
        return ResponseEntity.ok(comparison);
    }

    /**
     * Record formal investigation findings and incident conclusion (Staff only).
     */
    @RequestMapping(
            value = {"/{id}/investigation", "/{id}/investigation/"},
            method = {RequestMethod.POST, RequestMethod.PUT, RequestMethod.PATCH}
    )
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<DisputeResponse> recordInvestigationFindings(
            @PathVariable UUID id,
            @Valid @RequestBody RecordInvestigationRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        DisputeResponse response = disputeService.recordInvestigationFindings(id, request, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Record verified compensation payment (full or partial) with receipt/reference (Staff only).
     */
    @PostMapping("/{id}/compensation-payment")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<DisputeCompensationDto> recordCompensationPayment(
            @PathVariable UUID id,
            @Valid @RequestBody RecordCompensationPaymentRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        DisputeCompensationDto response = disputeService.recordCompensationPayment(id, request, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Submit compensation payment evidence (Payer / Co-Owner).
     */
    @PostMapping("/{id}/compensation-evidence")
    public ResponseEntity<DisputeCompensationDto> submitCompensationEvidence(
            @PathVariable UUID id,
            @Valid @RequestBody SubmitCompensationEvidenceRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        DisputeCompensationDto response = disputeService.submitCompensationEvidence(id, request, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Phase 5.9 Demo: Initiate demo compensation payment (Payer).
     */
    @PostMapping(value = {"/{id}/demo-payment", "/{id}/compensation-demo"})
    public ResponseEntity<DisputeCompensationDto> initiateDemoPayment(
            @PathVariable UUID id,
            @RequestBody(required = false) InitiateDemoPaymentRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        DisputeCompensationDto response = disputeService.initiateDemoPayment(id, request, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Phase 5.9 Demo: Confirm receipt of demo compensation payment (Recipient).
     */
    @PostMapping("/{id}/demo-payment/confirm")
    public ResponseEntity<DisputeCompensationDto> confirmRecipientDemoPayment(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        DisputeCompensationDto response = disputeService.confirmRecipientDemoPayment(id, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Phase 5.9 Demo: Dispute / flag receipt of demo compensation payment (Recipient).
     */
    @PostMapping("/{id}/demo-payment/dispute")
    public ResponseEntity<DisputeCompensationDto> disputeRecipientDemoPayment(
            @PathVariable UUID id,
            @RequestBody(required = false) RecipientAcknowledgeDemoPaymentRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        DisputeCompensationDto response = disputeService.disputeRecipientDemoPayment(id, request, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Approve submitted compensation evidence (Staff only).
     */
    @PostMapping("/{id}/compensation-evidence/approve")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<DisputeCompensationDto> approveCompensationEvidence(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        DisputeCompensationDto response = disputeService.approveCompensationEvidence(id, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Reject submitted compensation evidence with reason (Staff only).
     */
    @PostMapping("/{id}/compensation-evidence/reject")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<DisputeCompensationDto> rejectCompensationEvidence(
            @PathVariable UUID id,
            @Valid @RequestBody RejectCompensationEvidenceRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        DisputeCompensationDto response = disputeService.rejectCompensationEvidence(id, request, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Get auditable compensation obligations linked to the dispute.
     */
    @GetMapping("/{id}/compensation")
    public ResponseEntity<List<DisputeCompensationDto>> getDisputeCompensations(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<DisputeCompensationDto> list = disputeService.getDisputeCompensations(id, principal);
        return ResponseEntity.ok(list);
    }

    /**
     * Get audit action logs for dispute.
     */
    @GetMapping("/{id}/action-logs")
    public ResponseEntity<List<DisputeActionLogDto>> getDisputeActionLogs(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<DisputeActionLogDto> list = disputeService.getDisputeActionLogs(id, principal);
        return ResponseEntity.ok(list);
    }

    // ==========================================
    // PHASE 5.6 EVENT-DRIVEN INCIDENT ENDPOINTS
    // ==========================================

    /**
     * Check if a specific booking has an auto-detected delay incident.
     * Accessible by the booking owner or Staff/Admin.
     */
    @GetMapping("/incidents/booking/{bookingId}")
    public ResponseEntity<BookingConflictIncidentDto> getIncidentForBooking(
            @PathVariable UUID bookingId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Optional<BookingConflictIncidentDto> incident = incidentDetectionService.getIncidentForBooking(bookingId, principal);
        return incident.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    /**
     * Retrieve prefilled dispute data for an impacted booking when user clicks "YÊU CẦU GIẢI QUYẾT".
     */
    @GetMapping("/prefill/booking/{bookingId}")
    public ResponseEntity<PrefilledDisputeDto> getPrefilledDispute(
            @PathVariable UUID bookingId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        PrefilledDisputeDto prefill = incidentDetectionService.getPrefilledDisputeForBooking(bookingId, principal);
        return ResponseEntity.ok(prefill);
    }

    /**
     * List all auto-detected booking return conflict incidents for a vehicle.
     */
    @GetMapping("/incidents/vehicle/{vehicleId}")
    public ResponseEntity<List<BookingConflictIncidentDto>> getIncidentsForVehicle(
            @PathVariable UUID vehicleId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<BookingConflictIncidentDto> list = incidentDetectionService.evaluateIncidentsForVehicle(vehicleId, Instant.now(), false);
        return ResponseEntity.ok(list);
    }

    /**
     * List all active detected incidents for Staff mediation review in StaffDisputeDashboardModal.
     */
    @GetMapping("/incidents/staff/active")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<List<BookingConflictIncidentDto>> getActiveIncidentsForStaff(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<BookingConflictIncidentDto> activeIncidents = incidentDetectionService.getActiveIncidentsForStaff(principal);
        return ResponseEntity.ok(activeIncidents);
    }
}

