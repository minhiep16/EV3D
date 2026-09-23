package com.evshare.ownership.repository;

import com.evshare.ownership.entity.OwnershipShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OwnershipShareRepository extends JpaRepository<OwnershipShare, UUID> {
    List<OwnershipShare> findByGroupId(UUID groupId);
    Optional<OwnershipShare> findByMemberId(UUID memberId);
    Optional<OwnershipShare> findByGroupIdAndMemberId(UUID groupId, UUID memberId);

    @Query("SELECT COALESCE(SUM(s.percentage), 0) FROM OwnershipShare s WHERE s.group.id = :groupId")
    BigDecimal sumPercentageByGroupId(@Param("groupId") UUID groupId);
}
