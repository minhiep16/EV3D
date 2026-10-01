package com.evshare.inspection.dto;

import com.evshare.inspection.entity.InspectionOverallResult;
import jakarta.validation.constraints.Size;

public class CompleteInspectionRequest {

    private InspectionOverallResult overallResult;

    @Size(max = 1000, message = "Ghi chú tổng thể tối đa 1000 ký tự")
    private String summaryNote;

    public CompleteInspectionRequest() {
    }

    public CompleteInspectionRequest(InspectionOverallResult overallResult, String summaryNote) {
        this.overallResult = overallResult;
        this.summaryNote = summaryNote;
    }

    public InspectionOverallResult getOverallResult() {
        return overallResult;
    }

    public void setOverallResult(InspectionOverallResult overallResult) {
        this.overallResult = overallResult;
    }

    public String getSummaryNote() {
        return summaryNote;
    }

    public void setSummaryNote(String summaryNote) {
        this.summaryNote = summaryNote;
    }
}
