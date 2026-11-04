package com.evshare.onboarding.repository;

import com.evshare.onboarding.entity.GroupJoinRequest;
import com.evshare.onboarding.entity.JoinRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GroupJoinRequestRepository extends JpaRepository<GroupJoinRequest, UUID> {
    List<GroupJoinRequest> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<GroupJoinRequest> findByGroupIdOrderByCreatedAtDesc(UUID groupId);
    Optional<GroupJoinRequest> findByGroupIdAndUserIdAndStatus(UUID groupId, UUID userId, JoinRequestStatus status);
    boolean existsByGroupIdAndUserIdAndStatus(UUID groupId, UUID userId, JoinRequestStatus status);
    long countByUserIdAndStatus(UUID userId, JoinRequestStatus status);
    long countByGroupIdAndStatus(UUID groupId, JoinRequestStatus status);
}

