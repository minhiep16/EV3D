package com.evshare.trip.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class TripStartEligibilityResponse {

    private boolean eligible;
    private String reasonCode;
    private String message;
    private UUID bookingId;
    private UUID vehicleId;
    private String handoverStatus;
    private Integer currentBatteryLevel;
    private BigDecimal currentOdometer;

    public TripStartEligibilityResponse() {
    }

    public static TripStartEligibilityResponse eligible(
            UUID bookingId,
            UUID vehicleId,
            String handoverStatus,
            Integer currentBatteryLevel,
            BigDecimal currentOdometer
    ) {
        TripStartEligibilityResponse res = new TripStartEligibilityResponse();
        res.setEligible(true);
        res.setBookingId(bookingId);
        res.setVehicleId(vehicleId);
        res.setHandoverStatus(handoverStatus);
        res.setCurrentBatteryLevel(currentBatteryLevel);
        res.setCurrentOdometer(currentOdometer);
        return res;
    }

    public static TripStartEligibilityResponse notEligible(
            String reasonCode,
            String message,
            UUID bookingId,
            UUID vehicleId,
            String handoverStatus
    ) {
        TripStartEligibilityResponse res = new TripStartEligibilityResponse();
        res.setEligible(false);
        res.setReasonCode(reasonCode);
        res.setMessage(message);
        res.setBookingId(bookingId);
        res.setVehicleId(vehicleId);
        res.setHandoverStatus(handoverStatus);
        return res;
    }

    public boolean isEligible() {
        return eligible;
    }

    public void setEligible(boolean eligible) {
        this.eligible = eligible;
    }

    public String getReasonCode() {
        return reasonCode;
    }

    public void setReasonCode(String reasonCode) {
        this.reasonCode = reasonCode;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public UUID getBookingId() {
        return bookingId;
    }

    public void setBookingId(UUID bookingId) {
        this.bookingId = bookingId;
    }

    public UUID getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(UUID vehicleId) {
        this.vehicleId = vehicleId;
    }

    public String getHandoverStatus() {
        return handoverStatus;
    }

    public void setHandoverStatus(String handoverStatus) {
        this.handoverStatus = handoverStatus;
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
}
