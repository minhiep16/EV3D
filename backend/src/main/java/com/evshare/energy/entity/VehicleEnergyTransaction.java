package com.evshare.energy.entity;

import com.evshare.vehicle.entity.Vehicle;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "vehicle_energy_transactions")
public class VehicleEnergyTransaction {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_id", referencedColumnName = "id", nullable = false)
    private VehicleEnergyInventory inventory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", referencedColumnName = "id", nullable = false)
    private Vehicle vehicle;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", length = 35, nullable = false)
    private EnergyTransactionType transactionType;

    @Column(name = "delta_energy_kwh", precision = 10, scale = 3, nullable = false)
    private BigDecimal deltaEnergyKwh;

    @Column(name = "delta_cost", precision = 14, scale = 2, nullable = false)
    private BigDecimal deltaCost;

    @Column(name = "unit_cost", precision = 10, scale = 2, nullable = false)
    private BigDecimal unitCost;

    @Column(name = "balance_energy_kwh_after", precision = 10, scale = 3, nullable = false)
    private BigDecimal balanceEnergyKwhAfter;

    @Column(name = "balance_cost_after", precision = 14, scale = 2, nullable = false)
    private BigDecimal balanceCostAfter;

    @Column(name = "weighted_avg_cost_after", precision = 10, scale = 2, nullable = false)
    private BigDecimal weightedAvgCostAfter;

    @Column(name = "operator_or_driver_user_id")
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID operatorOrDriverUserId;

    @Column(name = "operator_or_driver_name", length = 150)
    private String operatorOrDriverName;

    @Column(name = "source_reference_id")
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID sourceReferenceId;

    @Column(name = "note", length = 500)
    private String note;

    @CreationTimestamp
    @Column(name = "recorded_at", updatable = false)
    private Instant recordedAt;

    public VehicleEnergyTransaction() {
    }

    public VehicleEnergyTransaction(
            UUID id,
            VehicleEnergyInventory inventory,
            Vehicle vehicle,
            EnergyTransactionType transactionType,
            BigDecimal deltaEnergyKwh,
            BigDecimal deltaCost,
            BigDecimal unitCost,
            BigDecimal balanceEnergyKwhAfter,
            BigDecimal balanceCostAfter,
            BigDecimal weightedAvgCostAfter,
            UUID operatorOrDriverUserId,
            String operatorOrDriverName,
            UUID sourceReferenceId,
            String note
    ) {
        this.id = id != null ? id : UUID.randomUUID();
        this.inventory = inventory;
        this.vehicle = vehicle;
        this.transactionType = transactionType;
        this.deltaEnergyKwh = deltaEnergyKwh;
        this.deltaCost = deltaCost;
        this.unitCost = unitCost;
        this.balanceEnergyKwhAfter = balanceEnergyKwhAfter;
        this.balanceCostAfter = balanceCostAfter;
        this.weightedAvgCostAfter = weightedAvgCostAfter;
        this.operatorOrDriverUserId = operatorOrDriverUserId;
        this.operatorOrDriverName = operatorOrDriverName;
        this.sourceReferenceId = sourceReferenceId;
        this.note = note;
    }

    @PrePersist
    public void ensureDefaults() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.recordedAt == null) {
            this.recordedAt = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public VehicleEnergyInventory getInventory() {
        return inventory;
    }

    public void setInventory(VehicleEnergyInventory inventory) {
        this.inventory = inventory;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
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
}
