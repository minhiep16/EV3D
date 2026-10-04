package com.evshare.expense.entity;

public enum ExpenseCategory {
    CHARGING("Sạc xe"),
    MAINTENANCE("Bảo dưỡng"),
    CLEANING("Vệ sinh xe"),
    PARKING("Đỗ xe"),
    TOLL("Phí đường bộ"),
    REPAIR("Sửa chữa"),
    INSURANCE("Bảo hiểm"),
    OTHER("Khác");

    private final String vietnameseLabel;

    ExpenseCategory(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}
