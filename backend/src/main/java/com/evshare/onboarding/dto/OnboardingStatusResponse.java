package com.evshare.onboarding.dto;

import com.evshare.vehicle.dto.VehicleResponse;

import java.util.List;

public record OnboardingStatusResponse(
        boolean hasActiveGroup,
        int activeVehiclesCount,
        List<VehicleResponse> activeVehicles,
        long pendingInvitationsCount,
        long pendingJoinRequestsCount,
        long draftsCount,
        String userRole,
        String primaryNavigationRoute
) {}

