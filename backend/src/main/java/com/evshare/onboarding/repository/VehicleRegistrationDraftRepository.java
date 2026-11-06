package com.evshare.onboarding.repository;

import com.evshare.onboarding.entity.DraftStatus;
import com.evshare.onboarding.entity.VehicleRegistrationDraft;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VehicleRegistrationDraftRepository extends JpaRepository<VehicleRegistrationDraft, UUID> {
    List<VehicleRegistrationDraft> findByUserIdOrderByUpdatedAtDesc(UUID userId);
    List<VehicleRegistrationDraft> findByUserIdAndStatus(UUID userId, DraftStatus status);
    Optional<VehicleRegistrationDraft> findByIdAndUserId(UUID id, UUID userId);
    long countByUserIdAndStatus(UUID userId, DraftStatus status);

    List<VehicleRegistrationDraft> findByStatusInOrderByUpdatedAtDesc(Collection<DraftStatus> statuses);
    List<VehicleRegistrationDraft> findByStatusNotOrderByUpdatedAtDesc(DraftStatus excludedStatus);

    boolean existsByLicensePlateIgnoreCaseAndStatusInAndIdNot(String licensePlate, Collection<DraftStatus> statuses, UUID excludeId);
    boolean existsByVinIgnoreCaseAndStatusInAndIdNot(String vin, Collection<DraftStatus> statuses, UUID excludeId);

    boolean existsByLicensePlateIgnoreCaseAndStatusInAndUserIdNot(String licensePlate, Collection<DraftStatus> statuses, UUID excludeUserId);
    boolean existsByVinIgnoreCaseAndStatusInAndUserIdNot(String vin, Collection<DraftStatus> statuses, UUID excludeUserId);

    List<VehicleRegistrationDraft> findByLicensePlateIgnoreCaseOrderByUpdatedAtDesc(String licensePlate);
    List<VehicleRegistrationDraft> findByVinIgnoreCaseOrderByUpdatedAtDesc(String vin);

    Optional<VehicleRegistrationDraft> findFirstByCreatedGroupIdOrderByUpdatedAtDesc(UUID createdGroupId);
    Optional<VehicleRegistrationDraft> findFirstByCreatedVehicleIdOrderByUpdatedAtDesc(UUID createdVehicleId);
}

