package com.evshare.ownership.repository;

import com.evshare.ownership.entity.CoOwnershipGroup;
import com.evshare.ownership.entity.GroupStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CoOwnershipGroupRepository extends JpaRepository<CoOwnershipGroup, UUID> {
    Optional<CoOwnershipGroup> findByVehicleId(UUID vehicleId);
    boolean existsByVehicleId(UUID vehicleId);

    @Query("SELECT DISTINCT g FROM CoOwnershipGroup g JOIN g.groupVehicles gv WHERE gv.vehicle.id = :vehicleId AND gv.status = 'ACTIVE' AND g.status = 'ACTIVE'")
    List<CoOwnershipGroup> findActiveGroupsByVehicleId(@Param("vehicleId") UUID vehicleId);

    @Query("SELECT DISTINCT g FROM CoOwnershipGroup g JOIN g.members m WHERE m.user.id = :userId AND m.status = 'ACTIVE' AND g.status = 'ACTIVE'")
    List<CoOwnershipGroup> findActiveGroupsByUserId(@Param("userId") UUID userId);

    List<CoOwnershipGroup> findByStatus(GroupStatus status);
}
