package com.evshare.maintenance.dto;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public class CompleteMaintenanceRequest {

    @Size(max = 2000, message = "Ghi chú hoàn tất không được vượt quá 2000 ký tự")
    private String completionNote;

    private BigDecimal actualCost;
    private String performedWork;
    private String replacedParts;
    private BigDecimal finalOdometer;
    private String evidenceUrl;
    private String inspectionResult; // PASSED, FAILED, REQUIRES_REWORK
    private Boolean useSharedFund;
    private BigDecimal sharedFundDisburseAmount;
    private java.util.List<java.util.UUID> resolvedDamageIds;

    public CompleteMaintenanceRequest() {
    }

    public CompleteMaintenanceRequest(String completionNote) {
        this.completionNote = completionNote;
    }

    public java.util.List<java.util.UUID> getResolvedDamageIds() {
        return resolvedDamageIds;
    }

    public void setResolvedDamageIds(java.util.List<java.util.UUID> resolvedDamageIds) {
        this.resolvedDamageIds = resolvedDamageIds;
    }

    public String getCompletionNote() {
        return completionNote;
    }

    public void setCompletionNote(String completionNote) {
        this.completionNote = completionNote;
    }

    public BigDecimal getActualCost() {
        return actualCost;
    }

    public void setActualCost(BigDecimal actualCost) {
        this.actualCost = actualCost;
    }

    public String getPerformedWork() {
        return performedWork;
    }

    public void setPerformedWork(String performedWork) {
        this.performedWork = performedWork;
    }

    public String getReplacedParts() {
        return replacedParts;
    }

    public void setReplacedParts(String replacedParts) {
        this.replacedParts = replacedParts;
    }

    public BigDecimal getFinalOdometer() {
        return finalOdometer;
    }

    public void setFinalOdometer(BigDecimal finalOdometer) {
        this.finalOdometer = finalOdometer;
    }

    public String getEvidenceUrl() {
        return evidenceUrl;
    }

    public void setEvidenceUrl(String evidenceUrl) {
        this.evidenceUrl = evidenceUrl;
    }

    public String getInspectionResult() {
        return inspectionResult;
    }

    public void setInspectionResult(String inspectionResult) {
        this.inspectionResult = inspectionResult;
    }

    public Boolean getUseSharedFund() {
        return useSharedFund;
    }

    public void setUseSharedFund(Boolean useSharedFund) {
        this.useSharedFund = useSharedFund;
    }

    public BigDecimal getSharedFundDisburseAmount() {
        return sharedFundDisburseAmount;
    }

    public void setSharedFundDisburseAmount(BigDecimal sharedFundDisburseAmount) {
        this.sharedFundDisburseAmount = sharedFundDisburseAmount;
    }
}
