package com.evshare.charging.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class ProgressChargingSessionRequest {

    @NotNull(message = "newSocPercent không được để trống")
    @DecimalMin(value = "0.0", message = "Mức pin không thể âm")
    @DecimalMax(value = "100.0", message = "Mức pin không thể vượt quá 100%")
    private BigDecimal newSocPercent;

    private BigDecimal energyDeliveredKwh;

    public ProgressChargingSessionRequest() {
    }

    public BigDecimal getNewSocPercent() {
        return newSocPercent;
    }

    public void setNewSocPercent(BigDecimal newSocPercent) {
        this.newSocPercent = newSocPercent;
    }

    public BigDecimal getEnergyDeliveredKwh() {
        return energyDeliveredKwh;
    }

    public void setEnergyDeliveredKwh(BigDecimal energyDeliveredKwh) {
        this.energyDeliveredKwh = energyDeliveredKwh;
    }
}
