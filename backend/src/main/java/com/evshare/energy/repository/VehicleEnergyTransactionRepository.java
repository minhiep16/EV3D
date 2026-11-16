package com.evshare.energy.repository;

import com.evshare.energy.entity.EnergyTransactionType;
import com.evshare.energy.entity.VehicleEnergyTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VehicleEnergyTransactionRepository extends JpaRepository<VehicleEnergyTransaction, UUID> {

    List<VehicleEnergyTransaction> findByVehicleIdOrderByRecordedAtDesc(UUID vehicleId);

    List<VehicleEnergyTransaction> findByInventoryIdOrderByRecordedAtDesc(UUID inventoryId);

    boolean existsBySourceReferenceIdAndTransactionType(UUID sourceReferenceId, EnergyTransactionType transactionType);
}
