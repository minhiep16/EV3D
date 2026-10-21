package com.evshare.voting.controller;

import com.evshare.security.UserPrincipal;
import com.evshare.voting.dto.*;
import com.evshare.voting.entity.VoteProposalStatus;
import com.evshare.voting.service.VoteProposalService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class VoteProposalController {

    private final VoteProposalService voteProposalService;

    public VoteProposalController(VoteProposalService voteProposalService) {
        this.voteProposalService = voteProposalService;
    }

    /**
     * Create a new vote proposal (CO_OWNER or ADMIN).
     */
    @PostMapping("/vote-proposals")
    public ResponseEntity<VoteProposalResponse> createProposal(
            @Valid @RequestBody CreateVoteProposalRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        VoteProposalResponse response = voteProposalService.createProposal(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get vote proposals for a vehicle (with optional status filter).
     */
    @GetMapping("/vote-proposals")
    public ResponseEntity<List<VoteProposalResponse>> getProposals(
            @RequestParam(name = "vehicleId") UUID vehicleId,
            @RequestParam(name = "status", required = false) VoteProposalStatus status,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<VoteProposalResponse> responses = voteProposalService.getProposalsForVehicle(vehicleId, status, principal);
        return ResponseEntity.ok(responses);
    }

    /**
     * Get single vote proposal by ID with details.
     */
    @GetMapping("/vote-proposals/{proposalId}")
    public ResponseEntity<VoteProposalResponse> getProposalById(
            @PathVariable UUID proposalId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        VoteProposalResponse response = voteProposalService.getProposalById(proposalId, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Cast or update a vote on an OPEN proposal.
     */
    @PostMapping("/vote-proposals/{proposalId}/votes")
    public ResponseEntity<VoteProposalResponse> castVote(
            @PathVariable UUID proposalId,
            @Valid @RequestBody CastProposalVoteRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        VoteProposalResponse response = voteProposalService.castVote(proposalId, request, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Manually trigger proposal rule finalization evaluation.
     */
    @PostMapping("/vote-proposals/{proposalId}/finalize")
    public ResponseEntity<VoteProposalResponse> finalizeProposal(
            @PathVariable UUID proposalId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        VoteProposalResponse response = voteProposalService.finalizeProposal(proposalId, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Get audited voting results for a proposal.
     */
    @GetMapping("/vote-proposals/{proposalId}/results")
    public ResponseEntity<VoteResultResponse> getVoteResults(
            @PathVariable UUID proposalId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        VoteResultResponse response = voteProposalService.getVoteResults(proposalId, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Configure group voting policy.
     */
    @PutMapping("/co-ownership-groups/{groupId}/voting-policy")
    public ResponseEntity<Void> updateVotingPolicy(
            @PathVariable UUID groupId,
            @Valid @RequestBody UpdateVotingPolicyRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        voteProposalService.updateVotingPolicy(groupId, request, principal);
        return ResponseEntity.noContent().build();
    }
}
