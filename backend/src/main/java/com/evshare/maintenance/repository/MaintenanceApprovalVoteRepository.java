package com.evshare.maintenance.repository;

import com.evshare.maintenance.entity.MaintenanceApprovalVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MaintenanceApprovalVoteRepository extends JpaRepository<MaintenanceApprovalVote, UUID> {

    List<MaintenanceApprovalVote> findByMaintenanceRequestId(UUID maintenanceRequestId);

    Optional<MaintenanceApprovalVote> findByMaintenanceRequestIdAndMemberId(UUID maintenanceRequestId, UUID memberId);

    Optional<MaintenanceApprovalVote> findByMaintenanceRequestIdAndUserId(UUID maintenanceRequestId, UUID userId);

    boolean existsByMaintenanceRequestIdAndMemberId(UUID maintenanceRequestId, UUID memberId);

    void deleteByMaintenanceRequestId(UUID maintenanceRequestId);
}
