package com.evshare.dispute.entity;

public enum DisputeMessageVisibility {
    PUBLIC("Công khai cho các bên"),
    STAFF_ONLY("Nội bộ nhân viên");

    private final String vietnameseLabel;

    DisputeMessageVisibility(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}

