package com.evshare.ownership.entity;

import com.evshare.user.entity.User;
import com.evshare.vehicle.entity.Vehicle;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import org.springframework.data.domain.Persistable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "membership_invitations")
public class MembershipInvitation implements Persistable<UUID> {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @Transient
    private boolean isNew = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private CoOwnershipGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "invited_by_user_id", nullable = false)
    private User invitedByUser;

    @Column(name = "invitee_email", nullable = false)
    private String inviteeEmail;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "invitee_user_id")
    private User inviteeUser;

    @Column(name = "proposed_percentage", precision = 5, scale = 2)
    private BigDecimal proposedPercentage = BigDecimal.ZERO;

    @Column(name = "leader_transfer_percentage", precision = 5, scale = 2)
    private BigDecimal leaderTransferPercentage = BigDecimal.ZERO;

    @Column(name = "additional_contributions_json", columnDefinition = "TEXT")
    private String additionalContributionsJson;

    @Column(name = "total_offered_percentage", precision = 5, scale = 2)
    private BigDecimal totalOfferedPercentage = BigDecimal.ZERO;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "contract_version_id", length = 36, columnDefinition = "CHAR(36)")
    private UUID contractVersionId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "contract_id", length = 36, columnDefinition = "CHAR(36)")
    private UUID contractId;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "signatures_json", columnDefinition = "TEXT")
    private String signaturesJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 35, nullable = false)
    private InvitationStatus status = InvitationStatus.PENDING_INVITEE_RESPONSE;

    @Column(name = "invitation_note", columnDefinition = "TEXT")
    private String invitationNote;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "rejected_at")
    private Instant rejectedAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public MembershipInvitation() {
    }

    public MembershipInvitation(
            UUID id,
            CoOwnershipGroup group,
            Vehicle vehicle,
            User invitedByUser,
            String inviteeEmail,
            User inviteeUser,
            BigDecimal proposedPercentage,
            String invitationNote,
            Instant expiresAt
    ) {
        this.id = id != null ? id : UUID.randomUUID();
        this.group = group;
        this.vehicle = vehicle;
        this.invitedByUser = invitedByUser;
        this.inviteeEmail = inviteeEmail;
        this.inviteeUser = inviteeUser;
        this.proposedPercentage = proposedPercentage != null ? proposedPercentage : BigDecimal.ZERO;
        this.invitationNote = invitationNote;
        this.expiresAt = expiresAt;
        this.status = InvitationStatus.INVITED;
        this.isNew = true;
    }

    @Override
    public UUID getId() {
        return id;
    }

    @Override
    public boolean isNew() {
        return isNew;
    }

    @PostLoad
    @PostPersist
    void markNotNew() {
        this.isNew = false;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public CoOwnershipGroup getGroup() {
        return group;
    }

    public void setGroup(CoOwnershipGroup group) {
        this.group = group;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public User getInvitedByUser() {
        return invitedByUser;
    }

    public void setInvitedByUser(User invitedByUser) {
        this.invitedByUser = invitedByUser;
    }

    public String getInviteeEmail() {
        return inviteeEmail;
    }

    public void setInviteeEmail(String inviteeEmail) {
        this.inviteeEmail = inviteeEmail;
    }

    public User getInviteeUser() {
        return inviteeUser;
    }

    public void setInviteeUser(User inviteeUser) {
        this.inviteeUser = inviteeUser;
    }

    public BigDecimal getProposedPercentage() {
        return proposedPercentage;
    }

    public void setProposedPercentage(BigDecimal proposedPercentage) {
        this.proposedPercentage = proposedPercentage;
    }

    public BigDecimal getLeaderTransferPercentage() {
        return leaderTransferPercentage;
    }

    public void setLeaderTransferPercentage(BigDecimal leaderTransferPercentage) {
        this.leaderTransferPercentage = leaderTransferPercentage;
    }

    public String getAdditionalContributionsJson() {
        return additionalContributionsJson;
    }

    public void setAdditionalContributionsJson(String additionalContributionsJson) {
        this.additionalContributionsJson = additionalContributionsJson;
    }

    public BigDecimal getTotalOfferedPercentage() {
        return totalOfferedPercentage;
    }

    public void setTotalOfferedPercentage(BigDecimal totalOfferedPercentage) {
        this.totalOfferedPercentage = totalOfferedPercentage;
    }

    public UUID getContractVersionId() {
        return contractVersionId;
    }

    public void setContractVersionId(UUID contractVersionId) {
        this.contractVersionId = contractVersionId;
    }

    public UUID getContractId() {
        return contractId;
    }

    public void setContractId(UUID contractId) {
        this.contractId = contractId;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public String getSignaturesJson() {
        return signaturesJson;
    }

    public void setSignaturesJson(String signaturesJson) {
        this.signaturesJson = signaturesJson;
    }

    public InvitationStatus getStatus() {
        return status;
    }

    public void setStatus(InvitationStatus status) {
        this.status = status;
    }

    public String getInvitationNote() {
        return invitationNote;
    }

    public void setInvitationNote(String invitationNote) {
        this.invitationNote = invitationNote;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(Instant acceptedAt) {
        this.acceptedAt = acceptedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }

    public Instant getRejectedAt() {
        return rejectedAt;
    }

    public void setRejectedAt(Instant rejectedAt) {
        this.rejectedAt = rejectedAt;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(Instant cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
