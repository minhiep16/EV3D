package com.evshare.onboarding.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ReviewVehicleRegistrationRequest(
        @NotBlank(message = "Vui lòng chọn quyết định xét duyệt (APPROVE, REJECT, REQUEST_CHANGES)")
        String decision,

        String reason
) {}

