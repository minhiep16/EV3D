package com.evshare.onboarding.repository;

import com.evshare.onboarding.entity.GroupInvitation;
import com.evshare.onboarding.entity.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GroupInvitationRepository extends JpaRepository<GroupInvitation, UUID> {
    List<GroupInvitation> findByInviteeEmailAndStatusOrderByCreatedAtDesc(String inviteeEmail, InvitationStatus status);
    List<GroupInvitation> findByInviteeUserIdAndStatusOrderByCreatedAtDesc(UUID inviteeUserId, InvitationStatus status);
    List<GroupInvitation> findByGroupIdOrderByCreatedAtDesc(UUID groupId);
    Optional<GroupInvitation> findByInviteCode(String inviteCode);
    boolean existsByGroupIdAndInviteeEmailAndStatus(UUID groupId, String inviteeEmail, InvitationStatus status);
    long countByInviteeEmailAndStatus(String inviteeEmail, InvitationStatus status);
}

