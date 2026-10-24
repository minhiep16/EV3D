package com.evshare.ownership.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateTransferRequest(
        @NotNull(message = "Vui lòng chọn người nhận chuyển nhượng")
        UUID toUserId,

        @NotNull(message = "Vui lòng nhập tỷ lệ sở hữu chuyển nhượng")
        @DecimalMin(value = "0.01", message = "Tỷ lệ chuyển nhượng phải lớn hơn 0%")
        BigDecimal transferPercentage,

        String reason,

        String contentHash,

        Boolean acknowledgedTerms
) {
}
