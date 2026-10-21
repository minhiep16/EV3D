package com.evshare.fund.entity;

public enum FundTransactionDirection {
    INFLOW("Thu vào"),
    OUTFLOW("Chi ra");

    private final String vietnameseLabel;

    FundTransactionDirection(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}
