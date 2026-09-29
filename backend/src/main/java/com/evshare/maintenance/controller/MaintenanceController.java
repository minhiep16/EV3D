package com.evshare.maintenance.controller;

import com.evshare.common.exception.UnauthorizedException;
import com.evshare.maintenance.dto.CastMaintenanceVoteRequest;
import com.evshare.maintenance.dto.CompleteMaintenanceRequest;
import com.evshare.maintenance.dto.CreateMaintenanceRequest;
import com.evshare.maintenance.dto.MaintenanceApprovalResponse;
import com.evshare.maintenance.dto.MaintenanceResponse;
import com.evshare.maintenance.dto.ScheduleMaintenanceRequest;
import com.evshare.maintenance.service.MaintenanceService;
import com.evshare.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    public MaintenanceController(MaintenanceService maintenanceService) {
        this.maintenanceService = maintenanceService;
    }

    /**
     * Get all maintenance requests for a vehicle.
     * STAFF & ADMIN can view all; CO_OWNER can view only for their authorized vehicle.
     */
    @GetMapping("/vehicles/{vehicleId}/maintenance")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'CO_OWNER')")
    public ResponseEntity<List<MaintenanceResponse>> getVehicleMaintenance(
            @PathVariable UUID vehicleId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để xem thông tin bảo dưỡng");
        }

        List<MaintenanceResponse> list = maintenanceService.getVehicleMaintenance(vehicleId, principal);
        return ResponseEntity.ok(list);
    }

    /**
     * Get a single maintenance request by ID.
     */
    @GetMapping("/maintenance/{maintenanceId}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'CO_OWNER')")
    public ResponseEntity<MaintenanceResponse> getMaintenanceById(
            @PathVariable UUID maintenanceId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để xem thông tin bảo dưỡng");
        }

        MaintenanceResponse response = maintenanceService.getMaintenanceById(maintenanceId, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Get approval summary and votes for a maintenance request.
     */
    @GetMapping("/maintenance/{maintenanceId}/approval")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'CO_OWNER')")
    public ResponseEntity<MaintenanceApprovalResponse> getMaintenanceApproval(
            @PathVariable UUID maintenanceId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để xem thông tin phê duyệt bảo dưỡng");
        }

        MaintenanceApprovalResponse response = maintenanceService.getMaintenanceApproval(maintenanceId, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Cast or update a vote on a maintenance request (CO_OWNER only).
     */
    @PostMapping("/maintenance/{maintenanceId}/votes")
    @PreAuthorize("hasRole('CO_OWNER')")
    public ResponseEntity<MaintenanceApprovalResponse> castMaintenanceVote(
            @PathVariable UUID maintenanceId,
            @Valid @RequestBody CastMaintenanceVoteRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để biểu quyết");
        }

        MaintenanceApprovalResponse response = maintenanceService.castVote(maintenanceId, request, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Create a new maintenance request for a vehicle (STAFF / ADMIN).
     */
    @PostMapping("/vehicles/{vehicleId}/maintenance")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<MaintenanceResponse> createMaintenance(
            @PathVariable UUID vehicleId,
            @Valid @RequestBody CreateMaintenanceRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để tạo yêu cầu bảo dưỡng");
        }

        MaintenanceResponse response = maintenanceService.createMaintenance(
                vehicleId,
                request,
                principal.getId(),
                principal.getUser().getRole()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Schedule a maintenance request. Supports both POST and PATCH.
     */
    @RequestMapping(value = "/maintenance/{maintenanceId}/schedule", method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<MaintenanceResponse> scheduleMaintenance(
            @PathVariable UUID maintenanceId,
            @Valid @RequestBody ScheduleMaintenanceRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để lên lịch bảo dưỡng");
        }

        MaintenanceResponse response = maintenanceService.scheduleMaintenance(
                maintenanceId,
                request,
                principal.getId(),
                principal.getUser().getRole()
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Start maintenance work.
     */
    @PostMapping("/maintenance/{maintenanceId}/start")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<MaintenanceResponse> startMaintenance(
            @PathVariable UUID maintenanceId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để bắt đầu bảo dưỡng");
        }

        MaintenanceResponse response = maintenanceService.startMaintenance(
                maintenanceId,
                principal.getId(),
                principal.getUser().getRole()
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Complete maintenance work.
     */
    @PostMapping("/maintenance/{maintenanceId}/complete")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<MaintenanceResponse> completeMaintenance(
            @PathVariable UUID maintenanceId,
            @RequestBody(required = false) CompleteMaintenanceRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để hoàn tất bảo dưỡng");
        }

        MaintenanceResponse response = maintenanceService.completeMaintenance(
                maintenanceId,
                request,
                principal.getId(),
                principal.getUser().getRole()
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Cancel a maintenance request.
     */
    @PostMapping("/maintenance/{maintenanceId}/cancel")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<MaintenanceResponse> cancelMaintenance(
            @PathVariable UUID maintenanceId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null || principal.getUser() == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để hủy yêu cầu bảo dưỡng");
        }

        MaintenanceResponse response = maintenanceService.cancelMaintenance(
                maintenanceId,
                principal.getId(),
                principal.getUser().getRole()
        );

        return ResponseEntity.ok(response);
    }
}
