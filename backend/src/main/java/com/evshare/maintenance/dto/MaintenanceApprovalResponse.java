package com.evshare.maintenance.dto;

import com.evshare.maintenance.entity.MaintenanceStatus;
import com.evshare.maintenance.entity.VoteDecision;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class MaintenanceApprovalResponse {

    private UUID maintenanceRequestId;
    private UUID vehicleId;
    private MaintenanceStatus status;
    private BigDecimal approveWeight;
    private BigDecimal rejectWeight;
    private BigDecimal pendingWeight;
    private BigDecimal requiredThreshold;
    private VoteDecision currentUserVote;
    private BigDecimal currentUserWeight;
    private boolean eligibleToVote;
    private Instant approvedAt;
    private BigDecimal approvedWeight;
    private List<MaintenanceVoteSummaryDto> votes = new ArrayList<>();

    public MaintenanceApprovalResponse() {
    }

    public UUID getMaintenanceRequestId() {
        return maintenanceRequestId;
    }

    public void setMaintenanceRequestId(UUID maintenanceRequestId) {
        this.maintenanceRequestId = maintenanceRequestId;
    }

    public UUID getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(UUID vehicleId) {
        this.vehicleId = vehicleId;
    }

    public MaintenanceStatus getStatus() {
        return status;
    }

    public void setStatus(MaintenanceStatus status) {
        this.status = status;
    }

    public BigDecimal getApproveWeight() {
        return approveWeight;
    }

    public void setApproveWeight(BigDecimal approveWeight) {
        this.approveWeight = approveWeight;
    }

    public BigDecimal getRejectWeight() {
        return rejectWeight;
    }

    public void setRejectWeight(BigDecimal rejectWeight) {
        this.rejectWeight = rejectWeight;
    }

    public BigDecimal getPendingWeight() {
        return pendingWeight;
    }

    public void setPendingWeight(BigDecimal pendingWeight) {
        this.pendingWeight = pendingWeight;
    }

    public BigDecimal getRequiredThreshold() {
        return requiredThreshold;
    }

    public void setRequiredThreshold(BigDecimal requiredThreshold) {
        this.requiredThreshold = requiredThreshold;
    }

    public VoteDecision getCurrentUserVote() {
        return currentUserVote;
    }

    public void setCurrentUserVote(VoteDecision currentUserVote) {
        this.currentUserVote = currentUserVote;
    }

    public BigDecimal getCurrentUserWeight() {
        return currentUserWeight;
    }

    public void setCurrentUserWeight(BigDecimal currentUserWeight) {
        this.currentUserWeight = currentUserWeight;
    }

    public boolean isEligibleToVote() {
        return eligibleToVote;
    }

    public void setEligibleToVote(boolean eligibleToVote) {
        this.eligibleToVote = eligibleToVote;
    }

    public Instant getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(Instant approvedAt) {
        this.approvedAt = approvedAt;
    }

    public BigDecimal getApprovedWeight() {
        return approvedWeight;
    }

    public void setApprovedWeight(BigDecimal approvedWeight) {
        this.approvedWeight = approvedWeight;
    }

    public List<MaintenanceVoteSummaryDto> getVotes() {
        return votes;
    }

    public void setVotes(List<MaintenanceVoteSummaryDto> votes) {
        this.votes = votes;
    }
}
