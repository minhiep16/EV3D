package com.evshare.onboarding.dto;

import java.util.UUID;

public record OnboardingUserSearchResponse(
        UUID id,
        String fullName,
        String email,
        String maskedEmail
) {
    public static OnboardingUserSearchResponse from(UUID id, String fullName, String email) {
        return new OnboardingUserSearchResponse(id, fullName, email, maskEmail(email));
    }

    private static String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return email != null ? email : "";
        }
        String[] parts = email.split("@", 2);
        String name = parts[0];
        String domain = parts[1];
        if (name.length() <= 2) {
            return name.charAt(0) + "*@" + domain;
        }
        return name.charAt(0) + "*".repeat(name.length() - 2) + name.charAt(name.length() - 1) + "@" + domain;
    }
}

