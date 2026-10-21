package com.evshare.voting.repository;

import com.evshare.voting.entity.ProposalExecutionStatus;
import com.evshare.voting.entity.VoteProposal;
import com.evshare.voting.entity.VoteProposalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VoteProposalRepository extends JpaRepository<VoteProposal, UUID> {

    List<VoteProposal> findByVehicleIdOrderByCreatedAtDesc(UUID vehicleId);

    List<VoteProposal> findByGroupIdOrderByCreatedAtDesc(UUID groupId);

    List<VoteProposal> findByVehicleIdAndStatusOrderByCreatedAtDesc(UUID vehicleId, VoteProposalStatus status);

    List<VoteProposal> findByStatusOrderByCreatedAtDesc(VoteProposalStatus status);

    List<VoteProposal> findByExecutionStatusOrderByCreatedAtDesc(ProposalExecutionStatus executionStatus);

    @Query("SELECT p FROM VoteProposal p WHERE p.status = :status OR p.executionStatus = :execStatus ORDER BY p.createdAt DESC")
    List<VoteProposal> findApprovedOrInExecution(@Param("status") VoteProposalStatus status, @Param("execStatus") ProposalExecutionStatus execStatus);

    @Query("SELECT p FROM VoteProposal p LEFT JOIN FETCH p.eligibilities LEFT JOIN FETCH p.votes WHERE p.id = :id")
    Optional<VoteProposal> findByIdWithDetails(@Param("id") UUID id);

    @Query("SELECT p FROM VoteProposal p WHERE p.vehicle.id = :vehicleId AND (p.status = 'APPROVED' OR p.executionStatus = 'IN_PROGRESS' OR p.executionStatus = 'COMPLETED') ORDER BY p.createdAt DESC")
    List<VoteProposal> findStaffWorkByVehicleId(@Param("vehicleId") UUID vehicleId);

    @Query("SELECT p FROM VoteProposal p WHERE p.status = 'APPROVED' OR p.executionStatus = 'IN_PROGRESS' OR p.executionStatus = 'COMPLETED' ORDER BY p.createdAt DESC")
    List<VoteProposal> findAllStaffWork();
}
