package com.evshare.dispute.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum InvestigationConclusion {
    LATE_RETURN_BY_PREVIOUS_USER("Tài xế trước trả xe trễ so với lịch"),
    LATE_STAFF_PROCESSING("Nhân viên xử lý kiểm tra và tiếp nhận xe chậm"),
    SYSTEM_SYNC_DELAY("Độ trễ đồng bộ hóa dữ liệu hệ thống / IoT"),
    OPERATIONAL_PROBLEM("Sự cố vận hành trạm / sự cố kỹ thuật phương tiện"),
    INSUFFICIENT_EVIDENCE("Chưa đủ bằng chứng để xác định nguyên nhân"),
    UNVERIFIED("Chưa thể kết luận / Cần xác minh bổ sung");

    private final String vietnameseLabel;

    InvestigationConclusion(String vietnameseLabel) {
        this.vietnameseLabel = vietnameseLabel;
    }

    public String getVietnameseLabel() {
        return vietnameseLabel;
    }

    @JsonValue
    public String toJson() {
        return name();
    }

    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public static InvestigationConclusion fromValue(Object raw) {
        if (raw == null) {
            return null;
        }
        String value = String.valueOf(raw).trim();
        if (value.isBlank()) {
            return null;
        }
        String normalized = value.toUpperCase().replace("-", "_").replace(" ", "_");
        for (InvestigationConclusion c : values()) {
            if (c.name().equalsIgnoreCase(normalized)) {
                return c;
            }
        }
        if (normalized.contains("PREVIOUS_USER") || normalized.contains("LATE_RETURN") || normalized.contains("USER_FAULT")) {
            return LATE_RETURN_BY_PREVIOUS_USER;
        }
        if (normalized.contains("STAFF") || normalized.contains("OPERATOR")) {
            return LATE_STAFF_PROCESSING;
        }
        if (normalized.contains("SYNC") || normalized.contains("SYSTEM") || normalized.contains("IOT")) {
            return SYSTEM_SYNC_DELAY;
        }
        if (normalized.contains("OPERATION") || normalized.contains("TECH") || normalized.contains("VEHICLE")) {
            return OPERATIONAL_PROBLEM;
        }
        if (normalized.contains("INSUFFICIENT") || normalized.contains("EVIDENCE")) {
            return INSUFFICIENT_EVIDENCE;
        }
        if (normalized.contains("UNVERIFIED")) {
            return UNVERIFIED;
        }
        return null;
    }
}
