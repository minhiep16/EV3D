package com.evshare.charging.service;

import com.evshare.battery.entity.VehicleBatteryHealth;
import com.evshare.battery.repository.VehicleBatteryHealthRepository;
import com.evshare.charging.entity.ChargingSession;
import com.evshare.charging.entity.ChargingSessionStatus;
import com.evshare.charging.entity.ChargingStation;
import com.evshare.charging.entity.ChargingStationStatus;
import com.evshare.charging.repository.ChargingSessionRepository;
import com.evshare.charging.repository.ChargingStationRepository;
import com.evshare.maintenance.entity.MaintenanceStatus;
import com.evshare.maintenance.repository.MaintenanceRequestRepository;
import com.evshare.trip.entity.TripStatus;
import com.evshare.trip.repository.TripRepository;
import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.entity.VehicleStatus;
import com.evshare.vehicle.repository.VehicleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Authoritative service for server-side time-based charging calculations and progression.
 * Calculates deterministic charging progress, energy delivered, and remaining time (ETA)
 * using elapsed server time, charger power, usable battery capacity, and charging efficiency.
 */
@Service
public class ChargingProgressService {

    private static final Logger log = LoggerFactory.getLogger(ChargingProgressService.class);

    /** Centralized charging efficiency (demo recommended: 0.90 - 0.95, set to 0.92) */
    public static final BigDecimal CHARGING_EFFICIENCY = new BigDecimal("0.92");

    /** Default usable battery capacity fallback (65.00 kWh) */
    public static final BigDecimal DEFAULT_USABLE_CAPACITY_KWH = new BigDecimal("65.00");

    /** Default charger power fallback (150.00 kW) */
    public static final BigDecimal DEFAULT_CHARGER_POWER_KW = new BigDecimal("150.00");

    public static final BigDecimal ONE_HUNDRED = new BigDecimal("100.00");
    public static final BigDecimal SECONDS_PER_HOUR = new BigDecimal("3600");
    public static final BigDecimal KM_PER_PERCENT_SOC = new BigDecimal("4.50");

    private final ChargingSessionRepository chargingSessionRepository;
    private final ChargingStationRepository chargingStationRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleBatteryHealthRepository batteryHealthRepository;
    private final MaintenanceRequestRepository maintenanceRequestRepository;
    private final TripRepository tripRepository;

    public ChargingProgressService(
            ChargingSessionRepository chargingSessionRepository,
            ChargingStationRepository chargingStationRepository,
            VehicleRepository vehicleRepository,
            VehicleBatteryHealthRepository batteryHealthRepository,
            MaintenanceRequestRepository maintenanceRequestRepository,
            TripRepository tripRepository
    ) {
        this.chargingSessionRepository = chargingSessionRepository;
        this.chargingStationRepository = chargingStationRepository;
        this.vehicleRepository = vehicleRepository;
        this.batteryHealthRepository = batteryHealthRepository;
        this.maintenanceRequestRepository = maintenanceRequestRepository;
        this.tripRepository = tripRepository;
    }

    /**
     * Resolves the authoritative usable battery capacity for a vehicle.
     * Preferred: VehicleBatteryHealth.usableCapacityKwh
     * Fallback 1: Vehicle.usableBatteryCapacityKwh
     * Fallback 2: VehicleBatteryHealth.capacityKwh
     * Fallback 3: Vehicle.batteryCapacity
     * Fallback 4: DEFAULT_USABLE_CAPACITY_KWH (65.00)
     */
    public BigDecimal resolveUsableCapacity(Vehicle vehicle) {
        if (vehicle == null) {
            return DEFAULT_USABLE_CAPACITY_KWH;
        }

        Optional<VehicleBatteryHealth> healthOpt = batteryHealthRepository.findByVehicleId(vehicle.getId());
        if (healthOpt.isPresent()) {
            VehicleBatteryHealth health = healthOpt.get();
            if (health.getUsableCapacityKwh() != null && health.getUsableCapacityKwh().compareTo(BigDecimal.ZERO) > 0) {
                return health.getUsableCapacityKwh();
            }
            if (health.getCapacityKwh() != null && health.getCapacityKwh().compareTo(BigDecimal.ZERO) > 0) {
                return health.getCapacityKwh();
            }
        }

        if (vehicle.getUsableBatteryCapacityKwh() != null && vehicle.getUsableBatteryCapacityKwh().compareTo(BigDecimal.ZERO) > 0) {
            return vehicle.getUsableBatteryCapacityKwh();
        }

        if (vehicle.getBatteryCapacity() != null && vehicle.getBatteryCapacity().compareTo(BigDecimal.ZERO) > 0) {
            return vehicle.getBatteryCapacity();
        }

        return DEFAULT_USABLE_CAPACITY_KWH;
    }

