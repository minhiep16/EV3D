package com.evshare.voting.controller;

import com.evshare.security.UserPrincipal;
import com.evshare.voting.dto.ApprovedWorkResponse;
import com.evshare.voting.dto.CompleteProposalWorkRequest;
import com.evshare.voting.dto.StartProposalWorkRequest;
import com.evshare.voting.service.VoteProposalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/staff/approved-work")
public class StaffApprovedWorkController {

    private final VoteProposalService voteProposalService;

    public StaffApprovedWorkController(VoteProposalService voteProposalService) {
        this.voteProposalService = voteProposalService;
    }

    /**
     * Get authorized work proposals for STAFF.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<List<ApprovedWorkResponse>> getApprovedWork(
            @RequestParam(name = "vehicleId", required = false) UUID vehicleId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<ApprovedWorkResponse> list = voteProposalService.getStaffApprovedWork(vehicleId, principal);
        return ResponseEntity.ok(list);
    }

    /**
     * STAFF begins authorized work.
     */
    @PostMapping("/{proposalId}/start")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<ApprovedWorkResponse> startWork(
            @PathVariable UUID proposalId,
            @RequestBody(required = false) StartProposalWorkRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ApprovedWorkResponse response = voteProposalService.startProposalWork(
                proposalId,
                request != null ? request : new StartProposalWorkRequest(null),
                principal
        );
        return ResponseEntity.ok(response);
    }

    /**
     * STAFF completes authorized work and records verified actual expense.
     */
    @PostMapping("/{proposalId}/complete")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<ApprovedWorkResponse> completeWork(
            @PathVariable UUID proposalId,
            @Valid @RequestBody CompleteProposalWorkRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ApprovedWorkResponse response = voteProposalService.completeProposalWork(proposalId, request, principal);
        return ResponseEntity.ok(response);
    }
}
