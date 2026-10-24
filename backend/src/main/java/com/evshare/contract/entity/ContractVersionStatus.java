package com.evshare.contract.entity;

public enum ContractVersionStatus {
    DRAFT("Dự thảo"),
    PENDING_ACCEPTANCE("Chờ các bên xác nhận"),
    ACTIVE("Đang có hiệu lực"),
    SUPERSEDED("Đã được thay thế"),
    CANCELLED("Đã hủy"),
    EXPIRED("Hết hạn");

    private final String vietnameseLabel;

    ContractVersionStatus(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}
