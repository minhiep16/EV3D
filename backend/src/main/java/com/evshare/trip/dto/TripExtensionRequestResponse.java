package com.evshare.trip.dto;

import com.evshare.trip.entity.TripExtensionRequest;
import com.evshare.trip.entity.TripExtensionStatus;

import java.time.Instant;
import java.util.UUID;

public class TripExtensionRequestResponse {

    private UUID id;
    private UUID tripId;
    private UUID vehicleId;
    private String vehicleName;
    private String licensePlate;
    private UUID requesterId;
    private String requesterName;
    private UUID currentBookingId;
    private Instant originalEndTime;
    private Instant proposedEndTime;
    private Integer additionalMinutes;
    private UUID affectedBookingId;
    private UUID affectedOwnerId;
    private String affectedOwnerName;
    private Instant originalAffectedStartTime;
    private Instant proposedAffectedStartTime;
    private Instant affectedEndTime;
    private String reason;
    private TripExtensionStatus status;
    private Instant responseDeadline;
    private Instant createdAt;
    private String message;

    public TripExtensionRequestResponse() {
    }

    public static TripExtensionRequestResponse fromEntity(TripExtensionRequest entity) {
        if (entity == null) return null;
        TripExtensionRequestResponse res = new TripExtensionRequestResponse();
        res.setId(entity.getId());
        if (entity.getTrip() != null) {
            res.setTripId(entity.getTrip().getId());
        }
        if (entity.getVehicle() != null) {
            res.setVehicleId(entity.getVehicle().getId());
            res.setVehicleName(entity.getVehicle().getName());
            res.setLicensePlate(entity.getVehicle().getLicensePlate());
        }
        if (entity.getRequester() != null) {
            res.setRequesterId(entity.getRequester().getId());
            res.setRequesterName(entity.getRequester().getFullName());
        }
        if (entity.getCurrentBooking() != null) {
            res.setCurrentBookingId(entity.getCurrentBooking().getId());
        }
        res.setOriginalEndTime(entity.getOriginalEndTime());
        res.setProposedEndTime(entity.getProposedEndTime());
        res.setAdditionalMinutes(entity.getAdditionalMinutes());

        if (entity.getAffectedBooking() != null) {
            res.setAffectedBookingId(entity.getAffectedBooking().getId());
            res.setOriginalAffectedStartTime(entity.getAffectedBooking().getStartTime());
            res.setAffectedEndTime(entity.getAffectedBooking().getEndTime());
        }
        if (entity.getAffectedOwner() != null) {
            res.setAffectedOwnerId(entity.getAffectedOwner().getId());
            res.setAffectedOwnerName(entity.getAffectedOwner().getFullName());
        }
        res.setProposedAffectedStartTime(entity.getProposedAffectedStartTime());
        res.setReason(entity.getReason());
        res.setStatus(entity.getStatus());
        res.setResponseDeadline(entity.getResponseDeadline());
        res.setCreatedAt(entity.getCreatedAt());
        return res;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getTripId() {
        return tripId;
    }

    public void setTripId(UUID tripId) {
        this.tripId = tripId;
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

    public String getLicensePlate() {
        return licensePlate;
    }

    public void setLicensePlate(String licensePlate) {
        this.licensePlate = licensePlate;
    }

    public UUID getRequesterId() {
        return requesterId;
    }

    public void setRequesterId(UUID requesterId) {
        this.requesterId = requesterId;
    }

    public String getRequesterName() {
        return requesterName;
    }

    public void setRequesterName(String requesterName) {
        this.requesterName = requesterName;
    }

    public UUID getCurrentBookingId() {
        return currentBookingId;
    }

    public void setCurrentBookingId(UUID currentBookingId) {
        this.currentBookingId = currentBookingId;
    }

    public Instant getOriginalEndTime() {
        return originalEndTime;
    }

    public void setOriginalEndTime(Instant originalEndTime) {
        this.originalEndTime = originalEndTime;
    }

    public Instant getProposedEndTime() {
        return proposedEndTime;
    }

    public void setProposedEndTime(Instant proposedEndTime) {
        this.proposedEndTime = proposedEndTime;
    }

    public Integer getAdditionalMinutes() {
        return additionalMinutes;
    }

    public void setAdditionalMinutes(Integer additionalMinutes) {
        this.additionalMinutes = additionalMinutes;
    }

    public UUID getAffectedBookingId() {
        return affectedBookingId;
    }

    public void setAffectedBookingId(UUID affectedBookingId) {
        this.affectedBookingId = affectedBookingId;
    }

    public UUID getAffectedOwnerId() {
        return affectedOwnerId;
    }

    public void setAffectedOwnerId(UUID affectedOwnerId) {
        this.affectedOwnerId = affectedOwnerId;
    }

    public String getAffectedOwnerName() {
        return affectedOwnerName;
    }

    public void setAffectedOwnerName(String affectedOwnerName) {
        this.affectedOwnerName = affectedOwnerName;
    }

    public Instant getOriginalAffectedStartTime() {
        return originalAffectedStartTime;
    }

    public void setOriginalAffectedStartTime(Instant originalAffectedStartTime) {
        this.originalAffectedStartTime = originalAffectedStartTime;
    }

    public Instant getProposedAffectedStartTime() {
        return proposedAffectedStartTime;
    }

    public void setProposedAffectedStartTime(Instant proposedAffectedStartTime) {
        this.proposedAffectedStartTime = proposedAffectedStartTime;
    }

    public Instant getAffectedEndTime() {
        return affectedEndTime;
    }

    public void setAffectedEndTime(Instant affectedEndTime) {
        this.affectedEndTime = affectedEndTime;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public TripExtensionStatus getStatus() {
        return status;
    }

    public void setStatus(TripExtensionStatus status) {
        this.status = status;
    }

    public Instant getResponseDeadline() {
        return responseDeadline;
    }

    public void setResponseDeadline(Instant responseDeadline) {
        this.responseDeadline = responseDeadline;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
