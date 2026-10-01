package com.evshare.inspection.dto;

import com.evshare.inspection.entity.InspectionItemCondition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class VehicleInspectionItemRequest {

    @NotBlank(message = "Mã bộ phận kiểm tra không được để trống")
    @Size(max = 50, message = "Mã bộ phận tối đa 50 ký tự")
    private String vehiclePartCode;

    @NotNull(message = "Tình trạng bộ phận không được để trống")
    private InspectionItemCondition conditionStatus;

    @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
    private String note;

    public VehicleInspectionItemRequest() {
    }

    public VehicleInspectionItemRequest(String vehiclePartCode, InspectionItemCondition conditionStatus, String note) {
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

    public InspectionItemCondition getConditionStatus() {
        return conditionStatus;
    }

    public void setConditionStatus(InspectionItemCondition conditionStatus) {
        this.conditionStatus = conditionStatus;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
