package com.evshare.fund.repository;

import com.evshare.fund.entity.FundTransaction;
import com.evshare.fund.entity.FundTransactionDirection;
import com.evshare.fund.entity.FundTransactionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FundTransactionRepository extends JpaRepository<FundTransaction, UUID> {

    List<FundTransaction> findByFundIdOrderByCreatedAtDesc(UUID fundId);

    List<FundTransaction> findByFundIdAndStatusOrderByCreatedAtDesc(UUID fundId, FundTransactionStatus status);

    Optional<FundTransaction> findByReferenceTypeAndReferenceId(String referenceType, String referenceId);

    boolean existsByReferenceTypeAndReferenceIdAndStatus(String referenceType, String referenceId, FundTransactionStatus status);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM FundTransaction t WHERE t.fund.id = :fundId AND t.direction = :direction AND t.status = :status")
    BigDecimal sumAmountByFundIdAndDirectionAndStatus(@Param("fundId") UUID fundId,
                                                      @Param("direction") FundTransactionDirection direction,
                                                      @Param("status") FundTransactionStatus status);
}
