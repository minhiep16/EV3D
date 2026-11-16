package com.evshare.notification.repository;

import com.evshare.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByRecipientIdOrderByCreatedAtDesc(UUID recipientUserId);

    long countByRecipientIdAndReadAtIsNull(UUID recipientUserId);

    Optional<Notification> findFirstByRecipientIdAndEventTypeAndEntityId(
            UUID recipientUserId, String eventType, UUID entityId);

    @Query("SELECT COUNT(n) > 0 FROM Notification n WHERE n.recipient.id = :recipientUserId AND n.entityId = :entityId AND n.eventType IN ('TRIP_RETURN_CONFIRMED', 'COMPLETED_TRIP_VIEWED') AND n.readAt IS NOT NULL")
    boolean isTripCompletionAcknowledged(@Param("recipientUserId") UUID recipientUserId, @Param("entityId") UUID entityId);

    @Query("SELECT n FROM Notification n WHERE n.recipient.id = :recipientUserId AND n.entityId = :entityId AND n.eventType IN ('TRIP_RETURN_CONFIRMED', 'COMPLETED_TRIP_VIEWED')")
    List<Notification> findTripCompletionNotifications(@Param("recipientUserId") UUID recipientUserId, @Param("entityId") UUID entityId);

    Optional<Notification> findFirstByRecipientIdAndEntityIdAndEventTypeIn(
            UUID recipientUserId, UUID entityId, List<String> eventTypes);

    @Modifying
    @Query("UPDATE Notification n SET n.readAt = :readAt WHERE n.recipient.id = :recipientUserId AND n.readAt IS NULL")
    int markAllAsReadForUser(@Param("recipientUserId") UUID recipientUserId, @Param("readAt") Instant readAt);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.id = :id AND n.recipient.id = :recipientUserId")
    int deleteByIdAndRecipientId(@Param("id") UUID id, @Param("recipientUserId") UUID recipientUserId);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.recipient.id = :recipientUserId AND n.readAt IS NOT NULL")
    int deleteAllReadForUser(@Param("recipientUserId") UUID recipientUserId);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.recipient.id = :recipientUserId")
    int deleteAllForUser(@Param("recipientUserId") UUID recipientUserId);
}

