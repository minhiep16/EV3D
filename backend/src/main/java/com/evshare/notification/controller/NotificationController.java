package com.evshare.notification.controller;

import com.evshare.notification.dto.NotificationResponse;
import com.evshare.notification.service.NotificationService;
import com.evshare.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(notificationService.getNotificationsForUser(principal));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal principal) {
        long count = notificationService.getUnreadCount(principal);
        return ResponseEntity.ok(Collections.singletonMap("count", count));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(notificationService.markAsRead(id, principal));
    }

    @PostMapping("/read-all")
    public ResponseEntity<Map<String, Integer>> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal principal) {
        int updated = notificationService.markAllAsRead(principal);
        return ResponseEntity.ok(Collections.singletonMap("updatedCount", updated));
    }

    @DeleteMapping("/read")
    public ResponseEntity<Map<String, Integer>> deleteAllReadNotifications(
            @AuthenticationPrincipal UserPrincipal principal) {
        int deleted = notificationService.deleteAllReadNotifications(principal);
        return ResponseEntity.ok(Collections.singletonMap("deletedCount", deleted));
    }

    @DeleteMapping("/all")
    public ResponseEntity<Map<String, Integer>> deleteAllNotifications(
            @AuthenticationPrincipal UserPrincipal principal) {
        int deleted = notificationService.deleteAllNotifications(principal);
        return ResponseEntity.ok(Collections.singletonMap("deletedCount", deleted));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteNotification(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.deleteNotification(id, principal);
        return ResponseEntity.ok(Collections.singletonMap("message", "Đã xóa thông báo thành công"));
    }
}

