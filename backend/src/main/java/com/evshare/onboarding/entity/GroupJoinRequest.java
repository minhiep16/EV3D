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
@Table(name = "group_join_requests")
public class GroupJoinRequest {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "group_id", length = 36, columnDefinition = "CHAR(36)", nullable = false)
    private UUID groupId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "user_id", length = 36, columnDefinition = "CHAR(36)", nullable = false)
    private UUID userId;

    @Column(name = "requested_percentage", precision = 5, scale = 2)
    private BigDecimal requestedPercentage;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private JoinRequestStatus status = JoinRequestStatus.PENDING;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "reviewed_by", length = 36, columnDefinition = "CHAR(36)")
    private UUID reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public GroupJoinRequest() {
    }

    public GroupJoinRequest(UUID id, UUID groupId, UUID userId, BigDecimal requestedPercentage, String message) {
        this.id = id != null ? id : UUID.randomUUID();
        this.groupId = groupId;
        this.userId = userId;
        this.requestedPercentage = requestedPercentage;
        this.message = message;
        this.status = JoinRequestStatus.PENDING;
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

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public BigDecimal getRequestedPercentage() {
        return requestedPercentage;
    }

    public void setRequestedPercentage(BigDecimal requestedPercentage) {
        this.requestedPercentage = requestedPercentage;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public JoinRequestStatus getStatus() {
        return status;
    }

    public void setStatus(JoinRequestStatus status) {
        this.status = status;
    }

    public String getReviewNotes() {
        return reviewNotes;
    }

    public void setReviewNotes(String reviewNotes) {
        this.reviewNotes = reviewNotes;
    }

    public UUID getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(UUID reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(Instant reviewedAt) {
        this.reviewedAt = reviewedAt;
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
}

