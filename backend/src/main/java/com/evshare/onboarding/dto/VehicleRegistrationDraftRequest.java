package com.evshare.onboarding.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record VehicleRegistrationDraftRequest(
        @NotBlank(message = "Tên xe không được để trống")
        @Size(max = 100, message = "Tên xe tối đa 100 ký tự")
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
        String proposedCoOwners
) {}

