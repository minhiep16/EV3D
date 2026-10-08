package com.evshare.expense.entity;

public enum ExpenseStatus {
    PENDING_VERIFICATION("Chờ xác minh"),
    APPROVED("Đã duyệt"),
    REJECTED("Từ chối"),
    CANCELLED("Đã hủy"),
    DISPUTED("Khiếu nại");

    private final String vietnameseLabel;

    ExpenseStatus(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}
