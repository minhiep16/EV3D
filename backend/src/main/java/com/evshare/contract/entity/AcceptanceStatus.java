package com.evshare.contract.entity;

public enum AcceptanceStatus {
    PENDING("Chờ xác nhận"),
    ACCEPTED("Đã xác nhận điện tử"),
    REJECTED("Từ chối xác nhận");

    private final String vietnameseLabel;

    AcceptanceStatus(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}
