package com.evshare.dispute.incident;

import com.evshare.dispute.entity.DisputeCategory;
import com.evshare.dispute.entity.DisputePriority;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Pre-filled dispute data presented to the impacted co-owner.
 * Clearly separates system evidence from the user's personal claims.
 */
public record PrefilledDisputeDto(
        UUID vehicleId,
        String vehicleName,
        String vehiclePlate,
        DisputeCategory category,
        DisputePriority priority,
        String suggestedTitle,
        String suggestedDescription,
        String systemEvidenceSummary,
        UUID bookingId,
        UUID tripId,
        UUID handoverId,
        List<UUID> respondentUserIds,
        String incidentReference,
        Instant detectedAt,
        String objectiveTimelineText
) {
}
