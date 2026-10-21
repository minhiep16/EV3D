package com.evshare.voting.dto;

import com.evshare.voting.entity.ProposalVote;
import com.evshare.voting.entity.ProposalVoteChoice;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ProposalVoteResponse(
        UUID id,
        UUID proposalId,
        UUID voterUserId,
        String voterName,
        String voterEmail,
        UUID memberId,
        ProposalVoteChoice choice,
        String choiceVietnamese,
        BigDecimal votingWeightSnapshot,
        String comment,
        Instant castAt,
        Instant updatedAt
) {
    public static ProposalVoteResponse fromEntity(ProposalVote vote) {
        return new ProposalVoteResponse(
                vote.getId(),
                vote.getProposal().getId(),
                vote.getVoterUser().getId(),
                vote.getVoterUser().getFullName(),
                vote.getVoterUser().getEmail(),
                vote.getMember().getId(),
                vote.getChoice(),
                vote.getChoice().getVietnameseLabel(),
                vote.getVotingWeightSnapshot(),
                vote.getComment(),
                vote.getCastAt(),
                vote.getUpdatedAt()
        );
    }
}
