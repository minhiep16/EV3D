package com.evshare.handover.entity;

import com.evshare.booking.entity.Booking;
import com.evshare.user.entity.User;
import com.evshare.vehicle.entity.Vehicle;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "vehicle_handovers")
public class VehicleHandover {

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
    @JoinColumn(name = "staff_id")
    private User staff;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "co_owner_id", nullable = false)
    private User coOwner;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private HandoverStatus status = HandoverStatus.PENDING_PREPARATION;

    @Column(name = "staff_prepared_at")
    private Instant staffPreparedAt;

    @Column(name = "staff_handed_over_at")
    private Instant staffHandedOverAt;

    @Column(name = "owner_received_at")
    private Instant ownerReceivedAt;

    @Column(name = "owner_condition_acknowledged_at")
    private Instant ownerConditionAcknowledgedAt;

    @OneToMany(mappedBy = "handover", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VehicleInspection> inspections = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public VehicleHandover() {
    }

    public VehicleHandover(UUID id, Booking booking, Vehicle vehicle, User staff, User coOwner, HandoverStatus status) {
        this.id = id != null ? id : UUID.randomUUID();
        this.booking = booking;
        this.vehicle = vehicle;
        this.staff = staff;
        this.coOwner = coOwner;
        this.status = status != null ? status : HandoverStatus.PENDING_PREPARATION;
    }

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
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

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public User getStaff() {
        return staff;
    }

    public void setStaff(User staff) {
        this.staff = staff;
    }

    public User getCoOwner() {
        return coOwner;
    }

    public void setCoOwner(User coOwner) {
        this.coOwner = coOwner;
    }

    public HandoverStatus getStatus() {
        return status;
    }

    public void setStatus(HandoverStatus status) {
        this.status = status;
    }

    public Instant getStaffPreparedAt() {
        return staffPreparedAt;
    }

    public void setStaffPreparedAt(Instant staffPreparedAt) {
        this.staffPreparedAt = staffPreparedAt;
    }

    public Instant getStaffHandedOverAt() {
        return staffHandedOverAt;
    }

    public void setStaffHandedOverAt(Instant staffHandedOverAt) {
        this.staffHandedOverAt = staffHandedOverAt;
    }

    public Instant getOwnerReceivedAt() {
        return ownerReceivedAt;
    }

    public void setOwnerReceivedAt(Instant ownerReceivedAt) {
        this.ownerReceivedAt = ownerReceivedAt;
    }

    public Instant getOwnerConditionAcknowledgedAt() {
        return ownerConditionAcknowledgedAt;
    }

    public void setOwnerConditionAcknowledgedAt(Instant ownerConditionAcknowledgedAt) {
        this.ownerConditionAcknowledgedAt = ownerConditionAcknowledgedAt;
    }

    public List<VehicleInspection> getInspections() {
        return inspections;
    }

    public void setInspections(List<VehicleInspection> inspections) {
        this.inspections = inspections;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
