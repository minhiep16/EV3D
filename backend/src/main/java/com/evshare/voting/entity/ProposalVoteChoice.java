package com.evshare.voting.entity;

public enum ProposalVoteChoice {
    APPROVE("Đồng ý"),
    REJECT("Không đồng ý"),
    ABSTAIN("Phiếu trắng");

    private final String vietnameseLabel;

    ProposalVoteChoice(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}
