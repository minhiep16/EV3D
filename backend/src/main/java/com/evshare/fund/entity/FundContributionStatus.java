package com.evshare.fund.entity;

public enum FundContributionStatus {
    PENDING("Chờ xác nhận"),
    CONFIRMED("Đã xác nhận"),
    REJECTED("Từ chối"),
    CANCELLED("Đã hủy");

    private final String vietnameseLabel;

    FundContributionStatus(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}
