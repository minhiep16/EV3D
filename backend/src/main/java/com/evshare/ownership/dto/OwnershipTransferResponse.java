package com.evshare.ownership.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.evshare.ownership.entity.OwnershipTransferRequest;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class OwnershipTransferResponse {

    private UUID id;
    private UUID groupId;
    private String groupName;
    private UUID vehicleId;
    private String vehicleName;
    private String vehicleCode;
    private UUID fromUserId;
    private String fromUserName;
    private String fromUserEmail;
    private UUID toUserId;
    private String toUserName;
    private String toUserEmail;
    private BigDecimal transferPercentage;
    private String status;
    private String statusVi;
    private String reason;
    private String rejectionReason;
    private UUID contractVersionId;
    private String contractVersionFormatted;
    private UUID relatedProposalId;
    private String contractCode;
    private Instant createdAt;
    private Instant acceptedAt;
    private Instant approvedAt;
    private Instant completedAt;
    private Instant rejectedAt;
    private Instant cancelledAt;
    private Instant effectiveAt;
    private BigDecimal fromUserCurrentPercentage;
    private BigDecimal toUserCurrentPercentage;
    private boolean canAccept;
    private boolean canReject;
    private boolean canCancel;
    private boolean canComplete;
    private String contractVersionTitle;
    private String contentSnapshot;
    private String contentHash;
    private String proposedOwnershipSnapshot;
    private boolean isRecipientAccepted;
    private boolean isTransferorAccepted;
    private int acceptedMembersCount;
    private int totalMembersCount;
    private String consentPolicy;
    private String consentPolicyLabel;
    private int requiredAcceptanceCount;
    private int currentAcceptanceCount;
    private String additionalApprovalStatus;
    private String notificationMessage;
    private boolean isInternalTransfer;
    private List<TransferPartyDto> parties = new ArrayList<>();
    private boolean currentUserAccepted;
    private boolean currentUserCanAccept;
    private List<String> nextRequiredActions = new ArrayList<>();

    public OwnershipTransferResponse() {
    }

    public static OwnershipTransferResponse fromEntity(OwnershipTransferRequest entity, UUID currentUserId) {
        OwnershipTransferResponse resp = new OwnershipTransferResponse();
        resp.setId(entity.getId());
        if (entity.getGroup() != null) {
            resp.setGroupId(entity.getGroup().getId());
            resp.setGroupName(entity.getGroup().getName());
        }
        if (entity.getVehicle() != null) {
            resp.setVehicleId(entity.getVehicle().getId());
            resp.setVehicleName(entity.getVehicle().getName());
            resp.setVehicleCode("EV01");
        }
        if (entity.getFromUser() != null) {
            resp.setFromUserId(entity.getFromUser().getId());
            resp.setFromUserName(entity.getFromUser().getFullName());
            resp.setFromUserEmail(entity.getFromUser().getEmail());
        }
        if (entity.getToUser() != null) {
            resp.setToUserId(entity.getToUser().getId());
            resp.setToUserName(entity.getToUser().getFullName());
            resp.setToUserEmail(entity.getToUser().getEmail());
        }
        resp.setTransferPercentage(entity.getTransferPercentage());
        if (entity.getStatus() != null) {
            resp.setStatus(entity.getStatus().name());
            resp.setStatusVi(entity.getStatus().getVietnameseLabel());
        }
        resp.setReason(entity.getReason());
        resp.setRejectionReason(entity.getRejectionReason());
        if (entity.getContractVersion() != null) {
            resp.setContractVersionId(entity.getContractVersion().getId());
            resp.setContractVersionFormatted(entity.getContractVersion().getVersionNumberFormatted());
            resp.setContractVersionTitle(entity.getContractVersion().getTitle());
            resp.setContentSnapshot(entity.getContractVersion().getContentSnapshot());
            resp.setContentHash(entity.getContractVersion().getContentHash());
            resp.setProposedOwnershipSnapshot(entity.getContractVersion().getOwnershipSnapshot());
            if (entity.getContractVersion().getContract() != null) {
                resp.setContractCode(entity.getContractVersion().getContract().getContractCode());
            }
        }
        resp.setRelatedProposalId(entity.getRelatedProposalId());
        resp.setCreatedAt(entity.getCreatedAt());
        resp.setAcceptedAt(entity.getAcceptedAt());
        resp.setApprovedAt(entity.getApprovedAt());
        resp.setCompletedAt(entity.getCompletedAt());
        resp.setRejectedAt(entity.getRejectedAt());
        resp.setCancelledAt(entity.getCancelledAt());
        resp.setEffectiveAt(entity.getEffectiveAt());

        if (currentUserId != null) {
            boolean isRecipient = currentUserId.equals(resp.getToUserId());
            boolean isTransferor = currentUserId.equals(resp.getFromUserId());
            String st = resp.getStatus();
            boolean isPending = ("PENDING_ACCEPTANCE".equals(st) || "PENDING_CONTRACT".equals(st));
            boolean canAct = isPending && ((isRecipient && !resp.isRecipientAccepted()) || (isTransferor && !resp.isTransferorAccepted()));
            resp.setCanAccept(canAct);
            resp.setCanReject(isRecipient && !resp.isRecipientAccepted() && isPending);
            resp.setCanCancel(isTransferor && isPending);
            resp.setCanComplete("PENDING_CONTRACT".equals(st) || "APPROVED".equals(st));
            resp.setCurrentUserAccepted(isTransferor ? resp.isTransferorAccepted() : (isRecipient ? resp.isRecipientAccepted() : false));
            resp.setCurrentUserCanAccept(canAct);
        }

        return resp;
    }

    @JsonProperty("transferRequestId")
    public UUID getTransferRequestId() {
        return id;
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

    public UUID getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(UUID vehicleId) {
        this.vehicleId = vehicleId;
    }

    public String getVehicleName() {
        return vehicleName;
    }

    public void setVehicleName(String vehicleName) {
        this.vehicleName = vehicleName;
    }

    public String getVehicleCode() {
        return vehicleCode;
    }

    public void setVehicleCode(String vehicleCode) {
        this.vehicleCode = vehicleCode;
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

    public String getFromUserEmail() {
        return fromUserEmail;
    }

    public void setFromUserEmail(String fromUserEmail) {
        this.fromUserEmail = fromUserEmail;
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

    public String getToUserEmail() {
        return toUserEmail;
    }

    public void setToUserEmail(String toUserEmail) {
        this.toUserEmail = toUserEmail;
    }

    public BigDecimal getTransferPercentage() {
        return transferPercentage;
    }

    public void setTransferPercentage(BigDecimal transferPercentage) {
        this.transferPercentage = transferPercentage;
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

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public UUID getContractVersionId() {
        return contractVersionId;
    }

    public void setContractVersionId(UUID contractVersionId) {
        this.contractVersionId = contractVersionId;
    }

    public String getContractVersionFormatted() {
        return contractVersionFormatted;
    }

    public void setContractVersionFormatted(String contractVersionFormatted) {
        this.contractVersionFormatted = contractVersionFormatted;
    }

    public UUID getRelatedProposalId() {
        return relatedProposalId;
    }

    public void setRelatedProposalId(UUID relatedProposalId) {
        this.relatedProposalId = relatedProposalId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(Instant acceptedAt) {
        this.acceptedAt = acceptedAt;
    }

    public Instant getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(Instant approvedAt) {
        this.approvedAt = approvedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }

    public Instant getRejectedAt() {
        return rejectedAt;
    }

    public void setRejectedAt(Instant rejectedAt) {
        this.rejectedAt = rejectedAt;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(Instant cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public Instant getEffectiveAt() {
        return effectiveAt;
    }

    public void setEffectiveAt(Instant effectiveAt) {
        this.effectiveAt = effectiveAt;
    }

    public BigDecimal getFromUserCurrentPercentage() {
        return fromUserCurrentPercentage;
    }

    public void setFromUserCurrentPercentage(BigDecimal fromUserCurrentPercentage) {
        this.fromUserCurrentPercentage = fromUserCurrentPercentage;
    }

    public BigDecimal getToUserCurrentPercentage() {
        return toUserCurrentPercentage;
    }

    public void setToUserCurrentPercentage(BigDecimal toUserCurrentPercentage) {
        this.toUserCurrentPercentage = toUserCurrentPercentage;
    }

    public boolean isCanAccept() {
        return canAccept;
    }

    public void setCanAccept(boolean canAccept) {
        this.canAccept = canAccept;
    }

    public boolean isCanReject() {
        return canReject;
    }

    public void setCanReject(boolean canReject) {
        this.canReject = canReject;
    }

    public boolean isCanCancel() {
        return canCancel;
    }

    public void setCanCancel(boolean canCancel) {
        this.canCancel = canCancel;
    }

    public boolean isCanComplete() {
        return canComplete;
    }

    public void setCanComplete(boolean canComplete) {
        this.canComplete = canComplete;
    }

    public String getContractVersionTitle() {
        return contractVersionTitle;
    }

    public void setContractVersionTitle(String contractVersionTitle) {
        this.contractVersionTitle = contractVersionTitle;
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

    public String getProposedOwnershipSnapshot() {
        return proposedOwnershipSnapshot;
    }

    public void setProposedOwnershipSnapshot(String proposedOwnershipSnapshot) {
        this.proposedOwnershipSnapshot = proposedOwnershipSnapshot;
    }

    @JsonProperty("recipientAccepted")
    public boolean isRecipientAccepted() {
        return isRecipientAccepted;
    }

    @JsonProperty("isRecipientAccepted")
    public boolean getIsRecipientAccepted() {
        return isRecipientAccepted;
    }

    public void setRecipientAccepted(boolean recipientAccepted) {
        this.isRecipientAccepted = recipientAccepted;
    }

    @JsonProperty("transferorAccepted")
    public boolean isTransferorAccepted() {
        return isTransferorAccepted;
    }

    @JsonProperty("isTransferorAccepted")
    public boolean getIsTransferorAccepted() {
        return isTransferorAccepted;
    }

    public void setTransferorAccepted(boolean transferorAccepted) {
        this.isTransferorAccepted = transferorAccepted;
    }

    @JsonProperty("acceptedMembersCount")
    public int getAcceptedMembersCount() {
        return acceptedMembersCount;
    }

    @JsonProperty("acceptedConsentCount")
    public int getAcceptedConsentCount() {
        return acceptedMembersCount;
    }

    public void setAcceptedMembersCount(int acceptedMembersCount) {
        this.acceptedMembersCount = acceptedMembersCount;
    }

    public void setAcceptedConsentCount(int count) {
        this.acceptedMembersCount = count;
    }

    public int getTotalMembersCount() {
        return totalMembersCount;
    }

    public void setTotalMembersCount(int totalMembersCount) {
        this.totalMembersCount = totalMembersCount;
    }

    public String getContractCode() {
        return contractCode;
    }

    public void setContractCode(String contractCode) {
        this.contractCode = contractCode;
    }

    public String getConsentPolicy() {
        return consentPolicy;
    }

    public void setConsentPolicy(String consentPolicy) {
        this.consentPolicy = consentPolicy;
    }

    public String getConsentPolicyLabel() {
        return consentPolicyLabel;
    }

    public void setConsentPolicyLabel(String consentPolicyLabel) {
        this.consentPolicyLabel = consentPolicyLabel;
    }

    @JsonProperty("requiredAcceptanceCount")
    public int getRequiredAcceptanceCount() {
        return requiredAcceptanceCount;
    }

    @JsonProperty("requiredConsentCount")
    public int getRequiredConsentCount() {
        return requiredAcceptanceCount;
    }

    public void setRequiredAcceptanceCount(int requiredAcceptanceCount) {
        this.requiredAcceptanceCount = requiredAcceptanceCount;
    }

    public void setRequiredConsentCount(int count) {
        this.requiredAcceptanceCount = count;
    }

    public int getCurrentAcceptanceCount() {
        return currentAcceptanceCount;
    }

    public void setCurrentAcceptanceCount(int currentAcceptanceCount) {
        this.currentAcceptanceCount = currentAcceptanceCount;
    }

    public String getAdditionalApprovalStatus() {
        return additionalApprovalStatus;
    }

    public void setAdditionalApprovalStatus(String additionalApprovalStatus) {
        this.additionalApprovalStatus = additionalApprovalStatus;
    }

    public String getNotificationMessage() {
        return notificationMessage;
    }

    public void setNotificationMessage(String notificationMessage) {
        this.notificationMessage = notificationMessage;
    }

    public boolean isInternalTransfer() {
        return isInternalTransfer;
    }

    public void setInternalTransfer(boolean internalTransfer) {
        isInternalTransfer = internalTransfer;
    }

    @JsonProperty("canFinalize")
    public boolean isCanFinalize() {
        return canComplete;
    }

    public void setCanFinalize(boolean canFinalize) {
        this.canComplete = canFinalize;
    }

    private String acceptanceStatus;

    @JsonProperty("acceptanceStatus")
    public String getAcceptanceStatus() {
        return acceptanceStatus != null ? acceptanceStatus : statusVi;
    }

    public void setAcceptanceStatus(String acceptanceStatus) {
        this.acceptanceStatus = acceptanceStatus;
    }

    private List<String> finalizationBlockers = new ArrayList<>();

    @JsonProperty("finalizationBlockers")
    public List<String> getFinalizationBlockers() {
        return finalizationBlockers;
    }

    public void setFinalizationBlockers(List<String> finalizationBlockers) {
        this.finalizationBlockers = finalizationBlockers;
    }

    @JsonProperty("requiredParties")
    public List<TransferPartyDto> getRequiredParties() {
        return parties;
    }

    public List<TransferPartyDto> getParties() {
        return parties;
    }

    public void setParties(List<TransferPartyDto> parties) {
        this.parties = parties;
    }

    @JsonProperty("transferorUserId")
    public UUID getTransferorUserId() {
        return fromUserId;
    }

    @JsonProperty("recipientUserId")
    public UUID getRecipientUserId() {
        return toUserId;
    }

    @JsonProperty("appendixAvailable")
    public boolean isAppendixAvailable() {
        return contentSnapshot != null && !contentSnapshot.isBlank();
    }

    @JsonProperty("appendixHash")
    public String getAppendixHash() {
        return contentHash;
    }

    @JsonProperty("currentUserAccepted")
    public boolean isCurrentUserAccepted() {
        return currentUserAccepted;
    }

    @JsonProperty("isCurrentUserAccepted")
    public boolean getIsCurrentUserAccepted() {
        return currentUserAccepted;
    }

    public void setCurrentUserAccepted(boolean currentUserAccepted) {
        this.currentUserAccepted = currentUserAccepted;
    }

    @JsonProperty("currentUserCanAccept")
    public boolean isCurrentUserCanAccept() {
        return currentUserCanAccept;
    }

    @JsonProperty("isCurrentUserCanAccept")
    public boolean getIsCurrentUserCanAccept() {
        return currentUserCanAccept;
    }

    public void setCurrentUserCanAccept(boolean currentUserCanAccept) {
        this.currentUserCanAccept = currentUserCanAccept;
    }

    @JsonProperty("nextRequiredActions")
    public List<String> getNextRequiredActions() {
        return nextRequiredActions;
    }

    public void setNextRequiredActions(List<String> nextRequiredActions) {
        this.nextRequiredActions = nextRequiredActions;
    }
}
