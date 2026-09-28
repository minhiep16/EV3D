package com.evshare.vehicle.entity;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Authoritative Canonical Vehicle Part Codes.
 * Synchronized with frontend VehiclePartId (1:1 contract).
 */
public enum VehiclePartCode {
    BODY,
    DOOR_FL,
    DOOR_FR,
    DOOR_RL,
    DOOR_RR,
    HOOD,
    WINDSHIELD,
    ROOF,
    WHEEL_FL,
    WHEEL_FR,
    WHEEL_RL,
    WHEEL_RR,
    HEADLIGHTS,
    TAILLIGHTS,
    BATTERY,
    CHARGING_PORT,
    DIFFUSER;

    public static final Set<String> VALID_CODES = Arrays.stream(values())
            .map(Enum::name)
            .collect(Collectors.toUnmodifiableSet());

    public static boolean isValid(String code) {
        if (code == null) return false;
        return VALID_CODES.contains(code.trim().toUpperCase());
    }
}
