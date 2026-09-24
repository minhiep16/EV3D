package com.evshare.booking.dto;

import com.evshare.booking.entity.Booking;
import com.evshare.booking.entity.BookingStatus;

import java.time.Instant;
import java.util.UUID;

public class BookingResponse {
    private UUID id;
    private UUID vehicleId;
    private UUID userId;
    private String userName;
    private String userEmail;
    private Instant startTime;
    private Instant endTime;
    private BookingStatus status;
    private String purpose;
    private Instant createdAt;
    private boolean isExpired;

    public BookingResponse() {
    }

    public BookingResponse(UUID id, UUID vehicleId, UUID userId, String userName, String userEmail,
                           Instant startTime, Instant endTime, BookingStatus status, String purpose, Instant createdAt) {
        this(id, vehicleId, userId, userName, userEmail, startTime, endTime, status, purpose, createdAt, false);
    }

    public BookingResponse(UUID id, UUID vehicleId, UUID userId, String userName, String userEmail,
                           Instant startTime, Instant endTime, BookingStatus status, String purpose, Instant createdAt, boolean isExpired) {
        this.id = id;
        this.vehicleId = vehicleId;
        this.userId = userId;
        this.userName = userName;
        this.userEmail = userEmail;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
        this.purpose = purpose;
        this.createdAt = createdAt;
        this.isExpired = isExpired;
    }

    public static BookingResponse fromEntity(Booking booking) {
        boolean expired = booking.isExpired();
        BookingStatus effectiveStatus = (expired && booking.getStatus() == BookingStatus.CONFIRMED) ? BookingStatus.EXPIRED : booking.getStatus();

        return new BookingResponse(
                booking.getId(),
                booking.getVehicle().getId(),
                booking.getUser().getId(),
                booking.getUser().getFullName(),
                booking.getUser().getEmail(),
                booking.getStartTime(),
                booking.getEndTime(),
                effectiveStatus,
                booking.getPurpose(),
                booking.getCreatedAt(),
                expired
        );
    }

    public UUID getId() {
        return id;
    }

    public UUID getVehicleId() {
        return vehicleId;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getUserName() {
        return userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public Instant getStartTime() {
        return startTime;
    }

    public Instant getEndTime() {
        return endTime;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public String getPurpose() {
        return purpose;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("isExpired")
    public boolean isExpired() {
        return isExpired;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("expired")
    public boolean getExpired() {
        return isExpired;
    }

    public void setExpired(boolean expired) {
        this.isExpired = expired;
    }
}
