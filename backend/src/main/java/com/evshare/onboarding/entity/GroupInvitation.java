package com.evshare.onboarding.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "group_invitations")
public class GroupInvitation {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "group_id", length = 36, columnDefinition = "CHAR(36)", nullable = false)
    private UUID groupId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "inviter_id", length = 36, columnDefinition = "CHAR(36)", nullable = false)
    private UUID inviterId;

    @Column(name = "invitee_email", length = 150, nullable = false)
    private String inviteeEmail;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "invitee_user_id", length = 36, columnDefinition = "CHAR(36)")
    private UUID inviteeUserId;

    @Column(name = "proposed_percentage", precision = 5, scale = 2, nullable = false)
    private BigDecimal proposedPercentage;

    @Column(name = "invite_code", length = 50, unique = true)
    private String inviteCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private InvitationStatus status = InvitationStatus.PENDING;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "contract_version_id", length = 36, columnDefinition = "CHAR(36)")
    private UUID contractVersionId;

    @Column(name = "consent_content_hash", length = 64)
    private String consentContentHash;

    @Column(name = "consented_at")
    private Instant consentedAt;

    @Column(name = "signer_full_name", length = 100)
    private String signerFullName;

    @Column(name = "consent_method", length = 50)
    private String consentMethod = "AUTHENTICATED_ELECTRONIC_CONSENT";

    @Column(name = "consent_ip_address", length = 50)
    private String consentIpAddress;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public GroupInvitation() {
    }

    public GroupInvitation(UUID id, UUID groupId, UUID inviterId, String inviteeEmail, UUID inviteeUserId, BigDecimal proposedPercentage, String inviteCode, Instant expiresAt) {
        this.id = id != null ? id : UUID.randomUUID();
        this.groupId = groupId;
        this.inviterId = inviterId;
        this.inviteeEmail = inviteeEmail;
        this.inviteeUserId = inviteeUserId;
        this.proposedPercentage = proposedPercentage;
        this.inviteCode = inviteCode;
        this.status = InvitationStatus.PENDING;
        this.expiresAt = expiresAt;
    }

    @PrePersist
    public void ensureId() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getGroupId() {
        return groupId;
    }

    public void setGroupId(UUID groupId) {
        this.groupId = groupId;
    }

    public UUID getInviterId() {
        return inviterId;
    }

    public void setInviterId(UUID inviterId) {
        this.inviterId = inviterId;
    }

    public String getInviteeEmail() {
        return inviteeEmail;
    }

    public void setInviteeEmail(String inviteeEmail) {
        this.inviteeEmail = inviteeEmail;
    }

    public UUID getInviteeUserId() {
        return inviteeUserId;
    }

    public void setInviteeUserId(UUID inviteeUserId) {
        this.inviteeUserId = inviteeUserId;
    }

    public BigDecimal getProposedPercentage() {
        return proposedPercentage;
    }

    public void setProposedPercentage(BigDecimal proposedPercentage) {
        this.proposedPercentage = proposedPercentage;
    }

    public String getInviteCode() {
        return inviteCode;
    }

    public void setInviteCode(String inviteCode) {
        this.inviteCode = inviteCode;
    }

    public InvitationStatus getStatus() {
        return status;
    }

    public void setStatus(InvitationStatus status) {
        this.status = status;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public UUID getContractVersionId() {
        return contractVersionId;
    }

    public void setContractVersionId(UUID contractVersionId) {
        this.contractVersionId = contractVersionId;
    }

    public String getConsentContentHash() {
        return consentContentHash;
    }

    public void setConsentContentHash(String consentContentHash) {
        this.consentContentHash = consentContentHash;
    }

    public Instant getConsentedAt() {
        return consentedAt;
    }

    public void setConsentedAt(Instant consentedAt) {
        this.consentedAt = consentedAt;
    }

    public String getSignerFullName() {
        return signerFullName;
    }

    public void setSignerFullName(String signerFullName) {
        this.signerFullName = signerFullName;
    }

    public String getConsentMethod() {
        return consentMethod;
    }

    public void setConsentMethod(String consentMethod) {
        this.consentMethod = consentMethod;
    }

    public String getConsentIpAddress() {
        return consentIpAddress;
    }

    public void setConsentIpAddress(String consentIpAddress) {
        this.consentIpAddress = consentIpAddress;
    }
}

