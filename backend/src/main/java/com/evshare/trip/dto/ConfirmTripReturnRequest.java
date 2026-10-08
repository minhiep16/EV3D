package com.evshare.trip.dto;

import java.math.BigDecimal;

public class ConfirmTripReturnRequest {

    private Integer endBatteryLevel;
    private BigDecimal endOdometer;
    private String conditionNote;
    private String evidenceUrl;
    private Boolean damageObserved;

    public ConfirmTripReturnRequest() {
    }

    public ConfirmTripReturnRequest(
            Integer endBatteryLevel,
            BigDecimal endOdometer,
            String conditionNote,
            String evidenceUrl,
            Boolean damageObserved
    ) {
        this.endBatteryLevel = endBatteryLevel;
        this.endOdometer = endOdometer;
        this.conditionNote = conditionNote;
        this.evidenceUrl = evidenceUrl;
        this.damageObserved = damageObserved;
    }

    public Integer getEndBatteryLevel() {
        return endBatteryLevel;
    }

    public void setEndBatteryLevel(Integer endBatteryLevel) {
        this.endBatteryLevel = endBatteryLevel;
    }

    public BigDecimal getEndOdometer() {
        return endOdometer;
    }

    public void setEndOdometer(BigDecimal endOdometer) {
        this.endOdometer = endOdometer;
    }

    public String getConditionNote() {
        return conditionNote;
    }

    public void setConditionNote(String conditionNote) {
        this.conditionNote = conditionNote;
    }

    public String getEvidenceUrl() {
        return evidenceUrl;
    }

    public void setEvidenceUrl(String evidenceUrl) {
        this.evidenceUrl = evidenceUrl;
    }

    public Boolean getDamageObserved() {
        return damageObserved;
    }

    public void setDamageObserved(Boolean damageObserved) {
        this.damageObserved = damageObserved;
    }
}
