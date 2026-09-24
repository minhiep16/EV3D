package com.evshare.handover.dto;

import java.time.Instant;
import java.util.UUID;

public class VehicleHandoverEligibilityResponse {

    private HandoverEligibilityReason reason;
    private String message;
    private boolean eligibleForInspection;
    private UUID vehicleId;
    private String vehicleName;
    private String vehicleCode;
    private UUID bookingId;
    private Instant bookingStartTime;
    private Instant bookingEndTime;
    private String recipientName;
    private String recipientEmail;
    private String bookingPurpose;
    private Instant preparationWindowStartTime;
    private Long secondsUntilPreparation;
    private UUID handoverId;
    private String handoverStatus;
    private VehicleHandoverResponse handover;

    public VehicleHandoverEligibilityResponse() {
    }

    public HandoverEligibilityReason getReason() {
        return reason;
    }

    public void setReason(HandoverEligibilityReason reason) {
        this.reason = reason;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isEligibleForInspection() {
        return eligibleForInspection;
    }

    public void setEligibleForInspection(boolean eligibleForInspection) {
        this.eligibleForInspection = eligibleForInspection;
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

    public String getVehicleCode() {
        return vehicleCode != null ? vehicleCode : "EV01";
    }

    public void setVehicleCode(String vehicleCode) {
        this.vehicleCode = vehicleCode;
    }

    public UUID getBookingId() {
        return bookingId;
    }

    public void setBookingId(UUID bookingId) {
        this.bookingId = bookingId;
    }

    public Instant getBookingStartTime() {
        return bookingStartTime;
    }

    public void setBookingStartTime(Instant bookingStartTime) {
        this.bookingStartTime = bookingStartTime;
    }

    public Instant getBookingEndTime() {
        return bookingEndTime;
    }

    public void setBookingEndTime(Instant bookingEndTime) {
        this.bookingEndTime = bookingEndTime;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }

    public String getBookingPurpose() {
        return bookingPurpose;
    }

    public void setBookingPurpose(String bookingPurpose) {
        this.bookingPurpose = bookingPurpose;
    }

    public Instant getPreparationWindowStartTime() {
        return preparationWindowStartTime;
    }

    public void setPreparationWindowStartTime(Instant preparationWindowStartTime) {
        this.preparationWindowStartTime = preparationWindowStartTime;
    }

    public Long getSecondsUntilPreparation() {
        return secondsUntilPreparation;
    }

    public void setSecondsUntilPreparation(Long secondsUntilPreparation) {
        this.secondsUntilPreparation = secondsUntilPreparation;
    }

    public UUID getHandoverId() {
        return handoverId;
    }

    public void setHandoverId(UUID handoverId) {
        this.handoverId = handoverId;
    }

    public String getHandoverStatus() {
        return handoverStatus;
    }

    public void setHandoverStatus(String handoverStatus) {
        this.handoverStatus = handoverStatus;
    }

    public VehicleHandoverResponse getHandover() {
        return handover;
    }

    public void setHandover(VehicleHandoverResponse handover) {
        this.handover = handover;
    }
}
