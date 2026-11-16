package com.evshare.dispute.incident;

import java.time.Instant;

/**
 * Immutable chronological evidence event recorded for an incident.
 */
public record IncidentTimelineEvent(
        Instant timestamp,
        String eventType,
        String description,
        String source,
        boolean isSystemEvidence
) {
    public static IncidentTimelineEvent system(Instant timestamp, String eventType, String description, String source) {
        return new IncidentTimelineEvent(timestamp, eventType, description, source, true);
    }

    public static IncidentTimelineEvent partyClaim(Instant timestamp, String eventType, String description, String source) {
        return new IncidentTimelineEvent(timestamp, eventType, description, source, false);
    }
}
