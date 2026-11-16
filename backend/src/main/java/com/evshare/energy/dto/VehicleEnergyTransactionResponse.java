package com.evshare.energy.dto;

import com.evshare.energy.entity.EnergyTransactionType;
import com.evshare.energy.entity.VehicleEnergyTransaction;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class VehicleEnergyTransactionResponse {

    private UUID id;
    private UUID vehicleId;
    private EnergyTransactionType transactionType;
    private BigDecimal deltaEnergyKwh;
    private BigDecimal deltaCost;
    private BigDecimal unitCost;
    private BigDecimal balanceEnergyKwhAfter;
    private BigDecimal balanceCostAfter;
    private BigDecimal weightedAvgCostAfter;
    private UUID operatorOrDriverUserId;
    private String operatorOrDriverName;
    private UUID sourceReferenceId;
    private String note;
    private Instant recordedAt;

    public VehicleEnergyTransactionResponse() {
    }

    public static VehicleEnergyTransactionResponse fromEntity(VehicleEnergyTransaction tx) {
        if (tx == null) return null;
        VehicleEnergyTransactionResponse resp = new VehicleEnergyTransactionResponse();
        resp.setId(tx.getId());
        if (tx.getVehicle() != null) {
            resp.setVehicleId(tx.getVehicle().getId());
        }
        resp.setTransactionType(tx.getTransactionType());
        resp.setDeltaEnergyKwh(tx.getDeltaEnergyKwh());
        resp.setDeltaCost(tx.getDeltaCost());
        resp.setUnitCost(tx.getUnitCost());
        resp.setBalanceEnergyKwhAfter(tx.getBalanceEnergyKwhAfter());
        resp.setBalanceCostAfter(tx.getBalanceCostAfter());
        resp.setWeightedAvgCostAfter(tx.getWeightedAvgCostAfter());
        resp.setOperatorOrDriverUserId(tx.getOperatorOrDriverUserId());
        resp.setOperatorOrDriverName(tx.getOperatorOrDriverName());
        resp.setSourceReferenceId(tx.getSourceReferenceId());
        resp.setNote(tx.getNote());
        resp.setRecordedAt(tx.getRecordedAt());
        return resp;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(UUID vehicleId) {
        this.vehicleId = vehicleId;
    }

    public EnergyTransactionType getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(EnergyTransactionType transactionType) {
        this.transactionType = transactionType;
    }

    public BigDecimal getDeltaEnergyKwh() {
        return deltaEnergyKwh;
    }

    public void setDeltaEnergyKwh(BigDecimal deltaEnergyKwh) {
        this.deltaEnergyKwh = deltaEnergyKwh;
    }

    public BigDecimal getDeltaCost() {
        return deltaCost;
    }

    public void setDeltaCost(BigDecimal deltaCost) {
        this.deltaCost = deltaCost;
    }

    public BigDecimal getUnitCost() {
        return unitCost;
    }

    public void setUnitCost(BigDecimal unitCost) {
        this.unitCost = unitCost;
    }

    public BigDecimal getBalanceEnergyKwhAfter() {
        return balanceEnergyKwhAfter;
    }

    public void setBalanceEnergyKwhAfter(BigDecimal balanceEnergyKwhAfter) {
        this.balanceEnergyKwhAfter = balanceEnergyKwhAfter;
    }

    public BigDecimal getBalanceCostAfter() {
        return balanceCostAfter;
    }

    public void setBalanceCostAfter(BigDecimal balanceCostAfter) {
        this.balanceCostAfter = balanceCostAfter;
    }

    public BigDecimal getWeightedAvgCostAfter() {
        return weightedAvgCostAfter;
    }

    public void setWeightedAvgCostAfter(BigDecimal weightedAvgCostAfter) {
        this.weightedAvgCostAfter = weightedAvgCostAfter;
    }

    public UUID getOperatorOrDriverUserId() {
        return operatorOrDriverUserId;
    }

    public void setOperatorOrDriverUserId(UUID operatorOrDriverUserId) {
        this.operatorOrDriverUserId = operatorOrDriverUserId;
    }

    public String getOperatorOrDriverName() {
        return operatorOrDriverName;
    }

    public void setOperatorOrDriverName(String operatorOrDriverName) {
        this.operatorOrDriverName = operatorOrDriverName;
    }

    public UUID getSourceReferenceId() {
        return sourceReferenceId;
    }

    public void setSourceReferenceId(UUID sourceReferenceId) {
        this.sourceReferenceId = sourceReferenceId;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public Instant getRecordedAt() {
        return recordedAt;
    }

    public void setRecordedAt(Instant recordedAt) {
        this.recordedAt = recordedAt;
    }
}
