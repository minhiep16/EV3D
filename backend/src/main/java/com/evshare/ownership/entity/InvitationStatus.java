package com.evshare.ownership.entity;

public enum InvitationStatus {
    PENDING_CONTRIBUTOR_CONSENT("Chờ đồng sở hữu xác nhận đóng góp"),
    PENDING_INVITEE_RESPONSE("Chờ người được mời phản hồi"),
    ACCEPTED("Đã chấp nhận lời mời"),
    PENDING_CONTRACT_SIGNATURE("Chờ ký kết hợp đồng"),
    READY_FOR_COMPLETION("Đủ điều kiện hoàn tất"),
    COMPLETED("Đã hoàn tất gia nhập"),
    REJECTED("Bị từ chối"),
    CANCELLED("Đã hủy"),
    EXPIRED("Đã hết hạn"),

    // Backward-compatibility aliases
    INVITED("Đã gửi lời mời"),
    PENDING_GROUP_APPROVAL("Chờ nhóm thông qua"),
    CONTRACT_ACCEPTANCE("Chờ ký kết hợp đồng"),
    ACTIVE("Đã gia nhập nhóm");

    private final String vietnameseLabel;

    InvitationStatus(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}
