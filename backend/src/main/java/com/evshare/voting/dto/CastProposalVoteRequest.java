package com.evshare.voting.dto;

import com.evshare.voting.entity.ProposalVoteChoice;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CastProposalVoteRequest(
        @NotNull(message = "Lựa chọn biểu quyết là bắt buộc (APPROVE, REJECT, ABSTAIN).")
        ProposalVoteChoice choice,

        @Size(max = 1000, message = "Ý kiến đóng góp tối đa 1000 ký tự.")
        String comment
) {}
