package com.evshare.booking.dto;

import com.evshare.booking.entity.BookingViolation;
import com.evshare.booking.entity.BookingViolationStatus;
import com.evshare.booking.entity.BookingViolationType;

import java.time.Instant;
import java.util.UUID;

public class BookingViolationResponse {

    private UUID id;
    private UUID bookingId;
    private UUID userId;
    private String userName;
    private String userEmail;
    private UUID vehicleId;
    private String vehicleName;
    private String vehiclePlate;
    private BookingViolationType violationType;
    private String violationTypeLabelVi;
    private Instant scheduledDepartureTime;
    private Instant violationTimestamp;
    private int gracePeriodMinutes;
    private String reason;
    private BookingViolationStatus resolutionStatus;
    private String resolutionStatusLabelVi;
    private Instant resolvedAt;
    private String resolvedByName;
    private String resolutionNote;
    private Instant createdAt;

    public BookingViolationResponse() {
    }

    public static BookingViolationResponse fromEntity(BookingViolation entity) {
        if (entity == null) return null;
        BookingViolationResponse resp = new BookingViolationResponse();
        resp.setId(entity.getId());
        if (entity.getBooking() != null) {
            resp.setBookingId(entity.getBooking().getId());
        }
        if (entity.getUser() != null) {
            resp.setUserId(entity.getUser().getId());
            resp.setUserName(entity.getUser().getFullName());
            resp.setUserEmail(entity.getUser().getEmail());
        }
        if (entity.getVehicle() != null) {
            resp.setVehicleId(entity.getVehicle().getId());
            resp.setVehicleName(entity.getVehicle().getName());
            resp.setVehiclePlate(entity.getVehicle().getLicensePlate());
        }
        resp.setViolationType(entity.getViolationType());
        resp.setViolationTypeLabelVi(entity.getViolationType() != null ? entity.getViolationType().getVietnameseLabel() : null);
        resp.setScheduledDepartureTime(entity.getScheduledDepartureTime());
        resp.setViolationTimestamp(entity.getViolationTimestamp());
        resp.setGracePeriodMinutes(entity.getGracePeriodMinutes());
        resp.setReason(entity.getReason());
        resp.setResolutionStatus(entity.getResolutionStatus());
        resp.setResolutionStatusLabelVi(entity.getResolutionStatus() != null ? entity.getResolutionStatus().getVietnameseLabel() : null);
        resp.setResolvedAt(entity.getResolvedAt());
        if (entity.getResolvedBy() != null) {
            resp.setResolvedByName(entity.getResolvedBy().getFullName());
        }
        resp.setResolutionNote(entity.getResolutionNote());
        resp.setCreatedAt(entity.getCreatedAt());
        return resp;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getBookingId() {
        return bookingId;
    }

    public void setBookingId(UUID bookingId) {
        this.bookingId = bookingId;
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

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
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

    public String getVehiclePlate() {
        return vehiclePlate;
    }

    public void setVehiclePlate(String vehiclePlate) {
        this.vehiclePlate = vehiclePlate;
    }

    public BookingViolationType getViolationType() {
        return violationType;
    }

    public void setViolationType(BookingViolationType violationType) {
        this.violationType = violationType;
    }

    public String getViolationTypeLabelVi() {
        return violationTypeLabelVi;
    }

    public void setViolationTypeLabelVi(String violationTypeLabelVi) {
        this.violationTypeLabelVi = violationTypeLabelVi;
    }

    public Instant getScheduledDepartureTime() {
        return scheduledDepartureTime;
    }

    public void setScheduledDepartureTime(Instant scheduledDepartureTime) {
        this.scheduledDepartureTime = scheduledDepartureTime;
    }

    public Instant getViolationTimestamp() {
        return violationTimestamp;
    }

    public void setViolationTimestamp(Instant violationTimestamp) {
        this.violationTimestamp = violationTimestamp;
    }

    public int getGracePeriodMinutes() {
        return gracePeriodMinutes;
    }

    public void setGracePeriodMinutes(int gracePeriodMinutes) {
        this.gracePeriodMinutes = gracePeriodMinutes;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public BookingViolationStatus getResolutionStatus() {
        return resolutionStatus;
    }

    public void setResolutionStatus(BookingViolationStatus resolutionStatus) {
        this.resolutionStatus = resolutionStatus;
    }

    public String getResolutionStatusLabelVi() {
        return resolutionStatusLabelVi;
    }

    public void setResolutionStatusLabelVi(String resolutionStatusLabelVi) {
        this.resolutionStatusLabelVi = resolutionStatusLabelVi;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(Instant resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public String getResolvedByName() {
        return resolvedByName;
    }

    public void setResolvedByName(String resolvedByName) {
        this.resolvedByName = resolvedByName;
    }

    public String getResolutionNote() {
        return resolutionNote;
    }

    public void setResolutionNote(String resolutionNote) {
        this.resolutionNote = resolutionNote;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
