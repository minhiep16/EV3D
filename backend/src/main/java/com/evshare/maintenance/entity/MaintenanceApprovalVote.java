package com.evshare.maintenance.entity;

import com.evshare.ownership.entity.CoOwnershipGroup;
import com.evshare.ownership.entity.GroupMember;
import com.evshare.user.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "maintenance_approval_votes", uniqueConstraints = {
        @UniqueConstraint(name = "uk_maintenance_member_vote", columnNames = {"maintenance_request_id", "member_id"})
})
public class MaintenanceApprovalVote {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maintenance_request_id", nullable = false)
    private MaintenanceRequest maintenanceRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private CoOwnershipGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private GroupMember member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision", length = 20, nullable = false)
    private VoteDecision decision;

    @Column(name = "voting_weight", precision = 5, scale = 2, nullable = false)
    private BigDecimal votingWeight;

    @Column(name = "comment", length = 1000)
    private String comment;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public MaintenanceApprovalVote() {
    }

    public MaintenanceApprovalVote(
            UUID id,
            MaintenanceRequest maintenanceRequest,
            CoOwnershipGroup group,
            GroupMember member,
            User user,
            VoteDecision decision,
            BigDecimal votingWeight,
            String comment
    ) {
        this.id = id != null ? id : UUID.randomUUID();
        this.maintenanceRequest = maintenanceRequest;
        this.group = group;
        this.member = member;
        this.user = user;
        this.decision = decision;
        this.votingWeight = votingWeight;
        this.comment = comment;
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

    public MaintenanceRequest getMaintenanceRequest() {
        return maintenanceRequest;
    }

    public void setMaintenanceRequest(MaintenanceRequest maintenanceRequest) {
        this.maintenanceRequest = maintenanceRequest;
    }

    public CoOwnershipGroup getGroup() {
        return group;
    }

    public void setGroup(CoOwnershipGroup group) {
        this.group = group;
    }

    public GroupMember getMember() {
        return member;
    }

    public void setMember(GroupMember member) {
        this.member = member;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public VoteDecision getDecision() {
        return decision;
    }

    public void setDecision(VoteDecision decision) {
        this.decision = decision;
    }

    public BigDecimal getVotingWeight() {
        return votingWeight;
    }

    public void setVotingWeight(BigDecimal votingWeight) {
        this.votingWeight = votingWeight;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
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
