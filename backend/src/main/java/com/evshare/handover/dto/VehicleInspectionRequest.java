package com.evshare.handover.dto;

import com.evshare.handover.entity.InspectionCondition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class VehicleInspectionRequest {

    @NotBlank(message = "Mã bộ phận xe không được để trống")
    private String vehiclePartCode;

    @NotNull(message = "Tình trạng kiểm tra không được để trống")
    private InspectionCondition conditionStatus;

    @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
    private String note;

    public VehicleInspectionRequest() {
    }

    public VehicleInspectionRequest(String vehiclePartCode, InspectionCondition conditionStatus, String note) {
        this.vehiclePartCode = vehiclePartCode;
        this.conditionStatus = conditionStatus;
        this.note = note;
    }

    public String getVehiclePartCode() {
        return vehiclePartCode;
    }

    public void setVehiclePartCode(String vehiclePartCode) {
        this.vehiclePartCode = vehiclePartCode;
    }

    public InspectionCondition getConditionStatus() {
        return conditionStatus;
    }

    public void setConditionStatus(InspectionCondition conditionStatus) {
        this.conditionStatus = conditionStatus;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
