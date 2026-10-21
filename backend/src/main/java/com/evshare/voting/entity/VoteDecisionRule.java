package com.evshare.voting.entity;

public enum VoteDecisionRule {
    OWNERSHIP_WEIGHTED("Theo tỷ lệ sở hữu"),
    ONE_MEMBER_ONE_VOTE("Mỗi thành viên một phiếu");

    private final String vietnameseLabel;

    VoteDecisionRule(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}
