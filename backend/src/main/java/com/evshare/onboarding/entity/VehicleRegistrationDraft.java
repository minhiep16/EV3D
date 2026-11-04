package com.evshare.onboarding.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "vehicle_registration_drafts")
public class VehicleRegistrationDraft {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "user_id", length = 36, columnDefinition = "CHAR(36)", nullable = false)
    private UUID userId;

    @Column(name = "vehicle_name", length = 100, nullable = false)
    private String vehicleName;

    @Column(name = "manufacturer", length = 100)
    private String manufacturer;

    @Column(name = "model", length = 100)
    private String model;

    @Column(name = "model_year")
    private Integer modelYear;

    @Column(name = "license_plate", length = 30)
    private String licensePlate;

    @Column(name = "vin", length = 50)
    private String vin;

    @Column(name = "battery_capacity", precision = 5, scale = 2)
    private BigDecimal batteryCapacity;

    @Column(name = "battery_type", length = 50)
    private String batteryType;

    @Column(name = "group_name", length = 100)
    private String groupName;

    @Column(name = "voting_rule", length = 40)
    private String votingRule = "OWNERSHIP_WEIGHTED";

    @Column(name = "quorum_percentage", precision = 5, scale = 2)
    private BigDecimal quorumPercentage = new BigDecimal("50.00");

    @Column(name = "approval_threshold_percentage", precision = 5, scale = 2)
    private BigDecimal approvalThresholdPercentage = new BigDecimal("50.00");

    @Column(name = "proposed_co_owners", columnDefinition = "TEXT")
    private String proposedCoOwners;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private DraftStatus status = DraftStatus.DRAFT;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public VehicleRegistrationDraft() {
    }

    public VehicleRegistrationDraft(UUID id, UUID userId, String vehicleName) {
        this.id = id != null ? id : UUID.randomUUID();
        this.userId = userId;
        this.vehicleName = vehicleName;
        this.status = DraftStatus.DRAFT;
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

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getVehicleName() {
        return vehicleName;
    }

    public void setVehicleName(String vehicleName) {
        this.vehicleName = vehicleName;
    }

    public String getManufacturer() {
        return manufacturer;
    }

    public void setManufacturer(String manufacturer) {
        this.manufacturer = manufacturer;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public Integer getModelYear() {
        return modelYear;
    }

    public void setModelYear(Integer modelYear) {
        this.modelYear = modelYear;
    }

    public String getLicensePlate() {
        return licensePlate;
    }

    public void setLicensePlate(String licensePlate) {
        this.licensePlate = licensePlate;
    }

    public String getVin() {
        return vin;
    }

    public void setVin(String vin) {
        this.vin = vin;
    }

    public BigDecimal getBatteryCapacity() {
        return batteryCapacity;
    }

    public void setBatteryCapacity(BigDecimal batteryCapacity) {
        this.batteryCapacity = batteryCapacity;
    }

    public String getBatteryType() {
        return batteryType;
    }

    public void setBatteryType(String batteryType) {
        this.batteryType = batteryType;
    }

    public String getGroupName() {
        return groupName;
    }

    public void setGroupName(String groupName) {
        this.groupName = groupName;
    }

    public String getVotingRule() {
        return votingRule;
    }

    public void setVotingRule(String votingRule) {
        this.votingRule = votingRule;
    }

    public BigDecimal getQuorumPercentage() {
        return quorumPercentage;
    }

    public void setQuorumPercentage(BigDecimal quorumPercentage) {
        this.quorumPercentage = quorumPercentage;
    }

    public BigDecimal getApprovalThresholdPercentage() {
        return approvalThresholdPercentage;
    }

    public void setApprovalThresholdPercentage(BigDecimal approvalThresholdPercentage) {
        this.approvalThresholdPercentage = approvalThresholdPercentage;
    }

    public String getProposedCoOwners() {
        return proposedCoOwners;
    }

    public void setProposedCoOwners(String proposedCoOwners) {
        this.proposedCoOwners = proposedCoOwners;
    }

    public DraftStatus getStatus() {
        return status;
    }

    public void setStatus(DraftStatus status) {
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

