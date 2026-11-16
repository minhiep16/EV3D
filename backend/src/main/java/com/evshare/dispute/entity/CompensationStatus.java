package com.evshare.dispute.entity;

public enum CompensationStatus {
    APPROVED("Đã phê duyệt nghĩa vụ bồi thường"),
    AWAITING_PAYMENT("Chờ thực hiện thanh toán"),
    PENDING_VERIFICATION("Chờ nhân viên xác minh"),
    PENDING_RECIPIENT_CONFIRMATION("Chờ bên nhận xác nhận (DEMO)"),
    DEMO_AWAITING_RECIPIENT("Chờ bên nhận xác nhận (DEMO)"),
    DEMO_CONFIRMED("Đã xác nhận bồi thường (DEMO)"),
    DEMO_DISPUTED("Bên nhận báo chưa nhận (DEMO)"),
    PARTIALLY_PAID("Đã thanh toán một phần"),
    PAID("Đã hoàn tất thanh toán"),
    CANCELLED("Đã hủy bỏ");

    private final String vietnameseLabel;

    CompensationStatus(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}
