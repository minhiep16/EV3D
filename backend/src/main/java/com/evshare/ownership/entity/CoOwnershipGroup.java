package com.evshare.ownership.entity;

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
@Table(name = "co_ownership_groups")
public class CoOwnershipGroup {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", length = 100, nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private GroupStatus status = GroupStatus.ACTIVE;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "vehicle_id", length = 36, columnDefinition = "CHAR(36)")
    private UUID vehicleId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "created_by", length = 36, columnDefinition = "CHAR(36)")
    private UUID createdBy;

    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GroupMember> members = new ArrayList<>();

    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GroupVehicle> groupVehicles = new ArrayList<>();

    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OwnershipShare> shares = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public CoOwnershipGroup() {
    }

    public CoOwnershipGroup(UUID id, String name, GroupStatus status, UUID createdBy) {
        this.id = id != null ? id : UUID.randomUUID();
        this.name = name;
        this.status = status != null ? status : GroupStatus.ACTIVE;
        this.createdBy = createdBy;
    }

    public CoOwnershipGroup(UUID id, UUID vehicleId, String name) {
        this.id = id != null ? id : UUID.randomUUID();
        this.vehicleId = vehicleId;
        this.name = name;
        this.status = GroupStatus.ACTIVE;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public GroupStatus getStatus() {
        return status;
    }

    public void setStatus(GroupStatus status) {
        this.status = status;
    }

    public UUID getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(UUID vehicleId) {
        this.vehicleId = vehicleId;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }

    public List<GroupMember> getMembers() {
        return members;
    }

    public void setMembers(List<GroupMember> members) {
        this.members = members;
    }

    public List<GroupVehicle> getGroupVehicles() {
        return groupVehicles;
    }

    public void setGroupVehicles(List<GroupVehicle> groupVehicles) {
        this.groupVehicles = groupVehicles;
    }

    public List<OwnershipShare> getShares() {
        return shares;
    }

    public void setShares(List<OwnershipShare> shares) {
        this.shares = shares;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
