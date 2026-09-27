package com.evshare.damage.entity;

import com.evshare.booking.entity.Booking;
import com.evshare.handover.entity.VehicleHandover;
import com.evshare.trip.entity.Trip;
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
@Table(name = "damage_records")
public class DamageRecord {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "handover_id")
    private VehicleHandover handover;

    @Column(name = "vehicle_part_code", length = 50, nullable = false)
    private String vehiclePartCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "damage_type", length = 50, nullable = false)
    private DamageType damageType;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", length = 50, nullable = false)
    private DamageSeverity severity;

    @Column(name = "note", length = 1000)
    private String note;

    @Column(name = "local_position_x", precision = 10, scale = 4, nullable = false)
    private BigDecimal localPositionX;

    @Column(name = "local_position_y", precision = 10, scale = 4, nullable = false)
    private BigDecimal localPositionY;

    @Column(name = "local_position_z", precision = 10, scale = 4, nullable = false)
    private BigDecimal localPositionZ;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public DamageRecord() {
    }

    public DamageRecord(UUID id, Vehicle vehicle, Trip trip, Booking booking, VehicleHandover handover,
                        String vehiclePartCode, DamageType damageType, DamageSeverity severity, String note,
                        BigDecimal localPositionX, BigDecimal localPositionY, BigDecimal localPositionZ,
                        User createdBy) {
        this.id = id != null ? id : UUID.randomUUID();
        this.vehicle = vehicle;
        this.trip = trip;
        this.booking = booking;
        this.handover = handover;
        this.vehiclePartCode = vehiclePartCode;
        this.damageType = damageType;
        this.severity = severity;
        this.note = note;
        this.localPositionX = localPositionX;
        this.localPositionY = localPositionY;
        this.localPositionZ = localPositionZ;
        this.createdBy = createdBy;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public Trip getTrip() {
        return trip;
    }

    public void setTrip(Trip trip) {
        this.trip = trip;
    }

    public Booking getBooking() {
        return booking;
    }

    public void setBooking(Booking booking) {
        this.booking = booking;
    }

    public VehicleHandover getHandover() {
        return handover;
    }

    public void setHandover(VehicleHandover handover) {
        this.handover = handover;
    }

    public String getVehiclePartCode() {
        return vehiclePartCode;
    }

    public void setVehiclePartCode(String vehiclePartCode) {
        this.vehiclePartCode = vehiclePartCode;
    }

    public DamageType getDamageType() {
        return damageType;
    }

    public void setDamageType(DamageType damageType) {
        this.damageType = damageType;
    }

    public DamageSeverity getSeverity() {
        return severity;
    }

    public void setSeverity(DamageSeverity severity) {
        this.severity = severity;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public BigDecimal getLocalPositionX() {
        return localPositionX;
    }

    public void setLocalPositionX(BigDecimal localPositionX) {
        this.localPositionX = localPositionX;
    }

    public BigDecimal getLocalPositionY() {
        return localPositionY;
    }

    public void setLocalPositionY(BigDecimal localPositionY) {
        this.localPositionY = localPositionY;
    }

    public BigDecimal getLocalPositionZ() {
        return localPositionZ;
    }

    public void setLocalPositionZ(BigDecimal localPositionZ) {
        this.localPositionZ = localPositionZ;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
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
}
