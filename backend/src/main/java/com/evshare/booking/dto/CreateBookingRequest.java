package com.evshare.booking.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public class CreateBookingRequest {

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    private Instant startTime;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    private Instant endTime;

    @Size(max = 255, message = "Mục đích sử dụng không được vượt quá 255 ký tự")
    private String purpose;

    public CreateBookingRequest() {
    }

    public CreateBookingRequest(Instant startTime, Instant endTime, String purpose) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.purpose = purpose;
    }

    public Instant getStartTime() {
        return startTime;
    }

    public void setStartTime(Instant startTime) {
        this.startTime = startTime;
    }

    public Instant getEndTime() {
        return endTime;
    }

    public void setEndTime(Instant endTime) {
        this.endTime = endTime;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }
}
