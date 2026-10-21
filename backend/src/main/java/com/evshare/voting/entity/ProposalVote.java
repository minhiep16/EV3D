package com.evshare.voting.entity;

import com.evshare.ownership.entity.GroupMember;
import com.evshare.user.entity.User;
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
@Table(name = "proposal_votes", uniqueConstraints = {
        @UniqueConstraint(name = "uk_proposal_user_vote", columnNames = {"proposal_id", "voter_user_id"})
})
public class ProposalVote implements Persistable<UUID> {

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
    @JoinColumn(name = "voter_user_id", nullable = false)
    private User voterUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private GroupMember member;

    @Enumerated(EnumType.STRING)
    @Column(name = "choice", length = 20, nullable = false)
    private ProposalVoteChoice choice;

    @Column(name = "voting_weight_snapshot", precision = 5, scale = 2, nullable = false)
    private BigDecimal votingWeightSnapshot;

    @Column(name = "comment", length = 1000)
    private String comment;

    @CreationTimestamp
    @Column(name = "cast_at", updatable = false)
    private Instant castAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public ProposalVote() {
    }

    public ProposalVote(
            UUID id,
            VoteProposal proposal,
            User voterUser,
            GroupMember member,
            ProposalVoteChoice choice,
            BigDecimal votingWeightSnapshot,
            String comment
    ) {
        this.id = id != null ? id : UUID.randomUUID();
        this.proposal = proposal;
        this.voterUser = voterUser;
        this.member = member;
        this.choice = choice;
        this.votingWeightSnapshot = votingWeightSnapshot;
        this.comment = comment;
    }

    @PrePersist
    public void ensureId() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.castAt == null) {
            this.castAt = Instant.now();
        }
    }

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

    public User getVoterUser() {
        return voterUser;
    }

    public void setVoterUser(User voterUser) {
        this.voterUser = voterUser;
    }

    public GroupMember getMember() {
        return member;
    }

    public void setMember(GroupMember member) {
        this.member = member;
    }

    public ProposalVoteChoice getChoice() {
        return choice;
    }

    public void setChoice(ProposalVoteChoice choice) {
        this.choice = choice;
    }

    public BigDecimal getVotingWeightSnapshot() {
        return votingWeightSnapshot;
    }

    public void setVotingWeightSnapshot(BigDecimal votingWeightSnapshot) {
        this.votingWeightSnapshot = votingWeightSnapshot;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public Instant getCastAt() {
        return castAt;
    }

    public void setCastAt(Instant castAt) {
        this.castAt = castAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public boolean isNew() {
        return isNew || castAt == null;
    }

    @PostPersist
    @PostLoad
    void markNotNew() {
        this.isNew = false;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ProposalVote that)) return false;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
