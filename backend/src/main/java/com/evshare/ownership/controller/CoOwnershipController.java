package com.evshare.ownership.controller;

import com.evshare.ownership.dto.*;
import com.evshare.ownership.service.CoOwnershipService;
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
public class CoOwnershipController {

    private final CoOwnershipService coOwnershipService;

    public CoOwnershipController(CoOwnershipService coOwnershipService) {
        this.coOwnershipService = coOwnershipService;
    }

    // ==========================================
    // 1. Group Endpoints
    // ==========================================

    @GetMapping("/co-ownership-groups")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<CoOwnershipGroupResponse>> getAllGroups() {
        return ResponseEntity.ok(coOwnershipService.getAllGroups());
    }

    @GetMapping("/co-ownership-groups/{groupId}")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<CoOwnershipGroupResponse> getGroupById(@PathVariable UUID groupId) {
        return ResponseEntity.ok(coOwnershipService.getGroupById(groupId));
    }

    @PostMapping("/co-ownership-groups")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CoOwnershipGroupResponse> createGroup(
            @Valid @RequestBody CreateGroupRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        UUID createdBy = principal != null ? principal.getId() : null;
        CoOwnershipGroupResponse response = coOwnershipService.createGroup(request, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ==========================================
    // 2. Group Membership Endpoints
    // ==========================================

    @GetMapping("/co-ownership-groups/{groupId}/members")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<GroupMemberResponse>> getGroupMembers(@PathVariable UUID groupId) {
        return ResponseEntity.ok(coOwnershipService.getGroupMembers(groupId));
    }

    @PostMapping("/co-ownership-groups/{groupId}/members")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GroupMemberResponse> addMember(
            @PathVariable UUID groupId,
            @Valid @RequestBody AddMemberRequest request
    ) {
        GroupMemberResponse member = coOwnershipService.addMember(groupId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(member);
    }

    @PatchMapping("/co-ownership-groups/{groupId}/members/{memberId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GroupMemberResponse> updateMember(
            @PathVariable UUID groupId,
            @PathVariable UUID memberId,
            @Valid @RequestBody UpdateMemberRequest request
    ) {
        GroupMemberResponse updated = coOwnershipService.updateMember(groupId, memberId, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/co-ownership-groups/{groupId}/members/{memberId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID groupId,
            @PathVariable UUID memberId
    ) {
        coOwnershipService.removeMember(groupId, memberId);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // 3. Group Vehicle Endpoints
    // ==========================================

    @GetMapping("/co-ownership-groups/{groupId}/vehicles")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<GroupVehicleResponse>> getGroupVehicles(@PathVariable UUID groupId) {
        return ResponseEntity.ok(coOwnershipService.getGroupVehicles(groupId));
    }

    @PostMapping("/co-ownership-groups/{groupId}/vehicles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GroupVehicleResponse> addGroupVehicle(
            @PathVariable UUID groupId,
            @Valid @RequestBody AddGroupVehicleRequest request
    ) {
        GroupVehicleResponse gv = coOwnershipService.addVehicleToGroup(groupId, request.vehicleId());
        return ResponseEntity.status(HttpStatus.CREATED).body(gv);
    }

    @DeleteMapping("/co-ownership-groups/{groupId}/vehicles/{vehicleId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> removeGroupVehicle(
            @PathVariable UUID groupId,
            @PathVariable UUID vehicleId
    ) {
        coOwnershipService.removeVehicleFromGroup(groupId, vehicleId);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // 4. Ownership Share Endpoints
    // ==========================================

    @GetMapping("/co-ownership-groups/{groupId}/vehicles/{vehicleId}/ownership-shares")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<OwnershipShareResponse>> getOwnershipShares(
            @PathVariable UUID groupId,
            @PathVariable UUID vehicleId
    ) {
        return ResponseEntity.ok(coOwnershipService.getOwnershipShares(groupId, vehicleId));
    }

    @PutMapping("/co-ownership-groups/{groupId}/vehicles/{vehicleId}/ownership-shares")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OwnershipShareResponse> setVehicleShare(
            @PathVariable UUID groupId,
            @PathVariable UUID vehicleId,
            @Valid @RequestBody AssignShareRequest request
    ) {
        OwnershipShareResponse share = coOwnershipService.assignVehicleShare(groupId, vehicleId, request);
        return ResponseEntity.ok(share);
    }

    @PostMapping("/co-ownership-groups/{groupId}/vehicles/{vehicleId}/ownership-shares")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OwnershipShareResponse> assignVehicleShare(
            @PathVariable UUID groupId,
            @PathVariable UUID vehicleId,
            @Valid @RequestBody AssignShareRequest request
    ) {
        OwnershipShareResponse share = coOwnershipService.assignVehicleShare(groupId, vehicleId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(share);
    }

    // ==========================================
    // 5. Vehicle Co-ownership & Legacy Endpoints
    // ==========================================

    @GetMapping("/vehicles/{vehicleId}/co-ownership")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<CoOwnershipGroupResponse> getCoOwnershipByVehicleId(@PathVariable UUID vehicleId) {
        CoOwnershipGroupResponse response = coOwnershipService.getCoOwnershipByVehicleId(vehicleId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/vehicles/{vehicleId}/co-ownership")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CoOwnershipGroupResponse> createCoOwnershipGroup(
            @PathVariable UUID vehicleId,
            @Valid @RequestBody CreateGroupRequest request
    ) {
        CoOwnershipGroupResponse created = coOwnershipService.createCoOwnershipGroup(vehicleId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/co-ownership/{groupId}/members")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GroupMemberResponse> addMemberLegacy(
            @PathVariable UUID groupId,
            @Valid @RequestBody AddMemberRequest request
    ) {
        GroupMemberResponse member = coOwnershipService.addMember(groupId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(member);
    }

    @PostMapping("/co-ownership/{groupId}/shares")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OwnershipShareResponse> assignShareLegacy(
            @PathVariable UUID groupId,
            @Valid @RequestBody AssignShareRequest request
    ) {
        OwnershipShareResponse share = coOwnershipService.assignShare(groupId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(share);
    }

    @PatchMapping("/co-ownership/{groupId}/shares/{shareId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OwnershipShareResponse> updateShareLegacy(
            @PathVariable UUID groupId,
            @PathVariable UUID shareId,
            @Valid @RequestBody AssignShareRequest request
    ) {
        OwnershipShareResponse updated = coOwnershipService.updateShareById(groupId, shareId, request.percentage());
        return ResponseEntity.ok(updated);
    }
}
