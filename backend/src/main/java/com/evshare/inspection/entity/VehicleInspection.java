package com.evshare.inspection.entity;

import com.evshare.user.entity.User;
import com.evshare.vehicle.entity.Vehicle;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "vehicle_inspections")
public class VehicleInspection {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspected_by", nullable = false)
    private User inspectedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "inspection_type", length = 30, nullable = false)
    private InspectionType inspectionType = InspectionType.PRE_HANDOVER;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private InspectionStatus status = InspectionStatus.IN_PROGRESS;

    @Enumerated(EnumType.STRING)
    @Column(name = "overall_result", length = 30)
    private InspectionOverallResult overallResult;

    @Column(name = "summary_note", length = 1000)
    private String summaryNote;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @OneToMany(mappedBy = "inspection", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VehicleInspectionItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public VehicleInspection() {
    }

    public VehicleInspection(UUID id, Vehicle vehicle, User inspectedBy, InspectionType inspectionType) {
        this.id = id != null ? id : UUID.randomUUID();
        this.vehicle = vehicle;
        this.inspectedBy = inspectedBy;
        this.inspectionType = inspectionType != null ? inspectionType : InspectionType.PRE_HANDOVER;
        this.status = InspectionStatus.IN_PROGRESS;
        this.startedAt = Instant.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.startedAt == null) {
            this.startedAt = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public User getInspectedBy() {
        return inspectedBy;
    }

    public void setInspectedBy(User inspectedBy) {
        this.inspectedBy = inspectedBy;
    }

    public InspectionType getInspectionType() {
        return inspectionType;
    }

    public void setInspectionType(InspectionType inspectionType) {
        this.inspectionType = inspectionType;
    }

    public InspectionStatus getStatus() {
        return status;
    }

    public void setStatus(InspectionStatus status) {
        this.status = status;
    }

    public InspectionOverallResult getOverallResult() {
        return overallResult;
    }

    public void setOverallResult(InspectionOverallResult overallResult) {
        this.overallResult = overallResult;
    }

    public String getSummaryNote() {
        return summaryNote;
    }

    public void setSummaryNote(String summaryNote) {
        this.summaryNote = summaryNote;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }

    public List<VehicleInspectionItem> getItems() {
        return items;
    }

    public void setItems(List<VehicleInspectionItem> items) {
        this.items = items;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
