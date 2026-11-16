package com.evshare.onboarding.dto;

import com.evshare.vehicle.dto.VehicleResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record OnboardingStatusResponse(
        boolean hasActiveGroup,
        int activeVehiclesCount,
        List<VehicleResponse> activeVehicles,
        long pendingInvitationsCount,
        long pendingJoinRequestsCount,
        long draftsCount,
        String userRole,
        String primaryNavigationRoute,
        UUID joinedVehicleId,
        String joinedVehicleName,
        String joinedVehicleModel,
        String joinedLicensePlate,
        String joinedExteriorColor,
        BigDecimal ownershipPercentage,
        String contractStatus,
        String groupName,
        Integer contractVersionNumber
) {
    public OnboardingStatusResponse(
            boolean hasActiveGroup,
            int activeVehiclesCount,
            List<VehicleResponse> activeVehicles,
            long pendingInvitationsCount,
            long pendingJoinRequestsCount,
            long draftsCount,
            String userRole,
            String primaryNavigationRoute
    ) {
        this(hasActiveGroup, activeVehiclesCount, activeVehicles, pendingInvitationsCount,
                pendingJoinRequestsCount, draftsCount, userRole, primaryNavigationRoute,
                null, null, null, null, null, null, null, null, null);
    }
}
