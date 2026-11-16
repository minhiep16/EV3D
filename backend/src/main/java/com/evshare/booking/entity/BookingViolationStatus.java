package com.evshare.booking.entity;

public enum BookingViolationStatus {
    RECORDED("Đã ghi nhận vi phạm"),
    RECOVERY_PENDING("Chờ nhân viên thu hồi phương tiện"),
    RESOLVED("Đã giải quyết / Đã thu hồi xe"),
    EXCUSED("Được miễn trừ do sự cố khách quan");

    private final String vietnameseLabel;

    BookingViolationStatus(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}
