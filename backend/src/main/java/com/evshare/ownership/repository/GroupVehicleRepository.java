package com.evshare.ownership.repository;

import com.evshare.ownership.entity.GroupVehicle;
import com.evshare.ownership.entity.GroupVehicleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GroupVehicleRepository extends JpaRepository<GroupVehicle, UUID> {
    List<GroupVehicle> findByGroupId(UUID groupId);
    List<GroupVehicle> findByVehicleId(UUID vehicleId);
    Optional<GroupVehicle> findByGroupIdAndVehicleId(UUID groupId, UUID vehicleId);
    boolean existsByGroupIdAndVehicleId(UUID groupId, UUID vehicleId);
    void deleteByGroupIdAndVehicleId(UUID groupId, UUID vehicleId);
    List<GroupVehicle> findByGroupIdAndStatus(UUID groupId, GroupVehicleStatus status);
    List<GroupVehicle> findByVehicleIdAndStatus(UUID vehicleId, GroupVehicleStatus status);
    boolean existsByVehicleIdAndStatus(UUID vehicleId, GroupVehicleStatus status);
}
