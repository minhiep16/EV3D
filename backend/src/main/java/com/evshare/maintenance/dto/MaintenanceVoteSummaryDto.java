package com.evshare.maintenance.dto;

import com.evshare.maintenance.entity.MaintenanceApprovalVote;
import com.evshare.maintenance.entity.VoteDecision;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class MaintenanceVoteSummaryDto {

    private UUID id;
    private UUID memberId;
    private UUID userId;
    private String userName;
    private VoteDecision decision;
    private BigDecimal votingWeight;
    private String comment;
    private Instant createdAt;
    private Instant updatedAt;

    public MaintenanceVoteSummaryDto() {
    }

    public static MaintenanceVoteSummaryDto fromEntity(MaintenanceApprovalVote vote) {
        if (vote == null) return null;
        MaintenanceVoteSummaryDto dto = new MaintenanceVoteSummaryDto();
        dto.setId(vote.getId());
        dto.setMemberId(vote.getMember() != null ? vote.getMember().getId() : null);
        if (vote.getUser() != null) {
            dto.setUserId(vote.getUser().getId());
            dto.setUserName(vote.getUser().getFullName());
        }
        dto.setDecision(vote.getDecision());
        dto.setVotingWeight(vote.getVotingWeight());
        dto.setComment(vote.getComment());
        dto.setCreatedAt(vote.getCreatedAt());
        dto.setUpdatedAt(vote.getUpdatedAt());
        return dto;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getMemberId() {
        return memberId;
    }

    public void setMemberId(UUID memberId) {
        this.memberId = memberId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
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
