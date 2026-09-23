package com.evshare.handover.entity;

import com.evshare.user.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "vehicle_inspections",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_handover_part", columnNames = {"handover_id", "vehicle_part_code"})
    }
)
public class VehicleInspection {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "handover_id", nullable = false)
    private VehicleHandover handover;

    @Column(name = "vehicle_part_code", length = 50, nullable = false)
    private String vehiclePartCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_status", length = 30, nullable = false)
    private InspectionCondition conditionStatus;

    @Column(name = "note", length = 500)
    private String note;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspected_by", nullable = false)
    private User inspectedBy;

    @Column(name = "inspected_at", nullable = false)
    private Instant inspectedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public VehicleInspection() {
    }

    public VehicleInspection(UUID id, VehicleHandover handover, String vehiclePartCode, InspectionCondition conditionStatus, String note, User inspectedBy, Instant inspectedAt) {
        this.id = id != null ? id : UUID.randomUUID();
        this.handover = handover;
        this.vehiclePartCode = vehiclePartCode;
        this.conditionStatus = conditionStatus;
        this.note = note;
        this.inspectedBy = inspectedBy;
        this.inspectedAt = inspectedAt != null ? inspectedAt : Instant.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.inspectedAt == null) {
            this.inspectedAt = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public VehicleHandover getHandover() {
        return handover;
    }

    public void setHandover(VehicleHandover handover) {
        this.handover = handover;
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

    public User getInspectedBy() {
        return inspectedBy;
    }

    public void setInspectedBy(User inspectedBy) {
        this.inspectedBy = inspectedBy;
    }

    public Instant getInspectedAt() {
        return inspectedAt;
    }

    public void setInspectedAt(Instant inspectedAt) {
        this.inspectedAt = inspectedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
