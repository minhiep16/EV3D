package com.evshare.dispute.entity;

public enum DisputePriority {
    LOW("Thấp"),
    MEDIUM("Trung bình"),
    HIGH("Cao"),
    CRITICAL("Khẩn cấp");

    private final String vietnameseLabel;

    DisputePriority(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}

