package com.evshare.charging.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public class CreateChargingSessionRequest {

    @NotNull(message = "chargingStationId không được để trống")
    private UUID chargingStationId;

    @NotNull(message = "targetSocPercent không được để trống")
    @DecimalMin(value = "1.0", message = "Mức pin mục tiêu phải lớn hơn 0%")
    @DecimalMax(value = "100.0", message = "Mức pin mục tiêu không thể vượt quá 100%")
    private BigDecimal targetSocPercent;

    private Boolean startImmediately = true;

    public CreateChargingSessionRequest() {
    }

    public UUID getChargingStationId() {
        return chargingStationId;
    }

    public void setChargingStationId(UUID chargingStationId) {
        this.chargingStationId = chargingStationId;
    }

    public BigDecimal getTargetSocPercent() {
        return targetSocPercent;
    }

    public void setTargetSocPercent(BigDecimal targetSocPercent) {
        this.targetSocPercent = targetSocPercent;
    }

    public Boolean getStartImmediately() {
        return startImmediately != null ? startImmediately : true;
    }

    public void setStartImmediately(Boolean startImmediately) {
        this.startImmediately = startImmediately;
    }
}
