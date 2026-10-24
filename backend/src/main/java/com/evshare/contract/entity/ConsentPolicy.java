package com.evshare.contract.entity;

public enum ConsentPolicy {
    INITIAL_CONTRACT("Hợp đồng khởi tạo", "Yêu cầu 100% thành viên"),
    GENERAL_AMENDMENT("Sửa đổi quy chế chung", "Yêu cầu biểu quyết và chấp thuận theo quy chế"),
    INTERNAL_OWNERSHIP_TRANSFER("Chuyển nhượng nội bộ", "Yêu cầu xác nhận của hai bên"),
    EXTERNAL_OWNERSHIP_TRANSFER("Chuyển nhượng bên ngoài", "Yêu cầu biểu quyết và chấp thuận toàn thể");

    private final String title;
    private final String description;

    ConsentPolicy(String title, String description) {
        this.title = title;
        this.description = description;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }
}
