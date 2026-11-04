package com.evshare.notification.dto;

import com.evshare.notification.entity.Notification;

import java.time.Instant;
import java.util.UUID;

public class NotificationResponse {

    private UUID id;
    private UUID recipientUserId;
    private UUID vehicleId;
    private UUID groupId;
    private String entityType;
    private UUID entityId;
    private String eventType;
    private String title;
    private String message;
    private String severity;
    private Instant readAt;
    private Instant createdAt;
    private boolean isRead;

    public NotificationResponse() {
    }

    public static NotificationResponse fromEntity(Notification entity) {
        NotificationResponse dto = new NotificationResponse();
        dto.setId(entity.getId());
        dto.setRecipientUserId(entity.getRecipient() != null ? entity.getRecipient().getId() : null);
        dto.setVehicleId(entity.getVehicleId());
        dto.setGroupId(entity.getGroupId());
        dto.setEntityType(entity.getEntityType());
        dto.setEntityId(entity.getEntityId());
        dto.setEventType(entity.getEventType());
        dto.setTitle(entity.getTitle());
        dto.setMessage(entity.getMessage());
        dto.setSeverity(entity.getSeverity());
        dto.setReadAt(entity.getReadAt());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setRead(entity.isRead());
        return dto;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getRecipientUserId() {
        return recipientUserId;
    }

    public void setRecipientUserId(UUID recipientUserId) {
        this.recipientUserId = recipientUserId;
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
        return isRead;
    }

    public void setRead(boolean read) {
        isRead = read;
    }
}

