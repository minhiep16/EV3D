package com.evshare.vehicle.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class DailyAnalyticsData {

    private LocalDate date;
    private String dayOfWeek;
    private Double energyKwh;
    private Double distanceKm;
    private int tripsCount;
    private BigDecimal costVnd;

    public DailyAnalyticsData() {
    }

    public DailyAnalyticsData(LocalDate date, String dayOfWeek, Double energyKwh, Double distanceKm, int tripsCount, BigDecimal costVnd) {
        this.date = date;
        this.dayOfWeek = dayOfWeek;
        this.energyKwh = energyKwh;
        this.distanceKm = distanceKm;
        this.tripsCount = tripsCount;
        this.costVnd = costVnd;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(String dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public Double getEnergyKwh() {
        return energyKwh;
    }

    public void setEnergyKwh(Double energyKwh) {
        this.energyKwh = energyKwh;
    }

    public Double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(Double distanceKm) {
        this.distanceKm = distanceKm;
    }

    public int getTripsCount() {
        return tripsCount;
    }

    public void setTripsCount(int tripsCount) {
        this.tripsCount = tripsCount;
    }

    public BigDecimal getCostVnd() {
        return costVnd;
    }

    public void setCostVnd(BigDecimal costVnd) {
        this.costVnd = costVnd;
    }
}

