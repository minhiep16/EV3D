package com.evshare.notification.entity;

import com.evshare.user.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "id", length = 36, columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_user_id", nullable = false)
    private User recipient;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "vehicle_id", length = 36)
    private UUID vehicleId;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "group_id", length = 36)
    private UUID groupId;

    @Column(name = "entity_type", length = 50, nullable = false)
    private String entityType;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "entity_id", length = 36)
    private UUID entityId;

    @Column(name = "event_type", length = 80, nullable = false)
    private String eventType;

    @Column(name = "title", length = 255, nullable = false)
    private String title;

    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "severity", length = 30)
    private String severity = "INFO";

    @Column(name = "read_at")
    private Instant readAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public Notification() {
    }

    public Notification(UUID id, User recipient, UUID vehicleId, UUID groupId,
                        String entityType, UUID entityId, String eventType,
                        String title, String message, String severity) {
        this.id = id != null ? id : UUID.randomUUID();
        this.recipient = recipient;
        this.vehicleId = vehicleId;
        this.groupId = groupId;
        this.entityType = entityType;
        this.entityId = entityId;
        this.eventType = eventType;
        this.title = title;
        this.message = message;
        this.severity = severity != null ? severity : "INFO";
    }

    @PrePersist
    public void ensureId() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public User getRecipient() {
        return recipient;
    }

    public void setRecipient(User recipient) {
        this.recipient = recipient;
    }

    public UUID getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(UUID vehicleId) {
        this.vehicleId = vehicleId;
    }

    public UUID getGroupId() {
        return groupId;
    }

    public void setGroupId(UUID groupId) {
        this.groupId = groupId;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public UUID getEntityId() {
        return entityId;
    }

    public void setEntityId(UUID entityId) {
        this.entityId = entityId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public Instant getReadAt() {
        return readAt;
    }

    public void setReadAt(Instant readAt) {
        this.readAt = readAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isRead() {
        return this.readAt != null;
    }
}

