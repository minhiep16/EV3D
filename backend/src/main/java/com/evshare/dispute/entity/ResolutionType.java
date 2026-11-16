package com.evshare.dispute.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ResolutionType {
    NO_COMPENSATION("Không bồi thường tiền tệ / Hòa giải trách nhiệm"),
    FULL_COMPENSATION("Bồi thường toàn bộ số tiền yêu cầu"),
    PARTIAL_COMPENSATION("Bồi thường một phần thỏa thuận hòa giải"),
    OPERATIONAL_REMEDY("Biện pháp khắc phục vận hành / Đổi lịch ưu tiên"),
    ADDITIONAL_INVESTIGATION("Yêu cầu tiếp tục điều tra bổ sung"),
    ESCALATION("Chuyển tiếp lên cấp thẩm quyền cao hơn");

    private final String vietnameseLabel;

    ResolutionType(String vietnameseLabel) {
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
    public static ResolutionType fromValue(Object raw) {
        if (raw == null) {
            return OPERATIONAL_REMEDY;
        }
        String value = String.valueOf(raw).trim();
        if (value.isBlank()) {
            return OPERATIONAL_REMEDY;
        }
        String normalized = value.toUpperCase().replace("-", "_").replace(" ", "_");
        for (ResolutionType t : values()) {
            if (t.name().equalsIgnoreCase(normalized)) {
                return t;
            }
        }
        if (normalized.contains("NO") || normalized.contains("ZERO")) {
            return NO_COMPENSATION;
        }
        if (normalized.contains("FULL")) {
            return FULL_COMPENSATION;
        }
        if (normalized.contains("PARTIAL")) {
            return PARTIAL_COMPENSATION;
        }
        if (normalized.contains("ESCALAT")) {
            return ESCALATION;
        }
        if (normalized.contains("INVESTIGAT")) {
            return ADDITIONAL_INVESTIGATION;
        }
        return OPERATIONAL_REMEDY;
    }
}
