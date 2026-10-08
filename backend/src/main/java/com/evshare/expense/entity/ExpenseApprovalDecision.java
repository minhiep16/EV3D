package com.evshare.expense.entity;

public enum ExpenseApprovalDecision {
    APPROVE("Xác nhận"),
    REJECT("Từ chối");

    private final String vietnameseLabel;

    ExpenseApprovalDecision(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}
