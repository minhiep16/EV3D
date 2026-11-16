package com.evshare.dispute.dto;

import jakarta.validation.constraints.NotBlank;

public record AddEvidenceRequest(
        String title,
        @NotBlank(message = "Đường dẫn tệp bằng chứng không được để trống")
        String fileUrl,
        String fileType,
        Long fileSizeBytes,
        String integrityHash
) {}

