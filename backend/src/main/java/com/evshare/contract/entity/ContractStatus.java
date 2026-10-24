package com.evshare.contract.entity;

public enum ContractStatus {
    DRAFT("Dự thảo"),
    PENDING_ACCEPTANCE("Chờ ký chấp thuận"),
    ACTIVE("Đang có hiệu lực"),
    SUPERSEDED("Đã thay thế bằng phiên bản mới"),
    CANCELLED("Đã hủy bỏ"),
    EXPIRED("Hết hiệu lực");

    private final String vietnameseLabel;

    ContractStatus(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}
