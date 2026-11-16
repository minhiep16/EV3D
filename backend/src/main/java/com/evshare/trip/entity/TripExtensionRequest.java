package com.evshare.trip.entity;

import com.evshare.booking.entity.Booking;
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
@Table(name = "trip_extension_requests")
public class TripExtensionRequest {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_booking_id", nullable = false)
    private Booking currentBooking;

    @Column(name = "original_end_time", nullable = false)
    private Instant originalEndTime;

    @Column(name = "proposed_end_time", nullable = false)
    private Instant proposedEndTime;

    @Column(name = "additional_minutes", nullable = false)
    private Integer additionalMinutes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "affected_booking_id")
    private Booking affectedBooking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "affected_owner_id")
    private User affectedOwner;

    @Column(name = "proposed_affected_start_time")
    private Instant proposedAffectedStartTime;

    @Column(name = "reason", length = 500)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private TripExtensionStatus status = TripExtensionStatus.PENDING;

    @Column(name = "response_deadline", nullable = false)
    private Instant responseDeadline;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public TripExtensionRequest() {
    }

    public TripExtensionRequest(UUID id, Trip trip, Vehicle vehicle, User requester,
                                Booking currentBooking, Instant originalEndTime,
                                Instant proposedEndTime, Integer additionalMinutes,
                                Booking affectedBooking, User affectedOwner,
                                Instant proposedAffectedStartTime, String reason,
                                Instant responseDeadline) {
        this.id = id != null ? id : UUID.randomUUID();
        this.trip = trip;
        this.vehicle = vehicle;
        this.requester = requester;
        this.currentBooking = currentBooking;
        this.originalEndTime = originalEndTime;
        this.proposedEndTime = proposedEndTime;
        this.additionalMinutes = additionalMinutes;
        this.affectedBooking = affectedBooking;
        this.affectedOwner = affectedOwner;
        this.proposedAffectedStartTime = proposedAffectedStartTime;
        this.reason = reason;
        this.responseDeadline = responseDeadline;
        this.status = TripExtensionStatus.PENDING;
    }

    @PrePersist
    public void ensureId() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.status == null) {
            this.status = TripExtensionStatus.PENDING;
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Trip getTrip() {
        return trip;
    }

    public void setTrip(Trip trip) {
        this.trip = trip;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public User getRequester() {
        return requester;
    }

    public void setRequester(User requester) {
        this.requester = requester;
    }

    public Booking getCurrentBooking() {
        return currentBooking;
    }

    public void setCurrentBooking(Booking currentBooking) {
        this.currentBooking = currentBooking;
    }

    public Instant getOriginalEndTime() {
        return originalEndTime;
    }

    public void setOriginalEndTime(Instant originalEndTime) {
        this.originalEndTime = originalEndTime;
    }

    public Instant getProposedEndTime() {
        return proposedEndTime;
    }

    public void setProposedEndTime(Instant proposedEndTime) {
        this.proposedEndTime = proposedEndTime;
    }

    public Integer getAdditionalMinutes() {
        return additionalMinutes;
    }

    public void setAdditionalMinutes(Integer additionalMinutes) {
        this.additionalMinutes = additionalMinutes;
    }

    public Booking getAffectedBooking() {
        return affectedBooking;
    }

    public void setAffectedBooking(Booking affectedBooking) {
        this.affectedBooking = affectedBooking;
    }

    public User getAffectedOwner() {
        return affectedOwner;
    }

    public void setAffectedOwner(User affectedOwner) {
        this.affectedOwner = affectedOwner;
    }

    public Instant getProposedAffectedStartTime() {
        return proposedAffectedStartTime;
    }

    public void setProposedAffectedStartTime(Instant proposedAffectedStartTime) {
        this.proposedAffectedStartTime = proposedAffectedStartTime;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public TripExtensionStatus getStatus() {
        return status;
    }

    public void setStatus(TripExtensionStatus status) {
        this.status = status;
    }

    public Instant getResponseDeadline() {
        return responseDeadline;
    }

    public void setResponseDeadline(Instant responseDeadline) {
        this.responseDeadline = responseDeadline;
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
