package com.evshare.dispute.repository;

import com.evshare.dispute.entity.Dispute;
import com.evshare.dispute.entity.DisputeCategory;
import com.evshare.dispute.entity.DisputeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, UUID> {

    Optional<Dispute> findByReferenceCode(String referenceCode);

    List<Dispute> findByVehicleIdOrderByCreatedAtDesc(UUID vehicleId);

    List<Dispute> findByCreatedBy_IdOrderByCreatedAtDesc(UUID userId);

    @Query("SELECT d FROM Dispute d WHERE d.vehicle.id = :vehicleId AND d.status = :status ORDER BY d.createdAt DESC")
    List<Dispute> findByVehicleIdAndStatusOrderByCreatedAtDesc(@Param("vehicleId") UUID vehicleId, @Param("status") DisputeStatus status);

    @Query("SELECT d FROM Dispute d WHERE d.vehicle.id = :vehicleId AND d.category = :category ORDER BY d.createdAt DESC")
    List<Dispute> findByVehicleIdAndCategoryOrderByCreatedAtDesc(@Param("vehicleId") UUID vehicleId, @Param("category") DisputeCategory category);

    @Query("SELECT DISTINCT d FROM Dispute d LEFT JOIN d.participants p " +
           "WHERE d.createdBy.id = :userId OR p.user.id = :userId " +
           "ORDER BY d.createdAt DESC")
    List<Dispute> findInvolvedDisputesForUser(@Param("userId") UUID userId);

    @Query("SELECT DISTINCT d FROM Dispute d LEFT JOIN d.participants p " +
           "WHERE d.vehicle.id = :vehicleId AND (d.createdBy.id = :userId OR p.user.id = :userId) " +
           "ORDER BY d.createdAt DESC")
    List<Dispute> findInvolvedDisputesForUserAndVehicle(@Param("vehicleId") UUID vehicleId, @Param("userId") UUID userId);

    @Query("SELECT d FROM Dispute d WHERE d.assignedStaff.id = :staffId ORDER BY d.createdAt DESC")
    List<Dispute> findByAssignedStaffId(@Param("staffId") UUID staffId);

    @Query("SELECT COUNT(d) FROM Dispute d WHERE d.vehicle.id = :vehicleId AND d.status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED')")
    long countActiveDisputesByVehicle(@Param("vehicleId") UUID vehicleId);

    boolean existsByBookingIdAndStatusNotIn(UUID bookingId, List<DisputeStatus> terminalStatuses);

    boolean existsByExpenseIdAndStatusNotIn(UUID expenseId, List<DisputeStatus> terminalStatuses);

    boolean existsByExpenseShareIdAndStatusNotIn(UUID expenseShareId, List<DisputeStatus> terminalStatuses);

    boolean existsByDamageRecordIdAndStatusNotIn(UUID damageRecordId, List<DisputeStatus> terminalStatuses);

    boolean existsByProposalId(UUID proposalId);

    long countByStatusNotIn(java.util.Collection<DisputeStatus> statuses);
}

