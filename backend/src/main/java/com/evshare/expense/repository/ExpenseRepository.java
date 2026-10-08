package com.evshare.expense.repository;

import com.evshare.expense.entity.Expense;
import com.evshare.expense.entity.ExpenseCategory;
import com.evshare.expense.entity.ExpenseSourceType;
import com.evshare.expense.entity.ExpenseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, UUID> {

    List<Expense> findByVehicleIdOrderByOccurredAtDesc(UUID vehicleId);

    List<Expense> findByVehicleIdAndOccurredAtBetweenOrderByOccurredAtDesc(
            UUID vehicleId,
            Instant from,
            Instant to
    );

    List<Expense> findByVehicleIdAndCategoryOrderByOccurredAtDesc(
            UUID vehicleId,
            ExpenseCategory category
    );

    List<Expense> findByVehicleIdAndCategoryAndOccurredAtBetweenOrderByOccurredAtDesc(
            UUID vehicleId,
            ExpenseCategory category,
            Instant from,
            Instant to
    );

    List<Expense> findByVehicleIdAndStatusOrderByOccurredAtDesc(
            UUID vehicleId,
            ExpenseStatus status
    );

    List<Expense> findByVehicleIdAndStatusAndOccurredAtBetweenOrderByOccurredAtDesc(
            UUID vehicleId,
            ExpenseStatus status,
            Instant from,
            Instant to
    );

    List<Expense> findByVehicleIdAndCategoryAndStatusOrderByOccurredAtDesc(
            UUID vehicleId,
            ExpenseCategory category,
            ExpenseStatus status
    );

    List<Expense> findByVehicleIdAndCategoryAndStatusAndOccurredAtBetweenOrderByOccurredAtDesc(
            UUID vehicleId,
            ExpenseCategory category,
            ExpenseStatus status,
            Instant from,
            Instant to
    );

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.vehicle.id = :vehicleId AND e.status = com.evshare.expense.entity.ExpenseStatus.APPROVED AND e.occurredAt >= :from AND e.occurredAt < :to")
    BigDecimal sumApprovedAmountByVehicleIdAndOccurredAtBetween(
            @Param("vehicleId") UUID vehicleId,
            @Param("from") Instant from,
            @Param("to") Instant to
    );

    @Query("SELECT COUNT(e) FROM Expense e WHERE e.vehicle.id = :vehicleId AND e.status = com.evshare.expense.entity.ExpenseStatus.APPROVED AND e.occurredAt >= :from AND e.occurredAt < :to")
    long countApprovedByVehicleIdAndOccurredAtBetween(
            @Param("vehicleId") UUID vehicleId,
            @Param("from") Instant from,
            @Param("to") Instant to
    );

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.vehicle.id = :vehicleId AND e.status = com.evshare.expense.entity.ExpenseStatus.PENDING_VERIFICATION AND e.occurredAt >= :from AND e.occurredAt < :to")
    BigDecimal sumPendingAmountByVehicleIdAndOccurredAtBetween(
            @Param("vehicleId") UUID vehicleId,
            @Param("from") Instant from,
            @Param("to") Instant to
    );

    @Query("SELECT COUNT(e) FROM Expense e WHERE e.vehicle.id = :vehicleId AND e.status = com.evshare.expense.entity.ExpenseStatus.PENDING_VERIFICATION AND e.occurredAt >= :from AND e.occurredAt < :to")
    long countPendingByVehicleIdAndOccurredAtBetween(
            @Param("vehicleId") UUID vehicleId,
            @Param("from") Instant from,
            @Param("to") Instant to
    );

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.vehicle.id = :vehicleId AND e.occurredAt >= :from AND e.occurredAt < :to")
    BigDecimal sumAmountByVehicleIdAndOccurredAtBetween(
            @Param("vehicleId") UUID vehicleId,
            @Param("from") Instant from,
            @Param("to") Instant to
    );

    @Query("SELECT COUNT(e) FROM Expense e WHERE e.vehicle.id = :vehicleId AND e.occurredAt >= :from AND e.occurredAt < :to")
    long countByVehicleIdAndOccurredAtBetween(
            @Param("vehicleId") UUID vehicleId,
            @Param("from") Instant from,
            @Param("to") Instant to
    );

    boolean existsBySourceTypeAndSourceReferenceId(
            ExpenseSourceType sourceType,
            String sourceReferenceId
    );

    boolean existsByRelatedTripId(UUID relatedTripId);

    Optional<Expense> findByRelatedTripId(UUID relatedTripId);

    Optional<Expense> findBySourceTypeAndSourceReferenceId(
            ExpenseSourceType sourceType,
            String sourceReferenceId
    );
}
