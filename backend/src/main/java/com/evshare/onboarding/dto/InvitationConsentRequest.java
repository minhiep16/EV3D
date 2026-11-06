package com.evshare.onboarding.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record InvitationConsentRequest(
        @NotNull(message = "Thiếu định danh phiên bản hợp đồng")
        UUID contractVersionId,

        @NotBlank(message = "Thiếu mã băm nội dung hợp đồng")
        String contentHash,

        @NotBlank(message = "Vui lòng nhập họ tên xác nhận ký điện tử")
        String signerFullName,

        boolean confirmReadAndAgreed
) {}

