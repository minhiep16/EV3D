package com.evshare.contract.dto;

import com.evshare.contract.entity.ContractStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ContractSummaryResponse(
        UUID id,
        UUID groupId,
        String groupName,
        UUID vehicleId,
        String vehicleName,
        String contractCode,
        UUID currentVersionId,
        Integer currentVersionNumber,
        String currentVersionFormatted,
        ContractStatus status,
        String statusLabel,
        Instant effectiveFrom,
        int totalMembers,
        int acceptedMembers,
        boolean isCurrentUserAccepted,
        boolean canAccept,
        boolean canActivate,
        Instant createdAt,
        Instant updatedAt,
        String consentPolicy,
        String consentPolicyLabel,
        int requiredAcceptanceCount,
        int currentAcceptanceCount,
        String additionalApprovalStatus,
        List<ContractSignatoryResponse> signatories
) {
    public ContractSummaryResponse(
            UUID id,
            UUID groupId,
            String groupName,
            UUID vehicleId,
            String vehicleName,
            String contractCode,
            UUID currentVersionId,
            Integer currentVersionNumber,
            String currentVersionFormatted,
            ContractStatus status,
            String statusLabel,
            Instant effectiveFrom,
            int totalMembers,
            int acceptedMembers,
            boolean isCurrentUserAccepted,
            boolean canAccept,
            boolean canActivate,
            Instant createdAt,
            Instant updatedAt
    ) {
        this(
                id, groupId, groupName, vehicleId, vehicleName, contractCode,
                currentVersionId, currentVersionNumber, currentVersionFormatted,
                status, statusLabel, effectiveFrom, totalMembers, acceptedMembers,
                isCurrentUserAccepted, canAccept, canActivate, createdAt, updatedAt,
                "INITIAL_CONTRACT", "Yêu cầu 100% chấp thuận",
                totalMembers, acceptedMembers, "Không yêu cầu", List.of()
        );
    }
}

