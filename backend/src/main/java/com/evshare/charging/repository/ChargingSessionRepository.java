package com.evshare.charging.repository;

import com.evshare.charging.entity.ChargingSession;
import com.evshare.charging.entity.ChargingSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChargingSessionRepository extends JpaRepository<ChargingSession, UUID> {

    Optional<ChargingSession> findFirstByVehicleIdAndStatusOrderByStartedAtDesc(
            UUID vehicleId,
            ChargingSessionStatus status
    );

    Optional<ChargingSession> findFirstByVehicleIdAndStatusInOrderByCreatedAtDesc(
            UUID vehicleId,
            List<ChargingSessionStatus> statuses
    );

    Optional<ChargingSession> findFirstByChargingStationIdAndStatus(
            UUID stationId,
            ChargingSessionStatus status
    );

    boolean existsByVehicleIdAndStatus(UUID vehicleId, ChargingSessionStatus status);

    boolean existsByChargingStationIdAndStatus(UUID stationId, ChargingSessionStatus status);

    List<ChargingSession> findByVehicleIdOrderByCreatedAtDesc(UUID vehicleId);

    List<ChargingSession> findByStatus(ChargingSessionStatus status);
}
