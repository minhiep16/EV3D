package com.evshare.ownership.entity;

public enum TransferStatus {
    DRAFT("Dự thảo"),
    PENDING_ACCEPTANCE("CHỜ NGƯỜI NHẬN XÁC NHẬN"),
    PENDING_APPROVAL("CHỜ CÁC BÊN PHÊ DUYỆT"),
    APPROVED("ĐỦ ĐIỀU KIỆN KÍCH HOẠT"),
    PENDING_CONTRACT("CHỜ XÁC NHẬN HỢP ĐỒNG"),
    COMPLETED("ĐÃ HOÀN TẤT CHUYỂN NHƯỢNG"),
    REJECTED("BỊ TỪ CHỐI"),
    CANCELLED("ĐÃ HỦY");

    private final String vietnameseLabel;

    TransferStatus(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }
}
