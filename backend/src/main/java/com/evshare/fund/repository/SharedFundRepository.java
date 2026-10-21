package com.evshare.fund.repository;

import com.evshare.fund.entity.SharedFund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface SharedFundRepository extends JpaRepository<SharedFund, UUID> {

    Optional<SharedFund> findByGroupId(UUID groupId);

    @Query("SELECT sf FROM SharedFund sf JOIN GroupVehicle gv ON gv.group.id = sf.group.id WHERE gv.vehicle.id = :vehicleId")
    Optional<SharedFund> findByVehicleId(@Param("vehicleId") UUID vehicleId);
}
