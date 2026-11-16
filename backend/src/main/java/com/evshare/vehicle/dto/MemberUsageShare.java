package com.evshare.vehicle.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class MemberUsageShare {

    private UUID userId;
    private String userName;
    private Double distanceKm;
    private int tripsCount;
    private BigDecimal ownershipPercentage;
    private Double usagePercentage;

    public MemberUsageShare() {
    }

    public MemberUsageShare(UUID userId, String userName, Double distanceKm, int tripsCount,
                            BigDecimal ownershipPercentage, Double usagePercentage) {
        this.userId = userId;
        this.userName = userName;
        this.distanceKm = distanceKm;
        this.tripsCount = tripsCount;
        this.ownershipPercentage = ownershipPercentage;
        this.usagePercentage = usagePercentage;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
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

    public BigDecimal getOwnershipPercentage() {
        return ownershipPercentage;
    }

    public void setOwnershipPercentage(BigDecimal ownershipPercentage) {
        this.ownershipPercentage = ownershipPercentage;
    }

    public Double getUsagePercentage() {
        return usagePercentage;
    }

    public void setUsagePercentage(Double usagePercentage) {
        this.usagePercentage = usagePercentage;
    }
}

