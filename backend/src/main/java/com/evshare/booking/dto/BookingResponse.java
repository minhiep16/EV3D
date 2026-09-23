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

    public BookingResponse() {
    }

    public BookingResponse(UUID id, UUID vehicleId, UUID userId, String userName, String userEmail,
                           Instant startTime, Instant endTime, BookingStatus status, String purpose, Instant createdAt) {
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
    }

    public static BookingResponse fromEntity(Booking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getVehicle().getId(),
                booking.getUser().getId(),
                booking.getUser().getFullName(),
                booking.getUser().getEmail(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getStatus(),
                booking.getPurpose(),
                booking.getCreatedAt()
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
}
