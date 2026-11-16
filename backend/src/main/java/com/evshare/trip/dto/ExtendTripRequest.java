package com.evshare.trip.dto;

import java.time.Instant;

public class ExtendTripRequest {

    private Integer additionalMinutes;
    private Instant newEndTime;
    private String reason;
    private Boolean requestNegotiation;

    public ExtendTripRequest() {
    }

    public ExtendTripRequest(Integer additionalMinutes, String reason) {
        this.additionalMinutes = additionalMinutes;
        this.reason = reason;
    }

    public ExtendTripRequest(Instant newEndTime, String reason) {
        this.newEndTime = newEndTime;
        this.reason = reason;
    }

    public Integer getAdditionalMinutes() {
        return additionalMinutes;
    }

    public void setAdditionalMinutes(Integer additionalMinutes) {
        this.additionalMinutes = additionalMinutes;
    }

    public Instant getNewEndTime() {
        return newEndTime;
    }

    public void setNewEndTime(Instant newEndTime) {
        this.newEndTime = newEndTime;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Boolean getRequestNegotiation() {
        return requestNegotiation;
    }

    public void setRequestNegotiation(Boolean requestNegotiation) {
        this.requestNegotiation = requestNegotiation;
    }
}
