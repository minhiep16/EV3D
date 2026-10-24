package com.evshare.voting.entity;

public enum VoteProposalType {
    MAINTENANCE("Bảo dưỡng"),
    REPAIR("Sửa chữa"),
    ACCESSORY("Mua phụ kiện"),
    UPGRADE("Nâng cấp xe"),
    OTHER_COMMON_EXPENSE("Chi phí chung khác"),
    OWNERSHIP_TRANSFER("Chuyển nhượng quyền sở hữu"),
    MEMBER_ADMISSION("Kết nạp thành viên mới"),
    MEMBER_WITHDRAWAL("Rút khỏi nhóm đồng sở hữu");

    private final String vietnameseLabel;

    VoteProposalType(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}
