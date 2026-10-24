package com.evshare.ownership.entity;

import com.evshare.user.entity.User;
import com.evshare.vehicle.entity.Vehicle;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.domain.Persistable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ownership_change_history")
public class OwnershipChangeHistory implements Persistable<UUID> {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @Transient
    private boolean isNew = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private CoOwnershipGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transfer_request_id")
    private OwnershipTransferRequest transferRequest;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "from_user_id")
    private User fromUser;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "to_user_id", nullable = false)
    private User toUser;

    @Column(name = "transferred_percentage", precision = 5, scale = 2, nullable = false)
    private BigDecimal transferredPercentage;

    @Column(name = "previous_ownership_snapshot", columnDefinition = "TEXT", nullable = false)
    private String previousOwnershipSnapshot;

    @Column(name = "new_ownership_snapshot", columnDefinition = "TEXT", nullable = false)
    private String newOwnershipSnapshot;

    @Column(name = "reason", length = 255)
    private String reason;

    @Column(name = "effective_at", nullable = false)
    private Instant effectiveAt;

    @CreationTimestamp
    @Column(name = "recorded_at", updatable = false)
    private Instant recordedAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recorded_by_user_id", nullable = false)
    private User recordedByUser;

    public OwnershipChangeHistory() {
    }

    public OwnershipChangeHistory(
            UUID id,
            CoOwnershipGroup group,
            Vehicle vehicle,
            OwnershipTransferRequest transferRequest,
            User fromUser,
            User toUser,
            BigDecimal transferredPercentage,
            String previousOwnershipSnapshot,
            String newOwnershipSnapshot,
            String reason,
            Instant effectiveAt,
            User recordedByUser
    ) {
        this.id = id != null ? id : UUID.randomUUID();
        this.group = group;
        this.vehicle = vehicle;
        this.transferRequest = transferRequest;
        this.fromUser = fromUser;
        this.toUser = toUser;
        this.transferredPercentage = transferredPercentage;
        this.previousOwnershipSnapshot = previousOwnershipSnapshot;
        this.newOwnershipSnapshot = newOwnershipSnapshot;
        this.reason = reason;
        this.effectiveAt = effectiveAt != null ? effectiveAt : Instant.now();
        this.recordedByUser = recordedByUser;
        this.isNew = true;
    }

    @Override
    public UUID getId() {
        return id;
    }

    @Override
    public boolean isNew() {
        return isNew;
    }

    @PostLoad
    @PostPersist
    void markNotNew() {
        this.isNew = false;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public CoOwnershipGroup getGroup() {
        return group;
    }

    public void setGroup(CoOwnershipGroup group) {
        this.group = group;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public OwnershipTransferRequest getTransferRequest() {
        return transferRequest;
    }

    public void setTransferRequest(OwnershipTransferRequest transferRequest) {
        this.transferRequest = transferRequest;
    }

    public User getFromUser() {
        return fromUser;
    }

    public void setFromUser(User fromUser) {
        this.fromUser = fromUser;
    }

    public User getToUser() {
        return toUser;
    }

    public void setToUser(User toUser) {
        this.toUser = toUser;
    }

    public BigDecimal getTransferredPercentage() {
        return transferredPercentage;
    }

    public void setTransferredPercentage(BigDecimal transferredPercentage) {
        this.transferredPercentage = transferredPercentage;
    }

    public String getPreviousOwnershipSnapshot() {
        return previousOwnershipSnapshot;
    }

    public void setPreviousOwnershipSnapshot(String previousOwnershipSnapshot) {
        this.previousOwnershipSnapshot = previousOwnershipSnapshot;
    }

    public String getNewOwnershipSnapshot() {
        return newOwnershipSnapshot;
    }

    public void setNewOwnershipSnapshot(String newOwnershipSnapshot) {
        this.newOwnershipSnapshot = newOwnershipSnapshot;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Instant getEffectiveAt() {
        return effectiveAt;
    }

    public void setEffectiveAt(Instant effectiveAt) {
        this.effectiveAt = effectiveAt;
    }

    public Instant getRecordedAt() {
        return recordedAt;
    }

    public void setRecordedAt(Instant recordedAt) {
        this.recordedAt = recordedAt;
    }

    public User getRecordedByUser() {
        return recordedByUser;
    }

    public void setRecordedByUser(User recordedByUser) {
        this.recordedByUser = recordedByUser;
    }
}
