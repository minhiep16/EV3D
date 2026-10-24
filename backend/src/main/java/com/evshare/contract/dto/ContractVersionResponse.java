package com.evshare.contract.dto;

import com.evshare.contract.entity.ContractVersionStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ContractVersionResponse(
        UUID id,
        UUID contractId,
        String contractCode,
        Integer versionNumber,
        String versionNumberFormatted,
        String title,
        String contentSnapshot,
        String contentHash,
        String ownershipSnapshot,
        String votingRuleSnapshot,
        String financialRuleSnapshot,
        Instant effectiveFrom,
        Instant effectiveUntil,
        ContractVersionStatus status,
        String statusLabel,
        String createdByName,
        Instant createdAt,
        Instant activatedAt,
        List<ContractAcceptanceResponse> acceptances,
        boolean allMembersAccepted,
        String consentPolicy,
        String consentPolicyLabel,
        int requiredAcceptanceCount,
        int currentAcceptanceCount,
        String additionalApprovalStatus,
        List<ContractSignatoryResponse> signatories
) {
    public ContractVersionResponse(
            UUID id,
            UUID contractId,
            String contractCode,
            Integer versionNumber,
            String versionNumberFormatted,
            String title,
            String contentSnapshot,
            String contentHash,
            String ownershipSnapshot,
            String votingRuleSnapshot,
            String financialRuleSnapshot,
            Instant effectiveFrom,
            Instant effectiveUntil,
            ContractVersionStatus status,
            String statusLabel,
            String createdByName,
            Instant createdAt,
            Instant activatedAt,
            List<ContractAcceptanceResponse> acceptances,
            boolean allMembersAccepted
    ) {
        this(
                id, contractId, contractCode, versionNumber, versionNumberFormatted, title,
                contentSnapshot, contentHash, ownershipSnapshot, votingRuleSnapshot,
                financialRuleSnapshot, effectiveFrom, effectiveUntil, status, statusLabel,
                createdByName, createdAt, activatedAt, acceptances, allMembersAccepted,
                versionNumber != null && versionNumber == 1 ? "INITIAL_CONTRACT" : "GENERAL_AMENDMENT",
                versionNumber != null && versionNumber == 1 ? "Yêu cầu 100% chấp thuận" : "Yêu cầu biểu quyết và chấp thuận theo quy chế",
                acceptances != null ? acceptances.size() : 0,
                acceptances != null ? acceptances.size() : 0,
                "Không yêu cầu", List.of()
        );
    }
}

