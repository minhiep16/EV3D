package com.evshare.charging.repository;

import com.evshare.charging.entity.ChargingStation;
import com.evshare.charging.entity.ChargingStationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChargingStationRepository extends JpaRepository<ChargingStation, UUID> {

    Optional<ChargingStation> findByCode(String code);

    List<ChargingStation> findByStatus(ChargingStationStatus status);
}
