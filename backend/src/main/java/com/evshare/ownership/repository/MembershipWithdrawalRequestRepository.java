package com.evshare.ownership.repository;

import com.evshare.ownership.entity.MembershipWithdrawalRequest;
import com.evshare.ownership.entity.WithdrawalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MembershipWithdrawalRequestRepository extends JpaRepository<MembershipWithdrawalRequest, UUID> {

    List<MembershipWithdrawalRequest> findByGroupIdOrderByCreatedAtDesc(UUID groupId);

    List<MembershipWithdrawalRequest> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<MembershipWithdrawalRequest> findByMemberIdOrderByCreatedAtDesc(UUID memberId);

    Optional<MembershipWithdrawalRequest> findByUserIdAndStatus(UUID userId, WithdrawalStatus status);

    boolean existsByUserIdAndStatus(UUID userId, WithdrawalStatus status);
}
