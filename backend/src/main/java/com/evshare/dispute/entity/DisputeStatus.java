package com.evshare.dispute.entity;

public enum DisputeStatus {
    SUBMITTED("Đã gửi khiếu nại"),
    UNDER_REVIEW("Nhân viên đang tiếp nhận"),
    AWAITING_EVIDENCE("Chờ bổ sung bằng chứng"),
    MEDIATION("Đang hòa giải"),
    PROPOSED_RESOLUTION("Đã đề xuất phương án"),
    VOTING_IN_PROGRESS("Đang biểu quyết nhóm"),
    RESOLVED("Đã đồng thuận hòa giải"),
    CLOSED("Đã đóng tranh chấp"),
    REOPENED("Đã mở lại tranh chấp"),
    REJECTED("Bị từ chối khiếu nại");

    private final String vietnameseLabel;

    DisputeStatus(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}

