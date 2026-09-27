package com.evshare.damage.repository;

import com.evshare.damage.entity.DamageRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DamageRecordRepository extends JpaRepository<DamageRecord, UUID> {

    List<DamageRecord> findByTripIdOrderByCreatedAtDesc(UUID tripId);

    List<DamageRecord> findByVehicleIdOrderByCreatedAtDesc(UUID vehicleId);

    List<DamageRecord> findByBookingIdOrderByCreatedAtDesc(UUID bookingId);
}
