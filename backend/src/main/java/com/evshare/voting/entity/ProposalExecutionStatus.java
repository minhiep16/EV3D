package com.evshare.voting.entity;

public enum ProposalExecutionStatus {
    NOT_STARTED("Chưa thực hiện"),
    PENDING_STAFF("Chờ tiếp nhận"),
    ACCEPTED("Đã tiếp nhận"),
    IN_PROGRESS("Đang thực hiện"),
    COMPLETED("Đã hoàn thành"),
    CANCELLED("Đã hủy");

    private final String vietnameseLabel;

    ProposalExecutionStatus(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}
