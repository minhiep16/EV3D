package com.evshare.ownership.entity;

public enum InvitationStatus {
    INVITED("Đã gửi lời mời"),
    ACCEPTED("Đã chấp nhận lời mời"),
    PENDING_GROUP_APPROVAL("Chờ nhóm thông qua"),
    CONTRACT_ACCEPTANCE("Chờ ký kết hợp đồng"),
    ACTIVE("Đã gia nhập nhóm"),
    REJECTED("Bị từ chối"),
    CANCELLED("Đã hủy"),
    EXPIRED("Đã hết hạn");

    private final String vietnameseLabel;

    InvitationStatus(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}
