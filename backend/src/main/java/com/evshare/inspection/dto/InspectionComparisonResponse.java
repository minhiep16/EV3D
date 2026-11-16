package com.evshare.inspection.dto;

import com.evshare.inspection.entity.InspectionItemCondition;
import com.evshare.inspection.entity.InspectionOverallResult;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class InspectionComparisonResponse {

    private UUID preInspectionId;
    private UUID postInspectionId;
    private UUID vehicleId;
    private UUID tripId;
    private Instant preInspectedAt;
    private Instant postInspectedAt;
    private InspectionOverallResult preOverallResult;
    private InspectionOverallResult postOverallResult;
    private int totalNewDamages;
    private boolean cleanPass;
    private List<ComparisonItem> items = new ArrayList<>();

    public InspectionComparisonResponse() {
    }

    public static class ComparisonItem {
        private String vehiclePartCode;
        private InspectionItemCondition preCondition;
        private InspectionItemCondition postCondition;
        private String status; // UNCHANGED, NEW_DAMAGE, EXISTING_DAMAGE, WORSENED, REPAIRED
        private String preNote;
        private String postNote;

        public ComparisonItem() {
        }

        public ComparisonItem(String vehiclePartCode, InspectionItemCondition preCondition,
                              InspectionItemCondition postCondition, String status,
                              String preNote, String postNote) {
            this.vehiclePartCode = vehiclePartCode;
            this.preCondition = preCondition;
            this.postCondition = postCondition;
            this.status = status;
            this.preNote = preNote;
            this.postNote = postNote;
        }

        public String getVehiclePartCode() {
            return vehiclePartCode;
        }

        public void setVehiclePartCode(String vehiclePartCode) {
            this.vehiclePartCode = vehiclePartCode;
        }

        public InspectionItemCondition getPreCondition() {
            return preCondition;
        }

        public void setPreCondition(InspectionItemCondition preCondition) {
            this.preCondition = preCondition;
        }

        public InspectionItemCondition getPostCondition() {
            return postCondition;
        }

        public void setPostCondition(InspectionItemCondition postCondition) {
            this.postCondition = postCondition;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getPreNote() {
            return preNote;
        }

        public void setPreNote(String preNote) {
            this.preNote = preNote;
        }

        public String getPostNote() {
            return postNote;
        }

        public void setPostNote(String postNote) {
            this.postNote = postNote;
        }
    }

    public UUID getPreInspectionId() {
        return preInspectionId;
    }

    public void setPreInspectionId(UUID preInspectionId) {
        this.preInspectionId = preInspectionId;
    }

    public UUID getPostInspectionId() {
        return postInspectionId;
    }

    public void setPostInspectionId(UUID postInspectionId) {
        this.postInspectionId = postInspectionId;
    }

    public UUID getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(UUID vehicleId) {
        this.vehicleId = vehicleId;
    }

    public UUID getTripId() {
        return tripId;
    }

    public void setTripId(UUID tripId) {
        this.tripId = tripId;
    }

    public Instant getPreInspectedAt() {
        return preInspectedAt;
    }

    public void setPreInspectedAt(Instant preInspectedAt) {
        this.preInspectedAt = preInspectedAt;
    }

    public Instant getPostInspectedAt() {
        return postInspectedAt;
    }

    public void setPostInspectedAt(Instant postInspectedAt) {
        this.postInspectedAt = postInspectedAt;
    }

    public InspectionOverallResult getPreOverallResult() {
        return preOverallResult;
    }

    public void setPreOverallResult(InspectionOverallResult preOverallResult) {
        this.preOverallResult = preOverallResult;
    }

    public InspectionOverallResult getPostOverallResult() {
        return postOverallResult;
    }

    public void setPostOverallResult(InspectionOverallResult postOverallResult) {
        this.postOverallResult = postOverallResult;
    }

    public int getTotalNewDamages() {
        return totalNewDamages;
    }

    public void setTotalNewDamages(int totalNewDamages) {
        this.totalNewDamages = totalNewDamages;
    }

    public boolean isCleanPass() {
        return cleanPass;
    }

    public void setCleanPass(boolean cleanPass) {
        this.cleanPass = cleanPass;
    }

    public List<ComparisonItem> getItems() {
        return items;
    }

    public void setItems(List<ComparisonItem> items) {
        this.items = items;
    }
}
