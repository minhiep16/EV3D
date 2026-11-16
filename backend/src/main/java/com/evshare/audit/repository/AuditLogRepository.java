package com.evshare.audit.repository;

import com.evshare.audit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    @Query(value = "SELECT a FROM AuditLog a WHERE " +
            "(:action IS NULL OR a.action = :action) AND " +
            "(:resourceType IS NULL OR a.resourceType = :resourceType) AND " +
            "(:actorRole IS NULL OR a.actorRole = :actorRole) AND " +
            "(:fromTime IS NULL OR a.createdAt >= :fromTime) AND " +
            "(:toTime IS NULL OR a.createdAt <= :toTime) AND " +
            "(:search IS NULL OR :search = '' OR " +
            " LOWER(a.actorName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            " LOWER(a.actorEmail) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            " LOWER(a.description) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            " LOWER(a.resourceId) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "ORDER BY a.createdAt DESC",
            countQuery = "SELECT COUNT(a) FROM AuditLog a WHERE " +
            "(:action IS NULL OR a.action = :action) AND " +
            "(:resourceType IS NULL OR a.resourceType = :resourceType) AND " +
            "(:actorRole IS NULL OR a.actorRole = :actorRole) AND " +
            "(:fromTime IS NULL OR a.createdAt >= :fromTime) AND " +
            "(:toTime IS NULL OR a.createdAt <= :toTime) AND " +
            "(:search IS NULL OR :search = '' OR " +
            " LOWER(a.actorName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            " LOWER(a.actorEmail) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            " LOWER(a.description) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            " LOWER(a.resourceId) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<AuditLog> findWithFilters(
            @Param("action") String action,
            @Param("resourceType") String resourceType,
            @Param("actorRole") String actorRole,
            @Param("fromTime") Instant fromTime,
            @Param("toTime") Instant toTime,
            @Param("search") String search,
            Pageable pageable
    );
}
