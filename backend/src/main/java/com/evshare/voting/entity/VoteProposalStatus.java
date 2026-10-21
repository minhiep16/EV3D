package com.evshare.voting.entity;

public enum VoteProposalStatus {
    DRAFT("Bản nháp"),
    OPEN("Đang biểu quyết"),
    APPROVED("Đã phê duyệt"),
    REJECTED("Đã từ chối"),
    EXPIRED("Đã hết hạn"),
    CANCELLED("Đã hủy");

    private final String vietnameseLabel;

    VoteProposalStatus(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}
