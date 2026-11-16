package com.evshare.booking.entity;

public enum BookingViolationType {
    NO_SHOW_UNCLAIMED("Không nhận bàn giao xe đúng hạn"),
    NO_SHOW_CUSTODY_RETAINED("Đã nhận bàn giao nhưng không khởi hành (Cần thu hồi xe)"),
    OVERDUE_DEPARTURE("Khởi hành quá hạn"),
    OVERDUE_RETURN("Trả xe quá hạn quy định");

    private final String vietnameseLabel;

    BookingViolationType(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}
