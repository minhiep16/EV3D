package com.evshare.ownership.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class OwnershipDistributionPreviewResponse {

    public record MemberSharePreview(
            UUID userId,
            String fullName,
            String email,
            String role,
            BigDecimal currentPercentage,
            BigDecimal proposedPercentage,
            BigDecimal deltaPercentage
    ) {}

    private List<MemberSharePreview> members;
    private BigDecimal transferPercentage;
    private UUID fromUserId;
    private String fromUserName;
    private UUID toUserId;
    private String toUserName;
    private boolean valid;
    private String validationMessage;
    private boolean hasOutstandingFinancialObligations;
    private String financialObligationMessage;
    private String contractVersionFormatted;
    private String contentSnapshot;
    private String contentHash;

    public OwnershipDistributionPreviewResponse() {
    }

    public OwnershipDistributionPreviewResponse(
            List<MemberSharePreview> members,
            BigDecimal transferPercentage,
            UUID fromUserId,
            String fromUserName,
            UUID toUserId,
            String toUserName,
            boolean valid,
            String validationMessage,
            boolean hasOutstandingFinancialObligations,
            String financialObligationMessage
    ) {
        this(members, transferPercentage, fromUserId, fromUserName, toUserId, toUserName, valid, validationMessage, hasOutstandingFinancialObligations, financialObligationMessage, null, null, null);
    }

    public OwnershipDistributionPreviewResponse(
            List<MemberSharePreview> members,
            BigDecimal transferPercentage,
            UUID fromUserId,
            String fromUserName,
            UUID toUserId,
            String toUserName,
            boolean valid,
            String validationMessage,
            boolean hasOutstandingFinancialObligations,
            String financialObligationMessage,
            String contractVersionFormatted,
            String contentSnapshot,
            String contentHash
    ) {
        this.members = members;
        this.transferPercentage = transferPercentage;
        this.fromUserId = fromUserId;
        this.fromUserName = fromUserName;
        this.toUserId = toUserId;
        this.toUserName = toUserName;
        this.valid = valid;
        this.validationMessage = validationMessage;
        this.hasOutstandingFinancialObligations = hasOutstandingFinancialObligations;
        this.financialObligationMessage = financialObligationMessage;
        this.contractVersionFormatted = contractVersionFormatted;
        this.contentSnapshot = contentSnapshot;
        this.contentHash = contentHash;
    }

    public List<MemberSharePreview> getMembers() {
        return members;
    }

    public void setMembers(List<MemberSharePreview> members) {
        this.members = members;
    }

    public BigDecimal getTransferPercentage() {
        return transferPercentage;
    }

    public void setTransferPercentage(BigDecimal transferPercentage) {
        this.transferPercentage = transferPercentage;
    }

    public UUID getFromUserId() {
        return fromUserId;
    }

    public void setFromUserId(UUID fromUserId) {
        this.fromUserId = fromUserId;
    }

    public String getFromUserName() {
        return fromUserName;
    }

    public void setFromUserName(String fromUserName) {
        this.fromUserName = fromUserName;
    }

    public UUID getToUserId() {
        return toUserId;
    }

    public void setToUserId(UUID toUserId) {
        this.toUserId = toUserId;
    }

    public String getToUserName() {
        return toUserName;
    }

    public void setToUserName(String toUserName) {
        this.toUserName = toUserName;
    }

    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }

    public String getValidationMessage() {
        return validationMessage;
    }

    public void setValidationMessage(String validationMessage) {
        this.validationMessage = validationMessage;
    }

    public boolean isHasOutstandingFinancialObligations() {
        return hasOutstandingFinancialObligations;
    }

    public void setHasOutstandingFinancialObligations(boolean hasOutstandingFinancialObligations) {
        this.hasOutstandingFinancialObligations = hasOutstandingFinancialObligations;
    }

    public String getFinancialObligationMessage() {
        return financialObligationMessage;
    }

    public void setFinancialObligationMessage(String financialObligationMessage) {
        this.financialObligationMessage = financialObligationMessage;
    }

    public String getContractVersionFormatted() {
        return contractVersionFormatted;
    }

    public void setContractVersionFormatted(String contractVersionFormatted) {
        this.contractVersionFormatted = contractVersionFormatted;
    }

    public String getContentSnapshot() {
        return contentSnapshot;
    }

    public void setContentSnapshot(String contentSnapshot) {
        this.contentSnapshot = contentSnapshot;
    }

    public String getContentHash() {
        return contentHash;
    }

    public void setContentHash(String contentHash) {
        this.contentHash = contentHash;
    }
}
