package com.evshare.fund.entity;

public enum FinancialMode {
    DEMO("CHẾ ĐỘ TÀI CHÍNH DEMO"),
    REAL("CHẾ ĐỘ TÀI CHÍNH THỰC TẾ");

    private final String vietnameseLabel;

    FinancialMode(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}
