package com.evshare.dispute.repository;

import com.evshare.dispute.entity.DisputeMessage;
import com.evshare.dispute.entity.DisputeMessageVisibility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DisputeMessageRepository extends JpaRepository<DisputeMessage, UUID> {

    List<DisputeMessage> findByDisputeIdOrderByCreatedAtAsc(UUID disputeId);

    List<DisputeMessage> findByDisputeIdAndVisibilityOrderByCreatedAtAsc(UUID disputeId, DisputeMessageVisibility visibility);
}

