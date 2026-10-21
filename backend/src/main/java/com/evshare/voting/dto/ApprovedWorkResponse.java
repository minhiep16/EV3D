package com.evshare.voting.dto;

import com.evshare.voting.entity.ProposalExecutionStatus;
import com.evshare.voting.entity.VoteProposalStatus;
import com.evshare.voting.entity.VoteProposalType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ApprovedWorkResponse(
        UUID proposalId,
        UUID authorizationId,
        UUID vehicleId,
        String vehicleName,
        String vehicleLicensePlate,
        UUID groupId,
        String groupName,
        VoteProposalType proposalType,
        String proposalTypeVietnamese,
        String title,
        String description,
        BigDecimal approvedBudget,
        BigDecimal estimatedAmount,
        String currency,
        VoteProposalStatus votingStatus,
        String votingStatusVietnamese,
        ProposalExecutionStatus workStatus,
        String workStatusVietnamese,
        Instant approvedAt,
        Instant executionStartedAt,
        Instant executionCompletedAt,
        String executedByStaffName,
        BigDecimal actualCost,
        boolean canStartExecution,
        String executionBlockReason,
        UUID relatedMaintenanceRequestId,
        UUID relatedExpenseId
) {}
