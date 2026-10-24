package com.evshare.ownership.repository;

import com.evshare.ownership.entity.OwnershipChangeHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OwnershipChangeHistoryRepository extends JpaRepository<OwnershipChangeHistory, UUID> {

    List<OwnershipChangeHistory> findByGroupIdOrderByEffectiveAtDesc(UUID groupId);

    List<OwnershipChangeHistory> findByVehicleIdOrderByEffectiveAtDesc(UUID vehicleId);

    List<OwnershipChangeHistory> findByTransferRequestId(UUID transferRequestId);
}