    /**
     * Deterministic, isolated pure calculation of charging progress using server elapsed time.
     * All calculations strictly use BigDecimal and immutable startSocPercent snapshot.
     */
    public ChargingProgressResult calculateProgress(ChargingSession session, Instant now, BigDecimal usableCapacityKwh) {
        BigDecimal usableCapacity = (usableCapacityKwh != null && usableCapacityKwh.compareTo(BigDecimal.ZERO) > 0)
                ? usableCapacityKwh
                : DEFAULT_USABLE_CAPACITY_KWH;

        Instant startedAt = session.getStartedAt();
        if (startedAt == null) {
            startedAt = session.getCreatedAt() != null ? session.getCreatedAt() : now;
        }

        BigDecimal startSoc = session.getStartSocPercent() != null
                ? session.getStartSocPercent()
                : (session.getCurrentSocPercent() != null ? session.getCurrentSocPercent() : BigDecimal.ZERO);

        BigDecimal targetSoc = session.getTargetSocPercent() != null
                ? session.getTargetSocPercent()
                : ONE_HUNDRED;

        BigDecimal powerKw = session.getPowerKw() != null && session.getPowerKw().compareTo(BigDecimal.ZERO) > 0
                ? session.getPowerKw()
                : (session.getChargingStation() != null && session.getChargingStation().getMaxPowerKw() != null
                    ? session.getChargingStation().getMaxPowerKw()
                    : DEFAULT_CHARGER_POWER_KW);

        BigDecimal effectivePowerKw = powerKw.multiply(CHARGING_EFFICIENCY);

        long elapsedSeconds = 0L;
        if (now != null && startedAt != null && now.isAfter(startedAt)) {
            elapsedSeconds = Duration.between(startedAt, now).getSeconds();
        }
        BigDecimal elapsedHours = BigDecimal.valueOf(Math.max(0L, elapsedSeconds))
                .divide(SECONDS_PER_HOUR, 8, RoundingMode.HALF_UP);

        BigDecimal deltaSocToTarget = targetSoc.subtract(startSoc).max(BigDecimal.ZERO);
        BigDecimal maxEnergyNeededKwh = deltaSocToTarget.multiply(usableCapacity)
                .divide(ONE_HUNDRED, 4, RoundingMode.HALF_UP);

        BigDecimal rawEnergyDelivered = effectivePowerKw.multiply(elapsedHours)
                .setScale(4, RoundingMode.HALF_UP);

        // Clamp energy delivered so it does not exceed energy needed to reach target
        BigDecimal clampedEnergyDelivered = rawEnergyDelivered.min(maxEnergyNeededKwh).max(BigDecimal.ZERO);

        BigDecimal socGainPercent = usableCapacity.compareTo(BigDecimal.ZERO) > 0
                ? clampedEnergyDelivered.divide(usableCapacity, 6, RoundingMode.HALF_UP).multiply(ONE_HUNDRED)
                : BigDecimal.ZERO;

        BigDecimal calculatedSoc = startSoc.add(socGainPercent);
        BigDecimal clampedSoc = calculatedSoc.min(targetSoc).min(ONE_HUNDRED).setScale(2, RoundingMode.HALF_UP);
        BigDecimal finalEnergyDelivered = clampedEnergyDelivered.setScale(2, RoundingMode.HALF_UP);

        boolean isTargetReached = calculatedSoc.compareTo(targetSoc) >= 0;

        // Deterministic completion instant based on exact energy needed
        Instant completionInstant = now != null ? now : Instant.now();
        if (isTargetReached && effectivePowerKw.compareTo(BigDecimal.ZERO) > 0 && maxEnergyNeededKwh.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal hoursNeeded = maxEnergyNeededKwh.divide(effectivePowerKw, 8, RoundingMode.HALF_UP);
            long secondsNeeded = hoursNeeded.multiply(SECONDS_PER_HOUR).setScale(0, RoundingMode.HALF_UP).longValue();
            Instant exactFinishedAt = startedAt.plusSeconds(secondsNeeded);
            if (now != null && !exactFinishedAt.isAfter(now)) {
                completionInstant = exactFinishedAt;
            }
        }

        // ETA calculation using the unified effective power model
        Integer remainingMinutes = null;
        if (!isTargetReached) {
            BigDecimal remainingEnergyKwh = targetSoc.subtract(clampedSoc).max(BigDecimal.ZERO)
                    .multiply(usableCapacity)
                    .divide(ONE_HUNDRED, 4, RoundingMode.HALF_UP);

            if (effectivePowerKw.compareTo(BigDecimal.ZERO) > 0 && remainingEnergyKwh.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal remMinutesExact = remainingEnergyKwh.divide(effectivePowerKw, 6, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(60));
                remainingMinutes = Math.max(1, remMinutesExact.setScale(0, RoundingMode.HALF_UP).intValue());
            } else {
                remainingMinutes = 0;
            }
        } else {
            remainingMinutes = 0;
        }

        return new ChargingProgressResult(
                calculatedSoc.setScale(2, RoundingMode.HALF_UP),
                clampedSoc,
                finalEnergyDelivered,
                remainingMinutes,
                isTargetReached,
                completionInstant
        );
    }

