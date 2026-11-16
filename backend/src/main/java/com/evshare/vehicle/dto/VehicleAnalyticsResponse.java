package com.evshare.vehicle.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class VehicleAnalyticsResponse {

    private UUID vehicleId;
    private String vehicleName;
    private String brand;
    private String model;
    private String licensePlate;
    private BigDecimal batteryCapacity;
    private Integer currentBatteryLevel;
    private BigDecimal currentOdometer;

    private LocalDate fromDate;
    private LocalDate toDate;
    private int periodDays;

    private Double totalDistanceKm;
    private long completedTripsCount;
    private int activeDrivingDays;
    private Double totalDrivingHours;

    private Double totalEnergyKwh;
    private Double energyConsumptionKwhPer100Km;
    private BigDecimal totalOperatingExpenses;
    private BigDecimal directTripExpenses;
    private BigDecimal sharedOperatingExpenses;
    private Boolean isEnergyEstimated;
    private Double costPerKm;
    private Double utilizationRatePercent;
    private Double sohPercent;

    private boolean hasTripData;
    private boolean hasEnergyData;
    private boolean hasExpenseData;

    private List<DailyAnalyticsData> dailySeries = new ArrayList<>();
    private List<MemberUsageShare> memberUsage = new ArrayList<>();

    public VehicleAnalyticsResponse() {
    }

    public UUID getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(UUID vehicleId) {
        this.vehicleId = vehicleId;
    }

    public String getVehicleName() {
        return vehicleName;
    }

    public void setVehicleName(String vehicleName) {
        this.vehicleName = vehicleName;
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

    public String getLicensePlate() {
        return licensePlate;
    }

    public void setLicensePlate(String licensePlate) {
        this.licensePlate = licensePlate;
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

    public BigDecimal getCurrentOdometer() {
        return currentOdometer;
    }

    public void setCurrentOdometer(BigDecimal currentOdometer) {
        this.currentOdometer = currentOdometer;
    }

    public LocalDate getFromDate() {
        return fromDate;
    }

    public void setFromDate(LocalDate fromDate) {
        this.fromDate = fromDate;
    }

    public LocalDate getToDate() {
        return toDate;
    }

    public void setToDate(LocalDate toDate) {
        this.toDate = toDate;
    }

    public int getPeriodDays() {
        return periodDays;
    }

    public void setPeriodDays(int periodDays) {
        this.periodDays = periodDays;
    }

    public Double getTotalDistanceKm() {
        return totalDistanceKm;
    }

    public void setTotalDistanceKm(Double totalDistanceKm) {
        this.totalDistanceKm = totalDistanceKm;
    }

    public long getCompletedTripsCount() {
        return completedTripsCount;
    }

    public void setCompletedTripsCount(long completedTripsCount) {
        this.completedTripsCount = completedTripsCount;
    }

    public int getActiveDrivingDays() {
        return activeDrivingDays;
    }

    public void setActiveDrivingDays(int activeDrivingDays) {
        this.activeDrivingDays = activeDrivingDays;
    }

    public Double getTotalDrivingHours() {
        return totalDrivingHours;
    }

    public void setTotalDrivingHours(Double totalDrivingHours) {
        this.totalDrivingHours = totalDrivingHours;
    }

    public Double getTotalEnergyKwh() {
        return totalEnergyKwh;
    }

    public void setTotalEnergyKwh(Double totalEnergyKwh) {
        this.totalEnergyKwh = totalEnergyKwh;
    }

    public Double getEnergyConsumptionKwhPer100Km() {
        return energyConsumptionKwhPer100Km;
    }

    public void setEnergyConsumptionKwhPer100Km(Double energyConsumptionKwhPer100Km) {
        this.energyConsumptionKwhPer100Km = energyConsumptionKwhPer100Km;
    }

    public BigDecimal getTotalOperatingExpenses() {
        return totalOperatingExpenses;
    }

    public void setTotalOperatingExpenses(BigDecimal totalOperatingExpenses) {
        this.totalOperatingExpenses = totalOperatingExpenses;
    }

    public BigDecimal getDirectTripExpenses() {
        return directTripExpenses;
    }

    public void setDirectTripExpenses(BigDecimal directTripExpenses) {
        this.directTripExpenses = directTripExpenses;
    }

    public BigDecimal getSharedOperatingExpenses() {
        return sharedOperatingExpenses;
    }

    public void setSharedOperatingExpenses(BigDecimal sharedOperatingExpenses) {
        this.sharedOperatingExpenses = sharedOperatingExpenses;
    }

    public Boolean getIsEnergyEstimated() {
        return isEnergyEstimated;
    }

    public void setIsEnergyEstimated(Boolean isEnergyEstimated) {
        this.isEnergyEstimated = isEnergyEstimated;
    }

    public Double getCostPerKm() {
        return costPerKm;
    }

    public void setCostPerKm(Double costPerKm) {
        this.costPerKm = costPerKm;
    }

    public Double getUtilizationRatePercent() {
        return utilizationRatePercent;
    }

    public void setUtilizationRatePercent(Double utilizationRatePercent) {
        this.utilizationRatePercent = utilizationRatePercent;
    }

    public Double getSohPercent() {
        return sohPercent;
    }

    public void setSohPercent(Double sohPercent) {
        this.sohPercent = sohPercent;
    }

    public boolean isHasTripData() {
        return hasTripData;
    }

    public void setHasTripData(boolean hasTripData) {
        this.hasTripData = hasTripData;
    }

    public boolean isHasEnergyData() {
        return hasEnergyData;
    }

    public void setHasEnergyData(boolean hasEnergyData) {
        this.hasEnergyData = hasEnergyData;
    }

    public boolean isHasExpenseData() {
        return hasExpenseData;
    }

    public void setHasExpenseData(boolean hasExpenseData) {
        this.hasExpenseData = hasExpenseData;
    }

    public List<DailyAnalyticsData> getDailySeries() {
        return dailySeries;
    }

    public void setDailySeries(List<DailyAnalyticsData> dailySeries) {
        this.dailySeries = dailySeries;
    }

    public List<MemberUsageShare> getMemberUsage() {
        return memberUsage;
    }

    public void setMemberUsage(List<MemberUsageShare> memberUsage) {
        this.memberUsage = memberUsage;
    }
}

