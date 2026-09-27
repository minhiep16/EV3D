package com.evshare.damage.dto;

import com.evshare.damage.entity.DamageRecord;
import com.evshare.damage.entity.DamageSeverity;
import com.evshare.damage.entity.DamageType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class DamageRecordResponse {

    private UUID id;
    private UUID vehicleId;
    private UUID tripId;
    private UUID bookingId;
    private UUID handoverId;
    private String vehiclePartCode;
    private DamageType damageType;
    private DamageSeverity severity;
    private String note;
    private BigDecimal localPositionX;
    private BigDecimal localPositionY;
    private BigDecimal localPositionZ;
    private UUID createdByUserId;
    private String createdByName;
    private Instant createdAt;

    public DamageRecordResponse() {
    }

    public static DamageRecordResponse fromEntity(DamageRecord record) {
        if (record == null) return null;
        DamageRecordResponse res = new DamageRecordResponse();
        res.setId(record.getId());
        res.setVehicleId(record.getVehicle() != null ? record.getVehicle().getId() : null);
        res.setTripId(record.getTrip() != null ? record.getTrip().getId() : null);
        res.setBookingId(record.getBooking() != null ? record.getBooking().getId() : null);
        res.setHandoverId(record.getHandover() != null ? record.getHandover().getId() : null);
        res.setVehiclePartCode(record.getVehiclePartCode());
        res.setDamageType(record.getDamageType());
        res.setSeverity(record.getSeverity());
        res.setNote(record.getNote());
        res.setLocalPositionX(record.getLocalPositionX());
        res.setLocalPositionY(record.getLocalPositionY());
        res.setLocalPositionZ(record.getLocalPositionZ());
        if (record.getCreatedBy() != null) {
            res.setCreatedByUserId(record.getCreatedBy().getId());
            res.setCreatedByName(record.getCreatedBy().getFullName());
        }
        res.setCreatedAt(record.getCreatedAt());
        return res;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(UUID vehicleId) {
        this.vehicleId = vehicleId;
    }

    public UUID getTripId() {
        return tripId;
    }

    public void setTripId(UUID tripId) {
        this.tripId = tripId;
    }

    public UUID getBookingId() {
        return bookingId;
    }

    public void setBookingId(UUID bookingId) {
        this.bookingId = bookingId;
    }

    public UUID getHandoverId() {
        return handoverId;
    }

    public void setHandoverId(UUID handoverId) {
        this.handoverId = handoverId;
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

    public UUID getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(UUID createdByUserId) {
        this.createdByUserId = createdByUserId;
    }

    public String getCreatedByName() {
        return createdByName;
    }

    public void setCreatedByName(String createdByName) {
        this.createdByName = createdByName;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
