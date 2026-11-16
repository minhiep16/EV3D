package com.evshare.dispute.repository;

import com.evshare.dispute.entity.CompensationStatus;
import com.evshare.dispute.entity.DisputeCompensation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DisputeCompensationRepository extends JpaRepository<DisputeCompensation, UUID> {

    List<DisputeCompensation> findByDisputeIdOrderByCreatedAtDesc(UUID disputeId);

    Optional<DisputeCompensation> findFirstByDisputeIdOrderByCreatedAtDesc(UUID disputeId);

    List<DisputeCompensation> findByRecipientUserIdOrderByCreatedAtDesc(UUID recipientUserId);

    List<DisputeCompensation> findByPayerUserIdOrderByCreatedAtDesc(UUID payerUserId);

    List<DisputeCompensation> findByStatus(CompensationStatus status);

    @Query("SELECT c FROM DisputeCompensation c WHERE c.dispute.id = :disputeId AND c.status = :status")
    List<DisputeCompensation> findByDisputeIdAndStatus(@Param("disputeId") UUID disputeId, @Param("status") CompensationStatus status);
}
