package com.evshare.fund.repository;

import com.evshare.fund.entity.FundContribution;
import com.evshare.fund.entity.FundContributionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface FundContributionRepository extends JpaRepository<FundContribution, UUID> {

    List<FundContribution> findByFundIdOrderByCreatedAtDesc(UUID fundId);

    List<FundContribution> findByFundIdAndContributorUserIdOrderByCreatedAtDesc(UUID fundId, UUID contributorUserId);

    List<FundContribution> findByFundIdAndStatusOrderByCreatedAtDesc(UUID fundId, FundContributionStatus status);

    List<FundContribution> findByStatusOrderByCreatedAtDesc(FundContributionStatus status);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM FundContribution c WHERE c.fund.id = :fundId AND c.status = :status")
    BigDecimal sumAmountByFundIdAndStatus(@Param("fundId") UUID fundId, @Param("status") FundContributionStatus status);
}
