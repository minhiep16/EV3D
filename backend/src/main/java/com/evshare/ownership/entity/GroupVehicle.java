package com.evshare.ownership.entity;

import com.evshare.vehicle.entity.Vehicle;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "group_vehicles", uniqueConstraints = {
        @UniqueConstraint(name = "uk_group_vehicle", columnNames = {"group_id", "vehicle_id"})
})
public class GroupVehicle {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private CoOwnershipGroup group;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private GroupVehicleStatus status = GroupVehicleStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "added_at", updatable = false)
    private Instant addedAt;

    public GroupVehicle() {
    }

    public GroupVehicle(UUID id, CoOwnershipGroup group, Vehicle vehicle, GroupVehicleStatus status) {
        this.id = id != null ? id : UUID.randomUUID();
        this.group = group;
        this.vehicle = vehicle;
        this.status = status != null ? status : GroupVehicleStatus.ACTIVE;
    }

    @PrePersist
    public void ensureId() {
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

    public CoOwnershipGroup getGroup() {
        return group;
    }

    public void setGroup(CoOwnershipGroup group) {
        this.group = group;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public GroupVehicleStatus getStatus() {
        return status;
    }

    public void setStatus(GroupVehicleStatus status) {
        this.status = status;
    }

    public Instant getAddedAt() {
        return addedAt;
    }

    public void setAddedAt(Instant addedAt) {
        this.addedAt = addedAt;
    }
}
