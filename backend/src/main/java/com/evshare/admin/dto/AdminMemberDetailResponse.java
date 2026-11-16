package com.evshare.admin.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AdminMemberDetailResponse(
        UUID memberId,
        UUID userId,
        String fullName,
        String email,
        String memberRole,
        String memberStatus,
        Instant joinedAt,
        BigDecimal ownershipPercentage,
        long totalBookings,
        long totalTrips,
        Double totalDistanceKm,
        Double totalDrivingHours,
        long pendingTransfersCount,
        boolean contractSigned,
        BigDecimal requiredFinancialShare,
        BigDecimal paidFinancialAmount,
        BigDecimal outstandingBalance
) {
}
