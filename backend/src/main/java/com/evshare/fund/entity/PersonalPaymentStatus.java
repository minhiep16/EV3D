package com.evshare.fund.entity;

public enum PersonalPaymentStatus {
    PAYMENT_PENDING("Chờ thanh toán"),
    PAYMENT_SUBMITTED("Đã gửi xác nhận"),
    PAYMENT_VERIFIED("Đã xác minh"),
    PAYMENT_REJECTED("Bị từ chối");

    private final String vietnameseLabel;

    PersonalPaymentStatus(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}
