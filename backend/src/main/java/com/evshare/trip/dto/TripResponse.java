package com.evshare.trip.dto;

import com.evshare.trip.entity.Trip;
import com.evshare.trip.entity.TripStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class TripResponse {

    private UUID id;
    private UUID bookingId;
    private UUID vehicleId;
    private String vehicleName;
    private UUID userId;
    private String userName;
    private String userEmail;
    private TripStatus status;
    private Instant startedAt;
    private Instant endedAt;
    private BigDecimal startOdometer;
    private BigDecimal endOdometer;
    private Integer startBatteryLevel;
    private Integer endBatteryLevel;
    private Instant bookingStartTime;
    private Instant bookingEndTime;
    private String bookingPurpose;
    private String licensePlate;
    private String vehicleCode;
    private Instant createdAt;
    private Instant updatedAt;

    public TripResponse() {
    }

    public static TripResponse fromEntity(Trip trip) {
        if (trip == null) return null;
        TripResponse res = new TripResponse();
        res.setId(trip.getId());
        if (trip.getBooking() != null) {
            res.setBookingId(trip.getBooking().getId());
            res.setBookingStartTime(trip.getBooking().getStartTime());
            res.setBookingEndTime(trip.getBooking().getEndTime());
            res.setBookingPurpose(trip.getBooking().getPurpose());
        }
        if (trip.getVehicle() != null) {
            res.setVehicleId(trip.getVehicle().getId());
            res.setVehicleName(trip.getVehicle().getName());
            res.setLicensePlate(trip.getVehicle().getLicensePlate());
            res.setVehicleCode("EV01");
        }
        if (trip.getUser() != null) {
            res.setUserId(trip.getUser().getId());
            res.setUserName(trip.getUser().getFullName());
            res.setUserEmail(trip.getUser().getEmail());
        }
        res.setStatus(trip.getStatus());
        res.setStartedAt(trip.getStartedAt());
        res.setEndedAt(trip.getEndedAt());
        res.setStartOdometer(trip.getStartOdometer());
        res.setEndOdometer(trip.getEndOdometer());
        res.setStartBatteryLevel(trip.getStartBatteryLevel());
        res.setEndBatteryLevel(trip.getEndBatteryLevel());
        res.setCreatedAt(trip.getCreatedAt());
        res.setUpdatedAt(trip.getUpdatedAt());
        return res;
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

    public TripStatus getStatus() {
        return status;
    }

    public void setStatus(TripStatus status) {
        this.status = status;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(Instant endedAt) {
        this.endedAt = endedAt;
    }

    public BigDecimal getStartOdometer() {
        return startOdometer;
    }

    public void setStartOdometer(BigDecimal startOdometer) {
        this.startOdometer = startOdometer;
    }

    public BigDecimal getEndOdometer() {
        return endOdometer;
    }

    public void setEndOdometer(BigDecimal endOdometer) {
        this.endOdometer = endOdometer;
    }

    public Integer getStartBatteryLevel() {
        return startBatteryLevel;
    }

    public void setStartBatteryLevel(Integer startBatteryLevel) {
        this.startBatteryLevel = startBatteryLevel;
    }

    public Integer getEndBatteryLevel() {
        return endBatteryLevel;
    }

    public void setEndBatteryLevel(Integer endBatteryLevel) {
        this.endBatteryLevel = endBatteryLevel;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
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

    public String getBookingPurpose() {
        return bookingPurpose;
    }

    public void setBookingPurpose(String bookingPurpose) {
        this.bookingPurpose = bookingPurpose;
    }

    public String getLicensePlate() {
        return licensePlate;
    }

    public void setLicensePlate(String licensePlate) {
        this.licensePlate = licensePlate;
    }

    public String getVehicleCode() {
        return vehicleCode;
    }

    public void setVehicleCode(String vehicleCode) {
        this.vehicleCode = vehicleCode;
    }
}
