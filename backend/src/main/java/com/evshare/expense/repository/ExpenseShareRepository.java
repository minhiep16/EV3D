package com.evshare.expense.repository;

import com.evshare.expense.entity.ExpenseShare;
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
public interface ExpenseShareRepository extends JpaRepository<ExpenseShare, UUID> {

    List<ExpenseShare> findByExpenseIdOrderByOwnershipPercentageDesc(UUID expenseId);

    List<ExpenseShare> findByExpenseId(UUID expenseId);

    boolean existsByExpenseId(UUID expenseId);

    Optional<ExpenseShare> findByExpenseIdAndUserId(UUID expenseId, UUID userId);

    List<ExpenseShare> findByUserId(UUID userId);

    @Query("SELECT es FROM ExpenseShare es JOIN es.expense e WHERE e.vehicle.id = :vehicleId AND e.status = com.evshare.expense.entity.ExpenseStatus.APPROVED AND e.occurredAt >= :from AND e.occurredAt < :to")
    List<ExpenseShare> findByVehicleIdAndOccurredAtBetween(
            @Param("vehicleId") UUID vehicleId,
            @Param("from") Instant from,
            @Param("to") Instant to
    );

    @Query("SELECT COALESCE(SUM(es.shareAmount), 0) FROM ExpenseShare es JOIN es.expense e WHERE e.vehicle.id = :vehicleId AND es.user.id = :userId AND e.status = com.evshare.expense.entity.ExpenseStatus.APPROVED AND e.occurredAt >= :from AND e.occurredAt < :to")
    BigDecimal sumShareAmountByVehicleIdAndUserIdAndOccurredAtBetween(
            @Param("vehicleId") UUID vehicleId,
            @Param("userId") UUID userId,
            @Param("from") Instant from,
            @Param("to") Instant to
    );
}
