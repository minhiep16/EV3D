package com.evshare.energy.dto;

import java.math.BigDecimal;

public class TripEnergyCostResult {

    private final BigDecimal consumedEnergyKwh;
    private final BigDecimal applicableUnitCost;
    private final BigDecimal tripEnergyExpense;
    private final boolean reconciliationRequired;

    public TripEnergyCostResult(
            BigDecimal consumedEnergyKwh,
            BigDecimal applicableUnitCost,
            BigDecimal tripEnergyExpense,
            boolean reconciliationRequired
    ) {
        this.consumedEnergyKwh = consumedEnergyKwh;
        this.applicableUnitCost = applicableUnitCost;
        this.tripEnergyExpense = tripEnergyExpense;
        this.reconciliationRequired = reconciliationRequired;
    }

    public BigDecimal getConsumedEnergyKwh() {
        return consumedEnergyKwh;
    }

    public BigDecimal getApplicableUnitCost() {
        return applicableUnitCost;
    }

    public BigDecimal getTripEnergyExpense() {
        return tripEnergyExpense;
    }

    public boolean isReconciliationRequired() {
        return reconciliationRequired;
    }
}
