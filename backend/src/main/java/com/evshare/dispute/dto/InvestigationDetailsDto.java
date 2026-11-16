package com.evshare.dispute.dto;

import com.evshare.dispute.entity.InvestigationConclusion;

import java.time.Instant;
import java.util.UUID;

public record InvestigationDetailsDto(
        UUID disputeId,
        UUID bookingId,
        UUID tripId,
        String vehicleName,
        String licensePlate,

        // Previous User & Booking
        UUID previousUserId,
        String previousUserName,
        Instant scheduledReturnTime,
        Instant returnRequestTime,
        Instant actualTripEndTime,
        Instant staffReceivedTime,

        // Current / Affected User & Booking
        UUID affectedUserId,
        String affectedUserName,
        Instant affectedBookingStartTime,
        Instant affectedBookingEndTime,
        Instant affectedHandoverTime,

        // Calculation & Breakdown
        long userDelayMinutes,
        long operationalDelayMinutes,
        long totalDelayMinutes,
        boolean lateReturnDetected,
        String incidentSummary,
        InvestigationConclusion suggestedConclusion,
        InvestigationConclusion recordedConclusion,
        String recordedInvestigationNotes,
        Instant investigatedAt,
        String investigatedByName
) {}
