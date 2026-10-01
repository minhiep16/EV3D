package com.evshare.trip.dto;

import java.math.BigDecimal;

public class TripEnergyCalculationResult {

    private final BigDecimal distanceKm;
    private final BigDecimal energyConsumedKwh;
    private final BigDecimal socConsumedPercent;
    private final BigDecimal endSocPercent;
    private final BigDecimal energyConsumptionKwhPer100Km;
    private final BigDecimal usableBatteryCapacityKwh;

    public TripEnergyCalculationResult(
            BigDecimal distanceKm,
            BigDecimal energyConsumedKwh,
            BigDecimal socConsumedPercent,
            BigDecimal endSocPercent,
            BigDecimal energyConsumptionKwhPer100Km,
            BigDecimal usableBatteryCapacityKwh
    ) {
        this.distanceKm = distanceKm;
        this.energyConsumedKwh = energyConsumedKwh;
        this.socConsumedPercent = socConsumedPercent;
        this.endSocPercent = endSocPercent;
        this.energyConsumptionKwhPer100Km = energyConsumptionKwhPer100Km;
        this.usableBatteryCapacityKwh = usableBatteryCapacityKwh;
    }

    public BigDecimal getDistanceKm() {
        return distanceKm;
    }

    public BigDecimal getEnergyConsumedKwh() {
        return energyConsumedKwh;
    }

    public BigDecimal getSocConsumedPercent() {
        return socConsumedPercent;
    }

    public BigDecimal getEndSocPercent() {
        return endSocPercent;
    }

    public BigDecimal getEnergyConsumptionKwhPer100Km() {
        return energyConsumptionKwhPer100Km;
    }

    public BigDecimal getUsableBatteryCapacityKwh() {
        return usableBatteryCapacityKwh;
    }
}
