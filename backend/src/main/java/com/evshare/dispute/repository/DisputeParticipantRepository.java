package com.evshare.dispute.repository;

import com.evshare.dispute.entity.DisputeParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DisputeParticipantRepository extends JpaRepository<DisputeParticipant, UUID> {

    List<DisputeParticipant> findByDisputeId(UUID disputeId);

    Optional<DisputeParticipant> findByDisputeIdAndUserId(UUID disputeId, UUID userId);

    boolean existsByDisputeIdAndUserId(UUID disputeId, UUID userId);
}

