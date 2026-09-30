package com.evshare.battery.repository;

import com.evshare.battery.entity.VehicleBatteryHealth;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VehicleBatteryHealthRepository extends JpaRepository<VehicleBatteryHealth, UUID> {

    Optional<VehicleBatteryHealth> findByVehicleId(UUID vehicleId);

    boolean existsByVehicleId(UUID vehicleId);
}
