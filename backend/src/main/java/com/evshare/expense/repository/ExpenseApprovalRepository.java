package com.evshare.expense.repository;

import com.evshare.expense.entity.ExpenseApproval;
import com.evshare.expense.entity.ExpenseApprovalDecision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExpenseApprovalRepository extends JpaRepository<ExpenseApproval, UUID> {

    List<ExpenseApproval> findByExpenseId(UUID expenseId);

    List<ExpenseApproval> findByExpenseIdOrderByCreatedAtAsc(UUID expenseId);

    Optional<ExpenseApproval> findByExpenseIdAndUserId(UUID expenseId, UUID userId);

    boolean existsByExpenseIdAndUserId(UUID expenseId, UUID userId);

    long countByExpenseIdAndDecision(UUID expenseId, ExpenseApprovalDecision decision);
}
