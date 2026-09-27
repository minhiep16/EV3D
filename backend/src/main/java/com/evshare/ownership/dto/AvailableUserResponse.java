package com.evshare.ownership.dto;

import java.util.UUID;

public record AvailableUserResponse(
        UUID id,
        String displayName,
        String email
) {}
