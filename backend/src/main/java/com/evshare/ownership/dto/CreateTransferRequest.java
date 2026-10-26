package com.evshare.ownership.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
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

        Boolean acknowledgedTerms,

        String previewId
) {
    @JsonCreator
    public CreateTransferRequest(
            @JsonProperty("toUserId") UUID toUserId,
            @JsonProperty("transferPercentage") BigDecimal transferPercentage,
            @JsonProperty("reason") String reason,
            @JsonProperty("contentHash") String contentHash,
            @JsonProperty("acknowledgedTerms") Boolean acknowledgedTerms,
            @JsonProperty("previewId") String previewId
    ) {
        this.toUserId = toUserId;
        this.transferPercentage = transferPercentage;
        this.reason = reason;
        this.contentHash = contentHash;
        this.acknowledgedTerms = acknowledgedTerms;
        this.previewId = previewId;
    }

    public CreateTransferRequest(UUID toUserId, BigDecimal transferPercentage, String reason, String contentHash, Boolean acknowledgedTerms) {
        this(toUserId, transferPercentage, reason, contentHash, acknowledgedTerms, null);
    }
}
