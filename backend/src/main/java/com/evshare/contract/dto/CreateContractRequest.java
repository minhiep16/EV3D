package com.evshare.contract.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateContractRequest(
        @NotNull(message = "Mã nhóm không được để trống")
        UUID groupId,

        @NotNull(message = "Mã phương tiện không được để trống")
        UUID vehicleId,

        @NotBlank(message = "Mã hợp đồng không được để trống")
        String contractCode
) {
}
