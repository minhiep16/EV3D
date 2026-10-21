package com.evshare.voting.repository;

import com.evshare.voting.entity.ProposalVote;
import com.evshare.voting.entity.ProposalVoteChoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProposalVoteRepository extends JpaRepository<ProposalVote, UUID> {

    List<ProposalVote> findByProposalId(UUID proposalId);

    Optional<ProposalVote> findByProposalIdAndVoterUserId(UUID proposalId, UUID voterUserId);

    boolean existsByProposalIdAndVoterUserId(UUID proposalId, UUID voterUserId);

    long countByProposalId(UUID proposalId);

    long countByProposalIdAndChoice(UUID proposalId, ProposalVoteChoice choice);
}
