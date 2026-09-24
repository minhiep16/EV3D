package com.evshare.vehicle.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "vehicles")
public class Vehicle {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", length = 100, nullable = false)
    private String name;

    @Column(name = "brand", length = 50, nullable = false)
    private String brand;

    @Column(name = "model", length = 50, nullable = false)
    private String model;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "license_plate", length = 30, nullable = false, unique = true)
    private String licensePlate;

    @Column(name = "vin", length = 50, nullable = false, unique = true)
    private String vin;

    @Column(name = "battery_capacity", precision = 6, scale = 2, nullable = false)
    private BigDecimal batteryCapacity;

    @Column(name = "current_battery_level", nullable = false)
    private Integer currentBatteryLevel;

    @Column(name = "odometer", precision = 10, scale = 2, nullable = false)
    private BigDecimal odometer;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private VehicleStatus status;

    @Column(name = "model_3d_url", length = 255, nullable = false)
    private String model3dUrl;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public Vehicle() {
    }

    public Vehicle(UUID id, String name, String brand, String model, Integer year,
                   String licensePlate, String vin, BigDecimal batteryCapacity,
                   Integer currentBatteryLevel, BigDecimal odometer,
                   VehicleStatus status, String model3dUrl) {
        this.id = id != null ? id : UUID.randomUUID();
        this.name = name;
        this.brand = brand;
        this.model = model;
        this.year = year;
        this.licensePlate = licensePlate;
        this.vin = vin;
        this.batteryCapacity = batteryCapacity;
        this.currentBatteryLevel = currentBatteryLevel;
        this.odometer = odometer;
        this.status = status != null ? status : VehicleStatus.AVAILABLE;
        this.model3dUrl = model3dUrl != null ? model3dUrl : "/models/ev-car.glb";
    }

    @PrePersist
    public void ensureDefaults() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.status == null) {
            this.status = VehicleStatus.AVAILABLE;
        }
        if (this.model3dUrl == null) {
            this.model3dUrl = "/models/ev-car.glb";
        }
        if (this.currentBatteryLevel == null) {
            this.currentBatteryLevel = 100;
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

    public String getVehicleCode() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
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

    public Integer getCurrentBatteryLevel() {
        return currentBatteryLevel;
    }

    public void setCurrentBatteryLevel(Integer currentBatteryLevel) {
        this.currentBatteryLevel = currentBatteryLevel;
    }

    public BigDecimal getOdometer() {
        return odometer;
    }

    public void setOdometer(BigDecimal odometer) {
        this.odometer = odometer;
    }

    public VehicleStatus getStatus() {
        return status;
    }

    public void setStatus(VehicleStatus status) {
        this.status = status;
    }

    public String getModel3dUrl() {
        return model3dUrl;
    }

    public void setModel3dUrl(String model3dUrl) {
        this.model3dUrl = model3dUrl;
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
