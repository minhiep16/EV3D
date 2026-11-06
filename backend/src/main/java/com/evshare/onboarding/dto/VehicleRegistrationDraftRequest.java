package com.evshare.onboarding.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

@JsonIgnoreProperties(ignoreUnknown = true)
public record VehicleRegistrationDraftRequest(
        @JsonAlias({"name", "vehicleName"})
        @Size(max = 100, message = "Tên xe tối đa 100 ký tự")
        String vehicleName,

        String manufacturer,
        String model,
        @JsonAlias({"manufactureYear", "modelYear"})
        Integer modelYear,
        @JsonAlias({"plateNumber", "licensePlate"})
        String licensePlate,
        String vin,
        @JsonAlias({"batteryCapacityKwh", "batteryCapacity"})
        BigDecimal batteryCapacity,
        String batteryType,
        @JsonAlias({"color", "vehicleColor"})
        String exteriorColor,
        String groupName,
        String votingRule,
        BigDecimal quorumPercentage,
        BigDecimal approvalThresholdPercentage,
        String proposedCoOwners
) {
    public String getResolvedVehicleName() {
        if (vehicleName != null && !vehicleName.isBlank()) return vehicleName;
        if (model != null && !model.isBlank()) return model;
        return "Xe điện mới";
    }
}
