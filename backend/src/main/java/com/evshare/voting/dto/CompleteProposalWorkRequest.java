package com.evshare.voting.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CompleteProposalWorkRequest(
        @NotNull(message = "Chi phí thực tế là bắt buộc.")
        @DecimalMin(value = "1000.00", message = "Chi phí thực tế tối thiểu là 1.000 VNĐ.")
        BigDecimal actualCost,

        @Size(max = 1000, message = "Ghi chú kết quả hoàn tất tối đa 1000 ký tự.")
        String completionNote,

        @Size(max = 500, message = "Đường dẫn chứng từ/hóa đơn tối đa 500 ký tự.")
        String evidenceUrl
) {}