    /**
     * Atomically recalculates session progress against current server time and persists changes.
     * If target SOC is reached, automatically transitions session to COMPLETED, frees the station,
     * updates vehicle battery level and lifecycle status.
     */
    @Transactional
    public ChargingSession syncSession(ChargingSession session, Instant now) {
        if (session == null || session.getStatus() != ChargingSessionStatus.ACTIVE) {
            return session;
        }

        Vehicle vehicle = session.getVehicle();
        BigDecimal usableCapacity = resolveUsableCapacity(vehicle);
        ChargingProgressResult result = calculateProgress(session, now, usableCapacity);

        if (result.isTargetReached()) {
            log.info("Charging session {} reached target SOC {}%. Auto-completing session.",
                    session.getId(), session.getTargetSocPercent());

            session.setStatus(ChargingSessionStatus.COMPLETED);
            session.setCurrentSocPercent(session.getTargetSocPercent());
            session.setEnergyDeliveredKwh(result.getEnergyDeliveredKwh());
            session.setEndedAt(result.getCompletionInstant());
            session.setCompletionReason("Đạt mức pin mục tiêu " + session.getTargetSocPercent() + "%");

            ChargingStation station = session.getChargingStation();
            if (station != null) {
                station.setStatus(ChargingStationStatus.AVAILABLE);
                chargingStationRepository.save(station);
            }

            if (vehicle != null) {
                vehicle.setCurrentBatteryLevel(session.getTargetSocPercent().intValue());
                recalculateVehicleStatus(vehicle);
                updateBatteryHealthEstimate(vehicle, session.getTargetSocPercent());
            }

            return chargingSessionRepository.save(session);
        } else {
            session.setCurrentSocPercent(result.getClampedSocPercent());
            session.setEnergyDeliveredKwh(result.getEnergyDeliveredKwh());

            if (vehicle != null) {
                vehicle.setCurrentBatteryLevel(result.getClampedSocPercent().intValue());
                vehicleRepository.save(vehicle);
                updateBatteryHealthEstimate(vehicle, result.getClampedSocPercent());
            }

            return chargingSessionRepository.save(session);
        }
    }

