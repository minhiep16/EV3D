package com.evshare.contract.repository;

import com.evshare.contract.entity.CoOwnershipContractVersion;
import com.evshare.contract.entity.ContractVersionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CoOwnershipContractVersionRepository extends JpaRepository<CoOwnershipContractVersion, UUID> {

    List<CoOwnershipContractVersion> findByContractIdOrderByVersionNumberDesc(UUID contractId);

    Optional<CoOwnershipContractVersion> findByContractIdAndVersionNumber(UUID contractId, Integer versionNumber);

    Optional<CoOwnershipContractVersion> findByContractIdAndStatus(UUID contractId, ContractVersionStatus status);

    @Query("SELECT MAX(v.versionNumber) FROM CoOwnershipContractVersion v WHERE v.contract.id = :contractId")
    Integer findMaxVersionNumberByContractId(@Param("contractId") UUID contractId);
}
