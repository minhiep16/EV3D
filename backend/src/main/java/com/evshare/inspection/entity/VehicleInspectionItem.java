package com.evshare.inspection.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "vehicle_inspection_items")
public class VehicleInspectionItem {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_id", nullable = false)
    private VehicleInspection inspection;

    @Column(name = "vehicle_part_code", length = 50, nullable = false)
    private String vehiclePartCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_status", length = 30, nullable = false)
    private InspectionItemCondition conditionStatus = InspectionItemCondition.GOOD;

    @Column(name = "note", length = 500)
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public VehicleInspectionItem() {
    }

    public VehicleInspectionItem(UUID id, VehicleInspection inspection, String vehiclePartCode, InspectionItemCondition conditionStatus, String note) {
        this.id = id != null ? id : UUID.randomUUID();
        this.inspection = inspection;
        this.vehiclePartCode = vehiclePartCode;
        this.conditionStatus = conditionStatus != null ? conditionStatus : InspectionItemCondition.GOOD;
        this.note = note;
    }

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public VehicleInspection getInspection() {
        return inspection;
    }

    public void setInspection(VehicleInspection inspection) {
        this.inspection = inspection;
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

    public Instant getCreatedAt() {
        return createdAt;
    }
}
