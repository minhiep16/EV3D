package com.evshare.dispute.entity;

public enum DisputeCategory {
    BOOKING("Lịch đặt xe"),
    VEHICLE_USAGE("Sử dụng xe / Quãng đường"),
    HANDOVER("Giao nhận xe"),
    RETURN("Trả xe"),
    VEHICLE_DAMAGE("Hư hỏng phương tiện"),
    INSPECTION_RESULT("Kết quả kiểm định"),
    MAINTENANCE("Bảo dưỡng / Sửa chữa"),
    EXPENSE_ALLOCATION("Phân bổ chi phí"),
    PAYMENT("Thanh toán nghĩa vụ"),
    OWNERSHIP("Quyền sở hữu"),
    OWNERSHIP_TRANSFER("Chuyển nhượng cổ phần"),
    VOTING("Biểu quyết / Đề xuất"),
    CONTRACT("Hợp đồng đồng sở hữu"),
    OTHER("Khác");

    private final String vietnameseLabel;

    DisputeCategory(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}

