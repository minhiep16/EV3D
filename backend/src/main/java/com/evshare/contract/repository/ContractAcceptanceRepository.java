package com.evshare.contract.repository;

import com.evshare.contract.entity.ContractAcceptance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContractAcceptanceRepository extends JpaRepository<ContractAcceptance, UUID> {

    List<ContractAcceptance> findByContractVersionId(UUID contractVersionId);

    Optional<ContractAcceptance> findByContractVersionIdAndUserId(UUID contractVersionId, UUID userId);

    boolean existsByContractVersionIdAndUserId(UUID contractVersionId, UUID userId);

    long countByContractVersionId(UUID contractVersionId);
}
