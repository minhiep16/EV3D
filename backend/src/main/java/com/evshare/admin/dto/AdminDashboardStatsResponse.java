package com.evshare.admin.dto;

public record AdminDashboardStatsResponse(
        long registeredUsersCount,
        long activeUsersCount,
        long suspendedUsersCount,
        long inactiveUsersCount,
        long staffUsersCount,
        long coOwnerUsersCount,
        long adminUsersCount,
        long vehiclesCount,
        long ownershipGroupsCount,
        long activeBookingsCount,
        long activeTripsCount,
        long chargingSessionsCount,
        long pendingVehicleRegistrationsCount,
        long pendingMembershipRequestsCount,
        long pendingPaymentVerificationsCount,
        long activeMaintenanceCount,
        long activeDisputesCount
) {
}
