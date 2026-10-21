package com.evshare.voting.dto;

import com.evshare.voting.entity.VoteDecisionRule;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record UpdateVotingPolicyRequest(
        @NotNull(message = "Quy tắc biểu quyết là bắt buộc.")
        VoteDecisionRule votingRule,

        @NotNull(message = "Tỷ lệ túc số (Quorum) là bắt buộc.")
        @DecimalMin(value = "1.00", message = "Quorum tối thiểu là 1.00%.")
        @DecimalMax(value = "100.00", message = "Quorum tối đa là 100.00%.")
        BigDecimal quorumPercentage,

        @NotNull(message = "Ngưỡng thông qua (Threshold) là bắt buộc.")
        @DecimalMin(value = "1.00", message = "Ngưỡng thông qua tối thiểu là 1.00%.")
        @DecimalMax(value = "100.00", message = "Ngưỡng thông qua tối đa là 100.00%.")
        BigDecimal approvalThresholdPercentage
) {}
