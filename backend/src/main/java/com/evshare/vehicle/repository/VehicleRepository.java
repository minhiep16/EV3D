package com.evshare.vehicle.repository;

import com.evshare.vehicle.entity.Vehicle;
import com.evshare.vehicle.entity.VehicleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {

    @Query("SELECT v FROM Vehicle v WHERE v.status = :status")
    List<Vehicle> findByStatus(@Param("status") VehicleStatus status);

    boolean existsByLicensePlate(String licensePlate);

    boolean existsByLicensePlateIgnoreCase(String licensePlate);

    boolean existsByVin(String vin);

    boolean existsByVinIgnoreCase(String vin);

    Optional<Vehicle> findByLicensePlate(String licensePlate);

    Optional<Vehicle> findByLicensePlateIgnoreCase(String licensePlate);

    Optional<Vehicle> findByVin(String vin);

    Optional<Vehicle> findByVinIgnoreCase(String vin);
}
