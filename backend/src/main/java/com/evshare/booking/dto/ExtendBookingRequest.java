package com.evshare.booking.dto;

import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public class ExtendBookingRequest {

    @NotNull(message = "Thời gian kết thúc mới không được để trống")
    private Instant newEndTime;

    private String reason;

    public ExtendBookingRequest() {
    }

    public ExtendBookingRequest(Instant newEndTime, String reason) {
        this.newEndTime = newEndTime;
        this.reason = reason;
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
}
