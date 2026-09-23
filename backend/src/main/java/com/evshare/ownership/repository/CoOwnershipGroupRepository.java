package com.evshare.ownership.repository;

import com.evshare.ownership.entity.CoOwnershipGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CoOwnershipGroupRepository extends JpaRepository<CoOwnershipGroup, UUID> {
    Optional<CoOwnershipGroup> findByVehicleId(UUID vehicleId);
    boolean existsByVehicleId(UUID vehicleId);
}
