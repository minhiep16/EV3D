package com.evshare.voting.repository;

import com.evshare.voting.entity.ProposalVoteEligibility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProposalVoteEligibilityRepository extends JpaRepository<ProposalVoteEligibility, UUID> {

    List<ProposalVoteEligibility> findByProposalId(UUID proposalId);

    Optional<ProposalVoteEligibility> findByProposalIdAndUserId(UUID proposalId, UUID userId);

    boolean existsByProposalIdAndUserId(UUID proposalId, UUID userId);
}
