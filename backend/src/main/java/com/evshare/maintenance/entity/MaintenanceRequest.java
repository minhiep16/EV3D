package com.evshare.maintenance.entity;

import com.evshare.damage.entity.DamageRecord;
import com.evshare.user.entity.User;
import com.evshare.vehicle.entity.Vehicle;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "maintenance_requests")
public class MaintenanceRequest {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private MaintenanceStatus status = MaintenanceStatus.PENDING_APPROVAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", length = 30, nullable = false)
    private MaintenancePriority priority = MaintenancePriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "maintenance_type", length = 50, nullable = false)
    private MaintenanceType maintenanceType = MaintenanceType.PREVENTIVE;

    @Column(name = "title", length = 255, nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "scheduled_at")
    private Instant scheduledAt;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "approved_weight", precision = 5, scale = 2)
    private java.math.BigDecimal approvedWeight;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_staff_id")
    private User assignedStaff;

    @Column(name = "completion_note", columnDefinition = "TEXT")
    private String completionNote;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "maintenance_request_damages",
            joinColumns = @JoinColumn(name = "maintenance_request_id"),
            inverseJoinColumns = @JoinColumn(name = "damage_record_id")
    )
    private Set<DamageRecord> damageRecords = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public MaintenanceRequest() {
    }

    public MaintenanceRequest(
            UUID id,
            Vehicle vehicle,
            MaintenanceStatus status,
            MaintenancePriority priority,
            MaintenanceType maintenanceType,
            String title,
            String description,
            Instant scheduledAt,
            User createdBy,
            User assignedStaff
    ) {
        this.id = id;
        this.vehicle = vehicle;
        this.status = status != null ? status : MaintenanceStatus.PENDING_APPROVAL;
        this.priority = priority != null ? priority : MaintenancePriority.MEDIUM;
        this.maintenanceType = maintenanceType != null ? maintenanceType : MaintenanceType.PREVENTIVE;
        this.title = title;
        this.description = description;
        this.scheduledAt = scheduledAt;
        this.createdBy = createdBy;
        this.assignedStaff = assignedStaff;
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

    public MaintenanceStatus getStatus() {
        return status;
    }

    public void setStatus(MaintenanceStatus status) {
        this.status = status;
    }

    public MaintenancePriority getPriority() {
        return priority;
    }

    public void setPriority(MaintenancePriority priority) {
        this.priority = priority;
    }

    public MaintenanceType getMaintenanceType() {
        return maintenanceType;
    }

    public void setMaintenanceType(MaintenanceType maintenanceType) {
        this.maintenanceType = maintenanceType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getScheduledAt() {
        return scheduledAt;
    }

    public void setScheduledAt(Instant scheduledAt) {
        this.scheduledAt = scheduledAt;
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

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public User getAssignedStaff() {
        return assignedStaff;
    }

    public void setAssignedStaff(User assignedStaff) {
        this.assignedStaff = assignedStaff;
    }

    public String getCompletionNote() {
        return completionNote;
    }

    public void setCompletionNote(String completionNote) {
        this.completionNote = completionNote;
    }

    public Set<DamageRecord> getDamageRecords() {
        return damageRecords;
    }

    public void setDamageRecords(Set<DamageRecord> damageRecords) {
        this.damageRecords = damageRecords;
    }

    public Instant getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(Instant approvedAt) {
        this.approvedAt = approvedAt;
    }

    public java.math.BigDecimal getApprovedWeight() {
        return approvedWeight;
    }

    public void setApprovedWeight(java.math.BigDecimal approvedWeight) {
        this.approvedWeight = approvedWeight;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
