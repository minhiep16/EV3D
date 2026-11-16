package com.evshare.dispute.repository;

import com.evshare.dispute.entity.DisputeCompensationPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DisputeCompensationPaymentRepository extends JpaRepository<DisputeCompensationPayment, UUID> {

    List<DisputeCompensationPayment> findByCompensationIdOrderByCreatedAtDesc(UUID compensationId);

    Optional<DisputeCompensationPayment> findByPaymentReference(String paymentReference);

    boolean existsByPaymentReference(String paymentReference);
}
