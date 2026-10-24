package com.evshare.ownership.entity;

public enum WithdrawalStatus {
    PENDING("Chờ duyệt rút nhóm"),
    APPROVED("Đã chấp thuận"),
    REJECTED("Bị từ chối"),
    CANCELLED("Đã hủy");

    private final String vietnameseLabel;

    WithdrawalStatus(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}
