package com.evshare.ownership.repository;

import com.evshare.ownership.entity.GroupMember;
import com.evshare.ownership.entity.MemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, UUID> {
    List<GroupMember> findByGroupId(UUID groupId);
    List<GroupMember> findByGroupIdAndStatus(UUID groupId, MemberStatus status);
    Optional<GroupMember> findByGroupIdAndUserId(UUID groupId, UUID userId);
    boolean existsByGroupIdAndUserId(UUID groupId, UUID userId);
    boolean existsByGroupIdAndUserIdAndStatus(UUID groupId, UUID userId, MemberStatus status);
}
