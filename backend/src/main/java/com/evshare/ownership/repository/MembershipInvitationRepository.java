package com.evshare.ownership.repository;

import com.evshare.ownership.entity.InvitationStatus;
import com.evshare.ownership.entity.MembershipInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MembershipInvitationRepository extends JpaRepository<MembershipInvitation, UUID> {

    List<MembershipInvitation> findByGroupIdOrderByCreatedAtDesc(UUID groupId);

    List<MembershipInvitation> findByGroupIdAndStatusInOrderByCreatedAtDesc(UUID groupId, Collection<InvitationStatus> statuses);

    List<MembershipInvitation> findByInviteeEmailAndStatus(String email, InvitationStatus status);

    List<MembershipInvitation> findByInviteeUserIdOrderByCreatedAtDesc(UUID userId);

    List<MembershipInvitation> findByInviteeUserIdAndStatusInOrderByCreatedAtDesc(UUID userId, Collection<InvitationStatus> statuses);

    Optional<MembershipInvitation> findByGroupIdAndInviteeEmailAndStatus(UUID groupId, String email, InvitationStatus status);

    Optional<MembershipInvitation> findByGroupIdAndInviteeUserIdAndStatusIn(UUID groupId, UUID inviteeUserId, Collection<InvitationStatus> statuses);

    @Query("SELECT m FROM MembershipInvitation m WHERE (m.inviteeUser.id = :userId OR (m.inviteeEmail IS NOT NULL AND LOWER(m.inviteeEmail) = LOWER(:email))) ORDER BY m.createdAt DESC")
    List<MembershipInvitation> findByInviteeUserIdOrEmailIgnoreCaseOrderByCreatedAtDesc(@Param("userId") UUID userId, @Param("email") String email);

    @Query("SELECT m FROM MembershipInvitation m WHERE (m.inviteeUser.id = :userId OR (m.inviteeEmail IS NOT NULL AND LOWER(m.inviteeEmail) = LOWER(:email))) AND m.status IN :statuses ORDER BY m.createdAt DESC")
    List<MembershipInvitation> findByInviteeUserIdOrEmailIgnoreCaseAndStatusInOrderByCreatedAtDesc(@Param("userId") UUID userId, @Param("email") String email, @Param("statuses") Collection<InvitationStatus> statuses);

    @Query("SELECT m FROM MembershipInvitation m WHERE LOWER(m.inviteeEmail) = LOWER(:email) AND m.status = :status")
    List<MembershipInvitation> findByInviteeEmailIgnoreCaseAndStatus(@Param("email") String email, @Param("status") InvitationStatus status);

    @Query("SELECT m FROM MembershipInvitation m WHERE m.group.id = :groupId AND LOWER(m.inviteeEmail) = LOWER(:email) AND m.status = :status")
    Optional<MembershipInvitation> findByGroupIdAndInviteeEmailIgnoreCaseAndStatus(@Param("groupId") UUID groupId, @Param("email") String email, @Param("status") InvitationStatus status);

    List<MembershipInvitation> findByStatusInOrderByCreatedAtDesc(Collection<InvitationStatus> statuses);

    long countByStatusIn(Collection<InvitationStatus> statuses);

    List<MembershipInvitation> findByContractVersionId(UUID contractVersionId);
}
