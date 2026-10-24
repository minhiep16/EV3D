package com.evshare.ownership.repository;

import com.evshare.ownership.entity.OwnershipTransferRequest;
import com.evshare.ownership.entity.TransferStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OwnershipTransferRequestRepository extends JpaRepository<OwnershipTransferRequest, UUID> {

    List<OwnershipTransferRequest> findByGroupIdOrderByCreatedAtDesc(UUID groupId);

    List<OwnershipTransferRequest> findByVehicleIdOrderByCreatedAtDesc(UUID vehicleId);

    List<OwnershipTransferRequest> findByToUserIdAndStatusInOrderByCreatedAtDesc(UUID toUserId, Collection<TransferStatus> statuses);

    List<OwnershipTransferRequest> findByToUserIdOrderByCreatedAtDesc(UUID toUserId);

    List<OwnershipTransferRequest> findByFromUserIdOrderByCreatedAtDesc(UUID fromUserId);

    @Query("SELECT r FROM OwnershipTransferRequest r WHERE r.fromUser.id = :fromUserId AND r.status IN :statuses")
    List<OwnershipTransferRequest> findByFromUserIdAndStatusIn(@Param("fromUserId") UUID fromUserId, @Param("statuses") Collection<TransferStatus> statuses);

    @Query("SELECT r FROM OwnershipTransferRequest r WHERE r.group.id = :groupId AND r.status IN :statuses")
    List<OwnershipTransferRequest> findByGroupIdAndStatusIn(@Param("groupId") UUID groupId, @Param("statuses") Collection<TransferStatus> statuses);

    @Query("SELECT COALESCE(SUM(r.transferPercentage), 0) FROM OwnershipTransferRequest r " +
           "WHERE r.fromUser.id = :fromUserId AND r.group.id = :groupId " +
           "AND r.status IN ('PENDING_ACCEPTANCE', 'PENDING_APPROVAL', 'APPROVED', 'PENDING_CONTRACT')")
    BigDecimal sumPendingTransferPercentageByFromUserAndGroup(@Param("fromUserId") UUID fromUserId, @Param("groupId") UUID groupId);

    @Query("SELECT r FROM OwnershipTransferRequest r WHERE r.contractVersion.id = :versionId ORDER BY r.createdAt DESC")
    List<OwnershipTransferRequest> findByContractVersionId(@Param("versionId") UUID versionId);
}
