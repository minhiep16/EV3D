package com.evshare.ownership.controller;

import com.evshare.ownership.dto.*;
import com.evshare.ownership.service.CoOwnershipService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api")
public class CoOwnershipController {

    private final CoOwnershipService coOwnershipService;

    public CoOwnershipController(CoOwnershipService coOwnershipService) {
        this.coOwnershipService = coOwnershipService;
    }

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
    public ResponseEntity<GroupMemberResponse> addMember(
            @PathVariable UUID groupId,
            @Valid @RequestBody AddMemberRequest request
    ) {
        GroupMemberResponse member = coOwnershipService.addMember(groupId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(member);
    }

    @PostMapping("/co-ownership/{groupId}/shares")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OwnershipShareResponse> assignShare(
            @PathVariable UUID groupId,
            @Valid @RequestBody AssignShareRequest request
    ) {
        OwnershipShareResponse share = coOwnershipService.assignShare(groupId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(share);
    }

    @PatchMapping("/co-ownership/{groupId}/shares/{shareId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OwnershipShareResponse> updateShare(
            @PathVariable UUID groupId,
            @PathVariable UUID shareId,
            @Valid @RequestBody AssignShareRequest request
    ) {
        OwnershipShareResponse updated = coOwnershipService.updateShareById(groupId, shareId, request.percentage());
        return ResponseEntity.ok(updated);
    }
}