    /**
     * Synchronizes active charging session for vehicle if one exists.
     */
    @Transactional
    public Optional<ChargingSession> syncActiveSessionForVehicle(UUID vehicleId) {
        if (vehicleId == null) {
            return Optional.empty();
        }
        Optional<ChargingSession> sessionOpt = chargingSessionRepository
                .findFirstByVehicleIdAndStatusOrderByStartedAtDesc(vehicleId, ChargingSessionStatus.ACTIVE);
        if (sessionOpt.isPresent()) {
            ChargingSession synced = syncSession(sessionOpt.get(), Instant.now());
            return Optional.of(synced);
        }
        return Optional.empty();
    }

    /**
     * Calculates remaining charging minutes for active session using unified model.
     */
    public Integer calculateRemainingMinutes(ChargingSession session) {
        if (session == null || session.getStatus() != ChargingSessionStatus.ACTIVE) {
            return 0;
        }
        Vehicle vehicle = session.getVehicle();
        BigDecimal usableCapacity = resolveUsableCapacity(vehicle);
        ChargingProgressResult result = calculateProgress(session, Instant.now(), usableCapacity);
        return result.getEstimatedRemainingMinutes();
    }

    /**
     * Recalculates vehicle operational status based on active maintenance or trips.
     */
    public void recalculateVehicleStatus(Vehicle vehicle) {
        if (vehicle == null) return;
        boolean hasActiveMaintenance = maintenanceRequestRepository.existsByVehicleIdAndStatus(
                vehicle.getId(),
                MaintenanceStatus.IN_PROGRESS
        );
        boolean hasActiveTrip = tripRepository.existsByVehicleIdAndStatus(
                vehicle.getId(),
                TripStatus.ACTIVE
        );

        if (hasActiveMaintenance) {
            vehicle.setStatus(VehicleStatus.MAINTENANCE);
        } else if (hasActiveTrip) {
            vehicle.setStatus(VehicleStatus.IN_USE);
        } else {
            vehicle.setStatus(VehicleStatus.AVAILABLE);
        }
        vehicleRepository.save(vehicle);
    }

    /**
     * Updates estimated range on VehicleBatteryHealth to maintain consistent technical telemetry.
     */
    public void updateBatteryHealthEstimate(Vehicle vehicle, BigDecimal currentSoc) {
        if (vehicle == null || currentSoc == null) return;
        Optional<VehicleBatteryHealth> healthOpt = batteryHealthRepository.findByVehicleId(vehicle.getId());
        if (healthOpt.isPresent()) {
            VehicleBatteryHealth health = healthOpt.get();
            BigDecimal estimatedKm = currentSoc.multiply(KM_PER_PERCENT_SOC).setScale(2, RoundingMode.HALF_UP);
            health.setEstimatedRangeKm(estimatedKm);
            batteryHealthRepository.save(health);
        }
    }

    public static class ChargingProgressResult {
        private final BigDecimal calculatedSocPercent;
        private final BigDecimal clampedSocPercent;
        private final BigDecimal energyDeliveredKwh;
        private final Integer estimatedRemainingMinutes;
        private final boolean targetReached;
        private final Instant completionInstant;

        public ChargingProgressResult(
                BigDecimal calculatedSocPercent,
                BigDecimal clampedSocPercent,
                BigDecimal energyDeliveredKwh,
                Integer estimatedRemainingMinutes,
                boolean targetReached,
                Instant completionInstant
        ) {
            this.calculatedSocPercent = calculatedSocPercent;
            this.clampedSocPercent = clampedSocPercent;
            this.energyDeliveredKwh = energyDeliveredKwh;
            this.estimatedRemainingMinutes = estimatedRemainingMinutes;
            this.targetReached = targetReached;
            this.completionInstant = completionInstant;
        }

        public BigDecimal getCalculatedSocPercent() {
            return calculatedSocPercent;
        }

        public BigDecimal getClampedSocPercent() {
            return clampedSocPercent;
        }

        public BigDecimal getEnergyDeliveredKwh() {
            return energyDeliveredKwh;
        }

        public Integer getEstimatedRemainingMinutes() {
            return estimatedRemainingMinutes;
        }

        public boolean isTargetReached() {
            return targetReached;
        }

        public Instant getCompletionInstant() {
            return completionInstant;
        }
    }
}
