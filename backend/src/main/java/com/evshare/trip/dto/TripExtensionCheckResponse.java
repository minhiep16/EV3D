package com.evshare.trip.dto;

import java.time.Instant;
import java.util.UUID;

public class TripExtensionCheckResponse {

    private boolean eligible;
    private boolean canDirectExtend;
    private boolean hasConflict;
    private boolean canNegotiate;
    private Integer additionalMinutes;
    private Instant currentEndTime;
    private Instant proposedEndTime;
    private String message;

    // Conflict metadata
    private UUID affectedBookingId;
    private UUID affectedOwnerId;
    private String affectedOwnerName;
    private Instant affectedOriginalStartTime;
    private Instant affectedOriginalEndTime;
    private Instant proposedAffectedStartTime;

    public TripExtensionCheckResponse() {
    }

    public static TripExtensionCheckResponse directAvailable(
            Integer additionalMinutes, Instant currentEndTime, Instant proposedEndTime) {
        TripExtensionCheckResponse res = new TripExtensionCheckResponse();
        res.setEligible(true);
        res.setCanDirectExtend(true);
        res.setHasConflict(false);
        res.setCanNegotiate(false);
        res.setAdditionalMinutes(additionalMinutes);
        res.setCurrentEndTime(currentEndTime);
        res.setProposedEndTime(proposedEndTime);
        res.setMessage("Khung giờ gia hạn còn trống.");
        return res;
    }

    public static TripExtensionCheckResponse conflictNegotiable(
            Integer additionalMinutes, Instant currentEndTime, Instant proposedEndTime,
            UUID affectedBookingId, UUID affectedOwnerId, String affectedOwnerName,
            Instant affectedOriginalStartTime, Instant affectedOriginalEndTime,
            Instant proposedAffectedStartTime) {
        TripExtensionCheckResponse res = new TripExtensionCheckResponse();
        res.setEligible(true);
        res.setCanDirectExtend(false);
        res.setHasConflict(true);
        res.setCanNegotiate(true);
        res.setAdditionalMinutes(additionalMinutes);
        res.setCurrentEndTime(currentEndTime);
        res.setProposedEndTime(proposedEndTime);
        res.setAffectedBookingId(affectedBookingId);
        res.setAffectedOwnerId(affectedOwnerId);
        res.setAffectedOwnerName(affectedOwnerName);
        res.setAffectedOriginalStartTime(affectedOriginalStartTime);
        res.setAffectedOriginalEndTime(affectedOriginalEndTime);
        res.setProposedAffectedStartTime(proposedAffectedStartTime);
        res.setMessage("Khung giờ gia hạn trùng với lịch đặt của thành viên khác.");
        return res;
    }

    public static TripExtensionCheckResponse notEligible(String reasonMessage) {
        TripExtensionCheckResponse res = new TripExtensionCheckResponse();
        res.setEligible(false);
        res.setCanDirectExtend(false);
        res.setHasConflict(false);
        res.setCanNegotiate(false);
        res.setMessage(reasonMessage);
        return res;
    }

    public boolean isEligible() {
        return eligible;
    }

    public void setEligible(boolean eligible) {
        this.eligible = eligible;
    }

    public boolean isCanDirectExtend() {
        return canDirectExtend;
    }

    public void setCanDirectExtend(boolean canDirectExtend) {
        this.canDirectExtend = canDirectExtend;
    }

    public boolean isHasConflict() {
        return hasConflict;
    }

    public void setHasConflict(boolean hasConflict) {
        this.hasConflict = hasConflict;
    }

    public boolean isCanNegotiate() {
        return canNegotiate;
    }

    public void setCanNegotiate(boolean canNegotiate) {
        this.canNegotiate = canNegotiate;
    }

    public Integer getAdditionalMinutes() {
        return additionalMinutes;
    }

    public void setAdditionalMinutes(Integer additionalMinutes) {
        this.additionalMinutes = additionalMinutes;
    }

    public Instant getCurrentEndTime() {
        return currentEndTime;
    }

    public void setCurrentEndTime(Instant currentEndTime) {
        this.currentEndTime = currentEndTime;
    }

    public Instant getProposedEndTime() {
        return proposedEndTime;
    }

    public void setProposedEndTime(Instant proposedEndTime) {
        this.proposedEndTime = proposedEndTime;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
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

    public Instant getAffectedOriginalStartTime() {
        return affectedOriginalStartTime;
    }

    public void setAffectedOriginalStartTime(Instant affectedOriginalStartTime) {
        this.affectedOriginalStartTime = affectedOriginalStartTime;
    }

    public Instant getAffectedOriginalEndTime() {
        return affectedOriginalEndTime;
    }

    public void setAffectedOriginalEndTime(Instant affectedOriginalEndTime) {
        this.affectedOriginalEndTime = affectedOriginalEndTime;
    }

    public Instant getProposedAffectedStartTime() {
        return proposedAffectedStartTime;
    }

    public void setProposedAffectedStartTime(Instant proposedAffectedStartTime) {
        this.proposedAffectedStartTime = proposedAffectedStartTime;
    }
}
