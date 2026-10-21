package com.evshare.voting.dto;

import com.evshare.voting.entity.ProposalExecutionStatus;
import com.evshare.voting.entity.VoteDecisionRule;
import com.evshare.voting.entity.VoteProposalStatus;
import com.evshare.voting.entity.VoteProposalType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record VoteResultResponse(
        UUID proposalId,
        String title,
        VoteProposalType proposalType,
        String proposalTypeVietnamese,
        VoteProposalStatus status,
        String statusVietnamese,
        boolean isApproved,
        VoteDecisionRule decisionRule,
        String decisionRuleVietnamese,
        BigDecimal requiredQuorumPercentage,
        BigDecimal requiredThresholdPercentage,
        BigDecimal actualQuorumPercentage,
        boolean quorumMet,
        BigDecimal actualApprovePercentage,
        boolean thresholdMet,
        BigDecimal approvedBudget,
        String currency,
        Instant finalizedAt,
        ProposalExecutionStatus executionStatus,
        String executionStatusVietnamese,
        UUID relatedMaintenanceRequestId,
        UUID relatedExpenseId,
        int totalEligibleVoters,
        int totalVotesSubmitted,
        int approveCount,
        int rejectCount,
        int abstainCount,
        BigDecimal approveWeight,
        BigDecimal rejectWeight,
        BigDecimal abstainWeight,
        List<ProposalVoteResponse> votes
) {}
