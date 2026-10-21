package com.evshare.voting.dto;

import com.evshare.voting.entity.ProposalVoteEligibility;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ProposalEligibilityDto(
        UUID id,
        UUID userId,
        String fullName,
        String email,
        UUID memberId,
        BigDecimal votingWeight,
        Instant createdAt
) {
    public static ProposalEligibilityDto fromEntity(ProposalVoteEligibility entity) {
        return new ProposalEligibilityDto(
                entity.getId(),
                entity.getUser().getId(),
                entity.getUser().getFullName(),
                entity.getUser().getEmail(),
                entity.getMember().getId(),
                entity.getVotingWeight(),
                entity.getCreatedAt()
        );
    }
}
