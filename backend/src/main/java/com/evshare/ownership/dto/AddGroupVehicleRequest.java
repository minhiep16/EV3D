package com.evshare.ownership.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AddGroupVehicleRequest(
        @NotNull(message = "Vehicle ID không được để trống")
        UUID vehicleId
) {}
