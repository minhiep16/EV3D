package com.evshare.charging.repository;

import com.evshare.charging.entity.ChargingSession;
import com.evshare.charging.entity.ChargingSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChargingSessionRepository extends JpaRepository<ChargingSession, UUID> {

        Optional<ChargingSession> findFirstByVehicleIdAndStatusOrderByStartedAtDesc(
                        UUID vehicleId,
                        ChargingSessionStatus status);

        Optional<ChargingSession> findFirstByVehicleIdAndStatusInOrderByCreatedAtDesc(
                        UUID vehicleId,
                        List<ChargingSessionStatus> statuses);

        Optional<ChargingSession> findFirstByChargingStationIdAndStatus(
                        UUID stationId,
                        ChargingSessionStatus status);

        boolean existsByVehicleIdAndStatus(UUID vehicleId, ChargingSessionStatus status);

        boolean existsByChargingStationIdAndStatus(UUID stationId, ChargingSessionStatus status);

    @Query("SELECT cs FROM ChargingSession cs WHERE cs.vehicle.id = :vehicleId")
    List<ChargingSession> findByVehicleId(@Param("vehicleId") UUID vehicleId);

        List<ChargingSession> findByVehicleIdOrderByCreatedAtDesc(UUID vehicleId);

        List<ChargingSession> findByStatus(ChargingSessionStatus status);

        long countByStatus(ChargingSessionStatus status);

    @Query("SELECT cs FROM ChargingSession cs WHERE cs.vehicle.id = :vehicleId AND cs.status = com.evshare.charging.entity.ChargingSessionStatus.COMPLETED AND cs.startedAt >= :start AND cs.startedAt < :end ORDER BY cs.startedAt ASC")
    List<ChargingSession> findCompletedSessionsByVehicleInPeriod(
            @Param("vehicleId") UUID vehicleId,
            @Param("start") Instant start,
            @Param("end") Instant end
    );
}
