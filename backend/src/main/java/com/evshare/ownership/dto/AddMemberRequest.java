package com.evshare.ownership.dto;

import com.evshare.ownership.entity.GroupMemberRole;
import com.evshare.ownership.entity.MemberStatus;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AddMemberRequest(
        @NotNull(message = "User ID không được để trống")
        UUID userId,

        GroupMemberRole memberRole,
        MemberStatus status
) {}
