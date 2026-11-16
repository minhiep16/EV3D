package com.evshare.dispute.repository;

import com.evshare.dispute.entity.DisputeActionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DisputeActionLogRepository extends JpaRepository<DisputeActionLog, UUID> {

    List<DisputeActionLog> findByDisputeIdOrderByCreatedAtDesc(UUID disputeId);

    List<DisputeActionLog> findByActorIdOrderByCreatedAtDesc(UUID actorId);
}
