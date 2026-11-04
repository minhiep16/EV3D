package com.evshare.onboarding.repository;

import com.evshare.onboarding.entity.GroupDiscoverySetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GroupDiscoverySettingRepository extends JpaRepository<GroupDiscoverySetting, UUID> {
    List<GroupDiscoverySetting> findByIsDiscoverableTrue();

    @Query("SELECT gds FROM GroupDiscoverySetting gds WHERE gds.isDiscoverable = true AND (:query IS NULL OR :query = '' OR LOWER(gds.targetModel) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(gds.publicTerms) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<GroupDiscoverySetting> searchDiscoverable(@Param("query") String query);
}

