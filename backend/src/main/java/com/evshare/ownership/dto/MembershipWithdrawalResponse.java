package com.evshare.ownership.dto;

import com.evshare.ownership.entity.MembershipWithdrawalRequest;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class MembershipWithdrawalResponse {

    private UUID id;
    private UUID groupId;
    private String groupName;
    private UUID memberId;
    private UUID userId;
    private String userName;
    private String userEmail;
    private BigDecimal currentOwnershipPercentage;
    private String reason;
    private String status;
    private String statusVi;
    private String rejectionReason;
    private Instant createdAt;
    private Instant reviewedAt;
    private String reviewedByUserName;
    private boolean hasOutstandingObligations;
    private String outstandingObligationsMessage;

    public MembershipWithdrawalResponse() {
    }

    public static MembershipWithdrawalResponse fromEntity(MembershipWithdrawalRequest entity) {
        MembershipWithdrawalResponse resp = new MembershipWithdrawalResponse();
        resp.setId(entity.getId());
        if (entity.getGroup() != null) {
            resp.setGroupId(entity.getGroup().getId());
            resp.setGroupName(entity.getGroup().getName());
        }
        if (entity.getMember() != null) {
            resp.setMemberId(entity.getMember().getId());
        }
        if (entity.getUser() != null) {
            resp.setUserId(entity.getUser().getId());
            resp.setUserName(entity.getUser().getFullName());
            resp.setUserEmail(entity.getUser().getEmail());
        }
        resp.setReason(entity.getReason());
        if (entity.getStatus() != null) {
            resp.setStatus(entity.getStatus().name());
            resp.setStatusVi(entity.getStatus().getVietnameseLabel());
        }
        resp.setRejectionReason(entity.getRejectionReason());
        resp.setCreatedAt(entity.getCreatedAt());
        resp.setReviewedAt(entity.getReviewedAt());
        if (entity.getReviewedByUser() != null) {
            resp.setReviewedByUserName(entity.getReviewedByUser().getFullName());
        }
        return resp;
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

    public String getGroupName() {
        return groupName;
    }

    public void setGroupName(String groupName) {
        this.groupName = groupName;
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

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public BigDecimal getCurrentOwnershipPercentage() {
        return currentOwnershipPercentage;
    }

    public void setCurrentOwnershipPercentage(BigDecimal currentOwnershipPercentage) {
        this.currentOwnershipPercentage = currentOwnershipPercentage;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getStatusVi() {
        return statusVi;
    }

    public void setStatusVi(String statusVi) {
        this.statusVi = statusVi;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(Instant reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public String getReviewedByUserName() {
        return reviewedByUserName;
    }

    public void setReviewedByUserName(String reviewedByUserName) {
        this.reviewedByUserName = reviewedByUserName;
    }

    public boolean isHasOutstandingObligations() {
        return hasOutstandingObligations;
    }

    public void setHasOutstandingObligations(boolean hasOutstandingObligations) {
        this.hasOutstandingObligations = hasOutstandingObligations;
    }

    public String getOutstandingObligationsMessage() {
        return outstandingObligationsMessage;
    }

    public void setOutstandingObligationsMessage(String outstandingObligationsMessage) {
        this.outstandingObligationsMessage = outstandingObligationsMessage;
    }
}
