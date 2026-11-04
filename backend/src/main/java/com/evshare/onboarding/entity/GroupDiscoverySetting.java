package com.evshare.onboarding.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "group_discovery_settings")
public class GroupDiscoverySetting {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "group_id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID groupId;

    @Column(name = "is_discoverable", nullable = false)
    private boolean isDiscoverable = false;

    @Column(name = "open_slots", nullable = false)
    private int openSlots = 0;

    @Column(name = "target_model", length = 100)
    private String targetModel;

    @Column(name = "public_terms", columnDefinition = "TEXT")
    private String publicTerms;

    @Column(name = "join_conditions", columnDefinition = "TEXT")
    private String joinConditions;

    @Column(name = "status", length = 30)
    private String status = "OPEN";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public GroupDiscoverySetting() {
    }

    public GroupDiscoverySetting(UUID groupId, boolean isDiscoverable, int openSlots, String targetModel) {
        this.groupId = groupId;
        this.isDiscoverable = isDiscoverable;
        this.openSlots = openSlots;
        this.targetModel = targetModel;
        this.status = "OPEN";
    }

    public UUID getGroupId() {
        return groupId;
    }

    public void setGroupId(UUID groupId) {
        this.groupId = groupId;
    }

    public boolean isDiscoverable() {
        return isDiscoverable;
    }

    public void setDiscoverable(boolean discoverable) {
        isDiscoverable = discoverable;
    }

    public int getOpenSlots() {
        return openSlots;
    }

    public void setOpenSlots(int openSlots) {
        this.openSlots = openSlots;
    }

    public String getTargetModel() {
        return targetModel;
    }

    public void setTargetModel(String targetModel) {
        this.targetModel = targetModel;
    }

    public String getPublicTerms() {
        return publicTerms;
    }

    public void setPublicTerms(String publicTerms) {
        this.publicTerms = publicTerms;
    }

    public String getJoinConditions() {
        return joinConditions;
    }

    public void setJoinConditions(String joinConditions) {
        this.joinConditions = joinConditions;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

