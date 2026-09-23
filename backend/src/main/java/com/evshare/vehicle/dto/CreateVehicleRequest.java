package com.evshare.vehicle.dto;

import com.evshare.vehicle.entity.VehicleStatus;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public class CreateVehicleRequest {

    @NotBlank(message = "Vehicle name is required")
    private String name;

    @NotBlank(message = "Brand is required")
    private String brand;

    @NotBlank(message = "Model is required")
    private String model;

    @NotNull(message = "Year is required")
    @Min(value = 1900, message = "Year must be at least 1900")
    @Max(value = 2100, message = "Year must not exceed 2100")
    private Integer year;

    @NotBlank(message = "License plate is required")
    private String licensePlate;

    @NotBlank(message = "VIN is required")
    private String vin;

    @NotNull(message = "Battery capacity is required")
    @DecimalMin(value = "0.0", message = "Battery capacity must be non-negative")
    private BigDecimal batteryCapacity;

    @NotNull(message = "Current battery level is required")
    @Min(value = 0, message = "Battery level cannot be less than 0")
    @Max(value = 100, message = "Battery level cannot exceed 100")
    private Integer currentBatteryLevel;

    @NotNull(message = "Odometer is required")
    @DecimalMin(value = "0.0", message = "Odometer cannot be negative")
    private BigDecimal odometer;

    private VehicleStatus status = VehicleStatus.AVAILABLE;

    private String model3dUrl = "/models/ev-car.glb";

    public CreateVehicleRequest() {
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
}
