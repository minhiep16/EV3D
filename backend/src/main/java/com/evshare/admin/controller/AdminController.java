package com.evshare.admin.controller;

import com.evshare.admin.dto.*;
import com.evshare.admin.service.AdminService;
import com.evshare.audit.dto.AuditLogResponse;
import com.evshare.audit.service.AuditLogService;
import com.evshare.security.UserPrincipal;
import com.evshare.user.entity.Role;
import com.evshare.user.entity.UserStatus;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final AuditLogService auditLogService;

    public AdminController(AdminService adminService, AuditLogService auditLogService) {
        this.adminService = adminService;
        this.auditLogService = auditLogService;
    }

    /**
     * Phase 3.1: Live Authoritative Administration Dashboard Statistics
     * GET /api/admin/dashboard/stats
     */
    @GetMapping("/dashboard/stats")
    public ResponseEntity<AdminDashboardStatsResponse> getDashboardStats(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(adminService.getDashboardStats(principal));
    }

    /**
     * Phase 3.2: User Accounts Listing & Filtering
     * GET /api/admin/users
     */
    @GetMapping("/users")
    public ResponseEntity<Page<AdminUserResponse>> getUsers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(adminService.getUsers(query, role, status, pageable, principal));
    }

    /**
     * Phase 3.2: Update User Status (Activate / Suspend / Deactivate)
     * PATCH /api/admin/users/{userId}/status
     */
    @PatchMapping("/users/{userId}/status")
    public ResponseEntity<AdminUserResponse> updateUserStatus(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserStatusRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest servletRequest
    ) {
        return ResponseEntity.ok(adminService.updateUserStatus(userId, request, principal, servletRequest));
    }

    /**
     * Phase 3.2: Update User System Role
     * PATCH /api/admin/users/{userId}/role
     */
    @PatchMapping("/users/{userId}/role")
    public ResponseEntity<AdminUserResponse> updateUserRole(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserRoleRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest servletRequest
    ) {
        return ResponseEntity.ok(adminService.updateUserRole(userId, request, principal, servletRequest));
    }

    /**
     * Phase 3.5: Centralized System Audit Logs Review
     * GET /api/admin/audit-logs
     */
    @GetMapping("/audit-logs")
    public ResponseEntity<Page<AuditLogResponse>> getAuditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String actorRole,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fromTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant toTime,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size
    ) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(auditLogService.getAuditLogs(action, resourceType, actorRole, fromTime, toTime, search, pageable));
    }

    /**
     * Phase 3: Read-only Financial Supervision Overview
     * GET /api/admin/financial/overview
     */
    @GetMapping("/financial/overview")
    public ResponseEntity<AdminFinancialOverviewResponse> getFinancialOverview(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(adminService.getFinancialOverview(principal));
    }

    /**
     * Phase 3: Detailed Read-only Member Inspection
     * GET /api/admin/groups/{groupId}/members/{memberId}/inspection
     */
    @GetMapping("/groups/{groupId}/members/{memberId}/inspection")
    public ResponseEntity<AdminMemberDetailResponse> getMemberInspection(
            @PathVariable UUID groupId,
            @PathVariable UUID memberId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(adminService.getMemberInspectionDetail(groupId, memberId, principal));
    }
}
