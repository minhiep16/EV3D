package com.evshare.voting.entity;

import com.evshare.expense.entity.Expense;
import com.evshare.maintenance.entity.MaintenanceRequest;
import com.evshare.ownership.entity.CoOwnershipGroup;
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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "vote_proposals")
public class VoteProposal implements Persistable<UUID> {

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdByUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "proposal_type", length = 40, nullable = false)
    private VoteProposalType proposalType;

    @Column(name = "title", length = 255, nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "estimated_amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal estimatedAmount;

    @Column(name = "approved_budget", precision = 14, scale = 2)
    private BigDecimal approvedBudget;

    @Column(name = "currency", length = 10, nullable = false)
    private String currency = "VND";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private VoteProposalStatus status = VoteProposalStatus.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision_rule", length = 40, nullable = false)
    private VoteDecisionRule decisionRule = VoteDecisionRule.OWNERSHIP_WEIGHTED;

    @Column(name = "required_quorum_percentage", precision = 5, scale = 2, nullable = false)
    private BigDecimal requiredQuorumPercentage = new BigDecimal("50.00");

    @Column(name = "required_threshold_percentage", precision = 5, scale = 2, nullable = false)
    private BigDecimal requiredThresholdPercentage = new BigDecimal("50.00");

    @Column(name = "agreement_version", length = 50, nullable = false)
    private String agreementVersion = "V1.0";

    @Column(name = "voting_starts_at", nullable = false)
    private Instant votingStartsAt;

    @Column(name = "voting_ends_at", nullable = false)
    private Instant votingEndsAt;

    @Column(name = "finalized_at")
    private Instant finalizedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "execution_status", length = 30, nullable = false)
    private ProposalExecutionStatus executionStatus = ProposalExecutionStatus.NOT_STARTED;

    @Column(name = "execution_started_at")
    private Instant executionStartedAt;

    @Column(name = "execution_completed_at")
    private Instant executionCompletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "executed_by_staff_id")
    private User executedByStaff;

    @Column(name = "actual_cost", precision = 14, scale = 2)
    private BigDecimal actualCost;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_maintenance_request_id")
    private MaintenanceRequest relatedMaintenanceRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_expense_id")
    private Expense relatedExpense;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @OneToMany(mappedBy = "proposal")
    private List<ProposalVoteEligibility> eligibilities = new ArrayList<>();

    @OneToMany(mappedBy = "proposal")
    private List<ProposalVote> votes = new ArrayList<>();

    public VoteProposal() {
    }

    public VoteProposal(
            UUID id,
            CoOwnershipGroup group,
            Vehicle vehicle,
            User createdByUser,
            VoteProposalType proposalType,
            String title,
            String description,
            BigDecimal estimatedAmount,
            BigDecimal approvedBudget,
            String currency,
            VoteProposalStatus status,
            VoteDecisionRule decisionRule,
            BigDecimal requiredQuorumPercentage,
            BigDecimal requiredThresholdPercentage,
            String agreementVersion,
            Instant votingStartsAt,
            Instant votingEndsAt
    ) {
        this.id = id != null ? id : UUID.randomUUID();
        this.group = group;
        this.vehicle = vehicle;
        this.createdByUser = createdByUser;
        this.proposalType = proposalType;
        this.title = title;
        this.description = description;
        this.estimatedAmount = estimatedAmount;
        this.approvedBudget = approvedBudget;
        this.currency = currency != null ? currency : "VND";
        this.status = status != null ? status : VoteProposalStatus.OPEN;
        this.decisionRule = decisionRule != null ? decisionRule : VoteDecisionRule.OWNERSHIP_WEIGHTED;
        this.requiredQuorumPercentage = requiredQuorumPercentage != null ? requiredQuorumPercentage : new BigDecimal("50.00");
        this.requiredThresholdPercentage = requiredThresholdPercentage != null ? requiredThresholdPercentage : new BigDecimal("50.00");
        this.agreementVersion = agreementVersion != null ? agreementVersion : "V1.0";
        this.votingStartsAt = votingStartsAt != null ? votingStartsAt : Instant.now();
        this.votingEndsAt = votingEndsAt;
        this.executionStatus = ProposalExecutionStatus.NOT_STARTED;
    }

    @PrePersist
    public void ensureDefaults() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.votingStartsAt == null) {
            this.votingStartsAt = Instant.now();
        }
        if (this.currency == null) {
            this.currency = "VND";
        }
        if (this.status == null) {
            this.status = VoteProposalStatus.OPEN;
        }
        if (this.executionStatus == null) {
            this.executionStatus = ProposalExecutionStatus.NOT_STARTED;
        }
        if (this.decisionRule == null) {
            this.decisionRule = VoteDecisionRule.OWNERSHIP_WEIGHTED;
        }
        if (this.requiredQuorumPercentage == null) {
            this.requiredQuorumPercentage = new BigDecimal("50.00");
        }
        if (this.requiredThresholdPercentage == null) {
            this.requiredThresholdPercentage = new BigDecimal("50.00");
        }
    }

    // Getters and Setters
    public UUID getId() {
        return id;
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

    public User getCreatedByUser() {
        return createdByUser;
    }

    public void setCreatedByUser(User createdByUser) {
        this.createdByUser = createdByUser;
    }

    public VoteProposalType getProposalType() {
        return proposalType;
    }

    public void setProposalType(VoteProposalType proposalType) {
        this.proposalType = proposalType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getEstimatedAmount() {
        return estimatedAmount;
    }

    public void setEstimatedAmount(BigDecimal estimatedAmount) {
        this.estimatedAmount = estimatedAmount;
    }

    public BigDecimal getApprovedBudget() {
        return approvedBudget;
    }

    public void setApprovedBudget(BigDecimal approvedBudget) {
        this.approvedBudget = approvedBudget;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public VoteProposalStatus getStatus() {
        return status;
    }

    public void setStatus(VoteProposalStatus status) {
        this.status = status;
    }

    public VoteDecisionRule getDecisionRule() {
        return decisionRule;
    }

    public void setDecisionRule(VoteDecisionRule decisionRule) {
        this.decisionRule = decisionRule;
    }

    public BigDecimal getRequiredQuorumPercentage() {
        return requiredQuorumPercentage;
    }

    public void setRequiredQuorumPercentage(BigDecimal requiredQuorumPercentage) {
        this.requiredQuorumPercentage = requiredQuorumPercentage;
    }

    public BigDecimal getRequiredThresholdPercentage() {
        return requiredThresholdPercentage;
    }

    public void setRequiredThresholdPercentage(BigDecimal requiredThresholdPercentage) {
        this.requiredThresholdPercentage = requiredThresholdPercentage;
    }

    public String getAgreementVersion() {
        return agreementVersion;
    }

    public void setAgreementVersion(String agreementVersion) {
        this.agreementVersion = agreementVersion;
    }

    public Instant getVotingStartsAt() {
        return votingStartsAt;
    }

    public void setVotingStartsAt(Instant votingStartsAt) {
        this.votingStartsAt = votingStartsAt;
    }

    public Instant getVotingEndsAt() {
        return votingEndsAt;
    }

    public void setVotingEndsAt(Instant votingEndsAt) {
        this.votingEndsAt = votingEndsAt;
    }

    public Instant getFinalizedAt() {
        return finalizedAt;
    }

    public void setFinalizedAt(Instant finalizedAt) {
        this.finalizedAt = finalizedAt;
    }

    public ProposalExecutionStatus getExecutionStatus() {
        return executionStatus;
    }

    public void setExecutionStatus(ProposalExecutionStatus executionStatus) {
        this.executionStatus = executionStatus;
    }

    public Instant getExecutionStartedAt() {
        return executionStartedAt;
    }

    public void setExecutionStartedAt(Instant executionStartedAt) {
        this.executionStartedAt = executionStartedAt;
    }

    public Instant getExecutionCompletedAt() {
        return executionCompletedAt;
    }

    public void setExecutionCompletedAt(Instant executionCompletedAt) {
        this.executionCompletedAt = executionCompletedAt;
    }

    public User getExecutedByStaff() {
        return executedByStaff;
    }

    public void setExecutedByStaff(User executedByStaff) {
        this.executedByStaff = executedByStaff;
    }

    public BigDecimal getActualCost() {
        return actualCost;
    }

    public void setActualCost(BigDecimal actualCost) {
        this.actualCost = actualCost;
    }

    public MaintenanceRequest getRelatedMaintenanceRequest() {
        return relatedMaintenanceRequest;
    }

    public void setRelatedMaintenanceRequest(MaintenanceRequest relatedMaintenanceRequest) {
        this.relatedMaintenanceRequest = relatedMaintenanceRequest;
    }

    public Expense getRelatedExpense() {
        return relatedExpense;
    }

    public void setRelatedExpense(Expense relatedExpense) {
        this.relatedExpense = relatedExpense;
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

    public List<ProposalVoteEligibility> getEligibilities() {
        return eligibilities;
    }

    public void setEligibilities(List<ProposalVoteEligibility> eligibilities) {
        this.eligibilities = eligibilities;
    }

    public List<ProposalVote> getVotes() {
        return votes;
    }

    public void setVotes(List<ProposalVote> votes) {
        this.votes = votes;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof VoteProposal that)) return false;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
