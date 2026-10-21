package com.evshare.fund.entity;

public enum FundTransactionType {
    CONTRIBUTION("Đóng góp quỹ"),
    EXPENSE_DISBURSEMENT("Chi trả chi phí chung"),
    REFUND("Hoàn trả"),
    ADJUSTMENT("Điều chỉnh đối soát");

    private final String vietnameseLabel;

    FundTransactionType(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}
