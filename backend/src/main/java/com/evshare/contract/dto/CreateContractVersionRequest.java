package com.evshare.contract.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record CreateContractVersionRequest(
        @NotBlank(message = "Tiêu đề hợp đồng không được để trống")
        String title,

        @NotBlank(message = "Nội dung hợp đồng không được để trống")
        String contentSnapshot,

        String votingRule,

        BigDecimal quorumPercentage,

        BigDecimal approvalThresholdPercentage
) {
}
