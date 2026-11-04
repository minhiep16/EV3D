package com.evshare.onboarding.dto;

import com.evshare.onboarding.entity.DraftStatus;
import com.evshare.onboarding.entity.VehicleRegistrationDraft;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record VehicleRegistrationDraftResponse(
        UUID id,
        UUID userId,
        String vehicleName,
        String manufacturer,
        String model,
        Integer modelYear,
        String licensePlate,
        String vin,
        BigDecimal batteryCapacity,
        String batteryType,
        String groupName,
        String votingRule,
        BigDecimal quorumPercentage,
        BigDecimal approvalThresholdPercentage,
        String proposedCoOwners,
        DraftStatus status,
        Instant createdAt,
        Instant updatedAt
) {
    public static VehicleRegistrationDraftResponse fromEntity(VehicleRegistrationDraft draft) {
        if (draft == null) return null;
        return new VehicleRegistrationDraftResponse(
                draft.getId(),
                draft.getUserId(),
                draft.getVehicleName(),
                draft.getManufacturer(),
                draft.getModel(),
                draft.getModelYear(),
                draft.getLicensePlate(),
                draft.getVin(),
                draft.getBatteryCapacity(),
                draft.getBatteryType(),
                draft.getGroupName(),
                draft.getVotingRule(),
                draft.getQuorumPercentage(),
                draft.getApprovalThresholdPercentage(),
                draft.getProposedCoOwners(),
                draft.getStatus(),
                draft.getCreatedAt(),
                draft.getUpdatedAt()
        );
    }
}

