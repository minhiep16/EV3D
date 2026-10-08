package com.evshare.trip.entity;

import com.evshare.booking.entity.Booking;
import com.evshare.user.entity.User;
import com.evshare.vehicle.entity.Vehicle;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "trips")
public class Trip {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private TripStatus status = TripStatus.ACTIVE;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "start_odometer", precision = 10, scale = 2, nullable = false)
    private BigDecimal startOdometer;

    @Column(name = "end_odometer", precision = 10, scale = 2)
    private BigDecimal endOdometer;

    @Column(name = "start_battery_level", nullable = false)
    private Integer startBatteryLevel;

    @Column(name = "end_battery_level")
    private Integer endBatteryLevel;

    @Column(name = "end_soc_percent", precision = 5, scale = 2)
    private BigDecimal endSocPercent;

    @Column(name = "energy_consumed_kwh", precision = 8, scale = 3)
    private BigDecimal energyConsumedKwh;

    @Column(name = "soc_consumed_percent", precision = 5, scale = 2)
    private BigDecimal socConsumedPercent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "return_verified_by_user_id")
    private User returnVerifiedBy;

    @Column(name = "return_verified_at")
    private Instant returnVerifiedAt;

    @Column(name = "return_note", length = 500)
    private String returnNote;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public Trip() {
    }

    public Trip(UUID id, Booking booking, Vehicle vehicle, User user, TripStatus status,
                Instant startedAt, BigDecimal startOdometer, Integer startBatteryLevel) {
        this.id = id != null ? id : UUID.randomUUID();
        this.booking = booking;
        this.vehicle = vehicle;
        this.user = user;
        this.status = status != null ? status : TripStatus.ACTIVE;
        this.startedAt = startedAt != null ? startedAt : Instant.now();
        this.startOdometer = startOdometer;
        this.startBatteryLevel = startBatteryLevel;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Booking getBooking() {
        return booking;
    }

    public void setBooking(Booking booking) {
        this.booking = booking;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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

    public BigDecimal getEndSocPercent() {
        return endSocPercent;
    }

    public void setEndSocPercent(BigDecimal endSocPercent) {
        this.endSocPercent = endSocPercent;
    }

    public BigDecimal getEnergyConsumedKwh() {
        return energyConsumedKwh;
    }

    public void setEnergyConsumedKwh(BigDecimal energyConsumedKwh) {
        this.energyConsumedKwh = energyConsumedKwh;
    }

    public BigDecimal getSocConsumedPercent() {
        return socConsumedPercent;
    }

    public void setSocConsumedPercent(BigDecimal socConsumedPercent) {
        this.socConsumedPercent = socConsumedPercent;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public User getReturnVerifiedBy() {
        return returnVerifiedBy;
    }

    public void setReturnVerifiedBy(User returnVerifiedBy) {
        this.returnVerifiedBy = returnVerifiedBy;
    }

    public Instant getReturnVerifiedAt() {
        return returnVerifiedAt;
    }

    public void setReturnVerifiedAt(Instant returnVerifiedAt) {
        this.returnVerifiedAt = returnVerifiedAt;
    }

    public String getReturnNote() {
        return returnNote;
    }

    public void setReturnNote(String returnNote) {
        this.returnNote = returnNote;
    }
}
