package com.evshare.ownership.dto;

import com.evshare.ownership.entity.MemberStatus;

import java.time.Instant;
import java.util.UUID;

public record GroupMemberResponse(
        UUID id,
        UUID userId,
        String fullName,
        String email,
        String role,
        MemberStatus status,
        Instant joinedAt,
        OwnershipShareResponse share
) {}
