package com.evshare.ownership.repository;

import com.evshare.ownership.entity.InvitationStatus;
import com.evshare.ownership.entity.MembershipInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MembershipInvitationRepository extends JpaRepository<MembershipInvitation, UUID> {

    List<MembershipInvitation> findByGroupIdOrderByCreatedAtDesc(UUID groupId);

    List<MembershipInvitation> findByInviteeEmailAndStatus(String email, InvitationStatus status);

    List<MembershipInvitation> findByInviteeUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<MembershipInvitation> findByGroupIdAndInviteeEmailAndStatus(UUID groupId, String email, InvitationStatus status);
}
