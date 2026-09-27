package com.evshare.damage.dto;

import com.evshare.damage.entity.DamageSeverity;
import com.evshare.damage.entity.DamageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class CreateDamageRequest {

    @NotBlank(message = "Vui lòng chỉ định bộ phận phương tiện")
    private String vehiclePartCode;

    @NotNull(message = "Vui lòng chọn loại hư hỏng")
    private DamageType damageType;

    @NotNull(message = "Vui lòng chọn mức độ hư hỏng")
    private DamageSeverity severity;

    @Size(max = 1000, message = "Ghi chú không được vượt quá 1000 ký tự")
    private String note;

    @NotNull(message = "Tọa độ X không được để trống")
    private BigDecimal localPositionX;

    @NotNull(message = "Tọa độ Y không được để trống")
    private BigDecimal localPositionY;

    @NotNull(message = "Tọa độ Z không được để trống")
    private BigDecimal localPositionZ;

    public CreateDamageRequest() {
    }

    public CreateDamageRequest(String vehiclePartCode, DamageType damageType, DamageSeverity severity,
                               String note, BigDecimal localPositionX, BigDecimal localPositionY, BigDecimal localPositionZ) {
        this.vehiclePartCode = vehiclePartCode;
        this.damageType = damageType;
        this.severity = severity;
        this.note = note;
        this.localPositionX = localPositionX;
        this.localPositionY = localPositionY;
        this.localPositionZ = localPositionZ;
    }

    public String getVehiclePartCode() {
        return vehiclePartCode;
    }

    public void setVehiclePartCode(String vehiclePartCode) {
        this.vehiclePartCode = vehiclePartCode;
    }

    public DamageType getDamageType() {
        return damageType;
    }

    public void setDamageType(DamageType damageType) {
        this.damageType = damageType;
    }

    public DamageSeverity getSeverity() {
        return severity;
    }

    public void setSeverity(DamageSeverity severity) {
        this.severity = severity;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public BigDecimal getLocalPositionX() {
        return localPositionX;
    }

    public void setLocalPositionX(BigDecimal localPositionX) {
        this.localPositionX = localPositionX;
    }

    public BigDecimal getLocalPositionY() {
        return localPositionY;
    }

    public void setLocalPositionY(BigDecimal localPositionY) {
        this.localPositionY = localPositionY;
    }

    public BigDecimal getLocalPositionZ() {
        return localPositionZ;
    }

    public void setLocalPositionZ(BigDecimal localPositionZ) {
        this.localPositionZ = localPositionZ;
    }
}
