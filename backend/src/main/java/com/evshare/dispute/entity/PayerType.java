package com.evshare.dispute.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum PayerType {
    PREVIOUS_CO_OWNER("Thành viên sử dụng trước"),
    OPERATIONAL_ENTITY("Đơn vị vận hành EVShare"),
    OTHER("Bên thứ ba chịu trách nhiệm");

    private final String vietnameseLabel;

    PayerType(String vietnameseLabel) {
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
    public static PayerType fromValue(Object raw) {
        if (raw == null) {
            return OTHER;
        }
        String value = String.valueOf(raw).trim();
        if (value.isBlank()) {
            return OTHER;
        }
        String normalized = value.toUpperCase().replace("-", "_").replace(" ", "_");
        for (PayerType p : values()) {
            if (p.name().equalsIgnoreCase(normalized)) {
                return p;
            }
        }
        if (normalized.contains("PREVIOUS") || normalized.contains("CO_OWNER") || normalized.contains("USER")) {
            return PREVIOUS_CO_OWNER;
        }
        if (normalized.contains("OPERAT") || normalized.contains("ENTITY") || normalized.contains("STATION")) {
            return OPERATIONAL_ENTITY;
        }
        return OTHER;
    }
}
