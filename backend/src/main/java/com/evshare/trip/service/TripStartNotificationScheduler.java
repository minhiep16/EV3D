package com.evshare.trip.service;

import com.evshare.booking.entity.Booking;
import com.evshare.booking.entity.BookingStatus;
import com.evshare.booking.repository.BookingRepository;
import com.evshare.notification.service.NotificationService;
import com.evshare.trip.repository.TripRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Scheduled job to notify co-owners when their authorized trip start time arrives.
 * Complies with Section 6 of EVShare 3D lifecycle notification architecture.
 */
@Component
public class TripStartNotificationScheduler {

    private static final Logger log = LoggerFactory.getLogger(TripStartNotificationScheduler.class);

    private final BookingRepository bookingRepository;
    private final TripRepository tripRepository;
    private final NotificationService notificationService;

    public TripStartNotificationScheduler(
            BookingRepository bookingRepository,
            TripRepository tripRepository,
            NotificationService notificationService
    ) {
        this.bookingRepository = bookingRepository;
        this.tripRepository = tripRepository;
        this.notificationService = notificationService;
    }

    /**
     * Check every minute for upcoming bookings whose authorized start time has arrived
     * (within the configured early tolerance window) where the trip has not yet started.
     */
    @Scheduled(fixedDelay = 60000, initialDelay = 15000)
    public void checkAndNotifyUpcomingTrips() {
        if (bookingRepository == null || notificationService == null) {
            return;
        }

        Instant now = Instant.now();
        Instant windowEnd = now.plus(Duration.ofMinutes(TripService.START_WINDOW_EARLY_TOLERANCE_MINUTES));

        try {
            List<Booking> candidates = bookingRepository.findAll().stream()
                    .filter(b -> b.getStatus() == BookingStatus.CONFIRMED)
                    .filter(b -> b.getStartTime() != null && !b.getStartTime().isAfter(windowEnd))
                    .filter(b -> b.getEndTime() != null && b.getEndTime().isAfter(now))
                    .filter(b -> tripRepository == null || !tripRepository.existsByBookingId(b.getId()))
                    .toList();

            for (Booking booking : candidates) {
                notificationService.notifyTripStartWindowOpened(booking.getId());
            }
        } catch (Exception ex) {
            log.error("Error in TripStartNotificationScheduler: {}", ex.getMessage(), ex);
        }
    }
}

