package com.evshare.dispute.entity;

public enum DisputeParticipantRole {
    COMPLAINANT("Người khiếu nại"),
    RESPONDENT("Người bị khiếu nại"),
    AFFECTED_CO_OWNER("Đồng sở hữu liên quan"),
    STAFF_MEDIATOR("Nhân viên hòa giải");

    private final String vietnameseLabel;

    DisputeParticipantRole(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}

