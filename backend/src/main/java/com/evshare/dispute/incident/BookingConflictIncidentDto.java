package com.evshare.dispute.incident;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Data transfer object representing an auto-detected booking return conflict incident.
 */
public record BookingConflictIncidentDto(
        String incidentId,
        BookingIncidentState state,
        UUID vehicleId,
        String vehicleName,
        String vehiclePlate,

        // Previous Booking / Driver Context (Access-safe)
        UUID previousBookingId,
        UUID previousBookingUserId,
        String previousBookingUserDisplay,
        Instant previousBookingStartTime,
        Instant previousBookingEndTime,

        // Impacted Booking Context
        UUID impactedBookingId,
        UUID impactedBookingUserId,
        String impactedBookingUserDisplay,
        Instant impactedBookingStartTime,
        Instant impactedBookingEndTime,

        // Operational Status & Measurements
        UUID previousTripId,
        String previousTripStatus,
        Instant returnRequestedAt,
        Instant returnVerifiedAt,
        Instant handoverStaffHandedOverAt,
        long delayMinutes,
        Instant detectedAt,

        // Chronological Evidence Timeline
        List<IncidentTimelineEvent> timelineEvents,

        // Pre-filled dispute form preparation
        PrefilledDisputeDto prefilledDispute,

        // Formal dispute cross-reference if already filed
        boolean hasFormalDispute,
        UUID formalDisputeId,
        String formalDisputeReference
) {
}
