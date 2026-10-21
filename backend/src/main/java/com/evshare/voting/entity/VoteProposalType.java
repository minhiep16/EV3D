package com.evshare.voting.entity;

public enum VoteProposalType {
    MAINTENANCE("Bảo dưỡng"),
    REPAIR("Sửa chữa"),
    ACCESSORY("Mua phụ kiện"),
    UPGRADE("Nâng cấp xe"),
    OTHER_COMMON_EXPENSE("Chi phí chung khác");

    private final String vietnameseLabel;

    VoteProposalType(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}
