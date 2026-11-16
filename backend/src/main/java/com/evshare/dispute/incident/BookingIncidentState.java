package com.evshare.dispute.incident;

/**
 * Conceptual states for event-driven booking return delay incidents.
 * An incident is NOT yet a formal dispute.
 */
public enum BookingIncidentState {
    /**
     * Return not verified and delay exceeds grace period, with upcoming booking in queue.
     */
    POTENTIAL_CONFLICT,

    /**
     * Driver has requested vehicle return, awaiting staff inspection and receipt verification.
     */
    AWAITING_CONFIRMATION,

    /**
     * Next scheduled booking window has opened or passed, and vehicle remains unreturned / unverified.
     */
    CONFIRMED_IMPACT,

    /**
     * Incident resolved or vehicle verified returned before blocking the subsequent booking.
     */
    CLEARED
}
