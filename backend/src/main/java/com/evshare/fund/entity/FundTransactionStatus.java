package com.evshare.fund.entity;

public enum FundTransactionStatus {
    CONFIRMED("Đã xác nhận"),
    PENDING("Đang xử lý"),
    CANCELLED("Đã hủy");

    private final String vietnameseLabel;

    FundTransactionStatus(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}
