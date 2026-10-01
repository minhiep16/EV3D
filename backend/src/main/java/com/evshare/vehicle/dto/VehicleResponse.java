package com.evshare.vehicle.dto;

import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.entity.VehicleStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class VehicleResponse {

    private UUID id;
    private String name;
    private String brand;
    private String model;
    private Integer year;
    private String licensePlate;
    private String vin;
    private BigDecimal batteryCapacity;
    private BigDecimal grossBatteryCapacityKwh;
    private BigDecimal usableBatteryCapacityKwh;
    private BigDecimal energyConsumptionKwhPer100Km;
    private Integer currentBatteryLevel;
    private BigDecimal odometer;
    private VehicleStatus status;
    private String model3dUrl;
    private Instant createdAt;
    private Instant updatedAt;

    public VehicleResponse() {
    }

    public static VehicleResponse fromEntity(Vehicle vehicle) {
        VehicleResponse response = new VehicleResponse();
        response.setId(vehicle.getId());
        response.setName(vehicle.getName());
        response.setBrand(vehicle.getBrand());
        response.setModel(vehicle.getModel());
        response.setYear(vehicle.getYear());
        response.setLicensePlate(vehicle.getLicensePlate());
        response.setVin(vehicle.getVin());
        response.setBatteryCapacity(vehicle.getBatteryCapacity());
        response.setGrossBatteryCapacityKwh(vehicle.getGrossBatteryCapacityKwh());
        response.setUsableBatteryCapacityKwh(vehicle.getUsableBatteryCapacityKwh());
        response.setEnergyConsumptionKwhPer100Km(vehicle.getEnergyConsumptionKwhPer100Km());
        response.setCurrentBatteryLevel(vehicle.getCurrentBatteryLevel());
        response.setOdometer(vehicle.getOdometer());
        response.setStatus(vehicle.getStatus());
        response.setModel3dUrl(vehicle.getModel3dUrl());
        response.setCreatedAt(vehicle.getCreatedAt());
        response.setUpdatedAt(vehicle.getUpdatedAt());
        return response;
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

    public BigDecimal getGrossBatteryCapacityKwh() {
        return grossBatteryCapacityKwh;
    }

    public void setGrossBatteryCapacityKwh(BigDecimal grossBatteryCapacityKwh) {
        this.grossBatteryCapacityKwh = grossBatteryCapacityKwh;
    }

    public BigDecimal getUsableBatteryCapacityKwh() {
        return usableBatteryCapacityKwh;
    }

    public void setUsableBatteryCapacityKwh(BigDecimal usableBatteryCapacityKwh) {
        this.usableBatteryCapacityKwh = usableBatteryCapacityKwh;
    }

    public BigDecimal getEnergyConsumptionKwhPer100Km() {
        return energyConsumptionKwhPer100Km;
    }

    public void setEnergyConsumptionKwhPer100Km(BigDecimal energyConsumptionKwhPer100Km) {
        this.energyConsumptionKwhPer100Km = energyConsumptionKwhPer100Km;
    }
}
