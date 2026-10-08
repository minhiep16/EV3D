package com.evshare.expense.entity;

public enum ExpenseAllocationPolicy {
    USER_RESPONSIBILITY("Theo người sử dụng"),
    USAGE_AND_CAPITAL("Theo km sử dụng và tỷ lệ vốn"),
    OWNERSHIP_RATIO("Theo tỷ lệ sở hữu"),
    CUSTOM_AGREEMENT("Theo thỏa thuận riêng");

    private final String vietnameseLabel;

    ExpenseAllocationPolicy(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}
