package com.evshare.contract.repository;

import com.evshare.contract.entity.CoOwnershipContract;
import com.evshare.contract.entity.ContractStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CoOwnershipContractRepository extends JpaRepository<CoOwnershipContract, UUID> {

    Optional<CoOwnershipContract> findByGroupId(UUID groupId);

    Optional<CoOwnershipContract> findByVehicleId(UUID vehicleId);

    Optional<CoOwnershipContract> findByContractCode(String contractCode);

    List<CoOwnershipContract> findByStatus(ContractStatus status);

    @Query("SELECT c FROM CoOwnershipContract c WHERE c.vehicle.id = :vehicleId")
    Optional<CoOwnershipContract> findActiveContractByVehicleId(@Param("vehicleId") UUID vehicleId);
}
