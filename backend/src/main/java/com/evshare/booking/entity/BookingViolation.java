package com.evshare.booking.entity;

import com.evshare.user.entity.User;
import com.evshare.vehicle.entity.Vehicle;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "booking_violations")
public class BookingViolation {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Enumerated(EnumType.STRING)
    @Column(name = "violation_type", length = 40, nullable = false)
    private BookingViolationType violationType;

    @Column(name = "scheduled_departure_time", nullable = false)
    private Instant scheduledDepartureTime;

    @Column(name = "violation_timestamp", nullable = false)
    private Instant violationTimestamp;

    @Column(name = "grace_period_minutes", nullable = false)
    private int gracePeriodMinutes = 15;

    @Column(name = "reason", length = 500, nullable = false)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "resolution_status", length = 30, nullable = false)
    private BookingViolationStatus resolutionStatus = BookingViolationStatus.RECORDED;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by_id")
    private User resolvedBy;

    @Column(name = "resolution_note", length = 500)
    private String resolutionNote;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public BookingViolation() {
    }

    public BookingViolation(
            UUID id,
            Booking booking,
            User user,
            Vehicle vehicle,
            BookingViolationType violationType,
            Instant scheduledDepartureTime,
            Instant violationTimestamp,
            int gracePeriodMinutes,
            String reason,
            BookingViolationStatus resolutionStatus
    ) {
        this.id = id != null ? id : UUID.randomUUID();
        this.booking = booking;
        this.user = user;
        this.vehicle = vehicle;
        this.violationType = violationType;
        this.scheduledDepartureTime = scheduledDepartureTime;
        this.violationTimestamp = violationTimestamp;
        this.gracePeriodMinutes = gracePeriodMinutes;
        this.reason = reason;
        this.resolutionStatus = resolutionStatus != null ? resolutionStatus : BookingViolationStatus.RECORDED;
    }

    @PrePersist
    public void ensureId() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.violationTimestamp == null) {
            this.violationTimestamp = Instant.now();
        }
        if (this.resolutionStatus == null) {
            this.resolutionStatus = BookingViolationStatus.RECORDED;
        }
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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public BookingViolationType getViolationType() {
        return violationType;
    }

    public void setViolationType(BookingViolationType violationType) {
        this.violationType = violationType;
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

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(Instant resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public User getResolvedBy() {
        return resolvedBy;
    }

    public void setResolvedBy(User resolvedBy) {
        this.resolvedBy = resolvedBy;
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

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
