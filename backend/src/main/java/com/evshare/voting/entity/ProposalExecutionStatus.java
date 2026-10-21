package com.evshare.voting.entity;

public enum ProposalExecutionStatus {
    NOT_STARTED("Chưa thực hiện"),
    IN_PROGRESS("Đang thực hiện"),
    COMPLETED("Đã hoàn tất"),
    CANCELLED("Đã hủy");

    private final String vietnameseLabel;

    ProposalExecutionStatus(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}
