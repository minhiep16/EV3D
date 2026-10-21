package com.evshare.fund.repository;

import com.evshare.fund.entity.PersonalExpensePayment;
import com.evshare.fund.entity.PersonalPaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PersonalExpensePaymentRepository extends JpaRepository<PersonalExpensePayment, UUID> {

    List<PersonalExpensePayment> findByExpenseIdOrderByCreatedAtDesc(UUID expenseId);

    List<PersonalExpensePayment> findByExpenseShareIdOrderByCreatedAtDesc(UUID expenseShareId);

    List<PersonalExpensePayment> findByPayerUserIdOrderByCreatedAtDesc(UUID payerUserId);

    List<PersonalExpensePayment> findByStatusOrderByCreatedAtDesc(PersonalPaymentStatus status);
}
