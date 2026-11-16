package com.evshare.ownership.dto;

import com.evshare.ownership.entity.MembershipInvitation;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class MembershipInvitationResponse {

    private UUID id;
    private UUID groupId;
    private String groupName;
    private UUID vehicleId;
    private String vehicleName;
    private String vehicleCode;
    private String licensePlate;

    private UUID invitedByUserId;
    private String invitedByUserName;
    private String inviteeEmail;
    private UUID inviteeUserId;
    private String inviteeUserName;

    private BigDecimal proposedPercentage;
    private BigDecimal leaderTransferPercentage;
    private BigDecimal totalOfferedPercentage;
    private List<ContributorShareContributionDto> additionalContributions = new ArrayList<>();
    private List<Map<String, Object>> signatures = new ArrayList<>();

    private UUID contractVersionId;
    private UUID contractId;
    private String contractTitle;
    private String contractContent;
    private String documentHash;
    private Integer contractVersionNumber;

    private String status;
    private String statusVi;
    private String invitationNote;
    private String rejectionReason;

    private Instant createdAt;
    private Instant acceptedAt;
    private Instant completedAt;
    private Instant rejectedAt;
    private Instant cancelledAt;
    private Instant expiresAt;

    // Action permissions
    private boolean canConsent;
    private boolean canAccept;
    private boolean canReject;
    private boolean canCancel;
    private boolean canSign;
    private boolean canFinalize;

    // Vehicle review data for prospective member
    private BigDecimal currentSocPercent;
    private BigDecimal odometerKm;
    private Integer damageCount;
    private BigDecimal batteryCapacityKwh;
    private Integer manufactureYear;
    private String vehicleModel;
    private String exteriorColor;

    // Projected leader
    private String currentLeaderName;
    private String projectedLeaderName;
    private List<MemberSharePreviewDto> currentDistribution = new ArrayList<>();
    private List<MemberSharePreviewDto> projectedDistribution = new ArrayList<>();

    // Authoritative Required Signatories & Progress
    private List<InvitationSignatoryResponse> requiredSignatories = new ArrayList<>();
    private int signedCount;
    private int requiredSignaturesCount;
    private List<String> pendingSignerNames = new ArrayList<>();
    private boolean isCurrentUserRequiredSigner;
    private boolean hasCurrentUserSigned;

    public MembershipInvitationResponse() {
    }

    public static MembershipInvitationResponse fromEntity(MembershipInvitation entity) {
        MembershipInvitationResponse resp = new MembershipInvitationResponse();
        resp.setId(entity.getId());
        if (entity.getGroup() != null) {
            resp.setGroupId(entity.getGroup().getId());
            resp.setGroupName(entity.getGroup().getName());
        }
        if (entity.getVehicle() != null) {
            resp.setVehicleId(entity.getVehicle().getId());
            resp.setVehicleName(entity.getVehicle().getName());
            resp.setVehicleCode(entity.getVehicle().getVehicleCode());
            resp.setLicensePlate(entity.getVehicle().getLicensePlate());
            resp.setVehicleModel(entity.getVehicle().getModel());
            resp.setExteriorColor(entity.getVehicle().getExteriorColor());
            resp.setCurrentSocPercent(entity.getVehicle().getCurrentBatteryLevel() != null ? BigDecimal.valueOf(entity.getVehicle().getCurrentBatteryLevel()) : null);
            resp.setOdometerKm(entity.getVehicle().getOdometer());
            resp.setBatteryCapacityKwh(entity.getVehicle().getBatteryCapacity());
            resp.setManufactureYear(entity.getVehicle().getYear());
        }
        if (entity.getInvitedByUser() != null) {
            resp.setInvitedByUserId(entity.getInvitedByUser().getId());
            resp.setInvitedByUserName(entity.getInvitedByUser().getFullName());
        }
        resp.setInviteeEmail(entity.getInviteeEmail());
        if (entity.getInviteeUser() != null) {
            resp.setInviteeUserId(entity.getInviteeUser().getId());
            resp.setInviteeUserName(entity.getInviteeUser().getFullName());
        }
        resp.setProposedPercentage(entity.getProposedPercentage());
        resp.setLeaderTransferPercentage(entity.getLeaderTransferPercentage() != null ? entity.getLeaderTransferPercentage() : entity.getProposedPercentage());
        resp.setTotalOfferedPercentage(entity.getTotalOfferedPercentage() != null && entity.getTotalOfferedPercentage().compareTo(BigDecimal.ZERO) > 0
                ? entity.getTotalOfferedPercentage()
                : entity.getProposedPercentage());

        resp.setContractVersionId(entity.getContractVersionId());
        resp.setContractId(entity.getContractId());
        resp.setRejectionReason(entity.getRejectionReason());

        if (entity.getStatus() != null) {
            resp.setStatus(entity.getStatus().name());
            resp.setStatusVi(entity.getStatus().getVietnameseLabel());
        }
        resp.setInvitationNote(entity.getInvitationNote());
        resp.setCreatedAt(entity.getCreatedAt());
        resp.setAcceptedAt(entity.getAcceptedAt());
        resp.setCompletedAt(entity.getCompletedAt());
        resp.setRejectedAt(entity.getRejectedAt());
        resp.setCancelledAt(entity.getCancelledAt());
        resp.setExpiresAt(entity.getExpiresAt());
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

    public String getLicensePlate() {
        return licensePlate;
    }

    public void setLicensePlate(String licensePlate) {
        this.licensePlate = licensePlate;
    }

    public UUID getInvitedByUserId() {
        return invitedByUserId;
    }

    public void setInvitedByUserId(UUID invitedByUserId) {
        this.invitedByUserId = invitedByUserId;
    }

    public String getInvitedByUserName() {
        return invitedByUserName;
    }

    public void setInvitedByUserName(String invitedByUserName) {
        this.invitedByUserName = invitedByUserName;
    }

    public String getInviteeEmail() {
        return inviteeEmail;
    }

    public void setInviteeEmail(String inviteeEmail) {
        this.inviteeEmail = inviteeEmail;
    }

    public UUID getInviteeUserId() {
        return inviteeUserId;
    }

    public void setInviteeUserId(UUID inviteeUserId) {
        this.inviteeUserId = inviteeUserId;
    }

    public String getInviteeUserName() {
        return inviteeUserName;
    }

    public void setInviteeUserName(String inviteeUserName) {
        this.inviteeUserName = inviteeUserName;
    }

    public BigDecimal getProposedPercentage() {
        return proposedPercentage;
    }

    public void setProposedPercentage(BigDecimal proposedPercentage) {
        this.proposedPercentage = proposedPercentage;
    }

    public BigDecimal getLeaderTransferPercentage() {
        return leaderTransferPercentage;
    }

    public void setLeaderTransferPercentage(BigDecimal leaderTransferPercentage) {
        this.leaderTransferPercentage = leaderTransferPercentage;
    }

    public BigDecimal getTotalOfferedPercentage() {
        return totalOfferedPercentage;
    }

    public void setTotalOfferedPercentage(BigDecimal totalOfferedPercentage) {
        this.totalOfferedPercentage = totalOfferedPercentage;
    }

    public List<ContributorShareContributionDto> getAdditionalContributions() {
        return additionalContributions;
    }

    public void setAdditionalContributions(List<ContributorShareContributionDto> additionalContributions) {
        this.additionalContributions = additionalContributions;
    }

    public List<Map<String, Object>> getSignatures() {
        return signatures;
    }

    public void setSignatures(List<Map<String, Object>> signatures) {
        this.signatures = signatures;
    }

    public UUID getContractVersionId() {
        return contractVersionId;
    }

    public void setContractVersionId(UUID contractVersionId) {
        this.contractVersionId = contractVersionId;
    }

    public UUID getContractId() {
        return contractId;
    }

    public void setContractId(UUID contractId) {
        this.contractId = contractId;
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

    public String getInvitationNote() {
        return invitationNote;
    }

    public void setInvitationNote(String invitationNote) {
        this.invitationNote = invitationNote;
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

    public Instant getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(Instant acceptedAt) {
        this.acceptedAt = acceptedAt;
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

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public boolean isCanConsent() {
        return canConsent;
    }

    public void setCanConsent(boolean canConsent) {
        this.canConsent = canConsent;
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

    public boolean isCanSign() {
        return canSign;
    }

    public void setCanSign(boolean canSign) {
        this.canSign = canSign;
    }

    public boolean isCanFinalize() {
        return canFinalize;
    }

    public void setCanFinalize(boolean canFinalize) {
        this.canFinalize = canFinalize;
    }

    public BigDecimal getCurrentSocPercent() {
        return currentSocPercent;
    }

    public void setCurrentSocPercent(BigDecimal currentSocPercent) {
        this.currentSocPercent = currentSocPercent;
    }

    public BigDecimal getOdometerKm() {
        return odometerKm;
    }

    public void setOdometerKm(BigDecimal odometerKm) {
        this.odometerKm = odometerKm;
    }

    public Integer getDamageCount() {
        return damageCount;
    }

    public void setDamageCount(Integer damageCount) {
        this.damageCount = damageCount;
    }

    public BigDecimal getBatteryCapacityKwh() {
        return batteryCapacityKwh;
    }

    public void setBatteryCapacityKwh(BigDecimal batteryCapacityKwh) {
        this.batteryCapacityKwh = batteryCapacityKwh;
    }

    public Integer getManufactureYear() {
        return manufactureYear;
    }

    public void setManufactureYear(Integer manufactureYear) {
        this.manufactureYear = manufactureYear;
    }

    public String getVehicleModel() {
        return vehicleModel;
    }

    public void setVehicleModel(String vehicleModel) {
        this.vehicleModel = vehicleModel;
    }

    public String getExteriorColor() {
        return exteriorColor;
    }

    public void setExteriorColor(String exteriorColor) {
        this.exteriorColor = exteriorColor;
    }

    public String getCurrentLeaderName() {
        return currentLeaderName;
    }

    public void setCurrentLeaderName(String currentLeaderName) {
        this.currentLeaderName = currentLeaderName;
    }

    public String getProjectedLeaderName() {
        return projectedLeaderName;
    }

    public void setProjectedLeaderName(String projectedLeaderName) {
        this.projectedLeaderName = projectedLeaderName;
    }

    public List<MemberSharePreviewDto> getCurrentDistribution() {
        return currentDistribution;
    }

    public void setCurrentDistribution(List<MemberSharePreviewDto> currentDistribution) {
        this.currentDistribution = currentDistribution;
    }

    public List<MemberSharePreviewDto> getProjectedDistribution() {
        return projectedDistribution;
    }

    public void setProjectedDistribution(List<MemberSharePreviewDto> projectedDistribution) {
        this.projectedDistribution = projectedDistribution;
    }

    public String getContractTitle() {
        return contractTitle;
    }

    public void setContractTitle(String contractTitle) {
        this.contractTitle = contractTitle;
    }

    public String getContractContent() {
        return contractContent;
    }

    public void setContractContent(String contractContent) {
        this.contractContent = contractContent;
    }

    public String getDocumentHash() {
        return documentHash;
    }

    public void setDocumentHash(String documentHash) {
        this.documentHash = documentHash;
    }

    public Integer getContractVersionNumber() {
        return contractVersionNumber;
    }

    public void setContractVersionNumber(Integer contractVersionNumber) {
        this.contractVersionNumber = contractVersionNumber;
    }

    public List<InvitationSignatoryResponse> getRequiredSignatories() {
        return requiredSignatories;
    }

    public void setRequiredSignatories(List<InvitationSignatoryResponse> requiredSignatories) {
        this.requiredSignatories = requiredSignatories;
    }

    public int getSignedCount() {
        return signedCount;
    }

    public void setSignedCount(int signedCount) {
        this.signedCount = signedCount;
    }

    public int getRequiredSignaturesCount() {
        return requiredSignaturesCount;
    }

    public void setRequiredSignaturesCount(int requiredSignaturesCount) {
        this.requiredSignaturesCount = requiredSignaturesCount;
    }

    public List<String> getPendingSignerNames() {
        return pendingSignerNames;
    }

    public void setPendingSignerNames(List<String> pendingSignerNames) {
        this.pendingSignerNames = pendingSignerNames;
    }

    public boolean isCurrentUserRequiredSigner() {
        return isCurrentUserRequiredSigner;
    }

    public void setCurrentUserRequiredSigner(boolean isCurrentUserRequiredSigner) {
        this.isCurrentUserRequiredSigner = isCurrentUserRequiredSigner;
    }

    public boolean isHasCurrentUserSigned() {
        return hasCurrentUserSigned;
    }

    public void setHasCurrentUserSigned(boolean hasCurrentUserSigned) {
        this.hasCurrentUserSigned = hasCurrentUserSigned;
    }
}
