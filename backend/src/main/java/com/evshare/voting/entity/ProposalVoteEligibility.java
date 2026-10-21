package com.evshare.voting.entity;

import com.evshare.ownership.entity.GroupMember;
import com.evshare.user.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.domain.Persistable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "proposal_vote_eligibility", uniqueConstraints = {
        @UniqueConstraint(name = "uk_proposal_eligible_user", columnNames = {"proposal_id", "user_id"})
})
public class ProposalVoteEligibility implements Persistable<UUID> {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @Transient
    private boolean isNew = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposal_id", nullable = false)
    private VoteProposal proposal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private GroupMember member;

    @Column(name = "voting_weight", precision = 5, scale = 2, nullable = false)
    private BigDecimal votingWeight;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public ProposalVoteEligibility() {
    }

    public ProposalVoteEligibility(
            UUID id,
            VoteProposal proposal,
            User user,
            GroupMember member,
            BigDecimal votingWeight
    ) {
        this.id = id != null ? id : UUID.randomUUID();
        this.proposal = proposal;
        this.user = user;
        this.member = member;
        this.votingWeight = votingWeight;
        this.isNew = true;
    }

    @Override
    public boolean isNew() {
        return isNew || createdAt == null;
    }

    @PostPersist
    @PostLoad
    void markNotNew() {
        this.isNew = false;
    }

    @PrePersist
    public void ensureId() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
    }

    @Override
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public VoteProposal getProposal() {
        return proposal;
    }

    public void setProposal(VoteProposal proposal) {
        this.proposal = proposal;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public GroupMember getMember() {
        return member;
    }

    public void setMember(GroupMember member) {
        this.member = member;
    }

    public BigDecimal getVotingWeight() {
        return votingWeight;
    }

    public void setVotingWeight(BigDecimal votingWeight) {
        this.votingWeight = votingWeight;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ProposalVoteEligibility that)) return false;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
